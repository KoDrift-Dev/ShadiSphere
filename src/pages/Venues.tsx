import React, { useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { Btn, Badge, Img, Empty, PageHead, Field, Reveal, Stagger, StaggerItem } from '../components/ui';
import { BUSINESS, VenueConfig, VenueType } from '../data/types';
import { pkr } from '../lib/format';

type SortKey = 'recommended' | 'capacity' | 'price';

const TYPES: VenueType[] = ['Banquet Hall', 'Lawn'];
const CONFIGS: VenueConfig[] = ['Indoor', 'Outdoor', 'Indoor + Outdoor'];

const minRental = (v: { hallRental: Record<string, number> }) =>
  Math.min(v.hallRental.lunch, v.hallRental.afternoon, v.hallRental.evening);

export default function Venues() {
  const { state } = useStore();
  const [type, setType] = useState('All');
  const [config, setConfig] = useState('All');
  const [amenity, setAmenity] = useState('All');
  const [guests, setGuests] = useState('');
  const [budget, setBudget] = useState('');
  const [sort, setSort] = useState<SortKey>('recommended');

  const amenities = useMemo(() => {
    const s = new Set<string>();
    state.venues.forEach(v => v.amenities.forEach(a => s.add(a)));
    return [...s].sort();
  }, [state.venues]);

  const results = useMemo(() => {
    const g = Number(guests);
    const b = Number(budget);
    let list = state.venues.filter(v => {
      if (type !== 'All' && v.type !== type) return false;
      if (config !== 'All' && v.config !== config) return false;
      if (amenity !== 'All' && !v.amenities.includes(amenity)) return false;
      if (guests && (g < 50 || v.minGuests > g || v.maxGuests < g)) return false;
      if (budget && b > 0 && minRental(v) > b) return false;
      return true;
    });
    list = [...list].sort((a, b2) => {
      if (sort === 'capacity') return b2.maxGuests - a.maxGuests;
      if (sort === 'price') return minRental(a) - minRental(b2);
      return Number(b2.featured) - Number(a.featured) || a.name.localeCompare(b2.name);
    });
    return list;
  }, [state.venues, type, config, amenity, guests, budget, sort]);

  const clear = () => { setType('All'); setConfig('All'); setAmenity('All'); setGuests(''); setBudget(''); setSort('recommended'); };
  const hasFilters = type !== 'All' || config !== 'All' || amenity !== 'All' || guests !== '' || budget !== '';

  return (
    <div>
      <style>{`@media (max-width: 900px){ .grid-3{grid-template-columns:1fr 1fr;} .filter-bar{grid-template-columns:1fr 1fr;} }
@media (max-width: 600px){ .grid-3{grid-template-columns:1fr;} .filter-bar{grid-template-columns:1fr;} }`}</style>
      <div className="wrap">
        <div className="section-tight">
          <Reveal>
            <PageHead
              eyebrow="Our venue"
              title="Explore our event spaces"
              lead={`${BUSINESS.name}, ${BUSINESS.area}, Lahore — ${state.venues.length} spaces for every kind of function. All prices are illustrative demo rates.`}
            />
          </Reveal>

          <Reveal delay={0.05}>
          <div className="panel relative overflow-hidden" style={{ marginBottom: 26 }}>
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-champagne-300/25 blur-3xl" />
            <span className="eyebrow relative" style={{ marginBottom: 14 }}><span className="rule" />Refine your search</span>
            <div className="grid filter-bar relative" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              <Field label="Space type">
                <select className="input" value={type} onChange={e => setType(e.target.value)}>
                  <option>All</option>{TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Indoor / outdoor">
                <select className="input" value={config} onChange={e => setConfig(e.target.value)}>
                  <option>All</option>{CONFIGS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Amenity">
                <select className="input" value={amenity} onChange={e => setAmenity(e.target.value)}>
                  <option>All</option>{amenities.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </Field>
              <Field label="Guest count" hint="Venue must fit this many guests">
                <input type="number" className="input" placeholder="e.g. 500" value={guests} min={50} max={3000} onChange={e => setGuests(e.target.value)} />
              </Field>
              <Field label="Max hall rental (Rs)" hint="Evening slot rental ≤ budget">
                <input type="number" className="input" placeholder="e.g. 200000" value={budget} min={0} onChange={e => setBudget(e.target.value)} />
              </Field>
              <Field label="Sort by">
                <select className="input" value={sort} onChange={e => setSort(e.target.value as SortKey)}>
                  <option value="recommended">Recommended</option>
                  <option value="capacity">Capacity (high to low)</option>
                  <option value="price">Hall rental (low to high)</option>
                </select>
              </Field>
              <div className="field">
                <label>&nbsp;</label>
                <Btn variant="outline" onClick={clear} disabled={!hasFilters}>Clear filters</Btn>
              </div>
            </div>
          </div>
          </Reveal>

          <div className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1" aria-live="polite">
            <h2 className="font-display text-[26px] font-bold text-pine-900" style={{ margin: 0 }}>
              {results.length} <span className="text-champagne-500">{results.length === 1 ? 'space' : 'spaces'}</span>
            </h2>
            <span className="text-sm text-ink-400">at {BUSINESS.name}</span>
          </div>

          {results.length === 0 ? (
            <Reveal>
            <Empty
              title="No spaces match your filters"
              body="Try adjusting the guest count or raising the budget."
              action={<Btn onClick={clear}>Clear all filters</Btn>}
            />
            </Reveal>
          ) : (
            <Stagger className="grid grid-3" gap={0.1}>
              {results.map(v => (
                <StaggerItem key={v.id} className="h-full">
                <article className="card pkg-card h-full transition-transform duration-300 hover:-translate-y-1.5">
                  {v.featured && <span className="badge badge-gold pkg-flag">Featured</span>}
                  <div className="card-img">
                    <Img src={v.image} alt={v.name} />
                  </div>
                  <div className="card-body">
                    <div className="chip-row" style={{ marginBottom: 10 }}>
                      <Badge tone="green">{v.type}</Badge>
                      <Badge>{v.config}</Badge>
                    </div>
                    <h3 className="card-title">{v.name}</h3>
                    <p className="card-meta">{BUSINESS.name} · {v.area}, Lahore</p>
                    <div className="chip-row" style={{ marginBottom: 12 }}>
                      <span className="chip font-display" style={{ cursor: 'default', fontWeight: 700, color: 'var(--color-pine-700)' }}>{v.minGuests.toLocaleString()} – {v.maxGuests.toLocaleString()} guests</span>
                    </div>
                    <p className="font-display" style={{ fontWeight: 700, fontSize: 20, color: 'var(--color-pine-600)', marginBottom: 14 }}>
                      Hall from {pkr(minRental(v))}
                    </p>
                    <div className="chip-row" style={{ marginBottom: 16 }}>
                      {v.amenities.slice(0, 3).map(a => <span key={a} className="chip" style={{ cursor: 'default' }}>{a}</span>)}
                    </div>
                    <Btn to={`/venues/${v.id}`} variant="outline" block>View Details</Btn>
                  </div>
                </article>
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </div>
      </div>
    </div>
  );
}
