/******************************************************************************/
/**
 * @file :test/match-loose
 * @desc Unit tests for F.matchLoose function
 * @author Lukasz A.J. Wrona (layv.net)
 * @license MIT
 */
/******************************************************************************/

"use strict"
const F           = require("../index")
const assert      = require("assert")

/******************************************************************************/
/* global describe it */

describe("match loose", () => {
  it("match object, ignore extra properties", () => {
    const object = {
      x    : 1,
      y    : 0,
      z    : -1,
      meta : "text",
    }
    assert.ok(F.matchLoose({
      x : Number,
      y : Number,
      z : Number,
    })(object))
  })
  it("match object, ignore extra properties", () => {
    const object = {
      x    : 1,
      y    : 0,
      z    : -1,
      meta : "text",
    }
    assert.ok(F.matchLoose({
      x : Number,
      y : Number,
      z : Number,
    })(object))
  })
  it("match properties deeply", () => {
    const object = {
      pos : {
        x    : 1,
        y    : 0,
        z    : -1,
        meta : "another meta"
      },
      meta : "text",
    }
    assert.ok(F.matchLoose({
      pos : {
        x : Number,
        y : Number,
        z : Number,
      }
    })(object))
  })
  it("detect incorrect property that was defined", () => {
    const object = {
      pos : {
        x    : 1,
        y    : "definitely not a number",
        z    : -1,
        meta : "another meta"
      },
      meta : "text",
    }
    assert.ok(!F.matchLoose({
      pos : {
        x : Number,
        y : Number,
        z : Number,
      }
    })(object))
  })
  it("make properties optional with undefined", () => {
    const object = {
      x : 16,
    }
    assert.strictEqual(F.match({
      x : [ Number, undefined ],
      y : [ Number, undefined ],
    })(object), true)
  })
})
