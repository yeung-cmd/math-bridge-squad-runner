export const MAX_SHIELD = 100;
export const FIRST_WAVE = 22;
export const MAX_DRONES = 76;
const BREACH = .95;

export interface Drone {
  id: number;
  x: number;
  depth: number;
  speed: number;
  variant: number;
  targeted: boolean;
}

export interface Bolt {
  target: Drone | null;
  age: number;
  duration: number;
  lane: number;
  slot: number;
}

export interface Defense {
  drones: Drone[];
  bolts: Bolt[];
  hits: { x: number; depth: number; age: number }[];
  shield: number;
  disabled: number;
  streak: number;
  misses: number;
  lastHit: number;
  nextId: number;
  untilSpawn: number;
  reinforcements: number;
  pace: number;
}

function spawn(d: Defense, depth: number) {
  const id = d.nextId++;
  // A low-discrepancy column order spreads consecutive arrivals across the bridge.
  const x = ((id * .61803398875 + .5) % 1 - .5) * 302;
  d.drones.push({ id, x, depth, speed: .029 + id % 7 * .0015, variant: id % 4 === 0 ? 1 : 0, targeted: false });
}

export function createDefense(seconds = 8): Defense {
  const d: Defense = { drones: [], bolts: [], hits: [], shield: MAX_SHIELD, disabled: 0, streak: 0,
    misses: 0, lastHit: 1000, nextId: 0, untilSpawn: 350, reinforcements: 0,
    pace: Math.min(1.35, 8 / seconds) };
  for (let i = 0; i < FIRST_WAVE; i++) spawn(d, .49 - i * .021);
  return d;
}

export function addReinforcements(d: Defense) {
  d.streak = 0;
  d.misses++;
  const added = Math.min(9 + Math.min(9, (d.misses - 1) * 2), MAX_DRONES - d.drones.length - d.reinforcements);
  d.reinforcements += Math.max(0, added);
  d.untilSpawn = Math.min(d.untilSpawn, 80);
  return Math.max(0, added);
}

export function launchVolley(d: Defense, lane: number, team: number) {
  d.streak++;
  // Target the front of the column. Keep the distant procession visible behind it.
  const front = d.drones.filter(m => m.depth > .065 && !m.targeted).sort((a, b) => b.depth - a.depth);
  const count = Math.min(8 + d.streak * 2, 22, Math.ceil(front.length * .60));
  if (count === 0) d.bolts.push({ target: null, age: 0, duration: 480, lane, slot: 0 });
  for (let i = 0; i < count; i++) {
    const target = front[i];
    target.targeted = true;
    d.bolts.push({ target, age: -Math.floor(i / 3) * 65, duration: 180 + 300 * (1 - target.depth), lane, slot: i % team });
  }
}

export function updateDefense(d: Defense, dt: number) {
  d.lastHit += dt;
  for (let i = d.hits.length - 1; i >= 0; i--) {
    if ((d.hits[i].age += dt) >= 350) d.hits.splice(i, 1);
  }
  d.untilSpawn -= dt * d.pace;
  while (d.untilSpawn <= 0) {
    const extra = d.reinforcements > 0;
    if (d.drones.length < MAX_DRONES) {
      spawn(d, 0);
      if (extra) d.reinforcements--;
    }
    d.untilSpawn += extra ? 115 : Math.max(370, 710 - d.misses * 45);
  }

  const speedBoost = Math.min(.022, d.misses * .004);
  for (const monster of d.drones) monster.depth += (monster.speed + speedBoost) * dt * .001 * d.pace;
  for (let i = d.bolts.length - 1; i >= 0; i--) {
    const bolt = d.bolts[i];
    if ((bolt.age += dt) < bolt.duration) continue;
    const target = bolt.target;
    if (target) {
      d.hits.push({ x: target.x, depth: target.depth, age: 0 });
      d.drones.splice(d.drones.indexOf(target), 1);
      d.disabled++;
    }
    d.bolts.splice(i, 1);
  }
  for (let i = d.drones.length - 1; i >= 0; i--) {
    if (d.drones[i].depth >= BREACH && !d.drones[i].targeted) {
      d.drones.splice(i, 1);
      d.shield = Math.max(0, d.shield - 8);
      d.lastHit = 0;
    }
  }
  d.drones.sort((a, b) => b.depth - a.depth);
}
