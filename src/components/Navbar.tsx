import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Btn } from './ui';

// Desktop + mobile links. About/Owner Login live in the footer on desktop;
// About is also kept in the mobile menu, Owner Login stays footer-only.
const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/venues', label: 'Our Spaces' },
  { to: '/menus', label: 'Menus' },
  { to: '/calculator', label: 'Cost Calculator' },
  { to: '/calendar', label: 'Availability' },
  { to: '/planner', label: 'Date Finder' },
];
const MOBILE_EXTRA = [{ to: '/about', label: 'About' }];

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
        <button className="nav-toggle" onClick={() => setOpen(o => !o)} aria-label="Menu" aria-expanded={open}>☰</button>
        <nav className={`nav-links${open ? ' mobile-open' : ''}`} aria-label="Primary">
          {LINKS.map(l => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} onClick={() => setOpen(false)}
              className={({ isActive }) => isActive ? 'active' : ''}>{l.label}</NavLink>
          ))}
          {MOBILE_EXTRA.map(l => (
            <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className="mobile-only-link">{l.label}</NavLink>
          ))}
        </nav>
        <span className="nav-cta"><Btn to="/calculator" size="sm" variant="gold">Calculate Your Wedding Cost</Btn></span>
      </div>
    </header>
  );
}
