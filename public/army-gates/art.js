// Local art for the army-gates scene. All positions and speeds come from the game.
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
  function block(group, x,y,z, w,h,d, color) {
    const m = new THREE.Mesh(cube, paint(color));
    m.position.set(x,y,z); m.scale.set(w,h,d); group.add(m);
    return m;
  }
  function sprite(name, w, h) {
    const mat = new THREE.SpriteMaterial({ map:texture(name), alphaTest:.22, transparent:false });
    const sp = new THREE.Sprite(mat);
    sp.center.set(.5,0); sp.scale.set(w,h,1);
    return sp;
  }
  // A subdivided figure lets one boot plant while the other rises. The
  // shadow stays on the deck as the hips and shoulders transfer weight.
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
      new THREE.MeshBasicMaterial({color: 0x3b383a, transparent:true, opacity:.25, depthWrite:false}));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = .026;
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
    return {group, body, pose};
  }
  // Stone seams, bevelled edges and mineral flecks, baked once per material.
  function paving(base, mortar, edge, repeatsX, repeatsZ) {
    const c = document.createElement('canvas'); c.width=c.height=256;
    const g=c.getContext('2d'); g.fillStyle=mortar; g.fillRect(0,0,256,256);
    for(let r=0;r<4;r++) for(let k=-1;k<3;k++) {
      const x=k*128+(r%2)*64, y=r*64;
      g.fillStyle=base; g.fillRect(x+2,y+2,125,61);
      const light=g.createLinearGradient(x,y,x+68,y+65);
      light.addColorStop(0,'#ffffff24'); light.addColorStop(1,'#3c24161a');
      g.fillStyle=light; g.fillRect(x+2,y+2,125,61);
      g.fillStyle=edge; g.fillRect(x+3,y+2,122,2);
      for(let i=0;i<30;i++) {
        g.fillStyle=i%2?'#fff8df27':'#56442c1a';
        g.fillRect(x+5+((i*53+r*13)%116),y+6+((i*17+r*3)%50),2+i%4,1);
      }
    }
    const map=new THREE.CanvasTexture(c); map.encoding=THREE.sRGBEncoding;
    map.wrapS=map.wrapT=THREE.RepeatWrapping; map.repeat.set(repeatsX,repeatsZ);
    map.anisotropy=4;
    return new THREE.MeshLambertMaterial({map});
  }

  const THEMES = {
    '1': {
      bg: 0x9ec7c7, fog: 0x9ec7c7,
      hemiSky: 0xffffff, hemiGround: 0x6a5a48, hemiInt: 0.62,
      sunCol: 0xffffff, sunInt: 0.55,
      sea: 0xd3eff0, deck: 0xffffff,
      fire: false, portal: false
    },
    '2': {
      bg: 0xd4896a, fog: 0xc97b5c,
      hemiSky: 0xffd9b3, hemiGround: 0x5c3742, hemiInt: 0.68,
      sunCol: 0xffb46b, sunInt: 0.72,
      sea: 0xc98b78, deck: 0xf5d6bc,
      fire: true, flameCol: 0xff8a24, haloCol: 0xffcf54, portal: false
    },
    '3': {
      bg: 0x111933, fog: 0x111933,
      hemiSky: 0x86a6ff, hemiGround: 0x241838, hemiInt: 0.48,
      sunCol: 0xadc8ff, sunInt: 0.44,
      sea: 0x182a4d, deck: 0x6f7f9e,
      fire: true, flameCol: 0xb066ff, haloCol: 0x6efaff, portal: true
    }
  };

  function landscape(scene, L, lights) {
    const giants = [];
    const giantRings = [];
    const giantPulses = [0, 0];
    const braziers = [];
    const water=texture('water');
    water.wrapS=water.wrapT=THREE.MirroredRepeatWrapping; water.repeat.set(14,14);
    const seaMat = new THREE.MeshBasicMaterial({map:water,color:0xd3eff0});
    const sea=new THREE.Mesh(new THREE.PlaneGeometry(400,400),seaMat);
    sea.rotation.x=-Math.PI/2; sea.position.y=-3; scene.add(sea);

    const deckMats = [];
    function road(x,z,w,d,top,surface) {
      deckMats.push(surface);
      block(scene,x,top-1,z,w,2,d,0x80766d);
      const deck=new THREE.Mesh(new THREE.PlaneGeometry(w,d),surface);
      deck.rotation.x=-Math.PI/2; deck.position.set(x,top+.004,z); scene.add(deck);
    }
    road(0,3.5,22,16,0,paving('#dcb988','#927b5a','#f3dbb2',6,6));
    road(0,L.EXIT-60,L.CEN_W,120,0,paving('#ebcb9b','#b49876','#ffdfaa',2,40));
    const sides=paving('#7a9bb1','#4a626f','#abc8cb',1,40);
    const battlements=[];
    const flameGeo = new THREE.OctahedronGeometry(0.42, 0);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xff8a24 });
    const haloCanvas = document.createElement('canvas');
    haloCanvas.width = haloCanvas.height = 64;
    const hctx = haloCanvas.getContext('2d');
    const hgrad = hctx.createRadialGradient(32, 32, 2, 32, 32, 32);
    hgrad.addColorStop(0, 'rgba(255,255,255,0.95)');
    hgrad.addColorStop(0.4, 'rgba(255,255,255,0.45)');
    hgrad.addColorStop(1, 'rgba(255,255,255,0)');
    hctx.fillStyle = hgrad;
    hctx.fillRect(0, 0, 64, 64);
    const haloTex = new THREE.CanvasTexture(haloCanvas);
    const haloGeo = new THREE.PlaneGeometry(2.5, 2.5);
    const haloMat = new THREE.MeshBasicMaterial({
      map: haloTex, color: 0xffcf54, transparent: true, opacity: 0.72,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
    });

    function addBrazier(x, y, z) {
      block(scene, x, y - 0.14, z, 0.72, 0.28, 0.72, 0x3b444f);
      const grp = new THREE.Group();
      grp.position.set(x, y + 0.25, z);
      const core = new THREE.Mesh(flameGeo, flameMat);
      core.scale.set(0.8, 1.45, 0.8);
      const halo = new THREE.Mesh(haloGeo, haloMat);
      grp.add(core, halo);
      grp.visible = false;
      scene.add(grp);
      braziers.push({ grp, core, halo, phase: braziers.length * 1.7 });
    }

    for(const side of [-1,1]) {
      road(side*6.4,L.EXIT-60,L.SIDE_W,120,.6,sides);
      block(scene,side*6.4,.02,L.EXIT+.2,L.SIDE_W,1.6,2.4,0xbdb4a5);
      for(const [edge,h] of [[3.6,1.2],[8.85,2.2]]) {
        const z = edge < 4 ? L.EXIT-60 : L.EXIT-52;
        const length = edge < 4 ? 120 : 136;
        block(scene,side*edge,h/2-1,z,.54,h+2,length,0x435969);
        block(scene,side*edge,h-.08,z,.64,.19,length,0xbca47c);
      }
      for(let z=8;z>-119;z-=2.2) battlements.push([side*8.85,2.55,z]);
      for(let z=8;z>-110;z-=14) {
        const x=side*9.35;
        block(scene,x,.6,z,1.42,4.2,1.44,0x576b77);
        block(scene,x,2.55,z,1.68,.36,1.72,0xe1b66e);
        const roof=new THREE.Mesh(new THREE.ConeGeometry(1.12,1.4,4),paint(0x285d79));
        roof.rotation.y=Math.PI/4; roof.position.set(x,3.42,z); scene.add(roof);
        block(scene,x,1.15,z+.74,.66,1.7,.05,side<0?0x226d93:0xb05241);
        block(scene,x,1.2,z+.79,.12,1.45,.04,0xffcf73);
        if (z <= -6 && z >= -48) addBrazier(side * 8.85, 2.75, z);
      }
    }
    // The distant citadel frames the three lanes without blocking the play area.
    const ringGeo = new THREE.RingGeometry(1.45, 2.35, 28).rotateX(-Math.PI / 2);
    for (const sign of [-1,1]) {
      const x=sign*5.9;
      block(scene,x,2.5,-48,3.1,5.2,3.3,0x61798c);
      block(scene,x,5,-48,3.5,.45,3.7,0xcaba9b);
      const spire=new THREE.Mesh(new THREE.ConeGeometry(2.7,3.5,4),paint(0x19557b));
      spire.rotation.y=Math.PI/4; spire.position.set(x,6.95,-48);scene.add(spire);
      block(scene,x,4.3,-46.30,.75,1.45,.06,0x19455e);
      block(scene,x,8.9,-48,.07,1.1,.07,0xbf9455);
      block(scene,x+.45,9.12,-48,.9,.45,.05,0xe89842);
      addBrazier(sign * 3.8, 5.2, -46.8);

      const giant = marchingFigure('giant', 3.95, 4.55);
      const startZ = sign < 0 ? -27 : -30;
      giant.group.position.set(sign * 6.4, .62, startZ);
      scene.add(giant.group);
      giants.push({giant, sign, startZ});

      const rMat = new THREE.MeshBasicMaterial({
        color: 0xd88cff, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, rMat);
      ring.position.set(sign * 6.4, 0.68, startZ);
      ring.visible = false;
      scene.add(ring);
      giantRings.push(ring);
    }
    block(scene,0,4.45,-48,9.6,.7,1.2,0x7e929d);
    block(scene,0,4.86,-48,9.7,.15,1.35,0xffcf79);

    // Citadel dark portal archway (used in Chapter 3 & Overlord entrance)
    const portalGroup = new THREE.Group();
    portalGroup.position.set(0, 2.35, -47.2);
    const portalOuterMat = new THREE.MeshBasicMaterial({
      color: 0xb066ff, transparent: true, opacity: 0.65,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const portalInnerMat = new THREE.MeshBasicMaterial({
      color: 0x6efaff, transparent: true, opacity: 0.28,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
    });
    const portalTorus = new THREE.Mesh(new THREE.TorusGeometry(2.65, 0.22, 8, 32), portalOuterMat);
    const portalDisc = new THREE.Mesh(new THREE.CircleGeometry(2.55, 24), portalInnerMat);
    portalGroup.add(portalTorus, portalDisc);
    portalGroup.visible = false;
    scene.add(portalGroup);

    const merlons=new THREE.InstancedMesh(cube,paint(0x859298),battlements.length);
    marker.rotation.set(0,0,0); marker.scale.set(.82,.72,.94);
    battlements.forEach(([x,y,z],i)=>{marker.position.set(x,y,z);marker.updateMatrix();merlons.setMatrixAt(i,marker.matrix);});
    scene.add(merlons);
    const rock=new THREE.IcosahedronGeometry(1,0), leaves=new THREE.IcosahedronGeometry(1,1);
    for(let i=0;i<18;i++) {
      const sign=i%2?1:-1, x=sign*(15+(i*11)%12),z=10-Math.floor(i/2)*9;
      const base=new THREE.Mesh(rock,paint(i%3?0x8d938b:0xbbac87));
      base.position.set(x,-2.8,z); base.scale.set(2.9+i%3,1.6+i%2,3.5);scene.add(base);
      if(i%3!==1) {
        const crown=new THREE.Mesh(leaves,paint(i%2?0x5c9965:0x4c8e72));
        crown.position.set(x,-1.25,z);crown.scale.set(1.8,.6,2.2);scene.add(crown);
      }
    }

    let currentChapter = '1';
    let giantTime = 0;
    let giantStunTimer = 0;
    let portalFlashTimer = 0;
    let lastTime = 0;
    let nextLightning = 5.5;
    let lightningFlash = 0;
    const baseBg = new THREE.Color(0x9ec7c7);
    const flashBg = new THREE.Color(0x2c427a);
    const workColor = new THREE.Color();

    function setTheme(ch) {
      currentChapter = THEMES[ch] ? ch : '1';
      const T = THEMES[currentChapter];
      baseBg.setHex(T.bg);
      scene.background.copy(baseBg);
      scene.fog.color.setHex(T.fog);
      if (lights && lights.hemi) {
        lights.hemi.color.setHex(T.hemiSky);
        lights.hemi.groundColor.setHex(T.hemiGround);
        lights.hemi.intensity = T.hemiInt;
      }
      if (lights && lights.sun) {
        lights.sun.color.setHex(T.sunCol);
        lights.sun.intensity = T.sunInt;
      }
      seaMat.color.setHex(T.sea);
      for (const m of deckMats) m.color.setHex(T.deck);
      for (const b of braziers) b.grp.visible = T.fire;
      if (T.fire) {
        flameMat.color.setHex(T.flameCol);
        haloMat.color.setHex(T.haloCol);
      }
      portalGroup.visible = T.portal;
      lightningFlash = 0;
      nextLightning = 4.5 + Math.random() * 4;
    }

    function reset() {
      giantTime = 0;
      giantStunTimer = 0;
      portalFlashTimer = 0;
      lastTime = 0;
      giantPulses[0] = 0;
      giantPulses[1] = 0;
      for (let i = 0; i < giants.length; i++) {
        const g = giants[i];
        g.giant.group.position.set(g.sign * 6.4, 0.62, g.startZ);
        giantRings[i].visible = false;
      }
      setTheme(currentChapter);
    }

    function pulseGiant(index, colorHex) {
      if (index < 0 || index >= giantRings.length) return;
      giantPulses[index] = 1.0;
      giantRings[index].material.color.setHex(colorHex || 0xd88cff);
      giantRings[index].visible = true;
    }

    function setGiantStun(seconds) {
      giantStunTimer = Math.max(giantStunTimer, seconds);
      for (let i = 0; i < giantRings.length; i++) {
        giantRings[i].material.color.setHex(0x6efaff);
        giantRings[i].visible = true;
      }
    }

    function triggerPortalFlash(duration) {
      portalFlashTimer = Math.max(portalFlashTimer, duration || 1.6);
      portalGroup.visible = true;
    }

    function getGiantPos(index) {
      const g = giants[index];
      if (!g) return { x: 0, y: 0.62, z: -24 };
      const p = g.giant.group.position;
      return { x: p.x, y: p.y, z: p.z };
    }

    function animate(camera, time, bossTravel, reducedMotion, stepDt) {
      const dt = stepDt !== undefined ? stepDt : Math.max(0, Math.min(0.1, time - lastTime));
      lastTime = time;
      water.offset.set(time * .0018, time * .0025);

      if (giantStunTimer > 0) {
        giantStunTimer = Math.max(0, giantStunTimer - dt);
      } else {
        giantTime += dt;
      }

      for (let i = 0; i < giants.length; i++) {
        const {giant, sign, startZ} = giants[i];
        // Keep approaching throughout the round, staying behind the numbered gates.
        const distance = 12 * (1 - Math.exp(-giantTime / 25)) + bossTravel * .32;
        const phase = distance * 5.2 + (sign < 0 ? 0 : Math.PI * .65);
        const stunShake = giantStunTimer > 0 && !reducedMotion ? Math.sin(time * 28 + i) * 0.08 : 0;
        giant.group.position.x = sign * 6.4 + stunShake;
        giant.group.position.z = startZ + distance;
        giant.pose(camera, phase, (reducedMotion || giantStunTimer > 0) ? 0 : 1);

        if (giantPulses[i] > 0) {
          giantPulses[i] = Math.max(0, giantPulses[i] - dt * 1.1);
        }
        const ring = giantRings[i];
        if (giantStunTimer > 0) {
          ring.visible = true;
          ring.position.set(giant.group.position.x, 0.68, giant.group.position.z);
          const sc = 0.92 + 0.14 * Math.sin(time * 12);
          ring.scale.set(sc, 1, sc);
          ring.material.opacity = 0.72 * Math.min(1, giantStunTimer);
        } else if (giantPulses[i] > 0) {
          ring.visible = true;
          ring.position.set(giant.group.position.x, 0.68, giant.group.position.z);
          const p = 1 - giantPulses[i];
          const sc = 0.7 + 1.2 * p;
          ring.scale.set(sc, 1, sc);
          ring.material.opacity = 0.85 * giantPulses[i];
        } else {
          ring.visible = false;
        }
      }

      // Brazier flame flicker
      if (THEMES[currentChapter].fire) {
        for (let i = 0; i < braziers.length; i++) {
          const b = braziers[i];
          const flick = reducedMotion ? 1 : 0.85 + 0.25 * Math.sin(time * 11 + b.phase);
          b.core.scale.set(0.75 * flick, 1.35 * flick, 0.75 * flick);
          b.core.rotation.y = time * 2.5 + b.phase;
          b.halo.quaternion.copy(camera.quaternion);
          b.halo.scale.setScalar(0.9 + 0.22 * flick);
        }
      }

      // Portal & Chapter 3 distant lightning
      if (portalFlashTimer > 0) {
        portalFlashTimer = Math.max(0, portalFlashTimer - dt);
      }
      if (THEMES[currentChapter].portal || portalFlashTimer > 0) {
        portalGroup.visible = true;
        const boost = portalFlashTimer > 0 ? Math.min(1, portalFlashTimer) : 0;
        const pulse = 1 + 0.08 * Math.sin(time * 4) + 0.55 * boost;
        portalGroup.scale.setScalar(pulse);
        portalOuterMat.opacity = 0.55 + 0.45 * boost;
        portalInnerMat.opacity = 0.24 + 0.66 * boost;
      } else {
        portalGroup.visible = false;
      }

      if (currentChapter === '3' && !reducedMotion) {
        nextLightning -= dt;
        if (nextLightning <= 0) {
          lightningFlash = 0.35;
          nextLightning = 6 + Math.random() * 4;
        }
        if (lightningFlash > 0) {
          lightningFlash = Math.max(0, lightningFlash - dt);
          const f = Math.sin((lightningFlash / 0.35) * Math.PI) * 0.65;
          workColor.copy(baseBg).lerp(flashBg, f);
          scene.background.copy(workColor);
          scene.fog.color.copy(workColor);
          if (lights && lights.hemi) lights.hemi.intensity = THEMES['3'].hemiInt + f * 0.45;
        } else {
          scene.background.copy(baseBg);
          scene.fog.color.copy(baseBg);
          if (lights && lights.hemi) lights.hemi.intensity = THEMES['3'].hemiInt;
        }
      }
    }

    return {animate, setTheme, reset, pulseGiant, setGiantStun, triggerPortalFlash, getGiantPos};
  }
  function army(scene,name,capacity,width,height) {
    const units=new THREE.InstancedMesh(new THREE.PlaneGeometry(width,height),
      new THREE.MeshBasicMaterial({map:texture(name),alphaTest:.42,side:THREE.DoubleSide}),capacity);
    const shadows=new THREE.InstancedMesh(new THREE.CircleGeometry(1,12),
      new THREE.MeshBasicMaterial({color:0x503f36,transparent:true,opacity:.21,depthWrite:false}),capacity);
    for(const m of [units,shadows]) {
      m.count=0;m.frustumCulled=false;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(m);
    }
    return {units,shadows,width,height};
  }
  function soldier(camera,a,i,x,z,bob) {
    marker.position.set(x,.018,z);
    marker.rotation.set(-Math.PI/2,0,0);marker.scale.set(a.width*.41,a.width*.26,1);
    marker.updateMatrix();a.shadows.setMatrixAt(i,marker.matrix);
    marker.quaternion.copy(camera.quaternion);
    marker.rotateZ(Math.sin(i*1.9+bob*24)*bob*.4);
    marker.scale.set(1,1,1);
    marker.position.set(x,a.height*.40+bob,z);
    marker.updateMatrix();a.units.setMatrixAt(i,marker.matrix);
  }
  function flush(a,n) {
    for(const mesh of [a.units,a.shadows]) { mesh.count=n;mesh.instanceMatrix.needsUpdate=true; }
  }
  function gateTrim(group) {
    for(const s of [-1,1]) {
      for(const y of [.18,2.91]) {
        const cap=block(group,1.95*s,y,.02,.54,.24,.5,0xe4bc68);
        cap.raycast=()=>{};
      }
      const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.22),paint(0x91eadb));
      gem.position.set(s*1.95,3.35,0);gem.raycast=()=>{};group.add(gem);
    }
  }
  return {sprite,marchingFigure,landscape,army,soldier,flush,gateTrim};
})();
