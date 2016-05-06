Asynchronous functional library for Node 5+
============================================
[![Build Status](https://travis-ci.org/LAJW/flowless.svg?branch=master)](https://travis-ci.org/LAJW/flowless)
[![Coverage Status](https://coveralls.io/repos/github/LAJW/flowless/badge.svg?branch=master)](https://coveralls.io/github/LAJW/flowless?branch=master)
[![Dependencies](https://david-dm.org/lajw/flowless.svg)](https://david-dm.org/lajw/flowless)

This library removes the need to manually synchronize your code (call `.then`,
`Promise.all` or `async/await` functions) while keeping the benefits of
non-blocking I/O. It helps with databases, WebWorkers, files, streams, system
calls and other asynchronous tasks. It may lack some generic functionality,
which is already implemented in more general purpose libraries (Ramda, lodash,
underscore), so use it in conjunction with those.

# Installation

To use with Node:

    $ npm install f**** --save // name is being chosen

Then in your code:

    const F = require("f****")

# What's different?

 - Map/Filter/Reduce/Find with asynchronous callbacks applicable over:
   - Node streams (http request, file, etc.)
   - Generator functions
   - ES6 Map
   - ES6 Set
   - Objects
   - Arrays and other iterables
 - Sync promised arguments while currying
 - Sync promise-returning functions while compoosing
 - Support for error catching built into composition function both synchronous
   and asynchronous
 - Variable-length ifElse with synchronization support
 - Versatile matching function built into find, filter and ifElse
 - Forward currying! (I like ramda, but can't read backwards)

# Examples

Let's see it in action!

## Stream reduce 

Get http body from express.js (`req` is a stream)

```js
app.get("/", (req, res, next) => {
  F.reduce((data, chunk) => data + chunk, "", req)
  .then(body => {
    // do your stuff
  })
})
```

## Function composition with asynchronous functions

Get that body and treat it as JSON

```js
app.get("/", (req, res, next) => {
  F(
    F.reduce((data, chunk) => data + chunk, ""),
    JSON.parse, // don't have to wait!
    body => {
      // do your stuff
    }
  )(req) // immediately apply
})
```

## In-composition error-handling 

But what if the body isn't a valid JSON?

```js
app.get("/", (req, res, next) => {
  F(
    F.reduce((data, chunk) => data + chunk, ""),
    JSON.parse,
    F.catch(() => ({ })), // handle JSON.parse exception, return empty object
    body => {
      // do your stuff
    }
  )(req) // immediately apply
})
```

## In-composition parameter crawling

Extract parameters safely without rolling custom fuction

```js
app.get("/", (req, res, next) => {
  F(
    F.reduce((data, chunk) => data + chunk, ""),
    JSON.parse,
    F.catch(() => ({ })),
    "deeply", "nested", "property",
    property => { // body.deeply.nested.property or undefined
      // do your stuff
    }
  )(req) // immediately apply
})
```

# More functions!

`F.match(pattern, target)` - Pattern may be an asynchronous function, array of
asynchronous functions, regex expression, value, array of values, array of
constructors, or object with properties containing other matches.

```js
F.match(Boolean)(true) // true
F.match({ x : Number, y : Number })({ x : 0, y : 0 }) // true
F.match([ "one", "two", "three" ])("one") // true
F.match(/a-z/i)("DankMemes") // true
```

`F.curry(fn)` alias `F(fn)` - Curry function. If one of supplied arguments is a
promise, resolve and return final result as a promise.

`F.ifElse(ifFunc1, trueFunc1, [ifFunc2, [trueFunc2, ... [elseFunc)(value)` -
infinite argument ifElse with asynchronous predicate support.

`F.map(proc, target)` - Curried map function. `proc` may be asynchronous function, target
can be a stream, `Set`, `Map`, `Array`, function generator or object.

`F.filter(pred, target)` - Curried filter function. `pred` may be asynchronous
function, or F.match pattern. Operates on all possible object types, just like
`F.map`.

`F.find(pred, target)` - Curried find function. `pred` may be asynchronous
function, or F.match pattern. Operates on all possible object types, just like
`F.map`.

`F.forEach(callback, target)` - Side effect function. Iterate over anything, do
not synchronize, function always returns undefined. 
