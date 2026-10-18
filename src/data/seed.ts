// Centralized demo seed data. All prices in PKR. Fictional entries for demo only.
import {
  Booking, EventType, Inquiry, MenuCategory, MenuItem, MenuPackage,
  PricingUnit, Promotion, SlotId, Venue,
} from './types';

function isoPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

const IMG = (n: string) => `/img/${n}.jpg`;

interface ItemDef {
  id: string; name: string; category: MenuCategory; unit: PricingUnit;
  price: number; credit: number; desc: string; img: string; addOn?: boolean;
}

const ITEM_DEFS: ItemDef[] = [
  // Main dishes
  { id: 'chicken-qorma', name: 'Chicken Qorma', category: 'Main Dishes', unit: 'per_guest', price: 220, credit: 140, desc: 'Slow-cooked in desi ghee with aromatic spices', img: IMG('food-karahi') },
  { id: 'chicken-karahi', name: 'Chicken Karahi', category: 'Main Dishes', unit: 'per_guest', price: 260, credit: 160, desc: 'Wok-tossed with tomatoes, ginger & green chillies', img: IMG('food-karahi') },
  { id: 'chicken-handi', name: 'Chicken Handi', category: 'Main Dishes', unit: 'per_guest', price: 250, credit: 155, desc: 'Creamy handi gravy, finished with fresh cream', img: IMG('food-karahi') },
  { id: 'chicken-biryani', name: 'Chicken Biryani', category: 'Main Dishes', unit: 'per_guest', price: 200, credit: 130, desc: 'Layered basmati with saffron, served with raita', img: IMG('food-biryani') },
  { id: 'chicken-pulao', name: 'Chicken Pulao', category: 'Main Dishes', unit: 'per_guest', price: 210, credit: 135, desc: 'Fragrant yakhni pulao with tender chicken', img: IMG('food-biryani') },
  { id: 'mutton-qorma', name: 'Mutton Qorma', category: 'Main Dishes', unit: 'per_guest', price: 420, credit: 260, desc: 'Premium mutton, rich brown gravy, wedding classic', img: IMG('food-karahi') },
  { id: 'mutton-kunna', name: 'Mutton Kunna', category: 'Main Dishes', unit: 'per_guest', price: 450, credit: 280, desc: 'Chinioti-style slow clay-pot mutton', img: IMG('food-karahi') },
  { id: 'beef-pulao', name: 'Beef Pulao', category: 'Main Dishes', unit: 'per_guest', price: 320, credit: 200, desc: 'Hearty beef yakhni pulao', img: IMG('food-biryani') },
  { id: 'beef-karahi', name: 'Beef Karahi', category: 'Main Dishes', unit: 'per_guest', price: 340, credit: 210, desc: 'Desi-style beef karahi with black pepper', img: IMG('food-karahi') },
  // BBQ & starters
  { id: 'chicken-tikka', name: 'Chicken Tikka', category: 'BBQ & Starters', unit: 'per_guest', price: 180, credit: 110, desc: 'Char-grilled leg piece, smoky & juicy', img: IMG('food-bbq') },
  { id: 'malai-boti', name: 'Malai Boti', category: 'BBQ & Starters', unit: 'per_guest', price: 200, credit: 120, desc: 'Creamy, mild cubes — crowd favourite', img: IMG('food-bbq') },
  { id: 'seekh-kebab', name: 'Seekh Kebab', category: 'BBQ & Starters', unit: 'per_guest', price: 220, credit: 130, desc: 'Hand-rolled beef seekh kebabs, 2 pcs per guest', img: IMG('food-bbq') },
  { id: 'reshmi-kebab', name: 'Reshmi Kebab', category: 'BBQ & Starters', unit: 'per_guest', price: 210, credit: 125, desc: 'Silky chicken kebabs with mint chutney', img: IMG('food-bbq') },
  { id: 'fish-fry', name: 'Fish Fry', category: 'BBQ & Starters', unit: 'per_guest', price: 260, credit: 150, desc: 'Crispy spiced fish, winter wedding hit', img: IMG('food-bbq') },
  { id: 'assorted-starters', name: 'Assorted Starters', category: 'BBQ & Starters', unit: 'per_guest', price: 240, credit: 140, desc: 'Mixed platter: wings, kebabs & finger food', img: IMG('food-bbq') },
  // Sides
  { id: 'roghni-naan', name: 'Roghni Naan', category: 'Sides', unit: 'per_guest', price: 40, credit: 25, desc: 'Sesame-topped, tandoor-fresh', img: IMG('food-naan') },
  { id: 'plain-naan', name: 'Plain Naan', category: 'Sides', unit: 'per_guest', price: 30, credit: 18, desc: 'Classic tandoori naan', img: IMG('food-naan') },
  { id: 'raita', name: 'Raita', category: 'Sides', unit: 'per_guest', price: 35, credit: 20, desc: 'Cooling yoghurt raita', img: IMG('food-naan') },
  { id: 'fresh-salad', name: 'Fresh Salad', category: 'Sides', unit: 'per_guest', price: 45, credit: 25, desc: 'Garden salad with lemon dressing', img: IMG('food-naan') },
  { id: 'mint-chutney', name: 'Mint Chutney', category: 'Sides', unit: 'per_guest', price: 30, credit: 18, desc: 'Fresh mint & coriander chutney', img: IMG('food-naan') },
  // Desserts
  { id: 'kheer', name: 'Kheer', category: 'Desserts', unit: 'per_guest', price: 90, credit: 55, desc: 'Slow-cooked rice pudding with cardamom', img: IMG('food-dessert') },
  { id: 'shahi-tukray', name: 'Shahi Tukray', category: 'Desserts', unit: 'per_guest', price: 110, credit: 65, desc: 'Royal bread pudding with rabri', img: IMG('food-dessert') },
  { id: 'gulab-jamun', name: 'Gulab Jamun', category: 'Desserts', unit: 'per_guest', price: 100, credit: 60, desc: 'Warm, syrup-soaked — 2 pcs per guest', img: IMG('food-dessert') },
  { id: 'gajar-halwa', name: 'Gajar Halwa', category: 'Desserts', unit: 'per_guest', price: 120, credit: 70, desc: 'Desi ghee carrot halwa with khoya', img: IMG('food-dessert') },
  { id: 'fruit-trifle', name: 'Fruit Trifle', category: 'Desserts', unit: 'per_guest', price: 130, credit: 75, desc: 'Layered custard, jelly & seasonal fruit', img: IMG('food-dessert') },
  { id: 'firni', name: 'Firni', category: 'Desserts', unit: 'per_guest', price: 95, credit: 55, desc: 'Silky ground-rice dessert, served chilled', img: IMG('food-dessert') },
  // Beverages
  { id: 'bottled-water', name: 'Bottled Water', category: 'Beverages', unit: 'per_bottle', price: 80, credit: 0, desc: '500ml mineral water per guest', img: IMG('food-drinks'), addOn: true },
  { id: 'soft-drinks', name: 'Soft Drinks', category: 'Beverages', unit: 'per_bottle', price: 120, credit: 0, desc: 'Chilled 345ml bottles, assorted', img: IMG('food-drinks'), addOn: true },
  { id: 'fresh-juice', name: 'Fresh Juice', category: 'Beverages', unit: 'per_serving', price: 150, credit: 0, desc: 'Seasonal fresh-pressed juice', img: IMG('food-drinks'), addOn: true },
  { id: 'tea', name: 'Tea (Doodh Patti)', category: 'Beverages', unit: 'per_serving', price: 60, credit: 0, desc: 'Classic doodh patti, served hot', img: IMG('food-drinks'), addOn: true },
  { id: 'kashmiri-chai', name: 'Kashmiri Chai', category: 'Beverages', unit: 'per_serving', price: 90, credit: 0, desc: 'Pink tea with crushed nuts', img: IMG('food-drinks'), addOn: true },
  // Live stations
  { id: 'live-bbq', name: 'Live BBQ Station', category: 'Live Stations', unit: 'flat', price: 45000, credit: 0, desc: 'On-site grills, chefs & fresh BBQ all evening', img: IMG('food-bbq'), addOn: true },
  { id: 'live-chaat', name: 'Live Chaat Station', category: 'Live Stations', unit: 'flat', price: 25000, credit: 0, desc: 'Dahi bhallay, gol gappay & papri chaat live', img: IMG('food-naan'), addOn: true },
  { id: 'dessert-station', name: 'Dessert Station', category: 'Live Stations', unit: 'flat', price: 30000, credit: 0, desc: 'Curated dessert counter with live plating', img: IMG('food-dessert'), addOn: true },
  // Decoration & services
  { id: 'premium-stage', name: 'Premium Stage Decoration', category: 'Decoration & Services', unit: 'flat', price: 85000, credit: 0, desc: 'Designer stage with florals & backdrop', img: IMG('venue-noor-palace'), addOn: true },
  { id: 'floral-decor', name: 'Floral Decoration', category: 'Decoration & Services', unit: 'flat', price: 60000, credit: 0, desc: 'Fresh floral entrance & table arrangements', img: IMG('venue-ivory-gardens'), addOn: true },
  { id: 'sound-lighting', name: 'Sound & Lighting', category: 'Decoration & Services', unit: 'flat', price: 40000, credit: 0, desc: 'Professional audio, intelligent lighting', img: IMG('venue-crescent-royale'), addOn: true },
  { id: 'generator', name: 'Generator / Power Backup', category: 'Decoration & Services', unit: 'flat', price: 25000, credit: 0, desc: 'Full-event standby generator', img: IMG('venue-mehran-grand'), addOn: true },
];

export function seedMenuItems(): MenuItem[] {
  return ITEM_DEFS.map(d => ({
    id: d.id, name: d.name, category: d.category, unit: d.unit, price: d.price,
    creditPerGuest: d.credit, description: d.desc, image: d.img,
    addOnOnly: !!d.addOn, enabled: true,
  }));
}

export function seedPackages(): MenuPackage[] {
  return [
    {
      id: 'basic', name: 'Basic', tagline: 'Essential wedding feast', pricePerGuest: 1800,
      description: 'A hearty, no-fuss wedding menu covering all the classics your guests expect.',
      image: IMG('food-biryani'), badge: 'Value pick', enabled: true,
      included: ['chicken-qorma', 'chicken-biryani', 'roghni-naan', 'raita', 'fresh-salad', 'gulab-jamun'],
    },
    {
      id: 'standard', name: 'Standard', tagline: 'The balanced celebration', pricePerGuest: 2500,
      description: 'Adds a BBQ starter and richer mains — our most booked package for Barats.',
      image: IMG('food-karahi'), enabled: true,
      included: ['chicken-karahi', 'chicken-biryani', 'chicken-tikka', 'roghni-naan', 'raita', 'fresh-salad', 'kheer'],
    },
    {
      id: 'premium', name: 'Premium', tagline: 'Elevated flavours', pricePerGuest: 3500,
      description: 'Mutton mains, a BBQ duo and double desserts for a memorable Walima.',
      image: IMG('food-bbq'), badge: 'Most popular', enabled: true,
      included: ['chicken-handi', 'mutton-qorma', 'chicken-biryani', 'seekh-kebab', 'malai-boti', 'roghni-naan', 'raita', 'fresh-salad', 'shahi-tukray', 'gulab-jamun'],
    },
    {
      id: 'vip', name: 'VIP', tagline: 'For grand occasions', pricePerGuest: 5000,
      description: 'Premium proteins, triple BBQ and a dessert trio — made for large Barats.',
      image: IMG('food-bbq'), enabled: true,
      included: ['mutton-kunna', 'beef-karahi', 'chicken-karahi', 'seekh-kebab', 'reshmi-kebab', 'fish-fry', 'chicken-biryani', 'roghni-naan', 'raita', 'fresh-salad', 'mint-chutney', 'gajar-halwa', 'fruit-trifle'],
    },
    {
      id: 'luxury', name: 'Luxury', tagline: 'The ultimate experience', pricePerGuest: 7000,
      description: 'An expanded gourmet spread with live-station options for once-in-a-lifetime events.',
      image: IMG('food-dessert'), badge: 'Signature', enabled: true,
      included: ['mutton-kunna', 'mutton-qorma', 'beef-karahi', 'chicken-handi', 'seekh-kebab', 'malai-boti', 'reshmi-kebab', 'chicken-biryani', 'chicken-pulao', 'roghni-naan', 'raita', 'fresh-salad', 'mint-chutney', 'shahi-tukray', 'gajar-halwa', 'firni'],
    },
  ];
}

export function seedVenues(): Venue[] {
  return [
    {
      id: 'noor-palace', name: 'Noor Palace Marquee', city: 'Lahore', area: 'DHA Phase 5',
      type: 'Marquee', config: 'Indoor + Outdoor',
      description: 'Lahore\u2019s most photographed marquee — a soaring draped hall with crystal chandeliers, a grand floral stage and manicured arrival lawns. Built for Barats of 500+.',
      minGuests: 300, maxGuests: 1200,
      eventTypes: ['Barat', 'Walima', 'Mehndi', 'Reception', 'Engagement'],
      amenities: ['Valet Parking', 'Bridal Suite', 'In-house Catering', 'Power Backup', 'Central AC', 'Prayer Area', 'Stage & Lighting', 'Security'],
      hallRental: { lunch: 150000, afternoon: 180000, evening: 250000 },
      image: IMG('venue-noor-palace'), gallery: [IMG('venue-noor-palace'), IMG('venue-ivory-gardens'), IMG('venue-mehran-grand')],
      featured: true,
    },
    {
      id: 'emerald-crown', name: 'Emerald Crown Banquets', city: 'Karachi', area: 'Clifton Block 2',
      type: 'Banquet Hall', config: 'Indoor',
      description: 'A modern Clifton banquet hall with deep-green interiors, champagne detailing and flawless air-conditioning — Karachi\u2019s reliable choice for Walimas.',
      minGuests: 200, maxGuests: 800,
      eventTypes: ['Barat', 'Walima', 'Nikah', 'Reception', 'Engagement'],
      amenities: ['Valet Parking', 'Bridal Suite', 'In-house Catering', 'Central AC', 'Prayer Area', 'Sound System', 'Wheelchair Access', 'Security'],
      hallRental: { lunch: 120000, afternoon: 140000, evening: 200000 },
      image: IMG('venue-emerald-crown'), gallery: [IMG('venue-emerald-crown'), IMG('venue-crescent-royale'), IMG('venue-pearl-vista')],
      featured: true,
    },
    {
      id: 'royal-courtyard', name: 'Royal Courtyard Lawns', city: 'Islamabad', area: 'Margalla Road',
      type: 'Lawn', config: 'Outdoor',
      description: 'Fairy-lit lawns under the Margalla hills with Mughal-arch staging. Islamabad\u2019s favourite open-air venue for Mehndis and Nikahs.',
      minGuests: 400, maxGuests: 1500,
      eventTypes: ['Barat', 'Walima', 'Mehndi', 'Nikah', 'Reception'],
      amenities: ['Valet Parking', 'Power Backup', 'Prayer Area', 'Stage & Lighting', 'Decor Panel', 'Guest Wi-Fi', 'Security'],
      hallRental: { lunch: 180000, afternoon: 200000, evening: 280000 },
      image: IMG('venue-royal-courtyard'), gallery: [IMG('venue-royal-courtyard'), IMG('venue-zariya-estate'), IMG('venue-ivory-gardens')],
      featured: true,
    },
    {
      id: 'mehran-grand', name: 'Mehran Grand Marquee', city: 'Rawalpindi', area: 'Bahria Town Phase 4',
      type: 'Marquee', config: 'Indoor + Outdoor',
      description: 'A regal marquee with a grand red-and-gold stage, serving Rawalpindi and the twin cities with full in-house catering.',
      minGuests: 250, maxGuests: 900,
      eventTypes: ['Barat', 'Walima', 'Mehndi', 'Reception', 'Engagement'],
      amenities: ['Valet Parking', 'Bridal Suite', 'In-house Catering', 'Power Backup', 'Central AC', 'Sound System', 'Security'],
      hallRental: { lunch: 100000, afternoon: 120000, evening: 170000 },
      image: IMG('venue-mehran-grand'), gallery: [IMG('venue-mehran-grand'), IMG('venue-noor-palace')],
      featured: false,
    },
    {
      id: 'pearl-vista', name: 'Pearl Vista Banquets', city: 'Faisalabad', area: 'Canal Road',
      type: 'Banquet Hall', config: 'Indoor',
      description: 'An ivory-and-pearl banquet hall on Canal Road — elegant, intimate and kind to the budget, ideal for Nikah and family Walimas.',
      minGuests: 150, maxGuests: 600,
      eventTypes: ['Barat', 'Walima', 'Nikah', 'Engagement'],
      amenities: ['In-house Catering', 'Central AC', 'Prayer Area', 'Bridal Suite', 'Wheelchair Access', 'Security'],
      hallRental: { lunch: 80000, afternoon: 95000, evening: 140000 },
      image: IMG('venue-pearl-vista'), gallery: [IMG('venue-pearl-vista'), IMG('venue-emerald-crown')],
      featured: false,
    },
    {
      id: 'zariya-estate', name: 'Zariya Wedding Estate', city: 'Gujranwala', area: 'GT Road',
      type: 'Wedding Estate', config: 'Outdoor',
      description: 'A sprawling wedding estate on GT Road with golden-hour lawns, a floral entrance arch and room for 2,000 guests. Made for legendary Barats.',
      minGuests: 500, maxGuests: 2000,
      eventTypes: ['Barat', 'Walima', 'Mehndi', 'Reception'],
      amenities: ['Valet Parking', 'Power Backup', 'Stage & Lighting', 'Decor Panel', 'Guest Wi-Fi', 'Prayer Area', 'Security'],
      hallRental: { lunch: 200000, afternoon: 230000, evening: 320000 },
      image: IMG('venue-zariya-estate'), gallery: [IMG('venue-zariya-estate'), IMG('venue-royal-courtyard')],
      featured: true,
    },
    {
      id: 'ivory-gardens', name: 'Ivory Gardens Marquee', city: 'Multan', area: 'Bosan Road',
      type: 'Marquee', config: 'Indoor + Outdoor',
      description: 'A daylight marquee wrapped in ivory florals on Bosan Road — soft, romantic and perfect for daytime Nikah ceremonies.',
      minGuests: 200, maxGuests: 700,
      eventTypes: ['Barat', 'Walima', 'Mehndi', 'Nikah', 'Engagement'],
      amenities: ['Valet Parking', 'In-house Catering', 'Power Backup', 'Central AC', 'Prayer Area', 'Decor Panel', 'Security'],
      hallRental: { lunch: 90000, afternoon: 110000, evening: 160000 },
      image: IMG('venue-ivory-gardens'), gallery: [IMG('venue-ivory-gardens'), IMG('venue-royal-courtyard')],
      featured: false,
    },
    {
      id: 'crescent-royale', name: 'Crescent Royale Banquet', city: 'Sialkot', area: 'Cantt',
      type: 'Banquet Hall', config: 'Indoor',
      description: 'Sialkot Cantt\u2019s contemporary banquet with crescent-motif staging, LED walls and sleek modern seating for polished city weddings.',
      minGuests: 180, maxGuests: 650,
      eventTypes: ['Barat', 'Walima', 'Nikah', 'Reception', 'Engagement'],
      amenities: ['Valet Parking', 'Bridal Suite', 'In-house Catering', 'Central AC', 'Sound System', 'Prayer Area', 'Security'],
      hallRental: { lunch: 85000, afternoon: 100000, evening: 150000 },
      image: IMG('venue-crescent-royale'), gallery: [IMG('venue-crescent-royale'), IMG('venue-emerald-crown')],
      featured: false,
    },
  ];
}

interface BookingDef {
  venue: string; day: number; slot: SlotId; status: Booking['status'];
  event: EventType; guests: number; name: string; note?: string;
}

const BOOKING_DEFS: BookingDef[] = [
  { venue: 'noor-palace', day: 2, slot: 'evening', status: 'booked', event: 'Barat', guests: 800, name: 'Ahmed Family' },
  { venue: 'noor-palace', day: 3, slot: 'lunch', status: 'tentative', event: 'Nikah', guests: 350, name: 'Raza Family' },
  { venue: 'noor-palace', day: 9, slot: 'evening', status: 'booked', event: 'Walima', guests: 1000, name: 'Khan Family' },
  { venue: 'noor-palace', day: 16, slot: 'evening', status: 'blocked', event: 'Barat', guests: 0, name: 'Maintenance', note: 'Annual deep-clean & chandelier service' },
  { venue: 'emerald-crown', day: 1, slot: 'evening', status: 'booked', event: 'Walima', guests: 600, name: 'Sheikh Family' },
  { venue: 'emerald-crown', day: 5, slot: 'lunch', status: 'tentative', event: 'Engagement', guests: 250, name: 'Malik Family' },
  { venue: 'emerald-crown', day: 12, slot: 'evening', status: 'booked', event: 'Barat', guests: 700, name: 'Farooq Family' },
  { venue: 'royal-courtyard', day: 4, slot: 'evening', status: 'booked', event: 'Mehndi', guests: 900, name: 'Butt Family' },
  { venue: 'royal-courtyard', day: 6, slot: 'afternoon', status: 'tentative', event: 'Nikah', guests: 500, name: 'Iqbal Family' },
  { venue: 'royal-courtyard', day: 11, slot: 'evening', status: 'booked', event: 'Barat', guests: 1200, name: 'Chaudhry Family' },
  { venue: 'royal-courtyard', day: 20, slot: 'evening', status: 'blocked', event: 'Walima', guests: 0, name: 'Private Event', note: 'Corporate booking — lawn closed' },
  { venue: 'mehran-grand', day: 2, slot: 'lunch', status: 'inquiry', event: 'Nikah', guests: 300, name: 'Hussain Family' },
  { venue: 'mehran-grand', day: 7, slot: 'evening', status: 'booked', event: 'Barat', guests: 750, name: 'Abbas Family' },
  { venue: 'mehran-grand', day: 14, slot: 'evening', status: 'tentative', event: 'Walima', guests: 600, name: 'Qureshi Family' },
  { venue: 'pearl-vista', day: 3, slot: 'evening', status: 'booked', event: 'Walima', guests: 450, name: 'Anwar Family' },
  { venue: 'pearl-vista', day: 10, slot: 'lunch', status: 'booked', event: 'Nikah', guests: 200, name: 'Siddiqui Family' },
  { venue: 'zariya-estate', day: 5, slot: 'evening', status: 'booked', event: 'Barat', guests: 1500, name: 'Gujjar Family' },
  { venue: 'zariya-estate', day: 8, slot: 'evening', status: 'tentative', event: 'Walima', guests: 1300, name: 'Waraich Family' },
  { venue: 'zariya-estate', day: 18, slot: 'evening', status: 'booked', event: 'Barat', guests: 1800, name: 'Cheema Family' },
  { venue: 'ivory-gardens', day: 4, slot: 'lunch', status: 'booked', event: 'Nikah', guests: 400, name: 'Bukhari Family' },
  { venue: 'ivory-gardens', day: 13, slot: 'afternoon', status: 'tentative', event: 'Mehndi', guests: 350, name: 'Gilani Family' },
  { venue: 'crescent-royale', day: 6, slot: 'evening', status: 'booked', event: 'Barat', guests: 550, name: 'Bajwa Family' },
  { venue: 'crescent-royale', day: 9, slot: 'lunch', status: 'inquiry', event: 'Engagement', guests: 220, name: 'Sandhu Family' },
  { venue: 'crescent-royale', day: 22, slot: 'evening', status: 'blocked', event: 'Reception', guests: 0, name: 'Renovation', note: 'Stage LED wall upgrade' },
];

export function seedBookings(): Booking[] {
  return BOOKING_DEFS.map((b, i) => ({
    id: `bk-${i + 1}`,
    venueId: b.venue,
    date: isoPlus(b.day),
    slot: b.slot,
    status: b.status,
    eventType: b.event,
    guests: b.guests,
    customerName: b.name,
    note: b.note,
  }));
}

export function seedInquiries(): Inquiry[] {
  const mk = (
    n: number, name: string, phone: string, city: string, event: EventType, day: number,
    slot: SlotId, guests: number, venueId: string | undefined, packageId: string | undefined,
    estimate: number, status: Inquiry['status'], notes?: string,
  ): Inquiry => ({
    ref: `SS-2026-${1000 + n}`,
    name, phone, city, eventType: event, date: isoPlus(day), slot, guests,
    venueId, packageId, customMenu: !packageId, estimate, status, notes,
    createdAt: new Date(Date.now() - n * 86400000 * 1.7).toISOString(),
  });
  return [
    mk(1, 'Ayesha Raza', '0321-4567890', 'Lahore', 'Barat', 9, 'evening', 800, 'noor-palace', 'premium', 3150000, 'Quoted'),
    mk(2, 'Bilal Sheikh', '0333-2345678', 'Karachi', 'Walima', 12, 'evening', 600, 'emerald-crown', 'vip', 3400000, 'Contacted'),
    mk(3, 'Fatima Butt', '0300-9876543', 'Islamabad', 'Mehndi', 4, 'evening', 900, 'royal-courtyard', 'standard', 2680000, 'New'),
    mk(4, 'Usman Chaudhry', '0345-1122334', 'Gujranwala', 'Barat', 18, 'evening', 1500, 'zariya-estate', 'luxury', 11200000, 'Confirmed'),
    mk(5, 'Hina Abbas', '0315-6677889', 'Rawalpindi', 'Nikah', 7, 'lunch', 300, 'mehran-grand', 'basic', 720000, 'New'),
    mk(6, 'Danish Anwar', '0322-4455667', 'Faisalabad', 'Walima', 10, 'lunch', 200, 'pearl-vista', 'standard', 640000, 'Lost', 'Chose a family farmhouse instead.'),
    mk(7, 'Sana Iqbal', '0334-7788990', 'Multan', 'Nikah', 13, 'afternoon', 350, 'ivory-gardens', undefined, 980000, 'Quoted', 'Custom menu — extra desserts.'),
    mk(8, 'Kamran Bajwa', '0301-2233445', 'Sialkot', 'Barat', 22, 'evening', 550, 'crescent-royale', 'premium', 2260000, 'Contacted'),
    mk(9, 'Mahnoor Khan', '0346-9988776', 'Lahore', 'Walima', 16, 'evening', 1000, 'noor-palace', 'vip', 5450000, 'New'),
    mk(10, 'Fahad Malik', '0320-5566778', 'Kharian', 'Engagement', 5, 'lunch', 250, 'emerald-crown', 'standard', 760000, 'New'),
  ];
}

export function seedPromotions(): Promotion[] {
  return [
    {
      id: 'weekday-wonder', name: 'Weekday Wonder', kind: 'weekday',
      description: '10% off food & hall for Mon–Thu events with 200+ guests.',
      percent: 10, weekdays: [1, 2, 3, 4], minGuests: 200, active: true,
    },
    {
      id: 'lunch-delight', name: 'Lunch Delight', kind: 'lunch',
      description: '5% off lunch-slot events (12:00–16:00) with 150+ guests.',
      percent: 5, slots: ['lunch'], minGuests: 150, active: true,
    },
    {
      id: 'grand-gathering', name: 'Grand Gathering', kind: 'min_guests',
      description: '6% off for grand events of 800+ guests, any day or slot.',
      percent: 6, minGuests: 800, active: true,
    },
    {
      id: 'season-saver', name: 'Shaadi Season Saver', kind: 'date_range',
      description: '8% off events booked in the coming peak window.',
      percent: 8, from: isoPlus(14), to: isoPlus(75), active: true,
    },
  ];
}
