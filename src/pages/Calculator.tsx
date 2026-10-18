// ShadiSphere smart wedding cost calculator — the core interactive feature.
import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../state/store';
import {
  Btn, Badge, Field, Empty, PageHead, Qty, Img,
} from '../components/ui';
import { calculate, quickEstimate, MAX_DISCOUNT_PCT } from '../lib/calc';
import { slotStatus, isSlotBookable } from '../lib/availability';
import {
  pkr, fmtDate, todayISO, unitLabel,
} from '../lib/format';
import {
  CITIES, EVENT_TYPES, SLOTS, MenuItem, SlotId, EventType,
} from '../data/types';

const MIN_G = 50;
const MAX_G = 3000;
const COMPARE_ORDER = ['basic', 'standard', 'premium', 'vip', 'luxury'];

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
        .breakdown-sticky { position: static; }
        @media (min-width: 1024px) { .breakdown-sticky { position: sticky; top: 96px; } }
        .pkg-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
        @media (min-width: 640px) { .pkg-grid { grid-template-columns: repeat(2, 1fr); } }
        .slot-chips { display: flex; gap: 10px; flex-wrap: wrap; }
        .slot-chip { border: 1.5px solid var(--line, #E5DCC8); border-radius: 10px; padding: 10px 14px; background: #fff; cursor: pointer; font-weight: 600; }
        .slot-chip small { display: block; font-weight: 400; color: #6B6152; }
        .slot-chip.selected { border-color: #1E4D3F; background: #EEF5F0; }
        .slot-chip:focus-visible { outline: 2px solid #1E4D3F; outline-offset: 2px; }
        .addon-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #F0EADA; }
        .addon-row:last-child { border-bottom: none; }
        .addon-thumb { width: 56px; height: 56px; border-radius: 10px; object-fit: cover; flex: none; }
        .chip.selected:focus-visible { outline: 2px solid #1E4D3F; }
        input[type="range"].slider { width: 100%; accent-color: #1E4D3F; }
        .cmp-table td, .cmp-table th { padding: 10px 12px; }
      `}</style>

      <PageHead
        eyebrow="Smart Cost Calculator"
        title="Calculate your wedding cost"
        lead="Pick a package, customize the menu, add extras — the estimate updates instantly. All prices are illustrative demo rates."
      />

      <div className="calc-grid">
        {/* ---------- LEFT: controls ---------- */}
        <div>
          <section className="panel">
            <h2 className="side-title">Event details</h2>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="City">
                <select value={calc.city} onChange={e => setCalc(c => ({ ...c, city: e.target.value, venueId: undefined }))} aria-label="City">
                  {CITIES.map(ct => <option key={ct} value={ct}>{ct}</option>)}
                </select>
              </Field>
              <Field label="Venue (optional)">
                <select
                  value={calc.venueId ?? ''}
                  onChange={e => setCalc(c => ({ ...c, venueId: e.target.value || undefined }))}
                  aria-label="Venue"
                >
                  <option value="">No venue yet</option>
                  {CITIES.map(ct => {
                    const vs = state.venues.filter(v => v.city === ct);
                    if (!vs.length) return null;
                    return (
                      <optgroup key={ct} label={ct}>
                        {vs.map(v => <option key={v.id} value={v.id}>{v.name} — up to {v.maxGuests.toLocaleString()}</option>)}
                      </optgroup>
                    );
                  })}
                </select>
              </Field>
            </div>

            <Field label="Event type">
              <div className="chip-row" role="group" aria-label="Event type">
                {EVENT_TYPES.map(eventTypeChip)}
              </div>
            </Field>

            <Field label="Number of guests" error={guestError} hint={capWarn || undefined}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="range" min={MIN_G} max={MAX_G} step={10}
                  value={Math.min(Math.max(guests, MIN_G), MAX_G)}
                  onChange={e => setCalc(c => ({ ...c, guests: Number(e.target.value) }))}
                  className="slider" style={{ flex: '1 1 220px' }} aria-label="Guest count slider"
                />
                <input
                  type="number" min={MIN_G} max={MAX_G}
                  value={guests || ''}
                  onChange={e => setCalc(c => ({ ...c, guests: Number(e.target.value) }))}
                  style={{ width: 130 }} aria-label="Guest count"
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

          {/* ---------- Packages ---------- */}
          <section className="panel" style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h2 className="side-title" style={{ margin: 0 }}>Choose a menu package</h2>
              {pkg && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={resetMenu}>Reset menu</button>
              )}
            </div>
            <p className="hint" style={{ marginBottom: 14 }}>
              The package rate covers every included dish — you are never charged per-dish for what is included.
            </p>
            <div className="pkg-grid">
              {state.packages.filter(p => p.enabled).map(p => {
                const sel = calc.packageId === p.id;
                return (
                  <div key={p.id} className={`pkg-card${sel ? ' selected' : ''}`}>
                    <Img src={p.image} alt={p.name} className="card-img" style={{ height: 150, borderRadius: 10 }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                      <h3 style={{ margin: 0 }}>{p.name}</h3>
                      {p.badge && <span className="pkg-flag">{p.badge}</span>}
                    </div>
                    <p className="muted small" style={{ margin: '4px 0' }}>{p.tagline}</p>
                    <div className="price">{pkr(p.pricePerGuest)} <span className="muted small">per guest</span></div>
                    <p className="small muted" style={{ margin: '6px 0 10px' }}>{p.included.length} included dishes</p>
                    <Btn variant={sel ? 'primary' : 'outline'} block onClick={() => pickPkg(sel ? undefined : p.id)}>
                      {sel ? 'Selected' : 'Select'}
                    </Btn>
                  </div>
                );
              })}
              <div className={`pkg-card${!calc.packageId ? ' selected' : ''}`}>
                <div style={{ height: 150, borderRadius: 10, background: 'linear-gradient(135deg,#1E4D3F,#2A6353)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E9D9AE', fontFamily: 'Georgia,serif', fontSize: 20 }}>
                  Your Menu
                </div>
                <h3 style={{ margin: '10px 0 4px' }}>Fully Custom</h3>
                <p className="muted small" style={{ margin: '4px 0' }}>Build your own menu dish by dish</p>
                <div className="price">Priced <span className="muted small">per selected dish</span></div>
                <p className="small muted" style={{ margin: '6px 0 10px' }}>No preset package</p>
                <Btn variant={!calc.packageId ? 'primary' : 'outline'} block onClick={() => pickPkg(undefined)}>
                  {!calc.packageId ? 'Selected' : 'Select'}
                </Btn>
              </div>
            </div>
          </section>

          {/* ---------- Menu customization ---------- */}
          {(pkg || !calc.packageId) && (
            <section className="panel" style={{ marginTop: 24 }}>
              <h2 className="side-title">Customize your menu</h2>

              {pkg && (
                <>
                  <h3 style={{ fontSize: 16, marginBottom: 8 }}>Included dishes ({includedItems.length})</h3>
                  {includedItems.map(it => (
                    <div key={it.id} className="addon-row">
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
                  ))}
                  {removedItems.length > 0 && (
                    <>
                      <h3 style={{ fontSize: 16, margin: '18px 0 8px' }}>Removed ({removedItems.length})</h3>
                      {removedItems.map(it => (
                        <div key={it.id} className="addon-row" style={{ opacity: 0.75 }}>
                          <div className="grow">
                            <strong>{it.name}</strong>
                            <div className="small muted">Credit applied: {pkr(it.creditPerGuest)}/guest</div>
                          </div>
                          <button
                            type="button" className="btn btn-ghost btn-sm"
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
                      <h3 style={{ fontSize: 16, margin: '18px 0 8px' }}>Add extra dishes</h3>
                      {pkgAddables.map(it => (
                        <AddonRow key={it.id} item={it} qty={addedMap.get(it.id) ?? 0} onQty={v => setAdded(it.id, v)} guests={guests} />
                      ))}
                    </>
                  )}
                </>
              )}

              {!calc.packageId && (
                <>
                  <h3 style={{ fontSize: 16, marginBottom: 8 }}>Pick your dishes (per guest)</h3>
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

              <h3 style={{ fontSize: 16, margin: '22px 0 8px' }}>Beverages</h3>
              {beverages.map(it => (
                <AddonRow key={it.id} item={it} qty={addedMap.get(it.id) ?? 0} onQty={v => setAdded(it.id, v)} guests={guests} />
              ))}

              <h3 style={{ fontSize: 16, margin: '22px 0 8px' }}>Live stations &amp; decoration</h3>
              {stationsAndServices.map(it => (
                <AddonRow key={it.id} item={it} qty={addedMap.get(it.id) ?? 0} onQty={v => setAdded(it.id, v)} />
              ))}
            </section>
          )}

          <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Btn variant="outline" to="/calendar">Find Available Dates</Btn>
            <Btn variant="gold" to="/quote">Generate Quotation</Btn>
            <Btn variant="primary" onClick={() => { toast('Your estimate is saved — complete the inquiry when ready.'); nav('/quote'); }}>
              Continue to Inquiry
            </Btn>
          </div>
        </div>

        {/* ---------- RIGHT: breakdown ---------- */}
        <aside className="breakdown-sticky">
          <div className="panel">
            <h2 className="side-title">Your estimate</h2>
            <div className="small muted" style={{ marginBottom: 12 }}>
              {guests.toLocaleString()} guests · {calc.eventType} · {SLOTS.find(s => s.id === calc.slot)?.label}
              {venue ? ` · ${venue.name}` : ' · No venue yet'}
              {calc.date && ` · ${fmtDate(calc.date)}`}
            </div>

            {result.lines.map((l, i) => (
              <div key={i} className="line-item">
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span>{l.label}</span>
                    {kindBadge(l.kind)}
                  </div>
                  {l.detail && <div className="small muted">{l.detail}</div>}
                </div>
                <strong style={{ color: l.amount < 0 ? '#1E7A4F' : undefined }}>
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

            <div className="divider" />
            <div className="total-row">
              <span>Estimated grand total</span>
              <span className="price-lg">{pkr(result.grandTotal)}</span>
            </div>
            <div className="line-item">
              <span className="muted">Effective cost per guest</span>
              <strong>{pkr(Math.round(result.perGuest))}</strong>
            </div>
            <p className="small muted" style={{ marginTop: 10 }}>
              Illustrative demo estimate. Final rates depend on venue, menu, guest count, date and service inclusions.
            </p>

            <div style={{ marginTop: 14 }}>
              <button
                type="button" className="btn btn-ghost btn-sm"
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
    <div className="addon-row">
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
