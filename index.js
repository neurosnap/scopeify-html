'use strict';

var pse = require('postcss-scopeify-everything');

module.exports = scopeifyHtml;
module.exports.extractCss = extractCss;
module.exports.insertCss = insertCss;
module.exports.getCss = pse.getCss;

function scopeifyHtml(opts) {
  opts = opts || {};
  var scopeify = pse.api(opts);

  return {
    sync: scopeifyFnSync.bind(this, scopeify, opts),
    promise: scopeifyFnPromise.bind(this, scopeify, opts),
  };
}

function scopeifyFnSync(scopeify, opts, doc) {
  var css = extractCss(doc);
  if (!css && opts.replaceClassName === false) {
    return null;
  }

  var scoped = scopeify(css).sync();
  iterateDom(doc, opts, scoped);
  return scoped;
}

function scopeifyFnPromise(scopeify, opts, doc) {
  var css = extractCss(doc);
  if (!css && opts.replaceClassName === false) {
    return Promise.resolve(null);
  }

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
  var stylesEl = doc.querySelectorAll('style');
  var styles = '';
  for (var i = 0; i < stylesEl.length; i++) {
    var child = stylesEl[i];
    styles += child.innerHTML;
    child.remove();
  }
  return styles;
}

function insertCss(css, doc, container) {
  if (typeof container === 'undefined') {
    container = doc.querySelector('head');
  }

  var style = doc.createElement('style');
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
  var elements = doc.getElementsByTagName('*');
  for (var i = 0; i < elements.length; i++) {
    var el = elements[i];
    replaceSelectors(el, scoped, opts.replaceClassName);
  }
}

function replaceSelectors(el, scoped, replaceClassName) {
  if (typeof replaceClassName === 'undefined') replaceClassName = false;
  var name = el.tagName.toLowerCase();
  var style = el.getAttribute('style');

  var newClasses = [];
  Object.keys(scoped.classes).forEach(function walkClass(scopeClass) {
    var classes = scopeClass.split(' ');
    // detect if a scopedClass is multiple classes and
    // if so then add the collective class to the element
    if (classes.length > 1) {
      var classesNotFound = classes.filter((c) => !el.classList.contains(c));

      if (classesNotFound.length > 0) {
        return;
      }

      if (replaceClassName) {
        newClasses.push(scoped.classes[scopeClass]);
      } else {
        classes.forEach(c => el.classList.remove(c));
        el.classList.add(scoped.classes[scopeClass]);
      }

      return;
    }

    if (el.classList.contains(scopeClass)) {
      if (replaceClassName) {
        newClasses.push(scoped.classes[scopeClass]);
      } else {
        el.classList.remove(scopeClass);
        el.classList.add(scoped.classes[scopeClass]);
      }
    }
  });

  if (replaceClassName && el.className) {
    el.className = newClasses.join(' ');
  }

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
    var re = new RegExp(scopedFace, 'gi');
    if (style && re.test(style)) {
      var scopedAttr = style.replace(re, scoped.fontFaces[scopedFace]);
      el.setAttribute('style', scopedAttr);
    }
  });

  Object.keys(scoped.keyframes).forEach(function walkFrames(scopedFrames) {
    var re = new RegExp(scopedFrames, 'gi');
    if (style && re.test(style)) {
      var scopedAttr = style.replace(re, scoped.keyframes[scopedFrames]);
      el.setAttribute('style', scopedAttr);
    }
  });
}
