/******************************************************************************/
/**
 * @file :test/reduce
 * @desc Unit tests for F.reduce function
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

describe("reduce", () => {
  it("sum range", () => {
    const result = F.reduce((prev, cur) => prev + cur, 0, F.range(1, 10))
    assert.strictEqual(result, 55)
  })
  it("key value to object", () => {
    const result = F.reduce((object, arr) => {
      object[arr[0]] = arr[1];
      return object
    },
    { },
    [
      [ 'one',   1 ],
      [ 'two',   2 ],
      [ 'three', 3 ]
    ])
    assert.deepEqual(result, { one : 1, two : 2, three : 3 })
  })
  it("object to key-value", () => {
    const result = F.reduce((arr, value, key) => {
      arr.push([ key, value ]);
      return arr
    },
    [ ],
    {
      'one'   : 1,
      'two'   : 2,
      'three' : 3
    })
    assert.deepEqual(result, [
      [ 'one',   1 ],
      [ 'two',   2 ],
      [ 'three', 3 ]
    ])
  })
  it("sum asynchronous range", done => {
    F.reduce((prev, cur) => Promise.resolve(prev + cur), 0, F.range(1, 10))
    .then(result => assert.strictEqual(result, 55))
    .then(() => done()).catch(done)
  })
  it("sum object asynchronously", done => {
    F.reduce((prev, cur) => Promise.resolve(prev + cur), 0,
             { one : 1, two : 2, three : 3 })
    .then(result => assert.strictEqual(result, 6))
    .then(() => done()).catch(done)
  })
  it("reduce stream", done => {
    Promise.resolve(streamArray([ 1, 2, 5, 7 ]))
    .then(F.reduce((count, x) => count + x, 0))
    .then(result => assert.strictEqual(result, 15))
    .then(() => done(), done)
  })
  it("reject if reductor rejects", done => {
    const object = {}
    Promise.resolve(streamArray([ 1, 2, 5, 7 ]))
    .then(F.reduce(() => Promise.reject(object), ""))
    .then(() => done(new Error("Should have rejected")), result => {
      assert.strictEqual(result, object)
      done()
    })
    .catch(done)
  })
})
