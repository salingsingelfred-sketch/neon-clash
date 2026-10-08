export type CharacterDef = {
  id: string;
  name: string;
  title: string;
  emoji: string;
  color: string;
  skillName: string;
  skillDesc: string;
  stats: {
    hp: number;
    speed: number;
    attack: number;
    defense: number;
  };
};

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'blitz',
    name: 'BLITZ',
    title: 'Neon Vanguard',
    emoji: '⚡',
    color: '#22d3ee',
    skillName: 'STORM BREAKER',
    skillDesc: 'A lightning-fast shockwave that punishes nearby rivals.',
    stats: { hp: 105, speed: 390, attack: 10, defense: 0.82 },
  },
  {
    id: 'nova',
    name: 'NOVA',
    title: 'Solar Striker',
    emoji: '☀️',
    color: '#fb7185',
    skillName: 'SOLAR FLARE',
    skillDesc: 'A blazing burst with excellent range and impact.',
    stats: { hp: 100, speed: 370, attack: 11, defense: 0.88 },
  },
  {
    id: 'vex',
    name: 'VEX',
    title: 'Shadow Dancer',
    emoji: '🌙',
    color: '#c4b5fd',
    skillName: 'PHASE STRIKE',
    skillDesc: 'Blink through the chaos and unleash a heavy close-range hit.',
    stats: { hp: 95, speed: 440, attack: 10, defense: 0.9 },
  },
  {
    id: 'titan',
    name: 'TITAN',
    title: 'Iron Colossus',
    emoji: '🛡️',
    color: '#94a3b8',
    skillName: 'GROUND ZERO',
    skillDesc: 'A crushing arena slam with a wide blast radius.',
    stats: { hp: 135, speed: 300, attack: 12, defense: 0.7 },
  },
  {
    id: 'echo',
    name: 'ECHO',
    title: 'Sonic Phantom',
    emoji: '🎧',
    color: '#86efac',
    skillName: 'RESONANCE',
    skillDesc: 'A resonant pulse that catches opponents trying to close in.',
    stats: { hp: 100, speed: 380, attack: 9, defense: 0.82 },
  },
  {
    id: 'frost',
    name: 'FROST',
    title: 'Glacier Ace',
    emoji: '❄️',
    color: '#7dd3fc',
    skillName: 'ZERO HOUR',
    skillDesc: 'A freezing blast that hits hard across the arena.',
    stats: { hp: 110, speed: 350, attack: 11, defense: 0.78 },
  },
  {
    id: 'ember',
    name: 'EMBER',
    title: 'Pyre Warden',
    emoji: '🔥',
    color: '#fb923c',
    skillName: 'AFTERBURN',
    skillDesc: 'A fiery rush that leaves no room to recover.',
    stats: { hp: 105, speed: 360, attack: 12, defense: 0.86 },
  },
  {
    id: 'cipher',
    name: 'CIPHER',
    title: 'Glitch Runner',
    emoji: '💠',
    color: '#a78bfa',
    skillName: 'SYSTEM CRASH',
    skillDesc: 'A disruptive energy wave with a devastating finish.',
    stats: { hp: 95, speed: 410, attack: 11, defense: 0.88 },
  },
  {
    id: 'jade',
    name: 'JADE',
    title: 'Verdant Guardian',
    emoji: '🌿',
    color: '#4ade80',
    skillName: 'WILD GROWTH',
    skillDesc: 'A grounding shockwave powered by the arena floor.',
    stats: { hp: 125, speed: 330, attack: 10, defense: 0.72 },
  },
  {
    id: 'onyx',
    name: 'ONYX',
    title: 'Void Reaper',
    emoji: '🖤',
    color: '#e879f9',
    skillName: 'BLACKOUT',
    skillDesc: 'A high-impact void burst for turning the tide.',
    stats: { hp: 100, speed: 385, attack: 12, defense: 0.8 },
  },
];

export function charById(id: string) {
  return CHARACTERS.find((character) => character.id === id) ?? CHARACTERS[0];
}
