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
  const battery = new THREE.Group();
  battery.name = 'quiz-battery';
  scene.add(battery);
  const enamel = new THREE.MeshPhongMaterial({color:0x195478,shininess:80});
  const iron = new THREE.MeshPhongMaterial({color:0x283b4d,shininess:65});
  const brass = new THREE.MeshPhongMaterial({color:0xe1a955,shininess:95});
  const light = new THREE.MeshBasicMaterial({color:0xb4fff9});
  const bore = new THREE.MeshPhongMaterial({color:0x101b26});
  function part(parent, geometry, material, x=0,y=0,z=0) {
    const item=new THREE.Mesh(geometry,material);
    item.position.set(x,y,z);
    parent.add(item);
    return item;
  }
  function disc(parent,material,top,bottom,height,y,sides=32) {
    return part(parent,new THREE.CylinderGeometry(top,bottom,height,sides),material,0,y,0);
  }
  disc(battery,iron,1.58,1.75,.3,.16,8);
  disc(battery,brass,1.46,1.54,.13,.37,8);
  disc(battery,enamel,1.2,1.42,.43,.62);
  disc(battery,iron,1.16,1.16,.12,.88);
  for(let i=0;i<8;i++){
    const angle=(i+.5)*Math.PI/4;
    part(battery,new THREE.CylinderGeometry(.09,.11,.09,6),brass,1.49*Math.sin(angle),.34,1.49*Math.cos(angle));
  }
  const turret=new THREE.Group();
  battery.add(turret);
  for(const side of [-1,1]){
    const support=part(turret,new THREE.BoxGeometry(.34,1.12,1.35),enamel,side*.83,1.35,.15);
    support.rotation.x=-.16;
    part(turret,new THREE.CylinderGeometry(.37,.37,.12,20).rotateZ(Math.PI/2),brass,side*1.04,1.74,0);
    part(turret,new THREE.CylinderGeometry(.22,.22,.15,8).rotateZ(Math.PI/2),iron,side*1.09,1.74,0);
  }
  const cradle=new THREE.Group(), barrel=new THREE.Group();
  turret.add(cradle); cradle.add(barrel);
  cradle.position.y=1.74; cradle.rotation.x=.38;
  // A lathed silhouette gives the muzzle a recessed bore and a bevelled lip.
  const profile=[[.02,-1.02],[.47,-1.02],[.64,-.83],[.64,-.27],[.49,.04],[.42,1.42],
    [.54,1.54],[.54,1.88],[.49,1.95],[.34,1.95],[.31,1.83],[.31,1.52],[.01,1.50]];
  part(barrel,new THREE.LatheGeometry(profile.map(([r,h])=>new THREE.Vector2(r,h)),40).rotateX(-Math.PI/2),enamel);
  function band(radius,z,width,material){
    part(barrel,new THREE.CylinderGeometry(radius,radius,width,36).rotateX(Math.PI/2),material,0,0,z);
  }
  band(.655,.67,.12,brass);band(.57,-.0,.12,brass);band(.55,-1.67,.12,brass);
  band(.32,-1.84,.04,bore);
  for(const side of [-1,1]){
    part(barrel,new THREE.BoxGeometry(.11,.12,1.36),brass,side*.43,0,-.74);
    part(barrel,new THREE.BoxGeometry(.08,.075,.87),light,side*.494,0,-.73);
  }
  const sphere=new THREE.SphereGeometry(1,24,16);
  const charge=part(barrel,sphere,light,0,0,-1.97);
  const shell=part(scene,sphere,light);
  const auraMaterial=new THREE.MeshBasicMaterial({color:0x29cbef,transparent:true,opacity:.27,depthWrite:false});
  part(shell,sphere,auraMaterial).scale.setScalar(1.55);
  const trail=[];
  for(let i=0;i<8;i++) trail.push(part(scene,sphere,i<3?light:auraMaterial));
  const rings=[];
  for(const color of [0xffce62,0x66fff4]){
    const mat=new THREE.MeshBasicMaterial({color,transparent:true,depthWrite:false,side:THREE.DoubleSide});
    rings.push(part(scene,new THREE.RingGeometry(.89,1,72).rotateX(-Math.PI/2),mat));
  }
  const bloom=part(scene,sphere,new THREE.MeshBasicMaterial({color:0xffdf86,transparent:true,opacity:.5,depthWrite:false}));
  const sparks=new THREE.Group();
  scene.add(sparks);
  const shard=new THREE.OctahedronGeometry(1);
  const amber=new THREE.MeshBasicMaterial({color:0xffbd42});
  for(let i=0;i<22;i++){
    const star=part(sparks,shard,i%3===0?light:amber);
    const angle=i*2.4;
    const height=.25+(i%5)*.14;
    star.userData.direction=new THREE.Vector3(Math.cos(angle),height,Math.sin(angle)).normalize();
    star.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),star.userData.direction);
  }
  const home=camera.position.clone(), rotation=camera.quaternion.clone(), shotCamera=camera.clone();
  const eye=new THREE.Vector3(), focus=new THREE.Vector3();
  const clamp=THREE.MathUtils.clamp, smooth=THREE.MathUtils.smoothstep;
  const launch=.85, impact=1.75, finish=3.25;
  let shot=null;
  function hide(){
    if(shot){camera.position.copy(home);camera.quaternion.copy(rotation);}
    for(const obj of [battery,shell,bloom,sparks,...rings,...trail]) obj.visible=false;
    shot=null;
  }
  hide();
  function start(game,reducedMotion){
    const soldiers=game.enemies;
    const center=new THREE.Vector3(0,.55,0);
    for(const enemy of soldiers){center.x+=enemy.x;center.z+=enemy.z;}
    center.x/=Math.max(1,soldiers.length);center.z/=Math.max(1,soldiers.length);
    const distance=e=>Math.hypot(e.x-center.x,e.z-center.z);
    const targets=[...soldiers].sort((a,b)=>distance(a)-distance(b)).slice(0,Math.round(soldiers.length/2));
    // Anchor beside the player's formation for the entire shot.
    battery.position.set(game.sx+(game.sx>0?-1.85:1.85),0,1.1);
    turret.rotation.y=Math.atan2(battery.position.x-center.x,battery.position.z-center.z);
    battery.visible=true;charge.visible=true;charge.scale.setScalar(.08);barrel.position.z=0;
    const origin=charge.getWorldPosition(new THREE.Vector3());
    shot={age:0,origin,center,targets:new Set(targets),radius:Math.max(3,distance(targets.at(-1)??center)+1),
      reducedMotion, fired:false, hit:false};
  }
  function flight(position,t){
    position.lerpVectors(shot.origin,shot.center,t);
    position.y+=13*t*(1-t);
  }
  function tick(dt,game,onLaunch,onImpact){
    shot.age+=dt;
    const {age,center,origin,reducedMotion}=shot;
    const t=clamp((age-launch)/(impact-launch),0,1);
    charge.visible=age<launch+.12;
    charge.scale.setScalar(age<launch ? .1+.34*smooth(age,0,launch):.86*(1-smooth(age,launch,launch+.12)));
    if(age>=launch && !shot.fired){shot.fired=true;onLaunch(origin);}
    barrel.position.z=shot.fired ? .3*(1-smooth(age,launch,launch+.24)):0;
    shell.visible=age>=launch && age<impact;shell.scale.setScalar(.34);
    flight(shell.position,t);
    trail.forEach((p,i)=>{
      const delayed=(age-launch)/(impact-launch)-(i+1)*.016;
      p.visible=delayed>0 && delayed<1 && age<impact+.12;
      if(p.visible){flight(p.position,delayed);p.scale.setScalar(.26*(1-i/9));}
    });
    if(age>=impact && !shot.hit){
      shot.hit=true;
      const removed=game.enemies.filter(e=>shot.targets.has(e));
      game.enemies=game.enemies.filter(e=>!shot.targets.has(e));
      onImpact(center,removed);
    }
    if(shot.hit){
      rings.forEach((ring,i)=>{
        const phase=clamp((age-impact-i*.1)/.76,0,1);
        ring.visible=phase>0 && phase<1;
        ring.position.set(center.x,.19+i*.04,center.z);
        ring.scale.setScalar(.4+shot.radius*(1-(1-phase)**2));
        ring.material.opacity=.88*(1-phase);
      });
      const spread=clamp((age-impact)/.72,0,1);
      sparks.visible=!reducedMotion && spread<1;
      if(sparks.visible){
        sparks.position.copy(center);
        sparks.children.forEach((star,i)=>{
          const reach=(1-(1-spread)**2)*shot.radius*(.58+(i%4)*.12);
          star.position.copy(star.userData.direction).multiplyScalar(reach);
          const size=(1-spread)*(.10+(i%3)*.045);
          star.scale.set(size,size*(3+(i%4)),size);
        });
      }
      const fade=clamp((age-impact)/.4,0,1);
      bloom.visible=fade<1;bloom.position.copy(center);
      bloom.scale.set(1+2.7*fade,.65+2.4*fade,1+2.7*fade);
      bloom.material.opacity=(reducedMotion ? .22 : .64)*(1-fade);
    }
    if(!reducedMotion){
      const follow=smooth(age,launch,impact-.05);
      const side=battery.position.x>0?-1:1;
      const offset=side*4.5;
      eye.set(battery.position.x+offset,4.8,battery.position.z+4.3);
      eye.x+=(center.x+offset*.6-eye.x)*follow;
      eye.y+=(9.6-eye.y)*follow;
      eye.z+=(center.z+10.1-eye.z)*follow;
      focus.copy(battery.position);focus.y=1.65;
      focus.lerp(center,follow);focus.y+=1.4*Math.sin(Math.PI*follow);
      if(shot.hit) eye.y+=.19*Math.sin((age-impact)*56)*(1-smooth(age,impact,impact+.32));
      const blend=smooth(age,0,.28)*(1-smooth(age,2.75,finish));
      shotCamera.position.copy(eye);shotCamera.lookAt(focus);
      camera.position.copy(home).lerp(eye,blend);
      camera.quaternion.copy(rotation).slerp(shotCamera.quaternion,blend);
    }
    return age>=finish;
  }
  return {hide,start,tick};
}
