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
const forEachEnumerable = (func, object) => {
  for (const key in object) {
    func(object[key], key, object)
  }
}

const forEachIterable = (func, object) => {
  let i = 0
  for (const element of object) {
    func(element, i, object)
    i++
  }
}

const filterEnumerable = (func, enumerable) => {
  const result = { }
  let   promise
  forEachEnumerable((value, key) => {
    const condition = func(value, key, enumerable)
    if (isPromise(condition)) {
      promise = condition.then(condition => {
        if (condition) {
          result[key] = value
        }
      })
    } else if (condition) {
      result[key] = value
    }
  }, enumerable)
  if (promise) {
    return promise.then(() => result)
  } else {
    return result
  }
}

const filterIterable = (func, iterable) => {
  const result     = [ ] // results resolved immediately
  const rest       = [ ] // unresolved values
  const conditions = [ ] // asynchronous condition map for rest
  forEachIterable((value, key) => {
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

const mapEnumerable = (func, enumerable) => {
  const result = { }
  const promises = [ ]
  if (typeof func === "function") {
    // regular mapping
    forEachEnumerable((value, key) => {
      const element = func(value, key, enumerable)
      if (isPromise(element)) {
        promises.push(element.then(value => result[key] = value))
      } else {
        result[key] = element
      }
    }, enumerable)
  } else {
    // func is object => map params
    forEachEnumerable((func, key) => {
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
}

const mapIterable = (func, iterable) => {
  const result = [ ]
  let asynchronous = false
  forEachIterable((value, key) => {
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
}

const reduceEnumerable = (func, prev, enumerable) => {
  forEachEnumerable((value, key) => {
    if (isPromise(prev)) {
      prev = prev.then(prev => func(prev, value, key, enumerable))
    } else {
      prev = func(prev, value, key, enumerable)
    }
  }, enumerable)
  return prev
}

const reduceIterable = (func, prev, iterable) => {
  forEachIterable((value, key) => {
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

F.forEach = F.curry((func, object) => {
  if (object[Symbol.iterator]) {
    forEachIterable(func, object)
  } else {
    forEachEnumerable(func, object)
  }
})

// iterate over each property in an enumerable object
F.forEachEnumerable = F.curry(forEachEnumerable)

// iterate over each property in an iterable object
F.forEachIterable = F.curry(forEachIterable)

F.filter = F.curry((func, object) => {
  if (object[Symbol.iterator]) {
    return filterIterable(func, object)
  } else {
    return filterEnumerable(func, object)
  }
})

F.filterEnumerable = F.curry(filterEnumerable)

F.filterIterable = F.curry(filterIterable)

F.map = F.curry((func, object) => {
  if (object[Symbol.iterator]) {
    return mapIterable(func, object)
  } else {
    return mapEnumerable(func, object)
  }
})

F.mapEnumerable = F.curry(mapEnumerable)

F.mapIterable = F.curry(mapIterable)

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
