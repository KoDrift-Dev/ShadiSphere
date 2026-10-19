import { Link } from 'react-router-dom';
import { BUSINESS } from '../data/types';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span className="brand-mark">S</span>
            <span className="brand-name" style={{ color: '#fff' }}>Shadi<span style={{ color: 'var(--color-champagne-300)' }}>Sphere</span></span>
          </div>
          <p style={{ fontSize: 14, maxWidth: 'min(320px, 100%)' }}>{BUSINESS.name} — {BUSINESS.tagline} Explore our spaces, customize menus and plan your wedding with confidence.</p>
          <p style={{ fontSize: 12.5, color: '#A9A28C' }}>Contact: {BUSINESS.email} · {BUSINESS.phone} · {BUSINESS.address}</p>
        </div>
        <div>
          <h4>Explore</h4>
          <Link to="/venues">Our Spaces</Link>
          <Link to="/menus">Menus & Packages</Link>
          <Link to="/calculator">Cost Calculator</Link>
          <Link to="/calendar">Availability</Link>
          <Link to="/planner">Date Finder</Link>
        </div>
        <div>
          <h4>Plan</h4>
          <Link to="/quote">Request a Quote</Link>
          <Link to="/planner">Multi-Event Planner</Link>
          <Link to="/about">About & Contact</Link>
          <Link to="/dashboard">Owner Dashboard</Link>
        </div>
        <div>
          <h4>Visit Us</h4>
          <p style={{ fontSize: 14 }}>{BUSINESS.name}<br />{BUSINESS.address}</p>
          <p style={{ fontSize: 12.5, color: '#A9A28C' }}>Open for visits 11:00 – 21:00, all days.</p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 {BUSINESS.name}. All spaces, prices, availability and reviews are fictional sample data for illustration — not a real business, quotation or reservation.</span>
        <span className="credit">Developed by <a href="https://kodriftdev.vercel.app/" target="_blank" rel="noreferrer">KoDriftDev</a></span>
      </div>
    </footer>
  );
}
