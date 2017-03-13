Fugazi - Changelog
================================================================================

# 2017-03-13, Version 0.5.1
 - Remove documentation and build files from the final package
# 2017-03-08, Version 0.5.0
 - Major refactor using function generators
 - Error handling for Node Streams
 - F("key") works with promised object properties
 - F.match(constructor) - Enhanced matching for constructors. Now works with native JS objects and ES4-based classes (as long as the function has a custom prototype)
 - F.or(false, "two") now returns "two" instead of true, just like || operator
 - F.and(true, "three") now returns "three" instead of true, just like && operator
 - New function for error handling in asynchronous side effects - F.effect
 - F.reduce now treats initial element as factory
 - F.filterKeys for filtering objects and maps based on keys
 - Dropped support for Node 5. Node 6 LTS is a required minimum
# 2016-08-01, Version 0.4.1
 - Fix a bug, where F.match would not work with functions created using
   function () { } syntax, treating them as class constructors
 - "Compile-time" type safety for F.compose, F.curry, F.curryN and F.match
# 2016-05-17, Version 0.3.0
 - Asynchronous `F.or(pred, pred)` and `F.and(pred, pred)`. F.match predicates
   are not yet implemented.
 - comparators: `F.eq`, `F.eqv`, `F.lt`, `F.lte`, `F.gt`, `F.gte`
 - `F.sync` - `Promise.all` for arrays, objects, Maps and streams
 - `F._` - curry placeholder
 - `F.F` - F with immediately applicable F.compose - arguments first and then
   functions
 - `F.resolver` and `F.thrower` - creates a function that returns/rejects
   respectively when called
## Bugfixes:
 - Error handling in stream functions (throwing error inside stream caused
   stream never to resolve)
 - `F.match` (strict) refusing to allow optional properties or compare against
   `0` or `false`

# 2016-05-10, Version 0.2.2
 - NPM/CI Maintenance update, no changes to the source code

# 2016-05-10, Version 0.2.1
 - Hotfix: Add support for non-native promise implementations (promise must
   implement `.then` and `.catch` methods)
