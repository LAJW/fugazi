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
