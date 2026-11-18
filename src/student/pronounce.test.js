import { ipaFrom, audioFrom } from './pronounce';

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

test('audioFrom finds -uk and -us recordings', () => {
  const dev = [{ phonetics: [
    { text: '/təˈmɑːtəʊ/', audio: 'https://x/tomato-uk.mp3' },
    { text: '/təˈmeɪtoʊ/', audio: 'https://x/tomato-us.mp3' },
    { audio: 'https://x/tomato-au.mp3' },
  ] }];
  expect(audioFrom(dev)).toEqual({ uk: 'https://x/tomato-uk.mp3', us: 'https://x/tomato-us.mp3', ukText: '/təˈmɑːtəʊ/', usText: '/təˈmeɪtoʊ/' });
});

test('audioFrom tolerates "not found" responses', () => {
  expect(audioFrom({ title: 'No Definitions Found' })).toEqual({ uk: null, us: null, ukText: undefined, usText: undefined });
});
