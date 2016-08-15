/******************************************************************************/
/**
 * @file :test/filter
 * @desc Unit tests for F.filter function
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
  it("filter array by match", () => {
    const arr = [ "one", "two", "three", "four", "five" ]
    const result = F.filter(/o/g, arr)
    assert.deepEqual(result, [ "one", "two", "four" ])
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
    .then(() => done()).catch(done)
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
    .then(() => done()).catch(done)
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
    .then(() => done()).catch(done)
  })
  it("filter stream", done => {
    Promise.resolve(streamArray([ "1", "2", "3", "4", "5", "6" ]))
    .then(F.filter(x => (parseInt(x.toString()) + 1) % 2))
    .then(F.reduce((arr, x) => {
      arr.push(x.toString())
      return arr
    }, [ ]))
    .then(result => assert.deepEqual(result, [ "2", "4", "6" ]))
    .then(() => done(), done)
  })
  it("re-throw stream filter error", done => {
    const object = { }
    Promise.resolve(streamArray([ "1", "2", "3", "4", "5", "6" ]))
    .then(F.filter(x => {
      if (parseInt(x) > 4) {
        throw object
      }
      return x
    }))
    .then(F.reduce((arr, x) => {
      arr.push(x.toString())
      return arr
    }, [ ]))
    .then(() => done(new Error("Should have thrown")),
          error => {
            assert.strictEqual(error, object)
            done()
          }
    )
    .catch(done)
  })
  it("filter async callback", done => {
    Promise.resolve(streamArray([ "1", "2", "3", "4", "5", "6" ]))
    .then(F.filter(x => Promise.resolve((parseInt(x.toString()) + 1) % 2)))
    .then(F.reduce((arr, x) => {
      arr.push(x.toString())
      return arr
    }, [ ]))
    .then(result => assert.deepEqual(result, [ "2", "4", "6" ]))
    .then(() => done(), done)
  })
})
