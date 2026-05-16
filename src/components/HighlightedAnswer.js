import React from 'react';
import Vocab from './Vocab';
import { vocabDefinitions } from '../data/vocab-definitions';

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const HighlightedAnswer = ({ text, vocabList }) => {
  if (!vocabList || vocabList.length === 0) return text;

  const pattern = [...vocabList]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex)
    .join('|');

  const regex = new RegExp(`(${pattern})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) => {
    const matchedVocab = vocabList.find(v => v.toLowerCase() === part.toLowerCase());
    const definition = matchedVocab && vocabDefinitions[matchedVocab.toLowerCase()];
    if (definition) {
      return <Vocab key={`${i}-${part}`} word={matchedVocab} meaning={definition}>{part}</Vocab>;
    }
    return <React.Fragment key={`${i}-${part}`}>{part}</React.Fragment>;
  });
};

export default HighlightedAnswer;
