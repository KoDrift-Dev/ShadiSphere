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
    <div className="venue-detail-page">
      <style>{`
        /* Hero banner */
        .venue-hero-card {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          background: #0B1F19;
          border: 1px solid rgba(198, 161, 91, 0.3);
          box-shadow: 0 12px 36px rgba(11, 31, 25, 0.14);
        }
        .venue-hero-media {
          position: relative;
          width: 100%;
          height: 440px;
          overflow: hidden;
        }
        .venue-hero-img {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          display: block;
        }
        .venue-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(11, 31, 25, 0.1) 0%, rgba(11, 31, 25, 0.35) 45%, rgba(11, 31, 25, 0.92) 100%);
          pointer-events: none;
        }
        .venue-hero-content {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 24px 28px;
          z-index: 10;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }
        .venue-hero-title {
          color: #FFFFFF !important;
          text-shadow: 0 2px 14px rgba(0, 0, 0, 0.7);
          font-family: var(--font-display);
          font-weight: 700;
          font-size: clamp(24px, 4.5vw, 42px);
          line-height: 1.15;
          margin: 6px 0 4px;
        }
        .venue-hero-location {
          color: rgba(255, 255, 255, 0.92) !important;
          font-weight: 500;
          font-size: 14.5px;
          text-shadow: 0 1px 8px rgba(0, 0, 0, 0.6);
          margin: 0 0 12px;
        }
        .venue-hero-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .venue-stat-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 600;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .venue-stat-pill.white {
          background: rgba(255, 255, 255, 0.18);
          border: 1px solid rgba(255, 255, 255, 0.35);
          color: #FFFFFF;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
        }
        .venue-stat-pill.gold {
          background: rgba(198, 161, 91, 0.28);
          border: 1px solid rgba(232, 200, 115, 0.6);
          color: #FBF3DF;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
        }

        /* 2-column layout */
        .venue-grid {
          display: grid;
          grid-template-columns: 1.25fr 1fr;
          gap: 24px;
          margin-top: 24px;
          align-items: start;
        }

        /* Rental Table: fully responsive on all screens */
        .rental-tbl {
          width: 100% !important;
          min-width: 0 !important;
          border-collapse: collapse;
        }
        .rental-tbl th, .rental-tbl td {
          padding: 10px 10px;
        }

        /* Gallery */
        .venue-gallery {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 10px;
        }
        .venue-gallery img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 14px;
          min-height: 160px;
        }
        .venue-gallery .main {
          grid-row: span 2;
          min-height: 330px;
        }

        /* Availability grid */
        .venue-avail-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
        }

        /* Similar spaces grid */
        .similar-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        @media (max-width: 900px) {
          .venue-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .similar-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
        }

        @media (max-width: 768px) {
          .venue-hero-media { height: 360px; }
          .venue-hero-content { padding: 18px 20px; }
          .venue-gallery {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
          .venue-gallery .main {
            grid-column: span 2;
            grid-row: auto;
            min-height: 190px;
            height: 200px;
          }
          .venue-gallery img {
            height: 110px;
            min-height: unset;
          }
          .venue-avail-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 6px;
          }
        }

        @media (max-width: 580px) {
          .similar-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .venue-hero-media { height: 310px; }
          .venue-hero-content { padding: 14px 14px; }
          .venue-hero-title { font-size: 22px; margin: 4px 0 2px; }
          .venue-hero-location { font-size: 13px; margin-bottom: 8px; }
          .venue-stat-pill { font-size: 11.5px; padding: 4px 10px; gap: 5px; }
          .rental-tbl th, .rental-tbl td {
            padding: 8px 6px;
            font-size: 12.5px;
          }
        }

        @media (max-width: 380px) {
          .venue-hero-media { height: 280px; }
          .venue-hero-title { font-size: 20px; }
          .venue-avail-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 5px;
          }
        }
      `}</style>
      <div className="wrap">
        <div className="section-tight" style={{ paddingTop: 16 }}>
          <Link to="/venues" className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-pine-700 hover:text-pine-800 transition-colors py-1">
            ← All our spaces
          </Link>

          <Reveal>
            <div className="venue-hero-card" style={{ marginTop: 12 }}>
              <div className="venue-hero-media">
                <Img src={venue.image} alt={venue.name} className="venue-hero-img" />
                <div aria-hidden="true" className="venue-hero-overlay" />
                <div className="venue-hero-content">
                  <div className="chip-row" style={{ marginBottom: 8, gap: 6 }}>
                    <Badge tone="green">{venue.type}</Badge>
                    <Badge tone="gold">{venue.config}</Badge>
                    {venue.featured && <Badge tone="gold">Featured</Badge>}
                  </div>
                  <h1 className="venue-hero-title">{venue.name}</h1>
                  <p className="venue-hero-location">{venue.area}, Lahore</p>
                  <div className="venue-hero-stats">
                    <span className="venue-stat-pill white">
                      <span className="h-2 w-2 rounded-full bg-champagne-400" aria-hidden="true" />
                      {venue.minGuests.toLocaleString()} – {venue.maxGuests.toLocaleString()} guests
                    </span>
                    <span className="venue-stat-pill gold">
                      Hall from {pkr(Math.min(venue.hallRental.lunch, venue.hallRental.afternoon, venue.hallRental.evening))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <div className="venue-grid">
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
                <div className="venue-gallery">
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
                  <p className="small muted" style={{ margin: 0 }}>per slot · illustrative sample rates</p>
                </div>
                <h3>Indicative hall rental</h3>
                <p className="small muted">Illustrative sample rates per slot. Actual quotes depend on date, season and inclusions.</p>
                <div className="table-wrap" style={{ minWidth: 0, overflowX: 'auto' }}>
                  <table className="tbl rental-tbl" style={{ minWidth: 0, width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '8px 10px' }}>Slot</th>
                        <th style={{ padding: '8px 10px' }}>Time</th>
                        <th style={{ textAlign: 'right', padding: '8px 10px' }}>Rental</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SLOTS.map(s => (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 600, padding: '8px 10px' }}>{s.label}</td>
                          <td className="small muted" style={{ padding: '8px 10px' }}>{s.time}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-pine-600)', padding: '8px 10px', whiteSpace: 'nowrap' }}>{pkr(venue.hallRental[s.id])}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
                  <Btn onClick={() => { setCalc(c => ({ ...c, venueId: venue.id, city: 'Lahore' })); nav('/calculator'); }} block>Calculate Cost for This Hall</Btn>
                  <Btn to="/calendar" variant="outline" block>Check Availability</Btn>
                  <Btn to="/quote" variant="outline" block>Request a Quote</Btn>
                </div>
              </div>

              <Reveal>
              <div className="panel" style={{ marginTop: 20 }}>
                <span className="eyebrow" style={{ marginBottom: 10 }}><span className="rule" />Live preview</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  <h3 style={{ margin: 0 }}>Availability preview</h3>
                  <Link to="/calendar" className="small" style={{ fontWeight: 600 }}>Open full calendar →</Link>
                </div>
                <p className="small muted">Availability shown is illustrative — not a live reservation system.</p>
                <div className="venue-avail-grid">
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
                  <span className="small"><span className="dot booked" style={{ display: 'inline-block', marginRight: 6 }} />Booked</span>
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
              <Stagger className="similar-grid" gap={0.1}>
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
