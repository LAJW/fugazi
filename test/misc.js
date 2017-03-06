/******************************************************************************/
/**
 * @file :test/misc
 * @desc Unit tests for small miscelanious functions
 * @author Lukasz A.J. Wrona (layv.net)
 * @license MIT
 */
/******************************************************************************/

"use strict"
const F      = require("../index")
const assert = require("assert")

/******************************************************************************/
/* global describe it */

describe("misc", () => {
  describe("rejector", () => {
    it("Should throw an error when called", () => {
      const object = { }
      const reject = F.rejector(object)
      try {
        reject()
        throw new Error("Should've thrown")
      } catch (error) {
        assert.strictEqual(error, object, "Rejector should've thrown")
      }
    })
  })
  describe("resolver", () => {
    it("Should create a function returning a value", () => {
      const object = { }
      assert.strictEqual(F.resolver(object)(), object)
    })
  })
  describe("param", () => {
    it("should return a property of an object", () => {
      const object = { key : { } }
      assert.strictEqual(F.param("key", object), object.key)
    })
    it("should return undefined if supplied with non object", () => {
      assert.strictEqual(F.param("key", null), undefined)
    })
  })
  describe("maths", () => {
    it("gt", () => {
      assert.strictEqual(F.gt(3, 5), true)
    })
    it("gte", () => {
      assert.strictEqual(F.gte(3, 5), true)
    })
    it("lt", () => {
      assert.strictEqual(F.lt(5, 3), true)
    })
    it("lte", () => {
      assert.strictEqual(F.lte(5, 3), true)
    })
  })
})
