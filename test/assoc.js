/******************************************************************************/
/**
 * @file :test/assoc
 * @desc Unit tests for F.assoc function
 * @author Lukasz A.J. Wrona (layv.net)
 * @license MIT
 */
/******************************************************************************/

"use strict"
const F      = require("../index")
const assert = require("assert")

/******************************************************************************/
/* global describe it */

describe("assoc", () => {
  it("merge in value synchronously", () => {
    const mergeInY = F.assoc("y", 13)
    assert.deepEqual(mergeInY({
      x : 5
    }), {
      x : 5,
      y : 13,
    })
  })
  it("should override existing property", () => {
    const mergeInY = F.assoc("y", 13)
    assert.deepEqual(mergeInY({
      x : 5,
      y : -3,
    }), {
      x : 5,
      y : 13,
    })
  })
  it("should synchronize", done => {
    Promise.resolve()
    .then(() => F.assoc("y", Promise.resolve(13), {
      x : 5,
      y : -3,
    }))
    .then(result => assert.deepEqual(result, {
      x : 5,
      y : 13,
    }))
    .then(() => done(), done)
  })
  it("should execute value if function and merge in it's result", () => {
    const mergeInY = F.assoc("y", F("x"))
    assert.deepEqual(mergeInY({
      x : 5
    }), {
      x : 5,
      y : 5
    })
  })
  it("should execute value if function, synchronize and merge in if value returns promise", done => {
    Promise.resolve()
    .then(() => F.assoc("y", object => Promise.resolve(object.x), { x : 5 }))
    .then(result => assert.deepEqual(result, {
      x : 5,
      y : 5,
    }))
    .then(() => done(), done)
  })
})
