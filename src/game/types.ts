export type InputState = {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  attack: boolean;
  special: boolean;
  dash: boolean;
  block: boolean;
};

export const emptyInput = (): InputState => ({
  left: false,
  right: false,
  up: false,
  down: false,
  attack: false,
  special: false,
  dash: false,
  block: false,
});

export type Result = {
  score: number;
  damage: number;
  maxCombo: number;
  perfects: number;
  rounds: number;
  charId: string;
};
