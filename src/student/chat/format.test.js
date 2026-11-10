import {
  linkify, dayLabel, lastSeenLabel, fileSize, duration, previewText, layoutMessages, reactionSummary, sortChats, isOnline,
} from './format';

describe('linkify', () => {
  it('splits links out of text and keeps trailing punctuation outside', () => {
    expect(linkify('see https://ielts-wiz.com/a?b=1. ok')).toEqual([
      { text: 'see ' },
      { text: 'https://ielts-wiz.com/a?b=1', href: 'https://ielts-wiz.com/a?b=1' },
      { text: '. ok' },
    ]);
  });
  it('adds https to www links', () => {
    expect(linkify('www.example.com')).toEqual([{ text: 'www.example.com', href: 'https://www.example.com' }]);
  });
  it('handles plain text and empty input', () => {
    expect(linkify('hello')).toEqual([{ text: 'hello' }]);
    expect(linkify('')).toEqual([]);
  });
});

describe('labels', () => {
  const now = new Date(2026, 10, 10, 15, 0);
  it('names today and yesterday', () => {
    expect(dayLabel(new Date(2026, 10, 10, 1).toISOString(), now)).toBe('Today');
    expect(dayLabel(new Date(2026, 10, 9, 23).toISOString(), now)).toBe('Yesterday');
  });
  it('describes last seen', () => {
    expect(lastSeenLabel(new Date(2026, 10, 10, 14, 59, 30).toISOString(), now)).toBe('online');
    expect(lastSeenLabel(new Date(2026, 10, 10, 14, 40).toISOString(), now)).toBe('last seen 20 min ago');
    expect(lastSeenLabel(null, now)).toBe('last seen a long time ago');
    expect(isOnline(null)).toBe(false);
  });
  it('formats sizes and durations', () => {
    expect(fileSize(500)).toBe('500 B');
    expect(fileSize(2048)).toBe('2 KB');
    expect(fileSize(5 * 1024 * 1024)).toBe('5.0 MB');
    expect(duration(65.4)).toBe('1:05');
  });
});

describe('previewText', () => {
  it('prefixes the sender', () => {
    expect(previewText({ sender_id: 'me', body: 'hi' }, { me: 'me' })).toBe('You: hi');
    expect(previewText({ sender_id: 'x', sender_name: 'Ali Valiyev', body: 'hi' }, { me: 'me', group: true })).toBe('Ali: hi');
    expect(previewText({ sender_id: 'x', body: 'hi' }, { me: 'me' })).toBe('hi');
  });
  it('describes attachments', () => {
    expect(previewText({ sender_id: 'x', kind: 'voice' }, { me: 'me' })).toBe('Voice message');
    expect(previewText({ sender_id: 'x', kind: 'file', file: 'essay.pdf' }, { me: 'me' })).toBe('essay.pdf');
    expect(previewText({ sender_id: 'x', kind: 'image', body: 'look' }, { me: 'me' })).toBe('Photo, look');
  });
});

describe('layoutMessages', () => {
  const at = (min) => new Date(2026, 10, 10, 10, min).toISOString();
  const items = [
    { id: 1, sender_id: 'a', created_at: at(0) },
    { id: 2, sender_id: 'a', created_at: at(1) },
    { id: 3, sender_id: 'b', created_at: at(2) },
    { id: 4, sender_id: 'b', created_at: at(30) },
  ];
  it('groups runs by sender and time', () => {
    const l = layoutMessages(items, { me: 'a' });
    expect(l.map((x) => [x.first, x.last])).toEqual([[true, false], [false, true], [true, true], [true, true]]);
    expect(l[0].newDay).toBe(true);
    expect(l[1].newDay).toBe(false);
  });
  it('places the unread divider at the first unread message from someone else', () => {
    const l = layoutMessages(items, { me: 'a', lastReadAt: at(0) });
    expect(l.findIndex((x) => x.unreadHere)).toBe(2);
  });
});

describe('reactionSummary', () => {
  it('counts per reaction in a fixed order and marks mine', () => {
    expect(reactionSummary({ u1: 'heart', u2: 'like', me: 'heart' }, 'me').map(({ key, count, mine }) => [key, count, mine]))
      .toEqual([['like', 1, false], ['heart', 2, true]]);
  });
});

describe('sortChats', () => {
  it('puts pinned chats first, then most recent', () => {
    const chats = [
      { id: 'a', last_message_at: '2026-11-01T00:00:00Z' },
      { id: 'b', last_message_at: '2026-11-05T00:00:00Z' },
      { id: 'c', pinned: true, last_message_at: '2026-10-01T00:00:00Z' },
    ];
    expect(sortChats(chats).map((c) => c.id)).toEqual(['c', 'b', 'a']);
  });
});
