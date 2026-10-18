// ShadiSphere package comparison — packages side by side in one table,
// with guest count, event space, slot and extras adjustable on this screen.
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../state/store';
import {
  Btn, Badge, Field, PageHead, Img, Reveal,
  Select} from '../components/ui';
import { pkr, unitLabel } from '../lib/format';
import { BUSINESS, SLOTS, MenuItem } from '../data/types';

const PKG_ORDER = ['basic', 'standard', 'premium', 'vip', 'luxury'];
const MIN_G = 50;
const MAX_G = 3000;

interface Col {
  key: string;
  name: string;
  tagline: string;
  image?: string;
  perGuest: number | null;
  dishes: string;
  total: number;
  selected: boolean;
  packageId?: string;
}

export default function Compare() {
  const { state, calc, setCalc, toast } = useStore();
  const nav = useNavigate();
  const guests = Math.max(0, Math.floor(calc.guests || 0));
  const venue = calc.venueId ? state.venues.find(v => v.id === calc.venueId) : undefined;
  const hall = venue ? (venue.hallRental[calc.slot] ?? 0) : 0;

  const addedMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of calc.added) m.set(a.itemId, a.qty);
    return m;
  }, [calc.added]);
  const setAdded = (itemId: string, qty: number) => {
    setCalc(c => {
      const rest = c.added.filter(a => a.itemId !== itemId);
      return qty > 0 ? { ...c, added: [...rest, { itemId, qty }] } : { ...c, added: rest };
    });
  };

  const itemById = (id: string) => state.menuItems.find(i => i.id === id);
  const addonPrice = (it: MenuItem, qty: number) =>
    it.unit === 'flat' ? it.price * qty
      : it.unit === 'per_guest' && guests ? it.price * guests * qty
        : it.price * qty;

  const extrasTotal = calc.added.reduce((s, a) => {
    const it = itemById(a.itemId);
    if (!it || !it.addOnOnly || a.qty <= 0) return s;
    return s + addonPrice(it, a.qty);
  }, 0);
  const extrasCount = calc.added.filter(a => {
    const it = itemById(a.itemId);
    return it && it.addOnOnly && a.qty > 0;
  }).length;
  // Custom mains the user picked (charged per guest in every column unless included).
  const addedMains = calc.added
    .map(a => ({ a, it: itemById(a.itemId) }))
    .filter((x): x is { a: { itemId: string; qty: number }; it: MenuItem } =>
      !!x.it && !x.it.addOnOnly && x.it.unit === 'per_guest' && x.a.qty > 0);

  const addOnItems = state.menuItems.filter(i => i.enabled && i.addOnOnly);
  const beverages = addOnItems.filter(i => i.category === 'Beverages');
  const liveStations = addOnItems.filter(i => i.category === 'Live Stations');
  const decorServices = addOnItems.filter(i => i.category === 'Decoration & Services');

  const cols: Col[] = useMemo(() => {
    const list: Col[] = PKG_ORDER
      .map(id => state.packages.find(p => p.id === id && p.enabled))
      .filter((p): p is NonNullable<typeof p> => !!p)
      .map(p => {
        const extraDishes = addedMains.filter(x => !p.included.includes(x.it.id));
        const extraDishesTotal = extraDishes.reduce((s, x) => s + x.it.price * guests * x.a.qty, 0);
        return {
          key: p.id,
          name: p.name,
          tagline: p.tagline,
          image: p.image,
          perGuest: p.pricePerGuest,
          dishes: `${p.included.length} included`,
          total: p.pricePerGuest * guests + hall + extrasTotal + extraDishesTotal,
          selected: calc.packageId === p.id,
          packageId: p.id,
        };
      });
    list.push({
      key: 'manual',
      name: 'Manual',
      tagline: 'Build your own menu',
      image: undefined,
      perGuest: null,
      dishes: addedMains.length > 0 ? `${addedMains.length} picked` : 'None picked yet',
      total: addedMains.reduce((s, x) => s + x.it.price * guests * x.a.qty, 0) + hall + extrasTotal,
      selected: !calc.packageId,
      packageId: undefined,
    });
    return list;
  }, [state.packages, addedMains, guests, hall, extrasTotal, calc.packageId]);

  const pick = (c: Col) => {
    setCalc(cc => ({ ...cc, packageId: c.packageId }));
    toast(c.packageId ? `${c.name} package selected.` : 'Manual menu selected.');
    nav('/calculator');
  };

  const guestError = guests < MIN_G ? `Please enter at least ${MIN_G} guests.` : '';

  return (
    <div className="wrap">
      <style>{`
        .cmp-controls { display: grid; gap: 14px; grid-template-columns: repeat(3, 1fr); }
        @media (max-width: 760px) { .cmp-controls { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 520px) { .cmp-controls { grid-template-columns: 1fr; } }
        .cmp-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 0 -6px; padding: 0 6px 8px; scrollbar-width: thin; }
        .cmp-table { border-collapse: separate; border-spacing: 0; table-layout: fixed; min-width: 960px; width: 100%; }
        .cmp-table th, .cmp-table td { padding: 12px 14px; text-align: center; border-bottom: 1px solid rgba(30,77,63,.1); vertical-align: middle; overflow: hidden; }
        .cmp-table thead th { border-bottom: 2px solid rgba(198,161,91,.4); }
        /* sticky label column — fixed width, solid bg, stays put while sliding */
        .cmp-table thead th:first-child, .cmp-table tbody th {
          position: sticky; left: 0; z-index: 2;
          width: 168px; min-width: 168px; max-width: 168px;
          background: #FBF8F1; text-align: left; font-size: 13px; color: var(--color-ink-600); font-weight: 600;
          border-right: 1px solid rgba(198,161,91,.25);
          box-shadow: 3px 0 8px rgba(11,31,25,.06);
        }
        .cmp-table thead th:first-child { z-index: 3; }
        .cmp-table thead th:not(:first-child), .cmp-table td { min-width: 132px; }
        .cmp-table td.selected, .cmp-table thead th.selected { background: rgba(198,161,91,.1); }
        .cmp-table thead th.selected { border-top: 2px solid var(--color-champagne-500); }
        .cmp-pkg-img { width: 54px; height: 54px; border-radius: 14px; object-fit: cover; margin: 0 auto 8px; display: block; }
        .cmp-total { font-family: var(--font-display); font-size: 21px; font-weight: 700; color: var(--color-pine-800); }
        tr.cmp-total-row td { background: rgba(30,77,63,.05); border-top: 2px solid rgba(30,77,63,.2); border-bottom: 2px solid rgba(30,77,63,.2); }
        tr.cmp-total-row th { background: #F3EEE2; border-top: 2px solid rgba(30,77,63,.2); border-bottom: 2px solid rgba(30,77,63,.2); }
      `}</style>

      <Reveal>
        <PageHead
          eyebrow="Package Comparison"
          title="Compare packages side by side"
          lead="Adjust guests, space and extras — every package updates instantly. Pick one to continue."
        />
      </Reveal>

      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <Reveal>
          <section className="panel panel-compact">
            <div className="cmp-controls">
              <Field label="Number of guests" error={guestError || undefined}>
                <input
                  className="input"
                  type="number" min={MIN_G} max={MAX_G}
                  value={calc.guests || ''}
                  placeholder={`e.g. ${MIN_G * 8}`}
                  onChange={e => setCalc(c => ({ ...c, guests: Number(e.target.value) }))}
                  aria-label="Number of guests"
                />
              </Field>
              <Field label="Event space">
                <Select
                  value={calc.venueId ?? ''}
                  onChange={v => setCalc(c => ({ ...c, venueId: v || undefined }))}
                  ariaLabel="Event space"
                >
                  <option value="">No space selected</option>
                  {state.venues.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Time slot">
                <Select
                  value={calc.slot}
                  onChange={v => setCalc(c => ({ ...c, slot: v as typeof calc.slot }))}
                  ariaLabel="Time slot"
                >
                  {SLOTS.map(s => (
                    <option key={s.id} value={s.id}>{s.label} · {s.time}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <p className="hint" style={{ marginTop: 10 }}>
              {BUSINESS.name} · {BUSINESS.area}, Lahore — hall rental is included in every total below.
            </p>
          </section>
        </Reveal>



        <Reveal>
          <section className="panel" style={{ marginTop: 24 }}>
            <h2 className="font-sans text-[13px] font-bold uppercase tracking-[0.18em] text-pine-600 mb-4">
              <span className="inline-block w-7 h-[2px] rounded-full bg-gradient-to-r from-champagne-500 to-champagne-300 mr-2.5 -translate-y-[3px]" />
              Side-by-side comparison
            </h2>
            <div className="cmp-scroll">
              <table className="tbl cmp-table">
                <thead>
                  <tr>
                    <th aria-label="Package" />
                    {cols.map(c => (
                      <th key={c.key} className={c.selected ? 'selected' : ''}>
                        {c.image && <Img src={c.image} alt={c.name} className="cmp-pkg-img" />}
                        <div className="font-display" style={{ fontSize: 16 }}>{c.name}</div>
                        <div className="small muted" style={{ margin: '2px 0 6px' }}>{c.tagline}</div>
                        {c.selected && <Badge tone="green">Current</Badge>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Per guest</th>
                    {cols.map(c => (
                      <td key={c.key} className={c.selected ? 'selected' : ''}>
                        {c.perGuest !== null ? <strong>{pkr(c.perGuest)}</strong> : <span className="muted">—</span>}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Dishes</th>
                    {cols.map(c => (
                      <td key={c.key} className={c.selected ? 'selected' : ''}>{c.dishes}</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Hall rental{venue ? ` — ${venue.name}` : ''}</th>
                    {cols.map(c => (
                      <td key={c.key} className={c.selected ? 'selected' : ''}>
                        {venue ? pkr(hall) : <span className="muted">No space selected</span>}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Your extras</th>
                    {cols.map(c => (
                      <td key={c.key} className={c.selected ? 'selected' : ''}>
                        {extrasCount > 0 ? `＋${pkr(extrasTotal)}` : <span className="muted">None</span>}
                      </td>
                    ))}
                  </tr>
                  <tr className="cmp-total-row">
                    <th scope="row">Estimated total</th>
                    {cols.map(c => (
                      <td key={c.key} className={c.selected ? 'selected' : ''}>
                        <span className="cmp-total">{pkr(Math.round(c.total))}</span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Effective per guest</th>
                    {cols.map(c => (
                      <td key={c.key} className={c.selected ? 'selected' : ''}>
                        {guests >= MIN_G ? pkr(Math.round(c.total / guests)) : <span className="muted">—</span>}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row" aria-label="Select" />
                    {cols.map(c => (
                      <td key={c.key} className={c.selected ? 'selected' : ''}>
                        {c.selected ? (
                          <Badge tone="green">Selected ✓</Badge>
                        ) : (
                          <Btn variant="gold" size="sm" onClick={() => pick(c)}>Select</Btn>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="hint" style={{ marginTop: 10 }}>
              Totals include hall rental{venue ? ` (${venue.name}, ${SLOTS.find(s => s.id === calc.slot)?.label})` : ''} and your selected extras.
              Promotions are applied on the calculator screen.
            </p>
          </section>
        </Reveal>

        <Reveal>
          <section className="panel" style={{ marginTop: 24 }}>
            <h2 className="font-sans text-[13px] font-bold uppercase tracking-[0.18em] text-pine-600 mb-4">
              <span className="inline-block w-7 h-[2px] rounded-full bg-gradient-to-r from-champagne-500 to-champagne-300 mr-2.5 -translate-y-[3px]" />
              Add-ons &amp; extras{extrasCount > 0 ? ` (${extrasCount} selected)` : ''}
            </h2>
            <p className="hint" style={{ marginBottom: 12 }}>Tap to add to every package column — your selection is saved to the calculator.</p>
            {([['Beverages', beverages], ['Live stations', liveStations], ['Decoration & services', decorServices]] as [string, MenuItem[]][]).map(([title, items]) => (
              <div key={title} style={{ marginBottom: 6 }}>
                <p className="small" style={{ fontWeight: 700, marginBottom: 8 }}>{title}</p>
                <div className="dish-pick-list" style={{ marginBottom: 10 }}>
                  {items.map(it => {
                    const sel = (addedMap.get(it.id) ?? 0) > 0;
                    return (
                      <button
                        key={it.id} type="button"
                        className={`dish-toggle${sel ? ' sel' : ''}`}
                        onClick={() => setAdded(it.id, sel ? 0 : 1)}
                        aria-pressed={sel}
                      >
                        <span className="dish-check" aria-hidden="true">{sel ? '✓' : ''}</span>
                        <span className="grow">
                          <span className="nm">{it.name}</span>
                          <span className="pr">{pkr(it.price)} {unitLabel(it.unit)}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        </Reveal>
      </div>
    </div>
  );
}
