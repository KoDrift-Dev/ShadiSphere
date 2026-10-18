// ShadiSphere quotation + inquiry flow: itemized quote, validation, WhatsApp handoff.
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../state/store';
import {
  Btn, Badge, Field, PageHead,
} from '../components/ui';
import { calculate } from '../lib/calc';
import { pkr, fmtDate, todayISO } from '../lib/format';
import { buildWhatsAppMessage, waLink } from '../lib/whatsapp';
import {
  BUSINESS, EVENT_TYPES, SLOTS, Inquiry, SlotId, EventType,
} from '../data/types';

function cleanPhone(raw: string): string {
  return raw.replace(/[\s()]/g, '');
}
function validPhone(raw: string): boolean {
  return /^0?3\d{2}[-\s]?\d{7}$/.test(cleanPhone(raw));
}

export default function Quote() {
  const { state, calc, setCalc, update, toast } = useStore();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    city: BUSINESS.city,
    eventType: calc.eventType,
    date: calc.date >= todayISO() ? calc.date : todayISO(),
    slot: calc.slot,
    guests: String(calc.guests),
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Inquiry | null>(null);

  const result = useMemo(
    () => calculate(calc, state.venues, state.menuItems, state.packages, state.promotions, state.bookings),
    [calc, state.venues, state.menuItems, state.packages, state.promotions, state.bookings],
  );
  const venue = calc.venueId ? state.venues.find(v => v.id === calc.venueId) : undefined;
  const pkg = calc.packageId ? state.packages.find(p => p.id === calc.packageId && p.enabled) : undefined;
  const packageName = pkg ? `${pkg.name} package` : 'Fully custom menu';
  const guests = Math.max(0, Math.floor(Number(form.guests) || 0));

  const msg = saved
    ? buildWhatsAppMessage(
      { ...calc, guests, date: form.date, slot: form.slot, eventType: form.eventType, city: form.city },
      result, venue, packageName, saved.name, saved.notes ?? '',
    )
    : '';

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Please enter your name.';
    if (!form.phone.trim()) e.phone = 'Please enter a phone / WhatsApp number.';
    else if (!validPhone(form.phone)) e.phone = 'Enter a valid Pakistani mobile, e.g. 03XX-XXXXXXX.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.';
    if (!form.date) e.date = 'Please choose an event date.';
    else if (form.date < todayISO()) e.date = 'Please choose today or a future date.';
    if (!guests || guests < 50) e.guests = 'Guest count must be at least 50.';
    else if (guests > 3000) e.guests = 'Guest count cannot exceed 3,000.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) { toast('Please fix the highlighted fields.'); return; }
    const ref = `SS-2026-${1042 + state.inquiries.length}`;
    const q: Inquiry = {
      ref,
      name: form.name.trim(),
      phone: cleanPhone(form.phone),
      email: form.email.trim() || undefined,
      city: BUSINESS.city,
      eventType: form.eventType,
      date: form.date,
      slot: form.slot,
      guests,
      venueId: calc.venueId,
      packageId: calc.packageId,
      customMenu: !calc.packageId,
      estimate: result.grandTotal,
      status: 'New',
      notes: form.notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    update(s => ({ ...s, inquiries: [q, ...s.inquiries] }));
    setCalc(c => ({ ...c, guests, date: form.date, slot: form.slot, eventType: form.eventType, city: form.city }));
    setSaved(q);
    toast(`Inquiry ${ref} saved to the demo dashboard.`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const slotLabel = SLOTS.find(s => s.id === form.slot)?.label ?? form.slot;

  return (
    <div className="wrap">
      <style>{`
        .quote-grid { display: grid; grid-template-columns: 1fr; gap: 28px; align-items: start; }
        @media (min-width: 1024px) { .quote-grid { grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); } }
        .ref-chip { display: inline-block; font-family: monospace; font-size: 20px; letter-spacing: 2px; background: #1E4D3F; color: #E9D9AE; padding: 8px 18px; border-radius: 10px; margin: 10px 0; }
        .wa-pre { white-space: pre-wrap; background: #F7F3E8; border: 1px solid #E9E0CC; border-radius: 10px; padding: 14px; font-size: 13px; max-height: 260px; overflow: auto; }
      `}</style>

      <PageHead
        eyebrow="Quotation & Inquiry"
        title="Your quotation"
        lead="Review the itemized estimate, then send a structured inquiry. Nothing is booked until the venue confirms."
      />

      {saved ? (
        <div className="panel print-area">
          <div className="alert alert-ok">
            <strong>Inquiry received — this is a demo record, not a confirmed booking.</strong>
          </div>
          <h2 style={{ marginTop: 16 }}>Your inquiry reference</h2>
          <span className="ref-chip">{saved.ref}</span>
          <div className="line-item"><span>Customer</span><strong>{saved.name}</strong></div>
          <div className="line-item"><span>Phone</span><strong>{saved.phone}</strong></div>
          <div className="line-item"><span>Event</span><strong>{saved.eventType} · {saved.city}</strong></div>
          <div className="line-item"><span>Date</span><strong>{fmtDate(saved.date)} ({slotLabel})</strong></div>
          <div className="line-item"><span>Guests</span><strong>{saved.guests.toLocaleString()}</strong></div>
          <div className="line-item"><span>Venue</span><strong>{venue ? `${venue.name}, ${venue.area}` : 'Not selected'}</strong></div>
          <div className="line-item"><span>Menu</span><strong>{packageName}</strong></div>
          <div className="divider" />
          <div className="total-row">
            <span>Estimated total</span>
            <span className="price-lg">{pkr(saved.estimate)}</span>
          </div>

          <h3 style={{ marginTop: 24 }}>Send via WhatsApp</h3>
          {state.whatsappNumber ? (
            <div className="no-print">
              <p className="small muted">
                Opens WhatsApp with your inquiry prefilled for <strong>{state.whatsappNumber}</strong>.
                The message is not sent automatically — you press send in WhatsApp.
              </p>
              <a
                className="btn btn-primary btn-lg btn-block"
                href={waLink(state.whatsappNumber, msg)}
                target="_blank" rel="noopener noreferrer"
              >
                Send via WhatsApp
              </a>
              <details style={{ marginTop: 12 }}>
                <summary className="small" style={{ cursor: 'pointer' }}>Preview the message</summary>
                <pre className="wa-pre">{msg}</pre>
              </details>
            </div>
          ) : (
            <div className="no-print">
              <div className="alert alert-warn">
                <strong>No WhatsApp number configured.</strong> Ask the demo operator to set one in
                Dashboard → Settings. Your inquiry summary is kept below — copy it manually if needed.
              </div>
              <pre className="wa-pre">{msg}</pre>
            </div>
          )}

          <div className="no-print" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
            <Btn variant="gold" onClick={() => window.print()}>Print quotation</Btn>
            <Btn variant="outline" to="/dashboard/inquiries">View in Dashboard</Btn>
            <Btn variant="outline" to="/calculator">Start new estimate</Btn>
          </div>
        </div>
      ) : (
        <div className="quote-grid">
          {/* ---------- quotation summary ---------- */}
          <div className="panel print-area">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <h2 className="side-title" style={{ margin: 0 }}>Estimate summary</h2>
              <Badge tone="gold">Illustrative — not a final quote</Badge>
            </div>
            <div className="small muted" style={{ margin: '10px 0 14px' }}>
              {guests.toLocaleString()} guests · {form.eventType} · {fmtDate(form.date)} ({slotLabel})
              <br />{venue ? `${BUSINESS.name} — ${venue.name}, ${venue.area}, Lahore` : 'No event space selected yet'} · {packageName}
            </div>

            {result.lines.map((l, i) => (
              <div key={i} className="line-item">
                <div>
                  <span>{l.label}</span>
                  {l.detail && <div className="small muted">{l.detail}</div>}
                </div>
                <strong style={{ color: l.amount < 0 ? '#1E7A4F' : undefined }}>
                  {l.amount < 0 ? '−' : ''}{pkr(Math.abs(l.amount))}
                </strong>
              </div>
            ))}
            {result.lines.length === 0 && <p className="muted">No items in this estimate yet.</p>}

            <div className="divider" />
            <div className="total-row">
              <span>Estimated grand total</span>
              <span className="price-lg">{pkr(result.grandTotal)}</span>
            </div>
            <div className="line-item">
              <span className="muted">Effective cost per guest</span>
              <strong>{pkr(Math.round(result.perGuest))}</strong>
            </div>

            <div className="no-print" style={{ marginTop: 16 }}>
              <Btn variant="outline" onClick={() => window.print()}>Print quotation</Btn>
              {' '}
              <span className="small muted">Also available after submitting your inquiry.</span>
            </div>
          </div>

          {/* ---------- inquiry form ---------- */}
          <div className="panel no-print">
            <h2 className="side-title">Send your inquiry</h2>
            <p className="small muted">Required fields are marked *. The venue replies on the number you give.</p>
            <Field label="Your name *" error={errors.name}>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Ahmed Raza" aria-label="Your name" />
            </Field>
            <Field label="Phone / WhatsApp *" error={errors.phone} hint="Pakistani mobile, e.g. 03XX-XXXXXXX">
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="03XX-XXXXXXX" inputMode="tel" aria-label="Phone" />
            </Field>
            <Field label="Email (optional)" error={errors.email}>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com" aria-label="Email" />
            </Field>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="City">
                <input value={BUSINESS.city} disabled aria-label="City" />
              </Field>
              <Field label="Event type">
                <select value={form.eventType} onChange={e => setForm(f => ({ ...f, eventType: e.target.value as EventType }))} aria-label="Event type">
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
            </div>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Preferred date *" error={errors.date}>
                <input type="date" min={todayISO()} value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))} aria-label="Preferred date" />
              </Field>
              <Field label="Time slot">
                <select value={form.slot} onChange={e => setForm(f => ({ ...f, slot: e.target.value as SlotId }))} aria-label="Time slot">
                  {SLOTS.map(s => <option key={s.id} value={s.id}>{s.label} ({s.time})</option>)}
                </select>
              </Field>
            </div>
            <Field label="Guests *" error={errors.guests}>
              <input type="number" min={50} max={3000} value={form.guests}
                onChange={e => setForm(f => ({ ...f, guests: e.target.value }))} aria-label="Guests" />
            </Field>
            <Field label="Venue" hint="Carried over from the calculator.">
              <input value={venue ? `${BUSINESS.name} — ${venue.name}` : 'Not selected'} disabled aria-label="Event space" />
            </Field>
            <Field label="Menu" hint="Carried over from the calculator.">
              <input value={packageName} disabled aria-label="Menu" />
            </Field>
            <Field label="Additional requirements (optional)">
              <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Stage theme, separate family setup, parking needs…" aria-label="Notes" />
            </Field>
            <Btn variant="primary" block size="lg" onClick={submit}>Submit inquiry</Btn>
            <p className="small muted" style={{ marginTop: 10 }}>
              Demo only — submitting creates a sample record shown in the owner dashboard. No real booking is made.
            </p>
            <p className="small" style={{ marginTop: 6 }}>
              <Link to="/calculator">← Back to calculator</Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
