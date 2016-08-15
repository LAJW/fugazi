/******************************************************************************/
/**
 * @file :test/merge
 * @desc Unit tests for F.merge function
 * @author Lukasz A.J. Wrona (layv.net)
 * @license MIT
 */
/******************************************************************************/

"use strict"
const F           = require("../index")
const assert      = require("assert")

/******************************************************************************/
/* global describe it */

describe("merge", () => {
  it("merge two objects", () => {
    const result = F.merge({ one : "1" }, { two : "2" })
    assert.deepEqual(result, {
      one : "1",
      two : "2"
    })
  })
  it("merge two objects, curried", () => {
    const result = F.merge({ one : "1" })({ two : "2" })
    assert.deepEqual(result, {
      one : "1",
      two : "2"
    })
  })
  it("merge two promises resolving to objects", done => {
    F.merge(
      Promise.resolve({ one : "1" }),
      Promise.resolve({ two : "2" })
    )
    .then(result => {
      assert.deepEqual(result, {
        one : "1",
        two : "2"
      })
    })
    .then(() => done())
    .catch(done)
  })
  it("merge object with function result", () => {
    const result = F.merge(() => ({ one : "1" }), { two : "2" })
    assert.deepEqual(result, {
      one : "1",
      two : "2"
    })
  })
  it("merge object with asynchronous function result", done => {
    F.merge(
      () => Promise.resolve({ one : "1" }),
      { two : "2" }
    )
    .then(result => {
      assert.deepEqual(result, {
        one : "1",
        two : "2"
      })
    })
    .then(() => done())
    .catch(done)
  })
})
