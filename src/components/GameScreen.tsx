import { useCallback, useEffect, useRef, useState } from 'react';
import { Game } from '../game/engine';
import { charById } from '../game/characters';
import { sfx } from '../game/audio';
import {
  loadName,
  loadScores,
  renameEntry,
  saveName,
  saveScore,
  type ScoreEntry,
} from '../game/storage';
import type { InputState, Result } from '../game/types';
import { TouchControls } from './TouchControls';
import { HighScoreTable } from './TitleScreen';
import { NeonButton } from './ui';

export function GameScreen({
  charId,
  onQuit,
  onChangeFighter,
}: {
  charId: string;
  onQuit: () => void;
  onChangeFighter: () => void;
}) {
  const holderRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<Game | null>(null);
  const [runId, setRunId] = useState(0);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [scores, setScores] = useState<ScoreEntry[]>(() => loadScores());
  const [newDate, setNewDate] = useState<number | undefined>(undefined);
  const [name, setName] = useState(() => loadName() || 'PLAYER');
  const [muted, setMuted] = useState(false);
  const [, setHudTick] = useState(0);

  /* ------------------------------- engine boot ------------------------------ */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setResult(null);
    setNewDate(undefined);
    setPaused(false);

    const g = new Game(canvas, charId, {
      onGameOver: (r) => {
        const entry: ScoreEntry = {
          name: (loadName() || 'PLAYER').toUpperCase(),
          charId: r.charId,
          score: r.score,
          rounds: r.rounds,
          date: Date.now(),
        };
        const next = saveScore(entry);
        setScores(next);
        setNewDate(entry.date);
        setResult(r);
      },
      onPauseToggle: (p) => setPaused(p),
    });
    gameRef.current = g;
    g.start();

    // canvas may not be laid out on the very first frame
    requestAnimationFrame(() => g.resize());
    const t = window.setTimeout(() => g.resize(), 220);

    const onResize = () => g.resize();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    // lightweight HUD ticker (for touch energy ring + special label)
    const hud = window.setInterval(() => setHudTick((t) => (t + 1) % 1000), 200);

    return () => {
      window.clearTimeout(t);
      window.clearInterval(hud);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      g.destroy();
      gameRef.current = null;
    };
  }, [charId, runId]);

  /* ------------------------------- keyboard -------------------------------- */
  useEffect(() => {
    const setKey = (code: string, v: boolean) => {
      const g = gameRef.current;
      if (!g) return;
      g.keys[code.toLowerCase()] = v;
      if (v) sfx.resume();
    };

    const down = (ev: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      const k = ev.key.toLowerCase();
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(k)) ev.preventDefault();
      const g = gameRef.current;
      if (!g) return;

      if (!ev.repeat) {
        if (k === 'p' || k === 'escape') {
          if (!result) g.setPaused(!g.paused);
          return;
        }
        if (k === 'r') {
          restart();
          return;
        }
        if (k === 'm') toggleMute();
      }
      setKey(ev.key, true);
    };
    const up = (ev: KeyboardEvent) => setKey(ev.key, false);
    const blur = () => {
      const g = gameRef.current;
      if (g) g.keys = {};
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, muted]);

  /* --------------------------------- actions -------------------------------- */
  const toggleMute = () => {
    setMuted((m) => {
      sfx.setMuted(!m);
      return !m;
    });
  };

  const restart = useCallback(() => {
    sfx.resume();
    setResult(null);
    setNewDate(undefined);
    setPaused(false);
    setRunId((r) => r + 1);
  }, []);

  const setTouch = useCallback((k: keyof InputState, v: boolean) => {
    const g = gameRef.current;
    if (!g) return;
    g.touch[k] = v;
    sfx.resume();
  }, []);

  const doPause = () => {
    const g = gameRef.current;
    if (!g || result) return;
    g.setPaused(!g.paused);
  };

  const game = gameRef.current;
  const char = charById(charId);
  const energy = game?.p1.energy ?? 0;
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return (
    <div ref={holderRef} className="relative h-full w-full overflow-hidden bg-[#05030c]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* top-right system buttons */}
      <div className="pointer-events-none absolute right-2 top-2 z-30 flex gap-2">
        <button
          onClick={toggleMute}
          className="pointer-events-auto grid h-9 w-9 place-items-center rounded-lg border border-white/15 bg-black/50 text-sm text-white/70 backdrop-blur-sm active:scale-95"
          aria-label="Mute"
        >
          {muted ? '🔇' : '🔊'}
        </button>
        <button
          onClick={doPause}
          className="pointer-events-auto grid h-9 w-9 place-items-center rounded-lg border border-white/15 bg-black/50 text-sm text-white/70 backdrop-blur-sm active:scale-95"
          aria-label="Pause"
        >
          ⏸
        </button>
      </div>

      {/* rotate hint for phones held upright */}
      {isTouch && !result && (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-30 hidden -translate-y-1/2 justify-center px-6 portrait:flex">
          <div className="glass animate-pulse-glow rounded-xl px-4 py-3 text-center">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">
              ↻ Rotate to landscape
            </p>
            <p className="mt-1 text-[11px] text-white/50">for the full neon arena</p>
          </div>
        </div>
      )}

      {/* touch pads */}
      {!result && !paused && (
        <TouchControls onSet={setTouch} energy={energy} skillName={char.skillName} />
      )}

      {/* --------------------------------- PAUSE -------------------------------- */}
      {paused && !result && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-[#05030c]/78 px-4 backdrop-blur-md">
          <div className="animate-pop glass w-full max-w-sm rounded-2xl p-6 text-center">
            <p className="font-display text-[10px] uppercase tracking-[0.45em] text-cyan-300/70">Standby</p>
            <h3 className="neon-text mt-1 font-display text-3xl font-black tracking-widest text-violet-200">PAUSED</h3>
            <div className="mt-5 grid gap-2">
              <NeonButton color="#22d3ee" onClick={doPause}>
                ▶ Resume
              </NeonButton>
              <NeonButton color="#a78bfa" onClick={restart}>
                ↻ Restart Match
              </NeonButton>
              <NeonButton color="#fb7185" onClick={onQuit}>
                ✕ Quit to Title
              </NeonButton>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 text-left">
              {[
                { k: 'Move', v: 'A D / ← →' },
                { k: 'Jump ×2', v: 'W / Space' },
                { k: 'Strike', v: 'J / Z' },
                { k: 'Special', v: 'K / X' },
                { k: 'Dash', v: 'L / C' },
                { k: 'Guard', v: 'S / ↓' },
              ].map((r) => (
                <div key={r.k} className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5">
                  <p className="font-display text-[8px] uppercase tracking-[0.2em] text-white/40">{r.k}</p>
                  <p className="font-display text-[10px] font-bold text-white/80">{r.v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------- GAME OVER ------------------------------ */}
      {result && (
        <div className="absolute inset-0 z-40 grid place-items-center overflow-y-auto bg-[#05030c]/85 px-3 py-6 backdrop-blur-md">
          <div className="animate-pop glass w-full max-w-md rounded-2xl p-5 sm:p-6">
            <div className="text-center">
              <p className="font-display text-[10px] uppercase tracking-[0.45em] text-rose-300/70">Gauntlet Over</p>
              <h3
                className="neon-text font-display text-4xl font-black tracking-widest"
                style={{ color: result.rounds >= 5 ? '#fde047' : '#fda4af' }}
              >
                {result.rounds >= 7 ? 'LEGEND' : result.rounds >= 4 ? 'DEFEATED' : 'KO\'d'}
              </h3>
              <p className="mt-1 text-sm text-white/60">
                You cleared <span className="font-bold text-white">{result.rounds}</span> rival
                {result.rounds === 1 ? '' : 's'} as{' '}
                <span className="font-bold" style={{ color: char.color }}>
                  {char.name}
                </span>
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { k: 'Score', v: result.score.toLocaleString(), c: '#fde047' },
                { k: 'Damage', v: result.damage.toLocaleString(), c: '#fb7185' },
                { k: 'Best Combo', v: `${result.maxCombo}x`, c: '#22d3ee' },
                { k: 'Perfects', v: `${result.perfects}`, c: '#86efac' },
              ].map((s) => (
                <div key={s.k} className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2 text-center">
                  <p className="font-display text-[8px] uppercase tracking-[0.2em] text-white/40">{s.k}</p>
                  <p className="font-display text-base font-black" style={{ color: s.c }}>
                    {s.v}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-display text-[10px] uppercase tracking-[0.3em] text-white/45">Arena Records</p>
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-[9px] uppercase tracking-widest text-white/35">Name</span>
                  <input
                    value={name}
                    maxLength={12}
                    onChange={(e) => {
                      const v = e.target.value.toUpperCase();
                      setName(v);
                      saveName(v);
                      if (newDate) setScores(renameEntry(newDate, v));
                    }}
                    className="w-24 rounded-md border border-white/15 bg-black/50 px-2 py-1 font-display text-[11px] font-bold tracking-widest text-white outline-none focus:border-violet-400"
                  />
                </div>
              </div>
              <div className="max-h-[34vh] overflow-y-auto pr-1">
                <HighScoreTable scores={scores} highlight={newDate} />
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <NeonButton color="#22d3ee" onClick={restart} className="sm:col-span-1">
                ↻ Rematch <span className="opacity-60">(R)</span>
              </NeonButton>
              <NeonButton color="#a78bfa" onClick={onChangeFighter}>
                ⚔ New Fighter
              </NeonButton>
              <NeonButton color="#64748b" onClick={onQuit}>
                ⌂ Title
              </NeonButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
