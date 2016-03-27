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

const forEachObject = (func, object) => {
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
    forEachObject(func, object)
  }
})

// iterate over each property in an enumerable object
F.forEachObject = F.curry((func, object) => forEachObject(func, object))

// iterate over each property in an iterable object
F.forEachIterable = F.curry((func, iterable) => forEachIterable(func, object))

