/******************************************************************************/
/**
 * @file :test/find
 * @desc Unit tests for F.find function
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

describe('find', () => {
  it('find element in an array', () => {
    const arr = [ 1, 2, 5, 7 ]
    const result = F.find(a => a > 2, arr)
    assert.strictEqual(result, 5)
  })
  it("find element in an array by key", () => {
    const arr = [ 1, 2, 5, 7 ]
    const result = F.find((a, key) => key === 1, arr)
    assert.strictEqual(result, 2)
  })
  it("find element in array by match", () => {
    const arr = [ 1, 2, 5, 7 ]
    const result = F.find([ 0, 2, 3 ], arr)
    assert.strictEqual(result, 2)
  })
  it("find element in object", () => {
    const object = { one : "uno", two : "dos", three : "tres", four : "quatro" }
    const result = F.find(val => val.indexOf('t') >= 0, object)
    assert.strictEqual(result, 'tres')
  })
  it("element in object not found results in undefined", () => {
    const object = { one : "uno", two : "dos", three : "tres", four : "quatro" }
    const result = F.find(val => val.indexOf('x') >= 0, object)
    assert.strictEqual(result, undefined)
  })
  it("find element in object by key", () => {
    const object = { one : "uno", two : "dos", three : "tres", four : "quatro" }
    const result = F.find((val, key) => key.indexOf('t') >= 0, object)
    assert.strictEqual(result, 'dos')
  })
  it("find element in array with asynchronous callback", done => {
    const arr = [ 1, 2, 5, 7 ]
    F.find(a => Promise.resolve(a > 2), arr)
    .then(result => assert.strictEqual(result, 5))
    .then(() => done()).catch(done)
  })
  it("find element in array with asynchronous callback by key", done => {
    const arr = [ 1, 2, 5, 7 ]
    F.find((value, key) => Promise.resolve(key > 2), arr)
    .then(result => assert.strictEqual(result, 7))
    .then(() => done()).catch(done)
  })
  it("find element in object with asynchronous callback", done => {
    const object = { one : "uno", two : "dos", three : "tres" }
    F.find(val => Promise.resolve(val.indexOf('t') >= 0), object)
    .then(result => assert.strictEqual(result, 'tres'))
    .then(() => done()).catch(done)
  })
  it("find element in object by key asynchronously", done => {
    const object = { one : "uno", two : "dos", four : "quatro" }
    F.find((val, key) => Promise.resolve(key.indexOf('t') >= 0), object)
    .then(result => assert.strictEqual(result, 'dos'))
    .then(() => done()).catch(done)
  })
  it("find element in array sometimes asynchronously", done => {
    const arr = [ 1, 2, 5, 7, 10, 11 ]
    F.find((a, key) => key % 2
                       ? a > 5
                       : Promise.resolve(a > 5), arr)
    .then(result => assert.strictEqual(result, 7))
    .then(() => done()).catch(done)
  })
  it("find first element in array asynchronously", done => {
    const object = [ 0 ]
    F.find(val => Promise.resolve(val === 0), object)
    .then(result => assert.strictEqual(result, 0))
    .then(() => done()).catch(done)
  })
  it("element not found should result in undefined", () => {
    const object = [ 1, 2, 3, 4 ]
    const result = F.find(val => val === 0, object)
    assert.strictEqual(result, undefined)
  })
  it("element not found async should resolve in undefined", done => {
    const object = [ 1, 2, 3, 4 ]
    F.find(val => Promise.resolve(val === 0), object)
    .then(result => assert.strictEqual(result, undefined))
    .then(() => done()).catch(done)
  })
  it("find element in Map", () => {
    const map = new Map([
      [ "one", "uno" ],
      [ "two", "dos" ],
      [ "three", "tres" ],
      [ "four", "quatro" ],
    ])
    const result = F.find(val => val.indexOf('t') >= 0, map)
    assert.strictEqual(result, 'tres')
  })
  it("element in Map not found results in undefined", () => {
    const map = new Map([
      [ "one", "uno" ],
      [ "two", "dos" ],
      [ "three", "tres" ],
      [ "four", "quatro" ],
    ])
    const result = F.find(val => val.indexOf('x') >= 0, map)
    assert.strictEqual(result, undefined)
  })
  it("find element in Map by key", () => {
    const map = new Map([
      [ "one", "uno" ],
      [ "two", "dos" ],
      [ "three", "tres" ],
      [ "four", "quatro" ],
    ])
    const result = F.find((val, key) => key.indexOf('t') >= 0, map)
    assert.strictEqual(result, 'dos')
  })
  it("find element in map with asynchronous callback", done => {
    const map = new Map([
      [ "one", "uno" ],
      [ "two", "dos" ],
      [ "three", "tres" ],
    ])
    F.find(val => Promise.resolve(val.indexOf('t') >= 0), map)
    .then(result => assert.strictEqual(result, 'tres'))
    .then(() => done()).catch(done)
  })
  it('find element in set', () => {
    const set = new Set([ 1, 2, 5, 7 ])
    const result = F.find(a => a > 5, set)
    assert.strictEqual(result, 7)
  })
  it("find in stream", done => {
    Promise.resolve(streamArray([ "1", "2", "3", "4", "5", "6" ]))
    .then(F.find(x => parseInt(x.toString()) > 2.5))
    .then(result => assert.strictEqual(result, "3"))
    .then(() => done(), done)
  })
  it("find in stream with async callback", done => {
    Promise.resolve(streamArray([ "1", "2", "3", "4", "5", "6" ]))
    .then(F.find(x => Promise.resolve(parseInt(x.toString()) > 2.5)))
    .then(result => assert.strictEqual(result, "3"))
    .then(() => done(), done)
  })
  it("error handling in stream find", done => {
    const object = { }
    Promise.resolve(streamArray([ "1", "2", "3", "4", "5", "6" ]))
    .then(F.find(() => Promise.reject(object)))
    .then(result => assert.strictEqual(result, "3"))
    .then(() => done(new Error("Should have rejected")))
    .catch(err => {
      assert.strictEqual(err, object)
      done()
    })
    .catch(done)
  })
})
