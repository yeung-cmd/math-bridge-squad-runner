import fortressUrl from '../assets/bridge-fortress.webp';
import guardsUrl from '../assets/bridge-guards.webp';
import guardiansUrl from '../assets/bridge-guardians.webp';
import type { Lane, QuestionItem, QuestionModeId, WeaponInfo } from '../types/game';
import type { Defense } from './rescueDefense';
import { paintMonster } from './rescueMonsters';

function load(url: string) {
  const image = new Image();
  image.src = url;
  return image;
}
const fortress = load(fortressUrl);
const guards = load(guardsUrl);
const guardians = load(guardiansUrl);
export const prepareBridge = () => Promise.all([fortress, guards, guardians].map(image => image.decode()));

const bossColumn: Record<QuestionModeId, number> = { ADD_20: 0, ADD_50: 1, ADD_100: 2, NUMBER_SENSE: 3, MULTIPLY_DIGITS: 4 };
const tau = 2 * Math.PI;
const ground = (z: number) => 72 + z * (195 + 138 * z);
const side = (x: number, z: number) => 200 + x * (.12 + z * .88);
const clamp = (n: number) => Math.min(1, Math.max(0, n));

export interface FieldFrame {
  time: number;
  travel: number;
  lane: number;
  selected: Lane | null;
  firstRecruit: number;
  recruitAge: number;
  troops: number;
  weapon: WeaponInfo;
  question: QuestionItem;
  gate: number;
  impact: boolean;
  mode: QuestionModeId;
  bossTime: number;
  bossHp: number;
  armed: boolean;
  defense: Defense;
  reduced: boolean;
}

function soldier(i: number, count: number, lane: number) {
  const columns = Math.min(8, Math.ceil(Math.sqrt(count)));
  const row = Math.floor(i / columns);
  const rowSize = Math.min(columns, count - row * columns);
  return {
    x: 200 + lane * 85 + ((i % columns) - (rowSize - 1) / 2) * 18,
    y: 376 - row * 13
  };
}

function marker(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, value: number, selected: boolean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#6c421c';
  ctx.fillRect(-31, -20, 4, 28);
  ctx.fillRect(27, -20, 4, 28);
  ctx.beginPath();
  ctx.roundRect(-37, -36, 74, 32, 8);
  ctx.fillStyle = selected ? '#0b656f' : '#192f50';
  ctx.fill();
  ctx.strokeStyle = selected ? '#ffda74' : '#e2f5ff';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.font = 'bold 24px system-ui';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.fillText(String(value), 0, -12);
  ctx.restore();
}

function beam(ctx: CanvasRenderingContext2D, sx: number, sy: number, tx: number, ty: number, p: number, color: string) {
  const tail = Math.max(0, p - .13);
  ctx.beginPath();
  ctx.moveTo(sx + (tx - sx) * tail, sy + (ty - sy) * tail);
  ctx.lineTo(sx + (tx - sx) * p, sy + (ty - sy) * p);
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.strokeStyle = '#fffde6';
  ctx.lineWidth = 1.8;
  ctx.stroke();
}

export function drawBridge(ctx: CanvasRenderingContext2D, f: FieldFrame) {
  const aspect = Math.min(1.48, ctx.canvas.height * 400 / (ctx.canvas.width * 420));
  const boss = f.bossTime >= 0;
  const zoom = f.reduced ? 1 : 1 + .045 * (f.question.index - 1 + f.gate) / 20;
  const pan = f.reduced ? 0 : -f.lane * 2;
  ctx.drawImage(fortress, 200 - 203 * zoom + pan, 72 - 73 * zoom, 406 * zoom, 422 * zoom);
  if (!f.reduced && !boss) {
    for (let i = 0; i < 12; i++) {
      const z = ((i + f.travel % 1) / 12) ** 1.65;
      ctx.fillStyle = '#fff2b9ad';
      for (const sign of [-1, 1]) ctx.fillRect(side(sign * 179, z), ground(z), 1 + z * 2.4, 1 + z * 3);
    }
  }
  const bossScale = boss ? .36 + .64 * clamp(f.bossTime / .8) : .12 + .23 * ((f.question.index - 1 + f.gate) / 20) ** 3;
  const bh = 141 * bossScale;
  const bw = bh * aspect;
  const by = 77 + 111 * bossScale;
  ctx.save();
  if (boss && f.bossHp <= 0) ctx.globalAlpha = .28;
  const hop = f.reduced ? 0 : Math.sin(f.time * 5) * bossScale * 2;
  ctx.fillStyle = '#48311b60';
  ctx.beginPath();
  ctx.ellipse(200, by + 1, bw * .36, bh * .057, 0, 0, tau);
  ctx.fill();
  ctx.drawImage(guardians, bossColumn[f.mode] * 256, 0, 256, 256, 200 - bw / 2, by - bh + hop, bw, bh);
  ctx.restore();

  const d = f.defense;
  for (let i = d.drones.length - 1; i >= 0; i--) {
    const m = d.drones[i];
    const x = side(m.x * Math.min(1, .35 + m.depth * 4), m.depth);
    ctx.globalAlpha = Math.min(1, .14 + m.depth * 36) * (boss ? 1 - clamp(f.bossTime / .85) : 1);
    if (ctx.globalAlpha > 0) paintMonster(ctx, m.variant, x, ground(m.depth), .17 + .63 * m.depth,
      f.time * (m.variant ? 1.85 : 1.4) + m.id * .37, aspect, f.reduced);
  }
  ctx.globalAlpha = 1;
  if (!f.impact && !boss) {
    const z = .18 + .64 * f.gate ** 1.35;
    for (const dir of [-1, 1]) marker(ctx, side(dir * 113, z), ground(z), .53 + z * .68,
      dir < 0 ? f.question.leftOption : f.question.rightOption, f.selected === (dir < 0 ? 'LEFT' : 'RIGHT'));
  }

  const count = Math.min(f.troops, 64);
  for (let i = count - 1; i >= 0; i--) {
    const pos = soldier(i, count, f.lane);
    const joining = !f.reduced && i >= f.firstRecruit ? 1 - clamp(f.recruitAge / .5) : 0;
    const x = pos.x + (i % 2 ? -1 : 1) * 62 * joining * joining;
    const y = pos.y + 14 * joining;
    const stride = f.reduced ? 0 : Math.sin(f.time * 10 + i * 2.12);
    const h = 38 + (y - 310) * .14;
    const w = aspect * h;
    ctx.fillStyle = '#513b2c64';
    ctx.beginPath();
    ctx.ellipse(x + w * .11, y + 1, w * .27, h * .07, .13, 0, tau);
    ctx.fill();
    ctx.drawImage(guards, stride >= 0 ? 0 : 176, 0, 176, 176,
      x - w / 2 + stride * .65, y - h - Math.abs(stride) * 2, w, h);
  }
  ctx.lineCap = 'round';
  for (const bolt of d.bolts) {
    if (bolt.age < 0) continue;
    const m = bolt.target;
    const depth = m?.depth ?? 0;
    const source = soldier(bolt.slot % count, count, bolt.lane);
    beam(ctx, source.x, source.y - 29, side((m?.x ?? 0) * Math.min(1, .35 + depth * 4), depth),
      ground(depth) - 14 * (.2 + depth), bolt.age / bolt.duration, f.weapon.projectileColor);
  }
  for (const hit of d.hits) {
    const p = hit.age / 350;
    ctx.globalAlpha = 1 - p;
    ctx.strokeStyle = '#fff4a8';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(side(hit.x * Math.min(1, .35 + hit.depth * 4), hit.depth), ground(hit.depth) - 8, 3 + (f.reduced ? 2 : p * 15), 0, tau);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  if (boss && f.armed && f.bossTime > .8 && f.bossHp > 0 && f.bossTime < 3.1) {
    for (let i = 0; i < Math.min(count, 9); i++) {
      const a = soldier(i, count, f.lane);
      beam(ctx, a.x, a.y - 29, 178 + i * 5, by - bh * .46, (f.bossTime * 2.2 + i * .31) % 1, f.weapon.projectileColor);
    }
  }
}
