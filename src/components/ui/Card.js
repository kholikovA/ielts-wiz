import React from 'react';

// Card primitive. When `href` (or `onClick`) is set, the card renders as an
// interactive surface with hover lift. When just static content, it sits as a
// plain panel.
export default function Card({
  href,
  onClick,
  className = '',
  children,
  ...rest
}) {
  const interactive = !!(href || onClick);
  const classes = ['card', interactive ? 'card-interactive' : '', className]
    .filter(Boolean).join(' ');

  if (href) {
    return (
      <a href={href} onClick={onClick} className={classes} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <div onClick={onClick} className={classes} {...rest}>
      {children}
    </div>
  );
}
