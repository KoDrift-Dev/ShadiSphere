import React, { useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { Btn, Badge, Img, Empty, PageHead, Field } from '../components/ui';
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
          <PageHead
            eyebrow="Our venue"
            title="Explore our event spaces"
            lead={`${BUSINESS.name}, ${BUSINESS.area}, Lahore — ${state.venues.length} spaces for every kind of function. All prices are illustrative demo rates.`}
          />

          <div className="panel" style={{ marginBottom: 26 }}>
            <div className="grid filter-bar" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
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
                <Btn variant="ghost" onClick={clear} disabled={!hasFilters}>Clear filters</Btn>
              </div>
            </div>
          </div>

          <p className="small muted" style={{ marginBottom: 18 }} aria-live="polite">
            {results.length} {results.length === 1 ? 'space' : 'spaces'} found
          </p>

          {results.length === 0 ? (
            <Empty
              title="No spaces match your filters"
              body="Try adjusting the guest count or raising the budget."
              action={<Btn onClick={clear}>Clear all filters</Btn>}
            />
          ) : (
            <div className="grid grid-3">
              {results.map(v => (
                <article className="card" key={v.id}>
                  <div className="card-img">
                    <Img src={v.image} alt={v.name} />
                  </div>
                  <div className="card-body">
                    <div className="chip-row" style={{ marginBottom: 10 }}>
                      <Badge tone="green">{v.type}</Badge>
                      {v.featured && <Badge tone="gold">Featured</Badge>}
                      <Badge>{v.config}</Badge>
                    </div>
                    <h3 className="card-title">{v.name}</h3>
                    <p className="card-meta">{BUSINESS.name} · {v.area}, Lahore</p>
                    <p className="card-meta">{v.minGuests.toLocaleString()} – {v.maxGuests.toLocaleString()} guests</p>
                    <p style={{ fontWeight: 700, color: 'var(--emerald)', marginBottom: 14 }}>
                      Hall from {pkr(minRental(v))}
                    </p>
                    <div className="chip-row" style={{ marginBottom: 16 }}>
                      {v.amenities.slice(0, 3).map(a => <span key={a} className="chip" style={{ cursor: 'default' }}>{a}</span>)}
                    </div>
                    <Btn to={`/venues/${v.id}`} variant="outline" block>View Details</Btn>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
