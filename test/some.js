/******************************************************************************/
/**
 * @file :test/some
 * @desc Unit tests for F.some function
 * @author Lukasz A.J. Wrona (layv.net)
 * @license MIT
 */
/******************************************************************************/

"use strict"
const F           = require("../index")
const assert      = require("assert")
const streamArray = require("stream-array")

/******************************************************************************/
/* global describe it */

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
  it("some elements in the array do match", () => {
    const arr = [
      { x : 1, y : 2 },
      { x : -1, y : 2 }
    ]
    const result = F.some({
      x : x => x < 0,
      y : y => y > 0
    }, arr)
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
    .then(() => done()).catch(done)
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
    .then(() => done()).catch(done)
  })
  it("some elements in the object asynchronously, not found", done => {
    const obj = { one : 1, two : 2, three : 3 }
    F.some(val => Promise.resolve(val < 0), obj)
    .then(result => assert.strictEqual(result, false))
    .then(() => done()).catch(done)
  })
  it("some elements in the object asynchronously by key", done => {
    const obj = { one : 1, two : 2, three : 3 }
    F.some((val, key) => Promise.resolve(key.indexOf("h") >= 0), obj)
    .then(result => assert.strictEqual(result, true))
    .then(() => done()).catch(done)
  })
})
