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
  const cart = new THREE.Group();
  scene.add(cart);
  const steel = new THREE.MeshPhongMaterial({color:0x214d78, shininess:65});
  const gold = new THREE.MeshPhongMaterial({color:0xf5bd51, shininess:75});
  const tire = new THREE.MeshPhongMaterial({color:0x122743, shininess:24});
  const glow = new THREE.MeshBasicMaterial({color:0x9affff});
  function mesh(geometry, material, parent, x, y, z) {
    const part = new THREE.Mesh(geometry, material);
    part.position.set(x, y, z);
    parent.add(part);
    return part;
  }

  mesh(new THREE.BoxGeometry(2.05,.54,2.9), steel, cart, 0,.76,0);
  mesh(new THREE.BoxGeometry(1.82,.16,2.7), gold, cart, 0,1.09,0);
  mesh(new THREE.CylinderGeometry(.65,.85,.42,16), steel, cart, 0,1.24,0);
  const barrel = new THREE.Group();
  barrel.position.y = 1.68;
  barrel.rotation.x = .12;
  cart.add(barrel);
  mesh(new THREE.CylinderGeometry(.43,.59,2.45,20).rotateX(Math.PI/2), steel, barrel, 0,0,-.28);
  const collar = new THREE.CylinderGeometry(.61,.61,.2,20).rotateX(Math.PI/2);
  for (const z of [-1.48,-.72,.6]) mesh(collar, gold, barrel, 0,0,z);
  mesh(new THREE.SphereGeometry(.42,16,12), tire, barrel, 0,0,-1.21);
  mesh(new THREE.SphereGeometry(.33,16,12), glow, barrel, 0,0,-1.31);

  const wheels = [];
  const wheelRadius = .65;
  const tread = new THREE.CylinderGeometry(wheelRadius,wheelRadius,.32,16).rotateZ(Math.PI/2);
  const rim = new THREE.TorusGeometry(.49,.08,8,16).rotateY(Math.PI/2);
  const spoke = new THREE.BoxGeometry(.07,.91,.085);
  const hub = new THREE.CylinderGeometry(.17,.17,.15,12).rotateZ(Math.PI/2);
  for (const side of [-1,1]) {
    for (const z of [-1.02,1.02]) {
      const wheel = new THREE.Group();
      wheel.position.set(side*1.07,wheelRadius,z);
      cart.add(wheel);
      mesh(tread,tire,wheel,0,0,0);
      mesh(rim,gold,wheel,side*.19,0,0);
      for (const angle of [0,Math.PI/3,Math.PI*2/3]) {
        mesh(spoke,gold,wheel,side*.19,0,0).rotation.x=angle;
      }
      mesh(hub,steel,wheel,side*.23,0,0);
      wheels.push(wheel);
    }
  }

  const waveMaterial = new THREE.MeshBasicMaterial({
    color:0x87ffec, transparent:true, depthWrite:false, side:THREE.DoubleSide
  });
  const wave = mesh(new THREE.RingGeometry(.82,1,40).rotateX(-Math.PI/2),waveMaterial,scene,0,.24,0);
  mesh(new THREE.RingGeometry(.62,.68,40).rotateX(-Math.PI/2),waveMaterial,wave,0,.01,0);
  const radius = 4.2;
  const homePosition = camera.position.clone();
  const homeRotation = camera.quaternion.clone();
  const closePosition = new THREE.Vector3();
  const closeCamera = camera.clone();
  let center = null;
  let roll = null;

  function hide() {
    if (roll) {
      camera.position.copy(homePosition);
      camera.quaternion.copy(homeRotation);
    }
    cart.visible=wave.visible=false;
    center=null;
    roll=null;
  }
  hide();

  function aim(game) {
    const near = [...game.enemies].sort((a,b) =>
      Math.hypot(a.x-game.sx,a.z-4.2)-Math.hypot(b.x-game.sx,b.z-4.2));
    for (const lead of near) {
      const group = near.filter(e => Math.hypot(e.x-lead.x,e.z-lead.z)<radius*.8).slice(0,8);
      if (group.length<3) continue;
      center = new THREE.Vector3();
      for (const enemy of group) {
        center.x+=enemy.x;
        center.z+=enemy.z;
      }
      center.multiplyScalar(1/group.length);
      return true;
    }
    return false;
  }

  function start(game, reducedMotion) {
    aim(game);
    const targets = game.enemies.map(enemy => ({enemy, distance:Math.hypot(enemy.x-center.x,enemy.z-center.z)}))
      .filter(hit => hit.distance<=radius)
      .sort((a,b) => a.distance-b.distance)
      .slice(0,12)
      .map(hit => hit.enemy)
      .sort((a,b) => b.z-a.z);
    const front = targets[0]?.z ?? center.z;
    const back = targets.at(-1)?.z ?? center.z;
    roll = {
      targets, front, back, age:0, count:0, nextTrack:0,
      x:THREE.MathUtils.clamp(center.x,-1.1,1.1), reducedMotion
    };
    cart.position.set(roll.x,0,front+9);
    cart.visible=true;
  }

  function tick(dt, game, onSweep, onTrack) {
    roll.age+=dt;
    const approach = Math.min(1,roll.age/1.05);
    const sweep = THREE.MathUtils.clamp((roll.age-1.05)/1.06,0,1);
    const before = roll.front+1.6;
    // Follow through at a slower speed so the advancing line of stars stays visible.
    const z = approach<1
      ? THREE.MathUtils.lerp(roll.front+9,before,approach)
      : THREE.MathUtils.lerp(before,roll.back-2.1,sweep);
    cart.position.z=z;
    const distance = roll.front+9-z;
    cart.position.y=roll.reducedMotion ? 0 : (Math.sin(distance*7)+1)*.022;
    for (const wheel of wheels) wheel.rotation.x=-distance/wheelRadius;

    if (sweep<1 && distance>=roll.nextTrack) {
      roll.nextTrack=distance+1.45;
      onTrack(roll.x,z+.9);
    }

    while (roll.targets.length && z-1.55<=roll.targets[0].z) {
      const enemy=roll.targets.shift();
      const index=game.enemies.indexOf(enemy);
      if (index===-1) continue;
      game.enemies.splice(index,1);
      roll.count++;
      onSweep(enemy,roll.count);
    }

    if (sweep>0 && roll.age<2.47) {
      wave.visible=true;
      wave.position.set(roll.x,.24,z-1.4);
      wave.scale.set(3.5,1,1.12);
      waveMaterial.opacity=.72*(1-THREE.MathUtils.clamp((roll.age-2.11)/.36,0,1));
    } else wave.visible=false;

    if (!roll.reducedMotion) {
      const blendIn=THREE.MathUtils.smoothstep(roll.age,0,.36);
      const blendOut=1-THREE.MathUtils.smoothstep(roll.age,2.58,3.04);
      const blend=blendIn*blendOut;
      const jolt=roll.targets.length && sweep>0 ? Math.sin(roll.age*77)*.045 : 0;
      closePosition.set(roll.x-3.15+jolt,4.9,z+6.85);
      camera.position.copy(homePosition).lerp(closePosition,blend);
      closeCamera.position.copy(closePosition);
      closeCamera.lookAt(roll.x+.6,1.15,z-3.4);
      camera.quaternion.copy(homeRotation).slerp(closeCamera.quaternion,blend);
    }
    return roll.age>=3.04;
  }

  return {hide, aim, start, tick};
}
