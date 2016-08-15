/******************************************************************************/
/**
 * @file :test/filter-keys
 * @desc Unit tests for F.filterKeys function
 * @author Lukasz A.J. Wrona (layv.net)
 * @license MIT
 */
/******************************************************************************/

"use strict"
const F           = require("../index")
const assert      = require("assert")

/******************************************************************************/
/* global describe it */

describe("filterKeys", () => {
  it("array predicate, filter out object", () => {
    const object = { x : 5, y : 3, z : 1 }
    const result = F.filterKeys([ "x", "y" ], object)
    assert.deepEqual(result, { x : 5, y : 3 })
  })
  it("array predicate, filter out map", () => {
    const object = new Map([
      [ "x", 5 ],
      [ "y", 3 ],
      [ "z", 1 ],
    ])
    const result = F.filterKeys([ "x", "y" ], object)
    assert.deepEqual(result, new Map([
      [ "x", 5 ],
      [ "y", 3 ],
    ]))
  })
  it("function predicate, filter out odd keys", () => {
    const arr = [ "zero", "one", "two", "three", "four", "five" ]
    const result = F.filterKeys(x => !(x % 2), arr)
    assert.deepEqual(result, [ "zero", "two", "four" ])
  })
})
