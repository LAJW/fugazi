/******************************************************************************/
/**
 * @file :test/curry
 * @desc Unit tests for F.curry
 * @author Lukasz A.J. Wrona (layv.net)
 * @license MIT
 */
/******************************************************************************/

"use strict"
const F      = require("../index")
const assert = require("assert")

/******************************************************************************/
/* global describe it */


describe("curry", () => {

  it("Should throw when not called with a function", () => {
    try {
      F.curry({ })
      throw new Error("Should have thrown")
    } catch (err) {
      assert.ok(err && err instanceof TypeError,
                "Should throw a TypeError")
    }
  })

  it("curryN Should throw when not called with a function", () => {
    try {
      F.curryN(5, { })
      throw new Error("Should have thrown")
    } catch (err) {
      assert.ok(err && err instanceof TypeError,
                "Should throw a TypeError")
    }
  })

  it("curryN Should throw when not called with an unsigned integer", () => {
    try {
      F.curryN(4.3, Math.pow)
      throw new Error("Should have thrown")
    } catch (err) {
      assert.ok(err && err instanceof TypeError,
                "Should throw a TypeError")
    }
  })

  it("synchronous arguments", () => {
    const addMul = F.curry((a, b, c) => (a + b) * c)
    const result = addMul(2)(3)(5)
    assert.strictEqual(result, 25)
  })

  it("asynchronous arguments - detect and await, return promise", done => {
    const addMul = F.curry((a, b, c) => (a + b) * c)
    addMul(2, Promise.resolve(3))(5)
    .then(result => assert.strictEqual(result, 25))
    .then(() => done()).catch(done)
  })

  it("curry with placeholders", () => {
    const push = F.curry((obj, arr) => [ ...arr, obj ])
    const pushInto = push(F._, [ 1, 2, 3 ])
    assert.deepEqual(pushInto(4), [ 1, 2, 3, 4 ])
  })
})
