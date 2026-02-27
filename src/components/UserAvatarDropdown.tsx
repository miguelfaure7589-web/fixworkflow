'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

interface UserAvatarDropdownProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    avatarUrl?: string | null;
  };
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return 'U';
}

const base: React.CSSProperties = {
  display: 'block', padding: '8px 16px', fontSize: 13, color: 'var(--text-primary)',
  textDecoration: 'none', cursor: 'pointer', transition: 'background 0.15s',
};

function MenuItem({ href, onClick, children, muted }: { href?: string; onClick?: () => void; children: React.ReactNode; muted?: boolean }) {
  const [hov, setHov] = useState(false);
  const style: React.CSSProperties = { ...base, background: hov ? 'var(--bg-elevated)' : 'transparent', ...(muted ? { color: 'var(--text-muted)' } : {}) };

  if (href) {
    return <Link href={href} onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={style}>{children}</Link>;
  }
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ ...style, border: 'none', width: '100%', textAlign: 'left', fontFamily: 'inherit' }}>
      {children}
    </button>
  );
}

export default function UserAvatarDropdown({ user }: UserAvatarDropdownProps) {
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [open]);

  const initials = getInitials(user.name, user.email);
  const avatarSrc = user.avatarUrl || user.image;
  const showImage = avatarSrc && !imgError;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}>
        {showImage ? (
          <img
            src={avatarSrc!}
            alt={user.name || 'User'}
            onError={() => setImgError(true)}
            style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#4361ee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>
            {initials}
          </div>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 200,
          background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border-default)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)', padding: '12px 0', zIndex: 200,
        }}>
          <div style={{ padding: '8px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user.name || 'User'}</div>
            {user.email && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{user.email}</div>}
          </div>
          <div style={{ height: 1, background: 'var(--border-light)', margin: '6px 0' }} />
          <MenuItem href="/dashboard" onClick={() => setOpen(false)}>Dashboard</MenuItem>
          <MenuItem href="/settings" onClick={() => setOpen(false)}>Settings</MenuItem>
          <div style={{ height: 1, background: 'var(--border-light)', margin: '6px 0' }} />
          <MenuItem muted onClick={() => signOut({ callbackUrl: '/' })}>Sign Out</MenuItem>
        </div>
      )}
    </div>
  );
}
