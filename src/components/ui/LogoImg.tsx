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

export default function LogoImg({ src, fallbackEmoji, size = 36, radius = 9 }: LogoImgProps) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div style={{
        width: size, height: size, borderRadius: radius,
        background: '#f4f5f8', border: '1px solid #f0f2f6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.5, flexShrink: 0,
      }}>
        {fallbackEmoji}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      onError={() => setErrored(true)}
      style={{
        width: size, height: size, borderRadius: radius,
        objectFit: 'contain', background: 'white',
        border: '1px solid #f0f2f6', padding: 4, flexShrink: 0,
      }}
    />
  );
}
