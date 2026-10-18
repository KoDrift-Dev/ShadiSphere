import React from 'react';
import { Btn, PageHead } from '../components/ui';
import { BUSINESS } from '../data/types';
import { useStore } from '../state/store';

export default function About() {
  const { state } = useStore();
  return (
    <div>
      <style>{`@media (max-width: 900px){ .grid-2{grid-template-columns:1fr;} .grid-3{grid-template-columns:1fr;} }`}</style>
      <div className="wrap">
        <div className="section-tight">
          <PageHead
            eyebrow={`About ${BUSINESS.name}`}
            title="Your Celebration. Your Venue. Your Perfect Plan."
            lead="Explore our spaces, customize menus and plan your wedding with confidence."
          />

          <div className="grid grid-2" style={{ alignItems: 'start', marginBottom: 40 }}>
            <div className="panel">
              <h3>Our story</h3>
              <p>
                {BUSINESS.name} is a fictional premium marriage hall in {BUSINESS.area}, Lahore — created to
                demonstrate the kind of customized website and booking-management solution we build for
                individual marriage hall owners.
              </p>
              <p>
                The demo covers the full customer journey: exploring our three event spaces, customizing
                wedding menus with transparent per-guest pricing in the smart cost calculator, checking
                simulated availability, getting smart date recommendations and sending a structured WhatsApp
                inquiry. The owner gets a matching dashboard to manage spaces, menus, sample bookings,
                inquiries and promotions.
              </p>
              <p className="small muted" style={{ marginBottom: 0 }}>
                Built for presentation to marriage hall owners and managers. Every price, booking and review
                in this demo is fictional sample data.
              </p>
            </div>
            <div>
              <div className="panel" style={{ marginBottom: 20 }}>
                <h3>Our event spaces</h3>
                <div className="chip-row">
                  {state.venues.map(v => <span key={v.id} className="chip" style={{ cursor: 'default' }}>{v.name} · {v.minGuests.toLocaleString()}–{v.maxGuests.toLocaleString()}</span>)}
                </div>
                <p className="small muted" style={{ marginBottom: 0, marginTop: 10 }}>{BUSINESS.address}</p>
              </div>
              <div className="panel" style={{ borderLeft: '4px solid var(--gold)' }}>
                <h3>Demo contact</h3>
                <p className="small muted" style={{ marginBottom: 10 }}>Sample contact — demo only. Not a real business.</p>
                <p style={{ margin: '4px 0' }}><strong>Email:</strong> {BUSINESS.email}</p>
                <p style={{ margin: '4px 0' }}><strong>Phone / WhatsApp:</strong> {BUSINESS.phone} (sample)</p>
                <p style={{ margin: '4px 0' }}><strong>Address:</strong> {BUSINESS.address} (sample)</p>
              </div>
            </div>
          </div>

          <div className="alert alert-warn">
            <strong>Demo disclaimer.</strong> {BUSINESS.name} is a fictional business built for sales
            demonstration. All spaces, menus, prices, bookings, inquiries, promotions and testimonials are
            fictional sample data. Availability shown is simulated — this is not a live reservation system,
            and estimates are illustrative, not confirmed quotations. No payments are processed.
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
