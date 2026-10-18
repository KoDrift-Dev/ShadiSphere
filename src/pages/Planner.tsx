// ShadiSphere "Find My Date" — rule-based venue/date recommendations + multi-event planner.
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../state/store';
import {
  Btn, Badge, Field, Empty, PageHead, SectionHead,
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
        .rec-card { border: 1px solid #E9E0CC; border-radius: 12px; background: #fff; padding: 18px; margin-bottom: 14px; }
        .rec-card:hover { border-color: #C6A15B; }
        .why-list { margin: 8px 0 0; padding-left: 18px; }
        .why-list li { margin: 4px 0; font-size: 14px; color: #4A4438; }
        .wish-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: end; }
        @media (min-width: 640px) { .wish-row { grid-template-columns: 1fr 1fr 1fr auto; } }
      `}</style>

      <PageHead
        eyebrow="Find My Date"
        title="Smart date & space finder"
        lead="Tell us your event, guests and flexibility — we scan our demo calendar and rank the best date, slot and event-space matches."
      />

      <div className="plan-grid">
        {/* ---------- form ---------- */}
        <div className="panel">
          <h2 className="side-title">Your event</h2>
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
              <input type="date" min={todayISO()} value={form.preferredDate}
                onChange={e => setForm(f => ({ ...f, preferredDate: e.target.value }))} aria-label="Preferred date" />
            </Field>
          </div>
          <Field label="Date flexibility">
            <select value={form.window} onChange={e => setForm(f => ({ ...f, window: e.target.value as WindowMode }))} aria-label="Date flexibility">
              {WINDOWS.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
            </select>
          </Field>
          {form.window === 'custom' && (
            <Field label="Search until">
              <input type="date" min={form.preferredDate} value={form.customEnd}
                onChange={e => setForm(f => ({ ...f, customEnd: e.target.value }))} aria-label="Search until" />
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

        {/* ---------- results ---------- */}
        <div>
          {!result && (
            <Empty
              title="No search yet"
              body="Set your event details and press “Find dates” to see ranked date, slot and space recommendations from our demo calendar."
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
              <p className="small muted" style={{ marginBottom: 12 }}>
                Checked {result.searched.toLocaleString()} venue/date/slot combinations — top {result.recs.length} matches:
              </p>
              {result.recs.map(r => {
                const slotLabel = SLOTS.find(s => s.id === r.slot)?.label ?? r.slot;
                return (
                  <div key={`${r.venue.id}-${r.date}-${r.slot}`} className="rec-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'start' }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px' }}>{r.venue.name}</h3>
                        <div className="small muted">
                          {BUSINESS.name} · {r.venue.type} · up to {r.venue.maxGuests.toLocaleString()} guests
                        </div>
                      </div>
                      {r.venue.featured && <Badge tone="gold">Featured</Badge>}
                    </div>
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', margin: '10px 0' }}>
                      <span><strong>{fmtDate(r.date)}</strong> · {slotLabel}</span>
                      <span>Estimate <strong>{pkr(r.estimate)}</strong></span>
                      <span className="muted">≈ {pkr(Math.round(r.perGuest))}/guest</span>
                    </div>
                    <ul className="why-list">
                      {r.reasons.map((x, i) => <li key={i}>{x}</li>)}
                    </ul>
                    <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                      <Btn variant="outline" size="sm" to={`/venues/${r.venue.id}`}>View Venue</Btn>
                      <Btn variant="ghost" size="sm" onClick={() => applyRec(r, 'calendar')}>Select This Date</Btn>
                      <Btn variant="primary" size="sm" onClick={() => applyRec(r, 'calculator')}>Calculate Cost</Btn>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* ---------- multi-event planner ---------- */}
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
          <div key={i} className="panel" style={{ padding: 14, marginBottom: 12, background: '#FDFBF6' }}>
            <div className="wish-row">
              <Field label={`Function ${i + 1} — type`}>
                <select value={w.eventType} onChange={e => editWish(i, { eventType: e.target.value as EventType })} aria-label={`Function ${i + 1} type`}>
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Guests">
                <input type="number" min={50} max={3000} value={w.guests}
                  onChange={e => editWish(i, { guests: Number(e.target.value) })} aria-label={`Function ${i + 1} guests`} />
              </Field>
              <Field label="Preferred date">
                <input type="date" min={todayISO()} value={w.preferredDate}
                  onChange={e => editWish(i, { preferredDate: e.target.value })} aria-label={`Function ${i + 1} date`} />
              </Field>
              <div>
                {wishes.length > 1 && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeWish(i)} aria-label={`Remove function ${i + 1}`}>
                    Remove
                  </button>
                )}
              </div>
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
              body="No single venue in the demo data is free on every suggested date with your gap. Try a different gap or slot."
            />
          </div>
        )}
        {combos && combos.length > 0 && (
          <div style={{ marginTop: 20 }}>
            {combos.map((combo, i) => {
              const slotLabel = SLOTS.find(s => s.id === combo.slot)?.label ?? combo.slot;
              return (
                <div key={i} className="rec-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px' }}>Option {i + 1} — {combo.venueName}</h3>
                      <div className="small muted">{BUSINESS.city} · {slotLabel} slot · {combo.note}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="price">{pkr(combo.totalEstimate)}</div>
                      <div className="small muted">combined estimate</div>
                    </div>
                  </div>
                  <div className="steps" style={{ marginTop: 12 }}>
                    {wishes.map((w, j) => (
                      <div key={j} className="step">
                        <span className="n">{j + 1}</span>
                        <div>
                          <strong>{w.eventType}</strong>
                          <div className="small muted">{fmtDate(combo.dates[j])} · {w.guests.toLocaleString()} guests</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <Btn variant="primary" size="sm" onClick={() => usePlan(combo, wishes[0])}>Use this plan</Btn>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
