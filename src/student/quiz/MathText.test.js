import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import MathText from './MathText';

test('inline marks wrap text and math', () => {
  const html = renderToStaticMarkup(<MathText text={'The genus <i>Eschrichtius</i> and <u>the \\(x\\)-value</u> here.'} />);
  expect(html).toContain('<em>Eschrichtius</em>');
  expect(html).toMatch(/<u>the <span class="mt-inline">.*<\/span>-value<\/u>/);
  expect(html).not.toContain('&lt;i&gt;');
});

test('plain math and images still render', () => {
  const html = renderToStaticMarkup(<MathText text={'If \\(x=2\\), then ![Figure](https://a/b.png#fig=300)'} />);
  expect(html).toContain('katex');
  expect(html).toContain('class="mt-img mt-fig"');
});
