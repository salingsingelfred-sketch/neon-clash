import type { CharacterDef } from './characters';
import { drawFighterSprite } from './spriteSheet';

type PreviewFighter = { seed: number };

export function previewFighter(def: CharacterDef): PreviewFighter {
  return { seed: def.id.length * 13 };
}

export function renderPreview(
  ctx: CanvasRenderingContext2D,
  def: CharacterDef,
  fighter: PreviewFighter,
  time: number,
  width: number,
  height: number,
) {
  ctx.clearRect(0, 0, width, height);
  const bob = Math.sin(time * 2.4 + fighter.seed) * 3;
  const spriteWidth = Math.min(width * 0.76, 115);
  const spriteHeight = height * 0.88;
  drawFighterSprite(
    ctx,
    def,
    'idle',
    time * 7 + fighter.seed,
    (width - spriteWidth) / 2,
    height - spriteHeight + bob,
    spriteWidth,
    spriteHeight,
  );
}
