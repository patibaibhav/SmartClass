import React, { useState, useEffect } from 'react';

// ─── Badge ──────────────────────────────────────────────────────────
type BadgeVariant = 'present' | 'absent' | 'regular' | 'substitute' | 'extra' | 'cancelled'
  | 'submitted' | 'late' | 'graded' | 'upcoming' | 'completed' | 'open' | 'in-progress'
  | 'resolved' | 'closed' | 'pending' | 'overdue' | 'available' | 'occupied'
  | 'warning' | 'info' | 'success' | 'danger' | 'default' | 'college' | 'course' | 'events'
  | 'under-review' | 'assigned';

const BADGE_STYLES: Record<string, string> = {
  present: 'bg-[#e6f4ec] text-[#1a6b3c] border border-[#c0e0cd]',
  absent: 'bg-[#fdf0f0] text-[#b04040] border border-[#f0c8c8]',
  regular: 'bg-[#eaf3f8] text-[#2F4F3A] border border-[#c4dde8]',
  substitute: 'bg-[#fdf6e0] text-[#7a6000] border border-[#f0df90]',
  extra: 'bg-[#f0eaf8] text-[#5a3a8a] border border-[#d8c8f0]',
  cancelled: 'bg-[#f5f0eb] text-[#7a6040] border border-[#e0d4c0]',
  submitted: 'bg-[#eaf3f8] text-[#2a6a82] border border-[#c4dde8]',
  late: 'bg-[#fdf6e0] text-[#7a6000] border border-[#f0df90]',
  graded: 'bg-[#e6f4ec] text-[#1a6b3c] border border-[#c0e0cd]',
  upcoming: 'bg-[#fdf6e0] text-[#7a6000] border border-[#f0df90]',
  completed: 'bg-[#f5f0eb] text-[#7a6040] border border-[#e0d4c0]',
  open: 'bg-[#eaf3f8] text-[#2a6a82] border border-[#c4dde8]',
  'in-progress': 'bg-[#fdf6e0] text-[#7a6000] border border-[#f0df90]',
  resolved: 'bg-[#e6f4ec] text-[#1a6b3c] border border-[#c0e0cd]',
  closed: 'bg-[#f0f0f0] text-[#555] border border-[#ddd]',
  pending: 'bg-[#fdf6e0] text-[#7a6000] border border-[#f0df90]',
  overdue: 'bg-[#fdf0f0] text-[#b04040] border border-[#f0c8c8]',
  available: 'bg-[#e6f4ec] text-[#1a6b3c] border border-[#c0e0cd]',
  occupied: 'bg-[#fdf0f0] text-[#b04040] border border-[#f0c8c8]',
  warning: 'bg-[#fdf6e0] text-[#7a6000] border border-[#f0df90]',
  info: 'bg-[#eaf3f8] text-[#2a6a82] border border-[#c4dde8]',
  success: 'bg-[#e6f4ec] text-[#1a6b3c] border border-[#c0e0cd]',
  danger: 'bg-[#fdf0f0] text-[#b04040] border border-[#f0c8c8]',
  default: 'bg-[#f5f0eb] text-[#6b5a45] border border-[#e0d4c0]',
  college: 'bg-[#eaf3f8] text-[#2a6a82] border border-[#c4dde8]',
  course: 'bg-[#f0eaf8] text-[#5a3a8a] border border-[#d8c8f0]',
  events: 'bg-[#e6f4ec] text-[#1a6b3c] border border-[#c0e0cd]',
  'under-review': 'bg-[#fdf6e0] text-[#7a6000] border border-[#f0df90]',
  assigned: 'bg-[#eaf3f8] text-[#2a6a82] border border-[#c4dde8]',
};

export function Badge({ variant, children, className = '' }: { variant: BadgeVariant; children: React.ReactNode; className?: string }) {
  const styles = BADGE_STYLES[variant] || BADGE_STYLES.default;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles} ${className}`}>
      {children}
    </span>
  );
}

// ─── Button ─────────────────────────────────────────────────────────
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';

export function Button({
  variant = 'primary', children, onClick, disabled, className = '', size = 'md', type = 'button'
}: {
  variant?: ButtonVariant; children: React.ReactNode; onClick?: () => void;
  disabled?: boolean; className?: string; size?: 'sm' | 'md' | 'lg'; type?: 'button' | 'submit';
}) {
  const base = 'inline-flex items-center gap-2 font-medium rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7DB7C9] disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-2.5 text-sm' };
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-[#2F4F3A] text-[#F4F1E6] hover:bg-[#243B2D] active:scale-[0.98]',
    secondary: 'bg-[#E8E2D0] text-[#2F4F3A] hover:bg-[#ddd7c0] active:scale-[0.98]',
    ghost: 'bg-transparent text-[#2F4F3A] hover:bg-[#E8E2D0] active:scale-[0.98]',
    danger: 'bg-[#D98282] text-white hover:bg-[#c47070] active:scale-[0.98]',
    outline: 'bg-transparent text-[#2F4F3A] border border-[#2F4F3A] hover:bg-[#2F4F3A] hover:text-[#F4F1E6] active:scale-[0.98]',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

// ─── Card ────────────────────────────────────────────────────────────
export function Card({ children, className = '', onClick, style }: { children: React.ReactNode; className?: string; onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <div
      className={`bg-[#F5EBD7] rounded-2xl border border-[#E8E2D0] ${onClick ? 'cursor-pointer hover:border-[#2F4F3A] hover:shadow-md transition-all duration-150' : ''} ${className}`}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
}

// ─── MetricCard ──────────────────────────────────────────────────────
export function MetricCard({
  label, value, sub, icon: Icon, color = '#2F4F3A', onClick
}: {
  label: string; value: string | number; sub?: string;
  icon?: React.ElementType; color?: string; onClick?: () => void;
}) {
  return (
    <Card className="p-5" onClick={onClick}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-[#7a6a55] uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold text-[#1a2e1e]" style={{ color }}>{value}</p>
          {sub && <p className="text-xs text-[#9a8a75] mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + '18' }}>
            <Icon size={20} style={{ color }} />
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Input ───────────────────────────────────────────────────────────
export function Input({
  label, type = 'text', placeholder, value, onChange, className = '', required, hint
}: {
  label?: string; type?: string; placeholder?: string; value: string;
  onChange: (v: string) => void; className?: string; required?: boolean; hint?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider">{label}{required && <span className="text-[#D98282] ml-0.5">*</span>}</label>}
      <input
        type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)} required={required}
        className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-[#1a2e1e] text-sm placeholder:text-[#b0a090] focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] focus:border-transparent transition-all"
      />
      {hint && <p className="text-xs text-[#9a8a75]">{hint}</p>}
    </div>
  );
}

// ─── Select ──────────────────────────────────────────────────────────
export function Select({
  label, value, onChange, options, className = ''
}: {
  label?: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider">{label}</label>}
      <select
        value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-[#1a2e1e] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] focus:border-transparent transition-all appearance-none cursor-pointer"
      >
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────
export function Tabs({
  tabs, active, onChange
}: {
  tabs: string[]; active: string; onChange: (t: string) => void;
}) {
  return (
    <div className="flex gap-1 bg-[#E8E2D0] rounded-xl p-1">
      {tabs.map(tab => (
        <button
          key={tab} onClick={() => onChange(tab)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${active === tab ? 'bg-[#F5EBD7] text-[#2F4F3A] shadow-sm' : 'text-[#7a6a55] hover:text-[#2F4F3A]'}`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

// ─── Progress Bar ────────────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const c = color || (pct >= 75 ? '#2F4F3A' : pct >= 60 ? '#E8D36A' : '#D98282');
  return (
    <div className="progress-bar w-full">
      <div className="progress-fill" style={{ width: `${pct}%`, background: c }} />
    </div>
  );
}

// ─── Toast ───────────────────────────────────────────────────────────
export function Toast({ message, type = 'success', onClose }: { message: string; type?: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  const colors = { success: 'bg-[#2F4F3A] text-[#F4F1E6]', error: 'bg-[#D98282] text-white', info: 'bg-[#7DB7C9] text-white' };
  return (
    <div className={`toast fixed bottom-6 right-6 z-[100] px-5 py-3 rounded-2xl shadow-lg flex items-center gap-3 text-sm font-medium ${colors[type]}`}>
      {message}
      <button onClick={onClose} className="opacity-70 hover:opacity-100 ml-1">✕</button>
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────
export function Modal({ title, children, onClose, width = 'max-w-lg' }: { title: string; children: React.ReactNode; onClose: () => void; width?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className={`relative bg-[#F5EBD7] rounded-2xl shadow-xl w-full ${width} max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E2D0]">
          <h3 className="text-base font-bold text-[#1a2e1e]">{title}</h3>
          <button onClick={onClose} className="text-[#7a6a55] hover:text-[#1a2e1e] transition-colors">✕</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Section Header ──────────────────────────────────────────────────
export function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-xl font-bold text-[#1a2e1e]">{title}</h2>
        {sub && <p className="text-sm text-[#7a6a55] mt-0.5">{sub}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, message, sub }: { icon?: React.ElementType; message: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <div className="w-14 h-14 rounded-2xl bg-[#E8E2D0] flex items-center justify-center mb-4"><Icon size={28} className="text-[#7a6a55]" /></div>}
      <p className="text-base font-semibold text-[#4a3a2a]">{message}</p>
      {sub && <p className="text-sm text-[#9a8a75] mt-1">{sub}</p>}
    </div>
  );
}

// ─── Avatar ──────────────────────────────────────────────────────────
export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' };
  return (
    <div className={`${sizes[size]} rounded-full bg-[#2F4F3A] text-[#F4F1E6] flex items-center justify-center font-semibold shrink-0`}>
      {initials}
    </div>
  );
}

// ─── Circular Attendance ─────────────────────────────────────────────
export function CircularProgress({ value, size = 80, strokeWidth = 8 }: { value: number; size?: number; strokeWidth?: number }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (value / 100) * circ;
  const color = value >= 75 ? '#2F4F3A' : value >= 60 ? '#E8D36A' : '#D98282';
  return (
    <svg width={size} height={size} className="circular-progress">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8E2D0" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" />
    </svg>
  );
}

// ─── Attendance Status Toggle ────────────────────────────────────────
export function AttendanceToggle({ value, onChange }: { value: 'P' | 'A'; onChange: (v: 'P' | 'A') => void }) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-[#E8E2D0]">
      <button
        onClick={() => onChange('P')}
        className={`px-3 py-1.5 text-xs font-semibold transition-colors ${value === 'P' ? 'bg-[#2F4F3A] text-[#F4F1E6]' : 'bg-[#F4F1E6] text-[#7a6a55] hover:bg-[#E8E2D0]'}`}
      >P</button>
      <button
        onClick={() => onChange('A')}
        className={`px-3 py-1.5 text-xs font-semibold transition-colors ${value === 'A' ? 'bg-[#D98282] text-white' : 'bg-[#F4F1E6] text-[#7a6a55] hover:bg-[#E8E2D0]'}`}
      >A</button>
    </div>
  );
}
