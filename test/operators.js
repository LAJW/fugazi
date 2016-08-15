/******************************************************************************/
/**
 * @file :test/operators
 * @desc Unit tests for F.and, F.or, F.gt, F.eq and other
 * mathematical and logical operators
 * @author Lukasz A.J. Wrona (layv.net)
 * @license MIT
 */
/******************************************************************************/

"use strict"
const F           = require("../index")
const assert      = require("assert")

/******************************************************************************/
/* global describe it */

describe("operators", () => {
  describe("and", () => {
    it("and synchronous => true", () => {
      const result = F.and(x => x > 0, x => x < 5)(3)
      assert.strictEqual(result, true)
    })
    it("and synchronous => false", () => {
      const result = F.and(x => x > 0, x => x < 5)(7)
      assert.strictEqual(result, false)
    })
    it("and asynchronous => true", done => {
      Promise.resolve()
      .then(() => F.and(x => x > 0, x => Promise.resolve(x < 5))(3))
      .then(result => assert.strictEqual(result, true))
      .then(() => done(), done)
    })
    it("and with patterns", () => {
      const singleCase = F.and(/^[a-z]+$/, /oo/i)
      assert.strictEqual(singleCase("foobar"), true)
      assert.strictEqual(singleCase("bar"), false)
      assert.strictEqual(singleCase("FOOBAR"), false)
    })
    it("and, multiple arguments", () => {
      const isInt1To5 = F.and(x => x > 1, x => x < 5, x => x === Math.floor(x))
      assert.strictEqual(isInt1To5(3), true)
      assert.strictEqual(isInt1To5(-1), false)
      assert.strictEqual(isInt1To5(3.5), false)
    })
    it("match, composed function bug", () => {
      const result = F.and(
        F("true", F.eq(true)),
        F("false", F.eq(false))
      )({ true : true, false : false })
      assert.strictEqual(result, true)
    })
  })
  describe("or", () => {
    it("or synchronous => true", () => {
      const result = F.or(x => x > 5, x => x < 0)(-1)
      assert.strictEqual(result, true)
    })
    it("or synchronous => false", () => {
      const result = F.or(x => x > 5, x => x < 0)(3)
      assert.strictEqual(result, false)
    })
    it("or asynchronous => true", done => {
      Promise.resolve()
      .then(() => F.or(x => x > 5, x => Promise.resolve(x < 0))(-1))
      .then(result => assert.strictEqual(result, true))
      .then(() => done(), done)
    })
    it("or asynchronous => false", done => {
      Promise.resolve()
      .then(() => F.or(x => x > 5, x => Promise.resolve(x < 0))(3))
      .then(result => assert.strictEqual(result, false))
      .then(() => done(), done)
    })
    it("or with patterns", () => {
      const singleCase = F.or(/^[a-z]+$/, /^[A-Z]+$/)
      assert.strictEqual(singleCase("foobar"), true)
      assert.strictEqual(singleCase("FOOBAR"), true)
      assert.strictEqual(singleCase("FooBar"), false)
    })
  })
  describe("not", () => {
    it("synchronous", () => {
      const result = F.not(false)
      assert.strictEqual(result, true)
    })
    it("asynchronous", done => {
      Promise.resolve()
      .then(() => F.not(Promise.resolve(false)))
      .then(result => assert.strictEqual(result, true))
      .then(() => done(), done)
    })
  })
  describe("eq", () => {
    it("synchronous => true", () => {
      const result = F.eq(1, 1)
      assert.strictEqual(result, true)
    })
    it("synchronous => true", () => {
      const result = F.eq(1, "1")
      assert.strictEqual(result, false)
    })
    it("synchronous => false", () => {
      const result = F.eq(1, 2)
      assert.strictEqual(result, false)
    })
    it("asynchronous => true", done => {
      Promise.resolve()
      .then(() => F.eq(Promise.resolve(1), Promise.resolve(1)))
      .then(result => assert.strictEqual(result, true))
      .then(() => done(), done)
    })
    it("asynchronous => false", done => {
      Promise.resolve()
      .then(() => F.eq(Promise.resolve(1), Promise.resolve("1")))
      .then(result => assert.strictEqual(result, false))
      .then(() => done(), done)
    })
  })
  describe("eqv", () => {
    it("synchronous => true", () => {
      const result = F.eqv(1, "1")
      assert.strictEqual(result, true)
    })
    it("synchronous => false", () => {
      const result = F.eqv(1, 2)
      assert.strictEqual(result, false)
    })
    it("asynchronous => true", done => {
      Promise.resolve()
      .then(() => F.eqv(Promise.resolve(1), Promise.resolve(true)))
      .then(result => assert.strictEqual(result, true))
      .then(() => done(), done)
    })
    it("asynchronous => false", done => {
      Promise.resolve()
      .then(() => F.eqv(Promise.resolve(1), Promise.resolve(2)))
      .then(result => assert.strictEqual(result, false))
      .then(() => done(), done)
    })
  })
})
