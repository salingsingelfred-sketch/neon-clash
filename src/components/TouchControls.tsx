import { useEffect, useRef, useState } from 'react';
import type { InputState } from '../game/types';

type Key = keyof InputState;

function Pad({
  onSet,
  k,
  label,
  sub,
  color,
  size = 68,
  disabled,
}: {
  onSet: (k: Key, v: boolean) => void;
  k: Key;
  label: string;
  sub?: string;
  color: string;
  size?: number;
  disabled?: boolean;
}) {
  const [down, setDown] = useState(false);
  const idRef = useRef<number | null>(null);
  return (
    <button
      aria-label={label}
      className="pointer-events-auto relative grid touch-none select-none place-items-center rounded-full border font-display font-black uppercase leading-none"
      style={{
        width: size,
        height: size,
        borderColor: down ? color : `${color}77`,
        background: down
          ? `radial-gradient(circle at 50% 40%, ${color}66, ${color}18)`
          : `radial-gradient(circle at 50% 35%, ${color}26, rgba(10,6,22,0.55))`,
        boxShadow: down
          ? `0 0 26px -2px ${color}, inset 0 0 18px -6px ${color}`
          : `0 6px 18px -10px ${color}, inset 0 1px 0 ${color}33`,
        color: down ? '#fff' : `${color}`,
        transform: down ? 'scale(0.93)' : 'scale(1)',
        transition: 'transform 0.08s ease, box-shadow 0.12s ease',
        opacity: disabled ? 0.35 : 0.92,
      }}
      onPointerDown={(e) => {
        e.preventDefault();
        idRef.current = e.pointerId;
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        setDown(true);
        onSet(k, true);
      }}
      onPointerUp={() => {
        setDown(false);
        onSet(k, false);
      }}
      onPointerCancel={() => {
        setDown(false);
        onSet(k, false);
      }}
      onLostPointerCapture={() => {
        setDown(false);
        onSet(k, false);
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span style={{ fontSize: size > 60 ? 20 : 16 }}>{label}</span>
      {sub && <span className="mt-0.5 text-[7px] tracking-[0.15em] opacity-70">{sub}</span>}
    </button>
  );
}

export function TouchControls({
  onSet,
  energy,
  skillName,
}: {
  onSet: (k: Key, v: boolean) => void;
  energy: number;
  skillName: string;
}) {
  const ready = energy >= 100;
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // hide on devices with no touch support
    const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setVisible(touch);
  }, []);

  if (!visible) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between px-3 pb-4 sm:px-6">
      <div className="pointer-events-none relative">
        <div className="flex items-end gap-2">
          <Pad onSet={onSet} k="left" label="◀" color="#7dd3fc" size={72} />
          <Pad onSet={onSet} k="right" label="▶" color="#7dd3fc" size={72} />
        </div>
      </div>

      <div className="pointer-events-none flex items-end gap-2">
        <div className="flex flex-col items-center gap-2">
          <Pad onSet={onSet} k="block" label="⛨" sub="guard" color="#94a3b8" size={54} />
          <Pad onSet={onSet} k="dash" label="»" sub="dash" color="#c4b5fd" size={58} />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <Pad
              onSet={onSet}
              k="special"
              label="◆"
              sub="special"
              color={ready ? '#fde047' : '#64748b'}
              size={66}
              disabled={!ready}
            />
            <svg className="pointer-events-none absolute -inset-1" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke={ready ? '#fde047' : '#7dd3fc'}
                strokeWidth="3"
                strokeDasharray={`${(Math.min(100, energy) / 100) * 289} 289`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                opacity={0.85}
              />
            </svg>
            {ready && (
              <span className="animate-pulse-glow pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-display text-[8px] font-bold tracking-widest text-amber-200">
                {skillName}
              </span>
            )}
          </div>
          <Pad onSet={onSet} k="up" label="▲" sub="jump" color="#86efac" size={58} />
        </div>
        <Pad onSet={onSet} k="attack" label="✦" sub="strike" color="#fb7185" size={82} />
      </div>
    </div>
  );
}
