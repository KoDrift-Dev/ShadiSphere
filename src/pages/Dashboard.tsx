// ShadiSphere owner/manager demo dashboard. All data is fictional sample data;
// edits flow into the customer experience via the shared store.
import React from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { useStore } from '../state/store';
import { seedBookings } from '../data/seed';
import {
  Badge, Btn, Confirm, Empty, Field, Modal, PageHead, Reveal, SectionHead, Stagger, StaggerItem, MiniCalendar,
} from '../components/ui';
import {
  fmtDate, fmtDateShort, isoPlus, pkr, todayISO, unitLabel, weekdayOf,
} from '../lib/format';
import { tryAddBooking } from '../lib/availability';
import { buildInquiryMessage, waLink } from '../lib/whatsapp';
import {
  Booking, BookingStatus, EVENT_TYPES, Inquiry, InquiryStatus, MenuItem,
  MenuPackage, Promotion, SLOTS, Venue,
} from '../data/types';

const GATE_KEY = 'shadisphere_dash_entered';

const NAV: { to: string; label: string }[] = [
  { to: '/dashboard', label: 'Overview' },
  { to: '/dashboard/venues', label: 'Event Spaces' },
  { to: '/dashboard/menus', label: 'Menus & Packages' },
  { to: '/dashboard/bookings', label: 'Bookings' },
  { to: '/dashboard/inquiries', label: 'Inquiries' },
  { to: '/dashboard/promotions', label: 'Promotions' },
  { to: '/dashboard/settings', label: 'Settings' },
];

function isActive(pathname: string, to: string): boolean {
  if (to === '/dashboard') return pathname === '/dashboard' || pathname === '/dashboard/overview';
  return pathname === to;
}

function bookingTone(status: BookingStatus): 'gold' | 'green' | 'red' | 'amber' | 'grey' {
  switch (status) {
    case 'booked': return 'red';
    case 'tentative': return 'amber';
    case 'inquiry': return 'gold';
    case 'blocked': return 'grey';
  }
}

function inquiryTone(status: InquiryStatus): 'gold' | 'green' | 'red' | 'amber' | 'grey' {
  switch (status) {
    case 'New': return 'gold';
    case 'Contacted': return 'amber';
    case 'Quoted': return 'amber';
    case 'Confirmed': return 'green';
    case 'Lost': return 'grey';
  }
}

function bookingLabel(status: BookingStatus): string {
  if (status === 'booked') return 'Booked — sample';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function num(v: string, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/* ---------------- visual helpers (markup only — no logic) ---------------- */

/** Serif monogram tile used as a thumbnail next to item names. */
const MONO: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 46, height: 46, borderRadius: 15, flexShrink: 0,
  fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 700, color: '#fff',
  background: 'linear-gradient(150deg, var(--color-pine-500), var(--color-pine-700))',
  border: '1px solid rgba(198,161,91,.55)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.28), 0 8px 16px rgba(30,77,63,.22)',
};

/** Champagne ref-chip for inquiry reference numbers. */
const REF_CHIP: React.CSSProperties = {
  display: 'inline-block', padding: '5px 13px', borderRadius: 999, whiteSpace: 'nowrap',
  border: '1px solid rgba(198,161,91,.5)', background: 'rgba(198,161,91,.14)',
  fontSize: 12.5, fontWeight: 700, letterSpacing: '.05em', color: 'var(--color-champagne-700)',
};

/** Small uppercase label above filter chip rows. */
const FILTER_LABEL: React.CSSProperties = {
  fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.09em',
  color: 'var(--color-ink-400)', marginBottom: 7,
};

/* ---------------- gate ---------------- */

function DashGate({ children }: { children: React.ReactNode }) {
  const [entered, setEntered] = React.useState<boolean>(() => {
    try { return localStorage.getItem(GATE_KEY) === '1'; } catch { return false; }
  });
  if (entered) return <>{children}</>;
  return (
    <div className="wrap" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Reveal className="panel" style={{ maxWidth: 560, textAlign: 'center', padding: '46px 40px' }}>
        <div className="eyebrow" style={{ justifyContent: 'center' }}><span className="rule" />ShadiSphere<span className="rule" /></div>
        <h1 className="font-display" style={{ fontSize: 34 }}>Owner Dashboard</h1>
        <p className="lead" style={{ marginTop: 8 }}>
          Manage your event spaces, menus, sample bookings, inquiries and promotions.
        </p>
        <div className="alert alert-warn" style={{ textAlign: 'left', marginTop: 16 }}>
          <strong>Sample data — no real authentication.</strong> Anyone can open this panel.
          Everything here is fictional sample data for illustration purposes.
        </div>
        <Btn
          size="lg"
          variant="gold"
          onClick={() => {
            try { localStorage.setItem(GATE_KEY, '1'); } catch { /* ignore */ }
            setEntered(true);
          }}
        >
          Enter Dashboard
        </Btn>
        <p className="muted small" style={{ marginTop: 14 }}>
          <Link to="/">Back to the customer website</Link>
        </p>
      </Reveal>
    </div>
  );
}

/* ---------------- shell ---------------- */

function DashShell() {
  const loc = useLocation();
  return (
    <div className="dash">
      <style>{`
        .dash-cols { display: grid; grid-template-columns: 1.35fr 1fr; gap: 20px; margin-top: 20px; align-items: start; }
        .dash-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
        .dash-list li {
          display: flex; justify-content: space-between; align-items: center; gap: 12px;
          padding: 12px 16px; font-size: 14.5px; border-radius: 14px;
          background: rgba(255,255,255,.66); border: 1px solid rgba(198,161,91,.22);
          backdrop-filter: blur(8px);
          transition: transform .15s ease, box-shadow .15s ease;
        }
        .dash-list li:hover { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(30,77,63,.12); }
        .dash-side .brandline { font-family: var(--font-display); font-size: 24px; color: #fff; font-weight: 700; letter-spacing: .01em; }
        .dash-side .brandline .gdot { color: var(--color-champagne-300); }
        @media (max-width: 1100px) { .dash-cols { grid-template-columns: 1fr; } }
        @media (max-width: 900px) {
          .dash { grid-template-columns: 1fr; }
          .dash-side { padding: 14px 12px; }
          .dash-side .snav { display: flex; overflow-x: auto; gap: 6px; padding-bottom: 4px; }
          .dash-side .snav a { white-space: nowrap; margin-bottom: 0; }
          .dash-main { padding: 20px 14px; }
          .kpi-grid { grid-template-columns: 1fr 1fr; }
          .form-row.c2, .form-row.c3, .form-row.c4 { grid-template-columns: 1fr; }
        }
        @media (max-width: 560px) { .kpi-grid { grid-template-columns: 1fr; } }
      `}</style>
      <aside className="dash-side">
        <div style={{ padding: '2px 14px 14px' }}>
          <div className="brandline">ShadiSphere<span className="gdot">.</span></div>
          <div style={{ fontSize: 12.5, color: 'var(--color-champagne-300)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 4 }}>
            Owner Dashboard
          </div>
        </div>
        <div className="snav">
          {NAV.map(n => (
            <Link key={n.to} to={n.to} className={isActive(loc.pathname, n.to) ? 'active' : ''}>
              {n.label}
            </Link>
          ))}
        </div>
        <div style={{ padding: '14px 14px 0' }}>
          <div className="alert alert-warn" style={{ fontSize: 12.5, padding: '10px 12px', marginBottom: 12, background: 'rgba(255,255,255,.06)', borderColor: 'rgba(255,255,255,.18)', color: '#EDE7D6' }}>
            <strong>Sample access.</strong> Sample data only — no real authentication, no production data.
          </div>
          <div className="side-title">Website</div>
          <Link to="/" style={{ display: 'block' }}>← View customer site</Link>
        </div>
      </aside>
      <main className="dash-main">
        <div className="alert alert-warn" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-champagne-500)', boxShadow: '0 0 0 4px rgba(198,161,91,.18)', flexShrink: 0 }} />
          <span><strong>Sample data</strong> — all data here is fictional sample data. Changes reflect on the customer site instantly.</span>
        </div>
        <Routes>
          <Route index element={<Overview />} />
          <Route path="overview" element={<Overview />} />
          <Route path="venues" element={<VenueMgmt />} />
          <Route path="menus" element={<MenuMgmt />} />
          <Route path="bookings" element={<BookingMgmt />} />
          <Route path="inquiries" element={<InquiryMgmt />} />
          <Route path="promotions" element={<PromoMgmt />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Empty title="Not found" body="This dashboard section does not exist." />} />
        </Routes>
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <DashGate>
      <DashShell />
    </DashGate>
  );
}

/* ---------------- 1. Overview ---------------- */

function Overview() {
  const { state } = useStore();
  const today = todayISO();
  const venueById = React.useMemo(() => new Map(state.venues.map(v => [v.id, v])), [state.venues]);

  const booked = state.bookings.filter(b => b.status === 'booked');
  const upcoming = booked.filter(b => b.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.slot.localeCompare(b.slot))
    .slice(0, 6);
  const recent = [...state.inquiries]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const totalInq = state.inquiries.length;
  const confirmed = state.inquiries.filter(i => i.status === 'Confirmed');
  const estValue = state.inquiries
    .filter(i => i.status === 'Confirmed' || i.status === 'Quoted')
    .reduce((s, i) => s + i.estimate, 0);
  const wkLunch = booked.filter(b => {
    const wd = weekdayOf(b.date);
    return (wd >= 1 && wd <= 5) || b.slot === 'lunch';
  });
  const convPct = totalInq ? Math.round((confirmed.length / totalInq) * 100) : 0;
  const utilPct = booked.length ? Math.round((wkLunch.length / booked.length) * 100) : 0;

  const quiet: { date: string; count: number }[] = [];
  for (let i = 0; i < 14; i++) {
    const d = isoPlus(i);
    const n = state.bookings.filter(b => b.date === d && b.status !== 'blocked').length;
    if (n < 2) quiet.push({ date: d, count: n });
  }

  const slotName = (id: string) => SLOTS.find(s => s.id === id)?.label ?? id;

  return (
    <div>
      <PageHead eyebrow="Owner dashboard" title="Overview" lead="Sample business activity at ShadiSphere Grand Marquee, Lahore." />
      <Stagger className="kpi-grid" gap={0.07}>
        <StaggerItem>
          <div className="kpi">
            <div className="k-label">Total inquiries</div>
            <div className="k-value">{totalInq}</div>
            <div className="k-sub">sample records</div>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="kpi">
            <div className="k-label">Upcoming events</div>
            <div className="k-value">{upcoming.length}</div>
            <div className="k-sub">booked slots on or after today</div>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="kpi">
            <div className="k-label">Booked sample slots</div>
            <div className="k-value">{booked.length}</div>
            <div className="k-sub">ShadiSphere Grand Marquee · Lahore</div>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="kpi">
            <div className="k-label">Estimated booking value</div>
            <div className="k-value">{pkr(estValue)}</div>
            <div className="k-sub">illustrative sample data</div>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="kpi">
            <div className="k-label">Inquiry conversion</div>
            <div className="k-value">{convPct}%</div>
            <div className="k-sub">{confirmed.length} of {totalInq} inquiries confirmed</div>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="kpi">
            <div className="k-label">Weekday &amp; lunch utilization</div>
            <div className="k-value">{utilPct}%</div>
            <div className="k-sub">{wkLunch.length} of {booked.length} booked slots</div>
          </div>
        </StaggerItem>
      </Stagger>
      <p className="muted small" style={{ marginTop: 12 }}>All figures are illustrative sample data.</p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
        <Btn variant="gold" size="sm" to="/dashboard/bookings">Manage bookings</Btn>
        <Btn variant="gold" size="sm" to="/dashboard/inquiries">Review inquiries</Btn>
        <Btn variant="gold" size="sm" to="/dashboard/promotions">New promotion</Btn>
        <Btn variant="gold" size="sm" to="/calculator">Open cost calculator</Btn>
      </div>

      <div className="dash-cols">
        <Reveal className="panel">
          <h3>Upcoming events</h3>
          {upcoming.length === 0 ? (
            <p className="muted">No upcoming bookings.</p>
          ) : (
            <ul className="dash-list">
              {upcoming.map(b => (
                <li key={b.id}>
                  <span>
                    <strong>{venueById.get(b.venueId)?.name ?? 'Unknown venue'}</strong>
                    <br />
                    <span className="muted small">{b.eventType} · {b.guests} guests · {b.customerName}</span>
                  </span>
                  <span style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {fmtDate(b.date)}<br />
                    <span className="muted small">{slotName(b.slot)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div style={{ marginTop: 14 }}>
            <Btn variant="outline" size="sm" to="/dashboard/bookings">Manage bookings</Btn>
          </div>
        </Reveal>

        <Reveal className="panel" delay={0.08}>
          <h3>Recent inquiries</h3>
          {recent.length === 0 ? (
            <p className="muted">No inquiries yet.</p>
          ) : (
            <ul className="dash-list">
              {recent.map(i => (
                <li key={i.ref}>
                  <span>
                    <strong>{i.name}</strong>
                    <br />
                    <span className="muted small">{i.ref} · {i.eventType} · {pkr(i.estimate)}</span>
                  </span>
                  <Badge tone={inquiryTone(i.status)}>{i.status}</Badge>
                </li>
              ))}
            </ul>
          )}
          <div style={{ marginTop: 14 }}>
            <Btn variant="outline" size="sm" to="/dashboard/inquiries">All inquiries</Btn>
          </div>
        </Reveal>
      </div>

      <Reveal className="panel" delay={0.05} style={{ marginTop: 20 }}>
        <h3>Promotional opportunities</h3>
        <p className="muted" style={{ marginBottom: 10 }}>
          Quiet days in the next 14 days — consider a targeted promotion to fill them.
        </p>
        {quiet.length === 0 ? (
          <p className="muted">Every day in the next two weeks has healthy sample bookings.</p>
        ) : (
          <ul className="dash-list">
            {quiet.slice(0, 8).map(q => (
              <li key={q.date}>
                <span><strong>{fmtDate(q.date)}</strong> <span className="muted small">· {q.count === 0 ? 'no bookings yet' : `${q.count} booking`}</span></span>
                <Link to="/dashboard/promotions" style={{ whiteSpace: 'nowrap' }}>Create promotion →</Link>
              </li>
            ))}
          </ul>
        )}
      </Reveal>
    </div>
  );
}

/* ---------------- 2. Event spaces ---------------- */

const VENUE_TYPES = ['Marquee', 'Banquet Hall', 'Lawn', 'Wedding Estate'] as const;
const VENUE_CONFIGS = ['Indoor', 'Outdoor', 'Indoor + Outdoor'] as const;

function VenueMgmt() {
  const { state, update, toast } = useStore();
  const [edit, setEdit] = React.useState<Venue | null>(null);

  const save = () => {
    if (!edit) return;
    if (!edit.name.trim()) { toast('Venue name is required.'); return; }
    const clean: Venue = {
      ...edit,
      name: edit.name.trim(),
      area: edit.area.trim(),
      description: edit.description.trim(),
      minGuests: Math.max(0, Math.round(edit.minGuests)),
      maxGuests: Math.max(edit.minGuests, Math.round(edit.maxGuests)),
      amenities: edit.amenities.map(a => a.trim()).filter(Boolean),
      hallRental: {
        lunch: Math.max(0, Math.round(edit.hallRental.lunch)),
        afternoon: Math.max(0, Math.round(edit.hallRental.afternoon)),
        evening: Math.max(0, Math.round(edit.hallRental.evening)),
      },
    };
    update(s => ({ ...s, venues: s.venues.map(v => (v.id === clean.id ? clean : v)) }));
    setEdit(null);
    toast('Venue updated — changes are live on the customer site.');
  };

  return (
    <div>
      <PageHead eyebrow="Owner dashboard" title="Event Spaces" lead="Edit our halls and lawn — capacity, rental prices, amenities. Changes appear on the customer site immediately." />
      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Space</th><th>Type</th><th>Capacity</th><th>Evening rental</th><th>Featured</th><th></th>
            </tr>
          </thead>
          <tbody>
            {state.venues.map(v => (
              <tr key={v.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={MONO} aria-hidden="true">{v.name.charAt(0)}</span>
                    <span><strong>{v.name}</strong><br /><span className="muted small">{v.area}</span></span>
                  </div>
                </td>
                <td>{v.type}</td>
                <td>{v.minGuests.toLocaleString()}–{v.maxGuests.toLocaleString()}</td>
                <td className="price">{pkr(v.hallRental.evening)}</td>
                <td>{v.featured ? <Badge tone="gold">Featured</Badge> : <span className="muted">—</span>}</td>
                <td><Btn variant="outline" size="sm" onClick={() => setEdit({ ...v, amenities: [...v.amenities] })}>Edit</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {edit && (
        <Modal title={`Edit space — ${edit.name}`} onClose={() => setEdit(null)} wide>
          <div className="form-row c2">
            <Field label="Venue name">
              <input className="input" value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} />
            </Field>
            <Field label="Area">
              <input className="input" value={edit.area} onChange={e => setEdit({ ...edit, area: e.target.value })} />
            </Field>
            <Field label="Venue type">
              <select className="input" value={edit.type} onChange={e => setEdit({ ...edit, type: e.target.value as Venue['type'] })}>
                {VENUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Configuration">
              <select className="input" value={edit.config} onChange={e => setEdit({ ...edit, config: e.target.value as Venue['config'] })}>
                {VENUE_CONFIGS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Featured space">
              <label className="checkline" style={{ paddingTop: 6 }}>
                <input type="checkbox" checked={edit.featured} onChange={e => setEdit({ ...edit, featured: e.target.checked })} />
                Show in featured lists
              </label>
            </Field>
            <Field label="Minimum guests">
              <input className="input" type="number" min={0} value={edit.minGuests} onChange={e => setEdit({ ...edit, minGuests: num(e.target.value, edit.minGuests) })} />
            </Field>
            <Field label="Maximum guests">
              <input className="input" type="number" min={0} value={edit.maxGuests} onChange={e => setEdit({ ...edit, maxGuests: num(e.target.value, edit.maxGuests) })} />
            </Field>
            <Field label="Hall rental — Lunch (PKR)">
              <input className="input" type="number" min={0} value={edit.hallRental.lunch} onChange={e => setEdit({ ...edit, hallRental: { ...edit.hallRental, lunch: num(e.target.value) } })} />
            </Field>
            <Field label="Hall rental — Afternoon (PKR)">
              <input className="input" type="number" min={0} value={edit.hallRental.afternoon} onChange={e => setEdit({ ...edit, hallRental: { ...edit.hallRental, afternoon: num(e.target.value) } })} />
            </Field>
            <Field label="Hall rental — Evening (PKR)">
              <input className="input" type="number" min={0} value={edit.hallRental.evening} onChange={e => setEdit({ ...edit, hallRental: { ...edit.hallRental, evening: num(e.target.value) } })} />
            </Field>
          </div>
          <Field label="Amenities" hint="Comma-separated">
            <input className="input" value={edit.amenities.join(', ')} onChange={e => setEdit({ ...edit, amenities: e.target.value.split(',') })} />
          </Field>
          <Field label="Description">
            <textarea className="input" value={edit.description} onChange={e => setEdit({ ...edit, description: e.target.value })} />
          </Field>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
            <Btn variant="outline" onClick={() => setEdit(null)}>Cancel</Btn>
            <Btn onClick={save}>Save changes</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- 3. Menus & Packages ---------------- */

function MenuMgmt() {
  const { state, update, toast } = useStore();
  const [pkgEdit, setPkgEdit] = React.useState<MenuPackage | null>(null);
  const [itemEdit, setItemEdit] = React.useState<MenuItem | null>(null);

  const savePkg = () => {
    if (!pkgEdit) return;
    const clean: MenuPackage = {
      ...pkgEdit,
      name: pkgEdit.name.trim() || pkgEdit.name,
      tagline: pkgEdit.tagline.trim(),
      pricePerGuest: Math.max(0, Math.round(pkgEdit.pricePerGuest)),
    };
    update(s => ({ ...s, packages: s.packages.map(p => (p.id === clean.id ? clean : p)) }));
    setPkgEdit(null);
    toast('Package updated — the calculator uses the new price immediately.');
  };

  const saveItem = () => {
    if (!itemEdit) return;
    const clean: MenuItem = {
      ...itemEdit,
      name: itemEdit.name.trim() || itemEdit.name,
      price: Math.max(0, Math.round(itemEdit.price)),
    };
    update(s => ({ ...s, menuItems: s.menuItems.map(m => (m.id === clean.id ? clean : m)) }));
    setItemEdit(null);
    toast('Menu item updated — the calculator uses the new price immediately.');
  };

  return (
    <div>
      <PageHead eyebrow="Owner dashboard" title="Menus & Packages" lead="Adjust package prices and item-level rates used by the customer cost calculator." />
      <div className="alert alert-info">The customer calculator uses updated values immediately — there is no publish step.</div>

      <h2 style={{ fontSize: 22, margin: '22px 0 12px' }}>Packages</h2>
      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Package</th><th>Per guest</th><th>Included dishes</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {state.packages.map(p => (
              <tr key={p.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={MONO} aria-hidden="true">{p.name.charAt(0)}</span>
                    <span><strong>{p.name}</strong><br /><span className="muted small">{p.tagline}</span></span>
                  </div>
                </td>
                <td className="price">{pkr(p.pricePerGuest)}</td>
                <td>{p.included.length}</td>
                <td>{p.enabled ? <Badge tone="green">Enabled</Badge> : <Badge tone="grey">Disabled</Badge>}</td>
                <td><Btn variant="outline" size="sm" onClick={() => setPkgEdit({ ...p })}>Edit</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: 22, margin: '28px 0 12px' }}>Menu items</h2>
      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Item</th><th>Category</th><th>Unit</th><th>Price</th><th>Enabled</th><th></th></tr>
          </thead>
          <tbody>
            {state.menuItems.map(m => (
              <tr key={m.id}>
                <td><strong>{m.name}</strong>{m.addOnOnly && <span className="muted small"> · add-on only</span>}</td>
                <td>{m.category}</td>
                <td>{unitLabel(m.unit)}</td>
                <td className="price">{pkr(m.price)}</td>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Enable ${m.name}`}
                    checked={m.enabled}
                    onChange={e => {
                      const enabled = e.target.checked;
                      update(s => ({ ...s, menuItems: s.menuItems.map(x => (x.id === m.id ? { ...x, enabled } : x)) }));
                    }}
                  />
                </td>
                <td><Btn variant="outline" size="sm" onClick={() => setItemEdit({ ...m })}>Edit</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pkgEdit && (
        <Modal title={`Edit package — ${pkgEdit.name}`} onClose={() => setPkgEdit(null)}>
          <Field label="Package name">
            <input className="input" value={pkgEdit.name} onChange={e => setPkgEdit({ ...pkgEdit, name: e.target.value })} />
          </Field>
          <Field label="Tagline">
            <input className="input" value={pkgEdit.tagline} onChange={e => setPkgEdit({ ...pkgEdit, tagline: e.target.value })} />
          </Field>
          <Field label="Price per guest (PKR)">
            <input className="input" type="number" min={0} value={pkgEdit.pricePerGuest} onChange={e => setPkgEdit({ ...pkgEdit, pricePerGuest: num(e.target.value) })} />
          </Field>
          <Field label="Included dishes">
            <input className="input" value={`${pkgEdit.included.length} items`} disabled aria-readonly="true" />
          </Field>
          <Field label="Availability">
            <label className="checkline" style={{ paddingTop: 6 }}>
              <input type="checkbox" checked={pkgEdit.enabled} onChange={e => setPkgEdit({ ...pkgEdit, enabled: e.target.checked })} />
              Enabled in the customer calculator
            </label>
          </Field>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
            <Btn variant="outline" onClick={() => setPkgEdit(null)}>Cancel</Btn>
            <Btn onClick={savePkg}>Save changes</Btn>
          </div>
        </Modal>
      )}

      {itemEdit && (
        <Modal title={`Edit item — ${itemEdit.name}`} onClose={() => setItemEdit(null)}>
          <Field label="Item name">
            <input className="input" value={itemEdit.name} onChange={e => setItemEdit({ ...itemEdit, name: e.target.value })} />
          </Field>
          <Field label={`Price (${unitLabel(itemEdit.unit)}, PKR)`}>
            <input className="input" type="number" min={0} value={itemEdit.price} onChange={e => setItemEdit({ ...itemEdit, price: num(e.target.value) })} />
          </Field>
          <Field label="Description">
            <textarea className="input" value={itemEdit.description} onChange={e => setItemEdit({ ...itemEdit, description: e.target.value })} />
          </Field>
          <Field label="Availability">
            <label className="checkline" style={{ paddingTop: 6 }}>
              <input type="checkbox" checked={itemEdit.enabled} onChange={e => setItemEdit({ ...itemEdit, enabled: e.target.checked })} />
              Available in the customer menu builder
            </label>
          </Field>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
            <Btn variant="outline" onClick={() => setItemEdit(null)}>Cancel</Btn>
            <Btn onClick={saveItem}>Save changes</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- 4. Bookings ---------------- */

const ALL_STATUSES: BookingStatus[] = ['inquiry', 'tentative', 'booked', 'blocked'];

function BookingMgmt() {
  const { state, update, toast } = useStore();
  const [fVenue, setFVenue] = React.useState('all');
  const [fDate, setFDate] = React.useState('upcoming');
  const [fStatus, setFStatus] = React.useState('all');
  const [addOpen, setAddOpen] = React.useState(false);
  const [delId, setDelId] = React.useState<string | null>(null);

  const venueById = React.useMemo(() => new Map(state.venues.map(v => [v.id, v])), [state.venues]);
  const today = todayISO();

  const rows = state.bookings
    .filter(b => (fVenue === 'all' || b.venueId === fVenue)
      && (fDate === 'all' || (fDate === 'upcoming' ? b.date >= today : b.date === fDate))
      && (fStatus === 'all' || b.status === fStatus))
    .sort((a, b) => a.date.localeCompare(b.date) || a.slot.localeCompare(b.slot));

  const setStatus = (id: string, status: BookingStatus) => {
    update(s => ({ ...s, bookings: s.bookings.map(b => (b.id === id ? { ...b, status } : b)) }));
    toast('Booking status updated — the customer calendar reflects this immediately.');
  };

  const doDelete = () => {
    if (!delId) return;
    update(s => ({ ...s, bookings: s.bookings.filter(b => b.id !== delId) }));
    setDelId(null);
    toast('Sample booking removed.');
  };

  return (
    <div>
      <SectionHead eyebrow="Owner dashboard" title="Bookings" lead="Simulated bookings that drive the customer availability calendar." action={<Btn variant="gold" onClick={() => setAddOpen(true)}>Add booking</Btn>} />
      <div className="alert alert-info">Changes update the customer calendar immediately. Sample bookings never represent real reservations.</div>

      <div style={{ display: 'grid', gap: 14, marginBottom: 20 }}>
        <div>
          <div style={FILTER_LABEL}>Space</div>
          <div className="chip-row">
            <button type="button" className={`chip${fVenue === 'all' ? ' active' : ''}`} onClick={() => setFVenue('all')}>All spaces</button>
            {state.venues.map(v => (
              <button key={v.id} type="button" className={`chip${fVenue === v.id ? ' active' : ''}`} onClick={() => setFVenue(v.id)}>{v.name}</button>
            ))}
          </div>
        </div>
        <div>
          <div style={FILTER_LABEL}>Date</div>
          <div className="chip-row">
            <button type="button" className={`chip${fDate === 'upcoming' ? ' active' : ''}`} onClick={() => setFDate('upcoming')}>All upcoming</button>
            <button type="button" className={`chip${fDate === 'all' ? ' active' : ''}`} onClick={() => setFDate('all')}>All dates</button>
          </div>
        </div>
        <div>
          <div style={FILTER_LABEL}>Status</div>
          <div className="chip-row">
            <button type="button" className={`chip${fStatus === 'all' ? ' active' : ''}`} onClick={() => setFStatus('all')}>All statuses</button>
            {ALL_STATUSES.map(s => (
              <button key={s} type="button" className={`chip${fStatus === s ? ' active' : ''}`} onClick={() => setFStatus(s)}>{bookingLabel(s)}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Date</th><th>Venue</th><th>Slot</th><th>Status</th><th>Event</th><th>Guests</th><th>Customer</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map(b => (
              <tr key={b.id}>
                <td style={{ whiteSpace: 'nowrap' }}>{fmtDateShort(b.date)}</td>
                <td>{venueById.get(b.venueId)?.name ?? '—'}</td>
                <td>{SLOTS.find(s => s.id === b.slot)?.label ?? b.slot}</td>
                <td>
                  <select
                    className="input"
                    style={{ padding: '6px 10px', fontSize: 13.5 }}
                    aria-label={`Status for booking on ${b.date}`}
                    value={b.status}
                    onChange={e => setStatus(b.id, e.target.value as BookingStatus)}
                  >
                    {ALL_STATUSES.map(s => <option key={s} value={s}>{bookingLabel(s)}</option>)}
                  </select>
                  <div style={{ marginTop: 6 }}><Badge tone={bookingTone(b.status)}>{bookingLabel(b.status)}</Badge></div>
                </td>
                <td>{b.eventType}</td>
                <td>{b.guests}</td>
                <td>{b.customerName}</td>
                <td><Btn variant="outline" size="sm" onClick={() => setDelId(b.id)}>Delete</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <Empty title="No bookings match" body="Try widening the filters." />}

      {delId && (
        <Confirm
          title="Delete this sample booking?"
          body="The slot will show as available on the customer calendar again. This only affects sample data."
          confirmLabel="Delete booking"
          onConfirm={doDelete}
          onCancel={() => setDelId(null)}
        />
      )}

      {addOpen && <AddBookingModal onClose={() => setAddOpen(false)} />}
    </div>
  );
}

function AddBookingModal({ onClose }: { onClose: () => void }) {
  const { state, update, toast } = useStore();
  const [venueId, setVenueId] = React.useState(state.venues[0]?.id ?? '');
  const [date, setDate] = React.useState(todayISO());
  const [slot, setSlot] = React.useState<'lunch' | 'afternoon' | 'evening'>('evening');
  const [status, setStatus] = React.useState<BookingStatus>('booked');
  const [eventType, setEventType] = React.useState<string>(EVENT_TYPES[0]);
  const [guests, setGuests] = React.useState('400');
  const [customerName, setCustomerName] = React.useState('');
  const [err, setErr] = React.useState<string | null>(null);

  const save = () => {
    const g = Math.max(0, Math.round(num(guests)));
    if (!venueId) { setErr('Choose an event space.'); return; }
    if (!date) { setErr('Choose a date.'); return; }
    const res = tryAddBooking(state.bookings, {
      venueId, date, slot, status,
      eventType: eventType as Booking['eventType'],
      guests: g,
      customerName: customerName.trim() || 'Sample booking',
    });
    if (!res.ok) { setErr(res.reason); return; }
    update(s => ({ ...s, bookings: res.bookings }));
    toast('Sample booking added — the customer calendar reflects this immediately.');
    onClose();
  };

  return (
    <Modal title="Add sample booking" onClose={onClose}>
      {err && <div className="alert alert-err" role="alert">{err}</div>}
      <div className="form-row c2">
        <Field label="Venue">
          <select className="input" value={venueId} onChange={e => setVenueId(e.target.value)}>
            {state.venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </Field>
        <Field label="Date">
          <MiniCalendar value={date} onChange={setDate} ariaLabel="Date" />
        </Field>
        <Field label="Slot">
          <select className="input" value={slot} onChange={e => setSlot(e.target.value as typeof slot)}>
            {SLOTS.map(s => <option key={s.id} value={s.id}>{s.label} · {s.time}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select className="input" value={status} onChange={e => setStatus(e.target.value as BookingStatus)}>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{bookingLabel(s)}</option>)}
          </select>
        </Field>
        <Field label="Event type">
          <select className="input" value={eventType} onChange={e => setEventType(e.target.value)}>
            {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Guests">
          <input className="input" type="number" min={0} value={guests} onChange={e => setGuests(e.target.value)} />
        </Field>
      </div>
      <Field label="Customer name">
        <input className="input" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. Ahmed family" />
      </Field>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
        <Btn variant="outline" onClick={onClose}>Cancel</Btn>
        <Btn onClick={save}>Add booking</Btn>
      </div>
    </Modal>
  );
}

/* ---------------- 5. Inquiries ---------------- */

const INQUIRY_STATUSES: InquiryStatus[] = ['New', 'Contacted', 'Quoted', 'Confirmed', 'Lost'];

function InquiryMgmt() {
  const { state, update, toast } = useStore();
  const [detail, setDetail] = React.useState<Inquiry | null>(null);

  const venueById = React.useMemo(() => new Map(state.venues.map(v => [v.id, v])), [state.venues]);
  const rows = [...state.inquiries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const setStatus = (ref: string, status: InquiryStatus) => {
    update(s => ({ ...s, inquiries: s.inquiries.map(i => (i.ref === ref ? { ...i, status } : i)) }));
    toast(`Inquiry ${ref} marked ${status}.`);
  };

  return (
    <div>
      <PageHead eyebrow="Owner dashboard" title="Inquiries" lead="Customer inquiries submitted from the website appear here automatically." />
      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Ref</th><th>Name</th><th>Phone</th><th>Event</th><th>Date</th><th>Guests</th><th>Venue</th><th>Estimate</th><th>Status</th></tr>
          </thead>
          <tbody>
            {rows.map(i => (
              <tr key={i.ref} style={{ cursor: 'pointer' }} onClick={() => setDetail(i)}>
                <td style={{ whiteSpace: 'nowrap' }}><span style={REF_CHIP}>{i.ref}</span></td>
                <td><strong>{i.name}</strong></td>
                <td>{i.phone}</td>
                <td>{i.eventType}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{fmtDateShort(i.date)}</td>
                <td>{i.guests}</td>
                <td>{i.venueId ? venueById.get(i.venueId)?.name ?? '—' : <span className="muted">Any</span>}</td>
                <td className="price">{pkr(i.estimate)}</td>
                <td onClick={e => e.stopPropagation()}>
                  <select
                    className="input"
                    style={{ padding: '6px 10px', fontSize: 13.5 }}
                    aria-label={`Status for inquiry ${i.ref}`}
                    value={i.status}
                    onChange={e => setStatus(i.ref, e.target.value as InquiryStatus)}
                  >
                    {INQUIRY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div style={{ marginTop: 6 }}><Badge tone={inquiryTone(i.status)}>{i.status}</Badge></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <Empty title="No inquiries yet" body="Submit one from the customer site's Quotation page to see it here." />}

      {detail && (
        <InquiryDetail
          inquiry={detail}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}

function InquiryDetail({ inquiry, onClose }: { inquiry: Inquiry; onClose: () => void }) {
  const { state } = useStore();
  const venueName = inquiry.venueId
    ? (state.venues.find(v => v.id === inquiry.venueId)?.name ?? 'Not selected')
    : 'Not selected';
  const packageName = inquiry.packageId
    ? (state.packages.find(p => p.id === inquiry.packageId)?.name ?? 'Custom menu')
    : (inquiry.customMenu ? 'Custom menu' : 'Not selected');
  const slotLabel = SLOTS.find(s => s.id === inquiry.slot)?.label ?? inquiry.slot;

  const row = (k: string, v: React.ReactNode) => (
    <div className="line-item"><span className="lbl">{k}</span><span style={{ textAlign: 'right' }}>{v}</span></div>
  );

  return (
    <Modal title={`Inquiry ${inquiry.ref}`} onClose={onClose}>
      <div className="chip-row" style={{ marginBottom: 14 }}>
        {INQUIRY_STATUSES.map(s => (
          <span key={s} className={`chip${s === inquiry.status ? ' active' : ''}`} style={{ cursor: 'default', minHeight: 0, padding: '6px 13px', fontSize: 12.5 }}>{s}</span>
        ))}
      </div>
      {row('Name', <strong>{inquiry.name}</strong>)}
      {row('Phone / WhatsApp', inquiry.phone)}
      {inquiry.email && row('Email', inquiry.email)}
      {row('City', inquiry.city)}
      {row('Event', inquiry.eventType)}
      {row('Date', `${fmtDate(inquiry.date)} (${slotLabel})`)}
      {row('Guests', inquiry.guests.toLocaleString())}
      {row('Venue', venueName)}
      {row('Menu', packageName)}
      {row('Estimate', <span className="price">{pkr(inquiry.estimate)}</span>)}
      {row('Status', <Badge tone={inquiryTone(inquiry.status)}>{inquiry.status}</Badge>)}
      {inquiry.notes && row('Notes', <span style={{ maxWidth: 320 }}>{inquiry.notes}</span>)}
      <div style={{ marginTop: 20 }}>
        {state.whatsappNumber ? (
          <Btn
            href={waLink(state.whatsappNumber, buildInquiryMessage(inquiry, venueName, packageName))}
            target="_blank"
            variant="gold"
          >
            Open WhatsApp
          </Btn>
        ) : (
          <div className="alert alert-warn">
            No WhatsApp number configured. Set one in{' '}
            <Link to="/dashboard/settings">Settings</Link> to enable the handoff.
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ---------------- 6. Promotions ---------------- */

const PROMO_KINDS = [
  { id: 'weekday', label: 'Weekday' },
  { id: 'lunch', label: 'Lunch slot' },
  { id: 'min_guests', label: 'Minimum guests' },
  { id: 'date_range', label: 'Date range' },
] as const;

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function ruleSummary(p: Promotion): string {
  switch (p.kind) {
    case 'weekday': {
      const days = (p.weekdays ?? []).slice().sort((a, b) => a - b).map(d => DAY_NAMES[d]);
      return `Applies ${days.join(', ') || 'selected weekdays'}`;
    }
    case 'lunch':
      return `Applies to ${(p.slots ?? ['lunch']).map(s => SLOTS.find(x => x.id === s)?.label ?? s).join(', ')} slot`;
    case 'min_guests':
      return `Applies to bookings with ${p.minGuests ?? 0}+ guests`;
    case 'date_range':
      return `${p.from ? fmtDateShort(p.from) : '—'} to ${p.to ? fmtDateShort(p.to) : '—'}`;
  }
}

function blankPromo(): Promotion {
  return {
    id: `promo-${Date.now().toString(36)}`,
    name: '',
    description: '',
    kind: 'weekday',
    percent: 10,
    weekdays: [1, 2, 3, 4, 5],
    slots: ['lunch'],
    minGuests: 500,
    from: todayISO(),
    to: todayISO(),
    active: true,
  };
}

function PromoMgmt() {
  const { state, update, toast } = useStore();
  const [edit, setEdit] = React.useState<Promotion | null>(null);

  const save = () => {
    if (!edit) return;
    if (!edit.name.trim()) { toast('Promotion name is required.'); return; }
    const clean: Promotion = {
      ...edit,
      name: edit.name.trim(),
      description: edit.description.trim(),
      percent: Math.max(0, Math.min(50, Math.round(edit.percent))),
    };
    update(s => {
      const exists = s.promotions.some(p => p.id === clean.id);
      return {
        ...s,
        promotions: exists
          ? s.promotions.map(p => (p.id === clean.id ? clean : p))
          : [...s.promotions, clean],
      };
    });
    setEdit(null);
    toast('Promotion saved — eligibility is evaluated in the customer calculator.');
  };

  const toggle = (id: string, active: boolean) => {
    update(s => ({ ...s, promotions: s.promotions.map(p => (p.id === id ? { ...p, active } : p)) }));
    toast(active ? 'Promotion activated.' : 'Promotion paused.');
  };

  const toggleWeekday = (d: number) => {
    if (!edit) return;
    const cur = edit.weekdays ?? [];
    const next = cur.includes(d) ? cur.filter(x => x !== d) : [...cur, d];
    setEdit({ ...edit, weekdays: next });
  };

  return (
    <div>
      <SectionHead
        eyebrow="Owner dashboard"
        title="Promotions"
        lead="Sample discounts for weekdays, lunch slots, large bookings and date ranges."
        action={<Btn variant="gold" onClick={() => setEdit(blankPromo())}>New promotion</Btn>}
      />
      <div className="alert alert-info">Eligibility is evaluated in the customer calculator; total discounts cap at 15%.</div>

      <Stagger style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }} gap={0.07}>
        {state.promotions.map(p => (
          <StaggerItem key={p.id}>
            <div className="panel" style={{ padding: 22, height: '100%', opacity: p.active ? 1 : 0.78 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 700, color: 'var(--color-pine-600)', lineHeight: 1 }}>
                    {p.percent}<span style={{ fontSize: 22 }}>%</span>
                  </div>
                  <div style={{ ...FILTER_LABEL, marginBottom: 0, marginTop: 4 }}>discount</div>
                </div>
                {p.active ? <Badge tone="green">Active</Badge> : <Badge tone="grey">Paused</Badge>}
              </div>
              <h3 style={{ margin: '14px 0 4px', fontSize: 19 }}>{p.name}</h3>
              <p className="muted small" style={{ marginBottom: 8 }}>{p.description}</p>
              <div className="small muted">
                <span style={{ textTransform: 'capitalize' }}>{p.kind.replace('_', ' ')}</span> · {ruleSummary(p)}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16, alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed rgba(198,161,91,.35)', paddingTop: 14 }}>
                <label className="checkline">
                  <input type="checkbox" aria-label={`Active: ${p.name}`} checked={p.active} onChange={e => toggle(p.id, e.target.checked)} />
                  {p.active ? 'On' : 'Off'}
                </label>
                <Btn variant="outline" size="sm" onClick={() => setEdit({ ...p })}>Edit</Btn>
              </div>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
      {state.promotions.length === 0 && <Empty title="No promotions" body="Create your first promotion to fill quiet days." />}

      {edit && (
        <Modal title={state.promotions.some(p => p.id === edit.id) ? `Edit promotion — ${edit.name}` : 'New promotion'} onClose={() => setEdit(null)}>
          <Field label="Promotion name">
            <input className="input" value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} placeholder="e.g. Midweek Savers" />
          </Field>
          <Field label="Description">
            <textarea className="input" value={edit.description} onChange={e => setEdit({ ...edit, description: e.target.value })} placeholder="Shown to customers when the discount applies" />
          </Field>
          <div className="form-row c2">
            <Field label="Type">
              <select className="input" value={edit.kind} onChange={e => setEdit({ ...edit, kind: e.target.value as Promotion['kind'] })}>
                {PROMO_KINDS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
              </select>
            </Field>
            <Field label="Discount (%)">
              <input className="input" type="number" min={0} max={50} value={edit.percent} onChange={e => setEdit({ ...edit, percent: num(e.target.value) })} />
            </Field>
          </div>

          {edit.kind === 'weekday' && (
            <Field label="Applies on" hint="Select the qualifying days">
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {DAY_NAMES.map((d, idx) => (
                  <label key={d} className="checkline">
                    <input type="checkbox" checked={(edit.weekdays ?? []).includes(idx)} onChange={() => toggleWeekday(idx)} />
                    {d}
                  </label>
                ))}
              </div>
            </Field>
          )}
          {edit.kind === 'lunch' && (
            <Field label="Applies to slots" hint="Tick the qualifying time slots">
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {SLOTS.map(s => (
                  <label key={s.id} className="checkline">
                    <input
                      type="checkbox"
                      checked={(edit.slots ?? []).includes(s.id)}
                      onChange={() => {
                        const cur = edit.slots ?? [];
                        const next = cur.includes(s.id) ? cur.filter(x => x !== s.id) : [...cur, s.id];
                        setEdit({ ...edit, slots: next });
                      }}
                    />
                    {s.label}
                  </label>
                ))}
              </div>
            </Field>
          )}
          {edit.kind === 'min_guests' && (
            <Field label="Minimum guests">
              <input className="input" type="number" min={0} value={edit.minGuests ?? 0} onChange={e => setEdit({ ...edit, minGuests: num(e.target.value) })} />
            </Field>
          )}
          {edit.kind === 'date_range' && (
            <div className="form-row c2">
              <Field label="From">
                <MiniCalendar value={edit.from ?? ''} minDate="" onChange={iso => setEdit({ ...edit, from: iso })} ariaLabel="From" />
              </Field>
              <Field label="To">
                <MiniCalendar value={edit.to ?? ''} minDate="" onChange={iso => setEdit({ ...edit, to: iso })} ariaLabel="To" />
              </Field>
            </div>
          )}

          <Field label="Status">
            <label className="checkline" style={{ paddingTop: 6 }}>
              <input type="checkbox" checked={edit.active} onChange={e => setEdit({ ...edit, active: e.target.checked })} />
              Active
            </label>
          </Field>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
            <Btn variant="outline" onClick={() => setEdit(null)}>Cancel</Btn>
            <Btn onClick={save}>Save promotion</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- 7. Settings ---------------- */

function Settings() {
  const { state, update, resetDemo, toast } = useStore();
  const [wa, setWa] = React.useState(state.whatsappNumber);
  const [resetConfirm, setResetConfirm] = React.useState(false);
  const [restoreConfirm, setRestoreConfirm] = React.useState(false);

  const saveWa = () => {
    const digits = wa.replace(/\D/g, '');
    if (!digits) { toast('Enter a phone number with digits.'); return; }
    update(s => ({ ...s, whatsappNumber: digits }));
    toast('WhatsApp number saved.');
  };

  const restoreBookings = () => {
    update(s => ({ ...s, bookings: seedBookings() }));
    setRestoreConfirm(false);
    toast('Sample bookings restored.');
  };

  return (
    <div>
      <PageHead eyebrow="Owner dashboard" title="Settings" lead="Venue controls and data management." />

      <div className="panel" style={{ maxWidth: 640, marginBottom: 20 }}>
        <h3>WhatsApp number</h3>
        <p className="muted" style={{ marginBottom: 12 }}>
          Used for the "Open WhatsApp" handoff on inquiries. No real number is configured by default.
        </p>
        <Field label="Contact number (digits only)" hint="e.g. 03001234567">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              className="input"
              style={{ flex: '1 1 220px' }}
              value={wa}
              inputMode="numeric"
              placeholder="e.g. 03001234567"
              onChange={e => setWa(e.target.value.replace(/\D/g, ''))}
            />
            <Btn onClick={saveWa}>Save number</Btn>
          </div>
        </Field>
        {state.whatsappNumber && (
          <p className="small muted">Currently: <span className="price">{state.whatsappNumber}</span></p>
        )}
      </div>

      <div className="panel" style={{ maxWidth: 640, borderColor: 'rgba(200,60,40,.45)', background: 'linear-gradient(165deg, rgba(255,241,236,.92), rgba(255,255,255,.62))' }}>
        <h3 style={{ color: '#B3402E', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#C0392B', boxShadow: '0 0 0 5px rgba(192,57,43,.14)', flexShrink: 0 }} />
          Danger zone
        </h3>
        <p className="muted" style={{ marginBottom: 16 }}>
          Resetting restores the original sample spaces, menus, bookings, inquiries and promotions.
          Your configured WhatsApp number is preserved.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Btn variant="outline" onClick={() => setRestoreConfirm(true)}>Restore sample bookings</Btn>
          <Btn variant="danger" onClick={() => setResetConfirm(true)}>Reset sample data</Btn>
        </div>
      </div>

      {resetConfirm && (
        <Confirm
          title="Reset all sample data?"
          body="This restores spaces, menus, packages, bookings, inquiries and promotions to their original sample state. Any edits made in this dashboard will be lost. Your WhatsApp number is kept."
          confirmLabel="Reset sample data"
          onConfirm={() => { setResetConfirm(false); resetDemo(); }}
          onCancel={() => setResetConfirm(false)}
        />
      )}
      {restoreConfirm && (
        <Confirm
          title="Restore sample bookings?"
          body="This replaces all current bookings — including any you added — with the original sample set. Venue, menu and inquiry changes are kept."
          confirmLabel="Restore bookings"
          onConfirm={restoreBookings}
          onCancel={() => setRestoreConfirm(false)}
        />
      )}
    </div>
  );
}
