// Shared instruction wording (computer-delivered IELTS phrasing).
export const W = (s) => `Write <strong>${s}</strong> for each answer.`;
export const NOTES = 'Complete the notes below.';
export const FORM = 'Complete the form below.';
export const TABLE = 'Complete the table below.';
export const SENT = 'Complete the sentences below.';
export const SUMMARY = 'Complete the summary below.';
export const FLOW = 'Complete the flow-chart below.';
export const ANS = 'Answer the questions below.';
export const ABC = 'Choose the correct letter, <strong>A</strong>, <strong>B</strong> or <strong>C</strong>.';
export const br = (...lines) => lines.join('<br>');
/** "Choose TWO letters, A–E." */
export const CHOOSE = (n, range) => `Choose <strong>${n}</strong> letters, <strong>${range.replace('-', '–')}</strong>.`;
/** Example answer shown inside a table cell / sentence. */
export const ex = (s) => `<span class="ex-ans">${s}</span>`;
export const EXAMPLE = '<em>Example</em>';
/** Bulleted list inside a table cell. */
export const ul = (...items) => `<ul class="cell-list">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
