/******************************************************************************/
/**
 * @file :test/every
 * @desc Unit tests for F.every function
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
    .then(() => done()).catch(done)
  })
  it("Not all elements in the array sunchronously", done => {
    const arr = [ 1, 2, 5, 7, -1, NaN, 10 ]
    F.every(val => Promise.resolve(!isNaN(val)), arr)
    .then(result => assert.strictEqual(result, false))
    .then(() => done()).catch(done)
  })
  it("every elements in array by key", done => {
    const arr = [ 1, 2, 5, 7, -1, NaN, 10 ]
    F.every((val, key) => Promise.resolve(key <= 6), arr)
    .then(result => assert.strictEqual(result, true))
    .then(() => done()).catch(done)
  })
  it("Every element in object", done => {
    const obj = { one : 1, two : 2, three : 3 }
    F.every(val => Promise.resolve(!isNaN(val)), obj)
    .then(result => assert.strictEqual(result, true))
    .then(() => done()).catch(done)
  })
  it("Every element in object by key", done => {
    const obj = { one : 1, two : 2, three : 3 }
    F.every((val, key) => Promise.resolve(isNaN(key)), obj)
    .then(result => assert.strictEqual(result, true))
    .then(() => done()).catch(done)
  })
  it("Every element matches pattern", () => {
    const isCollectionOfStrings = F.every(String)
    const result = isCollectionOfStrings([ "one", "two", "three" ])
    assert.strictEqual(result, true)
  })
  it("Not all elements match the pattern", () => {
    const isCollectionOfStrings = F.every(String)
    const result = isCollectionOfStrings([ "one", 2, "three" ])
    assert.strictEqual(result, false)
  })
})
