import type { Defense } from './rescueDefense';

export const SCENE_WIDTH = 400;
export const SCENE_HEIGHT = 440;
export const STARTING_ROBOTS = 3;
export const REWARD_TILES = 3;

const HORIZON = 92;
const ROAD_DEPTH = 326;

export interface RescueFrame {
  elapsed: number;
  distance: number;
  lane: number;
  selected: number;
  approach: number;
  rush: boolean;
  team: number;
  options: readonly [number, number];
  result: 'correct' | 'wrong' | 'timeout' | null;
  rewardElapsed: number;
  charge: number | null;
  layers: number;
  defense: Defense;
}

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const depthScale = (z: number) => .13 + z * .87;
const roadY = (z: number) => HORIZON + ROAD_DEPTH * z;
const roadX = (x: number, z: number) => SCENE_WIDTH / 2 + x * depthScale(z);

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

function paintSky(ctx: CanvasRenderingContext2D) {
  const sky = ctx.createLinearGradient(0, 0, 0, SCENE_HEIGHT);
  sky.addColorStop(0, '#0e1339');
  sky.addColorStop(.42, '#254a71');
  sky.addColorStop(1, '#102b40');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
  const halo = ctx.createRadialGradient(200, 82, 0, 200, 82, 160);
  halo.addColorStop(0, '#6dacc76b');
  halo.addColorStop(1, '#6dacc700');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, 400, 250);

  for (let i = 0; i < 68; i++) {
    const x = (i * 83 + 29) % 400;
    const y = (i * 37 + 11) % 210;
    ctx.fillStyle = i % 7 === 0 ? '#a4fbff' : '#b7d6ed70';
    ctx.fillRect(x, y, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
  }
  ctx.fillStyle = '#89ebed';
  ctx.beginPath();
  ctx.arc(315, 52, 24, 0, 2 * Math.PI);
  ctx.fill();

  polygon(ctx, [0, 141, 44, 89, 72, 121, 106, 76, 155, 139, 184, 114, 234, 142, 286, 105, 327, 136, 363, 86, 400, 132, 400, 440, 0, 440], '#203e60');
  polygon(ctx, [0, 118, 55, 72, 92, 123, 115, 60, 141, 68, 176, 139, 0, 177], '#3f5572');
  polygon(ctx, [115, 60, 103, 119, 137, 142, 165, 123, 141, 68], '#516580');
  polygon(ctx, [400, 121, 361, 61, 333, 76, 307, 138, 276, 121, 263, 151, 400, 178], '#293b57');
  polygon(ctx, [361, 61, 379, 141, 338, 143, 333, 76], '#405674');
  polygon(ctx, [0, 156, 37, 121, 99, 170, 151, 128, 208, 171, 258, 141, 313, 169, 354, 129, 400, 162, 400, 440, 0, 440], '#19324d');
}

function drawRoad(ctx: CanvasRenderingContext2D, frame: RescueFrame, reduced: boolean) {
  polygon(ctx, [174, HORIZON, 226, HORIZON, 400, ROAD_DEPTH + HORIZON, 400, 440, 0, 440, 0, ROAD_DEPTH + HORIZON], '#111d37');
  polygon(ctx, [178, HORIZON, 200, HORIZON, 200, 440, 4, 440], '#43546a');
  polygon(ctx, [200, HORIZON, 222, HORIZON, 396, 440, 200, 440], '#394a60');
  polygon(ctx, [174, HORIZON, 179, HORIZON, 13, 440, 0, 440], '#8496a9');
  polygon(ctx, [221, HORIZON, 226, HORIZON, 400, 440, 387, 440], '#8496a9');

  if (frame.selected !== 0) {
    const edge = frame.selected * 190;
    const colour = frame.result === 'wrong' ? '#fbb15633' : '#56e5dc24';
    polygon(ctx, [200, HORIZON, roadX(edge, 0), HORIZON, roadX(edge, 1.06), 440, 200, 440], colour);
  }

  const phase = reduced ? 0 : frame.distance % 1;
  const offset = reduced ? 0 : Math.floor(frame.distance);
  for (let i = 0; i < 14; i++) {
    const z = ((i + phase) / 14) ** 2;
    const y = roadY(z);
    const width = Math.min(198, 18 + z * 180);
    const tileId = i - offset;
    const trim = 1 + z * 3;
    ctx.fillStyle = '#102137b0';
    ctx.fillRect(200 - width, y, width * 2, trim);
    ctx.fillStyle = '#a3c8db55';
    ctx.fillRect(200 - width, y + trim, width * 2, .65 + z * 1.4);
    ctx.fillStyle = '#f0cd787f';
    ctx.fillRect(199, y + 3, 2 + z, 2 + z * 14);

    for (const side of [-1, 1]) {
      const x = roadX(side * (45 + ((tileId % 4 + 4) % 4) * 24), z);
      ctx.fillStyle = '#202b4078';
      ctx.fillRect(x - 10 * z, y - 6 * z, 18 * z, 2 * z);
    }

    if (tileId % 2 === 0) {
      for (const side of [-1, 1]) {
        const x = roadX(side * 194, z);
        const height = 7 + z * 34;
        const w = 3 + z * 9;
        polygon(ctx, [x - w, y, x + 2 * w, y + 4 * z, x + w, y + 8 * z, x - w, y + 6 * z], '#101b2caa');
        polygon(ctx, [x - w, y, x - w, y - height, x, y - height - 4 * z, x, y - 2 * z], '#52687f');
        polygon(ctx, [x, y - 2 * z, x, y - height - 4 * z, x + w, y - height, x + w, y], '#263b53');
        rect(ctx, x - w, y - height, 2 * w, 2 + 5 * z, 2, side < 0 ? '#a1fff0' : '#ffcb81');
      }
    }
  }

  if (!reduced && frame.rush) {
    ctx.strokeStyle = '#c9faff80';
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const z = (frame.elapsed * 1.5 + i * .17) % 1;
      const x = 30 + ((i * 81) % 344);
      const y = 125 + z * 303;
      ctx.moveTo(x, y);
      ctx.lineTo(x + (x - 200) * .08, y + 20 + z * 14);
    }
    ctx.stroke();
  }
}

function badge(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, answer: number, active: boolean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  rect(ctx, -47, 4, 94, 43, 12, '#102041b5');
  rect(ctx, -47, 0, 94, 43, 12, active ? '#93fff1' : '#86a9d7');
  rect(ctx, -44, 3, 88, 37, 9, active ? '#125c65' : '#223864');
  ctx.font = '900 28px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.fillText(String(answer), 0, 23);
  ctx.restore();
}

function makeRobot(enemy: boolean, leader: boolean) {
  const sprite = document.createElement('canvas');
  sprite.width = 136;
  sprite.height = 164;
  const ctx = sprite.getContext('2d')!;
  ctx.scale(2, 2);
  ctx.translate(34, 68);

  const light = enemy ? (leader ? '#ffe6a6' : '#ffc0ad') : (leader ? '#fff2ab' : '#bdfff2');
  const base = enemy ? (leader ? '#eab860' : '#e47a69') : (leader ? '#e9b663' : '#49bec8');
  const edge = enemy ? '#643845' : '#28526b';
  const metal = ctx.createLinearGradient(-22, -52, 19, -19);
  metal.addColorStop(0, '#253147');
  metal.addColorStop(.34, base);
  metal.addColorStop(.63, light);
  metal.addColorStop(1, edge);

  polygon(ctx, [-25, -16, -20, -31, -11, -30, -13, -10, -23, -7], edge);
  polygon(ctx, [13, -31, 24, -27, 27, -12, 18, -7, 12, -13], edge);
  rect(ctx, -17, -13, 13, 13, 4, '#192339');
  rect(ctx, 5, -13, 13, 13, 4, '#192339');
  polygon(ctx, [-18, -6, -7, -6, -2, 0, -21, 0], base);
  polygon(ctx, [5, -6, 16, -6, 21, 0, 2, 0], base);
  polygon(ctx, [-19, -35, 14, -39, 22, -28, 17, -12, -16, -10, -23, -20], '#19243b');
  rect(ctx, -16, -34, 33, 21, 6, edge);
  polygon(ctx, [-14, -33, 13, -32, 12, -18, 0, -13, -12, -19], base);

  rect(ctx, -24, -58, 48, 35, 10, '#142037');
  ctx.fillStyle = metal;
  ctx.beginPath();
  ctx.roundRect(-23, -60, 45, 32, 11);
  ctx.fill();
  polygon(ctx, [-21, -47, -16, -54, 13, -55, 20, -49, 17, -36, -19, -33], '#142842');
  polygon(ctx, [-19, -47, -13, -51, 15, -53, 18, -49, 15, -40, -18, -37], '#203c58');
  const lamp = enemy ? '#ff9f71' : '#7ffff4';
  ctx.shadowColor = lamp;
  ctx.shadowBlur = 8;
  rect(ctx, -5, -26, 10, 8, 3, lamp);
  for (const px of [-12, 5]) {
    rect(ctx, px, -47, 8, 6, 2, lamp);
    rect(ctx, px + 2, -46, 4, 3, 1, '#fffacc');
  }
  ctx.shadowBlur = 0;
  if (leader) {
    polygon(ctx, [-15, -59, -9, -67, 13, -66, 17, -60], light);
  }
  return sprite;
}

function paintRobot(ctx: CanvasRenderingContext2D, sprite: HTMLCanvasElement, x: number, y: number, scale: number, bob: number) {
  ctx.fillStyle = '#050b2392';
  ctx.beginPath();
  ctx.ellipse(x + scale * 4, y, 18 * scale, 6 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  const width = Math.max(.72, Math.min(1, ctx.canvas.height * SCENE_WIDTH / (ctx.canvas.width * SCENE_HEIGHT)));
  ctx.drawImage(sprite, x - 34 * scale * width, y + bob - 68 * scale, 68 * scale * width, 82 * scale);
}

function drawDrones(ctx: CanvasRenderingContext2D, frame: RescueFrame, reduced: boolean, sprites: HTMLCanvasElement[]) {
  const { drones, hits } = frame.defense;
  for (let i = drones.length - 1; i >= 0; i--) {
    const drone = drones[i];
    if (drone.depth < 0) continue;
    const x = roadX(drone.x + (reduced ? 0 : Math.sin(frame.elapsed * 3 + drone.id) * 5), drone.depth);
    const y = roadY(drone.depth);
    const scale = .22 + drone.depth * .63;
    const bob = reduced ? 0 : -Math.abs(Math.sin(frame.elapsed * 13 + drone.id * .7)) * scale * 6;
    paintRobot(ctx, sprites[drone.variant], x, y, scale, bob);
  }
  for (const hit of hits) {
    const x = roadX(hit.x, hit.depth);
    const y = roadY(hit.depth) - 12;
    if (y < HORIZON) continue;
    const p = hit.age / 430;
    ctx.globalAlpha = 1 - p;
    ctx.strokeStyle = '#91fff1';
    ctx.lineWidth = 2 + hit.depth;
    ctx.beginPath();
    ctx.ellipse(x, y, 6 + p * 22, 4 + p * 13, 0, 0, 2 * Math.PI);
    ctx.stroke();
    if (!reduced) {
      for (let j = 0; j < 5; j++) {
        const angle = (j * 1.26 + hit.x) % (Math.PI * 2);
        rect(ctx, x + Math.cos(angle) * (6 + p * 32), y + Math.sin(angle) * (5 + p * 28), 3, 3, 1, '#fff7b1');
      }
    }
    ctx.globalAlpha = 1;
  }
}

function drawPulse(ctx: CanvasRenderingContext2D, frame: RescueFrame, reduced: boolean) {
  const pulse = frame.defense.pulse;
  if (!pulse) return;
  const z = Math.max(0, pulse.front);
  const x = roadX(pulse.lane * 78, z);
  const y = roadY(z) - 20;
  const width = 26 + (1 - z) * 71;
  const opacity = 1 - pulse.age / 760;
  ctx.globalAlpha = Math.max(0, opacity);
  if (!reduced) {
    polygon(ctx, [200 + pulse.lane * 87 - 13, 344, x - width, y, x + width, y, 200 + pulse.lane * 87 + 13, 344], '#41fbfc23');
  }
  for (const band of [9, 4]) {
    ctx.lineWidth = band;
    ctx.strokeStyle = band === 9 ? '#28cbd8' : '#d7fff3';
    ctx.beginPath();
    ctx.moveTo(x - width, y + 6);
    ctx.quadraticCurveTo(x, y - 22, x + width, y + 6);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawTeam(ctx: CanvasRenderingContext2D, frame: RescueFrame, reduced: boolean, sprites: HTMLCanvasElement[]) {
  for (let i = frame.team - 1; i >= 0; i--) {
    const row = Math.floor((i + 2) / 3);
    const slot = i === 0 ? 0 : (i - 1) % 3 - 1;
    const y = 379 - row * 19;
    const center = 200 + frame.lane * 87;
    let x = center + slot * 26;
    if (!reduced && frame.result === 'correct' && i === frame.team - 1 && frame.rewardElapsed > 570) {
      x += (1 - clamp((frame.rewardElapsed - 570) / 240)) * (frame.lane < 0 ? -45 : 45);
    }
    const bob = reduced ? 0 : -Math.abs(Math.sin(frame.elapsed * (frame.rush ? 18 : 11) + i * .8)) * 5;
    paintRobot(ctx, sprites[i === 0 ? 1 : 0], x, y, .88 - row * .055, bob);
  }
}

function drawReward(ctx: CanvasRenderingContext2D, frame: RescueFrame, reduced: boolean) {
  const center = 200 + frame.lane * 87;
  for (let i = 0; i < REWARD_TILES; i++) {
    const age = frame.rewardElapsed - (130 + i * 145);
    const y = 380 + (reduced ? 0 : age * .36);
    if (y < 130 || y > 425) continue;
    const hasPassed = age >= 0;
    const scale = .68 + clamp((y - 140) / 255) * .32;
    ctx.save();
    ctx.translate(center, y);
    ctx.scale(scale, scale);
    rect(ctx, -48, -14, 96, 29, 8, hasPassed ? '#ffe493' : '#329195');
    rect(ctx, -43, -11, 86, 22, 6, hasPassed ? '#fff2bd' : '#437c91');
    ctx.fillStyle = hasPassed ? '#194d61' : '#e8feff';
    ctx.font = '900 20px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+1', 0, 0);
    ctx.restore();

    if (reduced || age < 0 || age > 380) continue;
    ctx.globalAlpha = 1 - age / 380;
    for (let j = 0; j < 7; j++) {
      const angle = j * 2.4;
      const d = 8 + age * .12;
      rect(ctx, center + Math.cos(angle) * d, 362 + Math.sin(angle) * d - age * .08, 5, 5, 2, j % 2 ? '#87ffef' : '#fff1a2');
    }
    ctx.globalAlpha = 1;
  }
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

export function createRescuePainter(ctx: CanvasRenderingContext2D) {
  const sky = document.createElement('canvas');
  sky.width = SCENE_WIDTH * 2;
  sky.height = SCENE_HEIGHT * 2;
  const skyContext = sky.getContext('2d')!;
  skyContext.scale(2, 2);
  paintSky(skyContext);
  const friendly = [makeRobot(false, false), makeRobot(false, true)];
  const enemy = [makeRobot(true, false), makeRobot(true, true)];

  return (frame: RescueFrame, reduced: boolean) => {
    ctx.drawImage(sky, 0, 0, SCENE_WIDTH, SCENE_HEIGHT);
    drawRoad(ctx, frame, reduced);
    if (frame.charge !== null) {
      drawTower(ctx, frame, reduced);
      return;
    }
    // A lit portal gives the approaching formation a stable point of origin.
    rect(ctx, 161, 63, 78, 31, 5, '#142039');
    rect(ctx, 166, 62, 68, 6, 3, '#797f9b');
    rect(ctx, 175, 68, 50, 24, 6, '#371f36');
    rect(ctx, 181, 74, 38, 17, 5, '#a95163');
    rect(ctx, 185, 77, 30, 13, 4, '#ffc394');
    rect(ctx, 10, 397, 380, 3, 1, '#ffe094ba');
    drawDrones(ctx, frame, reduced, enemy);
    drawPulse(ctx, frame, reduced);
    if (frame.defense.lastHit < 330) {
      ctx.globalAlpha = .8 * (1 - frame.defense.lastHit / 330);
      rect(ctx, 8, 396, 384, 7, 2, '#ff8d78');
      ctx.globalAlpha = 1;
    }
    if (frame.result === 'correct') {
      drawReward(ctx, frame, reduced);
    } else if (!frame.result) {
      const z = .21 + .51 * frame.approach ** 1.5;
      badge(ctx, roadX(-117, z), roadY(z) - 40, depthScale(z) + .23, frame.options[0], frame.selected === -1);
      badge(ctx, roadX(117, z), roadY(z) - 40, depthScale(z) + .23, frame.options[1], frame.selected === 1);
    }
    drawTeam(ctx, frame, reduced, friendly);
  };
}
