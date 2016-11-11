'use strict';

const fs = require('fs');
const jsdom = require('jsdom').jsdom;
const test = require('tape');
const beautify = require('js-beautify').html;

const scopeifyHtml = require('./');

const extractCss = scopeifyHtml.extractCss;
const insertCss = scopeifyHtml.insertCss;
const getCss = scopeifyHtml.getCss;

const fixtures = [
  'zillow.html',
  'gog.html',
  'readme_ex.html',
  'apple.html',
  'costco.html',
  'sentry.html',
];

test('emails', t => {
  fixtures.forEach(fname => {
    const html = fs.readFileSync(`./fixtures/${fname}`);
    const actualDoc = jsdom(html);
    const scopedSelectorMap = scopeifyHtml().sync(actualDoc);

    const expectedDoc = jsdom(html);
    const expectedCss = extractCss(expectedDoc);

    if (!expectedCss) return;

    insertCss(expectedCss, expectedDoc);
    insertCss(getCss(scopedSelectorMap), actualDoc);

    compare(t, actualDoc, expectedDoc, scopedSelectorMap);
    saveFile(fname, actualDoc);
  });

  t.end();
});

test('emails async', t => {
  fixtures.forEach(fname => {
    const html = fs.readFileSync(`./fixtures/${fname}`);
    const actualDoc = jsdom(html);
    scopeifyHtml().promise(actualDoc).then(scopedSelectorMap => {
      if (!scopedSelectorMap) return;

      const expectedDoc = jsdom(html);
      const expectedCss = extractCss(expectedDoc);

      if (!expectedCss) return;

      insertCss(expectedCss, expectedDoc);
      insertCss(getCss(scopedSelectorMap), actualDoc);

      compare(t, actualDoc, expectedDoc, scopedSelectorMap);
    }).catch(err => { console.error(err); });
  });

  t.end();
});

function saveFile(fname, doc) {
  const beautyOpts = { indent_size: 2, preserve_newlines: false };
  const html = beautify(doc.documentElement.outerHTML, beautyOpts);
  fs.writeFileSync(`./out/${fname}`, html);
}

function compare(t, actual, expected, scoped) {
  t.equal(actual.length, expected.length);
  const actualEls = actual.getElementsByTagName('*');
  const expectedEls = expected.getElementsByTagName('*');

  for (let i = 0; i < expectedEls.length; i++) {
    const actualEl = actualEls[i];
    const expectedEl = expectedEls[i];

    const actualStyles = getStyles(actual.defaultView, actualEl);
    const expectedStyles = getStyles(expected.defaultView, expectedEl);

    const actualTagName = actualEl.tagName.toLowerCase();
    const expectedTagName = expectedEl.tagName.toLowerCase();

    if (actualTagName === 'style' || expectedTagName === 'style') continue;

    if ({}.hasOwnProperty.call(scoped.elements, actualTagName)) {
      t.ok(actualEl.classList.contains(scoped.elements[actualTagName]));
    }

    t.deepEqual(actualTagName, expectedTagName);
    t.deepEqual(actualStyles, expectedStyles);
  }
}

function getStyles(win, el) {
  const styles = win.getComputedStyle(el);
  const obj = {};
  for (let i = 0; i < styles.length; i++) {
    const style = styles[i];
    if (style === 'font-family') continue;
    obj[style] = styles.getPropertyValue(style);
  }
  return obj;
}
