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

test('tables: header rows, colspan, caption, math in cells', () => {
  const t = '[table]\n^Points\n! | Points*2\n!Hours | Low | \\(x\\)\n3 to 5 | 6 | 4\n[/table]';
  const html = renderToStaticMarkup(<MathText block text={`Intro\n\n${t}\n\nAfter`} />);
  expect(html).toContain('<caption>Points</caption>');
  expect(html).toContain('<th colSpan="2">Points</th>');
  expect(html).toContain('<td>6</td>');
  expect(html).toContain('katex');
  expect(html).not.toContain('<p><span class="mt-table-wrap">');
});
