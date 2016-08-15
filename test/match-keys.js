/******************************************************************************/
/**
 * @file :test/match-keys
 * @desc Unit tests for F.matchKeys function
 * @author Lukasz A.J. Wrona (layv.net)
 * @license MIT
 */
/******************************************************************************/

"use strict"
const F           = require("../index")
const assert      = require("assert")

/******************************************************************************/
/* global describe it */

describe("match keys", () => {
  it("match object's params by regex", () => {
    const object = {
      one   : 1,
      two   : 2,
      three : 3,
    }
    assert.ok(F.matchKeys(/[a-z]+/)(object))
  })
  it("match object's params by regex", () => {
    const object = {
      one   : 1,
      two   : 2,
      three : 3,
      '4'   : 4,
      '5'   : 5,
    }
    assert.ok(!F.matchKeys(/[a-z]+/)(object))
  })
})
