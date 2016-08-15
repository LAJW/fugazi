/******************************************************************************/
/**
 * @file :test/if-else
 * @desc Unit tests for F.ifElse function
 * @author Lukasz A.J. Wrona (layv.net)
 * @license MIT
 */
/******************************************************************************/

"use strict"
const F      = require("../index")
const assert = require("assert")

/******************************************************************************/
/* global describe it */

describe("ifElse", () => {
  it("synchronous condition", () => {
    const abs = F.ifElse(a => a >= 0, a => a, a => a * -1)
    assert.strictEqual(abs(5), 5)
    assert.strictEqual(abs(-3), 3)
  })
  it("synchronous condition, else optional", () => {
    const first = F.ifElse(a => a && a.length, a => a[0])
    assert.strictEqual(first([ 5, 4, 3 ]), 5)
    assert.strictEqual(first(undefined), undefined)
  })
  it("condition if not function should apply to F.match rules", () => {
    const startsWithWAT = F.ifElse(/^WAT/, "starts with WAT", "WATLess")
    assert.strictEqual(startsWithWAT("WAT's up"), "starts with WAT")
    assert.strictEqual(startsWithWAT("nah"), "WATLess")
  })
  it("asyncrhonous condition", done => {
    const abs = F.ifElse(a => Promise.resolve(a >= 0), a => a, a => a * -1)
    abs(5).then(result => assert.strictEqual(result, 5))
    .then(() => abs(-3).then(result => assert.strictEqual(result, 3)))
    .then(() => done()).catch(done)
  })
  it("asynchronous condition, else optional", done => {
    const first = F.ifElse(a => Promise.resolve(a && a.length), a => a[0])
    first([ 5, 4, 3 ])
    .then(result => assert.strictEqual(result, 5))
    .then(() => first(undefined))
    .then(result => assert.strictEqual(result, undefined))
    .then(() => done()).catch(done)
  })
  it("if then elseif then else then", () => {
    const sgn = F.ifElse(a => a > 0,
                         () => 1,

                         a => a < 0,
                         () => -1,

                         () => 0)
    assert.strictEqual(sgn(5), 1)
    assert.strictEqual(sgn(-3), -1)
    assert.strictEqual(sgn(NaN), 0)
  })
  it("if then elseif then else then asynchronous", done => {
    const sgn = F.ifElse(a => Promise.resolve(a > 0),
                         () => 1,

                         a => Promise.resolve(a < 0),
                         () => -1,

                         () => 0)
    sgn(5).then(result => assert.strictEqual(result, 1))
    .then(() => sgn(-3)).then(result => assert.strictEqual(result, -1))
    .then(() => sgn(NaN)).then(result => assert.strictEqual(result, 0))
    .then(() => done()).catch(done)
  })
  it("if then elseif then else then asynchronous into synchronous", done => {
    const sgn = F.ifElse(a => Promise.resolve(a > 0),
                         () => 1,

                         a => a < 0,
                         () => -1,

                         () => 0)
    sgn(5).then(result => assert.strictEqual(result, 1))
    .then(() => sgn(-3)).then(result => assert.strictEqual(result, -1))
    .then(() => sgn(NaN)).then(result => assert.strictEqual(result, 0))
    .then(() => done()).catch(done)
  })
  it("ifElse should return then/else if then is not a function", () => {
    const sgn = F.ifElse(a => a > 0, 1,
                         a => a < 0, -1,
                         0)
    assert.strictEqual(sgn(5), 1)
    assert.strictEqual(sgn(-3), -1)
    assert.strictEqual(sgn("Bunny"), 0)
  })
})
