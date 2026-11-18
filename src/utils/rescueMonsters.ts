import hornUrl from '../assets/horn-beast.webp?inline';
import wingUrl from '../assets/wing-beast.webp?inline';

const POSES = 16;
const WIDTH = 256;
const HEIGHT = 248;

function makePoses(url: string, winged: boolean) {
  const poses: HTMLCanvasElement[] = [];
  const image = new Image();
  image.onload = () => {
    for (let i = 0; i < POSES; i++) {
      const pose = document.createElement('canvas');
      pose.width = WIDTH;
      pose.height = HEIGHT;
      const ctx = pose.getContext('2d')!;
      const step = Math.sin(i * Math.PI * 2 / POSES);
      if (winged) {
        // Keep the eye steady. Each outer wing pivots around its root.
        const root = 66;
        const tip = 12;
        const body = WIDTH - root * 2;
        ctx.drawImage(image, image.width * root / WIDTH, 0, image.width * body / WIDTH, image.height, root, 65, body, 120);
        for (const left of [true, false]) {
          const anchor = left ? root : WIDTH - root;
          const source = left ? 0 : image.width * (1 - root / WIDTH);
          ctx.save();
          ctx.translate(anchor, 65);
          ctx.transform(.84 + .14 * step, (left ? -1 : 1) * (.16 + .48 * step), 0, 1, 0, 0);
          ctx.drawImage(image, source, 0, image.width * root / WIDTH, image.height, left ? -root + tip : 0, 0, root - tip, 120);
          ctx.restore();
        }
      } else {
        // The lower part shifts with alternating footfalls. The face stays legible.
        const slices = 16;
        const width = 205;
        const height = 196;
        for (let row = 0; row < slices; row++) {
          const leg = Math.max(0, (row / (slices - 1) - .52) / .48);
          const sway = step * (2 + 7 * leg);
          ctx.drawImage(image, 0, row * image.height / slices, image.width, image.height / slices,
            (WIDTH - width) / 2 + sway, HEIGHT - height + row * height / slices, width, height / slices + .5);
        }
      }
      poses.push(pose);
    }
  };
  image.src = url;
  return poses;
}

// The whole horde shares the same pre-rendered walk and flight cycles.
const beasts = [makePoses(hornUrl, false), makePoses(wingUrl, true)];

export function paintMonster(ctx: CanvasRenderingContext2D, variant: number, x: number, y: number, scale: number, phase: number, aspect: number, reduced: boolean) {
  const winged = variant === 1;
  const pose = beasts[variant][reduced ? 0 : Math.floor(phase * POSES) % POSES];
  if (!pose) return;
  const beat = reduced ? 0 : Math.sin(phase * Math.PI * 2);
  const w = (winged ? 100 : 90) * scale * aspect;
  const h = (winged ? 100 : 87) * scale;
  const lift = (winged ? 14 + beat * 6 : Math.abs(beat) * 5) * scale;
  ctx.fillStyle = winged ? '#160c2b60' : '#200e2295';
  ctx.beginPath();
  ctx.ellipse(x, y, w * (winged ? .19 : .30), scale * 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.drawImage(pose, x - w / 2, y - h * (winged ? .75 : 1) - lift, w, h);
}
