import { CHARACTERS, charById } from './characters';
import { emptyInput, type InputState, type Result } from './types';
import { sfx } from './audio';
import { drawFighterSprite, type AnimationName } from './spriteSheet';

type Fighter = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  energy: number;
  style: string;
  color: string;
  name: string;
  facing: -1 | 1;
  attackCooldown: number;
  dashCooldown: number;
  dashTime: number;
  stun: number;
  guarding: boolean;
  jumping: boolean;
  jumps: number;
  flash: number;
  attackTime: number;
  attackDuration: number;
  attackSpecial: boolean;
};

type BattleFx = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  kind: 'spark' | 'ring' | 'slash';
};

type GameCallbacks = {
  onGameOver: (result: Result) => void;
  onPauseToggle: (paused: boolean) => void;
};

const WORLD_WIDTH = 960;
const WORLD_HEIGHT = 540;
const FLOOR = 444;
const GRAVITY = 1550;
const RIVAL_COUNT = 9;

function fighter(
  x: number,
  hp: number,
  color: string,
  name: string,
  facing: -1 | 1,
  style = 'rival',
): Fighter {
  return {
    x,
    y: FLOOR - 104,
    vx: 0,
    vy: 0,
    hp,
    maxHp: hp,
    energy: 0,
    style,
    color,
    name,
    facing,
    attackCooldown: 0,
    dashCooldown: 0,
    dashTime: 0,
    stun: 0,
    guarding: false,
    jumping: false,
    jumps: 0,
    flash: 0,
    attackTime: 0,
    attackDuration: 0,
    attackSpecial: false,
  };
}

export class Game {
  keys: Record<string, boolean> = {};
  readonly touch: InputState = emptyInput();
  readonly p1: Fighter;
  paused = false;

  private readonly ctx: CanvasRenderingContext2D;
  private readonly canvas: HTMLCanvasElement;
  private callbacks: GameCallbacks;
  private enemy: Fighter;
  private readonly rivalRoster: typeof CHARACTERS;
  private playerStats = charById('');
  private raf = 0;
  private lastFrame = 0;
  private elapsed = 0;
  private round = 0;
  private score = 0;
  private damage = 0;
  private maxCombo = 0;
  private combo = 0;
  private comboTimer = 0;
  private perfects = 0;
  private roundEndTimer = 0;
  private finishTimer = 0;
  private wasSpecial = false;
  private wasDash = false;
  private wasJump = false;
  private aiTimer = 0;
  private destroyed = false;
  private readonly effects: BattleFx[] = [];
  private hitStop = 0;
  private cameraShake = 0;
  private screenFlash = 0;

  constructor(canvas: HTMLCanvasElement, charId: string, callbacks: GameCallbacks) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('This browser could not create a 2D game canvas.');
    this.canvas = canvas;
    this.ctx = ctx;
    this.callbacks = callbacks;
    this.playerStats = charById(charId);
    this.rivalRoster = CHARACTERS.filter((character) => character.id !== this.playerStats.id);
    this.p1 = fighter(
      270,
      this.playerStats.stats.hp,
      this.playerStats.color,
      this.playerStats.name,
      1,
      this.playerStats.id,
    );
    const firstRival = this.rivalRoster[0] ?? CHARACTERS[0];
    this.enemy = fighter(690, 96, firstRival.color, firstRival.name, -1, firstRival.id);
  }

  start() {
    this.lastFrame = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
  }

  resize() {
    const bounds = this.canvas.getBoundingClientRect();
    if (bounds.width < 1 || bounds.height < 1) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const width = Math.round(bounds.width * dpr);
    const height = Math.round(bounds.height * dpr);
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.draw();
  }

  setPaused(paused: boolean) {
    if (this.paused === paused) return;
    this.paused = paused;
    this.callbacks.onPauseToggle(paused);
    if (!paused) this.lastFrame = performance.now();
  }

  private frame = (now: number) => {
    if (this.destroyed) return;
    const dt = Math.min((now - this.lastFrame) / 1000, 0.034);
    this.lastFrame = now;
    if (!this.paused) this.update(dt);
    this.draw();
    this.raf = requestAnimationFrame(this.frame);
  };

  private input(): InputState {
    const key = (name: string) => Boolean(this.keys[name]);
    return {
      left: key('a') || key('arrowleft') || this.touch.left,
      right: key('d') || key('arrowright') || this.touch.right,
      up: key('w') || key(' ') || key('arrowup') || this.touch.up,
      down: key('s') || key('arrowdown') || this.touch.down,
      attack: key('j') || key('z') || key('enter') || this.touch.attack,
      special: key('k') || key('x') || this.touch.special,
      dash: key('l') || key('c') || key('shift') || this.touch.dash,
      block: key('s') || key('arrowdown') || this.touch.block,
    };
  }

  private update(dt: number) {
    if (this.finishTimer > 0) return;
    this.cameraShake = Math.max(0, this.cameraShake - dt * 24);
    this.screenFlash = Math.max(0, this.screenFlash - dt * 2.6);
    if (this.hitStop > 0) {
      this.hitStop = Math.max(0, this.hitStop - dt);
      return;
    }
    this.elapsed += dt;
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    if (this.comboTimer === 0) this.combo = 0;
    this.p1.attackCooldown = Math.max(0, this.p1.attackCooldown - dt);
    this.p1.dashCooldown = Math.max(0, this.p1.dashCooldown - dt);
    this.p1.dashTime = Math.max(0, this.p1.dashTime - dt);
    this.p1.stun = Math.max(0, this.p1.stun - dt);
    this.p1.flash = Math.max(0, this.p1.flash - dt);
    this.p1.attackTime = Math.max(0, this.p1.attackTime - dt);
    this.enemy.attackCooldown = Math.max(0, this.enemy.attackCooldown - dt);
    this.enemy.dashCooldown = Math.max(0, this.enemy.dashCooldown - dt);
    this.enemy.dashTime = Math.max(0, this.enemy.dashTime - dt);
    this.enemy.stun = Math.max(0, this.enemy.stun - dt);
    this.enemy.flash = Math.max(0, this.enemy.flash - dt);
    this.enemy.attackTime = Math.max(0, this.enemy.attackTime - dt);

    if (this.roundEndTimer > 0) {
      this.roundEndTimer = Math.max(0, this.roundEndTimer - dt);
      if (!this.roundEndTimer) this.advanceRound();
      return;
    }

    const input = this.input();
    const move = (Number(input.right) - Number(input.left)) * this.playerStats.stats.speed;
    if (this.p1.stun <= 0 && this.p1.dashTime <= 0) {
      this.p1.vx = move;
      if (move !== 0) this.p1.facing = move > 0 ? 1 : -1;
      if (input.up && !this.wasJump && this.p1.jumps < 2) {
        this.p1.vy = this.p1.jumps === 0 ? -610 : -535;
        this.p1.jumps += 1;
        this.p1.jumping = true;
        sfx.jump();
      }
      this.p1.guarding = input.block;
    } else {
      this.p1.vx *= 0.86;
    }

    if (input.dash && !this.wasDash && this.p1.dashCooldown <= 0 && this.p1.stun <= 0) {
      this.p1.dashTime = 0.2;
      this.p1.dashCooldown = 0.78;
      this.p1.vx = this.p1.facing * 780;
      sfx.dash();
    }
    if (input.attack && this.p1.attackCooldown <= 0 && this.p1.stun <= 0) {
      this.attack(this.p1, this.enemy, this.playerStats.stats.attack, false);
    }
    if (input.special && !this.wasSpecial && this.p1.energy >= 100 && this.p1.stun <= 0) {
      this.p1.energy = 0;
      this.attack(this.p1, this.enemy, this.playerStats.stats.attack * 2.6, true);
    }
    this.wasSpecial = input.special;
    this.wasDash = input.dash;
    this.wasJump = input.up;

    this.updateEnemy(dt);
    this.moveFighter(this.p1, dt);
    this.moveFighter(this.enemy, dt);
    this.p1.x = Math.max(70, Math.min(WORLD_WIDTH - 70, this.p1.x));
    this.enemy.x = Math.max(70, Math.min(WORLD_WIDTH - 70, this.enemy.x));
    this.updateEffects(dt);
    if (this.enemy.hp <= 0 && !this.roundEndTimer) this.roundEndTimer = 0.95;

    if (this.p1.hp <= 0) {
      this.endGame();
    }
  }

  private updateEnemy(dt: number) {
    if (this.enemy.hp <= 0 || this.enemy.stun > 0) return;
    this.aiTimer -= dt;
    const delta = this.p1.x - this.enemy.x;
    const distance = Math.abs(delta);
    this.enemy.facing = delta > 0 ? 1 : -1;

    if (distance > 84) {
      this.enemy.vx = this.enemy.facing * (178 + this.round * 10);
      this.enemy.guarding = false;
    } else {
      this.enemy.vx = 0;
      this.enemy.guarding = this.aiTimer < -0.35 && this.round > 3;
      if (this.aiTimer <= 0 && this.enemy.attackCooldown <= 0) {
        this.aiTimer = Math.max(0.42, 0.95 - this.round * 0.045 + Math.random() * 0.34);
        this.enemy.guarding = false;
        this.attack(this.enemy, this.p1, 7.5 + this.round * 1.15, false);
      }
    }
  }

  private moveFighter(target: Fighter, dt: number) {
    target.x += target.vx * dt;
    target.y += target.vy * dt;
    target.vy += GRAVITY * dt;
    const ground = FLOOR - 104;
    if (target.y >= ground) {
      target.y = ground;
      target.vy = 0;
      target.jumping = false;
      target.jumps = 0;
    }
  }

  private attack(attacker: Fighter, defender: Fighter, power: number, special: boolean) {
    attacker.attackCooldown = special ? 0.66 : 0.29;
    attacker.flash = Math.max(attacker.flash, special ? 0.18 : 0.1);
    attacker.attackDuration = special ? 0.48 : 0.23;
    attacker.attackTime = attacker.attackDuration;
    attacker.attackSpecial = special;
    if (special) {
      sfx.special();
      sfx.fighterSpecial(attacker.style);
    } else {
      sfx.swing();
      sfx.fighterSwing(attacker.style);
    }
    const distance = Math.abs(defender.x - attacker.x);
    const reach = special ? 218 : 105;
    if (distance > reach || defender.hp <= 0) return;
    if (attacker.facing !== (defender.x > attacker.x ? 1 : -1) && distance > 36) return;

    if (special) this.addEffect(attacker.x + attacker.facing * 124, attacker.y + 55, attacker.color, 'slash', 178);
    const blocked = defender.guarding && defender.facing === (attacker.x > defender.x ? 1 : -1);
    if (blocked) {
      const damage = Math.max(1, power * 0.14);
      defender.hp = Math.max(0, defender.hp - damage);
      this.perfects += 1;
      this.score += 30;
      this.addImpact(defender.x, defender.y + 48, '#fde68a');
      this.cameraShake = Math.max(this.cameraShake, 2.5);
      sfx.clash();
      sfx.fighterClash(attacker.style);
      return;
    }

    const dashDodged = defender.dashTime > 0;
    if (dashDodged) {
      this.addEffect((attacker.x + defender.x) / 2, defender.y + 44, '#7dd3fc', 'slash', 66);
      sfx.clash();
      sfx.fighterClash(attacker.style);
      return;
    }
    const armor = defender === this.p1 ? this.playerStats.stats.defense : Math.max(0.62, 0.94 - this.round * 0.025);
    const dealt = Math.max(1, power * armor * (special ? 1.2 : 1));
    defender.hp = Math.max(0, defender.hp - dealt);
    defender.stun = special ? 0.43 : 0.24;
    defender.flash = special ? 0.26 : 0.18;
    defender.vx = attacker.facing * (special ? 520 : 330);
    defender.vy = special ? -160 : -72;
    this.addImpact(defender.x - attacker.facing * 15, defender.y + 44, special ? attacker.color : '#fff1f2');
    this.cameraShake = Math.max(this.cameraShake, special ? 9 : 5);
    this.screenFlash = Math.max(this.screenFlash, special ? 0.38 : 0.22);
    this.hitStop = special ? 0.085 : 0.045;
    sfx.impact(special);
    sfx.fighterImpact(attacker.style, special);
    if (defender === this.enemy) {
      this.damage += dealt;
      this.combo += 1;
      this.comboTimer = 1.7;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.p1.energy = Math.min(100, this.p1.energy + (special ? 7 : 17));
      this.score += Math.round(dealt * 11 + (this.combo > 1 ? this.combo * 20 : 0));
    } else {
      this.p1.energy = Math.min(100, this.p1.energy + 8);
    }
  }

  private addImpact(x: number, y: number, color: string) {
    this.addEffect(x, y, color, 'ring', 56);
    for (let i = 0; i < 16; i += 1) {
      const angle = (Math.PI * 2 * i) / 16 + Math.random() * 0.2;
      const speed = 90 + Math.random() * 420;
      const life = 0.22 + Math.random() * 0.28;
      this.effects.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        color: i % 4 === 0 ? '#ffffff' : color,
        size: 1.4 + Math.random() * 3.8,
        kind: 'spark',
      });
    }
  }

  private addEffect(x: number, y: number, color: string, kind: BattleFx['kind'], size: number) {
    this.effects.push({ x, y, vx: 0, vy: 0, life: 0.3, maxLife: 0.3, color, size, kind });
  }

  private updateEffects(dt: number) {
    for (let i = this.effects.length - 1; i >= 0; i -= 1) {
      const effect = this.effects[i];
      effect.life -= dt;
      effect.x += effect.vx * dt;
      effect.y += effect.vy * dt;
      effect.vx *= Math.pow(0.02, dt);
      effect.vy = effect.vy * Math.pow(0.02, dt) + 220 * dt;
      if (effect.life <= 0) this.effects.splice(i, 1);
    }
  }

  private advanceRound() {
    this.round += 1;
    if (this.round >= RIVAL_COUNT) {
      this.endGame();
      return;
    }
    const level = this.round;
    const maxHp = 95 + level * 15;
    const rival = this.rivalRoster[level] ?? CHARACTERS[0];
    this.enemy = fighter(690, maxHp, rival.color, rival.name, -1, rival.id);
    this.p1.hp = Math.min(this.p1.maxHp, this.p1.hp + this.p1.maxHp * 0.25);
    this.score += 350 + level * 100;
    this.aiTimer = 0.7;
    sfx.win();
  }

  private endGame() {
    if (this.finishTimer) return;
    this.finishTimer = 1;
    const result: Result = {
      score: this.score + this.round * 500,
      damage: Math.round(this.damage),
      maxCombo: this.maxCombo,
      perfects: this.perfects,
      rounds: this.round,
      charId: this.playerStats.id,
    };
    window.setTimeout(() => {
      if (!this.destroyed) this.callbacks.onGameOver(result);
    }, this.finishTimer * 1000);
  }

  private draw() {
    const { canvas, ctx } = this;
    const width = canvas.width;
    const height = canvas.height;
    if (!width || !height) return;
    const scale = Math.min(width / WORLD_WIDTH, height / WORLD_HEIGHT);
    const offsetX = (width - WORLD_WIDTH * scale) / 2;
    const offsetY = (height - WORLD_HEIGHT * scale) / 2;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, width, height);
    const shakeX = this.cameraShake ? (Math.random() - 0.5) * this.cameraShake : 0;
    const shakeY = this.cameraShake ? (Math.random() - 0.5) * this.cameraShake : 0;
    ctx.setTransform(scale, 0, 0, scale, offsetX + shakeX, offsetY + shakeY);
    this.drawArena(ctx);
    this.drawFighter(ctx, this.p1);
    this.drawFighter(ctx, this.enemy);
    this.drawEffects(ctx);
    this.drawHud(ctx);
    if (this.screenFlash > 0) {
      ctx.fillStyle = `rgba(235, 225, 255, ${Math.min(0.17, this.screenFlash * 0.4)})`;
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    }
  }

  private drawArena(ctx: CanvasRenderingContext2D) {
    const sky = ctx.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
    sky.addColorStop(0, '#100923');
    sky.addColorStop(0.72, '#090817');
    sky.addColorStop(1, '#05030c');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    const glow = ctx.createRadialGradient(480, 400, 15, 480, 400, 460);
    glow.addColorStop(0, 'rgba(124,58,237,0.19)');
    glow.addColorStop(1, 'rgba(5,3,12,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 160, WORLD_WIDTH, 340);

    ctx.strokeStyle = 'rgba(167,139,250,0.12)';
    ctx.lineWidth = 1;
    for (let i = -8; i <= 8; i += 1) {
      ctx.beginPath();
      ctx.moveTo(480 + i * 70, FLOOR);
      ctx.lineTo(480 + i * 180, WORLD_HEIGHT);
      ctx.stroke();
    }
    for (let y = FLOOR + 16; y < WORLD_HEIGHT; y += 27) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WORLD_WIDTH, y);
      ctx.stroke();
    }
    ctx.fillStyle = '#130b25';
    ctx.fillRect(0, FLOOR, WORLD_WIDTH, WORLD_HEIGHT - FLOOR);
    ctx.fillStyle = '#8b5cf6';
    ctx.fillRect(0, FLOOR, WORLD_WIDTH, 2);
    ctx.globalAlpha = 0.35;
    ctx.fillRect(0, FLOOR + 2, WORLD_WIDTH, 2);
    ctx.globalAlpha = 1;

    for (let i = 0; i < 7; i += 1) {
      const x = i * 155 + 25;
      const tall = 70 + ((i * 29) % 85);
      ctx.fillStyle = i % 2 ? '#100d20' : '#151029';
      ctx.fillRect(x, FLOOR - tall, 92, tall);
      ctx.fillStyle = 'rgba(34,211,238,0.32)';
      for (let row = 0; row < Math.floor(tall / 16); row += 1) {
        ctx.fillRect(x + 9 + (row % 2) * 11, FLOOR - tall + 12 + row * 16, 4, 5);
        ctx.fillRect(x + 42 + (row % 3) * 8, FLOOR - tall + 12 + row * 16, 4, 5);
      }
    }
  }

  private drawFighter(ctx: CanvasRenderingContext2D, fighter: Fighter) {
    const center = fighter.x;
    const ground = fighter.y + 104;
    const character = charById(fighter.style);
    let animation: AnimationName = 'idle';
    if (fighter.attackTime > 0) animation = fighter.attackSpecial ? 'special' : 'attack';
    else if (fighter.flash > 0) animation = 'hit';
    else if (fighter.guarding) animation = 'guard';
    else if (fighter.dashTime > 0) animation = 'dash';
    else if (fighter.y < FLOOR - 104) animation = 'jump';
    else if (Math.abs(fighter.vx) > 45) animation = 'run';

    const frame =
      animation === 'attack' || animation === 'special'
        ? Math.floor((1 - fighter.attackTime / fighter.attackDuration) * 7)
        : animation === 'hit'
          ? Math.floor(this.elapsed * 22)
          : Math.floor(this.elapsed * (animation === 'run' ? 12 : 7));
    drawFighterSprite(ctx, character, animation, frame, center - 54, ground - 138, 108, 138, fighter.facing < 0);
    return;

    /* legacy vector rendering retained below as the source for the generated sprite-sheet artwork. */
    const color = fighter.color;
    const walking = Math.sin(this.elapsed * 12 + center * 0.02) * Math.min(5, Math.abs(fighter.vx) / 55);
    const attacking = fighter.attackTime > 0;
    const attackProgress = attacking ? 1 - fighter.attackTime / fighter.attackDuration : 0;
    const strikeReach = fighter.attackSpecial ? 92 : 62;
    const strikeExtension = attacking
      ? Math.sin(Math.min(1, attackProgress * 1.65) * Math.PI * 0.5) * strikeReach
      : 0;
    const shoulderY = fighter.y + 47;
    const hipY = fighter.y + 78;
    const hairColor = fighter.style === 'titan' ? '#cbd5e1' : fighter.style === 'frost' ? '#dbeafe' : '#171126';
    ctx.save();
    const heroScale = fighter.style === 'titan' ? 1.22 : 1.3;
    ctx.translate(center * (1 - heroScale), ground * (1 - heroScale));
    ctx.scale(heroScale, heroScale);
    ctx.globalAlpha = fighter.hp <= 0 ? 0.35 : 1;
    ctx.shadowColor = color;
    ctx.shadowBlur = fighter.flash ? 30 : 16;
    ctx.fillStyle = `${color}25`;
    ctx.beginPath();
    ctx.ellipse(center, FLOOR + 1, fighter.style === 'titan' ? 49 : 40, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (['vex', 'titan', 'onyx', 'jade'].includes(fighter.style)) {
      ctx.fillStyle = fighter.style === 'onyx' ? '#100a1d' : '#101020';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(center - 20, fighter.y + 47);
      ctx.lineTo(center - 39, fighter.y + 79 + walking);
      ctx.lineTo(center - 35, ground - 14);
      ctx.lineTo(center - 11, fighter.y + 76);
      ctx.moveTo(center + 20, fighter.y + 47);
      ctx.lineTo(center + 39, fighter.y + 78 - walking);
      ctx.lineTo(center + 34, ground - 12);
      ctx.lineTo(center + 11, fighter.y + 76);
      ctx.stroke();
      ctx.fill();
    }

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 9;
    ctx.fillStyle = fighter.style === 'titan' ? '#252b37' : fighter.style === 'onyx' ? '#201529' : '#18202c';
    // Angular armored silhouette with broad shoulders and articulated limbs.
    ctx.beginPath();
    ctx.moveTo(center - 14, shoulderY - 7);
    ctx.lineTo(center - 31, shoulderY - 12);
    ctx.lineTo(center - 43, shoulderY + 3);
    ctx.lineTo(center - 35, shoulderY + 15);
    ctx.lineTo(center - 23, shoulderY + 10);
    ctx.lineTo(center - 20, hipY - 2);
    ctx.lineTo(center - 14, hipY + 9);
    ctx.lineTo(center + 14, hipY + 9);
    ctx.lineTo(center + 20, hipY - 2);
    ctx.lineTo(center + 23, shoulderY + 10);
    ctx.lineTo(center + 35, shoulderY + 15);
    ctx.lineTo(center + 43, shoulderY + 3);
    ctx.lineTo(center + 31, shoulderY - 12);
    ctx.lineTo(center + 14, shoulderY - 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Chest plate, waist armor and illuminated character crest.
    const chestGradient = ctx.createLinearGradient(center - 18, shoulderY, center + 18, hipY);
    chestGradient.addColorStop(0, `${color}aa`);
    chestGradient.addColorStop(0.52, '#282238');
    chestGradient.addColorStop(1, `${color}55`);
    ctx.fillStyle = chestGradient;
    ctx.beginPath();
    ctx.moveTo(center - 19, shoulderY - 5);
    ctx.lineTo(center - 13, shoulderY - 10);
    ctx.lineTo(center + 13, shoulderY - 10);
    ctx.lineTo(center + 19, shoulderY - 5);
    ctx.lineTo(center + 14, hipY - 1);
    ctx.lineTo(center, hipY + 5);
    ctx.lineTo(center - 14, hipY - 1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 13;
    ctx.beginPath();
    ctx.moveTo(center, shoulderY - 3);
    ctx.lineTo(center + 7, shoulderY + 7);
    ctx.lineTo(center, shoulderY + 14);
    ctx.lineTo(center - 7, shoulderY + 7);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0b0913';
    ctx.fillRect(center - 18, hipY + 5, 36, 9);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(center - 18, hipY + 6);
    ctx.lineTo(center + 18, hipY + 6);
    ctx.stroke();

    // Layered leg armor and boots.
    ctx.fillStyle = '#171322';
    ctx.strokeStyle = fighter.flash ? '#ffffff' : color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(center - 15, hipY + 9);
    ctx.lineTo(center - 4, hipY + 14);
    ctx.lineTo(center - 13 + walking, ground - 18);
    ctx.lineTo(center - 30 + walking, ground - 11);
    ctx.lineTo(center - 38 + walking, ground - 2);
    ctx.lineTo(center - 12 + walking, ground - 1);
    ctx.lineTo(center + 2, hipY + 14);
    ctx.lineTo(center + 15, hipY + 9);
    ctx.lineTo(center + 4, hipY + 14);
    ctx.lineTo(center + 15 - walking, ground - 18);
    ctx.lineTo(center + 32 - walking, ground - 11);
    ctx.lineTo(center + 39 - walking, ground - 2);
    ctx.lineTo(center + 11 - walking, ground - 1);
    ctx.lineTo(center - 2, hipY + 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillRect(center - 22 + walking, ground - 10, 9, 3);
    ctx.fillRect(center + 14 - walking, ground - 10, 9, 3);

    // Gauntlets and an active attack pose.
    const leadArmX = center + fighter.facing * (38 + strikeExtension);
    const leadArmY = shoulderY + (attacking ? 2 - strikeExtension * 0.12 : 13);
    ctx.strokeStyle = '#07050d';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(center - fighter.facing * 19, shoulderY + 1);
    ctx.lineTo(center - fighter.facing * 32, shoulderY + 23);
    ctx.lineTo(center - fighter.facing * 32, shoulderY + 36);
    ctx.moveTo(center + fighter.facing * 20, shoulderY);
    ctx.lineTo(center + fighter.facing * 29, shoulderY + 17);
    ctx.lineTo(leadArmX, leadArmY);
    ctx.stroke();
    ctx.strokeStyle = fighter.flash ? '#ffffff' : color;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(center - fighter.facing * 19, shoulderY + 1);
    ctx.lineTo(center - fighter.facing * 32, shoulderY + 23);
    ctx.lineTo(center - fighter.facing * 32, shoulderY + 36);
    ctx.moveTo(center + fighter.facing * 20, shoulderY);
    ctx.lineTo(center + fighter.facing * 29, shoulderY + 17);
    ctx.lineTo(leadArmX, leadArmY);
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(leadArmX, leadArmY, attacking ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();

    // Expressive anime eyes, swept hair, and a distinct crown/hood for each fighter.
    const headX = center - fighter.facing * 1;
    const headY = fighter.y + 21;
    ctx.fillStyle = '#e6b9a3';
    ctx.beginPath();
    ctx.ellipse(headX, headY, 15, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#05030c';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = fighter.style === 'onyx' ? '#2a1939' : hairColor;
    ctx.beginPath();
    ctx.moveTo(headX - 17, headY - 2);
    ctx.lineTo(headX - 15, headY - 15);
    ctx.lineTo(headX - 5, headY - 22);
    ctx.lineTo(headX + 2, headY - 16);
    ctx.lineTo(headX + 12, headY - 19);
    ctx.lineTo(headX + 19, headY - 6);
    ctx.lineTo(headX + 9, headY - 9);
    ctx.lineTo(headX + 3, headY - 3);
    ctx.lineTo(headX - 5, headY - 9);
    ctx.lineTo(headX - 12, headY - 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = fighter.style === 'titan' ? '#cbd5e1' : '#171126';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    switch (fighter.style) {
      case 'blitz':
        ctx.moveTo(headX - 13, headY - 12);
        ctx.lineTo(headX - 21, headY - 26);
        ctx.lineTo(headX - 3, headY - 19);
        ctx.lineTo(headX + 4, headY - 29);
        ctx.lineTo(headX + 10, headY - 16);
        ctx.lineTo(headX + 18, headY - 8);
        break;
      case 'nova':
      case 'ember':
        ctx.moveTo(headX - 14, headY - 13);
        ctx.lineTo(headX - 19, headY - 26);
        ctx.lineTo(headX - 7, headY - 19);
        ctx.lineTo(headX - 1, fighter.style === 'ember' ? headY - 33 : headY - 31);
        ctx.lineTo(headX + 5, headY - 18);
        ctx.lineTo(headX + 15, headY - 25);
        ctx.lineTo(headX + 16, headY - 10);
        break;
      case 'vex':
        ctx.arc(headX, headY - 2, 20, Math.PI, Math.PI * 2);
        ctx.lineTo(headX + 19, headY + 13);
        break;
      case 'titan':
        ctx.moveTo(headX - 15, headY - 5);
        ctx.lineTo(headX - 24, headY - 19);
        ctx.lineTo(headX - 8, headY - 17);
        ctx.lineTo(headX, headY - 13);
        ctx.lineTo(headX + 8, headY - 17);
        ctx.lineTo(headX + 24, headY - 19);
        ctx.lineTo(headX + 15, headY - 5);
        break;
      case 'echo':
        ctx.arc(headX - 15, headY + 1, 6, Math.PI * 0.5, Math.PI * 1.5);
        ctx.arc(headX + 15, headY + 1, 6, -Math.PI * 0.5, Math.PI * 0.5);
        break;
      case 'frost':
        ctx.moveTo(headX + fighter.facing * 10, headY - 14);
        ctx.lineTo(headX + fighter.facing * 31, headY - 24);
        ctx.lineTo(headX + fighter.facing * 25, headY - 12);
        ctx.lineTo(headX + fighter.facing * 39, headY - 10);
        ctx.lineTo(headX + fighter.facing * 18, headY - 3);
        break;
      case 'cipher':
        ctx.strokeRect(headX - 23, headY - 19, 8, 8);
        ctx.strokeRect(headX + 16, headY - 27, 6, 6);
        ctx.strokeRect(headX + 20, headY + 15, 5, 5);
        break;
      case 'jade':
        ctx.ellipse(headX - 18, headY - 16, 5, 12, -0.7, 0, Math.PI * 2);
        ctx.ellipse(headX + 17, headY - 18, 5, 12, 0.7, 0, Math.PI * 2);
        break;
      case 'onyx':
        ctx.moveTo(headX - 13, headY - 12);
        ctx.lineTo(headX - 25, headY - 31);
        ctx.lineTo(headX - 3, headY - 18);
        ctx.lineTo(headX + 4, headY - 18);
        ctx.lineTo(headX + 25, headY - 31);
        ctx.lineTo(headX + 13, headY - 10);
        break;
      default:
        break;
    }
    ctx.stroke();
    if (fighter.style === 'cipher' || fighter.style === 'jade') ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(headX - 10, headY + 3);
    ctx.lineTo(headX - 4, headY + 3);
    ctx.moveTo(headX + 3, headY + 3);
    ctx.lineTo(headX + 10, headY + 3);
    ctx.stroke();
    ctx.fillStyle = '#140d20';
    ctx.fillRect(headX - 10, headY + 2, 4, 3);
    ctx.fillRect(headX + 4, headY + 2, 4, 3);

    if (fighter.guarding) {
      ctx.strokeStyle = `${color}dd`;
      ctx.lineWidth = 3;
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(center + fighter.facing * 37, shoulderY + 20, 27, -Math.PI * 0.85, Math.PI * 0.85);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    if (attacking && attackProgress > 0.08) {
      const alpha = Math.sin(Math.min(1, attackProgress) * Math.PI);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = fighter.attackSpecial ? '#ffffff' : color;
      ctx.shadowColor = color;
      ctx.shadowBlur = fighter.attackSpecial ? 32 : 20;
      ctx.lineWidth = fighter.attackSpecial ? 12 : 6;
      ctx.beginPath();
      ctx.ellipse(
        center + fighter.facing * (fighter.attackSpecial ? 74 : 53),
        shoulderY + 9,
        fighter.attackSpecial ? 79 : 51,
        fighter.attackSpecial ? 52 : 35,
        fighter.facing * -0.28,
        -Math.PI * 0.82,
        Math.PI * 0.36,
      );
      ctx.stroke();
      ctx.globalAlpha = alpha * 0.82;
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(
        center + fighter.facing * 73,
        shoulderY + 4,
        fighter.attackSpecial ? 92 : 64,
        fighter.attackSpecial ? 59 : 41,
        fighter.facing * -0.28,
        -Math.PI * 0.82,
        Math.PI * 0.36,
      );
      ctx.stroke();
    }
    if (fighter.dashTime > 0) {
      ctx.globalAlpha = 0.24;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 18;
      ctx.fillRect(center - fighter.facing * 74, fighter.y + 12, 60, 77);
    }
    ctx.restore();
  }

  private drawEffects(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const effect of this.effects) {
      const progress = 1 - effect.life / effect.maxLife;
      const alpha = Math.max(0, effect.life / effect.maxLife);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = effect.color;
      ctx.fillStyle = effect.color;
      ctx.shadowColor = effect.color;
      ctx.shadowBlur = effect.kind === 'spark' ? 15 : 24;
      if (effect.kind === 'spark') {
        ctx.lineWidth = effect.size;
        ctx.beginPath();
        ctx.moveTo(effect.x, effect.y);
        ctx.lineTo(effect.x - effect.vx * 0.025, effect.y - effect.vy * 0.025);
        ctx.stroke();
      } else if (effect.kind === 'ring') {
        ctx.lineWidth = Math.max(1, 8 * alpha);
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, 8 + progress * effect.size, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.lineWidth = Math.max(2, 12 * alpha);
        ctx.beginPath();
        ctx.moveTo(effect.x - effect.size * 0.45, effect.y + effect.size * 0.4);
        ctx.quadraticCurveTo(effect.x, effect.y - effect.size * 0.7, effect.x + effect.size * 0.5, effect.y - effect.size * 0.18);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1, 3 * alpha);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private drawHud(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.fillStyle = 'rgba(8,5,18,0.77)';
    ctx.fillRect(24, 18, 320, 55);
    ctx.fillRect(WORLD_WIDTH - 344, 18, 320, 55);
    ctx.fillStyle = '#e9d5ff';
    ctx.font = 'bold 15px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(this.playerStats.name, 34, 39);
    ctx.textAlign = 'right';
    ctx.fillText(this.enemy.name, WORLD_WIDTH - 34, 39);
    this.drawHealth(ctx, 34, 49, 296, this.p1.hp / this.p1.maxHp, this.playerStats.color, false);
    this.drawHealth(ctx, WORLD_WIDTH - 34, 49, 296, this.enemy.hp / this.enemy.maxHp, this.enemy.color, true);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 14px Orbitron, sans-serif';
    ctx.fillText(`ROUND ${Math.min(this.round + 1, RIVAL_COUNT)} / ${RIVAL_COUNT}`, WORLD_WIDTH / 2, 37);
    ctx.fillStyle = '#ffffffcc';
    ctx.font = 'bold 12px Rajdhani, sans-serif';
    ctx.fillText(`SCORE ${this.score.toLocaleString()}`, WORLD_WIDTH / 2, 58);

    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(35, 84, 210, 7);
    ctx.fillStyle = this.p1.energy >= 100 ? '#fde047' : '#22d3ee';
    ctx.fillRect(35, 84, 210 * this.p1.energy / 100, 7);
    ctx.fillStyle = '#ffffff99';
    ctx.textAlign = 'left';
    ctx.font = '11px Rajdhani, sans-serif';
    ctx.fillText(this.p1.energy >= 100 ? 'SPECIAL READY · K / X' : 'ENERGY', 35, 105);
    if (this.combo > 1 && this.comboTimer > 0) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 20px Orbitron, sans-serif';
      ctx.fillText(`${this.combo} HIT COMBO`, WORLD_WIDTH / 2, 118);
    }
    ctx.restore();
  }

  private drawHealth(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, health: number, color: string, reverse: boolean) {
    const bounded = Math.max(0, Math.min(1, health));
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(reverse ? x - width : x, y, width, 10);
    ctx.fillStyle = color;
    ctx.fillRect(reverse ? x - width * bounded : x, y, width * bounded, 10);
  }
}
