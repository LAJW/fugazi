/******************************************************************************/
/**
 * @file :test/for-each
 * @desc Unit tests for F.forEach function
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

describe("forEach", () => {
  it("iterate over an array", () => {
    const arr    = [ 7, 6, 8, 9 ]
    const result = [ ]
    F.forEach((value, i, arr) => result.push({ value, i, arr }), arr)
    assert.deepEqual(result, [
      { value : 7, i : 0, arr },
      { value : 6, i : 1, arr },
      { value : 8, i : 2, arr },
      { value : 9, i : 3, arr }
    ])
  })
  it("iterate over a range", () => {
    const range  = F.range(5, 1)
    const result = [ ]
    F.forEach((value, i, range) => result.push({ value, i, range }), range)
    assert.deepEqual(result, [
      { value : 5, i : 0, range },
      { value : 4, i : 1, range },
      { value : 3, i : 2, range },
      { value : 2, i : 3, range },
      { value : 1, i : 4, range }
    ])
  })
  it("iterate over an object", () => {
    const object = { one : "Uno", two : "Dos", three : "Tres" }
    const result = [ ]
    F.forEach((value, key, object) => result.push({ value, key, object }), object)
    assert.deepEqual(result, [
      { value : "Uno",  key : "one",   object },
      { value : "Dos",  key : "two",   object },
      { value : "Tres", key : "three", object },
    ])
  })
  it("iterate over stream", done => {
      const stream = streamArray([ "one", "two", "three", "four" ])
      const result = [ ]
      F.forEach(chunk => result.push(chunk), stream)
      // forEach is side-effect function, we don't care when it finishes
      setTimeout(() => {
        try {
          assert.deepEqual(result, [
            "one",
            "two",
            "three",
            "four",
          ])
          done()
        } catch (err) {
          done(err)
        }
      }, 250)
  })
})
