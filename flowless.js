/******************************************************************************/

"use strict"
const R = require("ramda")

/******************************************************************************/
const isPromise = x => x && x instanceof Promise

module.exports = function F() { }

const F = module.exports

F.compose = (...funcs) => (...args) => {
  if (R.any(arg => arg && arg instanceof Promise, args)) {
    return Promise.all(args).then(args => funcs[0](...args))
  } else {
    return funcs[0](...args)
  }
}
