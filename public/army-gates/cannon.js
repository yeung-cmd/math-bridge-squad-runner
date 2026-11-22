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

function createQuizCannon(scene) {
  const base=new THREE.Group(), mount=new THREE.Group();
  scene.add(base); base.add(mount);
  const metal=new THREE.MeshPhongMaterial({color:0x24548c,shininess:65});
  const gold=new THREE.MeshPhongMaterial({color:0xf5bd51,shininess:75});
  const glow=new THREE.MeshBasicMaterial({color:0x9affff});
  function mesh(geometry, material, parent) {
    const m=new THREE.Mesh(geometry,material);parent.add(m);return m;
  }
  const plinth=mesh(new THREE.CylinderGeometry(.78,.98,.45,12),metal,base);
  plinth.position.y=.25;
  const gun=mesh(new THREE.CylinderGeometry(.48,.33,1.85,16),metal,mount);
  gun.rotation.x=-Math.PI/2;
  for (const z of [-.82,.46]) {
    const band=mesh(new THREE.CylinderGeometry(.49,.49,.16,16),gold,mount);
    band.rotation.x=-Math.PI/2;band.position.z=z;
  }
  const muzzle=mesh(new THREE.CircleGeometry(.34,20),glow,mount);
  muzzle.rotation.y=Math.PI;muzzle.position.z=-.94;
  mount.position.y=1.05; mount.rotation.x=.42;
  base.scale.setScalar(1.35);
  const ball=mesh(new THREE.SphereGeometry(.4,16,10),glow,scene);
  const haloMat=new THREE.MeshBasicMaterial({color:0xffdc75,transparent:true,depthWrite:false,side:THREE.DoubleSide});
  const halo=mesh(new THREE.RingGeometry(.85,1,48),haloMat,scene);
  halo.rotation.x=-Math.PI/2;
  const origin=new THREE.Vector3(), target=new THREE.Vector3();
  let age=-1;
  const radius=4.2, travel=.6;
  function hide() { base.visible=ball.visible=halo.visible=false;age=-1; }
  hide();
  function aim(game) {
    const near=[...game.enemies].sort((a,b)=>Math.hypot(a.x-game.sx,a.z-4.2)-Math.hypot(b.x-game.sx,b.z-4.2));
    for(const lead of near) {
      const group=near.filter(e=>Math.hypot(e.x-lead.x,e.z-lead.z)<radius*.8).slice(0,8);
      if(group.length<3) continue;
      target.set(0,.16,0);
      for(const e of group) {target.x+=e.x;target.z+=e.z;}
      target.x/=group.length;target.z/=group.length;
      return true;
    }
    return false;
  }
  return {
    hide, aim,
    show(game) {
      base.position.set(Math.max(-7,Math.min(7,game.sx+(game.sx>0?-1.7:1.7))),0,2.1);
      base.rotation.y=Math.atan2(base.position.x-target.x,base.position.z-target.z);
      base.visible=true;mount.position.z=0;
    },
    fire() {
      age=0; muzzle.getWorldPosition(origin);ball.position.copy(origin);ball.visible=true;
    },
    tick(dt,game,onImpact) {
      if(age<0) return;
      const previous=age;age+=dt;
      const t=Math.min(1,age/travel);
      mount.position.z=.33*Math.max(0,1-age/.24);
      ball.position.lerpVectors(origin,target,t);ball.position.y+=4*4*t*(1-t);
      if(previous<travel && age>=travel) {
        ball.visible=false;halo.visible=true;halo.position.copy(target);
        const hits=game.enemies.map(e=>({e,d:Math.hypot(e.x-target.x,e.z-target.z)}))
          .filter(h=>h.d<=radius).sort((a,b)=>a.d-b.d).slice(0,12);
        const removed=new Set(hits.map(h=>h.e));
        game.enemies=game.enemies.filter(e=>!removed.has(e));
        onImpact(target,hits.length);
      }
      if(age>=travel) {
        const fade=Math.min(1,(age-travel)/.42);
        halo.scale.setScalar(.3+(radius-.3)*fade);
        haloMat.opacity=1-fade;
        if(fade===1) {halo.visible=false;age=-1;}
      }
    }
  };
}
