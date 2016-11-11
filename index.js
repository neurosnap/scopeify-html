'use strict';

const pse = require('postcss-scopeify-everything');

module.exports = scopeifyHtml;
module.exports.extractCss = extractCss;
module.exports.insertCss = insertCss;
module.exports.getCss = pse.getCss;

function scopeifyHtml(opts) {
  opts = opts || {};
  const scopeify = pse.api(opts);

  return {
    sync: scopeifyFnSync.bind(this, scopeify, opts),
    promise: scopeifyFnPromise.bind(this, scopeify, opts),
  };
}

function scopeifyFnSync(scopeify, opts, doc) {
  const css = extractCss(doc);
  if (!css) return null;

  const scoped = scopeify(css).sync();
  iterateDom(doc, opts, scoped);
  return scoped;
}

function scopeifyFnPromise(scopeify, opts, doc) {
  const css = extractCss(doc);
  if (!css) return Promise.resolve(null);

  return scopeify(css)
    .promise()
    .then(function iterateDomPromise(scoped) {
      return new Promise(function iterateDomPromiseResolve(resolve, reject) {
        try {
          iterateDom(doc, opts, scoped);
        } catch (err) {
          reject(err);
        }

        resolve(scoped);
      });
    })
    .catch(function iterateDomCatch(err) { console.error(err); });
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

function iterateDom(doc, opts, scoped) {
  const elements = doc.getElementsByTagName('*');
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    replaceSelectors(el, scoped, opts.replaceClassName);
  }
}

function replaceSelectors(el, scoped, replaceClassName) {
  if (typeof replaceClassName === 'undefined') replaceClassName = false;
  const name = el.tagName.toLowerCase();
  const style = el.getAttribute('style');

  const newClasses = [];
  Object.keys(scoped.classes).forEach(function walkClass(scopeClass) {
    if (el.classList.contains(scopeClass)) {
      if (replaceClassName) {
        newClasses.push(scoped.classes[scopeClass]);
      } else {
        el.classList.remove(scopeClass);
        el.classList.add(scoped.classes[scopeClass]);
      }
    }
  });
  if (replaceClassName) el.className = newClasses.join(' ');

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
