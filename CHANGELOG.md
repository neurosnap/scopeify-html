CHANGELOG
=========

0.10.0 (07-28-2017)
-------------------

* :bug: `postcss-scopeify-everything` will sometimes return a `scope.classes` key with multiple classes and we were not properly handling it

0.9.1 (07-06-2017)
------------------

* :bug: upgrade `postcss-scopeify-everything` to fix async parser

0.9.0 (03-01-2017)
------------------

* :bug: `replaceClassName` should work even if there is no `style` tags

0.3.0 (01-07-2016)
------------------

* :sparkles: Upgraded `postcss-scopeify-everything` to better handle CSS syntax errors

0.2.0
-----

* :sparkles: Ability to remove unused, unscoped classes from DOM `replaceClassName` option
* :sparkles: New API for sync and async scopeify

0.1.0
-----

* :rocket: Initial release
