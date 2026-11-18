import { paintMonster } from './rescueMonsters';
import type { Defense, Drone } from './rescueDefense';
import arenaUrl from '../assets/causeway.webp';
import scoutUrl from '../assets/rescue-scout.webp';
import captainUrl from '../assets/rescue-captain.webp';

export const SCENE_WIDTH = 400;
export const SCENE_HEIGHT = 440;
export const STARTING_ROBOTS = 5;
export const REWARD_TILES = 3;
const TAU = Math.PI * 2;

export interface RescueFrame {
  elapsed: number;
  lane: number;
  team: number;
  charge: number | null;
  layers: number;
  defense: Defense;
}

function imageAsset(url: string) {
  const image = new Image();
  image.src = url;
  return image;
}
const arena = imageAsset(arenaUrl);
const scouts = [imageAsset(captainUrl), imageAsset(scoutUrl)];
export async function prepareArena() {
  await Promise.all([arena, ...scouts].map(image => image.decode()));
}

const scaleAt = (z: number) => .15 + .85 * z;
const roadY = (z: number) => 52 + z * (212 + 151 * z);
const roadX = (x: number, z: number) => 200 + x * scaleAt(z);
function monsterX(m: Drone, elapsed: number, reduced: boolean) {
  const sway = reduced ? 0 : Math.sin(elapsed * 2.5 + m.id * 2) * 6;
  return roadX(m.x * Math.min(1, .35 + m.depth * 4) + sway, m.depth);
}
function teamX(slot: number, lane: number) {
  if (slot === 0) return 200 + lane * 91;
  const pair = Math.ceil(slot / 2);
  return 200 + lane * 91 + (slot % 2 ? -1 : 1) * (22 + ((pair - 1) % 3) * 17);
}
function teamY(slot: number) {
  return 388 - Math.ceil(slot / 2) * 10;
}
function polygon(ctx: CanvasRenderingContext2D, points: number[], color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
  ctx.closePath();
  ctx.fill();
}

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
}

function drawTower(ctx: CanvasRenderingContext2D, frame: RescueFrame, reduced: boolean) {
  const progress = frame.charge ?? 0;
  rect(ctx, 92, 358, 216, 29, 13, '#172941');
  rect(ctx, 112, 345, 176, 24, 10, '#497397');
  const litLayers = Math.min(frame.layers, Math.floor(progress * (frame.layers + 1)));
  for (let i = 0; i < 5; i++) {
    const width = 135 - i * 13;
    const y = 345 - i * 35;
    polygon(ctx, [200 - width / 2, y, 200 - width / 2 + 10, y - 28, 200 + width / 2 - 10, y - 28, 200 + width / 2, y], i < litLayers ? '#55c8c8' : '#28476b');
    rect(ctx, 183, y - 23, 34, 14, 5, i < litLayers ? '#fff0a0' : '#6985a3');
  }
  if (frame.layers > 0 && progress > .72) {
    const aperture = reduced ? 48 : 42 + Math.sin(frame.elapsed * 3) * 12;
    polygon(ctx, [191, 184, 200 - aperture, 0, 200 + aperture, 0, 209, 184], '#fff5aa45');
  }
  rect(ctx, 185, 174, 30, 25, 11, litLayers ? '#ffeb8d' : '#8399b7');
  if (frame.layers > 0 && !reduced) {
    for (let i = 0; i < 14; i++) {
      const phase = (progress * 2 + i * .09) % 1;
      const y = 392 - phase * 211;
      const x = 200 + Math.sin(i * 1.6 + phase * 8) * 48 * (1 - phase);
      rect(ctx, x, y, 5, 5, 2, '#c4fff2');
    }
  }
}

function drawSquadMember(ctx: CanvasRenderingContext2D, frame: RescueFrame, i: number, aspect: number, reduced: boolean) {
  const image = scouts[i === 0 ? 0 : 1];
  const x = teamX(i, frame.lane);
  const y = teamY(i);
  const gait = reduced ? 0 : Math.sin(frame.elapsed * 8 + i * 2);
  const recoil = reduced ? 0 : frame.defense.bolts.some(b => b.slot === i && b.age >= 0 && b.age < 100) ? 3 : 0;
  const height = (i === 0 ? 72 : 60) - Math.ceil(i / 2) * 1.3;
  const width = height * image.naturalWidth / image.naturalHeight * aspect;
  ctx.fillStyle = '#3d30265e';
  ctx.beginPath();
  ctx.ellipse(x + width * .14, y + 2, width * .53, height * .105, .10, 0, TAU);
  ctx.fill();
  ctx.drawImage(image, x - width / 2 + gait * .65, y - height - Math.abs(gait) * 1.8 + recoil, width, height);
}

function drawShots(ctx: CanvasRenderingContext2D, frame: RescueFrame, reduced: boolean) {
  ctx.lineCap = 'round';
  for (const b of frame.defense.bolts) {
    if (b.age < 0) continue;
    const t = Math.min(1, b.age / b.duration);
    const tail = Math.max(0, t - .14);
    const sx = teamX(b.slot, b.lane);
    const sy = teamY(b.slot) - (b.slot === 0 ? 69 : 56) + Math.ceil(b.slot / 2);
    const tx = b.target ? monsterX(b.target, frame.elapsed, reduced) : 200;
    const depth = b.target?.depth ?? 0;
    const ty = roadY(depth) - 24 * scaleAt(depth);
    const dx = tx - sx;
    const dy = ty - sy;
    const arc = reduced ? 0 : 17;
    const x = sx + dx * t;
    const y = sy + dy * t - Math.sin(t * Math.PI) * arc;
    ctx.beginPath();
    ctx.moveTo(sx + dx * tail, sy + dy * tail - Math.sin(tail * Math.PI) * arc);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#058ba9';
    ctx.lineWidth = 4.4;
    ctx.stroke();
    ctx.strokeStyle = '#c6ffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  for (const hit of frame.defense.hits) {
    const t = hit.age / 350;
    const x = roadX(hit.x, hit.depth);
    const y = roadY(hit.depth) - 19 * scaleAt(hit.depth);
    ctx.globalAlpha = 1 - t;
    ctx.beginPath();
    ctx.arc(x, y, 2 + (reduced ? 5 : t * 18), 0, TAU);
    ctx.strokeStyle = '#ecffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (!reduced) {
      for (let i = 0; i < 5; i++) {
        const a = i * TAU / 5 + hit.x;
        ctx.fillStyle = i % 2 ? '#36e8ff' : '#fff29d';
        ctx.fillRect(x + Math.cos(a) * t * 24, y + Math.sin(a) * t * 19, 3, 3);
      }
    }
  }
  ctx.globalAlpha = 1;
}

export function createRescuePainter(ctx: CanvasRenderingContext2D) {
  return (frame: RescueFrame, reduced: boolean) => {
    ctx.save();
    const pan = reduced ? 0 : -frame.lane * 3;
    ctx.translate(pan, 0);
    ctx.drawImage(arena, -4, -1, 408, 442);
    if (frame.charge !== null) {
      drawTower(ctx, frame, reduced);
      ctx.restore();
      return;
    }
    const aspect = Math.min(1.45, ctx.canvas.height * SCENE_WIDTH / (ctx.canvas.width * SCENE_HEIGHT));
    if (!reduced) {
      // Windborne motes cross the ravine at different depths.
      ctx.fillStyle = '#fff9d09c';
      for (let i = 0; i < 18; i++) {
        const z = (frame.elapsed * .05 + i * .173) % 1;
        const x = (i % 2 ? 400 : 0) + (i % 2 ? -1 : 1) * (9 + (i * 17) % 46) + Math.sin(z * 6 + i) * 9;
        ctx.fillRect(x, 28 + z * 340, 1 + z, 1 + z);
      }
    }
    const { drones, lastHit } = frame.defense;
    // Composite both formations back to front where they meet on the bridge.
    let ally = frame.team - 1;
    for (let i = drones.length - 1; i >= 0; i--) {
      const m = drones[i];
      const y = roadY(m.depth);
      while (ally >= 0 && teamY(ally) < y) drawSquadMember(ctx, frame, ally--, aspect, reduced);
      ctx.globalAlpha = Math.min(1, .1 + m.depth * 40);
      const scale = .23 + m.depth * .92;
      paintMonster(ctx, m.variant, monsterX(m, frame.elapsed, reduced), y, scale,
        frame.elapsed * (m.variant ? 1.9 : 1.35) + m.id * .37, aspect, reduced);
      ctx.globalAlpha = 1;
    }
    while (ally >= 0) drawSquadMember(ctx, frame, ally--, aspect, reduced);
    drawShots(ctx, frame, reduced);
    if (lastHit < 330) {
      ctx.globalAlpha = .8 * (1 - lastHit / 330);
      rect(ctx, 22, 397, 356, 5, 2, '#ff674b');
    }
    ctx.restore();
  };
}
