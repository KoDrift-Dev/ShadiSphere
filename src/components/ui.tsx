// Reusable design-system components.
import React from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { todayISO, fmtDate } from '../lib/format';

/** Fade-up reveal on scroll into view. Use around section content and card grids. */
export function Reveal({ children, delay = 0, y = 22, className, style }: {
  children: React.ReactNode; delay?: number; y?: number; className?: string; style?: React.CSSProperties;
}) {
  return (
    <motion.div
      className={className} style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Stagger container — wrap a grid; each child should be a <StaggerItem>. */
export function Stagger({ children, className, style, gap = 0.08 }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties; gap?: number;
}) {
  return (
    <motion.div
      className={className} style={style}
      initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, style }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  return (
    <motion.div
      className={className} style={style}
      variants={{ hidden: { opacity: 0, y: 26 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } }}
    >
      {children}
    </motion.div>
  );
}

export function Btn({
  to, href, variant = 'primary', size, block, children, onClick, disabled, type, target,
}: {
  to?: string; href?: string; variant?: 'primary' | 'gold' | 'outline' | 'ghost' | 'light' | 'dark' | 'danger';
  size?: 'sm' | 'lg'; block?: boolean; children: React.ReactNode;
  onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit'; target?: string;
}) {
  const cls = `btn btn-${variant}${size ? ` btn-${size}` : ''}${block ? ' btn-block' : ''}`;
  if (to) return <Link to={to} className={cls}>{children}</Link>;
  if (href) return <a href={href} className={cls} target={target} rel={target ? 'noopener noreferrer' : undefined} onClick={onClick}>{children}</a>;
  return <button type={type ?? 'button'} className={cls} onClick={onClick} disabled={disabled}>{children}</button>;
}

export function Badge({ tone, children }: { tone?: 'gold' | 'green' | 'red' | 'amber' | 'grey'; children: React.ReactNode }) {
  return <span className={`badge${tone ? ` badge-${tone}` : ''}`}>{children}</span>;
}

export function Field({
  label, hint, error, children,
}: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint && !error && <span className="hint">{hint}</span>}
      {error && <span className="field-err" role="alert">{error}</span>}
    </div>
  );
}

export function Empty({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="empty">
      <div className="big">{title}</div>
      {body && <p>{body}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

export function Modal({ title, onClose, children, wide, footer }: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean; footer?: React.ReactNode;
}) {
  React.useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', h);
    };
  }, [onClose]);
  return (
    <div className="modal-veil" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal" style={wide ? { maxWidth: 680 } : undefined} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="modal-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Qty({ value, onChange, min = 0, max = 9999 }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <span className="qty">
      <button type="button" aria-label="Decrease" onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <span className="v">{value}</span>
      <button type="button" aria-label="Increase" onClick={() => onChange(Math.min(max, value + 1))}>+</button>
    </span>
  );
}

export function PageHead({ eyebrow, title, lead, center }: {
  eyebrow?: string; title: string; lead?: string; center?: boolean;
}) {
  return (
    <div className={center ? 'center' : ''} style={{ marginBottom: 28 }}>
      {eyebrow && <span className="eyebrow"><span className="rule" />{eyebrow}</span>}
      <h1 style={{ fontSize: 'clamp(30px, 4vw, 44px)' }}>{title}</h1>
      {lead && <p className="lead">{lead}</p>}
    </div>
  );
}

export function SectionHead({ eyebrow, title, lead, center, action }: {
  eyebrow?: string; title: string; lead?: string; center?: boolean; action?: React.ReactNode;
}) {
  return (
    <div className={center ? 'center' : ''} style={{ marginBottom: 34, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          {eyebrow && <span className="eyebrow"><span className="rule" />{eyebrow}</span>}
          <h2 style={{ fontSize: 'clamp(26px, 3.2vw, 36px)', marginBottom: 6 }}>{title}</h2>
          {lead && <p className="lead" style={{ marginBottom: 0 }}>{lead}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}

export function Img({ src, alt, className, style }: { src: string; alt: string; className?: string; style?: React.CSSProperties }) {
  const [err, setErr] = React.useState(false);
  if (err) {
    return (
      <div className={className} style={{ ...style, background: 'linear-gradient(135deg,#1E4D3F,#2A6353)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E3C77E', fontFamily: 'Georgia, serif', fontSize: 22, minHeight: 120 }} aria-label={alt}>
        ShadiSphere
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} style={style} onError={() => setErr(true)} loading="lazy" />;
}

export function Confirm({ title, body, confirmLabel, onConfirm, onCancel }: {
  title: string; body: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p>{body}</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
        <Btn variant="outline" onClick={onCancel}>Cancel</Btn>
        <Btn variant="danger" onClick={onConfirm}>{confirmLabel}</Btn>
      </div>
    </Modal>
  );
}
/** Theme-styled mini month calendar picker — drop-in replacement for <input type="date">.
 *  Renders in a portal with smart flip so it is never cut off by overflow or viewport edges. */
export function MiniCalendar({ value, onChange, minDate, ariaLabel }: {
  value: string; onChange: (iso: string) => void; minDate?: string; ariaLabel?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const popRef = React.useRef<HTMLDivElement>(null);
  const min = minDate === undefined ? todayISO() : minDate;
  const [view, setView] = React.useState(() => {
    const src = value && (!min || value >= min) ? value : (min || todayISO());
    const [y, m] = src.split('-').map(Number);
    return { y: y || new Date().getFullYear(), m: (m || 1) - 1 };
  });
  const first = new Date(view.y, view.m, 1);
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(first.getDay()).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const iso = (d: number) =>
    `${view.y}-${String(view.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const shift = (dir: number) =>
    setView(v => {
      const m = v.m + dir;
      return { y: v.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 };
    });

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const estH = 350;
      const below = window.innerHeight - r.bottom;
      const up = below < estH + 12 && r.top > estH + 12;
      const popW = Math.min(290, window.innerWidth - 16);
      setPos({
        left: Math.max(8, Math.min(r.left, window.innerWidth - popW - 8)),
        top: up ? Math.max(8, r.top - estH - 8) : r.bottom + 8,
      });
    }
    setOpen(o => !o);
  };

  // Measure after render and correct any viewport overflow.
  React.useEffect(() => {
    if (!open || !popRef.current) return;
    const r = popRef.current.getBoundingClientRect();
    setPos(p => {
      if (!p) return p;
      let { top, left } = p;
      if (r.bottom > window.innerHeight - 8) {
        const b = btnRef.current?.getBoundingClientRect();
        top = Math.max(8, (b ? b.top : window.innerHeight - r.height - 16) - r.height - 8);
      }
      if (r.right > window.innerWidth - 8) left = Math.max(8, window.innerWidth - r.width - 8);
      return { top, left };
    });
  }, [open]);

  // Close on scroll/resize so the fixed popup never detaches from its field.
  React.useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open ]);

  return (
    <div className="mini-cal-wrap">
      <button
        ref={btnRef}
        type="button" className="input mini-cal-btn"
        onClick={toggle} aria-haspopup="dialog" aria-expanded={open}
        aria-label={ariaLabel || 'Choose date'}
      >
        <span>{value ? fmtDate(value) : 'Select date'}</span>
        <span aria-hidden="true" style={{ color: 'var(--color-pine-600)' }}>📅</span>
      </button>
      {open && pos && createPortal(
        <>
          <div className="mini-cal-veil" onClick={() => setOpen(false)} />
          <div ref={popRef} className="mini-cal-pop" role="dialog" aria-label={ariaLabel || 'Choose date'}
            style={{ top: pos.top, left: pos.left }}>
            <div className="mini-cal-head">
              <button type="button" className="mini-cal-nav" onClick={() => shift(-1)} aria-label="Previous month">‹</button>
              <strong>{first.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</strong>
              <button type="button" className="mini-cal-nav" onClick={() => shift(1)} aria-label="Next month">›</button>
            </div>
            <div className="mini-cal-grid mini-cal-dow" aria-hidden="true">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i}>{d}</span>)}
            </div>
            <div className="mini-cal-grid">
              {cells.map((d, i) => d === null ? <span key={`e${i}`} /> : (
                <button
                  key={d} type="button" disabled={!!min && iso(d) < min}
                  className={`mini-cal-day${iso(d) === value ? ' sel' : ''}${iso(d) === todayISO() ? ' today' : ''}`}
                  onClick={() => { onChange(iso(d)); setOpen(false); }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

/** Theme-styled dropdown — custom popup like MiniCalendar, because the native
 *  option list is drawn by the OS and cannot be styled. Drop-in for <select>:
 *  keep <option> children, onChange receives the chosen value directly. */
export function Select({ value, onChange, children, ariaLabel, className }: {
  value: string; onChange: (value: string) => void; children: React.ReactNode;
  ariaLabel?: string; className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState<{ top: number; left: number; width: number } | null>(null);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const popRef = React.useRef<HTMLDivElement>(null);

  const opts = React.useMemo(() =>
    React.Children.toArray(children)
      .filter(React.isValidElement)
      .map(c => {
        const pr = (c as React.ReactElement<any>).props;
        const kids = Array.isArray(pr.children) ? pr.children.join('') : pr.children;
        return {
          value: pr.value === undefined ? String(kids ?? '') : String(pr.value),
          label: String(kids ?? ''),
          disabled: !!pr.disabled,
        };
      }), [children]);
  const current = opts.find(o => o.value === value);

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const estH = Math.min(308, 12 + opts.length * 38);
      const below = window.innerHeight - r.bottom;
      const up = below < estH + 12 && r.top > estH + 12;
      const popWidth = Math.min(Math.max(r.width, 180), window.innerWidth - 16);
      setPos({
        left: Math.max(8, Math.min(r.left, window.innerWidth - popWidth - 8)),
        width: popWidth,
        top: up ? Math.max(8, r.top - estH - 8) : r.bottom + 8,
      });
    }
    setOpen(o => !o);
  };

  // Measure after render and correct any viewport overflow.
  React.useEffect(() => {
    if (!open || !popRef.current) return;
    const r = popRef.current.getBoundingClientRect();
    setPos(p => {
      if (!p) return p;
      let { top, left, width } = p;
      if (r.bottom > window.innerHeight - 8) {
        const b = btnRef.current?.getBoundingClientRect();
        top = Math.max(8, (b ? b.top : window.innerHeight - r.height - 16) - r.height - 8);
      }
      if (r.right > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - r.width - 8);
      }
      width = Math.min(width, window.innerWidth - 16);
      return { top, left, width };
    });
  }, [open]);

  // Close on scroll / resize / Escape.
  React.useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('keydown', esc);
    };
  }, [open ]);

  return (
    <>
      <button
        ref={btnRef} type="button"
        className={`select-btn${className ? ` ${className}` : ''}`}
        onClick={toggle} aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel}
      >
        <span className={`select-val${current ? '' : ' placeholder'}`}>{current ? current.label : 'Select'}</span>
        <svg className="select-chev" width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && pos && createPortal(
        <>
          <div className="select-veil" onClick={() => setOpen(false)} />
          <div ref={popRef} className="select-pop" role="listbox" aria-label={ariaLabel}
            style={{ top: pos.top, left: pos.left, width: pos.width }}>
            {opts.map(o => (
              <button
                key={`${o.value}∷${o.label}`} type="button" role="option"
                aria-selected={o.value === value} disabled={o.disabled}
                className={`select-opt${o.value === value ? ' sel' : ''}`}
                onClick={() => { onChange(o.value); setOpen(false); }}
              >
                <span className="select-check" aria-hidden="true">{o.value === value ? '✓' : ''}</span>
                <span>{o.label}</span>
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </>
  );
}
