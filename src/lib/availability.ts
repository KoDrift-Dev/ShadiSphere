// Deterministic availability engine. A slot is unavailable ONLY when demo
// booking data marks it booked/blocked (or the date is in the past).
import { Booking, BookingStatus, SlotId } from '../data/types';
import { isPast } from './format';

export type SlotStatus = 'available' | 'tentative' | 'inquiry' | 'booked' | 'blocked' | 'past';

export const SLOT_STATUS_META: Record<SlotStatus, { label: string; cls: string }> = {
  available: { label: 'Available', cls: 'available' },
  tentative: { label: 'Tentative hold', cls: 'tentative' },
  inquiry: { label: 'Inquiry received', cls: 'tentative' },
  booked: { label: 'Booked (demo)', cls: 'booked' },
  blocked: { label: 'Unavailable', cls: 'blocked' },
  past: { label: 'Past date', cls: 'blocked' },
};

export function slotStatus(
  venueId: string, date: string, slot: SlotId, bookings: Booking[],
): { status: SlotStatus; booking?: Booking } {
  if (!date || isPast(date)) return { status: 'past' };
  const b = bookings.find(
    x => x.venueId === venueId && x.date === date && x.slot === slot,
  );
  if (!b) return { status: 'available' };
  return { status: b.status as SlotStatus, booking: b };
}

export function daySummary(
  venueId: string, date: string, slots: SlotId[], bookings: Booking[],
): Record<SlotId, SlotStatus> {
  const out = {} as Record<SlotId, SlotStatus>;
  for (const s of slots) out[s] = slotStatus(venueId, date, s, bookings).status;
  return out;
}

/** True only when the customer may proceed to request this slot. */
export function isSlotBookable(status: SlotStatus): boolean {
  return status === 'available';
}

/** Add a simulated booking; refuses conflicts (booked/blocked/tentative already held). */
export function tryAddBooking(
  bookings: Booking[],
  nb: Omit<Booking, 'id'>,
): { ok: true; bookings: Booking[] } | { ok: false; reason: string } {
  const existing = bookings.find(
    x => x.venueId === nb.venueId && x.date === nb.date && x.slot === nb.slot,
  );
  if (existing && (existing.status === 'booked' || existing.status === 'blocked' || existing.status === 'tentative')) {
    return { ok: false, reason: `This slot is already ${SLOT_STATUS_META[existing.status as SlotStatus]?.label ?? existing.status} — it cannot be double-booked.` };
  }
  const id = `bk-${Date.now().toString(36)}`;
  return { ok: true, bookings: [...bookings, { ...nb, id }] };
}
