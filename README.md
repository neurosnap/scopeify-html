Scopeify HTML
=============

The goal of this library is to scope all CSS selectors in an HTML document.

Features
--------

* Every CSS selector is scoped
* Media queries are preserved
* Fonts are preserved
* Keyframes are preserved
* Can use PostCSS plugins to modify all extracted CSS

How it works
------------

We iterate over all the CSS rules within an HTML document and scope all of them.  Then we iterate
over all the DOM elements in the document and apply the newly scoped selectors.  Then we return the
document and the CSS separated.

* Scope CSS by converting the following selectors and names in the HTML document:
  * Convert HTML elements into scoped classes,
  * Ids,
  * Classes,
  * Keyframe names, and
  * Font-face names
* Convert all HTML selectors into scoped selectors

The primary reason why this library was created was to have the ability to render email within an
HTML document without worrying about global CSS selectors in the child document affecting the parent
document.

Usage
-----

```js
const scopeifyHtml = require('scopeify-html');
const insertCss = scopeifyHtml.insertCss;
const getCss = scopeifyHtml.getCss;

const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    .foo { display: flex; }
    div { margin: 10px; border: 1px solid black; }
    #bar { flex: 1; font-size: 18px; }
  </style>
</head>
<body>
  <div class="foo">
    <div>All your base</div>
    <div id="bar">Are belong to us</div>
  </div>
</body>
</html>
`;

const parser = new DOMParser();
const doc = parser.parseFromString(html, "text/html");

const scoped = scopeifyHtml().sync(doc);
console.log(scoped);
/*
{
  elements: { div: 'div_el_3BuKMO' },
  classes: { foo: 'foo_3BuKMO' },
  ids: { bar: 'bar_3BuKMO' },
  keyframes: {},
  fontFaces: {}
}
*/

const scopedCss = getCss(scoped);
console.log(scopedCss);
/*
  .foo_3BuKMO { display: flex; }
  .div_el_3BuKMO { margin: 10px; border: 1px solid black; }
  #bar_3BuKMO { flex: 1; font-size: 18px; }
*/

// insert scoped CSS into DOM <head>
insertCss(scopedCss, doc);

console.log(doc.documentElement.outerHTML);
/*
<html>
<head>
  <style type="text/css">
    .foo_3BuKMO { display: flex; }
    .div_el_3BuKMO { margin: 10px; border: 1px solid black; }
    #bar_3BuKMO { flex: 1; font-size: 18px; }
  </style>
</head>
<body>
  <div class="foo_3BuKMO div_el_3BuKMO">
    <div class="div_el_3BuKMO">All your base</div>
    <div id="bar_3BuKMO" class="div_el_3BuKMO">Are belong to us</div>
  </div>
</body>
</html>
*/
```

Perf
----

All speeds are measured in milliseconds (ms).

fixture        | scopeify-html | juice   |
---------------|---------------|---------|
zillow.html    | 45.784        | 113.385 |
gog.html       | 52.943        | 113.725 |
readme_ex.html | 1.400         | 1.595   |
apple.html     | 55.115        | 38.543  |
costco.html    | 1.193         | 0.531   |
