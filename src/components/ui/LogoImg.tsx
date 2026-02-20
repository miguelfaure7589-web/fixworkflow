'use client';

import { useState } from 'react';

interface LogoImgProps {
  src: string;
  fallbackEmoji: string;
  size?: number;
  radius?: number;
}

export function faviconUrl(domain: string, size = 64) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}

export default function LogoImg({ src, fallbackEmoji, alt, size = 36, radius = 9 }: LogoImgProps & { alt?: string }) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    // Show first 1-2 characters as text fallback instead of emoji
    const initial = (alt || fallbackEmoji || "?").replace(/[^\w]/g, "").substring(0, 2).toUpperCase() || fallbackEmoji;
    return (
      <div style={{
        width: size, height: size, borderRadius: radius,
        background: '#f4f5f8', border: '1px solid #e6e9ef',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.3, fontWeight: 700, color: '#5a6578',
        flexShrink: 0,
      }}>
        {initial}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || "Logo"}
      onError={() => setErrored(true)}
      style={{
        width: size, height: size, borderRadius: radius,
        objectFit: 'contain', background: 'white',
        border: '1px solid #f0f2f6', padding: 4, flexShrink: 0,
      }}
    />
  );
}
