import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span className="brand-mark">S</span>
            <span className="brand-name" style={{ color: '#fff' }}>Shadi<span style={{ color: 'var(--gold-2)' }}>Sphere</span></span>
          </div>
          <p style={{ fontSize: 14, maxWidth: 320 }}>Your Celebration. Your Venue. Your Perfect Plan. Explore venues, customize menus and plan your wedding with confidence.</p>
          <p style={{ fontSize: 12.5, color: '#A9A28C' }}>Demo contact (sample only): hello@shadisphere.demo · 0300-0000000 · Lahore, Pakistan</p>
        </div>
        <div>
          <h4>Explore</h4>
          <Link to="/venues">Venues</Link>
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
          <h4>Service Areas</h4>
          <p style={{ fontSize: 14 }}>Kharian · Lahore · Karachi · Islamabad · Rawalpindi · Faisalabad · Gujranwala · Multan · Sialkot</p>
        </div>
      </div>
      <div className="footer-bottom">
        © 2026 ShadiSphere (demo). All venues, prices, availability and reviews are fictional sample data for demonstration only — not real businesses, quotations or reservations.
      </div>
    </footer>
  );
}
