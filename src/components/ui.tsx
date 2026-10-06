import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

export function NeonButton({
  children,
  onClick,
  color = '#a78bfa',
  size = 'md',
  className,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}) {
  const sizes = {
    sm: 'px-4 py-2 text-[11px]',
    md: 'px-6 py-3 text-xs',
    lg: 'px-9 py-4 text-sm',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'btn-neon relative overflow-hidden rounded-xl border font-display font-bold uppercase',
        'tracking-[0.18em] text-white disabled:cursor-not-allowed disabled:opacity-40',
        sizes[size],
        className,
      )}
      style={{
        borderColor: `${color}88`,
        background: `linear-gradient(180deg, ${color}33, ${color}12)`,
        boxShadow: `0 0 0 1px ${color}22, 0 8px 26px -10px ${color}, inset 0 1px 0 ${color}44`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 0 0 1px ${color}, 0 12px 34px -8px ${color}, inset 0 1px 0 ${color}66`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `0 0 0 1px ${color}22, 0 8px 26px -10px ${color}, inset 0 1px 0 ${color}44`;
      }}
    >
      {children}
    </button>
  );
}

export function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.max(4, Math.min(100, (value / max) * 100));
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 shrink-0 text-[9px] font-semibold uppercase tracking-widest text-white/45">{label}</span>
      <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}` }}
        />
      </div>
    </div>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('glass rounded-2xl', className)}>{children}</div>;
}
