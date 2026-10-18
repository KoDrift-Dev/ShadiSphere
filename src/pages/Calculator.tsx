// ShadiSphere smart wedding cost calculator — the core interactive feature.
import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '../state/store';
import {
  Btn, Badge, Field, Empty, PageHead, Qty, Img,
  Reveal, Stagger, StaggerItem,
} from '../components/ui';
import { calculate, quickEstimate, MAX_DISCOUNT_PCT } from '../lib/calc';
import { slotStatus, isSlotBookable } from '../lib/availability';
import {
  pkr, fmtDate, todayISO, unitLabel,
} from '../lib/format';
import {
  BUSINESS, EVENT_TYPES, SLOTS, MenuItem, SlotId, EventType,
} from '../data/types';

const MIN_G = 50;
const MAX_G = 3000;
const COMPARE_ORDER = ['basic', 'standard', 'premium', 'vip', 'luxury'];

/** Small premium section label for calculator panels. */
function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <h2 className="font-sans text-[13px] font-bold uppercase tracking-[0.18em] text-pine-600 mb-4" style={style}>
      <span className="inline-block w-7 h-[2px] rounded-full bg-gradient-to-r from-champagne-500 to-champagne-300 mr-2.5 -translate-y-[3px]" />
      {children}
    </h2>
  );
}

/** Compact custom month-view date picker (theme-styled). */
function MiniCalendar({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const [open, setOpen] = useState(false);
  const today = todayISO();
  const [view, setView] = useState(() => {
    const src = value && value >= today ? value : today;
    const [y, m] = src.split('-').map(Number);
    return { y, m: m - 1 };
  });
  const first = new Date(view.y, view.m, 1);
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(first.getDay()).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const iso = (d: number) =>
    `${view.y}-${String(view.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const shift = (dir: number) =>
    setView(v => {
      const m = v.m + dir;
      return { y: v.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 };
    });
  return (
    <div className="mini-cal-wrap">
      <button
        type="button" className="input mini-cal-btn"
        onClick={() => setOpen(o => !o)} aria-haspopup="dialog" aria-expanded={open}
        aria-label="Choose event date"
      >
        <span>{value ? fmtDate(value) : 'Select date'}</span>
        <span aria-hidden="true" style={{ color: 'var(--color-pine-600)' }}>📅</span>
      </button>
      {open && (
        <>
          <div className="mini-cal-veil" onClick={() => setOpen(false)} />
          <div className="mini-cal-pop" role="dialog" aria-label="Choose event date">
            <div className="mini-cal-head">
              <button type="button" className="mini-cal-nav" onClick={() => shift(-1)} aria-label="Previous month">‹</button>
              <strong>{first.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</strong>
              <button type="button" className="mini-cal-nav" onClick={() => shift(1)} aria-label="Next month">›</button>
            </div>
            <div className="mini-cal-grid mini-cal-dow" aria-hidden="true">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i}>{d}</span>)}
            </div>
            <div className="mini-cal-grid">
              {cells.map((d, i) => d === null ? <span key={`e${i}`} /> : (
                <button
                  key={d} type="button" disabled={iso(d) < today}
                  className={`mini-cal-day${iso(d) === value ? ' sel' : ''}${iso(d) === today ? ' today' : ''}`}
                  onClick={() => { onChange(iso(d)); setOpen(false); }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function Calculator() {
  const { state, calc, setCalc, toast } = useStore();
  const nav = useNavigate();
  const [showCompare, setShowCompare] = useState(false);
  const [showMini, setShowMini] = useState(false);
  const [customCat, setCustomCat] = useState('');

  const result = useMemo(
    () => calculate(calc, state.venues, state.menuItems, state.packages, state.promotions, state.bookings),
    [calc, state.venues, state.menuItems, state.packages, state.promotions, state.bookings],
  );

  const venue = calc.venueId ? state.venues.find(v => v.id === calc.venueId) : undefined;
  const pkg = calc.packageId ? state.packages.find(p => p.id === calc.packageId && p.enabled) : undefined;
  const guests = Math.max(0, Math.floor(calc.guests || 0));
  const guestError = !guests || guests < MIN_G
    ? `Please enter at least ${MIN_G} guests.`
    : guests > MAX_G
      ? `Guest count cannot exceed ${MAX_G.toLocaleString()}.`
      : '';
  const dateError = calc.date < todayISO() ? 'Please choose today or a future date.' : '';
  const capWarn = venue && guests > 0 && (guests < venue.minGuests || guests > venue.maxGuests)
    ? `This venue fits ${venue.minGuests.toLocaleString()}–${venue.maxGuests.toLocaleString()} guests.` : '';
  const ss = (venue && calc.date) ? slotStatus(venue.id, calc.date, calc.slot, state.bookings) : null;
  const slotHeld = ss && !isSlotBookable(ss.status);

  const includedItems: MenuItem[] = pkg
    ? pkg.included
      .map(id => state.menuItems.find(i => i.id === id && i.enabled))
      .filter((i): i is MenuItem => !!i && !calc.removed.includes(i.id))
    : [];
  const removedItems: MenuItem[] = pkg
    ? pkg.included
      .map(id => state.menuItems.find(i => i.id === id && i.enabled))
      .filter((i): i is MenuItem => !!i && calc.removed.includes(i.id))
    : [];

  const addedMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of calc.added) m.set(a.itemId, a.qty);
    return m;
  }, [calc.added]);

  const setAdded = (itemId: string, qty: number) => {
    setCalc(c => {
      const rest = c.added.filter(a => a.itemId !== itemId);
      return qty > 0 ? { ...c, added: [...rest, { itemId, qty }] } : { ...c, added: rest };
    });
  };

  const addOnItems = state.menuItems.filter(i => i.enabled && i.addOnOnly);
  const beverages = addOnItems.filter(i => i.category === 'Beverages');
  const stationsAndServices = addOnItems.filter(
    i => i.category === 'Live Stations' || i.category === 'Decoration & Services',
  );
  const extraFood = state.menuItems.filter(
    i => i.enabled && !i.addOnOnly && i.unit === 'per_guest',
  );
  const customMains = extraFood; // mains the user may pick in fully-custom mode
  const customCats = useMemo(() => {
    const cats: string[] = [];
    for (const it of customMains) if (!cats.includes(it.category)) cats.push(it.category);
    return cats;
  }, [customMains]);
  const activeCat = customCat || customCats[0] || '';
  const catDishes = customMains.filter(i => i.category === activeCat);
  const nextCat = customCats[(customCats.indexOf(activeCat) + 1) % customCats.length] || '';
  const customSelected = customMains.filter(i => (addedMap.get(i.id) ?? 0) > 0);

  const includedIds = new Set(pkg?.included ?? []);
  const pkgAddables = extraFood.filter(i => !includedIds.has(i.id) && !calc.removed.includes(i.id));

  const compareRows = useMemo(() => {
    if (!showCompare) return [];
    return COMPARE_ORDER
      .map(id => state.packages.find(p => p.id === id && p.enabled))
      .filter((p): p is NonNullable<typeof p> => !!p)
      .map(p => {
        const total = venue
          ? quickEstimate(venue, guests, calc.slot, p)
          : p.pricePerGuest * guests;
        return { pkg: p, total, perGuest: guests > 0 ? total / guests : 0 };
      });
  }, [showCompare, state.packages, venue, guests, calc.slot]);

  const resetMenu = () => {
    setCalc(c => ({ ...c, removed: [], added: [] }));
    toast('Menu reset to the original package.');
  };

  const pickPkg = (id?: string) => {
    setCalc(c => ({ ...c, packageId: id, removed: [], added: [] }));
  };

  const kindBadge = (kind: string) => {
    switch (kind) {
      case 'discount': return <Badge tone="green">Discount</Badge>;
      case 'hall': return <Badge tone="gold">Venue</Badge>;
      case 'service': return <Badge tone="amber">Service</Badge>;
      case 'addon': return <Badge>Extra</Badge>;
      case 'food': return <Badge tone="green">Food</Badge>;
      default: return null;
    }
  };

  return (
    <div className="wrap">
      <style>{`
        .calc-grid { display: grid; grid-template-columns: 1fr; gap: 28px; align-items: start; }
        @media (min-width: 1024px) { .calc-grid { grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); } }
        .pkg-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
        @media (min-width: 640px) { .pkg-grid { grid-template-columns: repeat(2, 1fr); } }
        .slot-chips { display: flex; gap: 10px; flex-wrap: wrap; }
        .slot-chip {
          border: 1px solid rgba(30,77,63,.22); border-radius: 14px; padding: 10px 16px;
          background: rgba(255,255,255,.75); backdrop-filter: blur(8px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.85), 0 4px 12px rgba(30,77,63,.08);
          cursor: pointer; font-weight: 600; color: var(--color-ink-900);
          transition: all .16s ease; font-family: inherit;
        }
        .slot-chip small { display: block; font-weight: 400; color: var(--color-ink-400); font-size: 12px; margin-top: 2px; }
        .slot-chip:hover { transform: translateY(-2px); border-color: var(--color-pine-500); box-shadow: inset 0 1px 0 rgba(255,255,255,.85), 0 8px 20px rgba(30,77,63,.14); }
        .slot-chip.selected {
          border-color: var(--color-pine-700); color: #fff;
          background: linear-gradient(180deg, var(--color-pine-500), var(--color-pine-700));
          box-shadow: inset 0 1px 0 rgba(255,255,255,.25), 0 3px 0 var(--color-pine-800), 0 10px 22px rgba(30,77,63,.32);
        }
        .slot-chip.selected small { color: rgba(255,255,255,.82); }
        .slot-chip:focus-visible { outline: 3px solid var(--color-champagne-300); outline-offset: 2px; }
        .chip.selected:focus-visible { outline: 3px solid var(--color-champagne-300); outline-offset: 2px; }
        input[type="range"].slider { width: 100%; accent-color: #1E4D3F; }
        .cmp-table td, .cmp-table th { padding: 10px 12px; }
        .cmp-table tr.selected td { background: rgba(198,161,91,.12); font-weight: 700; }

        /* mini calendar date picker */
        .mini-cal-wrap { position: relative; }
        .mini-cal-btn { display: flex; align-items: center; justify-content: space-between; width: 100%; cursor: pointer; text-align: left; font-family: inherit; }
        .mini-cal-veil { position: fixed; inset: 0; z-index: 40; }
        .mini-cal-pop {
          position: absolute; z-index: 41; top: calc(100% + 8px); left: 0; width: 290px; max-width: calc(100vw - 48px);
          background: rgba(255,255,255,.97); backdrop-filter: blur(18px);
          border: 1px solid rgba(198,161,91,.35); border-radius: 16px;
          box-shadow: 0 24px 60px rgba(11,31,25,.25), inset 0 1px 0 #fff;
          padding: 14px; animation: pop-in .18s ease both;
        }
        .mini-cal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .mini-cal-head strong { font-family: var(--font-display); font-size: 15px; color: var(--color-pine-700); }
        .mini-cal-nav { width: 30px; height: 30px; border-radius: 10px; border: 1px solid rgba(30,77,63,.18); background: #fff; font-size: 16px; line-height: 1; cursor: pointer; color: var(--color-pine-700); }
        .mini-cal-nav:hover { background: rgba(30,77,63,.06); }
        .mini-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
        .mini-cal-dow span { text-align: center; font-size: 10px; font-weight: 700; color: var(--color-ink-400); padding: 4px 0; text-transform: uppercase; letter-spacing: .04em; }
        .mini-cal-day { aspect-ratio: 1; border: 0; background: transparent; border-radius: 10px; font-size: 12.5px; font-weight: 600; color: var(--color-ink-900); cursor: pointer; font-family: inherit; }
        .mini-cal-day:hover:not(:disabled) { background: rgba(30,77,63,.08); }
        .mini-cal-day:disabled { color: #CFC9B8; cursor: default; }
        .mini-cal-day.today { outline: 1px solid var(--color-champagne-500); outline-offset: -1px; }
        .mini-cal-day.sel { background: linear-gradient(180deg, var(--color-pine-500), var(--color-pine-700)); color: #fff; box-shadow: 0 3px 0 var(--color-pine-800); }

        /* smart category dish picker */
        .smart-cat-bar { display: flex; gap: 10px; align-items: flex-end; margin-bottom: 12px; }
        .smart-cat-bar .field { flex: 1; margin-bottom: 0; }
        .dish-pick-list { display: grid; gap: 8px; }
        @media (min-width: 640px) { .dish-pick-list { grid-template-columns: 1fr 1fr; } }
        .dish-toggle {
          display: flex; align-items: center; gap: 10px; text-align: left; cursor: pointer;
          border: 1px solid rgba(30,77,63,.16); border-radius: 12px; padding: 9px 12px;
          background: rgba(255,255,255,.8); transition: all .15s ease; font-family: inherit; width: 100%;
        }
        .dish-toggle:hover { border-color: var(--color-pine-500); transform: translateY(-1px); }
        .dish-toggle.sel { border-color: var(--color-pine-700); background: linear-gradient(165deg, rgba(30,77,63,.09), rgba(30,77,63,.03)); box-shadow: 0 0 0 3px rgba(30,77,63,.08); }
        .dish-check {
          width: 22px; height: 22px; border-radius: 8px; flex-shrink: 0;
          border: 1.5px solid rgba(30,77,63,.3); display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 800; color: #fff; background: #fff;
        }
        .dish-toggle.sel .dish-check { background: linear-gradient(180deg, var(--color-pine-500), var(--color-pine-700)); border-color: var(--color-pine-700); }
        .dish-toggle .nm { font-weight: 600; font-size: 13.5px; color: var(--color-ink-900); display: block; }
        .dish-toggle .pr { font-size: 12px; color: var(--color-ink-400); }
        .picked-summary { margin-top: 14px; }
        .picked-summary .chip button { background: none; border: 0; cursor: pointer; font-weight: 800; color: inherit; padding: 0 0 0 4px; font-size: 13px; }

        /* package full menu */
        .pkg-full-menu { margin-top: 14px; border-top: 1px dashed rgba(198,161,91,.4); padding-top: 16px; }
        .pkg-menu-head { display: flex; gap: 14px; align-items: center; margin-bottom: 14px; }
        .pkg-menu-head img { width: 64px; height: 64px; border-radius: 14px; object-fit: cover; flex-shrink: 0; }

        /* mobile estimate mini card */
        .estimate-mini { border-color: rgba(198,161,91,.45); background: linear-gradient(165deg, rgba(30,77,63,.97), rgba(16,42,35,.96)); color: #F2EEDF; }
        .em-head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
        .em-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .16em; color: var(--color-champagne-300); }
        .em-total { font-family: var(--font-display); font-size: 30px; font-weight: 700; color: #E8C873; }
        .em-sub { font-size: 12.5px; color: rgba(255,255,255,.65); margin: 6px 0 8px; }
        .em-toggle { background: none; border: 0; color: var(--color-champagne-300); font-weight: 700; font-size: 13px; cursor: pointer; padding: 4px 0; font-family: inherit; }
        .em-line { display: flex; justify-content: space-between; gap: 10px; font-size: 13px; padding: 7px 0; border-bottom: 1px solid rgba(198,161,91,.22); }
      `}</style>

      <Reveal>
        <PageHead
          eyebrow="Smart Cost Calculator"
          title="Calculate your wedding cost"
          lead="Pick a package, customize the menu, add extras — the estimate updates instantly. All prices are illustrative sample rates."
        />
      </Reveal>

      <div className="calc-grid">
        {/* ---------- LEFT: controls ---------- */}
        <div>
          <Reveal>
            <section className="panel panel-compact">
              <SectionLabel>Event details</SectionLabel>
              <div className="form-row c2">
                <Field label="Venue">
                  <input className="input" value={`${BUSINESS.name} · ${BUSINESS.area}, Lahore`} readOnly aria-label="Venue (fixed)" />
                </Field>
                <Field label="Event space (optional)">
                  <select
                    value={calc.venueId ?? ''}
                    onChange={e => setCalc(c => ({ ...c, venueId: e.target.value || undefined }))}
                    aria-label="Event space"
                  >
                    <option value="">No space selected yet</option>
                    {state.venues.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="form-row c2">
                <Field label="Event type">
                  <select
                    value={calc.eventType}
                    onChange={e => setCalc(c => ({ ...c, eventType: e.target.value as EventType }))}
                    aria-label="Event type"
                  >
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Number of guests" error={guestError} hint={capWarn || undefined}>
                  <input
                    type="number" min={MIN_G} max={MAX_G}
                    value={guests || ''}
                    placeholder={`e.g. ${MIN_G * 8}`}
                    onChange={e => setCalc(c => ({ ...c, guests: Number(e.target.value) }))}
                    aria-label="Number of guests"
                  />
                </Field>
              </div>
              {capWarn && !guestError && (
                <div className="alert alert-warn" style={{ marginTop: 10 }}>{capWarn}</div>
              )}

              <div className="form-row c2">
                <Field label="Event date" error={dateError}>
                  <MiniCalendar value={calc.date} onChange={iso => setCalc(c => ({ ...c, date: iso }))} />
                </Field>
                <Field label="Time slot">
                  <div className="slot-chips" role="group" aria-label="Time slot">
                    {SLOTS.map(s => (
                      <button
                        key={s.id} type="button"
                        className={`slot-chip${calc.slot === s.id ? ' selected' : ''}`}
                        onClick={() => setCalc(c => ({ ...c, slot: s.id as SlotId }))}
                        aria-pressed={calc.slot === s.id}
                      >
                        {s.label}
                        <small>{s.time}</small>
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              {slotHeld && venue && (
                <div className="alert alert-err" style={{ marginTop: 4 }}>
                  This {calc.slot} slot at {venue.name} on {fmtDate(calc.date)} is shown as booked.
                  {' '}<Link to="/planner">Find alternative dates →</Link>
                </div>
              )}
            </section>
          </Reveal>

          {/* mobile-only estimate, right after event details */}
          <div className="show-m-only" style={{ marginTop: 16 }}>
            <Reveal>
              <div className="panel estimate-mini">
                <div className="em-head">
                  <span className="em-label">Your estimate</span>
                  <span className="em-total">{pkr(result.grandTotal)}</span>
                </div>
                <div className="em-sub">
                  {guests.toLocaleString()} guests · {calc.eventType}{calc.date ? ` · ${fmtDate(calc.date)}` : ''} · {pkr(Math.round(result.perGuest))}/guest
                </div>
                <button type="button" className="em-toggle" onClick={() => setShowMini(v => !v)} aria-expanded={showMini}>
                  {showMini ? 'Hide breakdown ▲' : 'View breakdown ▼'}
                </button>
                {showMini && (
                  <div style={{ marginTop: 6 }}>
                    {result.lines.map((l, i) => (
                      <div key={i} className="em-line">
                        <span>{l.label}</span>
                        <strong style={{ color: l.amount < 0 ? '#8FD6A4' : '#fff' }}>
                          {l.amount < 0 ? '−' : ''}{pkr(Math.abs(l.amount))}
                        </strong>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 12 }}>
                  <Btn to="/quote" variant="gold" block size="sm">Get My Quotation</Btn>
                </div>
              </div>
            </Reveal>
          </div>

          {/* ---------- Packages ---------- */}
          <Reveal>
            <section className="panel" style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <SectionLabel style={{ marginBottom: 0 }}>Choose a menu package</SectionLabel>
                {pkg && (
                  <button type="button" className="btn btn-outline btn-sm" onClick={resetMenu}>Reset menu</button>
                )}
              </div>
              <p className="hint" style={{ marginBottom: 12, marginTop: 10 }}>
                The package rate covers every included dish — you are never charged per-dish for what is included.
              </p>
              <Field label="Menu package">
                <select
                  value={calc.packageId ?? ''}
                  onChange={e => pickPkg(e.target.value || undefined)}
                  aria-label="Menu package"
                >
                  <option value="">Fully Custom — build your own dish by dish</option>
                  {state.packages.filter(p => p.enabled).map(p => (
                    <option key={p.id} value={p.id}>{p.name} — {pkr(p.pricePerGuest)} per guest</option>
                  ))}
                </select>
              </Field>

              {pkg && (
                <div className="pkg-full-menu">
                  <div className="pkg-menu-head">
                    <Img src={pkg.image} alt={pkg.name} />
                    <div>
                      <h3 className="font-display" style={{ fontSize: 18, margin: 0 }}>{pkg.name}</h3>
                      <p className="muted small" style={{ margin: '2px 0 4px' }}>{pkg.tagline}</p>
                      <div className="price text-pine-700" style={{ fontSize: 16 }}>
                        {pkr(pkg.pricePerGuest)} <span className="muted small font-normal">per guest</span>
                        {' · '}{includedItems.length} dishes
                      </div>
                    </div>
                  </div>
                  <h3 className="font-display" style={{ fontSize: 17, marginBottom: 10 }}>
                    Full menu <span className="badge badge-green ml-1">{includedItems.length}</span>
                  </h3>
                  <Stagger gap={0.04}>
                    {includedItems.map(it => (
                      <StaggerItem key={it.id}>
                        <div className="addon-row">
                          <Img src={it.image} alt={it.name} className="addon-thumb" />
                          <div className="grow">
                            <strong>{it.name}</strong>
                            <div className="small muted">{it.category} · included in {pkg.name}</div>
                          </div>
                          <button
                            type="button" className="btn btn-outline btn-sm"
                            onClick={() => setCalc(c => ({ ...c, removed: [...c.removed, it.id] }))}
                          >
                            Remove (−{pkr(it.creditPerGuest)}/guest)
                          </button>
                        </div>
                      </StaggerItem>
                    ))}
                  </Stagger>
                  {removedItems.length > 0 && (
                    <>
                      <h3 className="font-display" style={{ fontSize: 17, margin: '20px 0 10px' }}>
                        Removed <span className="badge badge-amber ml-1">{removedItems.length}</span>
                      </h3>
                      {removedItems.map(it => (
                        <div key={it.id} className="addon-row" style={{ opacity: 0.75 }}>
                          <div className="grow">
                            <strong>{it.name}</strong>
                            <div className="small muted">Credit applied: {pkr(it.creditPerGuest)}/guest</div>
                          </div>
                          <button
                            type="button" className="btn btn-outline btn-sm"
                            onClick={() => setCalc(c => ({ ...c, removed: c.removed.filter(r => r !== it.id) }))}
                          >
                            Add back
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                  {pkgAddables.length > 0 && (
                    <>
                      <h3 className="font-display" style={{ fontSize: 17, margin: '20px 0 10px' }}>Add extra dishes</h3>
                      {pkgAddables.map(it => (
                        <AddonRow key={it.id} item={it} qty={addedMap.get(it.id) ?? 0} onQty={v => setAdded(it.id, v)} guests={guests} />
                      ))}
                    </>
                  )}
                </div>
              )}
            </section>
          </Reveal>

          {/* ---------- Menu customization ---------- */}
          {(pkg || !calc.packageId) && (
            <Reveal>
              <section className="panel" style={{ marginTop: 24 }}>
                <SectionLabel>Customize your menu</SectionLabel>

                {!calc.packageId && (
                  <>
                    <h3 className="font-display" style={{ fontSize: 17, marginBottom: 4 }}>Build your menu, category by category</h3>
                    <p className="hint" style={{ marginBottom: 12 }}>Pick a category, tap dishes to select them, then move to the next category.</p>
                    <div className="smart-cat-bar">
                      <Field label="Category">
                        <select value={activeCat} onChange={e => setCustomCat(e.target.value)} aria-label="Menu category">
                          {customCats.map(c => {
                            const n = customMains.filter(i => i.category === c && (addedMap.get(i.id) ?? 0) > 0).length;
                            return <option key={c} value={c}>{c}{n > 0 ? ` — ${n} selected` : ''}</option>;
                          })}
                        </select>
                      </Field>
                      {nextCat && nextCat !== activeCat && (
                        <button
                          type="button" className="btn btn-outline btn-sm" style={{ whiteSpace: 'nowrap' }}
                          onClick={() => setCustomCat(nextCat)}
                        >
                          Next: {nextCat} →
                        </button>
                      )}
                    </div>
                    <div className="dish-pick-list">
                      {catDishes.map(it => {
                        const sel = (addedMap.get(it.id) ?? 0) > 0;
                        return (
                          <button
                            key={it.id} type="button"
                            className={`dish-toggle${sel ? ' sel' : ''}`}
                            onClick={() => setAdded(it.id, sel ? 0 : 1)}
                            aria-pressed={sel}
                          >
                            <span className="dish-check" aria-hidden="true">{sel ? '✓' : ''}</span>
                            <span className="grow">
                              <span className="nm">{it.name}</span>
                              <span className="pr">{pkr(it.price)} per guest</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {customSelected.length > 0 && (
                      <div className="picked-summary">
                        <p className="small" style={{ fontWeight: 700, marginBottom: 8 }}>
                          {customSelected.length} dish{customSelected.length === 1 ? '' : 'es'} selected
                        </p>
                        <div className="chip-row">
                          {customSelected.map(it => (
                            <span key={it.id} className="chip selected">
                              {it.name}
                              <button type="button" onClick={() => setAdded(it.id, 0)} aria-label={`Remove ${it.name}`}>×</button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                <h3 className="font-display" style={{ fontSize: 17, margin: '24px 0 10px' }}>Beverages</h3>
                {beverages.map(it => (
                  <AddonRow key={it.id} item={it} qty={addedMap.get(it.id) ?? 0} onQty={v => setAdded(it.id, v)} guests={guests} />
                ))}

                <h3 className="font-display" style={{ fontSize: 17, margin: '24px 0 10px' }}>Live stations &amp; decoration</h3>
                {stationsAndServices.map(it => (
                  <AddonRow key={it.id} item={it} qty={addedMap.get(it.id) ?? 0} onQty={v => setAdded(it.id, v)} />
                ))}
              </section>
            </Reveal>
          )}

          <Reveal>
            <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Btn variant="outline" to="/calendar">Find Available Dates</Btn>
              <Btn variant="gold" to="/quote" size="lg">Get My Quotation</Btn>
              <Btn variant="primary" onClick={() => { toast('Your estimate is saved — complete the inquiry when ready.'); nav('/quote'); }}>
                Continue to Inquiry
              </Btn>
            </div>
          </Reveal>
        </div>

        {/* ---------- RIGHT: breakdown ---------- */}
        <aside className="breakdown-sticky">
          <Reveal>
            <div className="panel" style={{ background: 'linear-gradient(165deg, rgba(30,77,63,.97), rgba(16,42,35,.96))', borderColor: 'rgba(198,161,91,.45)' }}>
              <h2 className="font-sans text-[13px] font-bold uppercase tracking-[0.18em] text-champagne-300 mb-4">Your estimate</h2>
              <div className="small" style={{ marginBottom: 14, color: 'rgba(255,255,255,.72)' }}>
                {guests.toLocaleString()} guests · {calc.eventType} · {SLOTS.find(s => s.id === calc.slot)?.label}
                {venue ? ` · ${venue.name}` : ' · No venue yet'}
                {calc.date && ` · ${fmtDate(calc.date)}`}
              </div>

              {result.lines.map((l, i) => (
                <div key={i} className="line-item" style={{ borderBottomColor: 'rgba(198,161,91,.25)', color: '#F2EEDF' }}>
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span>{l.label}</span>
                      {kindBadge(l.kind)}
                    </div>
                    {l.detail && <div className="small" style={{ color: 'rgba(255,255,255,.6)' }}>{l.detail}</div>}
                  </div>
                  <strong style={{ color: l.amount < 0 ? '#8FD6A4' : '#fff' }}>
                    {l.amount < 0 ? '−' : ''}{pkr(Math.abs(l.amount))}
                  </strong>
                </div>
              ))}

              {result.appliedPromos.length > 0 && (
                <div className="alert alert-ok" style={{ marginTop: 14 }}>
                  <strong>Promotions applied:</strong>
                  <ul className="why-list" style={{ marginTop: 8 }}>
                    {result.appliedPromos.map(a => (
                      <li key={a.promo.id}>{a.promo.name} — {a.reason} · saved {pkr(a.amount)}</li>
                    ))}
                  </ul>
                  {result.discountCapped && (
                    <div className="small" style={{ marginTop: 6 }}>
                      Total discounts capped at {MAX_DISCOUNT_PCT}% of subtotal.
                    </div>
                  )}
                </div>
              )}

              <div className="divider" style={{ background: 'linear-gradient(90deg, transparent, rgba(198,161,91,.5), transparent)' }} />
              <div className="total-row">
                <span style={{ color: 'rgba(255,255,255,.85)', fontWeight: 600 }}>Estimated grand total</span>
                <motion.span
                  key={result.grandTotal}
                  initial={{ scale: 1.08, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                  className="price-lg"
                  style={{ color: '#E8C873' }}
                >
                  {pkr(result.grandTotal)}
                </motion.span>
              </div>
              <div className="line-item" style={{ borderBottomColor: 'rgba(198,161,91,.25)', color: '#F2EEDF' }}>
                <span style={{ color: 'rgba(255,255,255,.7)' }}>Effective cost per guest</span>
                <strong style={{ color: '#fff' }}>{pkr(Math.round(result.perGuest))}</strong>
              </div>
              <p className="small" style={{ marginTop: 10, color: 'rgba(255,255,255,.6)' }}>
                Illustrative estimate. Final rates depend on venue, menu, guest count, date and service inclusions.
              </p>

              <div style={{ marginTop: 14 }}>
                <button
                  type="button" className="btn btn-light btn-sm"
                  onClick={() => setShowCompare(v => !v)}
                  aria-expanded={showCompare}
                >
                  {showCompare ? 'Hide package comparison' : 'Compare packages'}
                </button>
                {showCompare && (
                  <div className="table-wrap" style={{ marginTop: 10 }}>
                    <table className="tbl cmp-table">
                      <thead>
                        <tr><th>Package</th><th>Per guest</th><th>Total</th></tr>
                      </thead>
                      <tbody>
                        {compareRows.map(r => (
                          <tr key={r.pkg.id} className={calc.packageId === r.pkg.id ? 'selected' : ''}>
                            <td>{r.pkg.name}</td>
                            <td>{pkr(r.pkg.pricePerGuest)}</td>
                            <td><strong>{pkr(r.total)}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="small muted">Same guest count{venue ? ` · includes ${venue.name} hall rental` : ''}.</p>
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </aside>
      </div>
    </div>
  );
}

function AddonRow({ item, qty, onQty, guests }: {
  item: MenuItem; qty: number; onQty: (v: number) => void; guests?: number;
}) {
  const active = qty > 0;
  const effect = useMemo(() => {
    if (!active) return '';
    if (item.unit === 'flat') return `+${pkr(item.price * qty)} total`;
    if (item.unit === 'per_guest' && guests) return `+${pkr(item.price * guests * qty)} total`;
    return `+${pkr(item.price * qty)}`;
  }, [active, item, qty, guests]);
  return (
    <div className="addon-row" style={active ? { borderColor: 'rgba(30,77,63,.4)', boxShadow: '0 0 0 3px rgba(30,77,63,.08)' } : undefined}>
      <Img src={item.image} alt={item.name} className="addon-thumb" />
      <div className="grow">
        <strong>{item.name}</strong>
        <div className="small muted">
          {pkr(item.price)} {unitLabel(item.unit)} · {item.description}
          {item.unit !== 'flat' && item.unit !== 'per_guest' && guests && guests >= 50 && (
            <span> — tip: set qty ≈ {guests.toLocaleString()} for all guests</span>
          )}
        </div>
        {active && <div className="small" style={{ color: '#1E7A4F', fontWeight: 600 }}>{effect}</div>}
      </div>
      {item.unit === 'flat'
        ? <Qty value={qty} onChange={onQty} max={3} />
        : <Qty value={qty} onChange={onQty} max={guests && guests > 0 ? guests * 2 : 9999} />}
    </div>
  );
}
