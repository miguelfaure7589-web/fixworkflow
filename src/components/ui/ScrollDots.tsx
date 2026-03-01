'use client';

interface ScrollDotsProps {
  count: number;
  activeIndex: number;
}

export default function ScrollDots({ count, activeIndex }: ScrollDotsProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingTop: 10 }}>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: i === activeIndex ? 'var(--text-primary)' : 'var(--text-faint)',
            transition: 'background 0.2s',
          }}
        />
      ))}
    </div>
  );
}
