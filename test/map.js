/******************************************************************************/
/**
 * @file :test/map
 * @desc Unit tests for F.map function
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
  it("array + asynchronous callback, synchronize automatically", done => {
    F.map(x => Promise.resolve(x * 2), [ 1, 2, 3, 4, 5 ])
    .then(result => assert.deepEqual(result, [ 2, 4, 6, 8, 10 ]))
    .then(() => done()).catch(done)
  })
  it("object + asynchronous callback, synchronize automatically", done => {
    F.map(x => Promise.resolve(x * 2), { one : 1, two : 2, three : 3 })
    .then(result => assert.deepEqual(result, { one : 2, two : 4, three : 6 }))
    .then(() => done()).catch(done)
  })
  it("map over ES6 Set synchronously", () => {
    const result = F.map(x => x * 2, new Set([ 1, 2, 3, 4, 5 ]))
    assert.deepEqual(result, new Set([ 2, 4, 6, 8, 10 ]))
  })
  it("map over ES6 Set asynchronously", done => {
    F.map(x => Promise.resolve(x * 2), new Set([ 1, 2, 3, 4, 5 ]))
    .then(result => assert.deepEqual(result, new Set([ 2, 4, 6, 8, 10 ])))
    .then(() => done()).catch(done)
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
    .then(() => done()).catch(done)
  })
  it("map stream", done => {
    Promise.resolve(streamArray([ "1", "2", "3", "4", "5", "6" ]))
    .then(F.map(x => (parseInt(x.toString()) * 2).toString()))
    .then(F.reduce((arr, x) => {
      arr.push(x.toString())
      return arr
    }, [ ]))
    .then(result => assert.deepEqual(result, [ "2", "4", "6", "8", "10", "12" ]))
    .then(() => done(), done)
  })
  it("map stream", done => {
    Promise.resolve(streamArray([ "1", "2", "3", "4", "5", "6" ]))
    .then(F.map(x => Promise.resolve((parseInt(x.toString()) * 2).toString())))
    .then(F.reduce((arr, x) => {
      arr.push(x.toString())
      return arr
    }, [ ]))
    .then(result => assert.deepEqual(result, [ "2", "4", "6", "8", "10", "12" ]))
    .then(() => done(), done)
  })
  it("map stream error handling", done => {
    const object = {}
    Promise.resolve(streamArray([ "1", "2", "3", "4", "5", "6" ]))
    .then(F.map(() => Promise.reject(object)))
    .then(F.reduce((arr, x) => {
      arr.push(x.toString())
      return arr
    }, [ ]))
    .then(() => done(new Error("Should have rejected")))
    .catch(error => {
      assert.strictEqual(error, object)
      done()
    })
    .catch(done)
  })
})
