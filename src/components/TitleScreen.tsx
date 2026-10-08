import { CHARACTERS } from '../game/characters';
import type { ScoreEntry } from '../game/storage';
import { NeonButton } from './ui';

export function HighScoreTable({ scores, highlight }: { scores: ScoreEntry[]; highlight?: number }) {
  const charMap = new Map(CHARACTERS.map((c) => [c.id, c]));
  if (!scores.length) {
    return (
      <div className="rounded-xl border border-dashed border-white/12 px-5 py-8 text-center">
        <p className="font-display text-xs uppercase tracking-[0.25em] text-white/40">No records yet</p>
        <p className="mt-2 text-sm text-white/55">Be the first legend of the arena.</p>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <div className="grid grid-cols-[34px_1fr_62px_46px] gap-2 bg-white/[0.06] px-3 py-2 font-display text-[9px] uppercase tracking-[0.2em] text-white/45">
        <span>#</span>
        <span>Fighter</span>
        <span className="text-right">Score</span>
        <span className="text-right">Wins</span>
      </div>
      <div className="divide-y divide-white/[0.06]">
        {scores.map((s, i) => {
          const c = charMap.get(s.charId);
          const isNew = highlight === s.date;
          return (
            <div
              key={`${s.date}-${i}`}
              className="grid grid-cols-[34px_1fr_62px_46px] items-center gap-2 px-3 py-[7px] text-sm"
              style={{
                background: isNew ? 'rgba(255,209,102,0.14)' : undefined,
              }}
            >
              <span
                className="font-display text-[11px] font-bold"
                style={{ color: i === 0 ? '#ffd166' : 'rgba(255,255,255,0.4)' }}
              >
                {i + 1}
              </span>
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-[11px]"
                  style={{ background: `${c?.color ?? '#fff'}22`, border: `1px solid ${c?.color ?? '#fff'}55` }}
                >
                  {c?.emoji ?? '?'}
                </span>
                <span className="truncate font-display text-[11px] font-bold tracking-wider" style={{ color: c?.color }}>
                  {s.name}
                </span>
                {isNew && (
                  <span className="rounded bg-amber-300/20 px-1.5 py-px font-display text-[8px] font-bold tracking-widest text-amber-200">
                    NEW
                  </span>
                )}
              </span>
              <span className="text-right font-display text-xs font-bold text-white/90">{s.score.toLocaleString()}</span>
              <span className="text-right font-display text-[11px] text-white/50">{s.rounds}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TitleScreen({
  scores,
  onStart,
  onScores,
<<<<<<< HEAD
=======
  onProfile,
  profileName,
>>>>>>> b96a6a9 (update commit)
  best,
}: {
  scores: ScoreEntry[];
  onStart: () => void;
  onScores: () => void;
<<<<<<< HEAD
=======
  onProfile: () => void;
  profileName: string | null;
>>>>>>> b96a6a9 (update commit)
  best: number;
}) {
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center overflow-hidden px-5 py-10">
      {/* floating fighter glyphs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {CHARACTERS.map((c, i) => (
          <span
            key={c.id}
            className="animate-floaty absolute select-none text-4xl opacity-[0.13] sm:text-6xl"
            style={{
              left: `${6 + ((i * 11.5) % 88)}%`,
              top: `${8 + ((i * 37) % 78)}%`,
              animationDelay: `${i * 0.32}s`,
              filter: `drop-shadow(0 0 14px ${c.color})`,
            }}
          >
            {c.emoji}
          </span>
        ))}
      </div>

      <div className="animate-pop relative z-10 flex w-full max-w-xl flex-col items-center text-center">
        <p className="font-display text-[10px] uppercase tracking-[0.55em] text-cyan-300/70">Arena of Ten</p>
        <h1
          className="neon-text mt-3 font-display text-5xl font-black leading-none tracking-tight sm:text-7xl"
          style={{ color: '#e9d5ff' }}
        >
          NEON
          <br />
          <span className="shimmer-text">CLASH</span>
        </h1>
        <div className="mt-5 h-px w-52 bg-gradient-to-r from-transparent via-fuchsia-400/70 to-transparent" />
        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/65">
          Pick one of <span className="font-bold text-white">10 champions</span>, each with a signature special, and
          survive the gauntlet — nine rivals in a row, each meaner than the last.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <NeonButton size="lg" color="#22d3ee" onClick={onStart}>
            ▶ Enter Arena
          </NeonButton>
          <NeonButton color="#a78bfa" onClick={onScores}>
            🏆 High Scores
          </NeonButton>
<<<<<<< HEAD
=======
          <NeonButton color="#86efac" onClick={onProfile}>
            {profileName ? `Pilot · ${profileName}` : 'Pilot Profile'}
          </NeonButton>
>>>>>>> b96a6a9 (update commit)
        </div>

        <div className="mt-9 grid w-full grid-cols-2 gap-3 text-left sm:grid-cols-4">
          {[
            { k: 'Move', v: 'A / D' },
            { k: 'Jump ×2', v: 'W / Space' },
            { k: 'Strike', v: 'J / Click' },
            { k: 'Special', v: 'K' },
            { k: 'Dash', v: 'L / Shift+dir' },
            { k: 'Guard', v: 'S' },
            { k: 'Pause', v: 'P / Esc' },
            { k: 'Touch', v: 'On-screen pads' },
          ].map((r) => (
            <div key={r.k} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
              <p className="font-display text-[8px] uppercase tracking-[0.2em] text-white/40">{r.k}</p>
              <p className="font-display text-[11px] font-bold text-white/85">{r.v}</p>
            </div>
          ))}
        </div>

        {best > 0 && (
          <p className="mt-7 font-display text-[11px] uppercase tracking-[0.3em] text-amber-200/80">
            Arena record · {best.toLocaleString()}
          </p>
        )}
        {scores.length > 0 && (
          <p className="mt-1 font-display text-[10px] uppercase tracking-[0.25em] text-white/35">
            Top: {scores[0].name} · {scores[0].score.toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
