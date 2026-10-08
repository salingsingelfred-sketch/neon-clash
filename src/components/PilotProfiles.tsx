import { useState } from 'react';
import {
  activeProfile,
  createProfile,
  loadProfiles,
  signInProfile,
  signOutProfile,
  type LocalProfile,
} from '../game/storage';
import { NeonButton } from './ui';

type AuthMode = 'login' | 'register';

export function PilotProfiles({
  onClose,
  onChange,
  requireProfile = false,
}: {
  onClose: () => void;
  onChange: (profile: LocalProfile | null) => void;
  requireProfile?: boolean;
}) {
  const [profiles, setProfiles] = useState(loadProfiles);
  const [current, setCurrent] = useState(activeProfile);
  const [name, setName] = useState('');
  const [mode, setMode] = useState<AuthMode>(() => (loadProfiles().length ? 'login' : 'register'));
  const [message, setMessage] = useState('');

  const submit = () => {
    const cleanName = name.trim().replace(/\s+/g, ' ').slice(0, 12);
    if (cleanName.length < 2) {
      setMessage('Your callsign needs at least two characters.');
      return;
    }

    if (mode === 'register') {
      if (profiles.some((profile) => profile.name.toLowerCase() === cleanName.toLowerCase())) {
        setMessage('That callsign is already registered on this browser. Sign in instead.');
        setMode('login');
        return;
      }
      const profile = createProfile(cleanName);
      if (!profile) {
        setMessage('Could not save the new pilot. Check this browser’s storage settings.');
        return;
      }
      setProfiles(loadProfiles());
      setCurrent(profile);
      setName('');
      setMessage(`Pilot registered. Welcome to the arena, ${profile.name}.`);
      onChange(profile);
      return;
    }

    const match = profiles.find((profile) => profile.name.toLowerCase() === cleanName.toLowerCase());
    if (!match || !signInProfile(match.id)) {
      setMessage('No pilot with that callsign is registered on this browser.');
      return;
    }
    setCurrent(match);
    setName('');
    setMessage(`Welcome back, ${match.name}.`);
    onChange(match);
  };

  const selectProfile = (profile: LocalProfile) => {
    if (!signInProfile(profile.id)) {
      setMessage('Could not sign in. Check this browser’s storage settings.');
      return;
    }
    setCurrent(profile);
    setMessage(`Welcome back, ${profile.name}.`);
    onChange(profile);
  };

  const signOut = () => {
    if (!signOutProfile()) {
      setMessage('Could not sign out. Check this browser’s storage settings.');
      return;
    }
    setCurrent(null);
    setMode('login');
    setMessage('Signed out. Your local profile is still saved on this device.');
    onChange(null);
  };

  const authCard = (
    <section aria-labelledby="auth-title" className="auth-card glass w-full max-w-md rounded-3xl p-6 sm:p-8">
      <div className="text-center">
        <div aria-hidden="true" className="auth-emblem mx-auto grid h-16 w-16 place-items-center rounded-2xl">
          <span className="font-display text-3xl font-black text-cyan-100">N</span>
        </div>
        <p className="mt-5 font-display text-[9px] uppercase tracking-[0.5em] text-cyan-200/65">
          Neon Clash · Arena of Ten
        </p>
        <h1
          className="neon-text mt-2 font-display text-3xl font-black tracking-widest text-violet-100"
          id="auth-title"
        >
          {mode === 'register' ? 'JOIN THE CLASH' : 'WELCOME BACK'}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/55">
          {mode === 'register'
            ? 'Create your pilot profile and enter the arena.'
            : 'Sign in with the callsign you registered on this device.'}
        </p>
      </div>

      <div aria-label="Account action" className="mt-7 grid grid-cols-2 rounded-xl border border-white/10 bg-black/25 p-1" role="tablist">
        {(['login', 'register'] as const).map((tab) => (
          <button
            aria-selected={mode === tab}
            className={`rounded-lg px-3 py-2.5 font-display text-[10px] font-bold uppercase tracking-[0.2em] transition ${
              mode === tab ? 'bg-violet-400/20 text-violet-100 shadow-[inset_0_0_18px_rgba(167,139,250,0.14)]' : 'text-white/40 hover:text-white/75'
            }`}
            key={tab}
            onClick={() => {
              setMode(tab);
              setMessage('');
            }}
            role="tab"
            type="button"
          >
            {tab === 'login' ? 'Sign in' : 'Register'}
          </button>
        ))}
      </div>

      <form
        className="mt-6"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <label className="mb-2 block font-display text-[9px] uppercase tracking-[0.25em] text-white/55" htmlFor="pilot-name">
          Pilot callsign
        </label>
        <input
          autoComplete="nickname"
          autoFocus={requireProfile}
          className="w-full rounded-xl border border-violet-300/20 bg-[#080511]/80 px-4 py-3 font-display text-sm font-semibold tracking-[0.14em] text-white outline-none transition placeholder:text-white/25 focus:border-cyan-300/70 focus:shadow-[0_0_22px_rgba(34,211,238,0.13)]"
          id="pilot-name"
          maxLength={12}
          onChange={(event) => setName(event.target.value)}
          placeholder="ENTER CALLSIGN"
          value={name}
        />
        <p className="mt-2 text-[11px] text-white/35">2–12 characters · no password required for this local profile</p>
        {message && (
          <p aria-live="polite" className="mt-3 rounded-lg border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-2 text-xs text-cyan-100/85">
            {message}
          </p>
        )}
        <button
          className="auth-submit btn-neon mt-5 w-full rounded-xl border border-cyan-200/40 px-5 py-3.5 font-display text-xs font-black uppercase tracking-[0.24em] text-cyan-50"
          type="submit"
        >
          {mode === 'register' ? 'Create Pilot Profile' : 'Sign In to the Arena'}
          <span aria-hidden="true" className="ml-2 text-cyan-200">→</span>
        </button>
      </form>

      {mode === 'login' && profiles.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-center font-display text-[8px] uppercase tracking-[0.25em] text-white/35">
            Pilots saved on this browser
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {profiles.map((profile) => (
              <button
                aria-current={profile.id === current?.id ? 'true' : undefined}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-display text-[9px] font-bold tracking-widest text-white/65 transition hover:border-violet-300/50 hover:text-violet-100"
                key={profile.id}
                onClick={() => selectProfile(profile)}
                type="button"
              >
                {profile.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-[10px] leading-relaxed text-white/35">
        Local profile for this browser only. It is not a password-protected online account and does not sync across devices.
      </p>
    </section>
  );

  if (requireProfile) {
    return (
      <main className="auth-screen relative grid min-h-full w-full place-items-center overflow-y-auto px-4 py-10 sm:px-6">
        <div aria-hidden="true" className="auth-orbit auth-orbit-one" />
        <div aria-hidden="true" className="auth-orbit auth-orbit-two" />
        <div className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-8 lg:flex-row lg:justify-between lg:gap-12">
          <div className="auth-intro max-w-lg text-center lg:text-left">
            <p className="font-display text-[10px] uppercase tracking-[0.55em] text-cyan-200/65">The arena is waiting</p>
            <h2 className="neon-text mt-4 font-display text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-7xl">
              FIGHT
              <br />
              <span className="shimmer-text">YOUR</span>
              <br />
              LEGEND.
            </h2>
            <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-white/50 lg:mx-0 sm:text-base">
              Ten champions. Nine rivals. One name etched into the neon.
            </p>
            <div className="mt-7 hidden items-center gap-3 lg:flex">
              {['⚡', '🌙', '🔥', '❄️', '💠'].map((glyph, index) => (
                <span className="auth-glyph grid h-12 w-12 place-items-center rounded-xl text-xl" key={glyph} style={{ animationDelay: `${index * 0.2}s` }}>
                  {glyph}
                </span>
              ))}
            </div>
          </div>
          {authCard}
        </div>
      </main>
    );
  }

  return (
    <div
      className="absolute inset-0 z-50 grid place-items-center overflow-y-auto bg-black/75 px-4 py-6 backdrop-blur-md"
      onClick={onClose}
    >
      <section
        aria-labelledby="profile-title"
        aria-modal="true"
        className="animate-pop glass w-full max-w-md rounded-2xl p-5 sm:p-6"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <p className="text-center font-display text-[10px] uppercase tracking-[0.4em] text-cyan-300/70">
          Local pilot profile
        </p>
        <h2 className="neon-text mt-1 text-center font-display text-2xl font-black tracking-widest text-violet-100" id="profile-title">
          {current ? current.name : 'PILOT SIGNED OUT'}
        </h2>
        <p className="mt-2 text-center text-sm text-white/55">
          {current ? 'Your profile is saved in this browser.' : 'Sign in or register to return to the lobby.'}
        </p>
        {current ? (
          <div className="mt-5 flex justify-center gap-2">
            <button
              className="rounded-lg border border-white/10 px-3 py-2 font-display text-[9px] font-bold uppercase tracking-widest text-white/45 hover:text-white/80"
              onClick={signOut}
              type="button"
            >
              Sign out
            </button>
            <NeonButton color="#a78bfa" onClick={onClose}>Done</NeonButton>
          </div>
        ) : (
          <div className="mt-5">{authCard}</div>
        )}
      </section>
    </div>
  );
}
