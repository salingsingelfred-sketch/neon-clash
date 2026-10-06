import { useCallback, useEffect, useState } from 'react';
import { CharacterSelect } from './components/CharacterSelect';
import { GameScreen } from './components/GameScreen';
import { HighScoreTable, TitleScreen } from './components/TitleScreen';
import { sfx } from './game/audio';
import { loadScores, type ScoreEntry } from './game/storage';

type Screen = 'title' | 'select' | 'play';

export default function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [charId, setCharId] = useState('blitz');
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [best, setBest] = useState(0);
  const [showScores, setShowScores] = useState(false);
  const [runKey, setRunKey] = useState(0);

  const refresh = useCallback(() => {
    const s = loadScores();
    setScores(s);
    setBest(s.length ? s[0].score : 0);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // unlock audio on first interaction anywhere
  useEffect(() => {
    const unlock = () => sfx.resume();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const goTitle = () => {
    sfx.ui();
    refresh();
    setScreen('title');
  };

  return (
    <div className="scanlines relative h-full w-full overflow-hidden">
      {/* ambient backdrop for menu screens (the canvas paints the arena) */}
      <div className="grid-overlay arena-bg pointer-events-none absolute inset-0" />

      <div className="relative z-10 h-full w-full overflow-y-auto">
        {screen === 'title' && (
          <TitleScreen
            scores={scores}
            best={best}
            onStart={() => {
              sfx.resume();
              sfx.ui();
              setScreen('select');
            }}
            onScores={() => {
              sfx.ui();
              setShowScores(true);
            }}
          />
        )}

        {screen === 'select' && (
          <CharacterSelect
            best={best}
            onBack={goTitle}
            onPick={(id) => {
              setCharId(id);
              setRunKey((k) => k + 1);
              setScreen('play');
            }}
          />
        )}

        {screen === 'play' && (
          <GameScreen
            key={runKey}
            charId={charId}
            onQuit={goTitle}
            onChangeFighter={() => {
              sfx.ui();
              refresh();
              setScreen('select');
            }}
          />
        )}
      </div>

      {/* ------------------------------ score modal ----------------------------- */}
      {showScores && (
        <div
          className="absolute inset-0 z-50 grid place-items-center bg-black/70 px-4 backdrop-blur-md"
          onClick={() => setShowScores(false)}
        >
          <div
            className="animate-pop glass w-full max-w-md rounded-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 text-center">
              <p className="font-display text-[10px] uppercase tracking-[0.45em] text-amber-300/70">Hall of Legends</p>
              <h3 className="neon-text font-display text-2xl font-black tracking-widest text-amber-100">HIGH SCORES</h3>
            </div>
              <div className="max-h-[50vh] overflow-y-auto pr-1">
                <HighScoreTable scores={scores} />
              </div>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => {
                  if (confirm('Erase all local records?')) {
                    localStorage.removeItem('neonclash.scores.v1');
                    refresh();
                  }
                }}
                className="btn-neon rounded-lg border border-white/12 px-3 py-2 font-display text-[10px] font-bold uppercase tracking-[0.2em] text-white/45"
              >
                Clear
              </button>
              <button
                onClick={() => setShowScores(false)}
                className="btn-neon rounded-lg border border-violet-400/40 bg-violet-500/15 px-5 py-2 font-display text-[10px] font-bold uppercase tracking-[0.2em] text-violet-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


