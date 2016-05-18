Fugazi - Documentation
================================================================================

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

Since F.match may or may not return a promise (depending on predicates and values), it's best to use it within F.

```
F(
  func1,
  F.match(/* your pattern */),
  func2,
  ...
)
```

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
