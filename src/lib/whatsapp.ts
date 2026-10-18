// WhatsApp click-to-chat handoff for demo inquiries.
import { CalcDraft, EventType, Inquiry, SlotId, Venue } from '../data/types';
import { fmtDate, pkr } from './format';
import { CalcResult } from './calc';
import { SLOTS } from '../data/types';

export function buildWhatsAppMessage(
  draft: CalcDraft,
  result: CalcResult,
  venue: Venue | undefined,
  packageName: string,
  customerName: string,
  extraNotes: string,
): string {
  const slotLabel = SLOTS.find(s => s.id === draft.slot)?.label ?? draft.slot;
  const lines = [
    `*ShadiSphere — Wedding Inquiry (Demo)*`,
    ``,
    `Name: ${customerName}`,
    `Event: ${draft.eventType}`,
    `City: ${draft.city}`,
    `Venue: ${venue ? `${venue.name}, ${venue.area}` : 'Not selected yet'}`,
    `Date: ${fmtDate(draft.date)} (${slotLabel})`,
    `Guests: ${draft.guests.toLocaleString()}`,
    `Menu: ${packageName}`,
    ``,
    `*Estimate breakdown*`,
    ...result.lines
      .filter(l => l.kind !== 'info')
      .map(l => `• ${l.label}: ${pkr(l.amount)}`),
    ``,
    `*Estimated total: ${pkr(result.grandTotal)}*`,
    `≈ ${pkr(Math.round(result.perGuest))} per guest`,
    ...(extraNotes ? [``, `Notes: ${extraNotes}`] : []),
    ``,
    `_Illustrative demo estimate — final quote confirmed by the venue._`,
  ];
  return lines.join('\n');
}

export function waLink(numberDigits: string, message: string): string {
  return `https://wa.me/${numberDigits}?text=${encodeURIComponent(message)}`;
}

/** Build message from a saved inquiry record (for dashboard resend). */
export function buildInquiryMessage(
  q: Inquiry,
  venueName: string,
  packageName: string,
): string {
  const slotLabel = SLOTS.find(s => s.id === q.slot)?.label ?? q.slot;
  return [
    `*ShadiSphere — Wedding Inquiry (Demo)*`,
    ``,
    `Ref: ${q.ref}`,
    `Name: ${q.name}`,
    `Event: ${q.eventType}`,
    `City: ${q.city}`,
    `Venue: ${venueName}`,
    `Date: ${fmtDate(q.date)} (${slotLabel})`,
    `Guests: ${q.guests.toLocaleString()}`,
    `Menu: ${packageName}`,
    `Estimated total: ${pkr(q.estimate)}`,
    ...(q.notes ? [``, `Notes: ${q.notes}`] : []),
  ].join('\n');
}

export type { EventType, SlotId };
