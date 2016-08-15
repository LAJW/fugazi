/******************************************************************************/
/**
 * @file :test/range
 * @desc Unit tests for F.range function
 * @author Lukasz A.J. Wrona (layv.net)
 * @license MIT
 */
/******************************************************************************/

"use strict"
const F           = require("../index")
const assert      = require("assert")

/******************************************************************************/
/* global describe it */


describe("range", () => {
  it("single parameter > 0 => range from 0 ascending", () => {
    const result = [ ]
    for (const i of F.range(5)) {
      result.push(i)
    }
    assert.deepEqual(result, [ 0, 1, 2, 3, 4, 5 ])
  })
  it("single parameter < 0 => range from 0 descending", () => {
    const result = [ ]
    for (const i of F.range(-5)) {
      result.push(i)
    }
    assert.deepEqual(result, [ 0, -1, -2, -3, -4, -5 ])
  })
  it("two parameters, range from min to max ascending", () => {
    const result = [ ]
    for (const i of F.range(5, 10)) {
      result.push(i)
    }
    assert.deepEqual(result, [ 5, 6, 7, 8, 9, 10 ])
  })
  it("two parameters, range from max to min descending", () => {
    const result = [ ]
    for (const i of F.range(10, 5)) {
      result.push(i)
    }
    assert.deepEqual(result, [ 10, 9, 8, 7, 6, 5 ])
  })
})

