// ShadiSphere demo availability calendar — venue-specific simulated slots.
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../state/store';
import { Btn, Badge, Field, PageHead } from '../components/ui';
import {
  slotStatus, SLOT_STATUS_META, isSlotBookable, SlotStatus,
} from '../lib/availability';
import { fmtDate, todayISO } from '../lib/format';
import { SLOTS, SlotId } from '../data/types';

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function isoOf(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export default function CalendarPage() {
  const { state, calc, setCalc, toast } = useStore();
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [venueId, setVenueId] = useState<string>(state.venues[0]?.id ?? '');
  const [selected, setSelected] = useState<string>(calc.date || todayISO());

  const venue = state.venues.find(v => v.id === venueId);

  const cells = useMemo(() => {
    const { y, m } = ym;
    const first = new Date(y, m, 1);
    const lead = (first.getDay() + 6) % 7; // Monday-first
    const daysIn = new Date(y, m + 1, 0).getDate();
    const arr: ({ iso: string; num: number } | null)[] = [];
    for (let i = 0; i < lead; i++) arr.push(null);
    for (let d = 1; d <= daysIn; d++) arr.push({ iso: isoOf(y, m, d), num: d });
    return arr;
  }, [ym]);

  const monthLabel = new Date(ym.y, ym.m, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const stepMonth = (dir: number) => setYm(v => {
    const d = new Date(v.y, v.m + dir, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const dayStatus = (iso: string): Record<SlotId, SlotStatus> => {
    const out = {} as Record<SlotId, SlotStatus>;
    for (const s of SLOTS) {
      out[s.id as SlotId] = venue ? slotStatus(venue.id, iso, s.id as SlotId, state.bookings).status : 'past';
    }
    return out;
  };

  const selectSlot = (iso: string, slot: SlotId) => {
    setCalc(c => ({
      ...c, venueId, date: iso, slot, guests: Math.max(c.guests, venue?.minGuests ?? c.guests),
    }));
    toast('Selected — continue in the calculator.');
  };

  const legend: SlotStatus[] = ['available', 'tentative', 'inquiry', 'booked', 'blocked', 'past'];

  return (
    <div className="wrap">
      <style>{`
        .cal-wrap { display: grid; grid-template-columns: 1fr; gap: 24px; align-items: start; }
        @media (min-width: 1024px) { .cal-wrap { grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); } }
        .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
        .cal-dow { text-align: center; font-size: 12px; font-weight: 700; color: #6B6152; padding: 6px 0; }
        .cal-day { min-height: 64px; border: 1px solid #E9E0CC; border-radius: 10px; background: #fff; padding: 6px; cursor: pointer; text-align: left; font: inherit; }
        .cal-day .dnum { font-weight: 700; font-size: 13px; }
        .cal-day.is-selected { border: 2px solid #1E4D3F; background: #F2F7F3; }
        .cal-day.is-past { background: #F6F3EA; color: #A89E88; cursor: default; }
        .cal-day.is-other { visibility: hidden; }
        .dots { display: flex; gap: 4px; margin-top: 6px; }
        .dot { width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid rgba(0,0,0,.25); }
        .dot.available { background: #2E7D5B; border-color: #2E7D5B; }
        .dot.tentative { background: #D9A62E; border-color: #D9A62E; }
        .dot.booked { background: #B3402E; border-color: #B3402E; }
        .dot.blocked { background: #8A8378; border-color: #8A8378; }
        .slot-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #F0EADA; flex-wrap: wrap; }
        .slot-row:last-child { border-bottom: none; }
        .slot-legend { display: flex; gap: 14px; flex-wrap: wrap; margin: 14px 0; }
        .dot-label { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #4A4438; }
        .cal-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
        .cal-nav { display: flex; gap: 8px; align-items: center; }
        @media (max-width: 560px) { .cal-day { min-height: 52px; } }
      `}</style>

      <PageHead
        eyebrow="Availability"
        title="Demo availability calendar"
        lead="Simulated venue slots for demonstration. This is not a live reservation system."
      />

      <div className="alert alert-info" style={{ marginBottom: 20 }}>
        <strong>Demo availability — not a live reservation system.</strong> Slots shown as booked or
        unavailable come from the demo data; managers can change them in the dashboard.
      </div>

      <div className="cal-wrap">
        <div className="panel">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14, marginBottom: 16 }}>
            <Field label="Venue">
              <select value={venueId} onChange={e => setVenueId(e.target.value)} aria-label="Venue">
                {state.venues.map(v => (
                  <option key={v.id} value={v.id}>{v.name} — {v.city}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="cal-head">
            <h2 style={{ margin: 0 }}>{monthLabel}</h2>
            <div className="cal-nav">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => stepMonth(-1)} aria-label="Previous month">← Prev</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { const n = new Date(); setYm({ y: n.getFullYear(), m: n.getMonth() }); }}>Today</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => stepMonth(1)} aria-label="Next month">Next →</button>
            </div>
          </div>

          <div className="slot-legend" aria-label="Status legend">
            {legend.map(st => (
              <span key={st} className="dot-label">
                <span className={`dot ${SLOT_STATUS_META[st].cls}`} aria-hidden="true" />
                {SLOT_STATUS_META[st].label}
              </span>
            ))}
          </div>

          <div className="cal-grid" role="grid" aria-label={`${monthLabel} availability`}>
            {DOW.map(d => <div key={d} className="cal-dow" role="columnheader">{d}</div>)}
            {cells.map((c, i) => {
              if (!c) return <div key={i} className="cal-day is-other" aria-hidden="true" />;
              const st = dayStatus(c.iso);
              const past = c.iso < todayISO();
              return (
                <button
                  key={c.iso} type="button"
                  className={`cal-day${selected === c.iso ? ' is-selected' : ''}${past ? ' is-past' : ''}`}
                  onClick={() => !past && setSelected(c.iso)}
                  disabled={past}
                  aria-label={`${fmtDate(c.iso)}`}
                >
                  <span className="dnum">{c.num}</span>
                  <span className="dots" aria-hidden="true">
                    {SLOTS.map(s => (
                      <span key={s.id} className={`dot ${SLOT_STATUS_META[st[s.id as SlotId]].cls}`} title={SLOT_STATUS_META[st[s.id as SlotId]].label} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="small muted" style={{ marginTop: 12 }}>
            Dots are Lunch · Afternoon · Evening. Statuses are shown with both color and position — select a date for details.
          </p>
        </div>

        {/* ---------- detail panel ---------- */}
        <aside className="panel">
          <h2 className="side-title">{fmtDate(selected)}</h2>
          {!venue && <p className="muted">Select a venue to see slot details.</p>}
          {venue && SLOTS.map(s => {
            const { status, booking } = slotStatus(venue.id, selected, s.id as SlotId, state.bookings);
            const meta = SLOT_STATUS_META[status];
            return (
              <div key={s.id} className="slot-row">
                <div className="grow">
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <strong>{s.label}</strong>
                    <span className="small muted">{s.time}</span>
                    <Badge tone={status === 'available' ? 'green' : status === 'booked' ? 'red' : status === 'blocked' || status === 'past' ? 'grey' : 'amber'}>
                      {meta.label}
                    </Badge>
                  </div>
                  {booking && (
                    <div className="small muted" style={{ marginTop: 4 }}>
                      {booking.customerName} · {booking.eventType} · {booking.guests.toLocaleString()} guests
                      {booking.note && ` · ${booking.note}`}
                    </div>
                  )}
                  {!isSlotBookable(status) && status === 'booked' && (
                    <div className="small" style={{ marginTop: 4 }}>
                      This slot is held in the demo data. <Link to="/planner">Find alternatives →</Link>
                    </div>
                  )}
                </div>
                {isSlotBookable(status) && (
                  <Btn variant="primary" size="sm" onClick={() => selectSlot(selected, s.id as SlotId)}>
                    Select
                  </Btn>
                )}
              </div>
            );
          })}
          {venue && (
            <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Btn variant="gold" to="/calculator">Continue in calculator</Btn>
              <Btn variant="outline" to={`/venues/${venue.id}`}>View venue</Btn>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
