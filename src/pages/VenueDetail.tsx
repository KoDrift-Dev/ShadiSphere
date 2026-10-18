import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../state/store';
import { Btn, Badge, Img, Empty, Reveal, Stagger, StaggerItem } from '../components/ui';
import { SLOTS, SlotId } from '../data/types';
import { daySummary, SLOT_STATUS_META } from '../lib/availability';
import { fmtDate, fmtDateShort, isoPlus, pkr } from '../lib/format';

const SLOT_IDS: SlotId[] = ['lunch', 'afternoon', 'evening'];

export default function VenueDetail() {
  const { id } = useParams<{ id: string }>();
  const { state, setCalc } = useStore();
  const nav = useNavigate();
  const venue = state.venues.find(v => v.id === id);

  if (!venue) {
    return (
      <div className="wrap"><div className="section">
        <Empty title="Space not found" body="This event space may have been removed." action={<Btn to="/venues">← Back to our spaces</Btn>} />
      </div></div>
    );
  }

  const similar = state.venues
    .filter(v => v.id !== venue.id)
    .slice(0, 3);

  const nextDays = Array.from({ length: 14 }, (_, i) => isoPlus(i));

  return (
    <div>
      <style>{`@media (max-width: 900px){ .grid-3,.grid-2{grid-template-columns:1fr;} .gallery{grid-template-columns:1fr 1fr;} .gallery .main{grid-row:auto;min-height:220px;} }
@media (max-width: 600px){ .avail-strip{grid-template-columns:repeat(4,1fr)!important;} }`}</style>
      <div className="wrap">
        <div className="section-tight">
          <Link to="/venues" className="small" style={{ fontWeight: 600 }}>← All our spaces</Link>

          <Reveal>
          <div className="card overflow-hidden" style={{ marginTop: 14 }}>
            <div style={{ position: 'relative' }}>
              <Img src={venue.image} alt={venue.name} style={{ width: '100%', height: 380, objectFit: 'cover', display: 'block' }} />
              <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,31,25,.85) 0%, rgba(11,31,25,.28) 48%, transparent 72%)' }} />
              <div style={{ position: 'absolute', left: 24, bottom: 20, right: 24 }}>
                <div className="chip-row" style={{ marginBottom: 10 }}>
                  <Badge tone="green">{venue.type}</Badge>
                  <Badge tone="gold">{venue.config}</Badge>
                  {venue.featured && <Badge tone="gold">Featured</Badge>}
                </div>
                <h1 style={{ color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,.5)', margin: 0, fontSize: 'clamp(30px,4vw,46px)' }}>{venue.name}</h1>
                <p style={{ color: 'rgba(255,255,255,.9)', margin: '6px 0 14px', fontWeight: 500 }}>{venue.area}, Lahore</p>
                <div className="flex flex-wrap gap-2.5">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[13px] font-semibold text-white shadow-lg backdrop-blur-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-champagne-400" aria-hidden="true" />
                    {venue.minGuests.toLocaleString()} – {venue.maxGuests.toLocaleString()} guests
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-champagne-400/50 bg-champagne-400/20 px-4 py-2 text-[13px] font-semibold text-champagne-100 shadow-lg backdrop-blur-md">
                    Hall from {pkr(Math.min(venue.hallRental.lunch, venue.hallRental.afternoon, venue.hallRental.evening))}
                  </span>
                </div>
              </div>
            </div>
          </div>
          </Reveal>

          <div className="grid grid-2" style={{ marginTop: 26, alignItems: 'start' }}>
            <div>
              <Reveal>
              <div className="panel">
                <span className="eyebrow" style={{ marginBottom: 10 }}><span className="rule" />The space</span>
                <h3>Overview</h3>
                <p>{venue.description}</p>
                <div className="divider" />
                <h3>Capacity & seating</h3>
                <p className="font-display" style={{ fontSize: 20 }}><strong>{venue.minGuests.toLocaleString()} – {venue.maxGuests.toLocaleString()} guests</strong></p>
                <p className="small muted">Seating is arranged per event type and confirmed with our team after your inquiry. Halls outside this range are flagged in the cost calculator.</p>
                <div className="divider" />
                <h3>Amenities</h3>
                <div className="chip-row">
                  {venue.amenities.map(a => <span key={a} className="chip" style={{ cursor: 'default' }}>{a}</span>)}
                </div>
                <div className="divider" />
                <h3>Event types hosted</h3>
                <div className="chip-row">
                  {venue.eventTypes.map(t => <Badge key={t} tone="green">{t}</Badge>)}
                </div>
              </div>
              </Reveal>

              <Reveal>
              <div className="panel" style={{ marginTop: 20 }}>
                <span className="eyebrow" style={{ marginBottom: 10 }}><span className="rule" />Gallery</span>
                <h3 style={{ marginTop: 0 }}>A look inside</h3>
                <div className="gallery">
                  {venue.gallery.map((g, i) => (
                    <Img key={g + i} src={g} alt={`${venue.name} — photo ${i + 1}`} className={i === 0 ? 'main' : ''} style={{ width: '100%' }} />
                  ))}
                </div>
              </div>
              </Reveal>
            </div>

            <div>
              <div className="panel relative overflow-hidden lg:sticky lg:top-24">
                <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-champagne-300/25 blur-3xl" />
                <div className="relative mb-5 rounded-2xl border border-champagne-500/30 bg-gradient-to-br from-champagne-100 to-cream-50 px-5 py-4">
                  <span className="eyebrow" style={{ marginBottom: 2 }}><span className="rule" />Hall rental</span>
                  <p className="font-display text-[26px] font-bold text-pine-900" style={{ margin: 0 }}>from {pkr(Math.min(venue.hallRental.lunch, venue.hallRental.afternoon, venue.hallRental.evening))}</p>
                  <p className="small muted" style={{ margin: 0 }}>per slot · illustrative demo rates</p>
                </div>
                <h3>Indicative hall rental</h3>
                <p className="small muted">Illustrative demo rates per slot. Actual quotes depend on date, season and inclusions.</p>
                <div className="table-wrap"><table className="tbl">
                  <thead><tr><th>Slot</th><th>Time</th><th style={{ textAlign: 'right' }}>Rental</th></tr></thead>
                  <tbody>
                    {SLOTS.map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600 }}>{s.label}</td>
                        <td className="small muted">{s.time}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-pine-600)' }}>{pkr(venue.hallRental[s.id])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
                  <Btn onClick={() => { setCalc(c => ({ ...c, venueId: venue.id, city: 'Lahore' })); nav('/calculator'); }} block>Calculate Cost for This Hall</Btn>
                  <Btn to="/calendar" variant="outline" block>Check Availability</Btn>
                  <Btn to="/quote" variant="outline" block>Request a Quote</Btn>
                </div>
              </div>

              <Reveal>
              <div className="panel" style={{ marginTop: 20 }}>
                <span className="eyebrow" style={{ marginBottom: 10 }}><span className="rule" />Live preview</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: 0 }}>Availability preview</h3>
                  <Link to="/calendar" className="small" style={{ fontWeight: 600 }}>Open full calendar →</Link>
                </div>
                <p className="small muted">Demo availability — not a live reservation system.</p>
                <div className="grid avail-strip" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                  {nextDays.map(d => {
                    const sum = daySummary(venue.id, d, SLOT_IDS, state.bookings);
                    return (
                      <div key={d} className="card" style={{ padding: 8, textAlign: 'center' }} title={fmtDate(d)}>
                        <div className="dot-label" style={{ marginTop: 0 }}>{fmtDateShort(d)}</div>
                        <div className="dots" style={{ justifyContent: 'center' }}>
                          {SLOT_IDS.map(s => (
                            <span
                              key={s}
                              className={`dot ${sum[s] === 'inquiry' ? 'tentative' : sum[s] === 'past' ? 'blocked' : sum[s]}`}
                              title={`${SLOTS.find(x => x.id === s)?.label}: ${SLOT_STATUS_META[sum[s]].label}`}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="chip-row" style={{ marginTop: 12 }}>
                  <span className="small"><span className="dot available" style={{ display: 'inline-block', marginRight: 6 }} />Available</span>
                  <span className="small"><span className="dot tentative" style={{ display: 'inline-block', marginRight: 6 }} />On hold</span>
                  <span className="small"><span className="dot booked" style={{ display: 'inline-block', marginRight: 6 }} />Booked (demo)</span>
                  <span className="small"><span className="dot blocked" style={{ display: 'inline-block', marginRight: 6 }} />Unavailable</span>
                </div>
              </div>
              </Reveal>
            </div>
          </div>

          {similar.length > 0 && (
            <div style={{ marginTop: 40 }}>
              <Reveal>
                <div className="flex items-baseline gap-3" style={{ marginBottom: 18 }}>
                  <h2 className="font-display" style={{ margin: 0 }}>Our other spaces</h2>
                  <div aria-hidden="true" className="h-[2px] w-16 rounded-full bg-gradient-to-r from-champagne-400 to-transparent" />
                </div>
              </Reveal>
              <Stagger className="grid grid-3" gap={0.1}>
                {similar.map(v => (
                  <StaggerItem key={v.id} className="h-full">
                  <article className="card h-full transition-transform duration-300 hover:-translate-y-1.5">
                    <div className="card-img"><Img src={v.image} alt={v.name} /></div>
                    <div className="card-body">
                      <Badge tone="green">{v.type}</Badge>
                      <h3 className="card-title" style={{ marginTop: 8 }}>{v.name}</h3>
                      <p className="card-meta">{v.area}, Lahore · up to {v.maxGuests.toLocaleString()} guests</p>
                      <Btn to={`/venues/${v.id}`} variant="outline" block>View Details</Btn>
                    </div>
                  </article>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
