// ShadiSphere "Find My Date" — rule-based venue/date recommendations + multi-event planner.
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../state/store';
import {
  Btn, Badge, Field, Empty, PageHead, SectionHead, MiniCalendar,
  Reveal, Stagger, StaggerItem,
} from '../components/ui';
import { recommend, planMultiEvent, RecInput, Recommendation, WindowMode, EventWish, EventPlanCombo } from '../lib/recommend';
import { isoPlus, fmtDate, pkr, todayISO } from '../lib/format';
import {
  BUSINESS, EVENT_TYPES, SLOTS, SlotId, EventType, VenueType,
} from '../data/types';

const WINDOWS: { id: WindowMode; label: string }[] = [
  { id: 'exact', label: 'Exact date' },
  { id: 'plus3', label: '± 3 days' },
  { id: 'plus7', label: '± 7 days' },
  { id: 'forward10', label: 'Next 10 days' },
  { id: 'custom', label: 'Custom range' },
];

const SPACE_TYPES: VenueType[] = ['Banquet Hall', 'Lawn'];

/** Small premium section label. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-sans text-[13px] font-bold uppercase tracking-[0.18em] text-pine-600 mb-4">
      <span className="inline-block w-7 h-[2px] rounded-full bg-gradient-to-r from-champagne-500 to-champagne-300 mr-2.5 -translate-y-[3px]" />
      {children}
    </h2>
  );
}

export default function Planner() {
  const { state, calc, setCalc, toast } = useStore();
  const nav = useNavigate();

  const [form, setForm] = useState({
    city: BUSINESS.city,
    eventType: calc.eventType as EventType,
    guests: calc.guests || 400,
    preferredDate: calc.date >= todayISO() ? calc.date : isoPlus(30),
    window: 'forward10' as WindowMode,
    customEnd: isoPlus(60),
    slot: '' as '' | SlotId,
    budget: '',
    venueType: '' as '' | VenueType,
    spaceId: '',
  });
  const [result, setResult] = useState<ReturnType<typeof recommend> | null>(null);

  // ---- multi-event planner ----
  const [wishes, setWishes] = useState<EventWish[]>([
    { eventType: 'Mehndi', guests: 300, preferredDate: isoPlus(30) },
    { eventType: 'Barat', guests: 500, preferredDate: isoPlus(34) },
  ]);
  const [gapDays, setGapDays] = useState(4);

  const [planSlot, setPlanSlot] = useState<SlotId>('evening');
  const [combos, setCombos] = useState<EventPlanCombo[] | null>(null);

  const activePkg = state.packages.find(p => p.id === calc.packageId && p.enabled)
    ?? state.packages.find(p => p.id === 'standard' && p.enabled);

  const findDates = () => {
    const input: RecInput = {
      city: BUSINESS.city,
      eventType: form.eventType,
      guests: Math.max(1, Math.floor(Number(form.guests) || 0)),
      preferredDate: form.preferredDate,
      window: form.window,
      customEnd: form.window === 'custom' ? form.customEnd : undefined,
      slot: form.slot || undefined,
      budget: form.budget ? Number(form.budget) : undefined,
      venueType: form.venueType || '',
      spaceId: form.spaceId || undefined,
    };
    setResult(recommend(input, state.venues, state.bookings, activePkg));
  };

  // Auto-run once when arriving from the hero "Find My Date" search,
  // so results are already showing — no second click needed.
  const loc = useLocation();
  const autoRan = useRef(false);
  useEffect(() => {
    if ((loc.state as { autoFind?: boolean } | null)?.autoFind && !autoRan.current) {
      autoRan.current = true;
      findDates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyRec = (r: Recommendation, dest: 'calendar' | 'calculator') => {
    setCalc(c => ({
      ...c,
      city: BUSINESS.city,
      venueId: r.venue.id,
      date: r.date,
      slot: r.slot,
      guests: Math.max(c.guests, r.venue.minGuests),
    }));
    toast('Date selected — estimate carries your current selections.');
    nav(dest === 'calendar' ? '/calendar' : '/calculator');
  };

  const addWish = () => {
    if (wishes.length >= 4) return;
    setWishes(w => [...w, { eventType: 'Walima', guests: 400, preferredDate: isoPlus(40) }]);
  };
  const removeWish = (i: number) => setWishes(w => w.filter((_, x) => x !== i));
  const editWish = (i: number, patch: Partial<EventWish>) =>
    setWishes(w => w.map((e, x) => (x === i ? { ...e, ...patch } : e)));

  const findPlans = () => {
    const clean = wishes
      .filter(w => w.preferredDate && w.guests > 0)
      .map(w => ({ ...w, guests: Math.floor(w.guests) }));
    setCombos(planMultiEvent(clean, Math.min(30, Math.max(1, gapDays)), BUSINESS.city, state.venues, state.bookings, activePkg, planSlot));
  };

  const usePlan = (combo: EventPlanCombo, first: EventWish) => {
    setCalc(c => ({
      ...c, city: BUSINESS.city, venueId: combo.venueId, date: combo.dates[0],
      slot: combo.slot, guests: first.guests, eventType: first.eventType,
    }));
    toast('First function loaded into the calculator.');
    nav('/calculator');
  };

  return (
    <div className="wrap">
      <style>{`
        .plan-grid { display: grid; grid-template-columns: 1fr; gap: 24px; align-items: start; }
        @media (min-width: 1024px) { .plan-grid { grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); } }
      `}</style>

      <Reveal>
        <PageHead
          eyebrow="Find My Date"
          title="Smart date & space finder"
          lead="Tell us your event, guests and flexibility — we scan our calendar and rank the best date, slot and event-space matches."
        />
      </Reveal>

      <div className="plan-grid">
        {/* ---------- form ---------- */}
        <Reveal>
          <div className="panel">
            <SectionLabel>Your event</SectionLabel>
            <Field label="Event type">
              <div className="chip-row" role="group" aria-label="Event type">
                {EVENT_TYPES.map(t => (
                  <button key={t} type="button" className={`chip${form.eventType === t ? ' selected' : ''}`}
                    onClick={() => setForm(f => ({ ...f, eventType: t }))} aria-pressed={form.eventType === t}>
                    {t}
                  </button>
                ))}
              </div>
            </Field>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Guests">
                <input type="number" min={50} max={3000} value={form.guests}
                  onChange={e => setForm(f => ({ ...f, guests: Number(e.target.value) }))} aria-label="Guests" />
              </Field>
              <Field label="Preferred date">
                <MiniCalendar value={form.preferredDate}
                  onChange={iso => setForm(f => ({ ...f, preferredDate: iso }))} ariaLabel="Preferred date" />
              </Field>
            </div>
            <Field label="Date flexibility">
              <select value={form.window} onChange={e => setForm(f => ({ ...f, window: e.target.value as WindowMode }))} aria-label="Date flexibility">
                {WINDOWS.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
              </select>
            </Field>
            {form.window === 'custom' && (
              <Field label="Search until">
                <MiniCalendar value={form.customEnd} minDate={form.preferredDate}
                  onChange={iso => setForm(f => ({ ...f, customEnd: iso }))} ariaLabel="Search until" />
              </Field>
            )}
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Time slot">
                <select value={form.slot} onChange={e => setForm(f => ({ ...f, slot: e.target.value as '' | SlotId }))} aria-label="Time slot">
                  <option value="">Any slot</option>
                  {SLOTS.map(s => <option key={s.id} value={s.id}>{s.label} ({s.time})</option>)}
                </select>
              </Field>
              <Field label="Preferred space (optional)">
                <select value={form.spaceId} onChange={e => setForm(f => ({ ...f, spaceId: e.target.value }))} aria-label="Preferred space">
                  <option value="">Any space</option>
                  {state.venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Approximate budget, PKR (optional)" hint="Recommendations slightly above budget are still shown and labelled.">
              <input type="number" min={0} value={form.budget} placeholder="e.g. 2000000"
                onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} aria-label="Budget" />
            </Field>
            <Btn variant="primary" block size="lg" onClick={findDates}>Find dates</Btn>
            <p className="small muted" style={{ marginTop: 10 }}>
              Estimates use the {activePkg?.name ?? 'Standard'} package rate + hall rental.
            </p>
          </div>
        </Reveal>

        {/* ---------- results ---------- */}
        <div>
          {!result && (
            <Empty
              title="No search yet"
              body="Set your event details and press “Find dates” to see ranked date, slot and space recommendations from our calendar."
            />
          )}
          {result && result.recs.length === 0 && (
            <Empty
              title="No suitable matches"
              body={result.blockedReason}
              action={
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Btn variant="outline" onClick={() => setForm(f => ({ ...f, window: 'forward10', slot: '', budget: '' }))}>
                    Widen the search
                  </Btn>
                </div>
              }
            />
          )}
          {result && result.recs.length > 0 && (
            <>
              <Reveal>
                <p className="small muted" style={{ marginBottom: 12 }}>
                  Checked <strong className="text-pine-700">{result.searched.toLocaleString()}</strong> venue/date/slot combinations — top {result.recs.length} matches:
                </p>
              </Reveal>
              <Stagger gap={0.09}>
                {result.recs.map((r, idx) => {
                  const slotLabel = SLOTS.find(s => s.id === r.slot)?.label ?? r.slot;
                  return (
                    <StaggerItem key={`${r.venue.id}-${r.date}-${r.slot}`}>
                      <div className="card rec-card p-5 mb-4">
                        <div className="flex justify-between gap-3 flex-wrap items-start">
                          <div>
                            <div className="flex items-center gap-2.5">
                              <span className="w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-bold text-white shrink-0"
                                style={{ background: 'linear-gradient(180deg, #D9AE4F, #9A7A38)', boxShadow: '0 3px 0 #7A5F28' }}>
                                {idx + 1}
                              </span>
                              <h3 className="font-display text-[20px] m-0">{r.venue.name}</h3>
                            </div>
                            <div className="small muted mt-1.5 ml-[42px]">
                              {BUSINESS.name} · {r.venue.type} · up to {r.venue.maxGuests.toLocaleString()} guests
                            </div>
                          </div>
                          {r.venue.featured && <Badge tone="gold">Featured</Badge>}
                        </div>
                        <div className="flex gap-3.5 flex-wrap my-3.5 ml-[42px]">
                          <span className="badge"><strong>{fmtDate(r.date)}</strong>&nbsp;· {slotLabel}</span>
                          <span className="badge badge-gold">Estimate <strong>{pkr(r.estimate)}</strong></span>
                          <span className="small muted self-center">≈ {pkr(Math.round(r.perGuest))}/guest</span>
                        </div>
                        <ul className="why-list ml-[42px]">
                          {r.reasons.map((x, i) => <li key={i}>{x}</li>)}
                        </ul>
                        <div className="flex gap-2.5 mt-4 flex-wrap ml-[42px]">
                          <Btn variant="outline" size="sm" to={`/venues/${r.venue.id}`}>View Venue</Btn>
                          <Btn variant="outline" size="sm" onClick={() => applyRec(r, 'calendar')}>Select This Date</Btn>
                          <Btn variant="primary" size="sm" onClick={() => applyRec(r, 'calculator')}>Calculate Cost</Btn>
                        </div>
                      </div>
                    </StaggerItem>
                  );
                })}
              </Stagger>
            </>
          )}
        </div>
      </div>

      {/* ---------- multi-event planner ---------- */}
      <Reveal>
        <section className="panel" style={{ marginTop: 36 }}>
          <SectionHead
            eyebrow="Multi-event planner"
            title="Plan Barat, Walima, Mehndi & more"
            lead="Add your functions, pick the gap between them — we find date combinations where the same venue is open for every event."
          />
          <div className="alert alert-info" style={{ marginBottom: 18 }}>
            Suggested schedule — not confirmed bookings. Final availability is confirmed by the venue.
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 16 }}>
            <Field label="Gap between functions (days)">
              <input type="number" min={1} max={30} value={gapDays}
                onChange={e => setGapDays(Number(e.target.value) || 1)} aria-label="Gap days" />
            </Field>
            <Field label="Preferred slot for all functions">
              <select value={planSlot} onChange={e => setPlanSlot(e.target.value as SlotId)} aria-label="Planner slot">
                {SLOTS.map(s => <option key={s.id} value={s.id}>{s.label} ({s.time})</option>)}
              </select>
            </Field>
          </div>

          {wishes.map((w, i) => (
            <div key={i} className="card rec-card p-4 mb-3">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0"
                  style={{ background: 'linear-gradient(180deg, #2A6353, #163A30)', boxShadow: '0 2px 0 #0B1F19' }}>
                  {i + 1}
                </span>
                <span className="font-sans text-[12px] font-bold uppercase tracking-[0.14em] text-champagne-700">
                  Function {i + 1}
                </span>
                {wishes.length > 1 && (
                  <button type="button" className="btn btn-outline btn-sm ml-auto" onClick={() => removeWish(i)} aria-label={`Remove function ${i + 1}`}>
                    Remove
                  </button>
                )}
              </div>
              <div className="wish-row">
                <Field label="Event type">
                  <select value={w.eventType} onChange={e => editWish(i, { eventType: e.target.value as EventType })} aria-label={`Function ${i + 1} type`}>
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Guests">
                  <input type="number" min={50} max={3000} value={w.guests}
                    onChange={e => editWish(i, { guests: Number(e.target.value) })} aria-label={`Function ${i + 1} guests`} />
                </Field>
                <Field label="Preferred date">
                  <MiniCalendar value={w.preferredDate}
                    onChange={iso => editWish(i, { preferredDate: iso })} ariaLabel={`Function ${i + 1} date`} />
                </Field>
                <div />
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
            <Btn variant="outline" onClick={addWish} disabled={wishes.length >= 4}>+ Add function</Btn>
            <Btn variant="primary" onClick={findPlans}>Suggest date combinations</Btn>
          </div>

          {combos && combos.length === 0 && (
            <div style={{ marginTop: 16 }}>
              <Empty
                title="No open combination found"
                body="No single venue is free on every suggested date with your gap. Try a different gap or slot."
              />
            </div>
          )}
          {combos && combos.length > 0 && (
            <Stagger gap={0.09} style={{ marginTop: 20 }}>
              {combos.map((combo, i) => {
                const slotLabel = SLOTS.find(s => s.id === combo.slot)?.label ?? combo.slot;
                return (
                  <StaggerItem key={i}>
                    <div className="card rec-card p-5 mb-4">
                      <div className="flex justify-between gap-3 flex-wrap items-start">
                        <div>
                          <h3 className="font-display text-[20px] m-0">Option {i + 1} — {combo.venueName}</h3>
                          <div className="small muted mt-1">{BUSINESS.city} · {slotLabel} slot · {combo.note}</div>
                        </div>
                        <div className="text-right">
                          <div className="price text-pine-700 text-[18px]">{pkr(combo.totalEstimate)}</div>
                          <div className="small muted">combined estimate</div>
                        </div>
                      </div>
                      {/* timeline of functions */}
                      <div className="relative mt-4 pl-1">
                        <div className="absolute left-[15px] top-2 bottom-2 w-[2px] rounded-full bg-gradient-to-b from-champagne-400 via-champagne-500 to-pine-500" aria-hidden="true" />
                        <div className="grid gap-3">
                          {wishes.map((w, j) => (
                            <div key={j} className="flex items-center gap-3.5 relative">
                              <span className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0 z-10"
                                style={{ background: 'linear-gradient(180deg, #2A6353, #163A30)', boxShadow: '0 2px 0 #0B1F19, 0 0 0 4px #FAF7F0' }}>
                                {j + 1}
                              </span>
                              <div>
                                <strong className="font-display text-[15px]">{w.eventType}</strong>
                                <div className="small muted">{fmtDate(combo.dates[j])} · {w.guests.toLocaleString()} guests</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ marginTop: 14 }}>
                        <Btn variant="primary" size="sm" onClick={() => usePlan(combo, wishes[0])}>Use this plan</Btn>
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </Stagger>
          )}
        </section>
      </Reveal>
    </div>
  );
}
