// Deterministic pricing engine — the single source of truth for all cost math.
import {
  Booking, CalcDraft, MenuItem, MenuPackage, Promotion, SlotId, Venue,
} from '../data/types';
import { weekdayOf } from './format';

export const MAX_DISCOUNT_PCT = 15; // total discount never exceeds 15% of subtotal

export interface CalcLine {
  label: string;
  detail?: string;
  amount: number; // signed; discounts are negative
  kind: 'food' | 'addon' | 'hall' | 'service' | 'discount' | 'info';
}

export interface AppliedPromo {
  promo: Promotion;
  amount: number;
  reason: string;
}

export interface CalcResult {
  lines: CalcLine[];
  guests: number;
  foodSubtotal: number;
  addonsSubtotal: number;
  hallCharge: number;
  servicesSubtotal: number;
  subtotal: number;
  appliedPromos: AppliedPromo[];
  discountTotal: number;
  discountCapped: boolean;
  grandTotal: number;
  perGuest: number;
  packageBasePerGuest: number | null;
}

function itemById(items: MenuItem[], id: string): MenuItem | undefined {
  return items.find(i => i.id === id && i.enabled);
}

function eligiblePromos(
  draft: CalcDraft, subtotal: number, promos: Promotion[],
): { applied: AppliedPromo[]; capped: boolean } {
  const wd = weekdayOf(draft.date);
  const eligible: AppliedPromo[] = [];
  for (const p of promos) {
    if (!p.active) continue;
    let ok = false;
    let reason = '';
    if (p.kind === 'weekday' && p.weekdays?.includes(wd) && draft.guests >= (p.minGuests ?? 0)) {
      ok = true;
      reason = `Weekday event (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][wd]}) · ${p.minGuests}+ guests`;
    } else if (p.kind === 'lunch' && p.slots?.includes(draft.slot) && draft.guests >= (p.minGuests ?? 0)) {
      ok = true;
      reason = `Lunch slot · ${p.minGuests}+ guests`;
    } else if (p.kind === 'min_guests' && draft.guests >= (p.minGuests ?? 0)) {
      ok = true;
      reason = `${draft.guests.toLocaleString()} guests (min ${p.minGuests})`;
    } else if (p.kind === 'date_range' && p.from && p.to && draft.date >= p.from && draft.date <= p.to) {
      ok = true;
      reason = `Event date within promo window`;
    }
    if (ok) eligible.push({ promo: p, amount: Math.round(subtotal * (p.percent / 100)), reason });
  }
  // Highest-value promos first, then enforce the global cap.
  eligible.sort((a, b) => b.amount - a.amount);
  const cap = Math.round(subtotal * (MAX_DISCOUNT_PCT / 100));
  let running = 0;
  const applied: AppliedPromo[] = [];
  for (const e of eligible) {
    if (running + e.amount <= cap) {
      applied.push(e);
      running += e.amount;
    }
  }
  return { applied, capped: eligible.length > applied.length };
}

export function calculate(
  draft: CalcDraft,
  venues: Venue[],
  items: MenuItem[],
  packages: MenuPackage[],
  promos: Promotion[],
  _bookings: Booking[],
): CalcResult {
  const lines: CalcLine[] = [];
  const guests = Math.max(0, Math.floor(draft.guests || 0));
  const venue = draft.venueId ? venues.find(v => v.id === draft.venueId) : undefined;
  const pkg = draft.packageId ? packages.find(p => p.id === draft.packageId && p.enabled) : undefined;

  let foodSubtotal = 0;
  let packageBasePerGuest: number | null = null;

  if (pkg) {
    // Base package price covers ALL included dishes — never double-charge them.
    packageBasePerGuest = pkg.pricePerGuest;
    const base = pkg.pricePerGuest * guests;
    lines.push({
      label: `${pkg.name} package × ${guests.toLocaleString()} guests`,
      detail: `${pkg.included.length} included dishes · Rs. ${pkg.pricePerGuest.toLocaleString()} per guest`,
      amount: base, kind: 'food',
    });
    foodSubtotal += base;
    // Credits for removed included dishes.
    for (const rid of draft.removed) {
      const it = itemById(items, rid);
      if (it && pkg.included.includes(rid)) {
        const credit = it.creditPerGuest * guests;
        lines.push({
          label: `Removed: ${it.name}`,
          detail: `Credit Rs. ${it.creditPerGuest.toLocaleString()} per guest`,
          amount: -credit, kind: 'food',
        });
        foodSubtotal -= credit;
      }
    }
  } else {
    // Fully custom menu: sum the selected dishes at their per-guest prices.
    const mains = draft.added.filter(a => {
      const it = itemById(items, a.itemId);
      return it && it.unit === 'per_guest' && !it.addOnOnly;
    });
    if (mains.length === 0) {
      lines.push({ label: 'Custom menu — no dishes selected yet', amount: 0, kind: 'info' });
    }
    for (const a of mains) {
      const it = itemById(items, a.itemId)!;
      const amt = it.price * guests * a.qty;
      lines.push({
        label: `${it.name} × ${guests.toLocaleString()} guests${a.qty > 1 ? ` × ${a.qty}` : ''}`,
        detail: `Rs. ${it.price.toLocaleString()} per guest`,
        amount: amt, kind: 'food',
      });
      foodSubtotal += amt;
    }
  }

  // Optional additions (beverages, extra servings, live stations, services).
  let addonsSubtotal = 0;
  let servicesSubtotal = 0;
  for (const a of draft.added) {
    const it = itemById(items, a.itemId);
    if (!it) continue;
    // Skip per-guest mains already counted in the custom-menu path.
    if (!pkg && it.unit === 'per_guest' && !it.addOnOnly) continue;
    // Skip dishes already included in the package (no double charge).
    if (pkg && pkg.included.includes(a.itemId) && !draft.removed.includes(a.itemId)) continue;
    let amt = 0;
    let detail = '';
    if (it.unit === 'per_guest') {
      amt = it.price * guests * a.qty;
      detail = `Rs. ${it.price.toLocaleString()} per guest × ${guests.toLocaleString()}${a.qty > 1 ? ` × ${a.qty}` : ''}`;
    } else if (it.unit === 'flat') {
      amt = it.price * a.qty;
      detail = `Rs. ${it.price.toLocaleString()} per event${a.qty > 1 ? ` × ${a.qty}` : ''}`;
    } else {
      amt = it.price * a.qty;
      const per = it.unit === 'per_bottle' ? 'bottle' : it.unit === 'per_serving' ? 'serving' : 'item';
      detail = `Rs. ${it.price.toLocaleString()} per ${per} × ${a.qty}`;
    }
    const isService = it.category === 'Decoration & Services' || it.category === 'Live Stations';
    lines.push({ label: `Add: ${it.name}`, detail, amount: amt, kind: isService ? 'service' : 'addon' });
    if (isService) servicesSubtotal += amt; else addonsSubtotal += amt;
  }

  // Hall rental for the chosen venue + slot.
  let hallCharge = 0;
  if (venue) {
    hallCharge = venue.hallRental[draft.slot] ?? 0;
    lines.push({
      label: `Hall rental — ${venue.name}`,
      detail: `${draft.slot.charAt(0).toUpperCase() + draft.slot.slice(1)} slot`,
      amount: hallCharge, kind: 'hall',
    });
  }

  const subtotal = Math.max(0, foodSubtotal + addonsSubtotal + servicesSubtotal + hallCharge);
  const { applied, capped } = eligiblePromos(draft, subtotal, promos);
  for (const a of applied) {
    lines.push({
      label: `Discount — ${a.promo.name} (${a.promo.percent}%)`,
      detail: a.reason,
      amount: -a.amount, kind: 'discount',
    });
  }
  const discountTotal = applied.reduce((s, a) => s + a.amount, 0);
  const grandTotal = Math.max(0, subtotal - discountTotal);

  return {
    lines, guests, foodSubtotal, addonsSubtotal, hallCharge, servicesSubtotal, subtotal,
    appliedPromos: applied, discountTotal, discountCapped: capped, grandTotal,
    perGuest: guests > 0 ? grandTotal / guests : 0,
    packageBasePerGuest,
  };
}

/** Quick estimate used by the recommendation engine (package base + hall, no add-ons). */
export function quickEstimate(
  venue: Venue, guests: number, slot: SlotId, pkg: MenuPackage | undefined,
): number {
  const perGuest = pkg ? pkg.pricePerGuest : 2500;
  return perGuest * guests + (venue.hallRental[slot] ?? 0);
}
