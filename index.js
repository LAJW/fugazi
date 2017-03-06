/******************************************************************************/
/**
 * @module fugazi
 * @desc Functional asynchronous library
 * @author Lukasz A.J. Wrona (layv.net)
 * @license MIT
 */
/******************************************************************************/

"use strict"
const R           = require("ramda")
const stream      = require("stream")
const isStream    = require("is-stream")
const isES6Class  = require("is-class")
const noop        = require("noop2")
const coReduceAny = require("co-reduce-any")

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

class Result {
  constructor(obj) {
    if (typeof obj === "object" && obj !== null) {
      if (obj instanceof Set) {
        this._obj = new Set()
        this._add = this._set
      } else if (obj instanceof Map) {
        this._obj = new Map()
        this._add = this._map
      } else if (obj instanceof stream) {
        this._obj = new stream.PassThrough()
        this._add = this._stream
      } else if (isIterable(obj)) {
        this._obj = [ ]
        this._add = this._array
      } else {
        this._obj = { }
        this._add = this._object
      }
    } else {
      throw new TypeError("Supplied object is not enumerable")
    }
  }
  _array(key, value) {
    this._obj.push(value)
  }
  _stream(key, value) {
    this._obj.write(value)
  }
  _map(key, value) {
    this._obj.set(key, value)
  }
  _set(key, value) {
    this._obj.add(value)
  }
  _object(key, value) {
    this._obj[key] = value
  }
  add(key, value) {
    this._add(key, value)
  }
  get(promise) {
    if (isStream(this._obj)) {
      promise.catch(error => this._obj.emit("error", error))
             .then(() => this._obj.end())
      return this._obj
    } else if (isPromise(promise)) {
      return promise.then(() => this._obj)
    } else {
      return this._obj
    }
  }
  static create(obj) {
    return new Result(obj)
  }
}

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
    return F.compose(...R.map(R.ifElse(isFunction, id, key => F.param(key)), arguments))
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
      const subMatches = { }
      for (const key in pred) {
        subMatches[key] = superMatch(strict)(pred[key])
      }
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

F.forEach = F((proc, obj) => {
  coReduceAny(obj, function* (next) {
    for (let pair; pair = yield next;) {
      const [ key, value ] = pair
      proc(value, key, obj)
    }
  })
})


F.map = F.curry((proc, object) => {
  const result = Result.create(object)
  return result.get(coReduceAny(object, function* (next) {
    for (let pair; pair = yield next;) {
      const [ key, value ] = pair
      result.add(key, yield proc(value, key, object))
    }
  }))
})

F.reduce = F.curry(function(func, prev, object) {
  return coReduceAny(object, function* (next) {
    let acc = isFunction(prev) ? yield prev(object) : prev
    for (let pair; pair = yield next;) {
      const [ key, value ] = pair
      acc = yield func(acc, value, key, object)
    }
    return acc
  })
})

F.filter = F.curry((func, object) => {
  const pred = F.match(func)
  const result = Result.create(object)
  return result.get(coReduceAny(object, function* (next) {
    for (let pair; pair = yield next;) {
      const [ key, value ] = pair
      if (yield pred(value, key, object)) {
        result.add(key, value)
      }
    }
  }))
})

F.filterKeys = F((pred, object) => F.filter(F(F.args, "1", F.match(pred)), object))
F.find = F.curry((func, object) => {
  const pred = F.match(func)
  return coReduceAny(object, function* (next) {
    for (let pair; pair = yield next;) {
      const [ key, value ] = pair
      if (yield pred(value, key, object)) {
        return value
      }
    }
  })
})

F.some = F.curry((func, object) => {
  const pred = F.match(func)
  return coReduceAny(object, function* (next) {
    for (let pair; pair = yield next;) {
      const [ key, value ] = pair
      if (yield pred(value, key, object)) {
        return true
      }
    }
    return false
  })
})

F.every = F.curry((func, object) => F(F.some(F(F.match(func), R.not)), R.not)(object))
F.match = match
F.matchKeys = F((pred, obj) => F.every(F(F.args, 1, F.match(pred)), obj))
F.matchLoose = superMatch(false)

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

F.not = F(R.not)
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
