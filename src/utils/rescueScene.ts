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
  polygon(ctx, [0, 156, 37, 121, 99, 170, 151, 128, 208, 171, 258, 141, 313, 169, 354, 129, 400, 162, 400, 440, 0, 440], '#19324d');
}

function drawRoad(ctx: CanvasRenderingContext2D, frame: RescueFrame, reduced: boolean) {
  polygon(ctx, [174, HORIZON, 226, HORIZON, 400, ROAD_DEPTH + HORIZON, 400, 440, 0, 440, 0, ROAD_DEPTH + HORIZON], '#111d37');
  polygon(ctx, [178, HORIZON, 200, HORIZON, 200, 440, 4, 440], '#252e50');
  polygon(ctx, [200, HORIZON, 222, HORIZON, 396, 440, 200, 440], '#242a4b');

  if (frame.selected !== 0) {
    const edge = frame.selected * 190;
    const colour = frame.result === 'wrong' ? '#fbb15633' : '#56e5dc24';
    polygon(ctx, [200, HORIZON, roadX(edge, 0), HORIZON, roadX(edge, 1.06), 440, 200, 440], colour);
  }

  const phase = reduced ? 0 : frame.distance % 1;
  for (let i = 0; i < 14; i++) {
    const z = ((i + phase) / 14) ** 2;
    const y = roadY(z);
    const width = Math.min(198, 18 + z * 180);
    ctx.fillStyle = i % 3 === 0 ? '#607ea085' : '#54719944';
    ctx.fillRect(200 - width, y, width * 2, .5 + z * 2);
    ctx.fillStyle = '#d4ebfd79';
    ctx.fillRect(199, y, 2, 2 + z * 14);

    if (i % 2 === 0) {
      for (const side of [-1, 1]) {
        const x = roadX(side * 194, z);
        const height = 7 + z * 34;
        rect(ctx, x - 2 - z * 2, y - height, 4 + z * 4, height, 2, '#426180');
        ctx.fillStyle = side < 0 ? '#5ee9db' : '#bfb2ff';
        ctx.fillRect(x - 2 - z * 2, y - height, 4 + z * 4, 2 + z * 4);
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

function robot(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, bob: number, leader: boolean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#080f2ac0';
  ctx.beginPath();
  ctx.ellipse(0, 2, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.translate(0, bob);

  const body = leader ? '#fbc76a' : '#75eee0';
  rect(ctx, -10, -10, 8, 11, 4, '#2d6389');
  rect(ctx, 2, -10, 8, 11, 4, '#2d6389');
  rect(ctx, -15, -24, 30, 17, 7, '#347b9b');
  rect(ctx, -11, -24, 22, 15, 6, body);
  rect(ctx, -15, -43, 30, 22, 8, '#428bae');
  rect(ctx, -13, -44, 26, 21, 7, body);
  rect(ctx, -10, -40, 20, 12, 4, '#152947');
  rect(ctx, -6, -37, 4, 5, 2, '#d6feff');
  rect(ctx, 2, -37, 4, 5, 2, '#d6feff');
  rect(ctx, -1, -50, 2, 7, 1, '#acfbff');
  rect(ctx, -3, -53, 6, 6, 3, '#fff2a3');
  rect(ctx, -3, -21, 6, 6, 2, '#e7fffd');
  ctx.restore();
}

function drawTeam(ctx: CanvasRenderingContext2D, frame: RescueFrame, reduced: boolean) {
  for (let i = frame.team - 1; i >= 0; i--) {
    const row = Math.floor((i + 2) / 3);
    const slot = i === 0 ? 0 : (i - 1) % 3 - 1;
    const y = 337 - row * 17;
    const center = 200 + frame.lane * 87;
    let x = center + slot * 26;
    if (!reduced && frame.result === 'correct' && i === frame.team - 1 && frame.rewardElapsed > 570) {
      x += (1 - clamp((frame.rewardElapsed - 570) / 240)) * (frame.lane < 0 ? -45 : 45);
    }
    const bob = reduced ? 0 : -Math.abs(Math.sin(frame.elapsed * (frame.rush ? 18 : 11) + i * .8)) * 5;
    robot(ctx, x, y, 1 - row * .075, bob, i === 0);
  }
}

function drawReward(ctx: CanvasRenderingContext2D, frame: RescueFrame, reduced: boolean) {
  const center = 200 + frame.lane * 87;
  for (let i = 0; i < REWARD_TILES; i++) {
    const age = frame.rewardElapsed - (130 + i * 145);
    const y = 341 + (reduced ? 0 : age * .36);
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
      rect(ctx, center + Math.cos(angle) * d, 327 + Math.sin(angle) * d - age * .08, 5, 5, 2, j % 2 ? '#87ffef' : '#fff1a2');
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
  sky.width = SCENE_WIDTH;
  sky.height = SCENE_HEIGHT;
  paintSky(sky.getContext('2d')!);

  return (frame: RescueFrame, reduced: boolean) => {
    ctx.drawImage(sky, 0, 0);
    drawRoad(ctx, frame, reduced);
    if (frame.charge !== null) {
      drawTower(ctx, frame, reduced);
      return;
    }
    if (frame.result === 'correct') {
      drawReward(ctx, frame, reduced);
    } else if (!frame.result) {
      const z = .21 + .51 * frame.approach ** 1.5;
      badge(ctx, roadX(-117, z), roadY(z) - 40, depthScale(z) + .23, frame.options[0], frame.selected === -1);
      badge(ctx, roadX(117, z), roadY(z) - 40, depthScale(z) + .23, frame.options[1], frame.selected === 1);
    }
    drawTeam(ctx, frame, reduced);
  };
}
