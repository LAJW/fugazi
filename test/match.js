/******************************************************************************/
/**
 * @file :test/match
 * @desc Unit tests for F.match function
 * @author Lukasz A.J. Wrona (layv.net)
 * @license MIT
 */
/******************************************************************************/

"use strict"
const F           = require("../index")
const assert      = require("assert")

/******************************************************************************/
/* global describe it */

describe("match", () => {
  it("match regex", () => {
    const match = F.match(/.json$/)
    assert.strictEqual(match("file.txt"), false)
    assert.strictEqual(match("file.json"), true)
  })
  it("match string", () => {
    const match = F.match("two")
    assert.strictEqual(match("one"), false)
    assert.strictEqual(match("two"), true)
  })
  it("match against array of strings", () => {
    const match = F.match([ "three", "two" ])
    assert.strictEqual(match("one"), false)
    assert.strictEqual(match("two"), true)
  })
  it("match against array of regexes", () => {
    const match = F.match([ /\.json$/, /\.txt$/ ])
    assert.strictEqual(match("file.txt"), true)
    assert.strictEqual(match("file.json"), true)
    assert.strictEqual(match("file.jpg"), false)
  })
  it("match against a custom function", () => {
    const match = F.match(value => value > 0 && value < 100)
    assert.strictEqual(match("file.txt"), false)
    assert.strictEqual(match(-0.0001), false)
    assert.strictEqual(match(Infinity), false)
    assert.strictEqual(match(50), true)
  })
  it("match against a custom named function", () => {
    const match = F.match(function (value) {
      return value > 0 && value < 100
    })
    assert.strictEqual(match("file.txt"), false)
    assert.strictEqual(match(-0.0001), false)
    assert.strictEqual(match(Infinity), false)
    assert.strictEqual(match(50), true)
  })
  it("match against a ES5 class", () => {
    function Entity() { /* no-op */ }
    Entity.prototype = {
      constructor : Entity,
      method() { /* no-op */ }
    }
    const match = F.match(Entity)
    assert.strictEqual(match(Set), false)
    assert.strictEqual(match({ length : 0 }), false)
    assert.strictEqual(match([ Infinity ]), false)
    assert.strictEqual(match(new Entity()), true)
  })
  it("match against a ES6 class", () => {
    class Entity { }
    const match = F.match(Entity)
    assert.strictEqual(match(Set), false)
    assert.strictEqual(match({ length : 0 }), false)
    assert.strictEqual(match([ Infinity ]), false)
    assert.strictEqual(match(new Entity()), true)
  })
  it("match against the Array constructor", () => {
    const match = F.match(Array)
    assert.strictEqual(match(Set), false)
    assert.strictEqual(match({ length : 0 }), false)
    assert.strictEqual(match([ Infinity ]), true)
  })
  it("match against String constructor", () => {
    const match = F.match(String)
    assert.strictEqual(match(new Set()), false, "set is not a string")
    assert.strictEqual(match("random string"), true, "string is a string")
    assert.strictEqual(match(NaN), false, "NaN is not a string")
  })
  it("match against Number constructor", () => {
    const match = F.match(Number)
    assert.strictEqual(match("string"), false, "string is not a number")
    assert.strictEqual(match(0), true, "zero is a number")
    assert.strictEqual(match([ ]), false, "empty array is not a number")
  })
  it("match against object of properties", () => {
    const match = F.match({
      id    : Number,
      email : String,
      dank  : [ true, false ],
    })
    assert.strictEqual(match(undefined), false, "undefined is not an object")
    assert.strictEqual(match({ }), false, "Missing properties")
    assert.strictEqual(match({
      id    : 3,
      email : "admin@example.com",
      dank  : true,
      extra : 'whatever'
    }), false, "Extra properties")
    assert.strictEqual(match({
      id    : 3,
      email : "admin@example.com",
      dank  : true,
    }), true)
    assert.strictEqual(match({
      id    : 5,
      email : "admin@example.com",
      dank  : "cat",
    }), false)
  })
  it("match against boolean constructor", () => {
    const match = F.match(Boolean)
    assert.strictEqual(match("string"), false, "string is not a boolean")
    assert.strictEqual(match(false), true, "false is a aboolean")
    assert.strictEqual(match(true), true, "true is a boolean")
    assert.strictEqual(match(1), false, "1 is not a boolean")
  })
  it(`match against asynchronous predicate function should return promise
      resolving to the result`, done => {
    const match = F.match(x => Promise.resolve(x > 0))
    match(5)
    .then(result => assert.strictEqual(result, true))
    .then(() => match(-1))
    .then(result => assert.strictEqual(result, false))
    .then(() => done()).catch(done)
  })
  it(`match against multiple asynchronous predicate functions should return
      promise resolving to the final result`, done => {
    const match = F.match([ x => Promise.resolve(typeof x === "string"),
                            x => Promise.resolve(typeof x === "number") ])
    match(0)
    .then(result => assert.strictEqual(result, true, "zero is a number"))
    .then(() => match(""))
    .then(result => assert.strictEqual(result, true, "empty string is a string"))
    .then(() => match({ }))
    .then(result => assert.strictEqual(result, false, "object is not a nubmer"))
    .then(() => done()).catch(done)
  })
  it(`match against structure of asynchronous predicates`, done => {
    const match = F.match({
      id   : x => Promise.resolve(typeof x === "number"),
      name : x => Promise.resolve(typeof x === "string"),
    })
    match({
      id   : 0,
      name : "",
    })
    .then(result => assert.strictEqual(result, true,
                                       "id is a number and name is a string"))
    .then(() => match({
      id   : { },
      name : "",
    }))
    .then(result => assert.strictEqual(result, false, "id is not a number"))
    .then(() => done()).catch(done)
  })
})
