"use strict"

const F = require("../flowless")
const assert = require("assert")

Object.defineProperty(Promise.prototype, 'end', {
  value(done) { this.then(() => done(), done) }
})

describe("compose", () => {

  it("Single function, should preserve behavior", () => {
    const id = x => x
    const object = { }
    const result = F.compose(id)(object)
    assert.strictEqual(result, object)
  })

  it("Single function, wait for parameters", done => {
    const sum = (a, b) => a + b 
    const object = {  }
    F.compose(sum)(3, Promise.resolve(5))
    .then(result => assert.strictEqual(result, 8))
    .end(done)
  })

})
