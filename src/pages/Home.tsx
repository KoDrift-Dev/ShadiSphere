import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../state/store';
import { Btn, Badge, Img, SectionHead, Field, Reveal, Stagger, StaggerItem, MiniCalendar , Select} from '../components/ui';
import { BUSINESS, EVENT_TYPES, EventType } from '../data/types';
import { pkr, todayISO } from '../lib/format';

const EVENT_BLURBS: Record<EventType, string> = {
  Barat: 'The grand procession and main celebration — our Crystal Hall hosts 300–1,000 guests.',
  Walima: 'The elegant reception feast — premium menus and refined staging.',
  Mehndi: 'Colour, music and dance — our Emerald Garden Lawn under the stars.',
  Nikah: 'An intimate, graceful ceremony — the Pearl Intimate Hall with bridal suite.',
  Reception: 'A formal evening gathering — premium sound, lighting and décor.',
  Engagement: 'The first celebration — beautiful spaces for family and close friends.',
};

const WHY = [
  { t: 'Transparent estimates', d: 'See every line item — food, hall, decoration and discounts — before you ask for a quote.' },
  { t: 'Three versatile event spaces', d: 'A grand hall, a garden lawn and an intimate hall — one venue, every kind of function.' },
  { t: 'Flexible menu selection', d: 'Start from a curated package, then add, remove or substitute dishes with clear pricing.' },
  { t: 'Date recommendations', d: 'Enter a preferred date and we suggest available alternatives at our venue within your window.' },
  { t: 'Faster inquiry process', d: 'Send a structured WhatsApp inquiry with your full estimate attached — no repeated phone calls.' },
];

const TESTIMONIALS = [
  { q: 'We planned our 600-guest Walima at the Grand Crystal Hall and walked into our venue visit knowing exactly what it would cost.', who: 'Ayesha & Daniyal', role: 'Walima at ShadiSphere Grand Marquee' },
  { q: 'Our preferred Saturday was booked, and the date finder suggested a Friday in the Emerald Garden Lawn with a weekday discount that cut our bill by ten percent.', who: 'Fatima K.', role: 'Mehndi at ShadiSphere Grand Marquee' },
  { q: 'As someone planning from abroad, seeing real per-guest math for the Pearl Intimate Hall before calling anyone made the whole process feel honest and easy.', who: 'Imran S.', role: 'Overseas Pakistani, Nikah at ShadiSphere' },
];


const HOW_IT_WORKS = [
  { n: '01', k: 'Estimate', t: 'Know your cost', d: 'Pick a menu package, customize dishes and add-ons, and watch an itemized estimate update instantly.', to: '/calculator', c: 'Open the calculator' },
  { n: '02', k: 'Dates', t: 'Find your date', d: 'Enter a preferred date — we suggest available alternatives across our spaces within your window.', to: '/planner', c: 'Find my date' },
  { n: '03', k: 'Inquire', t: 'Send it on WhatsApp', d: 'Your estimate becomes a structured inquiry you can send to our team in one tap — no repeated phone calls.', to: '/quote', c: 'Request a quote' },
];

function HeroSearch() {
  const { calc, setCalc } = useStore();
  const nav = useNavigate();
  // Empty with placeholders until the user searches; afterwards the
  // selection persists (no reset on return).
  const touched = !!calc.heroTouched;
  const [date, setDate] = useState(touched ? calc.date : '');
  const [eventType, setEventType] = useState<EventType | ''>(touched ? calc.eventType : '');
  const [guests, setGuests] = useState(touched && calc.guests ? String(calc.guests) : '');
  return (
    <form
      className="hero-search"
      aria-label="Find your wedding date"
      onSubmit={e => {
        e.preventDefault();
        const g = Math.min(3000, Math.max(50, Number(guests) || 400));
        setCalc(c => ({
          ...c, city: BUSINESS.city,
          date: date || todayISO(),
          eventType: (eventType || 'Barat') as EventType,
          guests: g, heroTouched: true,
        }));
        nav('/planner', { state: { autoFind: true } });
      }}
    >
      <Field label="Event date">
        <MiniCalendar value={date} onChange={setDate} ariaLabel="Event date" />
      </Field>
      <Field label="Event type">
        <Select value={eventType} onChange={v => setEventType(v as EventType)} ariaLabel="Event type">
          <option value="" disabled>Select event type</option>
          {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </Select>
      </Field>
      <Field label="Guests">
        <input type="number" className="input" value={guests} min={50} max={3000} step={10} placeholder="e.g. 400" onChange={e => setGuests(e.target.value)} aria-label="Guest count" />
      </Field>
      <div className="field">
        <label className="hide-m" aria-hidden="true">&nbsp;</label>
        <Btn type="submit" variant="primary" block>Find My Date →</Btn>
      </div>
    </form>
  );
}

export default function Home() {
  const { state } = useStore();
  const spaces = state.venues.filter(v => v.featured);
  const promos = state.promotions.filter(p => p.active);

  return (
    <div>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg">
          <Img src="/img/hero-wedding.jpg" alt="ShadiSphere Grand Marquee lit up in the evening" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div className="hero-veil" />
        <div className="hero-inner">
          <div className="hero-copy">
            <span className="eyebrow" style={{ color: 'var(--color-champagne-300)' }}><span className="rule" />{BUSINESS.name} · {BUSINESS.area}, Lahore</span>
            <h1>Plan Your <em>Perfect Wedding</em> Celebration.</h1>
          </div>
          <Stagger className="hero-ctas" gap={0.12}>
            <StaggerItem className="hero-cta-wrap"><Btn to="/calculator" variant="gold" size="lg">Calculate Cost</Btn></StaggerItem>
            <StaggerItem className="hero-cta-wrap"><Btn to="/venues" variant="light" size="lg">Explore Spaces</Btn></StaggerItem>
          </Stagger>
          <HeroSearch />
          <p className="hero-note">Illustrative estimates — not a live reservation system.</p>
        </div>
      </section>

      {/* OUR SPACES */}
      <section className="section">
        <div className="wrap">
          <Reveal>
            <SectionHead
              eyebrow="Our venue"
              title="Three event spaces, one celebration"
              action={<Btn to="/venues" variant="outline" size="sm">Explore Our Spaces →</Btn>}
            />
          </Reveal>
          <Stagger className="grid grid-3 grid-2m" gap={0.1}>
            {spaces.map((v, i) => (
              <StaggerItem key={v.id} className="h-full">
              <article className="card pkg-card space-card h-full transition-transform duration-300 hover:-translate-y-1.5">
                {i === 0 && <span className="badge badge-gold pkg-flag">Most loved</span>}
                <div className="card-img"><Img src={v.image} alt={v.name} /></div>
                <div className="card-body">
                  <div className="chip-row tag-row" style={{ marginBottom: 10 }}>
                    <Badge tone="green">{v.type}</Badge>
                    <Badge tone="gold">{v.config}</Badge>
                  </div>
                  <h3 className="card-title">{v.name}</h3>
                  <p className="card-meta hide-m">{BUSINESS.name} · {v.area}, Lahore</p>
                  <div className="chip-row" style={{ marginBottom: 12 }}>
                    <span className="chip font-display" style={{ cursor: 'default', fontWeight: 700, color: 'var(--color-pine-700)' }}>{v.minGuests.toLocaleString()}–{v.maxGuests.toLocaleString()} guests</span>
                  </div>
                  <p className="card-meta hide-m">Hall from {pkr(Math.min(v.hallRental.lunch, v.hallRental.afternoon, v.hallRental.evening))}</p>
                  <Btn to={`/venues/${v.id}`} variant="outline" block>View Details</Btn>
                </div>
              </article>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* CALCULATOR PROMO */}
      <section className="section-tight" style={{ background: 'var(--color-cream-200)' }}>
        <div className="wrap">
          <Reveal>
          <div className="panel relative overflow-hidden" style={{ padding: 24 }}>
            <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-champagne-300/30 blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-pine-500/10 blur-3xl" />
            <div className="grid grid-2 relative" style={{ alignItems: 'center' }}>
              <div>
                <span className="eyebrow"><span className="rule" />Smart cost calculator</span>
                <h2 style={{ fontSize: 'clamp(22px,2.6vw,28px)', marginBottom: 12 }}>Know your wedding cost in minutes.</h2>
                <div className="btn-pair">
                  <Btn to="/calculator" size="sm">Calculate Your Wedding Cost</Btn>
                  <Btn to="/menus" variant="outline" size="sm">Compare packages →</Btn>
                </div>
              </div>
              <div>
                <Stagger className="grid grid-2m" style={{ gap: 12 }} gap={0.08}>
                  {['Choose a menu package', 'Customize dishes & add-ons', 'Enter guests, date & space', 'Get an instant itemized estimate'].map((s, i) => (
                    <StaggerItem key={s}>
                      <div className="flex items-center gap-4 rounded-2xl border border-champagne-500/25 bg-white/70 !px-4 !py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.8),0_12px_34px_rgba(30,77,63,.10)] backdrop-blur-md">
                        <span className="font-display text-[26px] font-bold text-champagne-500 shrink-0" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                        <span className="grow font-semibold text-pine-900 min-w-0">{s}</span>
                        <span className="text-champagne-500 shrink-0" aria-hidden="true">→</span>
                      </div>
                    </StaggerItem>
                  ))}
                </Stagger>
              </div>
            </div>
          </div>
          </Reveal>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section-tight">
        <div className="wrap">
          <Reveal>
            <SectionHead eyebrow="How it works" title="From estimate to inquiry in three steps" lead="A guided journey — every step keeps your numbers transparent." center />
          </Reveal>
          <Stagger className="grid grid-3 grid-2m" gap={0.12}>
            {HOW_IT_WORKS.map(s => (
              <StaggerItem key={s.n} className="h-full">
                <div className="card tint-ivory h-full transition-transform duration-300 hover:-translate-y-1.5" style={{ padding: 20 }}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="font-display text-4xl font-bold text-champagne-500 shrink-0" aria-hidden="true">{s.n}</span>
                    <span className="eyebrow min-w-0" style={{ margin: 0 }}><span className="rule" />{s.k}</span>
                  </div>
                  <h3 className="mb-2 text-xl">{s.t}</h3>
                  <p className="small muted hide-m" style={{ marginBottom: 18 }}>{s.d}</p>
                  <Btn to={s.to} variant="outline" size="sm">{s.c} →</Btn>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* MENU COLLECTIONS */}
      <section className="section">
        <div className="wrap">
          <Reveal>
            <SectionHead
              eyebrow="Wedding menus"
              title="Five curated menu collections"
              action={<Btn to="/menus" variant="outline" size="sm">Explore Menus →</Btn>}
            />
          </Reveal>
          <Stagger className="grid grid-3 grid-2m" gap={0.1}>
            {state.packages.filter(p => p.enabled).map(p => (
              <StaggerItem key={p.id} className="h-full">
              <article className="card pkg-card h-full transition-transform duration-300 hover:-translate-y-1.5">
                {p.badge && <span className="badge badge-gold pkg-flag">{p.badge}</span>}
                <div className="card-img"><Img src={p.image} alt={`${p.name} package`} /></div>
                <div className="card-body">
                  <h3 className="card-title">{p.name}</h3>
                  <p className="card-meta hide-m">{p.tagline}</p>
                  <p className="price-lg price" style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-pine-600)' }}>{pkr(p.pricePerGuest)} <span className="small muted">per guest</span></p>
                  <p className="small muted hide-m">{p.included.length} dishes included</p>
                  <div style={{ marginTop: 14 }}><Btn to="/menus" variant="outline" size="sm" block>Explore Menus</Btn></div>
                </div>
              </article>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* EVENT TYPES */}
      <section className="section-tight bg-wash-warm">
        <div className="wrap">
          <Reveal><SectionHead eyebrow="Every function" title="Plan Barat, Walima, Mehndi and more" center /></Reveal>
          <Stagger className="grid grid-3 grid-2m" gap={0.08}>
            {EVENT_TYPES.map(t => (
              <StaggerItem key={t}>
                <div className="panel tint-champagne h-full transition-transform duration-300 hover:-translate-y-1" style={{ padding: 16 }}>
                  <h3 style={{ fontSize: 19, marginBottom: 0 }}>{t}</h3>
                  <p className="small muted hide-m" style={{ margin: '8px 0 0' }}>{EVENT_BLURBS[t]}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* WHY */}
      <section className="section bg-wash-mint">
        <div className="wrap">
          <Reveal><SectionHead eyebrow="Why ShadiSphere" title="Your celebration. Your venue. Your perfect plan." center /></Reveal>
          <Stagger className="grid grid-3 grid-2m" gap={0.1}>
            {WHY.map((w, i) => (
              <StaggerItem key={w.t} className="h-full">
                <div className="card tint-pine h-full transition-transform duration-300 hover:-translate-y-1.5" style={{ padding: 20 }}>
                  <div className="font-display text-[28px] font-bold text-champagne-500" style={{ marginBottom: 10 }} aria-hidden="true">{String(i + 1).padStart(2, '0')}</div>
                  <h3 style={{ fontSize: 18, marginBottom: 0 }}>{w.t}</h3>
                  <p className="small muted hide-m" style={{ margin: '8px 0 0' }}>{w.d}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* PROMOTIONS */}
      {promos.length > 0 && (
        <section className="section-tight">
          <div className="wrap">
            <Reveal><SectionHead eyebrow="Special offers" title="Current promotions" lead="Configurable in the owner dashboard. Eligibility is checked automatically in the calculator." /></Reveal>
            <Stagger className="grid" style={{ gap: 18 }} gap={0.08}>
              {promos.map(p => (
                <StaggerItem key={p.id}>
                  <div className="promo-strip">
                    <div className="grow" style={{ position: 'relative', zIndex: 1 }}>
                      <h3>{p.name} — save {p.percent}%</h3>
                      <p className="hide-m">{p.description}</p>
                    </div>
                    <Btn to="/calculator" variant="gold" size="sm">Calculate with this offer</Btn>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      <section className="section-tight">
        <div className="wrap">
          <Reveal><SectionHead eyebrow="Kind words" title="What families say" lead="Real-feel testimonials from fictional families." center /></Reveal>
        </div>
        <Reveal>
          <div className="marquee" aria-label="Testimonials">
            <div className="marquee-track">
              {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
                <div className="card testimonial t-slide" key={`${t.who}-${i}`} style={{ padding: 20 }}>
                  <div className="mb-3 text-champagne-500 tracking-[3px]" aria-label="Rated 5 out of 5">★★★★★</div>
                  <p>"{t.q}"</p>
                  <div className="who">{t.who}</div>
                  <div className="role hide-m">{t.role} · Sample testimonial — fictional</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* CLOSING CTA */}
      <section className="section-tight cta-gold">
        <div className="wrap center relative">
          <Reveal>
            <div aria-hidden="true" className="mx-auto mb-6 h-[2px] w-24 rounded-full bg-gradient-to-r from-transparent via-pine-700 to-transparent" />
            <h2 style={{ marginBottom: 8 }}>Ready to plan yours?</h2>
            <p className="cta-sub">Get an itemized estimate in minutes, then find a date that fits your celebration.</p>
            <div className="btn-pair center" style={{ marginTop: 20 }}>
              <Btn to="/calculator" variant="dark" size="sm">Calculate Your Wedding Cost</Btn>
              <Btn to="/planner" variant="outline" size="sm">Find my date →</Btn>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
