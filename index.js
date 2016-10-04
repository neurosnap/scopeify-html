'use strict';

const pse = require('postcss-scopeify-everything');

module.exports = scopeifyHtml;
module.exports.extractCss = extractCss;
module.exports.insertCss = insertCss;
module.exports.getCss = pse.getCss;

function scopeifyHtml(opts) {
  opts = opts || {};
  const scopeify = pse.api(opts);

  return scopeifyFn.bind(this, scopeify);
}

function scopeifyFn(scopeify, doc) {
  const css = extractCss(doc);
  if (!css) return null;

  const scoped = scopeify(css).sync();

  const elements = doc.getElementsByTagName('*');
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    replaceSelectors(el, scoped);
  }

  return scoped;
}

function extractCss(doc) {
  const stylesEl = doc.querySelectorAll('style');
  let styles = '';
  for (let i = 0; i < stylesEl.length; i++) {
    const child = stylesEl[i];
    styles += child.innerHTML;
    child.remove();
  }
  return styles;
}

function insertCss(css, doc, container) {
  if (typeof container === 'undefined') {
    container = doc.querySelector('head');
  }

  const style = doc.createElement('style');
  style.setAttribute('type', 'text/css');

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(doc.createTextNode(css));
  }

  container.appendChild(style);
  return style;
}

function replaceSelectors(el, scoped) {
  const name = el.tagName.toLowerCase();
  const style = el.getAttribute('style');

  Object.keys(scoped.classes).forEach(function walkClass(scopeClass) {
    if (el.classList.contains(scopeClass)) {
      el.classList.remove(scopeClass);
      el.classList.add(scoped.classes[scopeClass]);
    }
  });

  Object.keys(scoped.elements).forEach(function walkEl(scopeEl) {
    if (scopeEl === name || scopeEl === '*') {
      el.classList.add(scoped.elements[scopeEl]);
    }
  });

  Object.keys(scoped.ids).forEach(function walkId(scopeId) {
    if (scopeId === el.getAttribute('id')) {
      el.setAttribute('id', scoped.ids[scopeId]);
    }
  });

  Object.keys(scoped.fontFaces).forEach(function walkFaces(scopedFace) {
    const re = new RegExp(scopedFace, 'gi');
    if (style && re.test(style)) {
      const scopedAttr = style.replace(re, scoped.fontFaces[scopedFace]);
      el.setAttribute('style', scopedAttr);
    }
  });

  Object.keys(scoped.keyframes).forEach(function walkFrames(scopedFrames) {
    const re = new RegExp(scopedFrames, 'gi');
    if (style && re.test(style)) {
      const scopedAttr = style.replace(re, scoped.keyframes[scopedFrames]);
      el.setAttribute('style', scopedAttr);
    }
  });
}
