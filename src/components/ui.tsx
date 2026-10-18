// Reusable design-system components.
import React from 'react';
import { Link } from 'react-router-dom';

export function Btn({
  to, href, variant = 'primary', size, block, children, onClick, disabled, type, target,
}: {
  to?: string; href?: string; variant?: 'primary' | 'gold' | 'outline' | 'ghost' | 'light' | 'danger';
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

export function Modal({ title, onClose, children, wide }: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
  React.useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="modal-veil" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal" style={wide ? { maxWidth: 860 } : undefined} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="modal-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">{children}</div>
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
