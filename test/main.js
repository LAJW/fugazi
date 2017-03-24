/******************************************************************************/
/**
 * @file :test/main
 * @desc Unit tests for main Fugazi function (F) and other
 * miscelanious helpers
 * @author Lukasz A.J. Wrona (layv.net)
 * @license MIT
 */
/******************************************************************************/

"use strict"
const F           = require("../index")
const assert      = require("assert")

/******************************************************************************/
/* global describe it */

describe("F", () => {

  it("enable currying when provided with a single function", () => {
    const sum3 = F((a, b, c) => a + b + c)
    assert.strictEqual(sum3(1)(2, 3), 6);
    assert.strictEqual(sum3(1, 2, 3), 6);
    assert.strictEqual(sum3(1)(2)(3), 6);
  })

  it("single param => create function extracting param", () => {
    const extract = F("param")
    assert.strictEqual(extract({ param : "param's value" }),
                       "param's value")
  })

  it("F param should return udefined if param isn't found", () => {
    const extract = F("param")
    assert.strictEqual(extract({ }), undefined)
  })

  it("combine multiple params for deep crawling", () => {
    const extract = F(0, "param")
    assert.strictEqual(extract([ { param : "param's value" } ]),
                       "param's value")
  })

})

describe("F.F", () => {
  it("compose and immediately apply", () => {
    const result = F.F(1, 2, 3)(
      (x, y, z) => x + y + z,
      x => x * 2
    )
    assert.strictEqual(result, 12)
  })
  it("work with strings and numbers", () => {
    const object = {
      deeply : {
        nested : {
          property : { }
        }
      }
    }
    const result = F.F(object)(
      "deeply",
      "nested",
      "property"
    )
    assert.strictEqual(result, object.deeply.nested.property)
  })
})
