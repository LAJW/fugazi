/******************************************************************************/
/**
 * Unit test for F.effect
 * @module test/effect
 * @author Lukasz A.J. Wrona (layv.net)
 * @license MIT
 */
/******************************************************************************/
/* global it describe */

"use strict"
const F = require("../index")
const assert = require("assert")

/******************************************************************************/

describe("effect", () => {
  it("synchronous resolve", () => {
    let args
    const set = F.effect((..._args) => {
      args = _args
    })
    assert.strictEqual(set(5, 3), 5, "Should forward first argument, ignoring effect's output")
    assert.deepEqual(args, [ 5, 3 ], "Should execute internal function with all supplied arguments")
  })
  it("synchronous reject", () => {
    const obj = { }
    const reject = F.effect(() => {
      throw obj
    })
    try {
      reject()
      assert.ok(false, "Should have thrown")
    } catch (err) {
      assert.strictEqual(err, obj)
    }
  })
  it("asynchronous resolve", () => {
    let args
    const set = F.effect((..._args) =>
                         Promise.resolve(_args)
                         .then(_args => {
                           args = _args
                         }))
    return set(5, 3)
    .then(result => {
      assert.strictEqual(result, 5, "Should forward first argument")
      assert.deepEqual(args, [ 5, 3 ])
    })
  })
  it("wait for arguments to resolve", () => {
    let args
    const set = F.effect((..._args) => {
      args = _args
    })
    return set(
      Promise.resolve(5),
      Promise.resolve(3)
    ).then(result => {
      assert.strictEqual(result, 5, "Should forward first argument, ignoring effect's output")
      assert.deepEqual(args, [ 5, 3 ], "Should execute internal function with all supplied arguments")
    })
  })
  it("asynchronous reject", () => {
    const obj = { }
    const reject = F.effect(() => Promise.resolve(obj).then(obj => {
      throw obj
    }))
    return reject(5, 3)
    .then(() => {
      throw new Error("Should have thrown")
    })
    .catch(err => {
      assert.strictEqual(err, obj)
    })
  })
})
