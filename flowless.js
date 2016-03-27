/******************************************************************************/

"use strict"
require("babel-core/register")
require("babel-polyfill")
const R = require("ramda")

/******************************************************************************/

const id = x => x

const isPromise = x => x && x instanceof Promise

// Convert to promise and resolve if needed
const callThen = func => (...args) =>
  R.any(isPromise, args)
  ? Promise.all(args).then(args => func(...args))
  : func(...args)

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
  forEachEnumerable((value, key) => {
    if (func(value, key, enumerable)) {
      result[key] = value
    }
  }, enumerable)
  return result
}

const filterIterable = (func, iterable) => {
  const result = [ ]
  forEachIterable((value, key) => {
    if (func(value, key, iterable)) {
      result.push(value)
    }
  }, iterable)
  return result
}

const mapEnumerable = (func, enumerable) => {
  const result = { }
  if (typeof func === "function") {
    // regular mapping
    forEachEnumerable((value, key) => {
      result[key] = func(value, key, enumerable)
    }, enumerable)
  } else {
    // func is object => map params
    forEachEnumerable((func, key) => {
      if (typeof func === "function") {
        result[key] = func(enumerable[key], key, enumerable)
      } else {
        result[key] = func
      }
    }, func)
  }
  return result
}

const mapIterable = (func, iterable) => {
  const result = [ ]
  if (typeof func === "function") {
    forEachIterable((value, key) => {
      result.push(func(value, key, iterable))
    }, iterable)
  } else {
    forEachIterable((value, key) => {
      result.push(func[key](value, key, iterable))
    }, iterable)
  }
  return result
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

module.exports = function F() { }

const F = module.exports

// Essentials

F.compose = (...funcs) => (...args) => {
  funcs[0] = R.apply(funcs[0])
  if (R.any(isPromise, args)) {
    var value = Promise.all(args)
  } else {
    var value = args
  }
  let isError = false // is value an error
  for (var i = 0, il = funcs.length; i < il; i++) {
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

// Utilities

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
