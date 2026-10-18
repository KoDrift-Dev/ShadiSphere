import React from 'react';
import { useStore } from '../state/store';
import { Btn, Badge, Img, PageHead, SectionHead, Reveal, Stagger, StaggerItem } from '../components/ui';
import { MenuCategory } from '../data/types';
import { pkr, unitLabel } from '../lib/format';

const CATEGORIES: MenuCategory[] = [
  'Main Dishes', 'BBQ & Starters', 'Sides', 'Desserts',
  'Beverages', 'Live Stations', 'Decoration & Services',
];

const catAnchor = (c: MenuCategory) => `cat-${c.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

export default function Menus() {
  const { state } = useStore();
  const itemById = new Map(state.menuItems.map(i => [i.id, i]));
  const activePackages = state.packages.filter(p => p.enabled);
  const catalog = state.menuItems.filter(i => i.enabled);

  return (
    <div>
      <div className="wrap">
        <div className="section-tight">
          <Reveal>
            <PageHead
              eyebrow="Food & menus"
              title="Wedding menu packages"
              lead="Five curated collections, plus a full à-la-carte catalog. Prices are illustrative sample values, configurable per venue."
            />
          </Reveal>

          <Stagger className="grid grid-3" style={{ marginBottom: 56 }} gap={0.1}>
            {activePackages.map(p => {
              const names = p.included.map(id => itemById.get(id)?.name).filter(Boolean) as string[];
              return (
                <StaggerItem key={p.id}>
                  <article className="card pkg-card h-full">
                    {p.badge && (
                      <span className="badge badge-gold pkg-flag">
                        <span className="w-1.5 h-1.5 rounded-full bg-champagne-600 inline-block" />
                        {p.badge}
                      </span>
                    )}
                    <div className="card-img"><Img src={p.image} alt={`${p.name} menu package`} /></div>
                    <div className="card-body">
                      <h3 className="card-title">{p.name}</h3>
                      <p className="card-meta">{p.tagline}</p>
                      <p className="price-lg price text-pine-600" style={{ fontSize: 26 }}>
                        {pkr(p.pricePerGuest)}{' '}
                        <span className="small muted font-sans font-normal">per guest</span>
                      </p>
                      <p className="small text-ink-600">{p.description}</p>
                      <p className="small mb-2">
                        <strong className="text-pine-700">{p.included.length} dishes included</strong>
                      </p>
                      <ul className="why-list small mb-4">
                        {names.slice(0, 5).map(n => <li key={n}>{n}</li>)}
                        {names.length > 5 && (
                          <li className="muted">+{names.length - 5} more dishes</li>
                        )}
                      </ul>
                      <Btn to="/calculator" variant="outline" block>Customize in Calculator</Btn>
                    </div>
                  </article>
                </StaggerItem>
              );
            })}
          </Stagger>

          <Reveal>
            <SectionHead
              eyebrow="À-la-carte catalog"
              title="Dishes, beverages & services"
              lead={`${catalog.length} sample items. Each item shows its pricing unit — per guest, per serving, per bottle, per item or a flat event charge.`}
            />
          </Reveal>

          {/* category quick-nav as clay chips (anchor links — no state, no logic change) */}
          <Reveal>
            <nav className="chip-row mb-10" aria-label="Menu categories">
              {CATEGORIES.map(cat => {
                const n = catalog.filter(i => i.category === cat).length;
                if (n === 0) return null;
                return (
                  <button key={cat} type="button" onClick={() => document.getElementById(catAnchor(cat))?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })} className="chip" style={{ display: 'inline-flex', alignItems: 'center' }}>
                    {cat}
                    <span className="badge badge-gold ml-1" style={{ fontSize: 11, padding: '2px 8px' }}>{n}</span>
                  </button>
                );
              })}
            </nav>
          </Reveal>

          {CATEGORIES.map(cat => {
            const items = catalog.filter(i => i.category === cat);
            if (items.length === 0) return null;
            return (
              <section key={cat} id={catAnchor(cat)} style={{ marginBottom: 44, scrollMarginTop: 100 }}>
                <Reveal>
                  <div className="flex items-center gap-4 mb-5">
                    <h3 className="m-0">{cat}</h3>
                    <span className="brandline mb-0" />
                    <span className="small muted">{items.length} items</span>
                  </div>
                </Reveal>
                <Stagger className="grid grid-4" gap={0.06}>
                  {items.map(it => (
                    <StaggerItem key={it.id}>
                      <article className="card h-full">
                        <div className="card-img" style={{ aspectRatio: '16/9' }}><Img src={it.image} alt={it.name} /></div>
                        <div className="card-body" style={{ padding: '14px 18px 18px' }}>
                          {it.addOnOnly && (
                            <div className="chip-row" style={{ marginBottom: 8 }}>
                              <Badge tone="amber">Add-on only</Badge>
                            </div>
                          )}
                          {/* elegant dotted leader: name …… price */}
                          <div className="flex items-baseline gap-2">
                            <h4 className="m-0 text-[16px] font-display">{it.name}</h4>
                            <span aria-hidden="true" className="flex-1 border-b-2 border-dotted border-champagne-400/70 -translate-y-1" />
                            <span className="price text-pine-700 text-[15px] whitespace-nowrap">{pkr(it.price)}</span>
                          </div>
                          <p className="small muted mt-2 mb-1">{it.description}</p>
                          <p className="small text-champagne-700 font-semibold m-0">{unitLabel(it.unit)}</p>
                        </div>
                      </article>
                    </StaggerItem>
                  ))}
                </Stagger>
              </section>
            );
          })}

          <Reveal>
            <div className="alert alert-info" style={{ marginTop: 24 }}>
              Illustrative sample rates — not verified quotations. Actual rates depend on the venue, menu,
              guest count, date and service inclusions. Venue managers can edit every price in the owner dashboard.
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
