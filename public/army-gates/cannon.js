// One shuffled deck per operation, reused until that operation's questions run out.
function cannonQuestions(level, limit) {
  const decks = new Map();
  let operations = [];
  function shuffle(items) {
    for (let i=items.length-1; i>0; i--) {
      const j=Math.floor(Math.random()*(i+1));
      [items[i],items[j]]=[items[j],items[i]];
    }
    return items;
  }
  return () => {
    if (!operations.length) operations=shuffle(level==='2' ? ['＋','−','×'] : ['＋','−']);
    const op=operations.pop();
    if (!decks.get(op)?.length) {
      const items=[];
      for(let a=1;a<=limit;a++) for(let b=1;b<=limit;b++) {
        if(op==='×' && (a<2 || b<2 || a>9 || b>9)) continue;
        const answer=op==='＋'?a+b:op==='−'?a-b:a*b;
        if(answer>=0 && answer<=limit) items.push({a,b,op,answer});
      }
      decks.set(op,shuffle(items));
    }
    const q=decks.get(op).pop();
    const distractors=[q.answer+1,q.answer-1, q.op==='×'?q.a+q.b:Math.abs(q.a-q.b)];
    const wrong=shuffle(distractors.filter(n=>n!==q.answer && n>=0 && n<=limit))[0];
    return {...q, expression:q.a+' '+op+' '+q.b, options:shuffle([q.answer,wrong])};
  };
}

function createQuizCannon(scene, camera) {
  const clamp = THREE.MathUtils.clamp;
  const smooth = THREE.MathUtils.smoothstep;

  // Timings (seconds)
  const FIRE_START = 0.28;
  const FIRE_END = 2.28;
  const FINISH = 2.88;
  const SHOT_BEAT_INTERVAL = 1 / 15; // ~15 Hz audio beat

  // Shared materials (created once, zero dynamic lights)
  const enamel = new THREE.MeshPhongMaterial({ color: 0x185074, shininess: 85 });
  const iron = new THREE.MeshPhongMaterial({ color: 0x263849, shininess: 70 });
  const darkMetal = new THREE.MeshPhongMaterial({ color: 0x141f2b, shininess: 50 });
  const brass = new THREE.MeshPhongMaterial({ color: 0xe4ad55, shininess: 95 });
  const glowCyan = new THREE.MeshBasicMaterial({ color: 0x6efaff });
  const baseRingMat = new THREE.MeshBasicMaterial({
    color: 0x5cf7ff,
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  function part(parent, geometry, material, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  // ---------------- Six-barrel Rotary Gatling Cannon ----------------
  const battery = new THREE.Group();
  battery.name = 'quiz-gatling-battery';
  scene.add(battery);

  // Octagonal armored pedestal & glowing energy ring
  part(battery, new THREE.CylinderGeometry(1.58, 1.78, 0.30, 8), iron, 0, 0.15, 0);
  part(battery, new THREE.CylinderGeometry(1.46, 1.54, 0.13, 8), brass, 0, 0.36, 0);
  const baseEnergyRing = part(
    battery,
    new THREE.TorusGeometry(1.36, 0.055, 8, 32).rotateX(Math.PI / 2),
    baseRingMat,
    0, 0.45, 0
  );
  part(battery, new THREE.CylinderGeometry(1.18, 1.38, 0.42, 24), enamel, 0, 0.62, 0);
  part(battery, new THREE.CylinderGeometry(1.14, 1.14, 0.12, 24), iron, 0, 0.88, 0);

  const boltGeo = new THREE.CylinderGeometry(0.085, 0.105, 0.09, 6);
  for (let i = 0; i < 8; i++) {
    const angle = (i + 0.5) * Math.PI / 4;
    part(battery, boltGeo, brass, 1.49 * Math.sin(angle), 0.34, 1.49 * Math.cos(angle));
  }

  const turret = new THREE.Group();
  battery.add(turret);

  const supportGeo = new THREE.BoxGeometry(0.34, 1.14, 1.34);
  const trunnionOuterGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.12, 18).rotateZ(Math.PI / 2);
  const trunnionInnerGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.16, 8).rotateZ(Math.PI / 2);
  for (const side of [-1, 1]) {
    const support = part(turret, supportGeo, enamel, side * 0.83, 1.38, 0.12);
    support.rotation.x = -0.14;
    part(turret, trunnionOuterGeo, brass, side * 1.03, 1.85, 0);
    part(turret, trunnionInnerGeo, iron, side * 1.08, 1.85, 0);
  }

  const cradle = new THREE.Group();
  cradle.position.y = 1.85;
  turret.add(cradle);

  const carriage = new THREE.Group();
  cradle.add(carriage);

  // Breech drum, rear cap & twin side ammo/energy pods
  part(carriage, new THREE.CylinderGeometry(0.56, 0.62, 0.94, 20).rotateX(Math.PI / 2), enamel, 0, 0, 0.26);
  part(carriage, new THREE.CylinderGeometry(0.42, 0.54, 0.22, 16).rotateX(Math.PI / 2), brass, 0, 0, 0.82);
  part(carriage, new THREE.CylinderGeometry(0.26, 0.26, 0.14, 12).rotateX(Math.PI / 2), glowCyan, 0, 0, 0.92);

  const podGeo = new THREE.BoxGeometry(0.26, 0.44, 0.88);
  const podCapGeo = new THREE.BoxGeometry(0.30, 0.12, 0.72);
  const podGlowGeo = new THREE.BoxGeometry(0.05, 0.14, 0.68);
  for (const side of [-1, 1]) {
    part(carriage, podGeo, iron, side * 0.64, -0.05, 0.10);
    part(carriage, podCapGeo, brass, side * 0.64, 0.16, 0.10);
    part(carriage, podGlowGeo, glowCyan, side * 0.78, -0.04, 0.10);
  }

  // Right-side casing ejection chute
  const chute = part(carriage, new THREE.BoxGeometry(0.26, 0.14, 0.22), brass, 0.54, -0.06, 0.24);
  chute.rotation.z = -0.35;

  // Rotating six-barrel assembly
  const rotor = new THREE.Group();
  carriage.add(rotor);

  const barrelGeo = new THREE.CylinderGeometry(0.058, 0.068, 2.15, 10).rotateX(Math.PI / 2);
  const boreTipGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.04, 8).rotateX(Math.PI / 2);
  const ribGeo = new THREE.BoxGeometry(0.05, 0.05, 1.55);
  const barrelRadius = 0.24;
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const bx = Math.sin(a) * barrelRadius;
    const by = Math.cos(a) * barrelRadius;
    part(rotor, barrelGeo, iron, bx, by, -1.225);
    part(rotor, boreTipGeo, darkMetal, bx, by, -2.305);
    if (i % 2 === 0) {
      part(rotor, ribGeo, glowCyan, bx * 1.18, by * 1.18, -1.10);
    }
  }
  part(rotor, new THREE.CylinderGeometry(0.38, 0.42, 0.22, 18).rotateX(Math.PI / 2), enamel, 0, 0, -0.32);
  part(rotor, new THREE.CylinderGeometry(0.35, 0.35, 0.11, 18).rotateX(Math.PI / 2), brass, 0, 0, -1.16);
  part(rotor, new THREE.CylinderGeometry(0.35, 0.35, 0.12, 18).rotateX(Math.PI / 2), iron, 0, 0, -2.02);

  // World-space anchor helpers (top firing barrel & right ejection chute)
  const muzzleTipAnchor = new THREE.Object3D();
  muzzleTipAnchor.position.set(0, barrelRadius, -2.34);
  carriage.add(muzzleTipAnchor);

  const ejectAnchor = new THREE.Object3D();
  ejectAnchor.position.set(0.66, -0.04, 0.24);
  carriage.add(ejectAnchor);

  // ---------------- Muzzle Flash (attached to carriage muzzle) ----------------
  const muzzleFlash = new THREE.Group();
  muzzleFlash.position.set(0, barrelRadius * 0.55, -2.34);
  carriage.add(muzzleFlash);

  const flashOuterMat = new THREE.MeshBasicMaterial({
    color: 0xffb838,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const flashInnerMat = new THREE.MeshBasicMaterial({
    color: 0xc8ffff,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const flashRingMat = new THREE.MeshBasicMaterial({
    color: 0x7afcff,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const starGeo = new THREE.PlaneGeometry(1.45, 0.42);
  for (let i = 0; i < 3; i++) {
    const fin = part(muzzleFlash, starGeo, flashOuterMat, 0, 0, -0.14);
    fin.rotation.z = (i * Math.PI) / 3;
  }
  const coreCone = part(
    muzzleFlash,
    new THREE.ConeGeometry(0.24, 1.15, 8).rotateX(-Math.PI / 2),
    flashInnerMat,
    0, 0, -0.52
  );
  coreCone.scale.set(1, 1, 1);
  part(muzzleFlash, new THREE.RingGeometry(0.32, 0.62, 24), flashRingMat, 0, 0, -0.06);

  // ---------------- Sweeping Ground Hotspot Glow ----------------
  const aimGlowMat = new THREE.MeshBasicMaterial({
    color: 0x5cf7ff,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const aimGlow = part(scene, new THREE.CircleGeometry(1.45, 24).rotateX(-Math.PI / 2), aimGlowMat, 0, 0.04, 0);

  // ---------------- Pre-allocated InstancedMesh Pools ----------------
  function initColors(mesh, capacity, baseColor) {
    for (let i = 0; i < capacity; i++) mesh.setColorAt(i, baseColor);
    mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    mesh.instanceColor.needsUpdate = true;
  }

  // 1. Tracers (84)
  const MAX_TRACERS = 84;
  const tracerPalette = [
    new THREE.Color(0x78f9ff),
    new THREE.Color(0xffd95a),
    new THREE.Color(0xffffff)
  ];
  const tracerMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const tracerMesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.055, 0.11, 2.2, 6).rotateX(Math.PI / 2),
    tracerMat,
    MAX_TRACERS
  );
  tracerMesh.frustumCulled = false;
  tracerMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  initColors(tracerMesh, MAX_TRACERS, tracerPalette[0]);
  scene.add(tracerMesh);
  const tracers = [];
  for (let i = 0; i < MAX_TRACERS; i++) {
    tracers.push({
      on: false,
      x: 0, y: 0, z: 0,
      vx: 0, vy: 0, vz: 0,
      tx: 0, ty: 0, tz: 0,
      qx: 0, qy: 0, qz: 0, qw: 1,
      life: 0, maxLife: 0.4,
      colorIdx: i % 3
    });
  }
  let tracerCursor = 0;

  // 2. Ejected Brass Casings (48)
  const MAX_CASINGS = 48;
  const casingMat = new THREE.MeshPhongMaterial({ color: 0xe8b648, shininess: 90 });
  const casingMesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.19, 6),
    casingMat,
    MAX_CASINGS
  );
  casingMesh.frustumCulled = false;
  casingMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(casingMesh);
  const casings = [];
  for (let i = 0; i < MAX_CASINGS; i++) {
    casings.push({ on: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, rx: 0, rz: 0, spinX: 0, spinZ: 0, life: 0 });
  }
  let casingCursor = 0;

  // 3. Ground Impact Rings (28)
  const MAX_RINGS = 28;
  const ringPalette = [new THREE.Color(0x6efaff), new THREE.Color(0xffd25a)];
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const ringMesh = new THREE.InstancedMesh(
    new THREE.RingGeometry(0.55, 1.0, 28).rotateX(-Math.PI / 2),
    ringMat,
    MAX_RINGS
  );
  ringMesh.frustumCulled = false;
  ringMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  initColors(ringMesh, MAX_RINGS, ringPalette[0]);
  scene.add(ringMesh);
  const rings = [];
  for (let i = 0; i < MAX_RINGS; i++) {
    rings.push({ on: false, x: 0, y: 0.12, z: 0, age: 0, dur: 0.34, maxScale: 1.8, colorIdx: 0 });
  }
  let ringCursor = 0;

  // 4. Impact Sparks (96)
  const MAX_SPARKS = 96;
  const sparkPalette = [
    new THREE.Color(0x78f9ff),
    new THREE.Color(0xffd95a),
    new THREE.Color(0xffffff)
  ];
  const sparkMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const sparkMesh = new THREE.InstancedMesh(
    new THREE.OctahedronGeometry(0.11, 0),
    sparkMat,
    MAX_SPARKS
  );
  sparkMesh.frustumCulled = false;
  sparkMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  initColors(sparkMesh, MAX_SPARKS, sparkPalette[0]);
  scene.add(sparkMesh);
  const sparks = [];
  for (let i = 0; i < MAX_SPARKS; i++) {
    sparks.push({ on: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, age: 0, dur: 0.35, colorIdx: 0 });
  }
  let sparkCursor = 0;

  // Scratch objects (zero allocation in tick)
  const home = camera.position.clone();
  const rotation = camera.quaternion.clone();
  const shotCamera = camera.clone();
  const eye = new THREE.Vector3();
  const focus = new THREE.Vector3();
  const tmpOrigin = new THREE.Vector3();
  const tmpEject = new THREE.Vector3();
  const tmpDir = new THREE.Vector3();
  const tmpAim = new THREE.Vector3();
  const tmpRight = new THREE.Vector3();
  const tmpForward = new THREE.Vector3();
  const tmpQuat = new THREE.Quaternion();
  const tmpColor = new THREE.Color();
  const zAxis = new THREE.Vector3(0, 0, 1);
  const yAxis = new THREE.Vector3(0, 1, 0);
  const dummy = new THREE.Object3D();
  const elimSet = new Set();

  let shot = null;

  function spawnRing(x, z, maxScale, dur, colorIdx) {
    const r = rings[ringCursor];
    ringCursor = (ringCursor + 1) % MAX_RINGS;
    r.on = true;
    r.x = x;
    r.y = 0.08 + (ringCursor % 4) * 0.015;
    r.z = z;
    r.age = 0;
    r.dur = dur;
    r.maxScale = maxScale;
    r.colorIdx = colorIdx;
  }

  function spawnSparkBurst(x, y, z, sweepVx, count) {
    for (let i = 0; i < count; i++) {
      const s = sparks[sparkCursor];
      sparkCursor = (sparkCursor + 1) % MAX_SPARKS;
      const angle = Math.random() * Math.PI * 2;
      const spd = 3.5 + Math.random() * 7.5;
      s.on = true;
      s.x = x + (Math.random() - 0.5) * 0.35;
      s.y = y + Math.random() * 0.35;
      s.z = z + (Math.random() - 0.5) * 0.35;
      s.vx = Math.cos(angle) * spd + sweepVx * 0.25;
      s.vy = 2.8 + Math.random() * 6.5;
      s.vz = Math.sin(angle) * spd * 0.65 - 1.5;
      s.age = 0;
      s.dur = 0.24 + Math.random() * 0.22;
      s.colorIdx = i % 3;
    }
  }

  function spawnTracer(ox, oy, oz, tx, ty, tz, colorIdx) {
    const tr = tracers[tracerCursor];
    tracerCursor = (tracerCursor + 1) % MAX_TRACERS;
    tmpDir.set(tx - ox, ty - oy, tz - oz);
    const dist = Math.max(0.5, tmpDir.length());
    tmpDir.multiplyScalar(1 / dist);
    const speed = 68 + Math.random() * 8;
    tmpQuat.setFromUnitVectors(zAxis, tmpDir);

    tr.on = true;
    tr.x = ox + tmpDir.x * 1.0;
    tr.y = oy + tmpDir.y * 1.0;
    tr.z = oz + tmpDir.z * 1.0;
    tr.vx = tmpDir.x * speed;
    tr.vy = tmpDir.y * speed;
    tr.vz = tmpDir.z * speed;
    tr.tx = tx;
    tr.ty = ty;
    tr.tz = tz;
    tr.qx = tmpQuat.x;
    tr.qy = tmpQuat.y;
    tr.qz = tmpQuat.z;
    tr.qw = tmpQuat.w;
    tr.life = 0;
    tr.maxLife = Math.max(0.06, (dist - 0.7) / speed);
    tr.colorIdx = colorIdx;
  }

  function spawnCasing() {
    ejectAnchor.getWorldPosition(tmpEject);
    tmpRight.set(1, 0, 0).applyQuaternion(turret.quaternion);
    tmpForward.set(0, 0, -1).applyQuaternion(turret.quaternion);

    const c = casings[casingCursor];
    casingCursor = (casingCursor + 1) % MAX_CASINGS;
    c.on = true;
    c.x = tmpEject.x;
    c.y = tmpEject.y;
    c.z = tmpEject.z;
    const sideSpd = 3.2 + Math.random() * 2.2;
    const backSpd = 0.6 + Math.random() * 1.2;
    c.vx = tmpRight.x * sideSpd - tmpForward.x * backSpd + (Math.random() - 0.5) * 0.7;
    c.vy = 3.6 + Math.random() * 2.1;
    c.vz = tmpRight.z * sideSpd - tmpForward.z * backSpd + (Math.random() - 0.5) * 0.7;
    c.rx = Math.random() * Math.PI;
    c.rz = Math.random() * Math.PI;
    c.spinX = (Math.random() > 0.5 ? 1 : -1) * (14 + Math.random() * 12);
    c.spinZ = (Math.random() > 0.5 ? 1 : -1) * (12 + Math.random() * 14);
    c.life = 0.78;
  }

  function clearPools() {
    for (let i = 0; i < MAX_TRACERS; i++) tracers[i].on = false;
    for (let i = 0; i < MAX_CASINGS; i++) casings[i].on = false;
    for (let i = 0; i < MAX_RINGS; i++) rings[i].on = false;
    for (let i = 0; i < MAX_SPARKS; i++) sparks[i].on = false;
    tracerMesh.count = 0;
    casingMesh.count = 0;
    ringMesh.count = 0;
    sparkMesh.count = 0;
    tracerMesh.visible = false;
    casingMesh.visible = false;
    ringMesh.visible = false;
    sparkMesh.visible = false;
  }

  function hide() {
    if (shot) {
      camera.position.copy(home);
      camera.quaternion.copy(rotation);
    }
    battery.visible = false;
    muzzleFlash.visible = false;
    aimGlow.visible = false;
    clearPools();
    shot = null;
  }
  hide();

  function aimTurretAt(bx, bz, ax, ay, az) {
    turret.rotation.y = Math.atan2(bx - ax, bz - az);
    const horizDist = Math.max(0.5, Math.hypot(ax - bx, az - bz));
    cradle.rotation.x = clamp(Math.atan2(ay - 1.85, horizDist), -0.55, 0.45);
  }

  function start(game, reducedMotion) {
    clearPools();
    const soldiers = game.enemies;
    const totalTargets = Math.min(soldiers.length, Math.max(1, Math.round(soldiers.length / 2)));

    // Front-line targets (largest z first = closest to player)
    const frontSorted = soldiers.slice().sort((a, b) => b.z - a.z).slice(0, totalTargets);
    const passes = totalTargets >= 18 ? 3 : totalTargets >= 6 ? 2 : 1;
    const killQueue = [];
    for (let p = 0; p < passes; p++) {
      const startIdx = Math.floor((p * totalTargets) / passes);
      const endIdx = Math.floor(((p + 1) * totalTargets) / passes);
      const slice = frontSorted.slice(startIdx, endIdx);
      slice.sort((a, b) => (p % 2 === 0 ? a.x - b.x : b.x - a.x));
      for (let k = 0; k < slice.length; k++) killQueue.push(slice[k]);
    }

    const hitTimes = new Float32Array(killQueue.length);
    const spanStart = FIRE_START + 0.08;
    const spanDur = FIRE_END - FIRE_START - 0.16;
    for (let i = 0; i < killQueue.length; i++) {
      hitTimes[i] = killQueue.length === 1
        ? (FIRE_START + FIRE_END) * 0.5
        : spanStart + (i / (killQueue.length - 1)) * spanDur;
    }

    const bx = clamp(game.sx + (game.sx > 0 ? -2.0 : 2.0), -5.6, 5.6);
    const bz = 1.35;
    battery.position.set(bx, 0, bz);
    battery.visible = true;
    carriage.position.z = 0;
    rotor.rotation.z = 0;
    muzzleFlash.visible = false;
    aimGlow.visible = false;

    const first = killQueue[0];
    const initAx = first ? first.x : 0;
    const initAz = first ? first.z : -14;
    aimTurretAt(bx, bz, initAx, 0.55, initAz);
    tmpAim.set(initAx, 0.55, initAz);

    shot = {
      age: 0,
      bx,
      bz,
      killQueue,
      hitTimes,
      killIndex: 0,
      totalTargets,
      reducedMotion: !!reducedMotion,
      startedFire: false,
      finishedFire: false,
      tracerAcc: 0,
      casingAcc: 0,
      shotBeatAcc: 0,
      tracerSeq: 0,
      prevAimX: initAx,
      sweepVx: 0
    };
  }

  function updatePools(dt, reducedMotion) {
    // 1. Tracers
    let tCount = 0;
    for (let i = 0; i < MAX_TRACERS; i++) {
      const tr = tracers[i];
      if (!tr.on) continue;
      tr.life += dt;
      if (tr.life >= tr.maxLife) {
        tr.on = false;
        spawnRing(tr.tx, tr.tz, 0.9 + Math.random() * 0.5, 0.24, tr.colorIdx % 2);
        if (!reducedMotion && (i & 1) === 0) {
          spawnSparkBurst(tr.tx, 0.25, tr.tz, shot ? shot.sweepVx : 0, 2);
        }
        continue;
      }
      tr.x += tr.vx * dt;
      tr.y += tr.vy * dt;
      tr.z += tr.vz * dt;
      dummy.position.set(tr.x, tr.y, tr.z);
      dummy.quaternion.set(tr.qx, tr.qy, tr.qz, tr.qw);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      tracerMesh.setMatrixAt(tCount, dummy.matrix);
      tracerMesh.setColorAt(tCount, tracerPalette[tr.colorIdx]);
      tCount++;
    }
    tracerMesh.count = tCount;
    tracerMesh.visible = tCount > 0;
    if (tCount > 0) {
      tracerMesh.instanceMatrix.needsUpdate = true;
      tracerMesh.instanceColor.needsUpdate = true;
    }

    // 2. Brass Casings
    let cCount = 0;
    if (!reducedMotion) {
      for (let i = 0; i < MAX_CASINGS; i++) {
        const c = casings[i];
        if (!c.on) continue;
        c.life -= dt;
        if (c.life <= 0) {
          c.on = false;
          continue;
        }
        c.vy -= 18 * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.z += c.vz * dt;
        if (c.y < 0.06) {
          c.y = 0.06;
          c.vy = Math.abs(c.vy) * 0.42;
          c.vx *= 0.72;
          c.vz *= 0.72;
        }
        c.rx += c.spinX * dt;
        c.rz += c.spinZ * dt;
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(c.rx, 0, c.rz);
        dummy.scale.setScalar(clamp(c.life * 4, 0, 1));
        dummy.updateMatrix();
        casingMesh.setMatrixAt(cCount, dummy.matrix);
        cCount++;
      }
    }
    casingMesh.count = cCount;
    casingMesh.visible = cCount > 0;
    if (cCount > 0) casingMesh.instanceMatrix.needsUpdate = true;

    // 3. Impact Rings
    let rCount = 0;
    for (let i = 0; i < MAX_RINGS; i++) {
      const r = rings[i];
      if (!r.on) continue;
      r.age += dt;
      const p = r.age / r.dur;
      if (p >= 1) {
        r.on = false;
        continue;
      }
      const ease = 1 - (1 - p) * (1 - p);
      const sc = 0.35 + (r.maxScale - 0.35) * ease;
      dummy.position.set(r.x, r.y, r.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(sc, 1, sc);
      dummy.updateMatrix();
      ringMesh.setMatrixAt(rCount, dummy.matrix);
      tmpColor.copy(ringPalette[r.colorIdx]).multiplyScalar(1 - p);
      ringMesh.setColorAt(rCount, tmpColor);
      rCount++;
    }
    ringMesh.count = rCount;
    ringMesh.visible = rCount > 0;
    if (rCount > 0) {
      ringMesh.instanceMatrix.needsUpdate = true;
      ringMesh.instanceColor.needsUpdate = true;
    }

    // 4. Impact Sparks
    let sCount = 0;
    for (let i = 0; i < MAX_SPARKS; i++) {
      const s = sparks[i];
      if (!s.on) continue;
      s.age += dt;
      const p = s.age / s.dur;
      if (p >= 1) {
        s.on = false;
        continue;
      }
      s.vy -= 14 * dt;
      s.x += s.vx * dt;
      s.y = Math.max(0.05, s.y + s.vy * dt);
      s.z += s.vz * dt;
      tmpDir.set(s.vx, s.vy, s.vz);
      if (tmpDir.lengthSq() > 0.001) {
        tmpDir.normalize();
        tmpQuat.setFromUnitVectors(yAxis, tmpDir);
      } else {
        tmpQuat.identity();
      }
      const fade = 1 - p;
      dummy.position.set(s.x, s.y, s.z);
      dummy.quaternion.copy(tmpQuat);
      dummy.scale.set(0.75 * fade, (1.4 + 1.8 * fade) * fade, 0.75 * fade);
      dummy.updateMatrix();
      sparkMesh.setMatrixAt(sCount, dummy.matrix);
      tmpColor.copy(sparkPalette[s.colorIdx]).multiplyScalar(fade);
      sparkMesh.setColorAt(sCount, tmpColor);
      sCount++;
    }
    sparkMesh.count = sCount;
    sparkMesh.visible = sCount > 0;
    if (sCount > 0) {
      sparkMesh.instanceMatrix.needsUpdate = true;
      sparkMesh.instanceColor.needsUpdate = true;
    }
  }

  function tick(dt, game, callbacks) {
    if (!shot) return true;
    const cb = callbacks || {};
    shot.age += dt;
    const { age, bx, bz, killQueue, hitTimes, reducedMotion } = shot;
    const firing = age >= FIRE_START && age < FIRE_END;

    // Spin curve
    let spinRate = 0;
    if (age < FIRE_START) {
      spinRate = 44 * smooth(age, 0, FIRE_START);
    } else if (age < FIRE_END) {
      spinRate = 44;
    } else {
      spinRate = 44 * (1 - smooth(age, FIRE_END, FINISH));
    }
    rotor.rotation.z += spinRate * dt;
    baseRingMat.opacity = 0.45 + 0.4 * (spinRate / 44);

    // Smooth sweeping aim point along killQueue
    const qLen = killQueue.length;
    if (qLen > 0) {
      const spanStart = FIRE_START + 0.08;
      const spanDur = Math.max(0.01, FIRE_END - FIRE_START - 0.16);
      const u = clamp((age - spanStart) / spanDur, 0, 1) * (qLen - 1);
      const i0 = Math.floor(u);
      const i1 = Math.min(qLen - 1, i0 + 1);
      const frac = u - i0;
      const e0 = killQueue[i0];
      const e1 = killQueue[i1];
      tmpAim.set(
        e0.x + (e1.x - e0.x) * frac,
        0.55,
        e0.z + (e1.z - e0.z) * frac
      );
    } else {
      tmpAim.set(0, 0.55, -14);
    }
    shot.sweepVx = dt > 0 ? (tmpAim.x - shot.prevAimX) / dt : 0;
    shot.prevAimX = tmpAim.x;

    aimTurretAt(bx, bz, tmpAim.x, tmpAim.y, tmpAim.z);

    // Start-fire callback
    if (age >= FIRE_START && !shot.startedFire) {
      shot.startedFire = true;
      muzzleTipAnchor.getWorldPosition(tmpOrigin);
      if (cb.onStartFire) cb.onStartFire(tmpOrigin, shot.totalTargets);
    }

    // Firing phase: recoil, muzzle flash, tracers, casings, audio beat, eliminations
    if (firing) {
      // High-frequency axial recoil pulse
      const recoilPulse = 0.5 + 0.5 * Math.sin(age * 96);
      carriage.position.z = 0.04 + 0.16 * recoilPulse;

      // Muzzle flash strobe
      muzzleFlash.visible = true;
      muzzleFlash.rotation.z = (age * 53) % (Math.PI * 2);
      const flashScale = 0.72 + 0.48 * Math.abs(Math.sin(age * 112));
      muzzleFlash.scale.set(flashScale, flashScale, 0.85 + 0.5 * recoilPulse);
      flashOuterMat.opacity = 0.65 + 0.35 * recoilPulse;
      flashInnerMat.opacity = 0.75 + 0.25 * (1 - recoilPulse);

      // Sweeping ground glow
      aimGlow.visible = true;
      aimGlow.position.set(tmpAim.x, 0.04, tmpAim.z);
      const glowPulse = 0.85 + 0.3 * Math.sin(age * 48);
      aimGlow.scale.set(glowPulse, 1, glowPulse);

      // Spawn tracers (~55/s normal, ~18/s reducedMotion)
      muzzleTipAnchor.getWorldPosition(tmpOrigin);
      const tracerRate = reducedMotion ? 18 : 55;
      shot.tracerAcc += dt * tracerRate;
      while (shot.tracerAcc >= 1) {
        shot.tracerAcc -= 1;
        const spreadX = (Math.random() - 0.5) * 0.84;
        const spreadY = (Math.random() - 0.5) * 0.35;
        const spreadZ = (Math.random() - 0.5) * 0.84;
        spawnTracer(
          tmpOrigin.x, tmpOrigin.y, tmpOrigin.z,
          tmpAim.x + spreadX, Math.max(0.2, tmpAim.y + spreadY), tmpAim.z + spreadZ,
          shot.tracerSeq++ % 3
        );
      }

      // Spawn ejected brass casings (~24/s)
      if (!reducedMotion) {
        shot.casingAcc += dt * 24;
        while (shot.casingAcc >= 1) {
          shot.casingAcc -= 1;
          spawnCasing();
        }
      }

      // Audio beat (~15 Hz)
      shot.shotBeatAcc += dt;
      if (shot.shotBeatAcc >= SHOT_BEAT_INTERVAL) {
        shot.shotBeatAcc -= SHOT_BEAT_INTERVAL;
        if (cb.onShot) cb.onShot(tmpOrigin, tmpAim);
      }
    } else {
      carriage.position.z *= Math.max(0, 1 - dt * 14);
      muzzleFlash.visible = false;
      aimGlow.visible = false;
    }

    // Eliminate enemies scheduled at or before current age
    const batch = [];
    while (
      shot.killIndex < qLen &&
      (age >= hitTimes[shot.killIndex] || age >= FIRE_END)
    ) {
      const enemy = killQueue[shot.killIndex++];
      batch.push(enemy);
    }

    if (batch.length > 0) {
      elimSet.clear();
      for (let i = 0; i < batch.length; i++) {
        const e = batch[i];
        elimSet.add(e);
        if (i < 4 || age >= FIRE_END) {
          spawnRing(e.x, e.z, 1.35 + Math.random() * 0.45, 0.34, i % 2);
        }
        if (!reducedMotion && i < 6) {
          spawnSparkBurst(e.x, 0.75, e.z, shot.sweepVx, 4);
        }
      }
      // In-place compaction of game.enemies
      let write = 0;
      const list = game.enemies;
      for (let i = 0; i < list.length; i++) {
        if (!elimSet.has(list[i])) list[write++] = list[i];
      }
      list.length = write;

      if (cb.onEliminate) cb.onEliminate(batch, shot.killIndex, shot.totalTargets);
    }

    // Finish-fire callback
    if (age >= FIRE_END && !shot.finishedFire) {
      shot.finishedFire = true;
      if (cb.onFinishFire) cb.onFinishFire(shot.killIndex);
    }

    updatePools(dt, reducedMotion);

    // Dynamic over-the-shoulder camera (never modify camera.fov)
    if (!reducedMotion) {
      const side = bx >= 0 ? 1 : -1;
      const fireProgress = clamp((age - FIRE_START) / (FIRE_END - FIRE_START), 0, 1);
      const eyeX = clamp(bx * 0.45 + side * 2.1 + tmpAim.x * 0.22, -5.2, 5.2);
      const eyeY = 4.65;
      const eyeZ = bz + 6.4 - 1.25 * fireProgress;

      eye.set(eyeX, eyeY, eyeZ);
      if (age >= FIRE_START && age <= FIRE_END + 0.15) {
        const shakeEnv =
          smooth(age, FIRE_START, FIRE_START + 0.08) *
          (1 - smooth(age, FIRE_END - 0.12, FIRE_END + 0.15));
        eye.x += shakeEnv * 0.11 * Math.sin(age * 67) * Math.cos(age * 29);
        eye.y += shakeEnv * 0.13 * Math.sin(age * 83 + 1.1);
      }

      focus.set(tmpAim.x * 0.48, 1.15, Math.min(-6.5, tmpAim.z * 0.72 - 2.0));
      const blend = smooth(age, 0, 0.26) * (1 - smooth(age, 2.38, FINISH));
      shotCamera.position.copy(eye);
      shotCamera.lookAt(focus);
      camera.position.copy(home).lerp(eye, blend);
      camera.quaternion.copy(rotation).slerp(shotCamera.quaternion, blend);
    }

    if (age >= FINISH) {
      hide();
      return true;
    }
    return false;
  }

  return { hide, start, tick };
}
