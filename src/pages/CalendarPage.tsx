// ShadiSphere Grand Marquee — demo availability calendar for our event spaces.
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../state/store';
import { Btn, Badge, Field, PageHead, Reveal } from '../components/ui';
import {
  slotStatus, SLOT_STATUS_META, isSlotBookable, SlotStatus,
} from '../lib/availability';
import { fmtDate, todayISO } from '../lib/format';
import { SLOTS, SlotId } from '../data/types';

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function isoOf(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Small premium section label. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-sans text-[13px] font-bold uppercase tracking-[0.18em] text-pine-600 mb-4">
      <span className="inline-block w-7 h-[2px] rounded-full bg-gradient-to-r from-champagne-500 to-champagne-300 mr-2.5 -translate-y-[3px]" />
      {children}
    </h2>
  );
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
        .cal-day.other { visibility: hidden; }
      `}</style>

      <Reveal>
        <PageHead
          eyebrow="Availability"
          title="Availability calendar"
          lead="Booking schedule of ShadiSphere Grand Marquee. This is not a live reservation system."
        />
      </Reveal>

      <Reveal>
        <div className="alert alert-info" style={{ marginBottom: 20 }}>
          <strong>Availability shown is illustrative — not a live reservation system.</strong> Slots shown as booked or
          unavailable come from the sample data; managers can change them in the dashboard.
        </div>
      </Reveal>

      <div className="cal-wrap">
        <Reveal>
          <div className="cal">
            <div className="cal-head">
              <h3>{monthLabel}</h3>
              <div className="cal-nav">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => stepMonth(-1)} aria-label="Previous month">← Prev</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => { const n = new Date(); setYm({ y: n.getFullYear(), m: n.getMonth() }); }}>Today</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => stepMonth(1)} aria-label="Next month">Next →</button>
              </div>
            </div>

            <div style={{ padding: '6px 16px 0' }}>
              <Field label="Event space">
                <select value={venueId} onChange={e => setVenueId(e.target.value)} aria-label="Event space">
                  {state.venues.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="slot-legend" style={{ padding: '0 20px' }} aria-label="Status legend">
              {legend.map(st => (
                <span key={st} className="badge">
                  <span className={`dot ${SLOT_STATUS_META[st].cls}`} aria-hidden="true" />
                  {SLOT_STATUS_META[st].label}
                </span>
              ))}
            </div>

            <div className="cal-grid" role="grid" aria-label={`${monthLabel} availability`}>
              {DOW.map(d => <div key={d} className="cal-dow" role="columnheader">{d}</div>)}
              {cells.map((c, i) => {
                if (!c) return <div key={i} className="cal-day other" aria-hidden="true" />;
                const st = dayStatus(c.iso);
                const past = c.iso < todayISO();
                return (
                  <button
                    key={c.iso} type="button"
                    className={`cal-day${selected === c.iso ? ' selected' : ''}${past ? ' past' : ''}`}
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
            <p className="small muted" style={{ padding: '12px 20px 18px', margin: 0 }}>
              Dots are Lunch · Afternoon · Evening. Statuses are shown with both color and position — select a date for details.
            </p>
          </div>
        </Reveal>

        {/* ---------- detail panel ---------- */}
        <Reveal delay={0.08}>
          <aside className="panel">
            <SectionLabel>{fmtDate(selected)}</SectionLabel>
            {!venue && <p className="muted">Select an event space to see slot details.</p>}
            {venue && SLOTS.map(s => {
              const { status, booking } = slotStatus(venue.id, selected, s.id as SlotId, state.bookings);
              const meta = SLOT_STATUS_META[status];
              return (
                <div key={s.id} className="slot-row">
                  <div className="grow">
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <strong className="font-display text-[16px]">{s.label}</strong>
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
                        This slot is shown as booked. <Link to="/planner">Find alternatives →</Link>
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
                <Btn variant="outline" to={`/venues/${venue.id}`}>View space</Btn>
              </div>
            )}
          </aside>
        </Reveal>
      </div>
    </div>
  );
}
