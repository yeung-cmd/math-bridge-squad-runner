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
  function landscape(scene,L) {
    const giants = [];
    const water=texture('water');
    water.wrapS=water.wrapT=THREE.MirroredRepeatWrapping; water.repeat.set(14,14);
    const sea=new THREE.Mesh(new THREE.PlaneGeometry(400,400),new THREE.MeshBasicMaterial({map:water,color:0xd3eff0}));
    sea.rotation.x=-Math.PI/2; sea.position.y=-3; scene.add(sea);
    function road(x,z,w,d,top,surface) {
      block(scene,x,top-1,z,w,2,d,0x80766d);
      const deck=new THREE.Mesh(new THREE.PlaneGeometry(w,d),surface);
      deck.rotation.x=-Math.PI/2; deck.position.set(x,top+.004,z); scene.add(deck);
    }
    road(0,3.5,22,16,0,paving('#dcb988','#927b5a','#f3dbb2',6,6));
    road(0,L.EXIT-60,L.CEN_W,120,0,paving('#ebcb9b','#b49876','#ffdfaa',2,40));
    const sides=paving('#7a9bb1','#4a626f','#abc8cb',1,40);
    const battlements=[];
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
      }
    }
    // The distant citadel frames the three lanes without blocking the play area.
    for (const sign of [-1,1]) {
      const x=sign*5.9;
      block(scene,x,2.5,-48,3.1,5.2,3.3,0x61798c);
      block(scene,x,5,-48,3.5,.45,3.7,0xcaba9b);
      const spire=new THREE.Mesh(new THREE.ConeGeometry(2.7,3.5,4),paint(0x19557b));
      spire.rotation.y=Math.PI/4; spire.position.set(x,6.95,-48);scene.add(spire);
      block(scene,x,4.3,-46.30,.75,1.45,.06,0x19455e);
      block(scene,x,8.9,-48,.07,1.1,.07,0xbf9455);
      block(scene,x+.45,9.12,-48,.9,.45,.05,0xe89842);
      const giant = marchingFigure('giant', 3.95, 4.55);
      const startZ = sign < 0 ? -27 : -30;
      giant.group.position.set(sign * 6.4, .62, startZ);
      scene.add(giant.group);
      giants.push({giant, sign, startZ});
    }
    block(scene,0,4.45,-48,9.6,.7,1.2,0x7e929d);
    block(scene,0,4.86,-48,9.7,.15,1.35,0xffcf79);
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
    function animate(camera, time, bossTravel, reducedMotion) {
      water.offset.set(time * .0018, time * .0025);
      for (const {giant, sign, startZ} of giants) {
        // Keep approaching throughout the round, staying behind the numbered gates.
        const distance = 12 * (1 - Math.exp(-time / 25)) + bossTravel * .32;
        const phase = distance * 5.2 + (sign < 0 ? 0 : Math.PI * .65);
        giant.group.position.z = startZ + distance;
        giant.pose(camera, phase, reducedMotion ? 0 : 1);
      }
    }
    return {animate};
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
