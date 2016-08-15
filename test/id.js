/******************************************************************************/
/**
 * @file :test/id
 * @desc Unit tests for F.id function
 * @author Lukasz A.J. Wrona (layv.net)
 * @license MIT
 */
/******************************************************************************/

"use strict"
const F      = require("../index")
const assert = require("assert")

/******************************************************************************/
/* global describe it */

describe("id", () => {
  it("should pass value unchanged", () => {
    const object = { }
    const result = F.id(object)
    assert.strictEqual(result, object)
  })
})
