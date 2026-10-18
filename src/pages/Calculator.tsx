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

export default function Calculator() {
  const { state, calc, setCalc, toast } = useStore();
  const nav = useNavigate();
  const [showCompare, setShowCompare] = useState(false);

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

  const eventTypeChip = (t: EventType) => (
    <button
      key={t}
      type="button"
      className={`chip${calc.eventType === t ? ' selected' : ''}`}
      onClick={() => setCalc(c => ({ ...c, eventType: t }))}
      aria-pressed={calc.eventType === t}
    >
      {t}
    </button>
  );

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
      `}</style>

      <Reveal>
        <PageHead
          eyebrow="Smart Cost Calculator"
          title="Calculate your wedding cost"
          lead="Pick a package, customize the menu, add extras — the estimate updates instantly. All prices are illustrative demo rates."
        />
      </Reveal>

      <div className="calc-grid">
        {/* ---------- LEFT: controls ---------- */}
        <div>
          <Reveal>
            <section className="panel">
              <SectionLabel>Event details</SectionLabel>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
                      <option key={v.id} value={v.id}>{v.name} — {v.minGuests.toLocaleString()}–{v.maxGuests.toLocaleString()} guests</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Event type">
                <div className="chip-row" role="group" aria-label="Event type">
                  {EVENT_TYPES.map(eventTypeChip)}
                </div>
              </Field>

              <Field label="Number of guests" error={guestError} hint={capWarn || undefined}>
                <div className="flex items-center gap-5 flex-wrap">
                  <div className="font-display text-[34px] font-bold text-pine-700 tabular-nums min-w-[110px]">
                    {(guests || 0).toLocaleString()}
                    <span className="font-sans text-[12px] font-semibold text-ink-400 block uppercase tracking-[0.1em]">guests</span>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <input
                      type="range" min={MIN_G} max={MAX_G} step={10}
                      value={Math.min(Math.max(guests, MIN_G), MAX_G)}
                      onChange={e => setCalc(c => ({ ...c, guests: Number(e.target.value) }))}
                      className="slider" aria-label="Guest count slider"
                    />
                    <div className="flex justify-between text-[11.5px] font-semibold text-ink-400">
                      <span>{MIN_G}</span><span>{MAX_G.toLocaleString()}</span>
                    </div>
                  </div>
                  <input
                    type="number" min={MIN_G} max={MAX_G}
                    value={guests || ''}
                    onChange={e => setCalc(c => ({ ...c, guests: Number(e.target.value) }))}
                    className="input" style={{ width: 110 }} aria-label="Guest count"
                  />
                </div>
                {capWarn && !guestError && (
                  <div className="alert alert-warn" style={{ marginTop: 10 }}>{capWarn}</div>
                )}
              </Field>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Event date" error={dateError}>
                  <input
                    type="date" min={todayISO()} value={calc.date}
                    onChange={e => setCalc(c => ({ ...c, date: e.target.value }))}
                    aria-label="Event date"
                  />
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
                  This {calc.slot} slot at {venue.name} on {fmtDate(calc.date)} is held in the demo data.
                  {' '}<Link to="/planner">Find alternative dates →</Link>
                </div>
              )}
            </section>
          </Reveal>

          {/* ---------- Packages ---------- */}
          <Reveal>
            <section className="panel" style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <SectionLabel style={{ marginBottom: 0 }}>Choose a menu package</SectionLabel>
                {pkg && (
                  <button type="button" className="btn btn-outline btn-sm" onClick={resetMenu}>Reset menu</button>
                )}
              </div>
              <p className="hint" style={{ marginBottom: 16, marginTop: 10 }}>
                The package rate covers every included dish — you are never charged per-dish for what is included.
              </p>
              <Stagger className="pkg-grid" gap={0.08}>
                {state.packages.filter(p => p.enabled).map(p => {
                  const sel = calc.packageId === p.id;
                  return (
                    <StaggerItem key={p.id}>
                      <div className={`card pkg-card h-full p-5${sel ? ' selected' : ''}`}>
                        {sel
                          ? <span className="badge badge-gold pkg-flag">✓ Selected</span>
                          : p.badge && <span className="badge badge-gold pkg-flag">{p.badge}</span>}
                        <div className="rounded-[14px] overflow-hidden mb-4" style={{ height: 150 }}>
                          <Img src={p.image} alt={p.name} style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
                        </div>
                        <h3 className="font-display text-[19px] m-0">{p.name}</h3>
                        <p className="muted small mt-1 mb-2">{p.tagline}</p>
                        <div className="price text-pine-700 text-[17px]">
                          {pkr(p.pricePerGuest)} <span className="muted small font-normal">per guest</span>
                        </div>
                        <p className="small muted" style={{ margin: '6px 0 12px' }}>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="text-pine-600 font-bold">✓</span> {p.included.length} included dishes
                          </span>
                        </p>
                        <Btn variant={sel ? 'primary' : 'outline'} block onClick={() => pickPkg(sel ? undefined : p.id)}>
                          {sel ? 'Selected' : 'Select'}
                        </Btn>
                      </div>
                    </StaggerItem>
                  );
                })}
                <StaggerItem>
                  <div className={`card pkg-card h-full p-5${!calc.packageId ? ' selected' : ''}`}>
                    {!calc.packageId && <span className="badge badge-gold pkg-flag">✓ Selected</span>}
                    <div className="rounded-[14px] mb-4 flex items-center justify-center font-display text-[20px] text-champagne-300"
                      style={{ height: 150, background: 'linear-gradient(135deg,#1E4D3F,#2A6353)' }}>
                      Your Menu
                    </div>
                    <h3 className="font-display text-[19px] m-0">Fully Custom</h3>
                    <p className="muted small mt-1 mb-2">Build your own menu dish by dish</p>
                    <div className="price text-pine-700 text-[17px]">Priced <span className="muted small font-normal">per selected dish</span></div>
                    <p className="small muted" style={{ margin: '6px 0 12px' }}>No preset package</p>
                    <Btn variant={!calc.packageId ? 'primary' : 'outline'} block onClick={() => pickPkg(undefined)}>
                      {!calc.packageId ? 'Selected' : 'Select'}
                    </Btn>
                  </div>
                </StaggerItem>
              </Stagger>
            </section>
          </Reveal>

          {/* ---------- Menu customization ---------- */}
          {(pkg || !calc.packageId) && (
            <Reveal>
              <section className="panel" style={{ marginTop: 24 }}>
                <SectionLabel>Customize your menu</SectionLabel>

                {pkg && (
                  <>
                    <h3 className="font-display" style={{ fontSize: 17, marginBottom: 10 }}>
                      Included dishes <span className="badge badge-green ml-1">{includedItems.length}</span>
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
                  </>
                )}

                {!calc.packageId && (
                  <>
                    <h3 className="font-display" style={{ fontSize: 17, marginBottom: 8 }}>Pick your dishes (per guest)</h3>
                    <p className="hint">Tap to select — each selected dish is charged at its per-guest price × your guest count.</p>
                    <div className="chip-row" style={{ marginBottom: 6 }}>
                      {customMains.map(it => {
                        const sel = (addedMap.get(it.id) ?? 0) > 0;
                        return (
                          <button
                            key={it.id} type="button"
                            className={`chip${sel ? ' selected' : ''}`}
                            onClick={() => setAdded(it.id, sel ? 0 : 1)}
                            aria-pressed={sel}
                            title={`${it.name} — ${pkr(it.price)} per guest`}
                          >
                            {it.name} · {pkr(it.price)}
                          </button>
                        );
                      })}
                    </div>
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
                Illustrative demo estimate. Final rates depend on venue, menu, guest count, date and service inclusions.
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
