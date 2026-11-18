import { ipaFrom, devSources, playableUrl, audioFromCommons } from './pronounce';

const ipa = (text, tags = []) => ({ type: 'ipa', text, tags });

test('ipaFrom picks UK and US by accent tag', () => {
  const fda = { entries: [{ pronunciations: [
    ipa('/ˈkaʊn.tɚˌfɪt/', ['General American']),
    ipa('/ˈkaʊntəˌfɪt/', ['British', 'Southern', 'Standard']),
  ] }] };
  expect(ipaFrom(fda)).toEqual({ uk: '/ˈkaʊntəˌfɪt/', us: '/ˈkaʊn.tɚˌfɪt/' });
});

test('ipaFrom prefers full phonemic forms over fragments and phonetic forms', () => {
  const fda = { entries: [{ pronunciations: [
    ipa('/hə-/', ['Received Pronunciation', 'UK']),
    ipa('[həˈləʊ]', ['UK']),
    ipa('/həˈləʊ/', ['Received Pronunciation', 'UK']),
    ipa('/hɛˈloʊ/', ['General American']),
  ] }] };
  expect(ipaFrom(fda)).toEqual({ uk: '/həˈləʊ/', us: '/hɛˈloʊ/' });
});

test('ipaFrom uses an untagged form for both accents when nothing is tagged', () => {
  const fda = { entries: [{ pronunciations: [ipa('/məˈtɪ.kjə.ləs/')] }] };
  expect(ipaFrom(fda)).toEqual({ uk: '/məˈtɪ.kjə.ləs/', us: '/məˈtɪ.kjə.ləs/' });
});

test('ipaFrom does not copy one accent into the other when only one is tagged', () => {
  const fda = { entries: [{ pronunciations: [ipa('/ˈtə.mɑː.təʊ/', ['Received Pronunciation'])] }] };
  expect(ipaFrom(fda)).toEqual({ uk: '/ˈtə.mɑː.təʊ/', us: undefined });
});

test('ipaFrom handles missing data', () => {
  expect(ipaFrom(null)).toEqual({ uk: undefined, us: undefined });
});

test('devSources maps Commons page ids to accents', () => {
  const dev = [{ phonetics: [
    { text: '/təˈmɑːtəʊ/', audio: 'https://x/tomato-uk.mp3', sourceUrl: 'https://commons.wikimedia.org/w/index.php?curid=873382' },
    { text: '/təˈmeɪtoʊ/', audio: 'https://x/tomato-us.mp3', sourceUrl: 'https://commons.wikimedia.org/w/index.php?curid=873531' },
    { audio: 'https://x/tomato-au.mp3', sourceUrl: 'https://commons.wikimedia.org/w/index.php?curid=1505555' },
  ] }];
  expect(devSources(dev)).toEqual({ ids: { 873382: 'uk', 873531: 'us' }, ukText: '/təˈmɑːtəʊ/', usText: '/təˈmeɪtoʊ/' });
});

test('devSources tolerates "not found" responses', () => {
  expect(devSources({ title: 'No Definitions Found' })).toEqual({ ids: {}, ukText: undefined, usText: undefined });
});

test('playableUrl uses the Commons MP3 transcode for ogg files', () => {
  expect(playableUrl('https://upload.wikimedia.org/wikipedia/commons/4/44/En-us-mitigate.ogg?utm_source=x'))
    .toBe('https://upload.wikimedia.org/wikipedia/commons/transcoded/4/44/En-us-mitigate.ogg/En-us-mitigate.ogg.mp3');
  expect(playableUrl('https://upload.wikimedia.org/wikipedia/commons/a/ab/Word.mp3?x=1')).toBe('https://upload.wikimedia.org/wikipedia/commons/a/ab/Word.mp3');
  expect(playableUrl('https://example.com/other.ogg')).toBeNull();
});

test('audioFromCommons reads accents from file names, then from dictionaryapi.dev labels', () => {
  const commons = { query: { pages: [
    { pageid: 1, title: 'File:Tomato pronunciation.ogg', imageinfo: [{ url: 'https://upload.wikimedia.org/wikipedia/commons/1/11/T.ogg' }] },
    { pageid: 2, title: 'File:En-us-tomato.ogg', imageinfo: [{ url: 'https://upload.wikimedia.org/wikipedia/commons/7/78/En-us-tomato.ogg' }] },
    { title: 'File:En-uk-tomato.ogg', missing: true },
  ] } };
  expect(audioFromCommons(commons, { 1: 'uk', 2: 'uk' })).toEqual({
    uk: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/1/11/T.ogg/T.ogg.mp3',
    us: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/7/78/En-us-tomato.ogg/En-us-tomato.ogg.mp3',
  });
  expect(audioFromCommons(null)).toEqual({ uk: null, us: null });
});
