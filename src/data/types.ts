// ShadiSphere central data model. All demo state flows through these types.

export type VenueType = 'Marquee' | 'Banquet Hall' | 'Lawn' | 'Wedding Estate';
export type VenueConfig = 'Indoor' | 'Outdoor' | 'Indoor + Outdoor';
export type EventType = 'Barat' | 'Walima' | 'Mehndi' | 'Nikah' | 'Reception' | 'Engagement';
export type SlotId = 'lunch' | 'afternoon' | 'evening';
export type PricingUnit = 'per_guest' | 'per_serving' | 'per_bottle' | 'per_item' | 'flat';
export type BookingStatus = 'inquiry' | 'tentative' | 'booked' | 'blocked';
export type InquiryStatus = 'New' | 'Contacted' | 'Quoted' | 'Confirmed' | 'Lost';

export interface Venue {
  id: string;
  name: string;
  city: string;
  area: string;
  type: VenueType;
  config: VenueConfig;
  description: string;
  minGuests: number;
  maxGuests: number;
  eventTypes: EventType[];
  amenities: string[];
  hallRental: Record<SlotId, number>; // PKR per event slot
  image: string;
  gallery: string[];
  featured: boolean;
}

export type MenuCategory =
  | 'Main Dishes'
  | 'BBQ & Starters'
  | 'Sides'
  | 'Desserts'
  | 'Beverages'
  | 'Live Stations'
  | 'Decoration & Services';

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  unit: PricingUnit;
  /** price per pricing unit, in PKR */
  price: number;
  /** credit per guest applied when a package-included item is removed */
  creditPerGuest: number;
  description: string;
  image: string;
  /** true => only available as an optional add-on, never inside a preset package */
  addOnOnly: boolean;
  enabled: boolean;
}

export interface MenuPackage {
  id: string;
  name: string;
  tagline: string;
  pricePerGuest: number;
  description: string;
  image: string;
  included: string[]; // MenuItem ids
  badge?: string;
  enabled: boolean;
}

export interface Booking {
  id: string;
  venueId: string;
  date: string; // YYYY-MM-DD
  slot: SlotId;
  status: BookingStatus;
  eventType: EventType;
  guests: number;
  customerName: string;
  note?: string;
}

export type PromoKind = 'weekday' | 'lunch' | 'min_guests' | 'date_range';

export interface Promotion {
  id: string;
  name: string;
  description: string;
  kind: PromoKind;
  percent: number; // e.g. 10 => 10%
  weekdays?: number[]; // 0=Sun..6=Sat, for kind=weekday
  slots?: SlotId[]; // for kind=lunch
  minGuests?: number; // for kind=min_guests
  from?: string; // YYYY-MM-DD, for kind=date_range
  to?: string; // YYYY-MM-DD, for kind=date_range
  active: boolean;
}

export interface Inquiry {
  ref: string; // e.g. SS-2026-1042
  name: string;
  phone: string;
  email?: string;
  city: string;
  eventType: EventType;
  date: string;
  slot: SlotId;
  guests: number;
  venueId?: string;
  packageId?: string;
  customMenu: boolean;
  estimate: number;
  status: InquiryStatus;
  notes?: string;
  createdAt: string; // ISO
}

export interface CalcDraft {
  city: string;
  eventType: EventType;
  venueId?: string;
  guests: number;
  date: string; // YYYY-MM-DD
  slot: SlotId;
  packageId?: string; // undefined => fully custom menu
  removed: string[]; // included item ids removed (credit applied)
  added: { itemId: string; qty: number }[]; // optional additions
}

export const SLOTS: { id: SlotId; label: string; time: string }[] = [
  { id: 'lunch', label: 'Lunch', time: '12:00 – 16:00' },
  { id: 'afternoon', label: 'Afternoon', time: '16:30 – 19:30' },
  { id: 'evening', label: 'Evening', time: '20:00 – 00:00' },
];

export const EVENT_TYPES: EventType[] = ['Barat', 'Walima', 'Mehndi', 'Nikah', 'Reception', 'Engagement'];

// Single-business identity: ShadiSphere is ONE fictional marriage hall in Lahore.
// The `venues` collection below represents its internal event spaces — not
// independent businesses.
export const BUSINESS = {
  name: 'ShadiSphere Grand Marquee',
  city: 'Lahore',
  area: 'DHA Phase 5',
  address: 'Main Boulevard, DHA Phase 5, Lahore, Pakistan',
  phone: '0300-0000000', // fictional demo number
  email: 'hello@shadisphere.pk',
  tagline: 'Your Celebration. Your Venue. Your Perfect Plan.',
};

export const CITIES = ['Lahore'];
