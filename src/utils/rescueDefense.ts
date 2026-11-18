export const MAX_SHIELD = 100;
export const FIRST_WAVE = 22;
export const MAX_DRONES = 76;
const IMPACT_LINE = 0.94;
const PULSE_START = 0.86;
const PULSE_TRAVEL = 620;

export interface Drone {
  id: number;
  x: number;
  depth: number;
  speed: number;
  variant: number;
}

export interface PulseHit {
  x: number;
  depth: number;
  age: number;
}

export interface Defense {
  drones: Drone[];
  hits: PulseHit[];
  shield: number;
  disabled: number;
  streak: number;
  misses: number;
  lastHit: number;
  pulse: { age: number; front: number; remaining: number; lane: number } | null;
  nextId: number;
}

export function createDefense(): Defense {
  const defense: Defense = {
    drones: [], hits: [], shield: MAX_SHIELD, disabled: 0, streak: 0,
    misses: 0, lastHit: 1000, pulse: null, nextId: 0
  };
  addWave(defense, FIRST_WAVE, true);
  return defense;
}

export function addWave(defense: Defense, count: number, opening = false) {
  const added = Math.min(count, MAX_DRONES - defense.drones.length);
  const columns = 7;
  for (let i = 0; i < added; i++) {
    const id = defense.nextId++;
    const row = Math.floor(i / columns);
    const col = i % columns;
    defense.drones.push({
      id,
      x: (col - 3) * 46 + Math.sin(id * 2.62) * 8,
      depth: (opening ? .40 : .16) - row * .095 + Math.sin(id * 4.77) * .018,
      speed: .032 + (id % 5) * .003,
      variant: id % 4 === 0 ? 1 : 0
    });
  }
  return added;
}

export function launchPulse(defense: Defense, lane: number) {
  defense.streak++;
  defense.pulse = {
    age: 0,
    front: PULSE_START,
    remaining: 11 + Math.min(17, defense.streak * 3),
    lane
  };
}

export function addReinforcements(defense: Defense) {
  defense.streak = 0;
  defense.misses++;
  return addWave(defense, 9 + Math.min(9, (defense.misses - 1) * 2));
}

export function updateDefense(defense: Defense, dt: number) {
  defense.lastHit += dt;
  for (let i = defense.hits.length - 1; i >= 0; i--) {
    const hit = defense.hits[i];
    hit.age += dt;
    if (hit.age > 430) defense.hits.splice(i, 1);
  }

  const pulse = defense.pulse;
  if (pulse) {
    pulse.age += dt;
    pulse.front = PULSE_START - Math.min(1, pulse.age / PULSE_TRAVEL) * 1.12;
    if (pulse.age > PULSE_TRAVEL + 90) defense.pulse = null;
  }

  // Visit the nearest targets first so a pulse shields the player from the front row.
  defense.drones.sort((a, b) => b.depth - a.depth);
  for (let i = 0; i < defense.drones.length;) {
    const drone = defense.drones[i];
    drone.depth += (drone.speed + Math.min(.055, defense.misses * .009)) * dt / 1000;
    if (pulse && pulse.remaining > 0 && pulse.age <= PULSE_TRAVEL + 90 && drone.depth >= pulse.front) {
      pulse.remaining--;
      defense.disabled++;
      defense.hits.push({ x: drone.x, depth: drone.depth, age: 0 });
      defense.drones.splice(i, 1);
    } else if (drone.depth >= IMPACT_LINE) {
      defense.shield = Math.max(0, defense.shield - 8);
      defense.lastHit = 0;
      defense.drones.splice(i, 1);
    } else {
      i++;
    }
  }
}
