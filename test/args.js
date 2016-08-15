/******************************************************************************/
/**
 * @file :test/args
 * @desc Unit tests for fugazi
 * @author Lukasz A.J. Wrona (layv.net)
 * @license MIT
 */
/******************************************************************************/

"use strict"
const F      = require("../index")
const assert = require("assert")

/******************************************************************************/
/* global describe it */

describe("args", () => {
  it("return passed in arguments", () => {
    const args = F.args("one", "two", "three", "four")
    assert.deepEqual(args, [ "one", "two", "three", "four" ])
  })
  it("return passed in arguments, wait for asynchronous ones", () => {
    F.args("one", Promise.resolve("two"), "three", Promise.resolve("four"))
    .then(args => assert.deepEqual(args, [ "one", "two", "three", "four" ]))
  })
})

