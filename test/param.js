/******************************************************************************/
/**
 * @file :test/param
 * @desc Unit tests for F.param function
 * @author Lukasz A.J. Wrona (layv.net)
 * @license MIT
 */
/******************************************************************************/

"use strict"
const F      = require("../index")
const assert = require("assert")

/******************************************************************************/
/* global describe it */

describe("param", () => {

  it("return undefined if base object is undefined", () => {
    assert.strictEqual(F.param("one")(undefined), undefined)
  })

  it("get argument from object by key", () => {
    assert.strictEqual(F.param("one", { one : 1 }), 1)
  })

  it("get argument from object by numeric key", () => {
    assert.strictEqual(F.param(3, [ "one", "two", "three", "four" ]), "four")
  })

})
