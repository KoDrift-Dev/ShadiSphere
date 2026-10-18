import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Btn } from './ui';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/venues', label: 'Venues' },
  { to: '/menus', label: 'Menus' },
  { to: '/calculator', label: 'Cost Calculator' },
  { to: '/calendar', label: 'Availability' },
  { to: '/planner', label: 'Date Finder' },
  { to: '/about', label: 'About' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const inDash = loc.pathname.startsWith('/dashboard');
  if (inDash) return null;
  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <Link to="/" className="brand" aria-label="ShadiSphere home">
          <span className="brand-mark">S</span>
          <span className="brand-name">Shadi<span>Sphere</span></span>
        </Link>
        <span className="demo-pill">Demo</span>
        <button className="nav-toggle" onClick={() => setOpen(o => !o)} aria-label="Menu" aria-expanded={open}>☰</button>
        <nav className={`nav-links${open ? ' mobile-open' : ''}`} aria-label="Primary">
          {LINKS.map(l => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} onClick={() => setOpen(false)}
              className={({ isActive }) => isActive ? 'active' : ''}>{l.label}</NavLink>
          ))}
          <NavLink to="/dashboard" onClick={() => setOpen(false)}>Owner Login</NavLink>
        </nav>
        <span className="nav-cta"><Btn to="/calculator" size="sm">Calculate Your Wedding Cost</Btn></span>
      </div>
      <style>{`
        @media (max-width: 1020px) {
          .nav-links { display: none; position: absolute; top: 70px; left: 0; right: 0; background: var(--ivory); flex-direction: column; padding: 12px 20px 20px; border-bottom: 1px solid var(--line); }
          .nav-links.mobile-open { display: flex; }
          .nav-toggle { display: block; }
          .nav-cta { display: none; }
        }
      `}</style>
    </header>
  );
}
