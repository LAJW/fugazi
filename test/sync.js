/******************************************************************************/
/**
 * @file :test/sync
 * @desc Unit tests for F.sync function
 * @author Lukasz A.J. Wrona (layv.net)
 * @license MIT
 */
/******************************************************************************/

"use strict"
const F      = require("../index")
const assert = require("assert")

/******************************************************************************/
/* global describe it */

describe("sync", () => {
  it("should pass non-promise values unchanged", done => {
    Promise.resolve()
    .then(() => F.sync([ "one", "two" ]))
    .then(result => assert.deepEqual(result, [ "one", "two" ]))
    .then(() => done(), done)
  })
  it("should convert array of promises into a promise resolving to array of values", done => {
    Promise.resolve()
    .then(() => F.sync([ Promise.resolve("one"), Promise.resolve("two") ]))
    .then(result => assert.deepEqual(result, [ "one", "two" ]))
    .then(() => done(), done)
  })
  it("should convert object literal containing promises into a promise resolving to object literal of values", done => {
    Promise.resolve()
    .then(() => F.sync({
      one : Promise.resolve("one"),
      two : Promise.resolve("two"),
    }))
    .then(result => assert.deepEqual(result, {
      one : "one",
      two : "two"
    }))
    .then(() => done(), done)
  })
})
