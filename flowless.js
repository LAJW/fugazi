/******************************************************************************/
/**
 * @file :flowless.js
 * @module flowless
 * @desc Functional asynchronous library
 * @author Lukasz A.J. Wrona (layv.net)
 * @license MIT
 */
/******************************************************************************/

"use strict"
const R = require("ramda")

/******************************************************************************/

const id = x => x

const isPromise = x => x && x instanceof Promise
const isFunction = x => x && x instanceof Function

// Convert to promise and resolve if needed
const callThen = func => function () {
  const args = arguments
  return R.any(isPromise, args)
  ? Promise.all(args).then(args => func(...args))
  : func(...args)
}

const param = key => base => base ? base[key] : undefined

const each = {
  map : (cb, map) => {
    for (const pair of map) {
      cb(pair[1], pair[0], map)
    }
  },
  iterable : (cb, set) => {
    let i = 0
    for (const value of set) {
      cb(value, i, set)
      i += 1
    }
  },
  enumerable : (cb, enumerable) => {
    for (const key in enumerable) {
      cb(enumerable[key], key, enumerable)
    }
  }
}

each.set = each.iterable

const deref = (alg, target, args) => {
  if (target instanceof Set) {
    return alg.set(...args)
  } else if (target instanceof Map) {
    return alg.map(...args)
  } else if (target[Symbol.iterator]) {
    return alg.iterable(...args)
  } else {
    return alg.enumerable(...args)
  }
}

const createFilter = (each, createResult, proc) => (pred, object) => {
  let result = createResult()
  let promise
  each((val, key) => {
    const condition = pred(val, key, object)
    if (isPromise(condition)) {
      if (!promise) {
        promise = condition
      } else {
        promise = promise.then(condition)
      }
      promise.then(condition => {
        if (condition) {
          proc(result, val, key)
        }
      })
    } else if (condition) {
      proc(result, val, key)
    }
  }, object)
  if (promise) {
    return promise.then(() => result)
  } else {
    return result
  }
}

const filter = {
  set : createFilter(each.set,
                     () => new Set(),
                     (result, val) => result.add(val)),

  map : createFilter(each.map,
                     () => new Map(),
                     (result, val, key) => result.set(key, val)),

  enumerable : createFilter(each.enumerable,
                            () => ({ }),
                            (result, val, key) => result[key] = val),

  iterable : (func, iterable) => {
    const result     = [ ] // results resolved immediately
    const rest       = [ ] // unresolved values
    const conditions = [ ] // asynchronous condition map for rest
    each.iterable((value, key) => {
      const condition = func(value, key, iterable)
      if (conditions.length || isPromise(condition)) {
        conditions.push(condition)
        rest.push(value)
      } else if (condition) {
        result.push(value)
      }
    }, iterable)
    if (conditions.length) {
      return Promise.all(conditions)
      .then(conditions => {
        conditions.forEach((condition, key) => {
          if (condition) {
            result.push(rest[key])
          }
        })
        return result
      })
    }
    return result
  }
}

const map = {
  enumerable : (func, enumerable) => {
    const result = { }
    const promises = [ ]
    if (typeof func === "function") {
      // regular mapping
      each.enumerable((value, key) => {
        const element = func(value, key, enumerable)
        if (isPromise(element)) {
          promises.push(element.then(value => result[key] = value))
        } else {
          result[key] = element
        }
      }, enumerable)
    } else {
      // func is object => map params
      each.enumerable((func, key) => {
        if (typeof func === "function") {
          const element = func(enumerable[key], key, enumerable)
          if (isPromise(element)) {
            promises.push(element.then(value => result[key] = value))
          } else {
            result[key] = element
          }
        } else if (isPromise(func)) {
          promises.push(func.then(value => result[key] = value))
        } else {
          result[key] = func
        }
      }, func)
    }
    if (promises.length) {
      return Promise.all(promises)
      .then(() => result)
    } else {
      return result
    }
  },

  iterable : (func, iterable) => {
    const result = [ ]
    let asynchronous = false
    each.iterable((value, key) => {
      const element = func(value, key, iterable)
      if (isPromise(element)) {
        asynchronous = true
      }
      result.push(element)
    }, iterable)
    if (asynchronous) {
      return Promise.all(result)
    } else {
      return result
    }
  },

  set : (func, iterable) => {
    const result = new Set()
    let promise
    each.iterable((value, key) => {
      const element = func(value, key, iterable)
      if (isPromise(element)) {
        if (promise) {
          promise = promise.then(element)
        } else {
          promise = element
        }
        promise.then(element => result.add(element))
      } else {
        result.add(element)
      }
    }, iterable)
    if (promise) {
      return promise.then(() => result)
    } else {
      return result
    }
  },

  map : (func, iterable) => {
    const result = new Map()
    let promise
    each.iterable(value => {
      const element = func(value[0], value[1], iterable)
      if (isPromise(element)) {
        if (promise) {
          promise = promise.then(element)
        } else {
          promise = element
        }
        promise.then(element => result.set(value[0], element))
      } else {
        result.set(element)
      }
    }, iterable)
    if (promise) {
      return promise.then(() => result)
    } else {
      return result
    }
  }
}


const reduceEnumerable = (func, prev, enumerable) => {
  each.enumerable((value, key) => {
    if (isPromise(prev)) {
      prev = prev.then(prev => func(prev, value, key, enumerable))
    } else {
      prev = func(prev, value, key, enumerable)
    }
  }, enumerable)
  return prev
}

const reduceIterable = (func, prev, iterable) => {
  each.iterable((value, key) => {
    if (isPromise(prev)) {
      prev = prev.then(prev => func(prev, value, key, iterable))
    } else {
      prev = func(prev, value, key, iterable)
    }
  }, iterable)
  return prev
}

// first promise that passes predicate will resolve
const findPromise = (func, promises) =>
  new Promise((resolve, reject) => {
    let resolvedCount = 0
    for (const promise of promises) {
      promise.then(value => {
        if (func(value)) {
          resolve(value)
        } else {
          resolvedCount++
          if (resolvedCount === promises.length) {
            resolve(undefined)
          }
        }
      })
      .catch(reject)
    }
  })

const findIterable = (func, iterable) => {
  let i = 0
  let promise
  for (const value of iterable) {
    if (promise) {
      promise = promise.then(container => {
        if (container) {
          return container
        }
        const condition = func(value, i)
        if (isPromise(condition)) {
          return condition.then(condition => {
            if (condition) {
              return { value }
            }
            i += 1
          })
        } else if (condition) {
          return { value }
        } else {
          i += 1
        }
      })
    } else {
      const condition = func(value, i)
      if (isPromise(condition)) {
        promise = condition.then(condition => {
          if (condition) {
            return { value }
          }
          i += 1
        })
      } else if (condition) {
        return value
      } else {
        i += 1
      }
    }
  }
  if (promise) {
    return promise.then(param("value"))
  }
}

// Not stable find. Promises will race to find first
const findEnumerable = (func, enumerable) => {
  const promises = [ ]
  for (const i in enumerable) {
    const value     = enumerable[i]
    const condition = func(value, i, enumerable)
    if (isPromise(condition)) {
      promises.push(condition.then(condition => condition
                                   ? { value }
                                   : undefined))
    } else if (condition) {
      return value
    }
  }
  if (promises.length) {
    return findPromise(id, promises).then(param("value"))
  }
}

const someIterable = (func, iterable) => {
  let i = 0
  let promises = [ ]
  for (const value of iterable) {
    const condition = func(value, i, iterable)
    if (isPromise(condition)) {
      promises.push(condition)
    } else if (condition) {
      return true
    } else {
      i++
    }
  }
  if (promises.length) {
    return findPromise(id, promises).then(result => !!result)
  }
  return false
}

const someEnumerable = (func, enumerable) => {
  let promises = [ ]
  for (const i in enumerable) {
    const condition = func(enumerable[i], i, enumerable)
    if (isPromise(condition)) {
      promises.push(condition)
    } else if (condition) {
      return true
    }
  }
  if (promises.length) {
    return findPromise(id, promises).then(result => !!result)
  }
  return false
}

const rangeAsc = function*(l, r) {
  for (; l <= r; l++) {
    yield l
  }
}

const rangeDesc = function*(l, r) {
  for (; l >= r; l--) {
    yield l
  }
}

const F = module.exports = callThen(function(a1) {
  if (arguments.length === 1 && isFunction(a1)) {
    return F.curry(a1)
  } else {
    return F.compose(...R.map(R.ifElse(isFunction, id, param), arguments))
  }
})

// Essentials

F.compose = function(f1) {
  const funcs = arguments;
  return function () {
    if (R.any(isPromise, arguments)) {
      funcs[0] = () => Promise.all(arguments).then(args => f1(...args))
    } else {
      funcs[0] = () => f1(...arguments)
    }
    let value
    let isError = false // is value an error
    for (let i = 0, il = funcs.length; i < il; i++) {
      const func = funcs[i]
      if (isPromise(value)) {
        if (func.catcher) {
          value = value.catch(func)
        } else {
          value = value.then(func)
        }
      } else if (!isError ^ func.catcher) {
        try {
          value = func(value)
          isError = false
        } catch (error) {
          value = error
          isError = true
        }
      }
    }
    if (isError) {
      throw value
    } else {
      return value
    }
  }
}

F.catch = func => {
  func.catcher = true
  return func
}

F.curryN = (length, func) => R.curryN(length, callThen(func))

F.curry = func => F.curryN(func.length, func)

F.range = callThen((a1, a2) => {
  if (a2 === undefined) {
    a2 = a1
    a1 = 0
  }
  if (a1 <= a2) {
    return rangeAsc(a1, a2)
  } else {
    return rangeDesc(a1, a2)
  }
})

F.args = callThen(function() {
  return Array.prototype.slice.call(arguments)
})

// Utilities

F.param = F.curry((key, base) => base ? base[key] : undefined)

F.ifElse = callThen(function () {
  const funcs = arguments
  return value => {
    let promise
    for (let i = 0, il = funcs.length - 1; i < il; i += 2) {
      const pred = funcs[i]
      const then = funcs[i + 1]
      if (promise) {
        promise = promise.then(container => {
          if (container) {
            return container
          } else {
            const condition = pred(value)
            if (isPromise(condition)) {
              return condition.then(condition => {
                if (condition) {
                  return { value : then(value) }
                }
              })
            } else if (condition) {
              return { value : then(value) }
            }
          }
        })
      } else {
        const condition = pred(value)
        if (isPromise(condition)) {
          promise = condition
          .then(condition => {
            if (condition) {
              return { value : then(value) }
            }
          })
        } else if (condition) {
          return then(value)
        }
      }
    }
    if (promise) {
      return promise
      .then(container => {
        if (container) {
          return container.value
        } else if (funcs.length % 2) {
          return funcs[funcs.length - 1](value)
        }
      })
    } else if (funcs.length % 2) {
      return funcs[funcs.length - 1](value)
    }
  }
})

F.forEach = F.curry(function (func, object) {
  deref(each, object, arguments)
})

F.forEachEnumerable = F.curry(each.enumerable)
F.forEachIterable = F.curry(each.iterable)
F.forEachSet = F.curry(each.set)
F.forEachMap = F.curry(each.map)

F.filter = F.curry(function (func, object) {
  return deref(filter, object, arguments)
})
F.filterEnumerable = F.curry(filter.enumerable)
F.filterIterable = F.curry(filter.iterable)
F.filterSet = F.curry(filter.set)
F.filterMap = F.curry(filter.map)

F.map = F.curry(function (func, object) {
  return deref(map, object, arguments)
})
F.mapEnumerable = F.curry(map.enumerable)
F.mapIterable = F.curry(map.iterable)
F.mapSet = F.curry(map.set)
F.mapMap = F.curry(map.map)

F.reduce = F.curry((func, prev, object) => {
  if (object[Symbol.iterator]) {
    return reduceIterable(func, prev, object)
  } else {
    return reduceEnumerable(func, prev, object)
  }
})

F.reduceIterable = F.curry(reduceIterable)

F.reduceEnumerable = F.curry(reduceEnumerable)

F.find = F.curry((func, object) => {
  if (object[Symbol.iterator]) {
    return findIterable(func, object)
  } else {
    return findEnumerable(func, object)
  }
})

F.some = F.curry((func, object) => {
  if (object[Symbol.iterator]) {
    return someIterable(func, object)
  } else {
    return someEnumerable(func, object)
  }
})

F.every = F.curry((func, object) =>
  F(F.some(F(func, R.not)), R.not)(object))
