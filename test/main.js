"use strict"

const F = require("../bin/flowless")
const assert = require("assert")

Object.defineProperty(Promise.prototype, 'end', {
  value(done) { this.then(() => done(), done) }
})

describe("compose", () => {

  it("Single function, wait for parameters", done => {
    const sum = (a, b) => a + b 
    const object = {  }
    F.compose(sum)(3, Promise.resolve(5))
    .then(result => assert.strictEqual(result, 8))
    .end(done)
  })

  it("Single function, wait for parameters", done => {
    const sum = (a, b) => a + b 
    const object = {  }
    F.compose(sum)(3, Promise.resolve(5))
    .then(result => assert.strictEqual(result, 8))
    .end(done)
  })

})
