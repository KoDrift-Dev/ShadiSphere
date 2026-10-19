// ShadiSphere smart wedding cost calculator — the core interactive feature.
import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '../state/store';
import {
  Btn, Badge, Field, PageHead, Qty, Img, Modal, Select,
  Reveal, Stagger, StaggerItem,
} from '../components/ui';
import { calculate, MAX_DISCOUNT_PCT } from '../lib/calc';
import { slotStatus, isSlotBookable } from '../lib/availability';
import {
  pkr, fmtDate, unitLabel,
} from '../lib/format';
import {
  BUSINESS, EVENT_TYPES, SLOTS, MenuItem, SlotId, EventType,
} from '../data/types';

const MIN_G = 50;
const MAX_G = 3000;

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
  const [showEstimate, setShowEstimate] = useState(false);
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
  const liveStations = addOnItems.filter(i => i.category === 'Live Stations');
  const decorServices = addOnItems.filter(i => i.category === 'Decoration & Services');

  // Add-custom browser popup + stacked package-dishes popup.
  const [menuCard, setMenuCard] = useState<'custom' | null>(null);
  const [showPkgItems, setShowPkgItems] = useState(false);
  const extrasCount = calc.added.filter(a => {
    const it = state.menuItems.find(i => i.id === a.itemId);
    return it && it.addOnOnly;
  }).length;
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

  // Estimate tiles: group breakdown lines into 4 tappable tiles (2×2).
  // Full itemized breakdown for the estimate box, grouped by charge kind.
  const breakdown = useMemo(() => {
    const groups: Record<string, { label: string; icon: string; lines: typeof result.lines }> = {
      food: { label: 'Menu', icon: '🍽️', lines: [] },
      hall: { label: 'Venue', icon: '🏛️', lines: [] },
      extras: { label: 'Extras', icon: '✨', lines: [] },
      savings: { label: 'Savings', icon: '🎉', lines: [] },
    };
    for (const l of result.lines) {
      if (l.kind === 'food' || l.kind === 'info') groups.food.lines.push(l);
      else if (l.kind === 'hall') groups.hall.lines.push(l);
      else if (l.kind === 'discount') groups.savings.lines.push(l);
      else groups.extras.lines.push(l);
    }
    return Object.entries(groups).map(([key, g]) => ({
      key, label: g.label, icon: g.icon, lines: g.lines,
      total: g.lines.reduce((s, l) => s + l.amount, 0),
    }));
  }, [result]);

  const handleCalculate = () => {
    if (guestError) {
      toast(guestError);
      return;
    }
    setShowEstimate(true);
  };

  return (
    <div className="wrap">
      <style>{`
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

        /* package full menu */
        .pkg-full-menu { margin-top: 14px; border-top: 1px dashed rgba(198,161,91,.4); padding-top: 16px; }
        .pkg-menu-head { display: flex; gap: 14px; align-items: center; margin-bottom: 14px; }
        .pkg-menu-head img { width: 64px; height: 64px; border-radius: 14px; object-fit: cover; flex-shrink: 0; }

        /* option rows (add-custom browser, package row) */
        .opt-row {
          display: flex; align-items: center; gap: 12px; text-align: left; cursor: pointer;
          font-family: inherit; width: 100%;
          border: 1px solid rgba(30,77,63,.2); border-radius: 16px; padding: 14px;
          background: linear-gradient(165deg, rgba(198,161,91,.1), rgba(198,161,91,.03));
          transition: transform .15s ease, border-color .15s ease;
        }
        .opt-row:hover { transform: translateY(-2px); border-color: var(--color-pine-500); }
        .opt-row:focus-visible { outline: 3px solid var(--color-champagne-300); outline-offset: 2px; }
        .opt-icon { font-size: 28px; flex-shrink: 0; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 14px; background: rgba(255,255,255,.7); }
        .opt-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
        .opt-body strong { font-size: 14.5px; color: var(--color-ink-900); }
        .opt-sub { font-size: 12.5px; color: var(--color-ink-600); }
        .mc-arrow { font-size: 24px; line-height: 1; color: var(--color-champagne-500); flex-shrink: 0; }

        /* sticky calculate bar */
        .calc-sticky-bar {
          position: sticky; bottom: 12px; z-index: 30;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          margin-top: 24px; padding: 12px 12px 12px 18px;
          background: rgba(255,253,248,.96); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(198,161,91,.45); border-radius: 18px;
          box-shadow: 0 12px 34px rgba(11,31,25,.16), inset 0 1px 0 #fff;
        }
        .csb-summary { display: flex; flex-direction: column; min-width: 0; flex: 1; }
        .csb-total { font-family: var(--font-display); font-weight: 700; font-size: 19px; color: var(--color-pine-800); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .csb-sub { font-size: 12px; color: var(--color-ink-400); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .calc-sticky-bar .btn { flex-shrink: 0; }
        @media (max-width: 560px) {
          .calc-sticky-bar { bottom: 8px; padding: 10px 10px 10px 14px; border-radius: 16px; }
          .csb-total { font-size: 16px; }
        }
        @media (max-width: 380px) {
          .calc-sticky-bar { padding: 8px 10px; gap: 6px; }
          .csb-total { font-size: 14.5px; }
          .csb-sub { display: none; }
          .calc-sticky-bar .btn { padding: 8px 12px; font-size: 13px; }
        }

        /* estimate box: refined, compact, clear breakdown */
        .estimate-box {
          border: 1px solid rgba(198, 161, 91, 0.45);
          background: linear-gradient(168deg, #FFFFFF 0%, #FAF8F2 60%, #F5EDE2 100%);
          color: var(--color-ink-900);
          border-radius: 20px;
          padding: clamp(16px, 3.5vw, 24px);
          box-shadow: 0 16px 40px rgba(30, 77, 63, 0.08), inset 0 1px 0 #fff;
        }
        .est-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 4px; }
        .est-breakdown { display: grid; gap: 8px; margin: 12px 0; }
        .est-group {
          border: 1px solid rgba(198, 161, 91, 0.22);
          border-radius: 14px;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(8px);
          box-shadow: 0 2px 8px rgba(11, 31, 25, 0.03);
        }
        .est-group-head { display: flex; align-items: center; justify-content: space-between; }
        .est-group-head > span:first-child { font-size: 13.5px; font-weight: 700; color: var(--color-pine-900); display: flex; align-items: center; gap: 6px; }
        .est-group-head strong { font-family: var(--font-display); font-size: 15.5px; color: var(--color-pine-800); }
        .est-line { display: flex; justify-content: space-between; gap: 10px; padding: 5px 0; border-top: 1px dashed rgba(198, 161, 91, 0.2); }
        .est-line .lbl { font-weight: 500; font-size: 12.5px; color: var(--color-ink-800); }
        .est-line .det { font-size: 11px; color: var(--color-ink-500); margin-top: 1px; }
        .est-line strong { white-space: nowrap; color: var(--color-ink-900); font-size: 12.5px; }
        .est-line strong.neg { color: #166534; }
        .est-line .badge { margin-left: 6px; vertical-align: 1px; }
        .est-total-card {
          margin-top: 12px;
          padding: 14px 18px;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(30, 77, 63, 0.06) 0%, rgba(198, 161, 91, 0.16) 100%);
          border: 1px solid rgba(198, 161, 91, 0.35);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
        }
        .est-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 14px; }
        @media (max-width: 640px) { .est-actions { grid-template-columns: 1fr; } }
      `}</style>

      <Reveal>
        <PageHead
          eyebrow="Smart Cost Calculator"
          title="Calculate your wedding cost"
          lead="Pick a package, customize the menu, add extras — the estimate updates instantly. All prices are illustrative sample rates."
        />
      </Reveal>

      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <div>
          <Reveal>
            <section className="panel panel-compact">
              <SectionLabel>Event details</SectionLabel>
              <div className="form-row c2">
                <Field label="Venue">
                  <input className="input" value={`${BUSINESS.name} · ${BUSINESS.area}, Lahore`} readOnly aria-label="Venue (fixed)" />
                </Field>
                <Field label="Event space (optional)">
                  <Select
                    value={calc.venueId ?? ''}
                    onChange={v => setCalc(c => ({ ...c, venueId: v || undefined }))}
                    ariaLabel="Event space"
                  >
                    <option value="">No space selected yet</option>
                    {state.venues.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </Select>
                </Field>
              </div>

              <div className="form-row c2">
                <Field label="Event type">
                  <Select
                    value={calc.eventType}
                    onChange={v => setCalc(c => ({ ...c, eventType: v as EventType }))}
                    ariaLabel="Event type"
                  >
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </Select>
                </Field>
                <Field label="Number of guests" error={guestError} hint={capWarn || undefined}>
                  <input
                    className="input"
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
                <Field label="Menu package">
                  <Select
                    value={calc.packageId ?? ''}
                    onChange={v => pickPkg(v || undefined)}
                    ariaLabel="Menu package"
                  >
                    <option value="">Fully Custom — build your own</option>
                    {state.packages.filter(p => p.enabled).map(p => (
                      <option key={p.id} value={p.id}>{p.name} — {pkr(p.pricePerGuest)}/guest</option>
                    ))}
                  </Select>
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

          {/* ---------- Your menu (direct — no cards) ---------- */}
          {(pkg || !calc.packageId) && (
          <Reveal>
            <section className="panel menu-extras-sec" style={{ marginTop: 16 }}>
              <SectionLabel>Your menu</SectionLabel>
              {pkg ? (
                <>
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
                  <p className="hint" style={{ marginBottom: 12 }}>
                    The package rate covers every included dish — you are never charged per-dish for what is included.
                  </p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <Btn variant="gold" size="sm" onClick={() => setMenuCard('custom')}>
                      ＋ Add Custom{extrasCount > 0 ? ` (${extrasCount})` : ''}
                    </Btn>
                    <Btn variant="outline" size="sm" onClick={() => setShowPkgItems(true)}>
                      View {pkg.name} dishes →
                    </Btn>
                  </div>
                </>
              ) : (
                <>
                {!calc.packageId && (
                  <>
                    <h3 className="font-display" style={{ fontSize: 17, marginBottom: 4 }}>Build your menu, category by category</h3>
                    <p className="hint" style={{ marginBottom: 12 }}>Pick a category, tap dishes to select them, then move to the next category.</p>
                    <div className="smart-cat-bar">
                      <Field label="Category">
                        <Select value={activeCat} onChange={v => setCustomCat(v)} ariaLabel="Menu category">
                          {customCats.map(c => {
                            const n = customMains.filter(i => i.category === c && (addedMap.get(i.id) ?? 0) > 0).length;
                            return <option key={c} value={c}>{c}{n > 0 ? ` — ${n} selected` : ''}</option>;
                          })}
                        </Select>
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
                  <div style={{ marginTop: 14 }}>
                    <Btn variant="gold" size="sm" onClick={() => setMenuCard('custom')}>
                      ＋ Add Custom — extras{extrasCount > 0 ? ` (${extrasCount})` : ''}
                    </Btn>
                  </div>
                </>
              )}
            </section>
          </Reveal>
          )}
          {menuCard === 'custom' && (
            <Modal
              title="＋ Add custom"
              onClose={() => setMenuCard(null)}
              footer={
                <Btn
                  variant="gold"
                  block
                  onClick={() => {
                    setMenuCard(null);
                    setShowEstimate(true);
                    toast('Estimate updated');
                  }}
                >
                  Update Estimate ✓
                </Btn>
              }
            >
              {pkg && (
                <button type="button" className="opt-row" onClick={() => setShowPkgItems(true)} aria-haspopup="dialog">
                  <span className="opt-icon" aria-hidden="true">🍽️</span>
                  <span className="opt-body">
                    <strong>{pkg.name}</strong>
                    <span className="opt-sub">{includedItems.length} dishes included · {pkr(pkg.pricePerGuest)}/guest — tap to view →</span>
                  </span>
                  <span className="mc-arrow" aria-hidden="true">›</span>
                </button>
              )}
              <h3 className="font-display" style={{ fontSize: 17, margin: '18px 0 10px' }}>Menu — tap to select</h3>
              {customCats.map(c => (
                <div key={c} style={{ marginBottom: 6 }}>
                  <p className="small" style={{ fontWeight: 700, marginBottom: 8 }}>{c}</p>
                  <div className="dish-pick-list" style={{ marginBottom: 10 }}>
                    {customMains.filter(i => i.category === c).map(it => {
                      const included = !!pkg && includedIds.has(it.id) && !calc.removed.includes(it.id);
                      const sel = (addedMap.get(it.id) ?? 0) > 0;
                      return (
                        <button
                          key={it.id} type="button"
                          className={`dish-toggle${sel ? ' sel' : ''}`}
                          disabled={included}
                          onClick={() => setAdded(it.id, sel ? 0 : 1)}
                          aria-pressed={sel}
                        >
                          <span className="dish-check" aria-hidden="true">{sel ? '✓' : ''}</span>
                          <Img src={it.image} alt={it.name} className="addon-thumb" />
                          <span className="grow">
                            <span className="nm">{it.name}</span>
                            <span className="pr">{pkr(it.price)} per guest</span>
                          </span>
                          {included && <span className="badge badge-green">Included</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {([['Beverages', beverages], ['Live stations', liveStations], ['Decoration & services', decorServices]] as [string, MenuItem[]][]).map(([title, items]) => (
                <div key={title} style={{ marginBottom: 6 }}>
                  <h3 className="font-display" style={{ fontSize: 17, margin: '18px 0 10px' }}>{title} — tap to select</h3>
                  <div className="dish-pick-list" style={{ marginBottom: 10 }}>
                    {items.map(it => {
                      const sel = (addedMap.get(it.id) ?? 0) > 0;
                      return (
                        <button
                          key={it.id} type="button"
                          className={`dish-toggle${sel ? ' sel' : ''}`}
                          onClick={() => setAdded(it.id, sel ? 0 : 1)}
                          aria-pressed={sel}
                        >
                          <span className="dish-check" aria-hidden="true">{sel ? '✓' : ''}</span>
                          <Img src={it.image} alt={it.name} className="addon-thumb" />
                          <span className="grow">
                            <span className="nm">{it.name}</span>
                            <span className="pr">{pkr(it.price)} {unitLabel(it.unit)}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </Modal>
          )}

          {/* ---------- package dishes popup (stacked above the browser) ---------- */}
          {showPkgItems && pkg && (
            <Modal
              title={`🍽️ ${pkg.name} — dishes`}
              onClose={() => setShowPkgItems(false)}
              footer={
                <Btn variant="primary" block onClick={() => setShowPkgItems(false)}>
                  Done
                </Btn>
              }
            >
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={resetMenu}>Reset menu</button>
              </div>
              <h3 className="font-display" style={{ fontSize: 17, marginBottom: 10 }}>
                Included <span className="badge badge-green ml-1">{includedItems.length}</span>
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
            </Modal>
          )}
          {/* ---------- Estimate box (created on Calculate) ---------- */}
          {showEstimate && (
            <Reveal>
              <section id="estimate-box" className="panel estimate-box" style={{ marginTop: 16 }}>
                <div className="est-head">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '4px 12px', borderRadius: 999,
                      fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em',
                      background: 'rgba(198,161,91,.18)', color: 'var(--color-champagne-800)',
                      border: '1px solid rgba(198,161,91,.4)'
                    }}>
                      Estimate Summary
                    </span>
                  </div>
                  <span style={{ fontSize: 12.5, color: 'var(--color-ink-500)', fontWeight: 500 }}>
                    {guests.toLocaleString()} guests · {calc.eventType}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--color-ink-500)', margin: '4px 0 12px' }}>
                  {venue ? `${venue.name} (${venue.area})` : 'No venue selected'}
                  {calc.date ? ` · ${fmtDate(calc.date)}` : ''} · {SLOTS.find(s => s.id === calc.slot)?.label}
                </div>

                <div className="est-breakdown">
                  {breakdown.map(g => g.lines.length > 0 && (
                    <div key={g.key} className="est-group">
                      <div className="est-group-head">
                        <span>
                          <span aria-hidden="true">{g.icon}</span> {g.label}
                          {g.key === 'food' && pkg && <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-ink-400)', marginLeft: 4 }}>({pkg.name})</span>}
                        </span>
                        <strong style={{ color: g.total < 0 ? '#15803d' : 'var(--color-pine-900)' }}>
                          {g.total < 0 ? '−' : ''}{pkr(Math.abs(Math.round(g.total)))}
                        </strong>
                      </div>
                      <div style={{ marginTop: 4 }}>
                        {g.lines.map((l, i) => (
                          <div key={i} className="est-line">
                            <div className="lbl">
                              {l.label}
                              {l.detail && <span className="det"> · {l.detail}</span>}
                            </div>
                            <strong className={l.amount < 0 ? 'neg' : ''}>
                              {l.amount < 0 ? '−' : ''}{pkr(Math.abs(Math.round(l.amount)))}
                            </strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {result.appliedPromos.length > 0 && (
                  <div className="alert alert-ok" style={{ margin: '8px 0', padding: '10px 14px', fontSize: 13 }}>
                    <strong>Promotions applied:</strong>
                    <ul className="why-list" style={{ marginTop: 4, marginBottom: 0 }}>
                      {result.appliedPromos.map(a => (
                        <li key={a.promo.id}>{a.promo.name} — saved {pkr(a.amount)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="est-total-card">
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-pine-900)', textTransform: 'uppercase', letterSpacing: '.09em' }}>
                      Estimated Total
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--color-ink-600)', marginTop: 2 }}>
                      Effective: <strong style={{ color: 'var(--color-pine-800)' }}>{pkr(Math.round(result.perGuest))}</strong> / guest
                    </div>
                  </div>
                  <motion.span
                    key={result.grandTotal}
                    initial={{ scale: 1.05, opacity: 0.7 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                    className="font-display font-bold text-pine-900"
                    style={{ fontSize: 'clamp(24px, 4vw, 30px)' }}
                  >
                    {pkr(result.grandTotal)}
                  </motion.span>
                </div>

                <div className="est-actions">
                  <Btn variant="primary" size="sm" to="/quote" block>Get Quotation / Send Inquiry →</Btn>
                  <Btn variant="outline" size="sm" to="/calendar" block>Check Dates</Btn>
                  <Btn variant="outline" size="sm" to="/compare" block>Compare Packages</Btn>
                </div>
              </section>
            </Reveal>
          )}

          {/* ---------- sticky calculate bar: always reachable, no long scroll ---------- */}
          <div className="calc-sticky-bar" role="region" aria-label="Calculate estimate">
            <div className="csb-summary">
              {showEstimate ? (
                <>
                  <span className="csb-total">{pkr(result.grandTotal)}</span>
                  <span className="csb-sub">estimated total · {guests.toLocaleString()} guests</span>
                </>
              ) : (
                <>
                  <span className="csb-total">{pkg ? pkg.name : 'Custom menu'}</span>
                  <span className="csb-sub">{guests.toLocaleString()} guests · {calc.eventType} · tap calculate →</span>
                </>
              )}
            </div>
            <Btn variant="gold" size="lg" onClick={handleCalculate}>
              {showEstimate ? 'Update ↑' : 'Calculate →'}
            </Btn>
          </div>

        </div>
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
