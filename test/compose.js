/******************************************************************************/
/**
 * @file :test/compose
 * @desc Unit tests for F.compose function
 * @author Lukasz A.J. Wrona (layv.net)
 * @license MIT
 */
/******************************************************************************/

"use strict"
const F      = require("../index")
const assert = require("assert")

/******************************************************************************/
/* global describe it */

describe("compose", () => {

  it("Simple function, pass in parameters", () => {
    const sum = (a, b) => a + b
    const result = F.compose(sum)(3, 5)
    assert.strictEqual(result, 8)
  })

  it("Length of the resulting function should be equal to the length "
     + "of first function in the chain, allowing for function "
     + "composition", () => {
    const sum = F((a, b) => a + b, parseFloat)
    assert.strictEqual(sum.length, 2)
  })

  it("Supplying composition with not functions or strings should throw "
     + "a TypeError", () => {
    try {
      const sum = (a, b) => a + b
      F.compose(sum, {})
      throw new Error("Should have thrown")
    } catch (error) {
      assert.ok(error && error instanceof TypeError,
                "Error should be an instance of TypeError")
    }
  })

  it("Single function, wait for parameters", done => {
    const sum = (a, b) => a + b
    F.compose(sum)(3, Promise.resolve(5))
    .then(result => assert.strictEqual(result, 8))
    .then(() => done()).catch(done)
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
    .then(() => done()).catch(done)
  })

  it("Chain forward multiple functions, promise function result", done => {
    const sum = a => b => a + b
    const mul = a => b => Promise.resolve(a * b)
    F.compose(sum(10), mul(2), sum(3))(10)
    .then(result => assert.strictEqual(result, 43))
    .then(() => done()).catch(done)
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

describe("catch", () => {

  it("Should throw when not called with a function", () => {
    try {
      F.catch({ })
      throw new Error("Should have thrown")
    } catch (err) {
      assert.ok(err && err instanceof TypeError,
                "Should throw a TypeError")
    }
  })

})
