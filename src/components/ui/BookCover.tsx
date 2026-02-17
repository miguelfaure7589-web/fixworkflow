'use client';

import { useState } from 'react';

interface BookCoverProps {
  isbn: string;
  fallbackEmoji: string;
  width?: number;
  height?: number;
}

export default function BookCover({ isbn, fallbackEmoji, width = 52, height = 72 }: BookCoverProps) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div style={{
        width, height, borderRadius: 6,
        background: '#f4f5f8', border: '1px solid #f0f2f6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: Math.min(width, height) * 0.4, flexShrink: 0,
      }}>
        {fallbackEmoji}
      </div>
    );
  }

  return (
    <img
      src={`https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`}
      alt=""
      onError={() => setErrored(true)}
      style={{
        width, height, borderRadius: 6,
        objectFit: 'cover', flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    />
  );
}
