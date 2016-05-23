Fugazi - Documentation
================================================================================

# Basics

If you're complete novice in functional JavaScript or functional programming in
general and everything you see here looks alien to you, you should skim this
first: https://github.com/MostlyAdequate/mostly-adequate-guide

Otherwise the following are the functions that you should understand first,
because the rest of this library follows similar pattern.

It's all about removing need for manual synchronizing (Promises), error
handling (custom monads, try/catch), automating type-detection (lots of
overloads), algorithm/container separation and being mostly functional all the
way through.

## F

(Added in 0.1.0)

All-in-one namespace, function composition, currying and parameter extraction.
If functions or parameters are asynchronous (resolved through `Promise`) the
end result will also be a promise.

It also has built-in error-handling and monadic properties (compose with
`F.catch`) so read on.

### Examples

Currying

```js
const F = require("fugazi")

const add = F((a, b) => a + b)
const add1 = add(1) // partial function application
add1(3)             // returns 4
```

Composition - left-to-right

```js
const add1Mul2 = F(
  x => x + 1,
  x => x * 2
)

add1Mul2(5) // returns 12
```

Safe parameter extraction

```js
const getId = F("id")
getId({ id : "Foo" }) // returns "Foo"
getId(null)           // returns undefined

const getParamsId = F("params", "id") // can be composed
getParamsId({
  params : {
    id : "Bar"
  }
}) // returns "Bar"
```

Auto-sync

```js
F(
  () => Promise.resolve(15),   // returns promise
  x => Promise.resolve(x * 2), // we don't have to synchronize!
  x => x + 2
)().then(value => {
  // value is 32
})
```

Error-handling

```js
F(
  () => {
    throw "Foo"       // throw a value
  },
  () => {
    return "Bar"      // skip - exception was thrown
  },
  F.catch(val => val) // catch and return thrown "Foo"
)()                   // Immeidate invocation - returns "Foo", no try/catch
                      // required
```

Unified asynchronous error handling

```js
F(
  () => Promise.reject("Foo"),  // Promise rejecting with "Foo"

  () => Promise.resolve("Bar"), // never executed, because previous function
                                // rejected
  F.catch(val => val)           // same as above, this also catches asynchronous
                                // and returns them
)().then(value => {             // Immediate invocation, returns promise
  // value === "Foo"
})
```

## F.match

(Added in 0.1.0)

`pattern -> target -> boolean`

Match against a *pattern*. This pattern can be one of the following: 

 - **regular expression**
 - **scalar** - string, number, boolean, undefined and null using `===`
   comparison
 - **function** - Matches if function called with target returns true. Function
   may resolve through `Promise` (make call to the database, check file, make
   http request, etc.). If that's the case match will also return promise
   resolving when this function rersolves.
 - **constructor** - Matches if target is an object and is an instance of this
   constructor
 - **array of patterns** - Array's values are treated as patterns. Matches if one
   of those patterns matches
 - **object literal** - Object properties are treated as patterns. Matchess
   only if target is an object and ALL its properties match and there are no
   extra properties in target. If you want to match against an object, but not
   be so strict about extra properties, use `F.matchLoose`

If function matches returns true, otherwise returns false.
### Examples

Match string against a regular expression.
```js
F.match(/^[a-z]+$/)("hello") // returns true
F.match(/^[a-z]+$/)("Hello!") // returns false
```

Match against a value
```js
F.match("hello")("hello") // returns true
F.match("hello")("Hello!") // returns false

F.match(13)(13) // returns true
F.match(13)("13") // returns false (strict comparison)
```

Match against a function
```js
F.match(x => x > 0)(5) // returns true
F.match(x => x > 0)(-5) // returns false
```

Match against a constructor
```js
F.match(String)("Hello World!") // returns true
F.match(String)(1337) // returns false
F.match(Number)(1337) // returns true
F.match(Number)(true) // returns false
F.match(Boolean)(true) // returns true
F.match(Function)(Math.pow) // returns true
F.match(Object)(Math) // returns true
F.match(Object)(null) // returns false
```

Match against an array of patterns
```js
F.match([ "foo", "bar", undefined ])("foo") // returns true
F.match([ "foo", "bar", undefined ])("whatever") // returns false
F.match([ Number, String, Boolean ])(false) // returns true
F.match([ x => x > 0, -1 ])(5) // returns true
F.match([ x => x > 0, -1 ])(-1) // returns true
F.match([ x => x > 0, -1 ])(-2) // returns false
```

Match against an object of patterns
```js
const isPoint = F.match({ x : Number, y : Number })
isPoint({ x : 15, y : 13 }) // true
isPoint([ 1, 2 ]) // false

const validate = F.match({
  firstName : /[A-Z][a-z]+/,
  lastName  : /[A-Z][a-z]+/,
  age       : x => x > 13,
  isHairy   : [ Boolean, undefined ] // isHairy is optional
})
validate({
  firstName : "Foo",
  lastName  : "Bar",
  age       : 90
}) // returns true

// Match is performed recursively, so you can also do this:
const isVector = F.match({
  a : { x : Number, y : Number },
  b : { x : Number, y : Number }
})
isVector({
  a : { x : 5, y : 3 },
  b : { x : -7, y : 0 },
}) // returns true
```

Asynchronous match

Imagine that we have a database model with methods that resolve through
promises and would like to check if user with a particular email and username
already exists. And for some reason you can't perform SQL query with multiple
`WHERE`s.
```js

const validate = F.match({
  email    : model.getUserByEmail,
  username : model.getUserByUsername,
})
validate({
  username : "foobar",
  email    : "foobar@example.com"
}) // Promise detected!, resolve through promise
.then(isAvailable => {
  // isAvailable is either true or false depending on what comes out of model
})

```

Since `F.match` may or may not return a promise (depending on predicates and
values), it's best to use it within F.

```
F(
  func1,
  F.match(/* your pattern */),
  func2,
  ...
)
```

## F.ifElse

`pattern, value, pattern, value... -> target -> value`

This function creates a function that will test target against one or more
*patterns* (look `F.match` *pattern*). If pattern matches, it will return
corresponding value or execute this value (if value is a function) with target
as this function's argument. Patterns and values can be asynchronous (returned
through promise). If that's the case, function will also resolve through
promise.

### Examples

Absolute - standard 3-way `if ... then ... else`
```js
const abs = F.ifElse(
  F.gt(0),  // pattern - in this case a function: is greater than 0
  F.id,     // trueValue - identity x => x function
  x => -x   // elseValue - x * -1
)

abs(15) // returns 15
abs(-15) // returns 15
```

Signum - 5-way `if ... then ... elseif ... then`
```js
const abs = F.ifElse(
  F.gt(0),  // pattern #1
  1,        // trueValue #1 - does not have to be a function

  F.lt(0),  // pattern #2 is x negative
  -1,       // trueValue #2

  0         // else value
)

sgn(5) // returns 1
sgn(-5) // returns -1
sgn(0) // returns 0
```

Optional else value (3rd, 5th, 7th argument) - Safe parameter extraction (don't
throw exception, rather return undefined when obtaining parameter's value)

```js
const param = key => F.ifElse(
  F.id,                 // if (object)
  object => object[key] // then
)                       // else is optional, will return undefined

param("foo")({ foo : "bar" }) // returns "bar"
param("Foo")(null)            // returns undefined
```

Asynchronous patterns - quick authentication. We'll check if http request's
token can be found inside our database.
```js
// somewhere in the depths of your express app
app.use('/', (req, res, next) => {
  F.F(req)( // immediately invoke following asynchronous function composition
    F.ifElse(
      req => Token.findById(req.headers.apikey), // Sequelize model returning
                                                 // Bluebird promise
      F.id,                                      // return request on success
      F.rejector(new Error("Token is invalid"))  // throw exception otherwise
    )(req),
    // your code
    // ...
    //
    F.catch(err => /* function implementing error handlilng */),
    next // continue
  )
})
```

## F.map

(Added in 0.1.0)

`(value key container -> value) -> container -> result`

This function transforms container. The container can be one of the following:

 - Array
 - String
 - Object literal (enumerable)
 - Fucntion generator (iterable)
 - ES6 Set
 - ES6 Map
 - Node stream (special case).

Each overload behaves differently depending on container type and whether or
not transformation function is synchronous or not (returns promise).

 - If transformation function returns promise result will also be resolved
   through promise (automatic `Promise.all`). 
 - If transformation function is asynchronous, order of execution may be out of
   sequence (parallel mapping).
 - If container is an array-like or function generator, order of elements will
   be preserved.
 - Streams are never mapped in parallel
 - Mapping over array-like or function generator returns an array

### Examples

Synchronous mapping

```js
const add1 = F.map(x => x + 1)

add1([ 1, 2, 3, 4 ])          // returns [ 2, 3, 4, 5 ]
add1({ one : 1, two : 2 })    // returns { one : 2, two : 3 }
add1(F.range(0, 4))           // function generator - returns [ 1, 2, 3, 4 ]
add1(new Set([ 1, 2, 3, 4 ])) // returns Set{ 2, 3, 4, 5 }
```

Asynchronous mapping - `Promise.resolve` returns a promise to supplied value. In
order to synchronize you'd normally have to call `Promise.all` (or destructure
depending on whether this is a `Map`, `Object` or `Set`, etc.). With `F.map`
you don't have to remember about that - function automatically synchronizes if
at leasto one transformation result is a promise.

```js
const add1 = F.map(x => Promise.resolve(x + 1))

add1([ 1, 2, 3, 4 ])
.then(result => { /* result is an array [ 2, 3, 4, 5 ] */ })
```

Map over stream

```js
const shout = F.map(str => str.toUppercase())

const readStream = fs.createReadStream('lipsum.txt')
const writeStream = fs.createWriteStream('shouted-lipsum.txt')

shout(readStream)     // shout returns a stream, which can be piped into your
.pipe(writeStream)    // output of choice using minimum amount of memory
```

# Algorithms

Container algorithms are based around F.map. They all accept iterables,
enumerable objects, streams and asynchronous callbacks. In case of asynchronous
callbacks, they may be executed out of order, so It's best not to trigger any
side effects.

## F.forEach

*(Added in 0.1.0)*

`( value key container -> undefined ) -> container -> undefined`

Iterate over every value of the container. Side effect function. Unlike other
algorithms, does not synchronize - executes callbacks as fast possible and
returns `undefined`. Asynchronous callbacks may be executed out of order.

## F.reduce

*(Added in 0.1.0)*

`( sum value key container -> sum ) -> sum -> container -> sum`

Reduce any container to a sum. Sum is the state shared between iterations.
Asynchronous callbacks are always executed in the order of elements in the
original container. Synchronizes stream and returns promise resolving to sum.

## F.filter

*(Added in 0.1.0)*

`( value key container -> boolean ) -> container -> container`

`pattern -> container -> container`

Create copy of a container with values matching the pattern. Pattern may
either be a function returning boolean or a `F.match` pattern. Pattern may be
asynchronous - in that case end container will be returned through promise. In
case of a stream - filtering stream will be reduced.

## F.find

*(Added in 0.1.0)*

`( value key container -> boolean ) -> container -> value`

`pattern -> container -> value`

Find first value of container matching pattern. Pattern may be a function or
`F.match` pattern. If used with `Map`, `Set` or `Object` and asynchronous
pattern patterns will be resolved in parallel. If you care about ordering you
should convert container to `Array` first.

## F.some

*(Added in 0.1.0)*

`( value key container -> boolean ) -> container -> boolean`

`pattern -> container -> boolean`

Return true if at least one of container's values matches the pattern. Pattern
may be a function or `F.match` pattern. Asynchronous patterns are resolved in
parallel

## F.every

*(Added in 0.1.0)*

`( value key container -> boolean ) -> container -> boolean`

Return true if all of container's values match the pattern. Pattern may be a
function or `F.match` pattern. Asynchronous patterns are resolved in parallel.

# Logic

## F.and

*(Added in 0.3.0)*

`(target -> boolean) -> (target -> boolean) -> target -> boolean`

## F.or

*(Added in 0.3.0)*

`(target -> boolean) -> (target -> boolean) -> target -> boolean`

## F.gt

*(Added in 0.3.0)*

`number -> number -> boolean`

## F.gte

*(Added in 0.3.0)*

`number -> number -> boolean`

## F.lt

*(Added in 0.3.0)*

`number -> number -> boolean`

## F.lte

*(Added in 0.3.0)*

`number -> number -> boolean`

## F.eq

*(Added in 0.3.0)*

`object -> object -> boolean`

Are two objects equal (`===` operator). If one of the objects is a promise,
first resolves that promise and then compares resolving result through promise.

## F.eqv

*(Added in 0.3.0)*

`object -> object -> boolean`

Are two objects equivalent (`==` operator). If one of the objects is a promise,
first resolves that promise and then compares resolving result through promise.

# Utilities

## F.resolver

(Added in 0.3.0)

`value -> ignored -> value`

Creates a function that returns a value.

### Example
```js
F.F()(
  F.resolver("Foo"),
  console.log // logs "Foo"
)
```

## F.rejector

(Added in 0.3.0)

`value -> ignored -> throw value`

Creates a function that throws a value.

### Example
```js
F.F()(
  F.rejector("Foo"),
  F.resolver("Bar"),
  F.catch(F.id),
  console.log // logs "Foo"
)
