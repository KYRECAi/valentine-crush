import { getSprite } from "./assets";
import type { LoveWorld } from "./sim";
import type { ItemKind } from "./types";

const ITEM_SRC: Record<ItemKind, string> = {
  heart: "/sprites/items/heart.png",
  star: "/sprites/items/star.png",
  gem: "/sprites/items/gem.png",
  note: "/sprites/items/note.png",
  coin: "/sprites/items/coin.png",
  rainbow: "/sprites/items/rainbow.png",
  lantern: "/sprites/items/lantern.png",
  gift: "/sprites/items/gift.png",
  bag: "/sprites/items/bag.png",
};

export function renderWorld(ctx: CanvasRenderingContext2D, world: LoveWorld, now: number) {
  const { w, h } = world;
  ctx.clearRect(0, 0, w, h);

  const petal = getSprite("/sprites/fx/petal.png");
  for (const p of world.particles) {
    const a = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = Math.min(1, a * 1.2);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    if (p.kind === "petal" && petal) {
      ctx.drawImage(petal, -p.size / 2, -p.size / 2, p.size, p.size);
    } else if (p.kind === "spark") {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.size * a, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === "text" && p.text) {
      ctx.rotate(-p.rot);
      ctx.font = "700 16px Fredoka, Nunito, sans-serif";
      ctx.textAlign = "center";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(58,32,68,0.35)";
      ctx.fillStyle = p.color;
      ctx.strokeText(p.text, 0, 0);
      ctx.fillText(p.text, 0, 0);
    }
    ctx.restore();
  }

  for (const it of world.items) {
    const img = getSprite(ITEM_SRC[it.kind]);
    const pulse = 1 + Math.sin(now * 0.006 + it.id) * 0.05;
    const s = it.size * it.scale * pulse;
    ctx.save();
    ctx.translate(it.x, it.y);
    ctx.rotate(it.rot * 0.25);
    if (it.kind === "coin" || it.kind === "bag") {
      ctx.shadowColor = "rgba(240,180,41,0.9)";
      ctx.shadowBlur = it.kind === "bag" ? 24 : 18;
    } else if (it.atYou || it.fromStan) {
      ctx.shadowColor = "rgba(255,91,138,0.95)";
      ctx.shadowBlur = 22;
    } else if (it.kind === "rainbow") {
      ctx.shadowColor = "rgba(255,180,220,0.55)";
      ctx.shadowBlur = 10;
    }
    if (img) ctx.drawImage(img, -s / 2, -s / 2, s, s);
    ctx.restore();
  }

  if (world.pulse) {
    const img = getSprite("/sprites/items/pulse.png");
    const s = 168 * Math.max(0.7, world.pulse.scale);
    ctx.save();
    ctx.translate(world.pulse.x, world.pulse.y);
    ctx.shadowColor = "rgba(126,200,255,0.95)";
    ctx.shadowBlur = 28;
    if (img) ctx.drawImage(img, -s / 2, -s / 2, s, s);
    ctx.restore();
  }
}
