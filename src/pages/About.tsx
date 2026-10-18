import React from 'react';
import { Btn, PageHead } from '../components/ui';
import { CITIES } from '../data/types';

export default function About() {
  return (
    <div>
      <style>{`@media (max-width: 900px){ .grid-2{grid-template-columns:1fr;} .grid-3{grid-template-columns:1fr;} }`}</style>
      <div className="wrap">
        <div className="section-tight">
          <PageHead
            eyebrow="About ShadiSphere"
            title="Your Celebration. Your Venue. Your Perfect Plan."
            lead="Explore venues, customize menus and plan your wedding with confidence."
          />

          <div className="grid grid-2" style={{ alignItems: 'start', marginBottom: 40 }}>
            <div className="panel">
              <h3>Our story</h3>
              <p>
                ShadiSphere is a demonstration platform for the Pakistani wedding industry. It shows how a
                marriage hall, marquee or banquet business could let families discover venues, compare menus
                and estimate costs — before a single phone call.
              </p>
              <p>
                The demo covers the full journey: browsing venues across nine cities, customizing wedding
                menus with transparent per-guest pricing, checking simulated availability, getting smart date
                recommendations and sending a structured WhatsApp inquiry. Venue owners get a matching
                dashboard to manage listings, menus, sample bookings and promotions.
              </p>
              <p className="small muted" style={{ marginBottom: 0 }}>
                Built for presentation to marriage hall owners and managers. Every price, booking and review
                in this demo is fictional sample data.
              </p>
            </div>
            <div>
              <div className="panel" style={{ marginBottom: 20 }}>
                <h3>Service areas</h3>
                <div className="chip-row">
                  {CITIES.map(c => <span key={c} className="chip" style={{ cursor: 'default' }}>{c}</span>)}
                </div>
              </div>
              <div className="panel" style={{ borderLeft: '4px solid var(--gold)' }}>
                <h3>Demo contact</h3>
                <p className="small muted" style={{ marginBottom: 10 }}>Sample contact — demo only. Not a real business.</p>
                <p style={{ margin: '4px 0' }}><strong>Email:</strong> hello@shadisphere.demo</p>
                <p style={{ margin: '4px 0' }}><strong>Phone / WhatsApp:</strong> 0300-0000000 (sample)</p>
                <p style={{ margin: '4px 0' }}><strong>Office:</strong> 12-B Main Boulevard, Gulberg, Lahore (sample)</p>
              </div>
            </div>
          </div>

          <div className="alert alert-warn">
            <strong>Demo disclaimer.</strong> ShadiSphere is a sales demonstration. All venues, menus, prices,
            bookings, inquiries, promotions and testimonials are fictional sample data. Availability shown is
            simulated — this is not a live reservation system, and estimates are illustrative, not confirmed
            quotations. No payments are processed.
          </div>

          <div className="panel center" style={{ marginTop: 24, padding: 40 }}>
            <h2 style={{ marginBottom: 10 }}>Start planning your celebration</h2>
            <p className="lead">Enter your guests, pick a menu and see your estimate in minutes.</p>
            <Btn to="/calculator" size="lg">Calculate Your Wedding Cost</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
