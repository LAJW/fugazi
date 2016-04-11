/******************************************************************************/
/**
 * @file :test/main.js
 * @desc Unit tests for flowless.js
 * @author Lukasz A.J. Wrona (layv.net)
 * @license MIT
 */
/******************************************************************************/

"use strict"
const F      = require("../flowless")
const assert = require("assert")

/******************************************************************************/
/* global describe it */

Object.defineProperty(Promise.prototype, 'end', {
  value(done) {
    this.then(() => done(), done)
  }
})

describe("F", () => {

  it("enable currying when provided with a single function", () => {
    const sum3 = F((a, b, c) => a + b + c)
    assert.strictEqual(sum3(1)(2, 3), 6);
    assert.strictEqual(sum3(1, 2, 3), 6);
    assert.strictEqual(sum3(1)(2)(3), 6);
  })

  it("single param => create function extracting param", () => {
    const extract = F("param")
    assert.strictEqual(extract({ param : "param's value" }),
                       "param's value")
  })

  it("F param should return udefined if param isn't found", () => {
    const extract = F("param")
    assert.strictEqual(extract({ }), undefined)
  })

  it("combine multiple params for deep crawling", () => {
    const extract = F(0, "param")
    assert.strictEqual(extract([ { param : "param's value" } ]),
                       "param's value")
  })

})

describe("compose", () => {

  it("Simple function, pass in parameters", () => {
    const sum = (a, b) => a + b
    const result = F.compose(sum)(3, 5)
    assert.strictEqual(result, 8)
  })

  it("Single function, wait for parameters", done => {
    const sum = (a, b) => a + b
    F.compose(sum)(3, Promise.resolve(5))
    .then(result => assert.strictEqual(result, 8))
    .end(done)
  })

  it("Chain forward multiple functions", () => {
    const sum = a => b => a + b
    const mul = a => b => a * b
    const result = F.compose(sum(10), mul(2), sum(3))(10)
    assert.strictEqual(result, 43)
  })

  it("Chain forward multiple functions, promise arguments", done => {
    const sum = a => b => a + b
    const mul = a => b => a * b
    F.compose(sum(10), mul(2), sum(3))(Promise.resolve(10))
    .then(result => assert.strictEqual(result, 43))
    .end(done)
  })

  it("Chain forward multiple functions, promise function result", done => {
    const sum = a => b => a + b
    const mul = a => b => Promise.resolve(a * b)
    F.compose(sum(10), mul(2), sum(3))(10)
    .then(result => assert.strictEqual(result, 43))
    .end(done)
  })

  it("If composed function throws, throw", () => {
    const object = { }
    let result
    try {
      F.compose(() => {
        throw object
      })()
    } catch (error) {
      result = error
    }
    assert.strictEqual(result, object)
  })

  it("Catcher function should catch synchronous errors.", () => {
    const object = { }
    const result = F.compose(result => {
      if (isNaN(result)) {
        throw object
      }
    },
    x => -x,
    F.catch(err => err))("not a number")
    assert.strictEqual(result, object)
  })

  it("Catcher function should catch asynchronous errors.", () => {
    const object = { }
    F.compose(result => {
      if (isNaN(result)) {
        throw object
      }
    },
    x => -x,
    F.catch(err => err))(Promise.resolve("not a number"))
    .then(result => assert.strictEqual(result, object))
  })

})

describe("curry", () => {

  it("synchronous arguments", () => {
    const addMul = F.curry((a, b, c) => (a + b) * c)
    const result = addMul(2)(3)(5)
    assert.strictEqual(result, 25)
  })

  it("asynchronous arguments - detect and await, return promise", done => {
    const addMul = F.curry((a, b, c) => (a + b) * c)
    addMul(2, Promise.resolve(3))(5)
    .then(result => assert.strictEqual(result, 25))
    .end(done)
  })

})

describe("range", () => {
  it("single parameter > 0 => range from 0 ascending", () => {
    const result = [ ]
    for (const i of F.range(5)) {
      result.push(i)
    }
    assert.deepEqual(result, [ 0, 1, 2, 3, 4, 5 ])
  })
  it("single parameter < 0 => range from 0 descending", () => {
    const result = [ ]
    for (const i of F.range(-5)) {
      result.push(i)
    }
    assert.deepEqual(result, [ 0, -1, -2, -3, -4, -5 ])
  })
  it("two parameters, range from min to max ascending", () => {
    const result = [ ]
    for (const i of F.range(5, 10)) {
      result.push(i)
    }
    assert.deepEqual(result, [ 5, 6, 7, 8, 9, 10 ])
  })
  it("two parameters, range from max to min descending", () => {
    const result = [ ]
    for (const i of F.range(10, 5)) {
      result.push(i)
    }
    assert.deepEqual(result, [ 10, 9, 8, 7, 6, 5 ])
  })
})

describe("args", () => {
  it("return passed in arguments", () => {
    const args = F.args("one", "two", "three", "four")
    assert.deepEqual(args, [ "one", "two", "three", "four" ])
  })
  it("return passed in arguments, wait for asynchronous ones", () => {
    F.args("one", Promise.resolve("two"), "three", Promise.resolve("four"))
    .then(args => assert.deepEqual(args, [ "one", "two", "three", "four" ]))
  })
})

describe("param", () => {

  it("return undefined if base object is undefined", () => {
    assert.strictEqual(F.param("one")(undefined), undefined)
  })

  it("get argument from object by key", () => {
    assert.strictEqual(F.param("one", { one : 1 }), 1)
  })

  it("get argument from object by numeric key", () => {
    assert.strictEqual(F.param(3, [ "one", "two", "three", "four" ]), "four")
  })

})

describe("ifElse", () => {
  it("synchronous condition", () => {
    const abs = F.ifElse(a => a >= 0, a => a, a => a * -1)
    assert.strictEqual(abs(5), 5)
    assert.strictEqual(abs(-3), 3)
  })
  it("synchronous condition, else optional", () => {
    const first = F.ifElse(a => a && a.length, a => a[0])
    assert.strictEqual(first([ 5, 4, 3 ]), 5)
    assert.strictEqual(first(undefined), undefined)
  })
  it("asyncrhonous condition", done => {
    const abs = F.ifElse(a => Promise.resolve(a >= 0), a => a, a => a * -1)
    abs(5).then(result => assert.strictEqual(result, 5))
    .then(() => abs(-3).then(result => assert.strictEqual(result, 3)))
    .end(done)
  })
  it("asynchronous condition, else optional", done => {
    const first = F.ifElse(a => Promise.resolve(a && a.length), a => a[0])
    first([ 5, 4, 3 ])
    .then(result => assert.strictEqual(result, 5))
    .then(() => first(undefined))
    .then(result => assert.strictEqual(result, undefined))
    .end(done)
  })
  it("if then elseif then else then", () => {
    const sgn = F.ifElse(a => a > 0,
                         () => 1,

                         a => a < 0,
                         () => -1,

                         () => 0)
    assert.strictEqual(sgn(5), 1)
    assert.strictEqual(sgn(-3), -1)
    assert.strictEqual(sgn(NaN), 0)
  })
  it("if then elseif then else then asynchronous", done => {
    const sgn = F.ifElse(a => Promise.resolve(a > 0),
                         () => 1,

                         a => Promise.resolve(a < 0),
                         () => -1,

                         () => 0)
    sgn(5).then(result => assert.strictEqual(result, 1))
    .then(() => sgn(-3)).then(result => assert.strictEqual(result, -1))
    .then(() => sgn(NaN)).then(result => assert.strictEqual(result, 0))
    .end(done)
  })
  it("if then elseif then else then asynchronous into synchronous", done => {
    const sgn = F.ifElse(a => Promise.resolve(a > 0),
                         () => 1,

                         a => a < 0,
                         () => -1,

                         () => 0)
    sgn(5).then(result => assert.strictEqual(result, 1))
    .then(() => sgn(-3)).then(result => assert.strictEqual(result, -1))
    .then(() => sgn(NaN)).then(result => assert.strictEqual(result, 0))
    .end(done)
  })
})

describe("forEach", () => {
  it("iterate over an array", () => {
    const arr    = [ 7, 6, 8, 9 ]
    const result = [ ]
    F.forEach((value, i, arr) => result.push({ value, i, arr }), arr)
    assert.deepEqual(result, [
      { value : 7, i : 0, arr },
      { value : 6, i : 1, arr },
      { value : 8, i : 2, arr },
      { value : 9, i : 3, arr }
    ])
  })
  it("iterate over a range", () => {
    const range  = F.range(5, 1)
    const result = [ ]
    F.forEach((value, i, range) => result.push({ value, i, range }), range)
    assert.deepEqual(result, [
      { value : 5, i : 0, range },
      { value : 4, i : 1, range },
      { value : 3, i : 2, range },
      { value : 2, i : 3, range },
      { value : 1, i : 4, range }
    ])
  })
  it("iterate over an object", () => {
    const object = { one : "Uno", two : "Dos", three : "Tres" }
    const result = [ ]
    F.forEach((value, key, object) => result.push({ value, key, object }), object)
    assert.deepEqual(result, [
      { value : "Uno",  key : "one",   object },
      { value : "Dos",  key : "two",   object },
      { value : "Tres", key : "three", object },
    ])
  })
})

describe("filter", () => {
  it("filter array by value", () => {
    const arr = [ 7, -1, 6, -2, 8, 9, -4 ]
    const result = F.filter(value => value < 0, arr)
    assert.deepEqual(result, [ -1, -2, -4 ])
  })
  it("filter array by key", () => {
    const arr = [ 7, -1, 6, -2, 8, 9, -4 ]
    const result = F.filter((value, key) => key % 2, arr)
    assert.deepEqual(result, [ -1, -2, 9 ])
  })
  it("filter object by value", () => {
    const object = { one : "Uno", two : "Dos", three : "Tres" }
    const result = F.filter(value => value.indexOf("s") >= 0, object)
    assert.deepEqual(result, { two : "Dos", three : "Tres" })
  })
  it("filter object by key", () => {
    const object = { one : "Uno", two : "Dos", three : "Tres" }
    const result = F.filter((value, key) => key.indexOf("o") >= 0, object)
    assert.deepEqual(result, { one : "Uno", two : "Dos" })
  })
  it("filter array asynchronously", () => {
    const arr = [ 7, -1, 6, -2, 8, 9, -4 ]
    F.filter(value => Promise.resolve(value < 0), arr)
    .then(result => assert.deepEqual(result, [ -1, -2, -4 ]))
  })
  it("filter array asynchronously, not all conditions asynchronous", () => {
    const arr = [ 7, -1, 6, -2, 8, 9, -4 ]
    F.filter(value => value < 0 || Promise.resolve(false), arr)
    .then(result => assert.deepEqual(result, [ -1, -2, -4 ]))
  })
  it("filter object asynchronously", () => {
    const object = { one : "Uno", two : "Dos", three : "Tres" }
    F.filter(value => Promise.resolve(value.indexOf("s") >= 0), object)
    .then(result => assert.deepEqual(result, { two : "Dos", three : "Tres" }))
  })
  it("filter ES6 set synchronously", () => {
    const set = new Set([ 1, -1, 2, -2, 3, -3 ])
    const result = F.filter(value => value >= 0, set)
    assert.deepEqual(result, new Set([ 1, 2, 3 ]))
  })
  it("filter ES6 set asynchronously", done => {
    const set = new Set([ 1, -1, 2, -2, 3, -3 ])
    F.filter(value => Promise.resolve(value >= 0), set)
    .then(result => assert.deepEqual(result, new Set([ 1, 2, 3 ])))
    .end(done)
  })
  it("filter ES6 map synchronously", () => {
    const set = new Map([
      [ "one", 1 ],
      [ "minusOne", -1 ],
      [ "two", 2 ],
      [ "minusTwo", -2 ],
      [ "three", 3 ],
      [ "minusThree", -3 ]
    ])
    const result = F.filter(value => value >= 0, set)
    assert.ok(result instanceof Map, "fiilter over Map should return Map")
    assert.deepEqual(result, new Map([
      [ "one", 1 ],
      [ "two", 2 ],
      [ "three", 3 ],
    ]))
  })
  it("filter ES6 map asynchronously", done => {
    const set = new Map([
      [ "one", 1 ],
      [ "minusOne", -1 ],
      [ "two", 2 ],
      [ "minusTwo", -2 ],
      [ "three", 3 ],
      [ "minusThree", -3 ]
    ])
    F.filter(value => Promise.resolve(value >= 0), set)
    .then(result => {
      assert.ok(result instanceof Map, "fiilter over Map should return Map")
      assert.deepEqual(result, new Map([
        [ "one", 1 ],
        [ "two", 2 ],
        [ "three", 3 ],
      ]))
    })
    .end(done)
  })
})

describe("map", () => {
  it("map array by value", () => {
    const result = F.map(x => x * 2, [ 1, 2, 3, 4, 5 ])
    assert.deepEqual(result, [ 2, 4, 6, 8, 10 ])
  })
  it("map array by key", () => {
    const result = F.map((value, key) => value * key, [ 1, 2, 3, 4, 5 ])
    assert.deepEqual(result, [ 0, 2, 6, 12, 20 ])
  })
  it("map object by value", () => {
    const result = F.map(x => x * 2, { one : 1, two : 2, three : 3 })
    assert.deepEqual(result, { one : 2, two : 4, three : 6 })
  })
  it("map object by key", () => {
    const result = F.map((value, key) => key, { one : 1, two : 2, three : 3 })
    assert.deepEqual(result, { one : "one", two : "two", three : "three" })
  })
  it("map object by object", () => {
    const result = F.map({
      type      : x => x,
      timestamp : unix => new Date(unix),
      first     : (val, key, object) => object.context.items[0],
      object    : (val, key, object) => object.context.object,
      static    : "static value"
    }, {
      context : {
        items  : [ "ignore", "bad" ],
        object : "structure"
      },
      type      : "object",
      timestamp : 1000
    })
    assert.deepEqual(result, {
      type      : "object",
      timestamp : new Date(1000),
      first     : "ignore",
      object    : "structure",
      static    : "static value"
    })
  })
  it("array + asynchronous callback, synchronize automatically", done => {
    F.map(x => Promise.resolve(x * 2), [ 1, 2, 3, 4, 5 ])
    .then(result => assert.deepEqual(result, [ 2, 4, 6, 8, 10 ]))
    .end(done)
  })
  it("object + asynchronous callback, synchronize automatically", done => {
    F.map(x => Promise.resolve(x * 2), { one : 1, two : 2, three : 3 })
    .then(result => assert.deepEqual(result, { one : 2, two : 4, three : 6 }))
    .end(done)
  })
  it("object + asynchronous object parameters, synchronize automatically", done => {
    F.map({
      type      : x => Promise.resolve(x),
      timestamp : unix => new Date(unix),
      first     : (val, key, object) => object.context.items[0],
      object    : (val, key, object) => object.context.object,
      static    : "static value",
      promised  : Promise.resolve("promised value")
    }, {
      context : {
        items  : [ "ignore", "bad" ],
        object : "structure"
      },
      type      : "object",
      timestamp : 1000
    })
    .then(result => assert.deepEqual(result, {
      type      : "object",
      timestamp : new Date(1000),
      first     : "ignore",
      object    : "structure",
      static    : "static value",
      promised  : "promised value"
    }))
    .end(done)
  })
  it("map over ES6 Set synchronously", () => {
    const result = F.map(x => x * 2, new Set([ 1, 2, 3, 4, 5 ]))
    assert.deepEqual(result, new Set([ 2, 4, 6, 8, 10 ]))
  })
  it("map over ES6 Set asynchronously", done => {
    F.map(x => Promise.resolve(x * 2), new Set([ 1, 2, 3, 4, 5 ]))
    .then(result => assert.deepEqual(result, new Set([ 2, 4, 6, 8, 10 ])))
    .end(done)
  })
  it("map over ES6 Map synchronously", () => {
    const result = F.map(x => x * 2, new Map([
      [ "one", 1 ],
      [ "two", 2 ],
      [ "three", 3 ]
    ]))
    assert.deepEqual(result, new Map([
      [ "one", 2 ],
      [ "two", 4 ],
      [ "three", 6 ]
    ]))
  })
  it("map over ES6 Map asynchronously", done => {
    F.map(x => Promise.resolve(x * 2), new Map([
      [ "one", 1 ],
      [ "two", 2 ],
      [ "three", 3 ]
    ]))
    .then(result => assert.deepEqual(result, new Map([
      [ "one", 2 ],
      [ "two", 4 ],
      [ "three", 6 ]
    ])))
    .end(done)
  })
})

describe("reduce", () => {
  it("sum range", () => {
    const result = F.reduce((prev, cur) => prev + cur, 0, F.range(1, 10))
    assert.strictEqual(result, 55)
  })
  it("key value to object", () => {
    const result = F.reduce((object, arr) => {
      object[arr[0]] = arr[1];
      return object
    },
    { },
    [
      [ 'one',   1 ],
      [ 'two',   2 ],
      [ 'three', 3 ]
    ])
    assert.deepEqual(result, { one : 1, two : 2, three : 3 })
  })
  it("object to key-value", () => {
    const result = F.reduce((arr, value, key) => {
      arr.push([ key, value ]);
      return arr
    },
    [ ],
    {
      'one'   : 1,
      'two'   : 2,
      'three' : 3
    })
    assert.deepEqual(result, [
      [ 'one',   1 ],
      [ 'two',   2 ],
      [ 'three', 3 ]
    ])
  })
  it("sum asynchronous range", done => {
    F.reduce((prev, cur) => Promise.resolve(prev + cur), 0, F.range(1, 10))
    .then(result => assert.strictEqual(result, 55))
    .end(done)
  })
  it("sum object asynchronously", done => {
    F.reduce((prev, cur) => Promise.resolve(prev + cur), 0,
             { one : 1, two : 2, three : 3 })
    .then(result => assert.strictEqual(result, 6))
    .end(done)
  })
})

describe('find', () => {
  it('find element in an array', () => {
    const arr = [ 1, 2, 5, 7 ]
    const result = F.find(a => a > 2, arr)
    assert.strictEqual(result, 5)
  })
  it("find element in an array by key", () => {
    const arr = [ 1, 2, 5, 7 ]
    const result = F.find((a, key) => key === 1, arr)
    assert.strictEqual(result, 2)
  })
  it("find element in object", () => {
    const object = { one : "uno", two : "dos", three : "tres", four : "quatro" }
    const result = F.find(val => val.indexOf('t') >= 0, object)
    assert.strictEqual(result, 'tres')
  })
  it("element in object not found results in undefined", () => {
    const object = { one : "uno", two : "dos", three : "tres", four : "quatro" }
    const result = F.find(val => val.indexOf('x') >= 0, object)
    assert.strictEqual(result, undefined)
  })
  it("find element in object by key", () => {
    const object = { one : "uno", two : "dos", three : "tres", four : "quatro" }
    const result = F.find((val, key) => key.indexOf('t') >= 0, object)
    assert.strictEqual(result, 'dos')
  })
  it("find element in array with asynchronous callback", done => {
    const arr = [ 1, 2, 5, 7 ]
    F.find(a => Promise.resolve(a > 2), arr)
    .then(result => assert.strictEqual(result, 5))
    .end(done)
  })
  it("find element in array with asynchronous callback by key", done => {
    const arr = [ 1, 2, 5, 7 ]
    F.find((value, key) => Promise.resolve(key > 2), arr)
    .then(result => assert.strictEqual(result, 7))
    .end(done)
  })
  it("find element in object with asynchronous callback", done => {
    const object = { one : "uno", two : "dos", three : "tres" }
    F.find(val => Promise.resolve(val.indexOf('t') >= 0), object)
    .then(result => assert.strictEqual(result, 'tres'))
    .end(done)
  })
  it("find element in object by key asynchronously", done => {
    const object = { one : "uno", two : "dos", four : "quatro" }
    F.find((val, key) => Promise.resolve(key.indexOf('t') >= 0), object)
    .then(result => assert.strictEqual(result, 'dos'))
    .end(done)
  })
  it("find element in array sometimes asynchronously", done => {
    const arr = [ 1, 2, 5, 7, 10, 11 ]
    F.find((a, key) => key % 2
                       ? a > 5
                       : Promise.resolve(a > 5), arr)
    .then(result => assert.strictEqual(result, 7))
    .end(done)
  })
  it("find first element in array asynchronously", done => {
    const object = [ 0 ]
    F.find(val => Promise.resolve(val === 0), object)
    .then(result => assert.strictEqual(result, 0))
    .end(done)
  })
  it("element not found should result in undefined", () => {
    const object = [ 1, 2, 3, 4 ]
    const result = F.find(val => val === 0, object)
    assert.strictEqual(result, undefined)
  })
  it("element not found async should resolve in undefined", done => {
    const object = [ 1, 2, 3, 4 ]
    F.find(val => Promise.resolve(val === 0), object)
    .then(result => assert.strictEqual(result, undefined))
    .end(done)
  })
})

describe("some", () => {
  it("no elements in the array", () => {
    const arr = [ 1, 2, 5, 7 ]
    const result = F.some(val => val < 0, arr)
    assert.strictEqual(result, false)
  })
  it("some elements in the array fulfill condition", () => {
    const arr = [ 1, 2, 5, 7, -1, 5 ]
    const result = F.some(val => val < 0, arr)
    assert.strictEqual(result, true)
  })
  it("some elements in array based on key", () => {
    const arr = [ 1, 2, 3, 4, 5 ]
    const result = F.some((val, key) => key === 4, arr)
    assert.strictEqual(result, true)
  })
  it("some elements in array asynchronous asynchronously", done => {
    const arr = [ 1, 2, 5, 7, -1, 10 ]
    F.some(val => Promise.resolve(val < 0), arr)
    .then(result => assert.strictEqual(result, true))
    .end(done)
  })
  it("no elements in the object", () => {
    const obj = { one : 1, two : 2, three : 3 }
    const result = F.some(val => val < 0, obj)
    assert.strictEqual(result, false)
  })
  it("some elements in the object", () => {
    const obj = { one : 1, two : 2, three : 3, minusTwo : -2 }
    const result = F.some(val => val < 0, obj)
    assert.strictEqual(result, true)
  })
  it("some elements in the object based on key", () => {
    const obj = { one : 1, two : 2, three : 3 }
    const result = F.some((val, key) => key.indexOf("e") >= 0, obj)
    assert.strictEqual(result, true)
  })
  it("some elements in the object asynchronously", done => {
    const obj = { one : 1, two : 2, three : 3 }
    F.some(val => Promise.resolve(val >= 0), obj)
    .then(result => assert.strictEqual(result, true))
    .end(done)
  })
  it("some elements in the object asynchronously, not found", done => {
    const obj = { one : 1, two : 2, three : 3 }
    F.some(val => Promise.resolve(val < 0), obj)
    .then(result => assert.strictEqual(result, false))
    .end(done)
  })
  it("some elements in the object asynchronously by key", done => {
    const obj = { one : 1, two : 2, three : 3 }
    F.some((val, key) => Promise.resolve(key.indexOf("h") >= 0), obj)
    .then(result => assert.strictEqual(result, true))
    .end(done)
  })
})

describe("every", () => {
  it("every element in the array synchronously", () => {
    const arr = [ 1, 2, 5, 7, -1, 10 ]
    const result = F.every(val => !isNaN(val), arr)
    assert.strictEqual(result, true)
  })
  it("Not all elements in the array sunchronously", () => {
    const arr = [ 1, 2, 5, 7, -1, NaN, 10 ]
    const result = F.every(val => !isNaN(val), arr)
    assert.strictEqual(result, false)
  })
  it("every elements in array by key", () => {
    const arr = [ 1, 2, 5, 7, -1, NaN, 10 ]
    const result = F.every((val, key) => key <= 6, arr)
    assert.strictEqual(result, true)
  })
  it("Every element in object", () => {
    const obj = { one : 1, two : 2, three : 3 }
    const result = F.every(val => !isNaN(val), obj)
    assert.strictEqual(result, true)
  })
  it("Every element in object by key", () => {
    const obj = { one : 1, two : 2, three : 3 }
    const result = F.every((val, key) => isNaN(key), obj)
    assert.strictEqual(result, true)
  })
  it("every element in the array synchronously", done => {
    const arr = [ 1, 2, 5, 7, -1, 10 ]
    F.every(val => Promise.resolve(!isNaN(val)), arr)
    .then(result => assert.strictEqual(result, true))
    .end(done)
  })
  it("Not all elements in the array sunchronously", done => {
    const arr = [ 1, 2, 5, 7, -1, NaN, 10 ]
    F.every(val => Promise.resolve(!isNaN(val)), arr)
    .then(result => assert.strictEqual(result, false))
    .end(done)
  })
  it("every elements in array by key", done => {
    const arr = [ 1, 2, 5, 7, -1, NaN, 10 ]
    F.every((val, key) => Promise.resolve(key <= 6), arr)
    .then(result => assert.strictEqual(result, true))
    .end(done)
  })
  it("Every element in object", done => {
    const obj = { one : 1, two : 2, three : 3 }
    F.every(val => Promise.resolve(!isNaN(val)), obj)
    .then(result => assert.strictEqual(result, true))
    .end(done)
  })
  it("Every element in object by key", done => {
    const obj = { one : 1, two : 2, three : 3 }
    F.every((val, key) => Promise.resolve(isNaN(key)), obj)
    .then(result => assert.strictEqual(result, true))
    .end(done)
  })
})

describe("match", () => {
  it("match regex", () => {
    const match = F.match(/.json$/)
    assert.strictEqual(match("file.txt"), false)
    assert.strictEqual(match("file.json"), true)
  })
  it("match string", () => {
    const match = F.match("two")
    assert.strictEqual(match("one"), false)
    assert.strictEqual(match("two"), true)
  })
  it("match against array of strings", () => {
    const match = F.match([ "three", "two" ])
    assert.strictEqual(match("one"), false)
    assert.strictEqual(match("two"), true)
  })
  it("match against array of regexes", () => {
    const match = F.match([ /\.json$/, /\.txt$/ ])
    assert.strictEqual(match("file.txt"), true)
    assert.strictEqual(match("file.json"), true)
    assert.strictEqual(match("file.jpg"), false)
  })
  it("match against a custom function", () => {
    const match = F.match(value => value > 0 && value < 100)
    assert.strictEqual(match("file.txt"), false)
    assert.strictEqual(match(-0.0001), false)
    assert.strictEqual(match(Infinity), false)
    assert.strictEqual(match(50), true)
  })
  it("match against a constructor of the object", () => {
    const match = F.match(Array)
    assert.strictEqual(match(Set), false)
    assert.strictEqual(match({ length : 0 }), false)
    assert.strictEqual(match([ Infinity ]), true)
  })
  it("match against String constructor", () => {
    const match = F.match(String)
    assert.strictEqual(match(new Set()), false, "set is not a string")
    assert.strictEqual(match("random string"), true, "string is a string")
    assert.strictEqual(match(NaN), false, "NaN is not a string")
  })
})
