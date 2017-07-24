Scopeify HTML [![Build Status](https://travis-ci.org/neurosnap/scopeify-html.svg?branch=master)](https://travis-ci.org/neurosnap/scopeify-html)
=============

The goal of this library is to scope all CSS selectors in an HTML document.

Features
--------

* Every CSS selector is scoped
* Media queries are scoped and preserved
* Fonts are scoped and preserved
* Keyframes are scoped and preserved
* Can use PostCSS plugins to modify all extracted CSS
* Ability to do aditional processing with PostCSS

Why
---

The primary reason for creating this library was to render HTML and CSS inside
a document without that CSS effecting the parent document.  Basically this library
was created to avoid having to use an iframe.

Other libraries that attempt to solve this problem, such as [juice](https://github.com/Automattic/juice)
do so by inlining all the CSS, which loses pseudo selectors, keyframes, and font-face names.

How it works
------------

The core functionality of this library comes from [PostCSS](https://github.com/postcss/postcss).
We are using [postcss-scopeify-everything](https://github.com/neurosnap/postcss-scopeify-everything)
to perform all the selector scope transformations.

We iterate over all the CSS rules within an HTML document and scope all of them using a hash of the content.  Then we iterate
over all the DOM elements in the document and apply the newly scoped selectors.  Then we return the
document and the CSS separated.

* Scope CSS by converting the following selectors and names in the HTML document:
  * Convert HTML elements into scoped classes,
  * Ids,
  * Classes,
  * Keyframe names, and
  * Font-face names
* Convert all HTML selectors into scoped selectors

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

### Async promise

```js
const scopeifyHtml = require('scopeify-html');
const insertCss = scopeifyHtml.insertCss;
const getCss = scopeifyHtml.getCss;

const html = '<div>hi mom</div>';
const parser = new DOMParser();
const doc = parser.parseFromString(html, "text/html");

scopeifyHtml({ replaceClassName: true })
  .promise(doc)
  .then((scoped) => {
    const scopedCss = getCss(scoped);
    insertCss(scopedCss, doc);
  })
  .catch(console.log);
```

API
---

### scopeifyHtml

Primary entry point for the library.

#### scopeifyHtml(options: Object)

* replaceClassName (Boolean, default `false`): Removes any classnames not used in CSS

The options passed here will also be passed to [postcss-scopeify-everything](https://github.com/neurosnap/postcss-scopeify-everything#options)
* plugins (Array, default `[]`): adds PostCSS plugins before the scopeify plugin
* scopeifyFn (Function): the function that hashes the identifier name
* scopeifyElFn (Function): the function that converts an element name to a class name
* asteriskName (Function|String, default `__asterisk`): the string that is used for the wildcard selector `*`
* ids (Boolean, default `false`): determines whether or not to disable scoping `ids`
* elements (Boolean, default `false`): determines whether or not to disable scoping `elements`
* classes (Boolean, default `false`): determines whether or not to disable scoping `classes`
* keyframes (Boolean, default `false`): determines whether or not to disable scoping `keyframes`
* fontFaces (Boolean, default `false`): determines whether or not to disable scoping `fontFaces`

### sync

Synchronously processes the CSS and HTML

`scopeifyHtml().sync(doc: Document) => scopedSelectors`

### promise

Asynchronously processes the CSS and HTML

`scopeifyHtml().promise(doc: Document) => Promise(scopedSelectors)`

### getCss

Returns the CSS from scopeify

`scopeifyHtml.getCss(scopedSelectors) => string`

### insertCss

Inserts CSS into document

`scopeify.insertCss(css: string, doc: Document) => undefined`

Perf
----

All speeds are measured in milliseconds (ms).

fixture        | scopeify-html | juice v4   |
---------------|---------------|------------|
zillow.html    | 43.316        | 81.557     |
gog.html       | 126.074       | 55.336     |
readme_ex.html | 1.301         | 1.240      |
apple.html     | 114.198       | 26.452     |
costco.html    | 1.623         | 0.654      |
