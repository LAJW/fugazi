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
  const promises = [ ]
  if (typeof func === "function") {
    // regular mapping
    forEachEnumerable((value, key) => {
      const element = func(value, key, enumerable)
      if (isPromise(element)) {
        promises.push(element.then(value => { result[key] = value }))
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
          promises.push(element.then(value => { result[key] = value }))
        } else {
          result[key] = element
        }
      } else {
        if (isPromise(func)) {
          promises.push(func.then(value => { result[key] = value }))
        } else {
          result[key] = func
        }
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
  let asyncrhonous = false
  if (typeof func === "function") {
    forEachIterable((value, key) => {
      const element = func(value, key, iterable)
      if (isPromise(element)) {
        asyncrhonous = true
      }
      result.push(element)
    }, iterable)
  }
  if (asyncrhonous) {
    return Promise.all(result)
  } else {
    return result
  }
}

const reduceEnumerable = (func, prev, enumerable) => {
  forEachEnumerable((value, key) => {
    prev = func(prev, value, key, enumerable)
  }, enumerable)
  return prev
}

const reduceIterable = (func, prev, iterable) => {
  forEachIterable((value, key) => {
    prev = func(prev, value, key, iterable)
  }, iterable)
  return prev
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

F.reduce = F.curry((func, prev, object) => {
  if (object[Symbol.iterator]) {
    return reduceIterable(func, prev, object)
  } else {
    return reduceEnumerable(func, prev, object)
  }
})

F.reduceIterable = F.curry(reduceIterable)

F.reduceEnumerable = F.curry(reduceEnumerable)
