import React from 'react';
import ArticlesHub from './ArticlesHub';
import ArticleReader from './ArticleReader';
import { ARTICLE_INDEX } from '../../data/articles';

// Articles section router.
//   subPage = null / 'hub'  → hub landing
//   subPage = '<article-id>' → reader (falls back to hub if unknown)
const ArticlesPage = ({ subPage, setSubPage }) => {
  const sub = subPage || 'hub';
  const article = ARTICLE_INDEX[sub];

  if (article) {
    return <ArticleReader article={article} onBack={() => setSubPage && setSubPage('hub')} />;
  }

  return <ArticlesHub setSubPage={setSubPage} />;
};

export default ArticlesPage;
