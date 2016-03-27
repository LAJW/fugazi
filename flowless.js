/******************************************************************************/

"use strict"
const R = require("ramda")

/******************************************************************************/

const id = x => x
const isPromise = x => x && x instanceof Promise
const apply = func => args => func(...args)

module.exports = function F() { }

const F = module.exports

// Essentials

F.compose = (...funcs) => (...args) => {
  funcs[0] = apply(funcs[0])
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

F.curry = func =>
  R.curryN(func.length, (...args) =>
    R.any(isPromise, args)
    ? Promise.all(args).then(args => func(...args))
    : func(...args))

// Utilities


