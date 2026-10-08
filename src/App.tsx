import { useCallback, useEffect, useState } from 'react';
import { CharacterSelect } from './components/CharacterSelect';
import { GameScreen } from './components/GameScreen';
import { HighScoreTable, TitleScreen } from './components/TitleScreen';
import { sfx } from './game/audio';
<<<<<<< HEAD
import { loadScores, type ScoreEntry } from './game/storage';

type Screen = 'title' | 'select' | 'play';

export default function App() {
  const [screen, setScreen] = useState<Screen>('title');
=======
import { activeProfile, loadScores, type LocalProfile, type ScoreEntry } from './game/storage';
import { PilotProfiles } from './components/PilotProfiles';

type Screen = 'auth' | 'lobby' | 'select' | 'play';

export default function App() {
  const [screen, setScreen] = useState<Screen>(() => (activeProfile() ? 'lobby' : 'auth'));
>>>>>>> b96a6a9 (update commit)
  const [charId, setCharId] = useState('blitz');
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [best, setBest] = useState(0);
  const [showScores, setShowScores] = useState(false);
<<<<<<< HEAD
=======
  const [showProfiles, setShowProfiles] = useState(false);
  const [profile, setProfile] = useState<LocalProfile | null>(() => activeProfile());
>>>>>>> b96a6a9 (update commit)
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

<<<<<<< HEAD
  const goTitle = () => {
    sfx.ui();
    refresh();
    setScreen('title');
=======
  useEffect(() => {
    const playCursorSound = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest('button, a, [role="button"], [role="tab"]')) {
        sfx.cursor();
      }
    };
    document.addEventListener('click', playCursorSound, true);
    return () => document.removeEventListener('click', playCursorSound, true);
  }, []);

  const goHome = () => {
    sfx.ui();
    refresh();
    setScreen('lobby');
>>>>>>> b96a6a9 (update commit)
  };

  return (
    <div className="scanlines relative h-full w-full overflow-hidden">
      {/* ambient backdrop for menu screens (the canvas paints the arena) */}
      <div className="grid-overlay arena-bg pointer-events-none absolute inset-0" />

      <div className="relative z-10 h-full w-full overflow-y-auto">
<<<<<<< HEAD
        {screen === 'title' && (
=======
        {screen === 'auth' && (
          <PilotProfiles
            requireProfile
            onChange={(nextProfile) => {
              setProfile(nextProfile);
              setScreen(nextProfile ? 'lobby' : 'auth');
            }}
            onClose={() => {
              if (profile) setScreen('lobby');
            }}
          />
        )}

        {screen === 'lobby' && (
>>>>>>> b96a6a9 (update commit)
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
<<<<<<< HEAD
=======
            onProfile={() => {
              sfx.ui();
              setShowProfiles(true);
            }}
            profileName={profile?.name ?? null}
>>>>>>> b96a6a9 (update commit)
          />
        )}

        {screen === 'select' && (
          <CharacterSelect
            best={best}
<<<<<<< HEAD
            onBack={goTitle}
=======
            onBack={goHome}
>>>>>>> b96a6a9 (update commit)
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
<<<<<<< HEAD
            onQuit={goTitle}
=======
            onHome={goHome}
>>>>>>> b96a6a9 (update commit)
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
<<<<<<< HEAD
    </div>
  );
}


=======

      {showProfiles && (
        <PilotProfiles
          onChange={(nextProfile) => {
            setProfile(nextProfile);
            if (nextProfile) {
              setScreen('lobby');
            } else {
              setShowProfiles(false);
              setScreen('auth');
            }
          }}
          onClose={() => setShowProfiles(false)}
        />
      )}
    </div>
  );
}
>>>>>>> b96a6a9 (update commit)
