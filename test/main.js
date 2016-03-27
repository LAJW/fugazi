"use strict"

const F      = require("../bin/flowless")
const assert = require("assert")

Object.defineProperty(Promise.prototype, 'end', {
  value(done) { this.then(() => done(), done) }
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

  it("Catcher function should catch synchronous errors.", () => {
    const object = { }
    const result = F.compose(result => { if (isNaN(result)) throw object },
                             x => -x,
                             F.catch(err => err))("not a number")
    assert.strictEqual(result, object)
  })

  it("Catcher function should catch asynchronous errors.", () => {
    const object = { }
    F.compose(result => { if (isNaN(result)) throw object },
              x => -x,
              F.catch(err => err))(Promise.resolve("not a number"))
    .then(err => assert.strictEqual(result, object))
  })

})

describe("curry", () => {

  it("synchronous arguments", () => {
    const addMul = F.curry((a, b, c) => {
      return (a + b) * c
    })
    const result = addMul(2)(3)(5)
    assert.strictEqual(result, 25)
  })

  it("asynchronous arguments - detect and await, return promise", done => {
    const addMul = F.curry((a, b, c) => {
      return (a + b) * c
    })
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
    assert.deepEqual(result, [0, 1, 2, 3, 4, 5])
  })
  it("single parameter < 0 => range from 0 descending", () => {
    const result = [ ]
    for (const i of F.range(-5)) {
      result.push(i)
    }
    assert.deepEqual(result, [0, -1, -2, -3, -4, -5])
  })
  it("two parameters, range from min to max ascending", () => {
    const result = [ ]
    for (const i of F.range(5, 10)) {
      result.push(i)
    }
    assert.deepEqual(result, [5, 6, 7, 8, 9, 10])
  })
  it("two parameters, range from max to min descending", () => {
    const result = [ ]
    for (const i of F.range(10, 5)) {
      result.push(i)
    }
    assert.deepEqual(result, [10, 9, 8, 7, 6, 5])
  })
})

describe("forEach", () => {
  it("iterate over an array", () => {
    const arr    = [7, 6, 8, 9]
    const result = [ ]
    F.forEach((value, i, arr) => result.push({ value, i, arr}), arr)
    assert.deepEqual(result, [
      { value: 7, i: 0, arr },
      { value: 6, i: 1, arr },
      { value: 8, i: 2, arr },
      { value: 9, i: 3, arr }
    ])
  })
  it("iterate over a range", () => {
    const range  = F.range(5, 1)
    const result = [ ]
    F.forEach((value, i, range) => result.push({ value, i, range}), range)
    assert.deepEqual(result, [
      { value: 5, i: 0, range },
      { value: 4, i: 1, range },
      { value: 3, i: 2, range },
      { value: 2, i: 3, range },
      { value: 1, i: 4, range }
    ])
  })
  it("iterate over an object", () => {
    const object = { one: "Uno", two: "Dos", three: "Tres" }
    const result = [ ]
    F.forEach((value, key, object) => result.push({ value, key, object}), object)
    assert.deepEqual(result, [
      { value: "Uno",  key: "one",   object },
      { value: "Dos",  key: "two",   object },
      { value: "Tres", key: "three", object },
    ])
  })
})

// TODO: Filter with asynchronous condition
describe("filter", () => {
  it("filter array by value", () => {
    const arr = [7, -1, 6, -2, 8, 9, -4]
    const result = F.filter(value => value < 0, arr)
    assert.deepEqual(result, [-1, -2, -4])
  })
  it("filter array by key", () => {
    const arr = [7, -1, 6, -2, 8, 9, -4]
    const result = F.filter((value, key) => key % 2, arr)
    assert.deepEqual(result, [-1, -2, 9])
  })
  it("filter object by value", () => {
    const object = { one: "Uno", two: "Dos", three: "Tres" }
    const result = F.filter(value => value.indexOf("s") >= 0, object)
    assert.deepEqual(result, { two: "Dos", three: "Tres" })
  })
  it("filter object by key", () => {
    const object = { one: "Uno", two: "Dos", three: "Tres" }
    const result = F.filter((value, key) => key.indexOf("o") >= 0, object)
    assert.deepEqual(result, { one: "Uno", two: "Dos" })
  })
})

// TODO: Autosync at the end if returned through promise
describe("map", () => {
  it("map array by value", () => {
    const result = F.map(x => x * 2, [1, 2, 3, 4, 5])
    assert.deepEqual(result, [2, 4, 6, 8, 10])
  })
  it("map array by key", () => {
    const result = F.map((value, key) => value * key, [1, 2, 3, 4, 5])
    assert.deepEqual(result, [0, 2, 6, 12, 20])
  })
  it("map object by value", () => {
    const result = F.map(x => x * 2, { one: 1, two: 2, three: 3 })
    assert.deepEqual(result, { one: 2, two: 4, three: 6 })
  })
  it("map object by key", () => {
    const result = F.map((value, key) => key, { one: 1, two: 2, three: 3 })
    assert.deepEqual(result, { one: "one", two: "two", three: "three" })
  })
  it("map object by object", () => {
    const result = F.map({
      type:      x => x,
      timestamp: unix => new Date(unix),
      first:     (val, key, object) => object.context.items[0],
      object:    (val, key, object) => object.context.object,
      static:    "static value"
    }, {
      context: {
        items: [ "ignore", "bad" ],
        object: "structure"
      },
      type: "object",
      timestamp: 1000
    })
    assert.deepEqual(result, {
      type:      "object",
      timestamp: new Date(1000),
      first:     "ignore",
      object:    "structure",
      static:    "static value"
    })
  })
})
