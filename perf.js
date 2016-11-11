'use strict';

const fs = require('fs');
const jsdom = require('jsdom').jsdom;
const juice = require('juice');
const cheerio = require('cheerio');
const scopeifyHtml = require('./');

const fixtures = [
  'zillow.html',
  'gog.html',
  'readme_ex.html',
  'apple.html',
  'costco.html',
  'sentry.html',
];

fixtures.forEach(fname => {
  const html = fs.readFileSync(`./fixtures/${fname}`);
  const htmlStr = html.toString();

  console.log('---');

  const scopeifyId = `scopeify-html ${fname}`;
  const doc = jsdom(html);
  console.time(scopeifyId);
  scopeifyHtml().sync(doc);
  console.timeEnd(scopeifyId);

  const juiceId = `juice ${fname}`;
  const $ = cheerio.load(htmlStr);
  console.time(juiceId);
  juice.juiceDocument($);
  console.timeEnd(juiceId);

  console.log('---');
});
