"use strict"

const R = require("ramda")

const F = () => { }

F.compose = function () {
  const funcs = arguments
  return function () {
    const args = arguments
    if (R.any(arg => arg && arg instanceof Promise, args)) {
      return Promise.all(args).then(args => funcs[0](...args))
    } else {
      return funcs[0](...args)
    }
  }
}

module.exports = F
