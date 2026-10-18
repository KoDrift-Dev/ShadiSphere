// Rule-based date + space recommendation engine for ONE business:
// ShadiSphere Grand Marquee, Lahore. Never suggests competing venues — only
// alternative dates, slots, or internal event spaces.
import {
  Booking, EventType, MenuPackage, SlotId, Venue, VenueType, BUSINESS,
} from '../data/types';
import { isPast, isoPlus } from './format';
import { slotStatus } from './availability';
import { quickEstimate } from './calc';

export type WindowMode = 'exact' | 'plus3' | 'plus7' | 'forward10' | 'custom';

export interface RecInput {
  city: string; // kept for form compatibility; always BUSINESS.city
  eventType: EventType;
  guests: number;
  preferredDate: string;
  window: WindowMode;
  customEnd?: string;
  slot?: SlotId; // undefined => any slot
  budget?: number;
  venueType?: VenueType | ''; // preferred internal space type
  spaceId?: string; // preferred internal space
}

export interface Recommendation {
  venue: Venue; // an event space of ShadiSphere Grand Marquee
  date: string;
  slot: SlotId;
  estimate: number;
  perGuest: number;
  reasons: string[];
  score: number;
}

function windowDates(input: RecInput): string[] {
  const { preferredDate, window, customEnd } = input;
  if (!preferredDate || isPast(preferredDate)) return [];
  const dates: string[] = [];
  const push = (iso: string) => { if (!isPast(iso) && !dates.includes(iso)) dates.push(iso); };
  const addDays = (iso: string, n: number): string => {
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + n);
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${dt.getFullYear()}-${mm}-${dd}`;
  };
  if (window === 'exact') {
    push(preferredDate);
  } else if (window === 'plus3' || window === 'plus7') {
    const r = window === 'plus3' ? 3 : 7;
    for (let i = -r; i <= r; i++) push(addDays(preferredDate, i));
  } else if (window === 'forward10') {
    // FORWARD ONLY: preferred date + following 10 days (never backwards).
    for (let i = 0; i <= 10; i++) push(addDays(preferredDate, i));
  } else if (window === 'custom' && customEnd) {
    for (let i = 0; i <= 60; i++) {
      const d = addDays(preferredDate, i);
      if (d > customEnd) break;
      push(d);
    }
  }
  return dates.sort();
}

const SLOT_IDS: SlotId[] = ['lunch', 'afternoon', 'evening'];

export function recommend(
  input: RecInput,
  venues: Venue[],
  bookings: Booking[],
  pkg: MenuPackage | undefined,
): { recs: Recommendation[]; searched: number; blockedReason?: string } {
  const dates = windowDates(input);
  if (dates.length === 0) {
    return { recs: [], searched: 0, blockedReason: 'Please choose a valid future preferred date.' };
  }
  const slots = input.slot ? [input.slot] : SLOT_IDS;
  // All spaces belong to the same business — filter by capacity + event fit only.
  let pool = venues.filter(v =>
    v.eventTypes.includes(input.eventType) &&
    input.guests >= v.minGuests && input.guests <= v.maxGuests,
  );
  if (input.spaceId) pool = pool.filter(v => v.id === input.spaceId);
  else if (input.venueType) pool = pool.filter(v => v.type === input.venueType);
  if (pool.length === 0) {
    return {
      recs: [], searched: 0,
      blockedReason: `None of our event spaces fits ${input.guests.toLocaleString()} guests for a ${input.eventType}. Our spaces host ${Math.min(...venues.map(v => v.minGuests)).toLocaleString()}–${Math.max(...venues.map(v => v.maxGuests)).toLocaleString()} guests — try adjusting the guest count.`,
    };
  }

  const recs: Recommendation[] = [];
  let searched = 0;

  for (const venue of pool) {
    for (const date of dates) {
      const distFromPref = (() => {
        const [y1, m1, d1] = input.preferredDate.split('-').map(Number);
        const [y2, m2, d2] = date.split('-').map(Number);
        return Math.abs((new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) / 86400000);
      })();
      for (const slot of slots) {
        searched++;
        const { status } = slotStatus(venue.id, date, slot, bookings);
        if (status !== 'available') continue;
        const estimate = quickEstimate(venue, input.guests, slot, pkg);
        if (input.budget && estimate > input.budget * 1.25) continue;
        const reasons: string[] = [];
        const headroom = venue.maxGuests - input.guests;
        reasons.push(`${venue.name} fits ${input.guests.toLocaleString()} guests comfortably (up to ${venue.maxGuests.toLocaleString()})`);
        if (date === input.preferredDate) reasons.push('Available on your preferred date');
        else reasons.push(`${distFromPref} day${distFromPref === 1 ? '' : 's'} from your preferred date — same venue`);
        if (input.budget && estimate <= input.budget) reasons.push('Within your budget');
        else if (input.budget) reasons.push('Slightly above budget — worth a look');

        let score = 100;
        score -= headroom / 50;
        score -= distFromPref * 4;
        if (input.spaceId && venue.id === input.spaceId) score += 15;
        if (input.budget) {
          score -= Math.max(0, (estimate - input.budget) / input.budget) * 60;
          if (estimate <= input.budget) score += 10;
        }
        if (venue.featured) score += 5;
        recs.push({
          venue, date, slot, estimate,
          perGuest: input.guests > 0 ? estimate / input.guests : 0,
          reasons, score,
        });
      }
    }
  }

  recs.sort((a, b) => b.score - a.score);
  const top = recs.slice(0, 5);
  if (top.length === 0) {
    return {
      recs: [], searched,
      blockedReason: `All our spaces are held on the dates in your window. Try widening the date window, choosing a different slot, or adjusting the guest count — our team can also suggest options on WhatsApp.`,
    };
  }
  return { recs: top, searched };
}

/** Multi-event planner: suggest date combos with a fixed gap between functions. */
export interface EventWish {
  eventType: EventType;
  guests: number;
  preferredDate: string;
}

export interface EventPlanCombo {
  dates: string[]; // one per wish, in order
  venueId: string;
  venueName: string;
  slot: SlotId;
  totalEstimate: number;
  note: string;
}

export function planMultiEvent(
  wishes: EventWish[],
  gapDays: number,
  _city: string,
  venues: Venue[],
  bookings: Booking[],
  pkg: MenuPackage | undefined,
  slot: SlotId,
): EventPlanCombo[] {
  const combos: EventPlanCombo[] = [];
  if (wishes.length === 0 || wishes.length > 4) return combos;
  const maxGuests = Math.max(...wishes.map(w => w.guests));
  const pool = venues.filter(v => maxGuests >= v.minGuests && maxGuests <= v.maxGuests);
  const addDays = (iso: string, n: number): string => {
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + n);
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${dt.getFullYear()}-${mm}-${dd}`;
  };
  for (const venue of pool) {
    // Try anchors: first wish preferred date, and ±3 day shifts.
    for (let shift = -3; shift <= 3 && combos.length < 5; shift++) {
      const dates = wishes.map((w, i) => addDays(w.preferredDate, shift + i * gapDays));
      if (dates.some(isPast)) continue;
      const allFree = dates.every(d => slotStatus(venue.id, d, slot, bookings).status === 'available');
      if (!allFree) continue;
      const totalEstimate = wishes.reduce((s, w) => s + quickEstimate(venue, w.guests, slot, pkg), 0);
      combos.push({
        dates, venueId: venue.id, venueName: `${BUSINESS.name} — ${venue.name}`, slot, totalEstimate,
        note: shift === 0
          ? `All ${wishes.length} functions fit your preferred dates with a ${gapDays}-day gap.`
          : `Shifted ${Math.abs(shift)} day${Math.abs(shift) > 1 ? 's' : ''} ${shift > 0 ? 'later' : 'earlier'} to find open slots.`,
      });
    }
  }
  combos.sort((a, b) => a.totalEstimate - b.totalEstimate);
  return combos.slice(0, 5);
}

export { isoPlus };
