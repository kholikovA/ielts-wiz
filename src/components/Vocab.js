import React, { useState } from 'react';

const Vocab = ({ word, meaning, children }) => {
  const [show, setShow] = useState(false);
  
  return (
    <span 
      style={{ position: 'relative', display: 'inline' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span style={{
        background: 'linear-gradient(120deg, var(--highlight-bg) 0%, var(--highlight-bg) 100%)',
        backgroundSize: '100% 40%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: '0 90%',
        color: 'var(--highlight-text)',
        fontWeight: '500',
        cursor: 'help',
        borderBottom: '2px dotted var(--purple-400)',
        paddingBottom: '1px',
      }}>
        {children || word}
      </span>
      {show && (
        <span style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '8px',
          padding: '10px 14px',
          borderRadius: '10px',
          background: 'var(--tooltip-bg)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          fontSize: '0.85rem',
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
          zIndex: 1000,
          maxWidth: '280px',
          whiteSpace: 'normal',
          textAlign: 'center',
          lineHeight: '1.4',
        }}>
          <span style={{
            display: 'block',
            fontWeight: '600',
            color: 'var(--purple-400)',
            marginBottom: '4px',
            fontSize: '0.8rem',
          }}>
            {word}
          </span>
          {meaning}
          <span style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid var(--tooltip-bg)',
          }} />
        </span>
      )}
    </span>
  );
};


// Helper function to highlight vocabulary words in text

export default Vocab;
