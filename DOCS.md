Fugazi - Documentation
================================================================================

## F.resolver
`a -> b -> a`
Creates a function that returns a value.
### Example
```js
F.F()(
  F.resolver("Foo"),
  console.log // logs "Foo"
)
```

## F.rejector
`a -> b -> throw a`
Creates a function that throws a value.
### Example
```js
F.F()(
  F.rejector("Foo"),
  F.resolver("Bar"),
  F.catch(F.id),
  console.log // logs "Foo"
)
