import React from 'react';
import { Btn, PageHead, Reveal, Stagger, StaggerItem } from '../components/ui';
import { BUSINESS } from '../data/types';
import { useStore } from '../state/store';

const VALUES = [
  { n: '01', t: 'Transparent pricing', d: 'Every line item — food, hall, décor and discounts — visible before you ever ask for a quote.' },
  { n: '02', t: 'Crafted hospitality', d: 'In-house catering, refined staging and a team that treats your function like their own celebration.' },
  { n: '03', t: 'One venue, every function', d: 'A grand hall, a garden lawn and an intimate hall — Barat to Walima under one roof.' },
];

export default function About() {
  const { state } = useStore();
  return (
    <div>
      <style>{`@media (max-width: 900px){ .grid-2{grid-template-columns:1fr;} .grid-3{grid-template-columns:1fr;} }`}</style>
      <div className="wrap">
        <div className="section-tight">
          <Reveal>
            <PageHead
              eyebrow={`About ${BUSINESS.name}`}
              title="Your Celebration. Your Venue. Your Perfect Plan."
              lead="Explore our spaces, customize menus and plan your wedding with confidence."
            />
          </Reveal>
          <div aria-hidden="true" className="my-2 mb-10 h-[2px] w-28 rounded-full bg-gradient-to-r from-champagne-400 via-champagne-500 to-transparent" />

          <div className="grid grid-2" style={{ alignItems: 'start', marginBottom: 40 }}>
            <Reveal className="h-full">
            <div className="panel relative overflow-hidden h-full">
              <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-champagne-300/25 blur-3xl" />
              <span className="eyebrow relative" style={{ marginBottom: 10 }}><span className="rule" />Our story</span>
              <p className="relative font-display text-[22px] leading-relaxed text-pine-900" style={{ marginBottom: 16 }}>
                {BUSINESS.name} is a fictional premium marriage hall in {BUSINESS.area}, Lahore — created to
                showcase the kind of customized website and booking-management solution we build for
                individual marriage hall owners.
              </p>
              <p className="relative">
                This site covers the full customer journey: exploring our three event spaces, customizing
                wedding menus with transparent per-guest pricing in the smart cost calculator, checking
                simulated availability, getting smart date recommendations and sending a structured WhatsApp
                inquiry. The owner gets a matching dashboard to manage spaces, menus, sample bookings,
                inquiries and promotions.
              </p>
              <p className="small muted relative" style={{ marginBottom: 0 }}>
                Built for presentation to marriage hall owners and managers. Every price, booking and review
                shown here is fictional sample data.
              </p>
            </div>
            </Reveal>
            <div>
              <Reveal delay={0.05}>
              <div className="panel" style={{ marginBottom: 20 }}>
                <span className="eyebrow" style={{ marginBottom: 10 }}><span className="rule" />The venue</span>
                <h3>Our event spaces</h3>
                <div className="chip-row">
                  {state.venues.map(v => <span key={v.id} className="chip" style={{ cursor: 'default' }}>{v.name} · {v.minGuests.toLocaleString()}–{v.maxGuests.toLocaleString()}</span>)}
                </div>
                <p className="small muted" style={{ marginBottom: 0, marginTop: 10 }}>{BUSINESS.address}</p>
              </div>
              </Reveal>
              <Reveal delay={0.1}>
              <div className="panel" style={{ borderLeft: '4px solid var(--color-champagne-500)' }}>
                <span className="eyebrow" style={{ marginBottom: 10 }}><span className="rule" />Get in touch</span>
                <h3>Contact</h3>
                <p className="small muted" style={{ marginBottom: 10 }}>Sample contact — not a real business.</p>
                <p style={{ margin: '4px 0' }}><strong>Email:</strong> {BUSINESS.email}</p>
                <p style={{ margin: '4px 0' }}><strong>Phone / WhatsApp:</strong> {BUSINESS.phone} (sample)</p>
                <p style={{ margin: '4px 0' }}><strong>Address:</strong> {BUSINESS.address} (sample)</p>
              </div>
              </Reveal>
            </div>
          </div>

          <div aria-hidden="true" className="my-10 h-px bg-gradient-to-r from-transparent via-champagne-500/50 to-transparent" />

          {/* VALUES */}
          <Reveal>
            <div className="center" style={{ marginBottom: 26 }}>
              <span className="eyebrow"><span className="rule" />What we stand for</span>
              <h2 className="font-display" style={{ marginBottom: 6 }}>The ShadiSphere promise</h2>
            </div>
          </Reveal>
          <Stagger className="grid grid-3" gap={0.1} style={{ marginBottom: 40 }}>
            {VALUES.map(v => (
              <StaggerItem key={v.n} className="h-full">
                <div className="card h-full transition-transform duration-300 hover:-translate-y-1.5" style={{ padding: 26 }}>
                  <div className="font-display text-[28px] font-bold text-champagne-500" style={{ marginBottom: 10 }} aria-hidden="true">{v.n}</div>
                  <h3 style={{ fontSize: 18, marginBottom: 8 }}>{v.t}</h3>
                  <p className="small muted" style={{ margin: 0 }}>{v.d}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          {/* VISIT — map placeholder */}
          <Reveal>
          <div className="panel relative overflow-hidden" style={{ marginBottom: 40 }}>
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-pine-500/10 blur-3xl" />
            <div className="grid grid-2 relative" style={{ alignItems: 'center', gap: 28 }}>
              <div>
                <span className="eyebrow" style={{ marginBottom: 10 }}><span className="rule" />Visit us</span>
                <h3>Find us in DHA Phase 5</h3>
                <p className="small muted">{BUSINESS.address} — sample address.</p>
                <div className="chip-row">
                  <span className="chip" style={{ cursor: 'default' }}>Main Boulevard</span>
                  <span className="chip" style={{ cursor: 'default' }}>DHA Phase 5</span>
                  <span className="chip" style={{ cursor: 'default' }}>Lahore</span>
                </div>
              </div>
              <div className="relative h-56 overflow-hidden rounded-2xl border border-champagne-500/25" style={{ background: 'linear-gradient(135deg, #163A30 0%, #1E4D3F 55%, #2A6353 100%)' }} role="img" aria-label="Stylized map preview of the venue location">
                <div aria-hidden="true" className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,.06) 0 1px, transparent 1px 34px), repeating-linear-gradient(90deg, rgba(255,255,255,.06) 0 1px, transparent 1px 34px)' }} />
                <div aria-hidden="true" className="absolute left-[18%] top-[30%] h-px w-[64%] rotate-[-18deg] bg-champagne-400/40" />
                <div aria-hidden="true" className="absolute left-[55%] top-[8%] h-[84%] w-px bg-champagne-400/30" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  <span className="relative mx-auto mb-2 block h-4 w-4">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-champagne-400 opacity-60" aria-hidden="true" />
                    <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-cream-50 bg-champagne-500" aria-hidden="true" />
                  </span>
                  <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[12px] font-semibold text-cream-50 backdrop-blur-md">ShadiSphere Grand Marquee</span>
                </div>
                <span className="absolute bottom-3 right-4 text-[11px] font-medium uppercase tracking-widest text-cream-50/60">Map preview</span>
              </div>
            </div>
          </div>
          </Reveal>

          <div className="alert alert-warn">
            <strong>Please note.</strong> {BUSINESS.name} is a fictional business built to showcase our work. All spaces, menus, prices, bookings, inquiries, promotions and testimonials are
            fictional sample data. Availability shown is simulated — this is not a live reservation system,
            and estimates are illustrative, not confirmed quotations. No payments are processed.
          </div>

          <Reveal>
          <div className="panel center relative overflow-hidden" style={{ marginTop: 24, padding: 40 }}>
            <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[28rem] -translate-x-1/2 rounded-full bg-champagne-300/25 blur-3xl" />
            <div aria-hidden="true" className="mx-auto mb-6 h-[2px] w-24 rounded-full bg-gradient-to-r from-transparent via-champagne-400 to-transparent" />
            <h2 className="relative" style={{ marginBottom: 10 }}>Start planning your celebration</h2>
            <p className="lead relative">Enter your guests, pick a menu and see your estimate in minutes.</p>
            <div className="relative"><Btn to="/calculator" size="lg">Calculate Your Wedding Cost</Btn></div>
          </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
