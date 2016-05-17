Fugazi - Changelog
================================================================================

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
