// Local 3D art & three-ring castle architecture for the army-gates scene.
const armyArt = (() => {
  const loader = new THREE.TextureLoader();
  const textures = new Map();
  const materials = new Map();
  const cube = new THREE.BoxGeometry(1, 1, 1);
  const marker = new THREE.Object3D();

  function texture(name) {
    if (!textures.has(name)) {
      const map = loader.load('art/' + name + '.webp');
      map.encoding = THREE.sRGBEncoding;
      textures.set(name, map);
    }
    return textures.get(name);
  }
  function paint(color) {
    if (!materials.has(color)) materials.set(color, new THREE.MeshLambertMaterial({ color }));
    return materials.get(color);
  }
  function block(group, x, y, z, w, h, d, materialOrColor) {
    const mat = typeof materialOrColor === 'number' ? paint(materialOrColor) : materialOrColor;
    const m = new THREE.Mesh(cube, mat);
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    group.add(m);
    return m;
  }
  function sprite(name, w, h) {
    const mat = new THREE.SpriteMaterial({ map: texture(name), alphaTest: .22, transparent: false });
    const sp = new THREE.Sprite(mat);
    sp.center.set(.5, 0);
    sp.scale.set(w, h, 1);
    return sp;
  }

  // Subdivided marching character mesh with animated stride & subtle shoulder sway.
  function marchingFigure(name, width, height) {
    const group = new THREE.Group();
    const geometry = new THREE.PlaneGeometry(width, height, 12, 16);
    geometry.translate(0, height / 2, 0);
    const body = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      map: texture(name), alphaTest: .24, side: THREE.DoubleSide
    }));
    const positions = geometry.attributes.position;
    positions.setUsage(THREE.DynamicDrawUsage);
    const rest = positions.array.slice();
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 24),
      new THREE.MeshBasicMaterial({ color: 0x3b383a, transparent: true, opacity: .28, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = .028;
    shadow.scale.set(width * .38, width * .22, 1);
    group.add(body, shadow);

    function pose(camera, phase, strength) {
      body.quaternion.copy(camera.quaternion);
      const swing = Math.sin(phase) * strength;
      const shift = Math.cos(phase) * strength;
      for (let i = 0; i < positions.count; i++) {
        const x = rest[i * 3], y = rest[i * 3 + 1];
        const level = y / height;
        const side = Math.max(-1, Math.min(1, x / (width * .11)));
        const leg = Math.max(0, 1 - level / .40);
        const lift = Math.max(0, side * swing) * leg;
        const lean = .026 * level * shift;
        positions.setXYZ(i,
          x + width * (lean + side * lift * .032),
          y + height * (.115 * lift + level * .019 * Math.abs(swing) - level * side * shift * .013),
          rest[i * 3 + 2]);
      }
      positions.needsUpdate = true;
      shadow.position.x = width * .016 * shift;
    }
    return { group, body, pose };
  }

  // Procedural baked stone paving texture
  function paving(base, mortar, edge, repeatsX, repeatsZ) {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'); g.fillStyle = mortar; g.fillRect(0, 0, 256, 256);
    for (let r = 0; r < 4; r++) for (let k = -1; k < 3; k++) {
      const x = k * 128 + (r % 2) * 64, y = r * 64;
      g.fillStyle = base; g.fillRect(x + 2, y + 2, 125, 61);
      const light = g.createLinearGradient(x, y, x + 68, y + 65);
      light.addColorStop(0, '#ffffff24'); light.addColorStop(1, '#3c24161a');
      g.fillStyle = light; g.fillRect(x + 2, y + 2, 125, 61);
      g.fillStyle = edge; g.fillRect(x + 3, y + 2, 122, 2);
      for (let i = 0; i < 30; i++) {
        g.fillStyle = i % 2 ? '#fff8df27' : '#56442c1a';
        g.fillRect(x + 5 + ((i * 53 + r * 13) % 116), y + 6 + ((i * 17 + r * 3) % 50), 2 + i % 4, 1);
      }
    }
    const map = new THREE.CanvasTexture(c); map.encoding = THREE.sRGBEncoding;
    map.wrapS = map.wrapT = THREE.RepeatWrapping; map.repeat.set(repeatsX, repeatsZ);
    map.anisotropy = 4;
    return new THREE.MeshLambertMaterial({ map });
  }

  // Procedural beveled masonry block texture for castle walls & towers
  function masonryMat(base, mortar, highlight, repeatsX, repeatsY) {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'); g.fillStyle = mortar; g.fillRect(0, 0, 256, 256);
    for (let r = 0; r < 4; r++) for (let k = -1; k < 4; k++) {
      const x = k * 84 + (r % 2) * 42, y = r * 64;
      g.fillStyle = base; g.fillRect(x + 3, y + 3, 78, 58);
      const grad = g.createLinearGradient(x, y, x, y + 60);
      grad.addColorStop(0, '#ffffff1f'); grad.addColorStop(1, '#00000024');
      g.fillStyle = grad; g.fillRect(x + 3, y + 3, 78, 58);
      g.fillStyle = highlight; g.fillRect(x + 4, y + 3, 76, 3);
      for (let i = 0; i < 16; i++) {
        g.fillStyle = i % 2 ? '#ffffff18' : '#00000018';
        g.fillRect(x + 8 + ((i * 29 + r * 11) % 64), y + 10 + ((i * 19 + k * 7) % 42), 3 + i % 4, 2);
      }
    }
    const map = new THREE.CanvasTexture(c); map.encoding = THREE.sRGBEncoding;
    map.wrapS = map.wrapT = THREE.RepeatWrapping; map.repeat.set(repeatsX, repeatsY);
    map.anisotropy = 4;
    return new THREE.MeshLambertMaterial({ map });
  }

  // Procedural studded plank door texture
  function doorMat(wood, plankLine, strap, stud) {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'); g.fillStyle = wood; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 6; i++) {
      g.fillStyle = plankLine; g.fillRect(i * 42, 0, 3, 256);
      g.fillStyle = '#ffffff14'; g.fillRect(i * 42 + 4, 0, 2, 256);
    }
    for (const y of [34, 118, 202]) {
      g.fillStyle = strap; g.fillRect(0, y, 256, 24);
      g.fillStyle = '#ffffff26'; g.fillRect(0, y, 256, 3);
      for (let sx = 18; sx < 250; sx += 44) {
        g.fillStyle = stud;
        g.beginPath(); g.arc(sx, y + 12, 6, 0, Math.PI * 2); g.fill();
      }
    }
    const map = new THREE.CanvasTexture(c); map.encoding = THREE.sRGBEncoding;
    map.anisotropy = 4;
    return new THREE.MeshPhongMaterial({ map, shininess: 35 });
  }

  const THEMES = {
    '1': {
      bg: 0x9ec7c7, fog: 0x9ec7c7,
      hemiSky: 0xffffff, hemiGround: 0x6a5a48, hemiInt: 0.65,
      sunCol: 0xffffff, sunInt: 0.58,
      sea: 0xd3eff0, flameCol: 0xff8a24, haloCol: 0xffcf54, firePow: 0
    },
    '2': {
      bg: 0xd48763, fog: 0xc97b5c,
      hemiSky: 0xffd9b3, hemiGround: 0x5c3742, hemiInt: 0.68,
      sunCol: 0xffb46b, sunInt: 0.72,
      sea: 0xc98b78, flameCol: 0xff8c26, haloCol: 0xffd159, firePow: 1
    },
    '3': {
      bg: 0x1b2748, fog: 0x1a2645,
      hemiSky: 0x9bb8ff, hemiGround: 0x2a1d3d, hemiInt: 0.56,
      sunCol: 0xbcd3ff, sunInt: 0.50,
      sea: 0x263f6d, flameCol: 0xb066ff, haloCol: 0x6efaff, firePow: 1
    },
    '4': {
      bg: 0xf6c98e, fog: 0xf2c286,
      hemiSky: 0xfff5db, hemiGround: 0x8a6450, hemiInt: 0.78,
      sunCol: 0xffe09c, sunInt: 0.76,
      sea: 0x9fdde2, flameCol: 0xffd25a, haloCol: 0xfff0a6, firePow: 1
    }
  };

  function landscape(scene, L, lights) {
    const WALL_SPACING = 54;
    const castleRig = new THREE.Group();
    scene.add(castleRig);

    // Animated sea surface (fixed in world so water stretches seamlessly everywhere)
    const water = texture('water');
    water.wrapS = water.wrapT = THREE.MirroredRepeatWrapping; water.repeat.set(16, 16);
    const seaMat = new THREE.MeshBasicMaterial({ map: water, color: 0xd3eff0 });
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(460, 460), seaMat);
    sea.rotation.x = -Math.PI / 2; sea.position.y = -3.1; scene.add(sea);

    // Soft radial glow texture for braziers & rescue sanctum light
    const haloCanvas = document.createElement('canvas'); haloCanvas.width = haloCanvas.height = 64;
    const hctx = haloCanvas.getContext('2d');
    const hgrad = hctx.createRadialGradient(32, 32, 2, 32, 32, 32);
    hgrad.addColorStop(0, 'rgba(255,255,255,0.95)');
    hgrad.addColorStop(0.4, 'rgba(255,255,255,0.42)');
    hgrad.addColorStop(1, 'rgba(255,255,255,0)');
    hctx.fillStyle = hgrad; hctx.fillRect(0, 0, 64, 64);
    const haloTex = new THREE.CanvasTexture(haloCanvas);

    const flameGeo = new THREE.OctahedronGeometry(0.42, 0);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xff8a24 });
    const haloGeo = new THREE.PlaneGeometry(2.6, 2.6);
    const haloMat = new THREE.MeshBasicMaterial({
      map: haloTex, color: 0xffcf54, transparent: true, opacity: 0.72,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
    });
    const braziers = [];
    const banners = [];

    function addBrazier(parent, x, y, z, minStage = 1) {
      block(parent, x, y - 0.14, z, 0.76, 0.28, 0.76, 0x3b444f);
      const grp = new THREE.Group();
      grp.position.set(x, y + 0.26, z);
      const core = new THREE.Mesh(flameGeo, flameMat);
      core.scale.set(0.82, 1.45, 0.82);
      const halo = new THREE.Mesh(haloGeo, haloMat);
      grp.add(core, halo);
      grp.visible = minStage === 0;
      parent.add(grp);
      braziers.push({ grp, core, halo, minStage, phase: braziers.length * 1.65 });
    }

    function addBanner(parent, x, y, z, poleCol, clothCol) {
      block(parent, x, y, z, 0.11, 2.2, 0.11, poleCol);
      const cloth = block(parent, x + 0.56, y + 0.72, z, 1.12, 0.56, 0.06, clothCol);
      banners.push({ cloth, baseX: x + 0.56, phase: banners.length * 1.3 });
    }

    function addRoadStrip(parent, x, zStart, zEnd, w, top, surface, baseCol) {
      const len = Math.abs(zStart - zEnd);
      const zMid = (zStart + zEnd) * 0.5;
      block(parent, x, top - 1, zMid, w, 2, len, baseCol);
      const deck = new THREE.Mesh(new THREE.PlaneGeometry(w, len), surface);
      deck.rotation.x = -Math.PI / 2;
      deck.position.set(x, top + 0.005, zMid);
      parent.add(deck);
    }

    // Build Zone 1: Outer Moat Bridge (+18 to -34)
    const zone1 = new THREE.Group();
    castleRig.add(zone1);
    addRoadStrip(zone1, 0, 18, -34, 22, 0, paving('#dcb988', '#927b5a', '#f3dbb2', 6, 18), 0x80766d);
    addRoadStrip(zone1, 0, -4, -34, L.CEN_W, 0.02, paving('#ebcb9b', '#b49876', '#ffdfaa', 2, 10), 0x80766d);
    const sideStone1 = paving('#7a9bb1', '#4a626f', '#abc8cb', 1, 12);
    const batt1 = [];
    for (const side of [-1, 1]) {
      addRoadStrip(zone1, side * 6.4, -4, -34, L.SIDE_W, 0.6, sideStone1, 0x6c7782);
      block(zone1, side * 6.4, 0.02, -3.8, L.SIDE_W, 1.6, 2.4, 0xbdb4a5);
      for (const [edge, h] of [[3.6, 1.2], [8.85, 2.2]]) {
        block(zone1, side * edge, h / 2 - 1, -11, 0.54, h + 2, 54, 0x435969);
        block(zone1, side * edge, h - 0.08, -11, 0.64, 0.19, 54, 0xbca47c);
      }
      for (let z = 14; z >= -32; z -= 2.2) batt1.push([side * 8.85, 2.55, z]);
      for (const z of [6, -12, -26]) {
        const tx = side * 9.35;
        block(zone1, tx, 0.6, z, 1.44, 4.2, 1.44, 0x576b77);
        block(zone1, tx, 2.55, z, 1.72, 0.36, 1.72, 0xe1b66e);
        const roof = new THREE.Mesh(new THREE.ConeGeometry(1.14, 1.42, 4), paint(0x285d79));
        roof.rotation.y = Math.PI / 4; roof.position.set(tx, 3.42, z); zone1.add(roof);
        addBrazier(zone1, side * 8.85, 2.75, z, 1);
      }
    }
    const merl1 = new THREE.InstancedMesh(cube, paint(0x859298), batt1.length);
    marker.rotation.set(0, 0, 0); marker.scale.set(0.82, 0.72, 0.94);
    batt1.forEach(([x, y, z], i) => { marker.position.set(x, y, z); marker.updateMatrix(); merl1.setMatrixAt(i, marker.matrix); });
    zone1.add(merl1);

    // Rocks along outer sea
    const rockGeo = new THREE.IcosahedronGeometry(1, 0), leafGeo = new THREE.IcosahedronGeometry(1, 1);
    for (let i = 0; i < 16; i++) {
      const sign = i % 2 ? 1 : -1, x = sign * (15 + (i * 11) % 12), z = 12 - Math.floor(i / 2) * 14;
      const base = new THREE.Mesh(rockGeo, paint(i % 3 ? 0x8d938b : 0xbbac87));
      base.position.set(x, -2.9, z); base.scale.set(2.9 + i % 3, 1.6 + i % 2, 3.5); castleRig.add(base);
      if (i % 3 !== 1) {
        const crown = new THREE.Mesh(leafGeo, paint(i % 2 ? 0x5c9965 : 0x4c8e72));
        crown.position.set(x, -1.35, z); crown.scale.set(1.8, 0.6, 2.2); castleRig.add(crown);
      }
    }

    // Build Zone 2: Middle Bastion Bailey (-34 to -88)
    const zone2 = new THREE.Group();
    castleRig.add(zone2);
    const courtyard2 = paving('#cfa378', '#805c43', '#ecc89e', 6, 16);
    const center2 = paving('#dfb88b', '#946b4c', '#f7d8b2', 2, 16);
    const side2 = paving('#786c70', '#483e42', '#a89a9d', 1, 16);
    const wallMat2 = masonryMat('#7d6968', '#4a3a3d', '#b39588', 4, 2);
    addRoadStrip(zone2, 0, -34, -88, 22, 0, courtyard2, 0x6b564a);
    addRoadStrip(zone2, 0, -34, -88, L.CEN_W, 0.02, center2, 0x6b564a);
    for (const side of [-1, 1]) {
      addRoadStrip(zone2, side * 6.4, -34, -88, L.SIDE_W, 0.6, side2, 0x5a4c4f);
      block(zone2, side * 3.6, 0.2, -61, 0.56, 2.4, 54, 0x5a4748);
      block(zone2, side * 3.6, 1.25, -61, 0.68, 0.2, 54, 0xc79e6a);
      // High outer bailey walls enclosing Zone 2
      block(zone2, side * 10.1, 3.1, -61, 1.8, 6.8, 54, wallMat2);
      block(zone2, side * 10.1, 6.6, -61, 2.0, 0.35, 54, 0xc79e6a);
      for (let z = -37; z >= -85; z -= 3.2) {
        block(zone2, side * 10.1, 7.2, z, 1.4, 0.9, 1.6, wallMat2);
      }
      for (const z of [-44, -58, -72]) {
        block(zone2, side * 9.1, 2.9, z, 1.1, 6.2, 1.3, 0x594446);
        addBrazier(zone2, side * 8.9, 3.6, z, 1);
        addBanner(zone2, side * 8.6, 5.4, z, 0xd4a44a, side < 0 ? 0xb5322c : 0x265c91);
      }
    }

    // Build Zone 3: Inner Royal Sanctuary Hallway (-88 to -142) & Keep Courtyard (-142 to -186)
    const zone3 = new THREE.Group();
    castleRig.add(zone3);
    const courtyard3 = paving('#8a98b8', '#4d5873', '#c0cce3', 6, 16);
    const center3 = paving('#a6b4d4', '#5c698a', '#dce5f7', 2, 16);
    const side3 = paving('#556585', '#313c54', '#8697b8', 1, 16);
    const wallMat3 = masonryMat('#aebad1', '#5f6c85', '#e4ecfc', 4, 2);
    addRoadStrip(zone3, 0, -88, -186, 24, 0, courtyard3, 0x455069);
    addRoadStrip(zone3, 0, -88, -172, L.CEN_W, 0.02, center3, 0x455069);
    for (const side of [-1, 1]) {
      addRoadStrip(zone3, side * 6.4, -88, -142, L.SIDE_W, 0.6, side3, 0x3b4761);
      block(zone3, side * 3.6, 0.2, -115, 0.56, 2.4, 54, 0x435170);
      block(zone3, side * 3.6, 1.25, -115, 0.68, 0.2, 54, 0xe8c36b);
      // Tall Gothic sanctuary walls
      block(zone3, side * 10.2, 3.7, -115, 2.0, 8.0, 54, wallMat3);
      block(zone3, side * 10.2, 7.8, -115, 2.2, 0.36, 54, 0xe8c36b);
      for (let z = -91; z >= -139; z -= 3.2) {
        block(zone3, side * 10.2, 8.45, z, 1.45, 0.95, 1.6, wallMat3);
      }
      for (const z of [-98, -112, -126]) {
        block(zone3, side * 9.0, 3.6, z, 1.0, 7.6, 1.2, 0x7080a3);
        block(zone3, side * 9.0, 7.5, z, 1.3, 0.35, 1.5, 0xe8c36b);
        addBrazier(zone3, side * 8.9, 4.1, z, 1);
        addBanner(zone3, side * 8.6, 6.2, z, 0xf0c960, 0x26599c);
      }
    }

    // ---------------- Three Grand Fortress Walls & Animated Double Gates ----------------
    const wallConfigs = [
      {
        z: -34,
        masonry: masonryMat('#9aa6ad', '#626d75', '#cfd8de', 3, 2),
        trimCol: 0xd9c293,
        roofCol: 0x285d79,
        towerCol: 0x61798c,
        door: doorMat('#6e4a2e', '#3c2515', '#424b54', '#d4a94f'),
        accentCol: 0xffcf73,
        crestCol: 0x2f8cf0,
        spireH: 3.6,
        wallH: 6.4
      },
      {
        z: -88,
        masonry: masonryMat('#826c6a', '#4a3a3d', '#b8988b', 3, 2),
        trimCol: 0xe0aa58,
        roofCol: 0x8f2e27,
        towerCol: 0x5c4749,
        door: doorMat('#4d2e24', '#26140f', '#9c6c31', '#ffd25a'),
        accentCol: 0xffb84d,
        crestCol: 0xd9483b,
        spireH: 4.3,
        wallH: 7.2
      },
      {
        z: -142,
        masonry: masonryMat('#c5d0e6', '#6d7a94', '#f2f6ff', 3, 2),
        trimCol: 0xf4cf6b,
        roofCol: 0x1b4788,
        towerCol: 0x8a99b8,
        door: doorMat('#294578', '#142340', '#e5b84b', '#fff0a6'),
        accentCol: 0x78e8ff,
        crestCol: 0x7058d8,
        spireH: 5.0,
        wallH: 8.0
      }
    ];

    const walls = [];
    const goldMat = new THREE.MeshPhongMaterial({ color: 0xf0c454, shininess: 90 });
    const ironMat = new THREE.MeshPhongMaterial({ color: 0x2c3642, shininess: 60 });

    wallConfigs.forEach((cfg, idx) => {
      const wg = new THREE.Group();
      wg.position.set(0, 0, cfg.z);
      castleRig.add(wg);

      const h = cfg.wallH;
      // Central gate piers (leaving x = -3.0..+3.0 open for double doors)
      for (const s of [-1, 1]) {
        block(wg, s * 3.7, h * 0.46, 0, 1.4, h * 0.92, 2.4, cfg.masonry);
        block(wg, s * 3.7, 0.35, 0, 1.65, 0.7, 2.7, cfg.trimCol);
        block(wg, s * 3.7, h * 0.93, 0, 1.65, 0.35, 2.6, cfg.trimCol);
      }

      // Semicircular voussoir arch stones over the gate opening
      const archR = 3.25;
      for (let k = 0; k < 9; k++) {
        const ang = (k / 8) * Math.PI;
        const ax = Math.cos(ang) * archR;
        const ay = 4.1 + Math.sin(ang) * 1.45;
        const stone = block(wg, ax, ay, 0, 0.95, 0.75, 2.45, k === 4 ? cfg.trimCol : cfg.masonry);
        stone.rotation.z = ang - Math.PI / 2;
      }

      // Upper parapet bridge spanning across the entire castle width (x = -10.5 .. +10.5)
      block(wg, 0, h - 0.55, 0, 22.0, 1.9, 2.3, cfg.masonry);
      block(wg, 0, h + 0.45, 0, 22.4, 0.32, 2.6, cfg.trimCol);
      for (let mx = -9.6; mx <= 9.6; mx += 1.6) {
        block(wg, mx, h + 1.0, 0.95, 0.85, 0.85, 0.48, cfg.masonry);
      }

      // Crest medallion / rose window above main gate
      const crest = new THREE.Mesh(new THREE.OctahedronGeometry(0.68, 0), new THREE.MeshBasicMaterial({ color: cfg.crestCol }));
      crest.position.set(0, h - 0.1, 1.25);
      crest.scale.set(1.0, 1.0, 0.35);
      wg.add(crest);
      if (idx === 2) {
        const rose = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.14, 8, 24), goldMat);
        rose.position.set(0, h - 0.1, 1.2);
        wg.add(rose);
      }

      // Twin Main Gate Towers (x = ±4.55) + Outer Flank Towers (x = ±9.6)
      for (const s of [-1, 1]) {
        // Main inner flanking octagonal tower
        const tx = s * 4.7;
        const cyl = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.62, h + 1.4, 8), cfg.masonry);
        cyl.position.set(tx, (h + 1.4) * 0.5, 0.1);
        wg.add(cyl);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.72, 1.55, 0.48, 8), paint(cfg.trimCol));
        cap.position.set(tx, h + 1.4, 0.1);
        wg.add(cap);
        const spire = new THREE.Mesh(new THREE.ConeGeometry(1.82, cfg.spireH, 8), paint(cfg.roofCol));
        spire.position.set(tx, h + 1.65 + cfg.spireH * 0.5, 0.1);
        wg.add(spire);
        block(wg, tx, h + 1.65 + cfg.spireH + 0.45, 0.1, 0.08, 1.0, 0.08, goldMat);
        addBanner(wg, tx + s * 0.25, h + 1.85 + cfg.spireH, 0.1, 0xf0c960, idx === 2 ? 0x2f8cf0 : 0xd9483b);
        addBrazier(wg, tx, h + 1.7, 1.4, idx === 0 ? 1 : 0);

        // Side-lane wall buttress & outer corner tower
        const ox = s * 9.8;
        block(wg, ox, h * 0.55, 0, 2.6, h + 1.1, 2.8, cfg.masonry);
        block(wg, ox, h + 1.1, 0, 2.9, 0.42, 3.1, cfg.trimCol);
        const oSpire = new THREE.Mesh(new THREE.ConeGeometry(1.9, cfg.spireH * 0.85, 4), paint(cfg.roofCol));
        oSpire.rotation.y = Math.PI / 4;
        oSpire.position.set(ox, h + 1.3 + cfg.spireH * 0.42, 0);
        wg.add(oSpire);
      }

      // Double-leaf animated doors (hinged at x = ±3.0)
      const doorH = 4.9;
      const doorL = new THREE.Group();
      doorL.position.set(-3.0, 0, 0.0);
      const leafL = new THREE.Mesh(new THREE.BoxGeometry(3.0, doorH, 0.28), cfg.door);
      leafL.position.set(1.5, doorH * 0.5, 0);
      doorL.add(leafL);
      wg.add(doorL);

      const doorR = new THREE.Group();
      doorR.position.set(3.0, 0, 0.0);
      const leafR = new THREE.Mesh(new THREE.BoxGeometry(3.0, doorH, 0.28), cfg.door);
      leafR.position.set(-1.5, doorH * 0.5, 0);
      doorR.add(leafR);
      wg.add(doorR);

      // Iron portcullis gate in front of doors
      const portcullis = new THREE.Group();
      portcullis.position.set(0, 0, 0.42);
      for (let bx = -2.4; bx <= 2.4; bx += 0.8) {
        block(portcullis, bx, 2.35, 0, 0.11, 4.7, 0.11, ironMat);
      }
      for (const by of [0.8, 2.2, 3.6]) {
        block(portcullis, 0, by, 0, 5.6, 0.12, 0.12, ironMat);
      }
      wg.add(portcullis);

      // Golden victory light beam inside the archway (flares when gate opens)
      const beamMat = new THREE.MeshBasicMaterial({
        color: idx === 2 ? 0xffe48f : 0x8ef5ff,
        transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
      });
      const beam = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 5.0), beamMat);
      beam.position.set(0, 2.5, -0.5);
      wg.add(beam);

      walls.push({ group: wg, localZ: cfg.z, doorL, doorR, portcullis, beam, beamMat, open: false, openAmt: 0 });
    });

    // ---------------- Princess Rose Keep (inner sanctum at local z = -164) ----------------
    const keep = new THREE.Group();
    keep.position.set(0, 0, -164);
    castleRig.add(keep);
    const keepMarble = masonryMat('#e6ecf7', '#9aa6bf', '#ffffff', 4, 3);
    const royalBlueMat = paint(0x2868b8);
    const warmWindowMat = new THREE.MeshBasicMaterial({ color: 0xffe594 });

    // Raised marble terrace & grand staircase
    block(keep, 0, 0.8, 0, 20, 1.6, 15, keepMarble);
    block(keep, 0, 1.65, 0, 20.4, 0.28, 15.4, goldMat);
    block(keep, 0, 0.45, 9.2, 8.2, 0.9, 3.8, 0xdce4f2);
    block(keep, 0, 0.2, 11.4, 9.0, 0.4, 2.2, 0xe8eef9);

    // Central high tower + gilded spire
    block(keep, 0, 7.6, -1.0, 6.8, 12.2, 6.8, keepMarble);
    block(keep, 0, 13.8, -1.0, 7.2, 0.45, 7.2, goldMat);
    const mainRoof = new THREE.Mesh(new THREE.ConeGeometry(4.8, 7.2, 8), royalBlueMat);
    mainRoof.position.set(0, 17.6, -1.0);
    keep.add(mainRoof);
    block(keep, 0, 21.8, -1.0, 0.16, 2.2, 0.16, goldMat);
    addBanner(keep, 0, 22.4, -1.0, 0xf0c960, 0xe64564);

    // Glowing arched sanctuary doorway & upper windows
    block(keep, 0, 3.2, 2.48, 3.2, 3.6, 0.22, warmWindowMat);
    block(keep, 0, 9.2, 2.48, 1.6, 2.8, 0.18, warmWindowMat);
    for (const s of [-1, 1]) {
      block(keep, s * 1.9, 6.5, 2.48, 0.9, 2.0, 0.18, warmWindowMat);
      // Mid flanking sky-blue towers
      const mCyl = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.3, 10.6, 10), keepMarble);
      mCyl.position.set(s * 5.6, 6.8, 0.2);
      keep.add(mCyl);
      const mRoof = new THREE.Mesh(new THREE.ConeGeometry(2.6, 4.6, 10), royalBlueMat);
      mRoof.position.set(s * 5.6, 14.3, 0.2);
      keep.add(mRoof);
      block(keep, s * 5.6, 16.9, 0.2, 0.12, 1.2, 0.12, goldMat);
      block(keep, s * 5.6, 7.8, 2.45, 1.0, 2.1, 0.16, warmWindowMat);

      // Outer turrets
      const oCyl = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.65, 8.2, 8), keepMarble);
      oCyl.position.set(s * 9.0, 5.6, 2.2);
      keep.add(oCyl);
      const oRoof = new THREE.Mesh(new THREE.ConeGeometry(1.9, 3.6, 8), royalBlueMat);
      oRoof.position.set(s * 9.0, 11.4, 2.2);
      keep.add(oRoof);
    }

    // ---------------- Theme Blending, Scrolling & Per-Frame Animation ----------------
    const curBg = new THREE.Color(THEMES['1'].bg);
    const curFog = new THREE.Color(THEMES['1'].fog);
    const curHemiSky = new THREE.Color(THEMES['1'].hemiSky);
    const curHemiGround = new THREE.Color(THEMES['1'].hemiGround);
    const curSun = new THREE.Color(THEMES['1'].sunCol);
    const curSea = new THREE.Color(THEMES['1'].sea);
    const curFlame = new THREE.Color(THEMES['1'].flameCol);
    const curHalo = new THREE.Color(THEMES['1'].haloCol);
    const cA = new THREE.Color(), cB = new THREE.Color();

    let activeFirePow = 0;
    let lastTime = 0;

    function blendStageTheme(fromKey, toKey, t) {
      const A = THEMES[String(fromKey)] || THEMES['1'];
      const B = THEMES[String(toKey)] || THEMES['1'];
      const k = Math.max(0, Math.min(1, t));

      curBg.copy(cA.setHex(A.bg)).lerp(cB.setHex(B.bg), k);
      curFog.copy(cA.setHex(A.fog)).lerp(cB.setHex(B.fog), k);
      scene.background.copy(curBg);
      scene.fog.color.copy(curFog);

      curHemiSky.copy(cA.setHex(A.hemiSky)).lerp(cB.setHex(B.hemiSky), k);
      curHemiGround.copy(cA.setHex(A.hemiGround)).lerp(cB.setHex(B.hemiGround), k);
      curSun.copy(cA.setHex(A.sunCol)).lerp(cB.setHex(B.sunCol), k);
      if (lights && lights.hemi) {
        lights.hemi.color.copy(curHemiSky);
        lights.hemi.groundColor.copy(curHemiGround);
        lights.hemi.intensity = A.hemiInt + (B.hemiInt - A.hemiInt) * k;
      }
      if (lights && lights.sun) {
        lights.sun.color.copy(curSun);
        lights.sun.intensity = A.sunInt + (B.sunInt - A.sunInt) * k;
      }

      curSea.copy(cA.setHex(A.sea)).lerp(cB.setHex(B.sea), k);
      seaMat.color.copy(curSea);

      curFlame.copy(cA.setHex(A.flameCol)).lerp(cB.setHex(B.flameCol), k);
      curHalo.copy(cA.setHex(A.haloCol)).lerp(cB.setHex(B.haloCol), k);
      flameMat.color.copy(curFlame);
      haloMat.color.copy(curHalo);
      activeFirePow = A.firePow + (B.firePow - A.firePow) * k;
      for (const b of braziers) {
        b.grp.visible = b.minStage === 0 || activeFirePow > 0.05;
      }
      haloMat.opacity = 0.72 * Math.max(0.25, activeFirePow);
    }

    function setScroll(offsetZ) {
      castleRig.position.z = offsetZ;
      for (const w of walls) {
        const wz = w.localZ + offsetZ;
        // Hide conquered walls once they pass behind the camera/staging edge so they never clip the view.
        w.group.visible = wz <= 9.5;
      }
      zone1.visible = offsetZ < 68;
      zone2.visible = offsetZ < 122;
    }

    function openWall(idx) {
      if (walls[idx]) walls[idx].open = true;
    }

    function reset() {
      lastTime = 0;
      castleRig.position.z = 0;
      zone1.visible = true;
      zone2.visible = true;
      for (const w of walls) {
        w.open = false;
        w.openAmt = 0;
        w.group.visible = true;
        w.doorL.rotation.y = 0;
        w.doorR.rotation.y = 0;
        w.portcullis.position.y = 0;
        w.beamMat.opacity = 0;
      }
      blendStageTheme('1', '1', 1);
    }

    function animate(camera, time, reducedMotion, stepDt) {
      const dt = stepDt !== undefined ? stepDt : Math.max(0, Math.min(0.1, time - lastTime));
      lastTime = time;
      water.offset.set(time * .0018, time * .0025);

      // Animate opening gates & portcullis
      for (const w of walls) {
        if (w.open && w.openAmt < 1) {
          w.openAmt = Math.min(1, w.openAmt + dt * 1.45);
          const e = 1 - Math.pow(1 - w.openAmt, 3);
          w.doorL.rotation.y = e * 1.38;
          w.doorR.rotation.y = -e * 1.38;
          w.portcullis.position.y = e * 4.3;
          w.beamMat.opacity = 0.42 * Math.sin(w.openAmt * Math.PI * 0.7);
        } else if (w.open) {
          w.beamMat.opacity = 0.16 + 0.08 * Math.sin(time * 3.0);
        }
      }

      // Brazier flames & subtle flag flutter
      for (let i = 0; i < braziers.length; i++) {
        const b = braziers[i];
        if (!b.grp.visible) continue;
        const flick = reducedMotion ? 1 : 0.86 + 0.24 * Math.sin(time * 11 + b.phase);
        b.core.scale.set(0.78 * flick, 1.38 * flick, 0.78 * flick);
        b.core.rotation.y = time * 2.4 + b.phase;
        b.halo.quaternion.copy(camera.quaternion);
        b.halo.scale.setScalar(0.92 + 0.2 * flick);
      }
      if (!reducedMotion) {
        for (let i = 0; i < banners.length; i++) {
          const bn = banners[i];
          bn.cloth.rotation.y = Math.sin(time * 3.2 + bn.phase) * 0.18;
        }
      }
    }

    reset();
    return { WALL_SPACING, animate, blendStageTheme, setScroll, openWall, reset };
  }

  function army(scene, name, capacity, width, height) {
    const units = new THREE.InstancedMesh(new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ map: texture(name), alphaTest: .42, side: THREE.DoubleSide }), capacity);
    const shadows = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 12),
      new THREE.MeshBasicMaterial({ color: 0x503f36, transparent: true, opacity: .21, depthWrite: false }), capacity);
    for (const m of [units, shadows]) {
      m.count = 0; m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(m);
    }
    return { units, shadows, width, height };
  }
  function soldier(camera, a, i, x, z, bob) {
    marker.position.set(x, .018, z);
    marker.rotation.set(-Math.PI / 2, 0, 0); marker.scale.set(a.width * .41, a.width * .26, 1);
    marker.updateMatrix(); a.shadows.setMatrixAt(i, marker.matrix);
    marker.quaternion.copy(camera.quaternion);
    marker.rotateZ(Math.sin(i * 1.9 + bob * 24) * bob * .4);
    marker.scale.set(1, 1, 1);
    marker.position.set(x, a.height * .40 + bob, z);
    marker.updateMatrix(); a.units.setMatrixAt(i, marker.matrix);
  }
  function flush(a, n) {
    for (const mesh of [a.units, a.shadows]) { mesh.count = n; mesh.instanceMatrix.needsUpdate = true; }
  }
  function gateTrim(group) {
    for (const s of [-1, 1]) {
      for (const y of [.18, 2.91]) {
        const cap = block(group, 1.95 * s, y, .02, .54, .24, .5, 0xe4bc68);
        cap.raycast = () => {};
      }
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(.22), paint(0x91eadb));
      gem.position.set(s * 1.95, 3.35, 0); gem.raycast = () => {}; group.add(gem);
    }
  }
  return { sprite, marchingFigure, landscape, army, soldier, flush, gateTrim };
})();
