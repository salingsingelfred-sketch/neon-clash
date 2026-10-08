import type { CharacterDef } from './characters';

export type AnimationName = 'idle' | 'run' | 'attack' | 'special' | 'hit' | 'jump' | 'guard' | 'dash';

export const SPRITE_FRAME_WIDTH = 80;
export const SPRITE_FRAME_HEIGHT = 112;
export const SPRITE_FRAME_COUNT = 8;

const ANIMATIONS: AnimationName[] = ['idle', 'run', 'attack', 'special', 'hit', 'jump', 'guard', 'dash'];
const CACHE_LIMIT = 3;
const sheets = new Map<string, HTMLCanvasElement>();

function drawLimb(
  ctx: CanvasRenderingContext2D,
  points: Array<[number, number]>,
  color: string,
  width: number,
  accent?: string,
) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#080611';
  ctx.lineWidth = width + 4;
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  const [handX, handY] = points[points.length - 1];
  ctx.fillStyle = accent ?? color;
  ctx.beginPath();
  ctx.arc(handX, handY, width * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#100b19';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawFighterFrame(
  ctx: CanvasRenderingContext2D,
  def: CharacterDef,
  animation: AnimationName,
  frame: number,
) {
  const phase = (frame / SPRITE_FRAME_COUNT) * Math.PI * 2;
  const moving = animation === 'run' || animation === 'dash';
  const active = animation === 'attack' || animation === 'special';
  const powered = animation === 'special';
  const guarded = animation === 'guard';
  const hurt = animation === 'hit';
  const airborne = animation === 'jump';
  const runSwing = moving ? Math.sin(phase) * 1.25 : Math.sin(phase) * 0.2;
  const runBounce = moving ? Math.abs(Math.cos(phase)) * 2.8 : Math.sin(phase * 2) * 1;
  const attackProgress = Math.max(0, Math.min(1, frame / (SPRITE_FRAME_COUNT - 1)));
  const punch = active ? Math.sin(attackProgress * Math.PI * 0.5) : 0;
  const lean = hurt ? -6 : animation === 'dash' ? 8 : active ? 5 + punch * 5 : 0;
  const headY = 19 + runBounce + (hurt ? 2 : 0) - (airborne ? 5 : 0);
  const shoulderY = 41 + runBounce - (airborne ? 4 : 0);
  const hipY = 66 + runBounce - (airborne ? 3 : 0);
  const centerX = 40 + lean;
  const bodyWidth = def.id === 'titan' ? 23 : def.id === 'jade' ? 20 : 18;
  const accent = def.color;
  const skin = def.id === 'onyx' ? '#c6a5a0' : def.id === 'titan' ? '#d6bdad' : '#f0c6ad';

  ctx.save();
  ctx.translate(0, runBounce);

  const shadow = ctx.createRadialGradient(40, 106, 2, 40, 106, 31);
  shadow.addColorStop(0, `${accent}55`);
  shadow.addColorStop(1, `${accent}00`);
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(40, 107, 30, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  if (def.id === 'vex' || def.id === 'onyx' || def.id === 'jade') {
    ctx.fillStyle = def.id === 'onyx' ? '#191024' : '#151126';
    ctx.strokeStyle = `${accent}bb`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - bodyWidth * 0.7, shoulderY + 4);
    ctx.lineTo(centerX - 20, hipY + 23 + runSwing * 2);
    ctx.lineTo(centerX - 11, 102);
    ctx.lineTo(centerX - 6, hipY + 4);
    ctx.moveTo(centerX + bodyWidth * 0.7, shoulderY + 4);
    ctx.lineTo(centerX + 21, hipY + 21 - runSwing * 2);
    ctx.lineTo(centerX + 12, 101);
    ctx.lineTo(centerX + 6, hipY + 4);
    ctx.stroke();
    ctx.fill();
  }

  const farLeg: Array<[number, number]> = animation === 'jump'
    ? [[centerX + 5, hipY], [centerX + 13, hipY + 13], [centerX + 19, hipY + 17], [centerX + 25, hipY + 13]]
    : [[centerX + 5, hipY], [centerX + 10 + runSwing * 8, 84], [centerX + 10 + runSwing * 14, 101 - Math.max(0, runSwing) * 5]];
  const nearLeg: Array<[number, number]> = animation === 'jump'
    ? [[centerX - 5, hipY], [centerX - 15, hipY + 12], [centerX - 20, hipY + 19], [centerX - 27, hipY + 15]]
    : [[centerX - 5, hipY], [centerX - 10 - runSwing * 8, 84], [centerX - 10 - runSwing * 14, 101 - Math.max(0, -runSwing) * 5]];
  drawLimb(ctx, farLeg, '#9ba3b7', def.id === 'titan' ? 9 : 7, '#e2e8f0');
  drawLimb(ctx, nearLeg, '#68738d', def.id === 'titan' ? 10 : 8, accent);

  const torso = ctx.createLinearGradient(centerX - bodyWidth, shoulderY, centerX + bodyWidth, hipY + 4);
  torso.addColorStop(0, '#141123');
  torso.addColorStop(0.3, `${accent}99`);
  torso.addColorStop(0.52, '#272039');
  torso.addColorStop(1, `${accent}77`);
  ctx.fillStyle = torso;
  ctx.strokeStyle = '#080611';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(centerX - bodyWidth, shoulderY - 4);
  ctx.lineTo(centerX - bodyWidth - 6, shoulderY + 3);
  ctx.lineTo(centerX - bodyWidth + 2, hipY - 5);
  ctx.lineTo(centerX - 11, hipY + 3);
  ctx.lineTo(centerX + 11, hipY + 3);
  ctx.lineTo(centerX + bodyWidth - 2, hipY - 5);
  ctx.lineTo(centerX + bodyWidth + 6, shoulderY + 3);
  ctx.lineTo(centerX + bodyWidth, shoulderY - 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = `${accent}e8`;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(centerX - bodyWidth + 3, shoulderY + 4);
  ctx.lineTo(centerX, shoulderY + 13);
  ctx.lineTo(centerX + bodyWidth - 3, shoulderY + 4);
  ctx.moveTo(centerX - 12, hipY - 6);
  ctx.lineTo(centerX + 12, hipY - 6);
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.shadowColor = accent;
  ctx.shadowBlur = powered ? 16 : 8;
  ctx.beginPath();
  ctx.moveTo(centerX, shoulderY + 1);
  ctx.lineTo(centerX + 6, shoulderY + 9);
  ctx.lineTo(centerX, shoulderY + 16);
  ctx.lineTo(centerX - 6, shoulderY + 9);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#11101c';
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(centerX - 12, hipY - 5);
  ctx.lineTo(centerX + 12, hipY - 5);
  ctx.lineTo(centerX + 14, hipY + 5);
  ctx.lineTo(centerX - 14, hipY + 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const backArm: Array<[number, number]> = guarded
    ? [[centerX - 13, shoulderY], [centerX - 20, shoulderY - 8], [centerX - 16, shoulderY - 21]]
    : hurt
      ? [[centerX - 13, shoulderY], [centerX - 25, shoulderY + 8], [centerX - 24, shoulderY + 20]]
      : [[centerX - 13, shoulderY], [centerX - 20, shoulderY + 11 + runSwing * 9], [centerX - 17, shoulderY + 23 + runSwing * 12]];
  drawLimb(ctx, backArm, '#68738d', 6, accent);

  const leadHandX = active
    ? centerX + 18 + punch * (powered ? 43 : 30)
    : guarded
      ? centerX + 22
      : centerX + 17 + runSwing * 12;
  const leadHandY = active
    ? shoulderY + 4 - punch * (powered ? 8 : 3)
    : guarded
      ? shoulderY - 12
      : shoulderY + 20 - runSwing * 12;
  const leadArm: Array<[number, number]> = guarded
    ? [[centerX + 13, shoulderY], [centerX + 23, shoulderY - 7], [leadHandX, leadHandY]]
    : active
      ? [[centerX + 13, shoulderY], [centerX + 21 + punch * 7, shoulderY - 4], [leadHandX, leadHandY]]
      : [[centerX + 13, shoulderY], [centerX + 22, shoulderY + 10 - runSwing * 3], [leadHandX, leadHandY]];
  drawLimb(ctx, leadArm, '#9ba3b7', def.id === 'titan' ? 9 : 7, '#f8fafc');

  ctx.fillStyle = skin;
  ctx.strokeStyle = '#120d17';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(centerX, headY, 10.5, 12.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  const hair = def.id === 'titan' || def.id === 'frost' ? '#dbeafe' :
    def.id === 'ember' ? '#ff783f' :
      def.id === 'nova' ? '#f6a8c3' :
        def.id === 'jade' ? '#a3e635' :
          def.id === 'echo' ? '#b9f1e2' :
            def.id === 'cipher' ? '#c4b5fd' :
              def.id === 'onyx' ? '#252038' : '#202033';
  ctx.fillStyle = hair;
  ctx.strokeStyle = '#100b19';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(centerX - 11, headY - 2);
  ctx.lineTo(centerX - 10, headY - 11);
  ctx.lineTo(centerX - 3, headY - 15);
  ctx.lineTo(centerX + 2, headY - 10);
  ctx.lineTo(centerX + 8, headY - 14);
  ctx.lineTo(centerX + 12, headY - 4);
  ctx.lineTo(centerX + 6, headY - 7);
  ctx.lineTo(centerX + 1, headY - 2);
  ctx.lineTo(centerX - 4, headY - 7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(centerX - 7, headY + 2);
  ctx.lineTo(centerX - 3, headY + 2);
  ctx.moveTo(centerX + 3, headY + 2);
  ctx.lineTo(centerX + 7, headY + 2);
  ctx.stroke();
  ctx.fillStyle = '#17101d';
  ctx.fillRect(centerX - 6, headY + 1, 2.5, 2.5);
  ctx.fillRect(centerX + 4, headY + 1, 2.5, 2.5);

  if (def.id === 'titan') {
    ctx.fillStyle = '#6b7280';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.fillRect(centerX - 13, headY - 7, 26, 9);
    ctx.strokeRect(centerX - 13, headY - 7, 26, 9);
  } else if (def.id === 'vex' || def.id === 'onyx') {
    ctx.fillStyle = '#100b19';
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - 11, headY + 2);
    ctx.lineTo(centerX - 12, headY + 8);
    ctx.lineTo(centerX - 5, headY + 11);
    ctx.lineTo(centerX + 7, headY + 9);
    ctx.lineTo(centerX + 11, headY + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (def.id === 'blitz' || def.id === 'ember') {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 5, headY - 12);
    ctx.lineTo(centerX - 12, headY - 21);
    ctx.lineTo(centerX - 2, headY - 16);
    ctx.moveTo(centerX + 2, headY - 12);
    ctx.lineTo(centerX + 7, headY - 22);
    ctx.lineTo(centerX + 11, headY - 10);
    ctx.stroke();
  } else if (def.id === 'jade') {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(centerX - 12, headY - 14, 3, 7, -0.65, 0, Math.PI * 2);
    ctx.ellipse(centerX + 12, headY - 14, 3, 7, 0.65, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (active || powered) {
    const slashColor = powered ? '#ffffff' : accent;
    ctx.globalAlpha = 0.3 + Math.sin(attackProgress * Math.PI) * 0.5;
    ctx.strokeStyle = slashColor;
    ctx.shadowColor = accent;
    ctx.shadowBlur = powered ? 20 : 10;
    ctx.lineWidth = powered ? 7 : 4;
    ctx.beginPath();
    ctx.arc(centerX + (powered ? 37 : 27), shoulderY + 5, powered ? 35 : 27, -1.2, 0.75);
    ctx.stroke();
  }
  if (hurt) {
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 25, headY - 18);
    ctx.lineTo(centerX - 19, headY - 10);
    ctx.moveTo(centerX + 22, headY - 15);
    ctx.lineTo(centerX + 29, headY - 8);
    ctx.stroke();
  }
  if (animation === 'dash') {
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 9;
    ctx.lineWidth = 2;
    for (let trail = 0; trail < 3; trail += 1) {
      ctx.beginPath();
      ctx.moveTo(10, 28 + trail * 25);
      ctx.lineTo(28, 28 + trail * 25);
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function getFighterSpriteSheet(def: CharacterDef) {
  const cached = sheets.get(def.id);
  if (cached) {
    sheets.delete(def.id);
    sheets.set(def.id, cached);
    return cached;
  }

  const sheet = document.createElement('canvas');
  sheet.width = SPRITE_FRAME_WIDTH * SPRITE_FRAME_COUNT;
  sheet.height = SPRITE_FRAME_HEIGHT * ANIMATIONS.length;
  const ctx = sheet.getContext('2d');
  if (!ctx) throw new Error('Unable to create the fighter animation sprite sheet.');

  ANIMATIONS.forEach((animation, row) => {
    for (let frame = 0; frame < SPRITE_FRAME_COUNT; frame += 1) {
      ctx.save();
      ctx.translate(frame * SPRITE_FRAME_WIDTH, row * SPRITE_FRAME_HEIGHT);
      drawFighterFrame(ctx, def, animation, frame);
      ctx.restore();
    }
  });

  sheets.set(def.id, sheet);
  if (sheets.size > CACHE_LIMIT) {
    const oldest = sheets.keys().next().value;
    if (oldest) sheets.delete(oldest);
  }
  return sheet;
}

export function drawFighterSprite(
  ctx: CanvasRenderingContext2D,
  def: CharacterDef,
  animation: AnimationName,
  frame: number,
  x: number,
  y: number,
  width: number,
  height: number,
  flip = false,
) {
  const sheet = getFighterSpriteSheet(def);
  const row = ANIMATIONS.indexOf(animation);
  const column = ((Math.floor(frame) % SPRITE_FRAME_COUNT) + SPRITE_FRAME_COUNT) % SPRITE_FRAME_COUNT;
  const sourceX = column * SPRITE_FRAME_WIDTH;
  const sourceY = row * SPRITE_FRAME_HEIGHT;
  if (flip) {
    ctx.save();
    ctx.translate(x + width, y);
    ctx.scale(-1, 1);
    ctx.drawImage(sheet, sourceX, sourceY, SPRITE_FRAME_WIDTH, SPRITE_FRAME_HEIGHT, 0, 0, width, height);
    ctx.restore();
  } else {
    ctx.drawImage(sheet, sourceX, sourceY, SPRITE_FRAME_WIDTH, SPRITE_FRAME_HEIGHT, x, y, width, height);
  }
}
