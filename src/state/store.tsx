// Shared demo state: single source of truth, persisted to localStorage.
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  Booking, CalcDraft, Inquiry, MenuItem, MenuPackage, Promotion, Venue,
} from '../data/types';
import { seedBookings, seedInquiries, seedMenuItems, seedPackages, seedPromotions, seedVenues } from '../data/seed';
import { todayISO } from '../lib/format';

export interface DemoState {
  version: number;
  seededAt: string;
  venues: Venue[];
  menuItems: MenuItem[];
  packages: MenuPackage[];
  bookings: Booking[];
  inquiries: Inquiry[];
  promotions: Promotion[];
  whatsappNumber: string; // digits only; empty => operator enters it
}

const LS_KEY = 'shadisphere_demo_v3';
const CALC_KEY = 'shadisphere_calc_v3';
const VERSION = 3;

function freshState(): DemoState {
  return {
    version: VERSION,
    seededAt: new Date().toISOString(),
    venues: seedVenues(),
    menuItems: seedMenuItems(),
    packages: seedPackages(),
    bookings: seedBookings(),
    inquiries: seedInquiries(),
    promotions: seedPromotions(),
    whatsappNumber: '',
  };
}

function loadState(): DemoState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return freshState();
    const s = JSON.parse(raw) as DemoState;
    if (s.version !== VERSION || !Array.isArray(s.venues) || !Array.isArray(s.bookings)) {
      return freshState();
    }
    // Re-seed if data is older than 45 days so demo dates stay in the future.
    const ageDays = (Date.now() - new Date(s.seededAt).getTime()) / 86400000;
    if (ageDays > 45) return freshState();
    return s;
  } catch {
    return freshState();
  }
}

export function defaultCalc(): CalcDraft {
  return {
    city: 'Lahore',
    eventType: 'Barat',
    venueId: undefined,
    guests: 400,
    date: todayISO(),
    slot: 'evening',
    packageId: 'premium',
    removed: [],
    added: [],
  };
}

function loadCalc(): CalcDraft {
  try {
    const raw = localStorage.getItem(CALC_KEY);
    if (!raw) return defaultCalc();
    const c = JSON.parse(raw) as CalcDraft;
    if (typeof c.guests !== 'number') return defaultCalc();
    return { ...defaultCalc(), ...c };
  } catch {
    return defaultCalc();
  }
}

interface StoreCtx {
  state: DemoState;
  update: (fn: (s: DemoState) => DemoState) => void;
  resetDemo: () => void;
  calc: CalcDraft;
  setCalc: (fn: (c: CalcDraft) => CalcDraft) => void;
  toast: (msg: string) => void;
}

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoState>(loadState);
  const [calc, setCalcState] = useState<CalcDraft>(loadCalc);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);
  useEffect(() => {
    try { localStorage.setItem(CALC_KEY, JSON.stringify(calc)); } catch { /* ignore */ }
  }, [calc]);

  const toast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 2600);
  };

  const ctx = useMemo<StoreCtx>(() => ({
    state,
    update: fn => setState(s => fn(s)),
    resetDemo: () => {
      const f = freshState();
      // Preserve the operator's WhatsApp number across resets.
      f.whatsappNumber = state.whatsappNumber;
      setState(f);
      setCalcState(defaultCalc());
      toast('Demo data restored to original sample state.');
    },
    calc,
    setCalc: fn => setCalcState(c => fn(c)),
    toast,
  }), [state, calc]);

  return (
    <Ctx.Provider value={ctx}>
      {children}
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
    </Ctx.Provider>
  );
}

export function useStore(): StoreCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useStore must be used inside StoreProvider');
  return c;
}
