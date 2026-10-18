import React from 'react';
import { useStore } from '../state/store';
import { Btn, Badge, Img, PageHead, SectionHead } from '../components/ui';
import { MenuCategory } from '../data/types';
import { pkr, unitLabel } from '../lib/format';

const CATEGORIES: MenuCategory[] = [
  'Main Dishes', 'BBQ & Starters', 'Sides', 'Desserts',
  'Beverages', 'Live Stations', 'Decoration & Services',
];

export default function Menus() {
  const { state } = useStore();
  const itemById = new Map(state.menuItems.map(i => [i.id, i]));
  const activePackages = state.packages.filter(p => p.enabled);
  const catalog = state.menuItems.filter(i => i.enabled);

  return (
    <div>
      <style>{`@media (max-width: 900px){ .grid-3{grid-template-columns:1fr 1fr;} .grid-4{grid-template-columns:1fr 1fr;} }
@media (max-width: 600px){ .grid-3,.grid-4{grid-template-columns:1fr;} }`}</style>
      <div className="wrap">
        <div className="section-tight">
          <PageHead
            eyebrow="Food & menus"
            title="Wedding menu packages"
            lead="Five curated collections, plus a full à-la-carte catalog. Prices are illustrative demo values, configurable per venue."
          />

          <div className="grid grid-3" style={{ marginBottom: 56 }}>
            {activePackages.map(p => {
              const names = p.included.map(id => itemById.get(id)?.name).filter(Boolean) as string[];
              return (
                <article className="card pkg-card" key={p.id}>
                  {p.badge && <span className="badge badge-gold pkg-flag">{p.badge}</span>}
                  <div className="card-img"><Img src={p.image} alt={`${p.name} menu package`} /></div>
                  <div className="card-body">
                    <h3 className="card-title">{p.name}</h3>
                    <p className="card-meta">{p.tagline}</p>
                    <p className="price-lg price" style={{ fontSize: 24, fontWeight: 800, color: 'var(--emerald)' }}>
                      {pkr(p.pricePerGuest)} <span className="small muted">per guest</span>
                    </p>
                    <p className="small">{p.description}</p>
                    <p className="small muted" style={{ marginBottom: 4 }}>
                      <strong style={{ color: 'var(--charcoal)' }}>{p.included.length} dishes included:</strong>
                    </p>
                    <p className="small muted" style={{ marginBottom: 16 }}>
                      {names.slice(0, 5).join(' · ')}{names.length > 5 ? ` · +${names.length - 5} more` : ''}
                    </p>
                    <Btn to="/calculator" variant="outline" block>Customize in Calculator</Btn>
                  </div>
                </article>
              );
            })}
          </div>

          <SectionHead
            eyebrow="À-la-carte catalog"
            title="Dishes, beverages & services"
            lead={`${catalog.length} sample items. Each item shows its pricing unit — per guest, per serving, per bottle, per item or a flat event charge.`}
          />

          {CATEGORIES.map(cat => {
            const items = catalog.filter(i => i.category === cat);
            if (items.length === 0) return null;
            return (
              <section key={cat} style={{ marginBottom: 40 }}>
                <h3 style={{ marginBottom: 16 }}>{cat} <span className="small muted">({items.length})</span></h3>
                <div className="grid grid-4">
                  {items.map(it => (
                    <article className="card" key={it.id}>
                      <div className="card-img" style={{ aspectRatio: '16/9' }}><Img src={it.image} alt={it.name} /></div>
                      <div className="card-body" style={{ padding: '14px 16px 16px' }}>
                        <div className="chip-row" style={{ marginBottom: 8 }}>
                          {it.addOnOnly && <Badge tone="amber">Add-on only</Badge>}
                        </div>
                        <h4 style={{ fontSize: 16, marginBottom: 4 }}>{it.name}</h4>
                        <p className="small muted" style={{ marginBottom: 10 }}>{it.description}</p>
                        <p style={{ fontWeight: 700, color: 'var(--emerald)', margin: 0 }}>
                          {pkr(it.price)} <span className="small muted">{unitLabel(it.unit)}</span>
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}

          <div className="alert alert-info" style={{ marginTop: 24 }}>
            Illustrative demo rates — not verified quotations. Actual rates depend on the venue, menu,
            guest count, date and service inclusions. Venue managers can edit every price in the owner dashboard.
          </div>
        </div>
      </div>
    </div>
  );
}
