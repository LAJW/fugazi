/******************************************************************************/
/**
 * @module fugazi
 * @desc Functional asynchronous library
 * @author Lukasz A.J. Wrona (layv.net)
 * @license MIT
 */
/******************************************************************************/

"use strict"
const R          = require("ramda")
const stream     = require("stream")
const isStream   = require("is-stream")
const isES6Class = require("is-class")
const noop       = require("noop2")

/******************************************************************************/

// Compare 2 arrays with unique unsorted values (set.values())
function compareSetValues(left, right) {
  if (left.length !== right.length) {
    return false
  } else {
    return left.every(val => right.indexOf(val) >= 0)
  }
}

const noopProtoKeys = Object.getOwnPropertyNames(noop.prototype)

// Is ES6 class or ES5 class
// Doesn't check if target is null/undefined, so check that manually
function isClass(target) {
  return isES6Class(target)
         || target.prototype
            && !(target.prototype instanceof Function)
            && !compareSetValues(
              Object.getOwnPropertyNames(target.prototype), noopProtoKeys)
}

const id = x => x

const isFunction = x => x && x instanceof Function
const isPromise = val => typeof val === "object"
                         && val !== null
                         && typeof val.then === "function"
const isIterable = x => x && x[Symbol.iterator]

function go_(inst, prev) {
    const next = inst.next(prev)
    const { done, value } = next
    if (done) {
        return value
    } else if (isPromise(value)) {
        return value.then(value => go_(inst, value))
    } else {
        return go_(inst, value)
    }
}

// optionally resolve generator yields
function go(gen) {
    return go_(gen())
}


// Convert to promise and resolve if needed
const callThen = func => function () {
  const args = arguments
  return R.any(isPromise, args)
  ? Promise.all(args).then(args => func(...args))
  : func(...args)
}

const param = key => base => base ? base[key] : undefined

const forOf = (cb, object) => {
  let i = 0
  for (const value of object) {
    cb(value, i, object)
    i++
  }
}

const forIn = (cb, object) => {
  for (const key in object) {
    cb(object[key], key, object)
  }
}

const untilOf = (cb, object) => {
  let i = 0
  for (const value of object) {
    const result = cb(value, i, object)
    if (result) {
      return result
    }
    i++
  }
}

const untilIn = (cb, object) => {
  for (const key in object) {
    const result = cb(object[key], key, object)
    if (result) {
      return result
    }
  }
}

const generic = {
  iterable : {
    create : () => [ ],
    store  : (object, value) => object.push(value),
    each   : forOf,
    until  : untilOf,
  },
  enumerable : {
    create : () => ({ }),
    store  : (object, value, key) => object[key] = value,
    each   : forIn,
    until  : untilIn,
  },
  map : {
    create : () => new Map(),
    store  : (object, value, key) => object.set(key, value),
    each   : (cb, map) => forOf(pair => cb(pair[1], pair[0], map), map),
    until  : (cb, map) => untilOf(pair => cb(pair[1], pair[0], map), map),
  },
  set : {
    create : () => new Set(),
    store  : (object, value) => object.add(value),
    each   : forOf,
    until  : untilOf,
  },
  stream : {
    create : () => new stream.PassThrough(),
    store  : (stream, value) => stream.write(value),
    each   : (proc, stream) => new Promise((resolve, reject) => {
      stream.on("data", chunk => {
        proc(chunk)
      })
      stream.on("end", () => resolve())
      stream.on("error", err => reject(err))
    }),
    until : (proc, stream) => new Promise((resolve, reject) => {
      let result
      stream.on("data", chunk => {
        result = proc(chunk)
        if (result) {
          stream.pause()
        }
      })
      stream.on("end", () => resolve())
      stream.on("error", err => reject(err))
    })
  }
}

const each = {
  map        : generic.map.each,
  set        : generic.set.each,
  iterable   : generic.iterable.each,
  enumerable : generic.enumerable.each,
  stream     : generic.stream.each,
}

const deref = (alg, target, args) => {
  if (target instanceof Set) {
    return alg.set(...args)
  } else if (target instanceof Map) {
    return alg.map(...args)
  } else if (isIterable(target)) {
    return alg.iterable(...args)
  } else if (isStream(target)) {
    return alg.stream(...args)
  } else {
    return alg.enumerable(...args)
  }
}

const createFilter = generic => (pred, object) => {
  let result = generic.create()
  let promise
  generic.each((val, key) => {
    const condition = pred(val, key, object)
    if (isPromise(condition)) {
      if (!promise) {
        promise = condition
      } else {
        promise = promise.then(condition)
      }
      promise.then(condition => {
        if (condition) {
          generic.store(result, val, key)
        }
      })
    } else if (condition) {
      generic.store(result, val, key)
    }
  }, object)
  if (promise) {
    return promise.then(() => result)
  } else {
    return result
  }
}

const filter = {
  set        : createFilter(generic.set),
  map        : createFilter(generic.map),
  enumerable : createFilter(generic.enumerable),
  iterable   : (func, iterable) => {
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
  },
  stream : (pred, stream) => {
    const out = generic.stream.create()
    let promise = Promise.resolve()
    let finished = false
    stream.on("data", chunk => {
      promise = promise
      .then(() => pred(chunk))
      .then(condition => {
        if (condition && !finished) {
          out.write(chunk)
        }
      })
      .catch(err => {
        stream.pause()
        out.emit("error", err)
        finished = true
      })
    })
    stream.on("end", () => {
      promise.then(() => out.end())
    })
    return out
  }
}

const createMap = generic => (proc, object) => {
  const out      = generic.create()
  const promises = [ ]
  generic.each((value, key) => {
    const result = proc(value, key, object)
    if (isPromise(result)) {
      promises.push(result)
      result.then(result => generic.store(out, result, key))
    } else {
      generic.store(out, result, key)
    }
  }, object)
  if (promises.length) {
    return Promise.all(promises)
    .then(() => out)
  } else {
    return out
  }
}

const map = {
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

  enumerable : createMap(generic.enumerable),
  set        : createMap(generic.set),
  map        : createMap(generic.map),
  stream     : (proc, stream) => {
    const out = generic.stream.create()
    let promise = Promise.resolve()
    stream.on("data", chunk => {
      promise = promise
      .then(() => proc(chunk))
      .then(result => out.write(result))
      .catch(err => {
        out.emit("error", err)
        stream.pause()
      })
    })
    stream.on("end", () => {
      promise.then(() => out.end())
    })
    return out
  }
}


const createReduce = generic => (func, prev, enumerable) => {
  if (isFunction(prev)) {
    prev = prev(enumerable)
  }
  const maybePromise = generic.each((value, key) => {
    if (isPromise(prev)) {
      prev = prev.then(prev => func(prev, value, key, enumerable))
    } else {
      prev = func(prev, value, key, enumerable)
    }
  }, enumerable)
  if (isPromise(maybePromise)) {
    return maybePromise.then(() => prev)
  }
  return prev
}

const reduce = map.enumerable(createReduce, generic)

// first promise that passes predicate will resolve
const findPromise = (func, promises) => new Promise((resolve, reject) => {
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

const createFind = until => (func, object) => {
  const promises = [ ]
  let result
  if (until((value, key) => {
    const condition = func(value, key, object)
    if (isPromise(condition)) {
      promises.push(condition.then(condition => condition
                                   ? { value }
                                   : undefined))
    } else if (condition) {
      result = value
      return condition
    }
  }, object)) {
    return result
  } else if (promises.length) {
    return findPromise(id, promises).then(param("value"))
  }
}

const find = {
  iterable : (func, iterable) => {
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
  },
  enumerable : createFind(generic.enumerable.until),
  map        : createFind(generic.map.until),
  set        : createFind(generic.set.until),
  stream     : (pred, stream) => new Promise((resolve, reject) => {
    let promise = Promise.resolve()
    stream.on("data", chunk => {
      promise = promise
      .then(() => pred(chunk))
      .then(condition => {
        if (condition) {
          stream.pause()
          resolve(chunk)
        }
      })
      .catch(err => {
        stream.pause()
        reject(err)
      })
    })
    stream.on("end", () => {
      promise.then(() => resolve(undefined))
    })
    stream.on("error", reject)
  })
}

const createSome = generic => (pred, object) => {
  let promises = [ ]
  return generic.until((value, key) => {
    const condition = pred(value, key, object)
    if (isPromise(condition)) {
      promises.push(condition)
    } else {
      return condition
    }
  }, object)
  || !!promises.length
     && findPromise(id, promises).then(result => !!result)
}

const some = map.enumerable(createSome, generic)

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

const superMatch = strict => pred => {
  if (pred) {
    if (pred instanceof Function) {
      if (pred === Boolean) {
        return value => typeof value === "boolean"
      } else if (pred === Number) {
        return value => typeof value === "number"
      } else if (pred === String) {
        return value => typeof value === "string"
      } else if (isClass(pred)) {
        return value => value && value instanceof pred
      } else {
        return function () {
          return pred.apply(undefined, arguments)
        }
      }
    } else if (pred instanceof RegExp) {
      return value => pred.test(value)
    } else if (pred instanceof Array) {
      const possible = pred.map(superMatch(strict))
      return value => F.some(pred => pred(value), possible)
    } else if (pred instanceof Object) {
      const subMatches = map.enumerable(superMatch(strict), pred)
      if (strict) {
        return value => {
          if (!value || !(value instanceof Object)
              || Object.keys(value).length > Object.keys(subMatches).length) {
            return false
          }
          return F.every((subMatch, key) => subMatch(value[key]), subMatches)
        }
      } else {
        return value => value
        && value instanceof Object
        && F.every((subMatch, key) => subMatch(value[key]), subMatches)
      }
    }
  }
  return value => value === pred
}

const match = superMatch(true)

// Essentials

F.compose = function() {
  const funcs = [ ...arguments ];
  const f1 = funcs[0]
  // typecheck
  funcs.forEach((funcs, i) => {
    if (typeof funcs !== "function"
        && typeof funcs !== "string") {
      throw new TypeError(`F.compose: Argument ${i} is neither a function nor a string`)
    }
  })
  const composed = function () {
    if (R.any(isPromise, arguments)) {
      funcs[0] = () => Promise.all(arguments).then(args => f1(...args))
    } else {
      funcs[0] = () => f1(...arguments)
    }
    let value
    let isError = false // is value an error
    funcs.forEach(func => {
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
    })
    if (isError) {
      throw value
    } else {
      return value
    }
  }
  Object.defineProperty(composed, "length", { value : f1.length })
  return composed
}

F.catch = handler => {
  if (!isFunction(handler)) {
    throw new TypeError("F.catch(handler): handler should be a function")
  }
  const catcher = err => handler(err)
  catcher.catcher = true
  return catcher
}

F.curryN = (length, func) => {
  if (!(Math.floor(length) === length && length >= 0)) {
    throw new TypeError("F.curryN(length, func): Length should be an unsigned integer")
  } else if (!isFunction(func)) {
    throw new TypeError("F.curryN(func): func should be a function")
  } else {
    return R.curryN(length, callThen(func))
  }
}

F.curry = func => {
  if (!isFunction(func)) {
    throw new TypeError("F.curry(func): func should be a function")
  } else {
    return F.curryN(func.length, func)
  }
}

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
  return [ ...arguments ]
})

// Utilities

F.param = F.curry((key, base) => base ? base[key] : undefined)

F.ifElse = callThen(function () {
  const funcs = [ ]
  for (let i = 0, il = arguments.length - 1; i < il; i += 2) {
    const pred = arguments[i]
    const then = arguments[i + 1]
    funcs.push(isFunction(pred) ? pred : match(pred))
    funcs.push(isFunction(then) ? then : () => then)
  }
  if (arguments.length % 2) {
    const last = arguments[arguments.length - 1]
    funcs.push(isFunction(last) ? last : () => last)
  }
  return (...args) => go(function* () {
    for (let i = 0, il = funcs.length - 1; i < il; i += 2) {
      const pred = funcs[i]
      const then = funcs[i + 1]
      if (yield pred(...args)) {
        return then(...args)
      }
    }
    if (funcs.length % 2) {
      return funcs[funcs.length - 1](...args)
    }
  })
})

F.forEach = F.curry(function (func, object) {
  deref(each, object, arguments)
})


F.map = F.curry(function (func, object) {
  return deref(map, object, arguments)
})

F.reduce = F.curry(function(func, prev, object) {
  return deref(reduce, object, arguments)
})

F.filter = F.curry((func, object) => deref(filter, object, [ match(func), object ]))
F.filterKeys = F((pred, object) => F.filter(F(F.args, "1", F.match(pred)), object))
F.find = F.curry((func, object) => deref(find, object, [ match(func), object ]))
F.some = F.curry((func, object) => deref(some, object, [ match(func), object ]))
F.every = F.curry((func, object) => F(F.some(F(F.match(func), R.not)), R.not)(object))
F.match = match
F.matchKeys = F((pred, obj) => F.every(F(F.args, 1, F.match(pred)), obj))
F.matchLoose = superMatch(false)

F.and = function () {
  const preds = F.map(F.match, arguments)
  return target => F.every(pred => pred(target), preds)
}

F.and = callThen((...preds) => {
  preds = preds.map(F.match)
  return (...args) => go(function* () {
    let result
    for (const pred of preds) {
      result = yield pred(...args)
      if (!result) {
        return false
      }
    }
    return result
  })
})

F.or = callThen((...preds) => {
  preds = preds.map(F.match)
  return (...args) => go(function* () {
    for (const pred of preds) {
      const result = yield pred(...args)
      if (result) {
        return result
      }
    }
    return false
  })
})

F.not = value => isPromise(value)
                 ? value.then(value => !value)
                 : !value

F.eq = F.curry((a, b) => a === b)
F.eqv = F.curry((a, b) => a == b)
F.lt = F.curry((a, b) => b < a)
F.lte = F.curry((a, b) => b <= a)
F.gt = F.curry((a, b) => b > a)
F.gte = F.curry((a, b) => b >= a)

F.sync = F.map(x => x)

F.id = x => x

F.F = function () {
  const args = arguments
  return function () {
    const funcs = arguments
    return F.compose(...funcs)(...args)
  }
}

F._ = R.__

F.resolver = x => () => x
F.rejector = x => () => {
  throw x
}

F.assoc = F((key, value, target) => {
  const object = Object.assign({}, target)
  if (isFunction(value)) {
    const result = value(target)
    if (isPromise(result)) {
      return result
      .then(result => {
        object[key] = result
        return object
      })
    }
    object[key] = result
  } else {
    object[key] = value
  }
  return object
})

F.merge = F((left, right) => {
  if (isFunction(left)) {
    const result = left(right)
    if (isPromise(result)) {
      return result.then(left => Object.assign({}, right, left))
    }
    return Object.assign({}, right, result)
  }
  return Object.assign({}, right, left)
})

F.effect = func => callThen((...args) => {
  const first = args[0]
  const result = func(...args)
  if (isPromise(result)) {
    return result.then(() => first)
  } else {
    return first
  }
})
