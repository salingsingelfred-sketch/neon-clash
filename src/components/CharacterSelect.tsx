
import { useEffect, useRef, useState } from 'react';
import { CHARACTERS, type CharacterDef } from '../game/characters';
import { previewFighter, renderPreview } from '../game/preview';
import { sfx } from '../game/audio';
import { NeonButton, StatBar } from './ui';
import { cn } from '../utils/cn';

function FighterCanvas({ def, size = 168 }: { def: CharacterDef; size?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const fRef = useRef(previewFighter(def));
  useEffect(() => {
    fRef.current = previewFighter(def);
  }, [def]);
  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cvs.width = size * dpr;
    cvs.height = size * 1.2 * dpr;
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderPreview(ctx, def, fRef.current, performance.now() / 1000, size, size * 1.2);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [def, size]);
  return <canvas ref={ref} style={{ width: size, height: size * 1.2 }} className="pointer-events-none" />;
}

export function CharacterSelect({
  onPick,
  onBack,
  best,
}: {
  onPick: (id: string) => void;
  onBack: () => void;
  best: number;
}) {
  const [sel, setSel] = useState<string>(CHARACTERS[0].id);
  const selected = CHARACTERS.find((c) => c.id === sel) ?? CHARACTERS[0];

  const pick = (id: string) => {
    sfx.resume();
    sfx.ui();
    setSel(id);
  };

  return (
    <div className="relative flex min-h-full flex-col px-3 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="btn-neon rounded-lg border border-white/15 bg-white/5 px-3 py-2 font-display text-[10px] font-bold uppercase tracking-[0.2em] text-white/70"
          >
            ← Back
          </button>
          <div className="text-center">
            <h2 className="font-display text-lg font-black uppercase tracking-[0.3em] text-white/90 sm:text-2xl">
              Choose Champion
            </h2>
            <p className="font-display text-[9px] uppercase tracking-[0.3em] text-white/40">
              9 rivals await · record {best.toLocaleString()}
            </p>
          </div>
          <div className="w-[74px]" />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_300px]">
          {/* grid */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
            {CHARACTERS.map((c) => {
              const active = c.id === sel;
              return (
                <button
                  key={c.id}
                  onClick={() => pick(c.id)}
                  className={cn(
                    'card-char group relative overflow-hidden rounded-xl border p-2 text-left',
                    active ? 'scale-[1.02]' : 'opacity-80 hover:opacity-100',
                  )}
                  style={{
                    borderColor: active ? c.color : 'rgba(255,255,255,0.10)',
                    background: active
                      ? `linear-gradient(160deg, ${c.color}2e, rgba(10,6,22,0.9))`
                      : 'rgba(255,255,255,0.03)',
                    boxShadow: active ? `0 10px 30px -12px ${c.color}, inset 0 0 24px -12px ${c.color}` : undefined,
                  }}
                >
                  <div
                    className="absolute -right-6 -top-6 h-16 w-16 rounded-full blur-xl transition-opacity"
                    style={{ background: c.color, opacity: active ? 0.5 : 0.18 }}
                  />
                  <div className="relative flex items-center gap-2">
                    <span
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-base"
                      style={{ background: `${c.color}22`, border: `1px solid ${c.color}66` }}
                    >
                      {c.emoji}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-display text-[11px] font-black tracking-widest" style={{ color: c.color }}>
                        {c.name}
                      </p>
                      <p className="truncate text-[10px] font-semibold text-white/45">{c.title}</p>
                    </div>
                  </div>
                  <p className="relative mt-2 line-clamp-2 text-[10px] leading-snug text-white/50">
                    <span className="font-bold" style={{ color: c.color }}>
                      {c.skillName}
                    </span>
                  </p>
                  {active && (
                    <span className="absolute right-1.5 bottom-1.5 font-display text-[8px] font-bold tracking-widest text-white/70">
                      SELECTED
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* detail */}
          <div
            className="animate-slide-up relative flex flex-col overflow-hidden rounded-2xl border p-4"
            style={{
              borderColor: `${selected.color}55`,
              background: `linear-gradient(180deg, ${selected.color}1f, rgba(8,5,18,0.92))`,
              boxShadow: `inset 0 0 40px -18px ${selected.color}`,
            }}
          >
            <div className="flex items-center justify-center">
              <FighterCanvas def={selected} size={150} />
            </div>
            <p className="text-center font-display text-xl font-black tracking-[0.18em]" style={{ color: selected.color }}>
              {selected.name}
            </p>
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
              {selected.title}
            </p>

            <div className="mt-3 space-y-1.5">
              <StatBar label="Health" value={selected.stats.hp} max={140} color={selected.color} />
              <StatBar label="Speed" value={selected.stats.speed} max={480} color={selected.color} />
              <StatBar label="Power" value={selected.stats.attack} max={12} color={selected.color} />
              <StatBar label="Armor" value={1.25 - selected.stats.defense} max={0.6} color={selected.color} />
            </div>

            <div className="mt-3 rounded-xl border border-white/10 bg-black/35 p-3">
              <p className="font-display text-[9px] uppercase tracking-[0.25em] text-white/40">Signature Skill</p>
              <p className="mt-0.5 font-display text-[13px] font-black tracking-wider" style={{ color: selected.color }}>
                ◆ {selected.skillName}
              </p>
              <p className="mt-1 text-[12px] leading-snug text-white/60">{selected.skillDesc}</p>
            </div>

            <div className="mt-auto pt-4">
              <NeonButton
                size="lg"
                color={selected.color}
                className="w-full"
                onClick={() => {
                  sfx.resume();
                  sfx.win();
                  onPick(selected.id);
                }}
              >
                Fight ▶
              </NeonButton>
              <button
                onClick={() => pick(CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)].id)}
                className="mt-2 w-full rounded-lg border border-white/10 py-2 font-display text-[10px] font-bold uppercase tracking-[0.25em] text-white/45 hover:text-white/80"
              >
                🎲 Random
              </button>
            </div>
          </div>
        </div>

        <p className="mt-3 text-center font-display text-[9px] uppercase tracking-[0.25em] text-white/30">
          Tip · dash has invincibility frames. Guard breaks if you spam it.
        </p>
      </div>
    </div>
  );
}
