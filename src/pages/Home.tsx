import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../state/store';
import { Btn, Badge, Img, SectionHead, Field } from '../components/ui';
import { CITIES, EVENT_TYPES, EventType } from '../data/types';
import { pkr, todayISO } from '../lib/format';

const EVENT_BLURBS: Record<EventType, string> = {
  Barat: 'The grand procession and main celebration — marquees built for 500+ guests.',
  Walima: 'The elegant reception feast — premium menus and refined staging.',
  Mehndi: 'Colour, music and dance — lawns and marquees with space to celebrate.',
  Nikah: 'An intimate, graceful ceremony — halls with bridal suites and prayer areas.',
  Reception: 'A formal evening gathering — banquets with premium sound and lighting.',
  Engagement: 'The first celebration — beautiful venues for family and close friends.',
};

const WHY = [
  { t: 'Transparent estimates', d: 'See every line item — food, hall, decoration and discounts — before you ask for a quote.' },
  { t: 'Multiple venue options', d: 'Compare halls, marquees, lawns and estates across nine Pakistani cities in one place.' },
  { t: 'Flexible menu selection', d: 'Start from a curated package, then add, remove or substitute dishes with clear pricing.' },
  { t: 'Date recommendations', d: 'Enter a preferred date and we suggest available alternatives within your window.' },
  { t: 'Faster inquiry process', d: 'Send a structured WhatsApp inquiry with your full estimate attached — no repeated phone calls.' },
];

const TESTIMONIALS = [
  { q: 'We compared three marquees in Lahore in one evening and walked into the venue visit knowing exactly what our 600-guest Walima would cost.', who: 'Ayesha & Daniyal', role: 'Married in Lahore, 2026' },
  { q: 'The date finder saved us. Our preferred Saturday was booked, and it suggested a Friday with a weekday discount that cut our bill by ten percent.', who: 'Fatima K.', role: 'Mehndi planner, Karachi' },
  { q: 'As someone planning from abroad, seeing real per-guest math before calling anyone made the whole process feel honest and easy.', who: 'Imran S.', role: 'Overseas Pakistani, Islamabad event' },
];

function HeroSearch() {
  const { setCalc } = useStore();
  const nav = useNavigate();
  const [city, setCity] = useState('Lahore');
  const [date, setDate] = useState(todayISO());
  const [eventType, setEventType] = useState<EventType>('Barat');
  const [guests, setGuests] = useState(400);
  return (
    <form
      className="hero-search"
      aria-label="Find your wedding date"
      onSubmit={e => {
        e.preventDefault();
        const g = Math.min(3000, Math.max(50, guests || 400));
        setCalc(c => ({ ...c, city, date, eventType, guests: g }));
        nav('/planner');
      }}
    >
      <Field label="City">
        <select className="input" value={city} onChange={e => setCity(e.target.value)} aria-label="City">
          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Event date">
        <input type="date" className="input" value={date} min={todayISO()} onChange={e => setDate(e.target.value)} aria-label="Event date" />
      </Field>
      <Field label="Event type">
        <select className="input" value={eventType} onChange={e => setEventType(e.target.value as EventType)} aria-label="Event type">
          {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Guests">
        <input type="number" className="input" value={guests} min={50} max={3000} step={10} onChange={e => setGuests(Number(e.target.value))} aria-label="Guest count" />
      </Field>
      <div className="field">
        <label>&nbsp;</label>
        <Btn type="submit" variant="gold" block>Find My Date →</Btn>
      </div>
    </form>
  );
}

export default function Home() {
  const { state } = useStore();
  const itemById = new Map(state.menuItems.map(i => [i.id, i]));
  const featured = state.venues.filter(v => v.featured);
  const promos = state.promotions.filter(p => p.active);

  return (
    <div>
      <style>{`@media (max-width: 900px){ .hero-search{grid-template-columns:1fr 1fr;} .grid-3,.grid-4,.grid-2{grid-template-columns:1fr;} .hero-inner{padding:64px 24px 56px;} }
@media (max-width: 560px){ .hero-search{grid-template-columns:1fr;} }`}</style>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg">
          <Img src="/img/hero-wedding.jpg" alt="Pakistani wedding marquee lit up in the evening" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div className="hero-veil" />
        <div className="hero-inner">
          <h1>Plan Your <em>Perfect Wedding</em> Celebration.</h1>
          <p className="sub">
            Explore venues, customize menus and estimate your wedding cost with confidence —
            across Kharian, Lahore, Karachi and six more cities.
          </p>
          <div className="hero-ctas">
            <Btn to="/calculator" variant="gold" size="lg">Calculate Your Wedding Cost</Btn>
            <Btn to="/venues" variant="outline" size="lg">Explore Venues</Btn>
          </div>
          <HeroSearch />
          <p className="hero-note">Demo availability — illustrative estimates. Not a live reservation system.</p>
        </div>
      </section>

      {/* FEATURED VENUES */}
      <section className="section">
        <div className="wrap">
          <SectionHead
            eyebrow="Featured venues"
            title="Handpicked halls, marquees and lawns"
            lead="A sample of the venues in our demo network. Every listing shows real indicative pricing."
            action={<Btn to="/venues" variant="outline">View all venues →</Btn>}
          />
          <div className="grid grid-3">
            {featured.map(v => (
              <article className="card" key={v.id}>
                <div className="card-img"><Img src={v.image} alt={v.name} /></div>
                <div className="card-body">
                  <div className="chip-row" style={{ marginBottom: 10 }}>
                    <Badge tone="green">{v.type}</Badge>
                    <Badge tone="gold">{v.config}</Badge>
                  </div>
                  <h3 className="card-title">{v.name}</h3>
                  <p className="card-meta">{v.city} · {v.area}</p>
                  <p className="card-meta">Up to {v.maxGuests.toLocaleString()} guests · Hall from {pkr(Math.min(v.hallRental.lunch, v.hallRental.afternoon, v.hallRental.evening))}</p>
                  <Btn to={`/venues/${v.id}`} variant="outline" block>View Details</Btn>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CALCULATOR PROMO */}
      <section className="section-tight" style={{ background: 'var(--ivory-2)' }}>
        <div className="wrap">
          <div className="panel" style={{ padding: 40 }}>
            <div className="grid grid-2" style={{ alignItems: 'center' }}>
              <div>
                <span className="eyebrow"><span className="rule" />Smart cost calculator</span>
                <h2 style={{ fontSize: 'clamp(26px,3vw,34px)', marginBottom: 12 }}>Know your wedding cost in minutes.</h2>
                <p className="lead">Pick a menu package, customize dishes, add extras and watch your itemized estimate update instantly — per guest and in total.</p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
                  <Btn to="/calculator" size="lg">Calculate Your Wedding Cost</Btn>
                  <Btn to="/menus" variant="ghost">Compare packages →</Btn>
                </div>
              </div>
              <div>
                <div className="grid" style={{ gap: 12 }}>
                  {['1. Choose a menu package', '2. Customize dishes & add-ons', '3. Enter guests, date & venue', '4. Get an instant itemized estimate'].map(s => (
                    <div key={s} className="slot-row" style={{ margin: 0 }}><span className="grow" style={{ fontWeight: 600 }}>{s}</span><span aria-hidden="true">→</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MENU COLLECTIONS */}
      <section className="section">
        <div className="wrap">
          <SectionHead
            eyebrow="Wedding menus"
            title="Five curated menu collections"
            lead="From essential feasts to grand gourmet spreads. Rates are illustrative demo values."
            action={<Btn to="/menus" variant="outline">Explore Menus →</Btn>}
          />
          <div className="grid grid-3">
            {state.packages.filter(p => p.enabled).map(p => (
              <article className="card pkg-card" key={p.id}>
                {p.badge && <span className="badge badge-gold pkg-flag">{p.badge}</span>}
                <div className="card-img"><Img src={p.image} alt={`${p.name} package`} /></div>
                <div className="card-body">
                  <h3 className="card-title">{p.name}</h3>
                  <p className="card-meta">{p.tagline}</p>
                  <p className="price-lg price" style={{ fontSize: 22, fontWeight: 800, color: 'var(--emerald)' }}>{pkr(p.pricePerGuest)} <span className="small muted">per guest</span></p>
                  <p className="small muted">{p.included.length} dishes included</p>
                  <div style={{ marginTop: 14 }}><Btn to="/menus" variant="outline" block>Explore Menus</Btn></div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* EVENT TYPES */}
      <section className="section-tight" style={{ background: 'var(--ivory-2)' }}>
        <div className="wrap">
          <SectionHead eyebrow="Every function" title="Plan Barat, Walima, Mehndi and more" center />
          <div className="grid grid-3">
            {EVENT_TYPES.map(t => (
              <div className="panel" key={t} style={{ padding: 22 }}>
                <h3 style={{ fontSize: 19, marginBottom: 8 }}>{t}</h3>
                <p className="small muted" style={{ margin: 0 }}>{EVENT_BLURBS[t]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="section">
        <div className="wrap">
          <SectionHead eyebrow="Why ShadiSphere" title="Your celebration. Your venue. Your perfect plan." center />
          <div className="grid grid-3">
            {WHY.map((w, i) => (
              <div className="card" key={w.t} style={{ padding: 26 }}>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: 'var(--gold)', marginBottom: 10 }}>{String(i + 1).padStart(2, '0')}</div>
                <h3 style={{ fontSize: 18, marginBottom: 8 }}>{w.t}</h3>
                <p className="small muted" style={{ margin: 0 }}>{w.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROMOTIONS */}
      {promos.length > 0 && (
        <section className="section-tight">
          <div className="wrap">
            <SectionHead eyebrow="Demo offers" title="Sample promotions" lead="Configurable in the owner dashboard. Eligibility is checked automatically in the calculator." />
            <div className="grid" style={{ gap: 18 }}>
              {promos.map(p => (
                <div className="promo-strip" key={p.id}>
                  <div className="grow" style={{ position: 'relative', zIndex: 1 }}>
                    <h3>{p.name} — save {p.percent}%</h3>
                    <p>{p.description}</p>
                  </div>
                  <Btn to="/calculator" variant="gold" size="sm">Calculate with this offer</Btn>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      <section className="section-tight">
        <div className="wrap">
          <SectionHead eyebrow="Kind words" title="What families say" lead="Sample testimonials — fictional, written for this demo." center />
          <div className="grid grid-3">
            {TESTIMONIALS.map(t => (
              <div className="card testimonial" key={t.who} style={{ padding: 26 }}>
                <p>"{t.q}"</p>
                <div className="who">{t.who}</div>
                <div className="role">{t.role} · Sample testimonial — fictional</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INCLUDED DISHES strip (uses itemById so Menus data is exercised) */}
      <section className="section-tight" style={{ background: 'var(--emerald)', color: '#fff' }}>
        <div className="wrap center">
          <h2 style={{ color: '#fff', marginBottom: 10 }}>Ready to plan yours?</h2>
          <p className="sub" style={{ color: 'rgba(255,255,255,.85)', maxWidth: 560, margin: '0 auto 24px' }}>
            {itemById.size} sample dishes, {featured.length} featured venues, {EVENT_TYPES.length} event types — one smart estimate.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Btn to="/calculator" variant="gold" size="lg">Calculate Your Wedding Cost</Btn>
            <Link to="/planner" style={{ color: '#fff', alignSelf: 'center', fontWeight: 600 }}>Find my date →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
