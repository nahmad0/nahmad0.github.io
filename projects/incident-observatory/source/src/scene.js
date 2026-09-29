import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { loadSettings } from './visual-settings.js';
import { visibleInView } from './model.js';

const COLORS={teal:0x66ddcc,amber:0xffb85e,red:0xff6173,blue:0x76b8ff,dim:0x264359};
export class Infrastructure {
  constructor(container,labels,data,onSelect) {
    this.container=container;this.labels=labels;this.data=data;this.onSelect=onSelect;
    this.settings=loadSettings();this.details=[];this.boundaries=[];
    this.nodes=new Map();this.links=new Map();this.view='infrastructure';this.time=0;this.motion=!matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.4;
    container.appendChild(this.renderer.domElement);
    this.scene=new THREE.Scene();this.scene.fog=new THREE.FogExp2(0x0a121c,.013);
    this.camera=new THREE.PerspectiveCamera(42,1,.1,160);
    this.camera.position.set(26,29,36);
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);
    this.controls.target.set(1,0,2);this.controls.enableDamping=true;this.controls.dampingFactor=.08;
    this.controls.minDistance=9;this.controls.maxDistance=65;this.controls.maxPolarAngle=Math.PI*.46;
    this.controls.addEventListener('start',()=>{this.transition=false;});
    this.goalTarget=this.controls.target.clone();this.goalCamera=this.camera.position.clone();
    this.ambient=new THREE.HemisphereLight(0xdce8f4,0x09101b,1.5);this.scene.add(this.ambient);
    const key=new THREE.DirectionalLight(0xa8d5ff,4);key.position.set(0,22,10);key.castShadow=true;
    key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-26,right:26,top:20,bottom:-20,near:1,far:60});key.shadow.bias=-.001;this.scene.add(key);
    this.key=key;
    const fill=new THREE.DirectionalLight(0x76bea9,1.1);fill.position.set(-14,6,-12);this.scene.add(fill);this.fill=fill;
    const blue=new THREE.PointLight(0x4377bf,90,35,2);blue.position.set(13,7,3);this.scene.add(blue);
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(90,70),new THREE.MeshStandardMaterial({color:0x18222b,roughness:.38,metalness:.45}));
    ground.rotation.x=-Math.PI/2;ground.position.y=-.3;ground.receiveShadow=true;this.scene.add(ground);
    const grid=new THREE.GridHelper(70,70,0x29445a,0x142c3f);grid.position.y=-.28;grid.material.transparent=true;grid.material.opacity=.35;this.scene.add(grid);
    this.environment=new THREE.Group();this.scene.add(this.environment);
    for(const zone of data.environment?.zones??[])this.zone(zone.x,zone.z,zone.width,zone.depth,zone.color);
    this.roomDetails();
    data.systems.forEach(s=>this.makeNode(s));
    data.connections.forEach(c=>this.makeConnection(c));
    this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();
    this.renderer.domElement.addEventListener('pointerdown',e=>{this.pointerStart=[e.clientX,e.clientY];});
    this.renderer.domElement.addEventListener('pointerup',e=>{
      if(!this.pointerStart||Math.hypot(e.clientX-this.pointerStart[0],e.clientY-this.pointerStart[1])>5)return;
      const rect=this.renderer.domElement.getBoundingClientRect();this.pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
      this.raycaster.setFromCamera(this.pointer,this.camera);
      const hit=this.raycaster.intersectObjects([...this.nodes.values()].map(n=>n.group),true).find(h=>{let o=h.object;while(o&&!o.userData.asset)o=o.parent;return o?.visible&&o.userData.asset;});
      if(hit){let o=hit.object;while(o&&!o.userData.asset)o=o.parent;onSelect(o.userData.asset);}
    });
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.resize();this.applySettings(this.settings);
  }
  box(w,h,d,color,x=0,y=0,z=0,material={}) {
    const geometry=Math.min(w,h,d)>.1?new RoundedBoxGeometry(w,h,d,1,Math.min(.045,Math.min(w,h,d)*.12)):new THREE.BoxGeometry(w,h,d);
    const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,roughness:.4,metalness:.65,...material}));
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
  }
  zone(x,z,w,d,color) {
    const plinth=this.box(w,.24,d,0x122737,x,-.08,z);this.environment.add(plinth);
    const edges=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w,.25,d)),new THREE.LineBasicMaterial({color,transparent:true,opacity:.22}));edges.position.set(x,.06,z);this.environment.add(edges);
    const fence=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w,3.3,d)),new THREE.LineBasicMaterial({color,transparent:true,opacity:.12}));fence.position.set(x,1.65,z);this.environment.add(fence);this.boundaries.push(fence);
    for(const side of [-1,1]){const wall=this.box(.018,3.3,d,color,x+side*w/2,1.65,z,{transparent:true,opacity:.025,depthWrite:false});this.environment.add(wall);}
  }
  makeNode(s) {
    const group=new THREE.Group();group.position.fromArray(s.position);group.userData.asset=s.id;
    const statusMaterial=new THREE.MeshBasicMaterial({color:COLORS.teal});
    const plinth=this.box(2.35,.14,2.25,0x183242,0,.18,0);group.add(plinth);
    const rack=(x,z,height=2.25)=>{
      const body=this.box(1.0,height,.8,0x20272e,x,height/2+.3,z);group.add(body);
      const top=this.box(1.04,.07,.84,0x3f5464,x,height+.32,z);group.add(top);
      const panel=this.box(.86,height-.14,.04,0x0b151e,x,height/2+.3,z+.42);group.add(panel);
      for(let i=0;i<Math.floor(height/.27);i++) {
        const yy=.47+i*.27;
        group.add(this.box(.73,.16,.06,0x354754,x,yy,z+.45));
        const led=new THREE.Mesh(new THREE.BoxGeometry(.065,.04,.025),statusMaterial);led.position.set(x+.24,yy,z+.49);group.add(led);
        group.add(this.box(.3,.025,.025,0x0a1923,x-.12,yy,z+.49));
      }
      const detail=new THREE.Group();group.add(detail);this.details.push(detail);
      for(const side of [-1,1]){
        detail.add(this.box(.045,height,.08,0x78818a,x+side*.45,height/2+.3,z+.46));
        detail.add(this.box(.11,.12,.68,0x090e13,x+side*.36,.25,z));
        for(let i=0;i<Math.floor(height/.27);i++){
          const screw=new THREE.Mesh(new THREE.SphereGeometry(.022,5,4),new THREE.MeshStandardMaterial({color:0x9ca4a9,metalness:.9,roughness:.25}));screw.position.set(x+side*.42,.47+i*.27,z+.515);detail.add(screw);
        }
      }
      for(let i=0;i<Math.floor(height/.27);i++)for(let j=0;j<4;j++)detail.add(this.box(.12,.016,.01,0x080d12,x-.24+j*.1,.44+i*.27,z+.49));
      const door=new THREE.Mesh(new THREE.PlaneGeometry(.79,height-.13),new THREE.MeshPhysicalMaterial({color:0x9eb8c9,transparent:true,opacity:.11,roughness:.14,metalness:.05,depthWrite:false}));door.position.set(x,height/2+.3,z+.535);detail.add(door);
      detail.add(this.box(.035,.3,.065,0xa3aeb4,x+.32,height*.52,z+.58));
      // Rear cooling fans and a cable bundle are schematic hardware, not incident evidence.
      for(let i=0;i<2;i++){
        const fan=new THREE.Mesh(new THREE.TorusGeometry(.17,.025,6,18),new THREE.MeshStandardMaterial({color:0x596876,metalness:.8,roughness:.4}));fan.position.set(x,height*.5+i*.45,z-.415);detail.add(fan);
      }
      const cableCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(x+.35,height*.7,z-.46),new THREE.Vector3(x+.6,.55,z-.7),new THREE.Vector3(x+.7,.34,z-.9)]);
      detail.add(new THREE.Mesh(new THREE.TubeGeometry(cableCurve,10,.03,5,false),new THREE.MeshStandardMaterial({color:0x255876,roughness:.9})));
    };
    if(s.type==='cluster'){rack(-.65,-.25,2.5);rack(.65,.25,2.15);}
    else if(s.type==='gateway') {
      group.add(this.box(.22,2.5,.5,0x486477,-.77,1.55,0));group.add(this.box(.22,2.5,.5,0x486477,.77,1.55,0));group.add(this.box(1.75,.25,.5,0x617583,0,2.8,0));
      const sheet=this.box(1.3,2.15,.08,COLORS.teal,0,1.6,0,{transparent:true,opacity:.14,depthWrite:false});group.add(sheet);
      for(let i=0;i<5;i++){const bar=new THREE.Mesh(new THREE.BoxGeometry(1.25,.025,.07),statusMaterial);bar.position.set(0,.7+i*.42,.1);group.add(bar);}
    } else if(s.type==='identity') {
      const vault=this.box(1.55,1.8,1.2,0x435163,0,1.25,0);group.add(vault);
      group.add(this.box(1.35,1.6,.08,0x203144,0,1.25,.66));
      const lock=new THREE.Mesh(new THREE.TorusGeometry(.25,.045,8,24),statusMaterial);lock.position.set(0,1.4,.75);group.add(lock);
    } else if(s.type==='soc') {
      group.add(this.box(2.1,.2,1.1,0x43566c,0,.7,0));
      for(let i=-1;i<=1;i++){group.add(this.box(.6,.7,.09,0x426278,i*.68,1.25,-.25));const screen=new THREE.Mesh(new THREE.PlaneGeometry(.5,.56),new THREE.MeshBasicMaterial({color:0x224458}));screen.position.set(i*.68,1.25,-.19);group.add(screen);}
    } else if(s.type==='sandbox') {
      rack(0,0,1.55);
      const shell=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.2,2.5,2.2)),new THREE.LineBasicMaterial({color:COLORS.teal,transparent:true,opacity:.25}));shell.position.y=1.5;group.add(shell);
    } else rack(0,0,2.55);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(1.4,.025,8,64),new THREE.MeshBasicMaterial({color:COLORS.teal,transparent:true,opacity:.85}));ring.rotation.x=-Math.PI/2;ring.position.y=.3;ring.visible=false;group.add(ring);
    const label=document.createElement('div');label.className='asset-label';label.textContent=s.label;this.labels.appendChild(label);
    this.scene.add(group);this.nodes.set(s.id,{group,statusMaterial,ring,label,system:s});
  }
  roomDetails(){
    const room=new THREE.Group();this.environment.add(room);this.details.push(room);
    // Raised-floor joints, cable trays, supports and overhead light strips establish scale.
    for(const x of this.data.environment?.railPositions??[]){
      room.add(this.box(.12,.15,12,0x39434b,x,.34,1));
      for(const z of [-5,7])room.add(this.box(.11,4,.11,0x404a53,x,2.2,z));
      room.add(this.box(.2,.16,12,0x303b46,x,4.25,1));
      const strip=new THREE.Mesh(new THREE.BoxGeometry(.1,.03,10.8),new THREE.MeshStandardMaterial({color:0xdcebf3,emissive:0x8faabd,emissiveIntensity:1.2}));strip.position.set(x,4.15,1);room.add(strip);
    }
    const floor=this.data.environment?.floor;
    if(floor)for(let x=floor.minX;x<floor.maxX;x+=floor.step)for(let z=floor.minZ;z<floor.maxZ;z+=floor.step){const tile=this.box(floor.step*.97,.04,floor.step*.97,0x222d37,x,-.23,z,{roughness:.6,metalness:.2});room.add(tile);}
    // Ground labels identify conceptual security domains, not real building locations.
    for(const {text,x,z,color} of this.data.environment?.labels??[]){
      const canvas=document.createElement('canvas');canvas.width=768;canvas.height=96;const ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.font='500 36px sans-serif';ctx.textAlign='center';ctx.fillText(text,384,62);
      const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
      const tag=new THREE.Mesh(new THREE.PlaneGeometry(5.8,.72),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));tag.rotation.x=-Math.PI/2;tag.position.set(x,.08,z);this.environment.add(tag);
    }
  }
  applySettings(settings){
    this.settings={...settings};this.renderer.toneMappingExposure=settings.exposure;
    this.ambient.intensity=settings.ambient;this.key.intensity=settings.key;this.fill.intensity=settings.fill;
    this.scene.fog.density=settings.fog;this.camera.fov=settings.fov;this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,settings.quality));
    if(this.renderer.shadowMap.enabled!==settings.shadows){this.renderer.shadowMap.enabled=settings.shadows;this.scene.traverse(o=>{if(o.material)o.material.needsUpdate=true;});}
    this.details.forEach(g=>g.visible=settings.details);this.boundaries.forEach(g=>g.material.opacity=settings.boundaryOpacity);
  }
  makeConnection(c) {
    const a=this.nodes.get(c.from).group.position,b=this.nodes.get(c.to).group.position;
    const start=new THREE.Vector3(a.x,1.2,a.z),end=new THREE.Vector3(b.x,1.2,b.z),lift=Math.min(4,1.4+start.distanceTo(end)*.12);
    const curve=new THREE.CatmullRomCurve3([start,new THREE.Vector3(a.x, lift,a.z),new THREE.Vector3((a.x+b.x)/2,lift+.3,(a.z+b.z)/2),new THREE.Vector3(b.x,lift,b.z),end]);
    const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,48,.035,5,false),new THREE.MeshBasicMaterial({color:COLORS.dim,transparent:true,opacity:.35}));this.scene.add(mesh);
    const packets=[];for(let i=0;i<3;i++){const packet=new THREE.Mesh(new THREE.SphereGeometry(.075,8,6),new THREE.MeshBasicMaterial({color:COLORS.amber}));this.scene.add(packet);packets.push(packet);}
    this.links.set(c.id,{mesh,curve,packets,connection:c});
  }
  resize(){const {clientWidth:w,clientHeight:h}=this.container;if(!w||!h)return;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
  overview(){const preset=this.data.views?.find(v=>v.id===this.view&&v.kind==='scene')??this.data.views?.find(v=>v.kind==='scene');this.goalTarget.fromArray(preset?.target??[0,0,0]);const scale=this.camera.aspect<1?1.4:1;this.goalCamera.fromArray(preset?.camera??[22,25,32]);this.goalCamera.sub(this.goalTarget).multiplyScalar(scale).add(this.goalTarget);this.transition=true;}
  focus(id){const n=this.nodes.get(id);if(!n)return;const p=n.group.position;this.goalTarget.copy(p).add(new THREE.Vector3(0,.7,0));this.goalCamera.copy(p).add(new THREE.Vector3(13,15,19));this.transition=true;this.selected=id;this.updateStyle();}
  setView(view) {
    this.view=view;this.overview();
    this.updateStyle();
  }
  setState(state,follow){this.state=state;this.selected=state.event.focus;if(follow&&this.view==='infrastructure')this.focus(this.selected);this.updateStyle();}
  isVisible(id){return visibleInView(this.data,this.view,id);}
  updateStyle(){
    if(!this.state)return;
    const state=this.state,responding=['BLOCKED','TERMINATED','DETECTED'].includes(state.event.status);
    for(const [id,n] of this.nodes){const bad=state.affected.has(id),selected=id===this.selected;
      n.group.visible=this.isVisible(id);n.ring.visible=selected;
      const actorState=state.agentStates?.find(a=>a.actorId===id);
      const actorRisk=actorState&&!['NORMAL','BLOCKED','TERMINATED'].includes(actorState.status);
      n.statusMaterial.color.setHex(bad?COLORS.red:actorRisk?COLORS.amber:responding?COLORS.blue:COLORS.teal);
      n.label.className=`asset-label${selected?' selected':''}${bad?' compromised':''}`;
    }
    for(const [id,l] of this.links){const active=state.paths.has(id),visible=this.isVisible(l.connection.from)&&this.isVisible(l.connection.to);
      const historical=state.logs.some(e=>e.paths.includes(id));
      l.mesh.visible=visible&&(!this.data.views?.find(v=>v.id===this.view)?.historicalPathsOnly||historical);
      l.mesh.material.color.setHex(active?(responding?COLORS.blue:state.index===0?COLORS.teal:COLORS.amber):COLORS.dim);
      l.mesh.material.opacity=active?.85:.23;
      l.packets.forEach(p=>{p.visible=active&&visible;p.material.color.copy(l.mesh.material.color);});
    }
  }
  render(dt,playing){
    if(this.transition){const k=this.motion?1-Math.exp(-dt*3):1;this.camera.position.lerp(this.goalCamera,k);this.controls.target.lerp(this.goalTarget,k);if(this.camera.position.distanceTo(this.goalCamera)<.02)this.transition=false;}
    this.controls.update();if(playing&&this.motion)this.time+=dt;
    for(const l of this.links.values())l.packets.forEach((p,i)=>{if(p.visible)p.position.copy(l.curve.getPointAt((this.time*this.settings.packetSpeed+i/3)%1));});
    const occupied=[];
    const ranked=[...this.nodes.values()].sort((a,b)=>Number(b.system.id===this.selected)-Number(a.system.id===this.selected));
    for(const n of ranked){
      n.ring.material.opacity=this.motion&&playing?.65+Math.sin(this.time*2)*.2:.8;
      const v=n.group.position.clone().add(new THREE.Vector3(0,.1,1.7)).project(this.camera);
      const x=(v.x*.5+.5)*this.container.clientWidth,y=(-v.y*.5+.5)*this.container.clientHeight;
      const allowed=this.settings.labels&&n.group.visible&&v.z<1&&v.z>-1&&x>18&&x<this.container.clientWidth-18&&y>115&&y<this.container.clientHeight-70;
      n.label.style.display=allowed?'block':'none';n.label.style.left=`${x}px`;n.label.style.top=`${y}px`;
      if(allowed){const w=n.label.offsetWidth,h=n.label.offsetHeight,rect={left:x-w/2,right:x+w/2,top:y,bottom:y+h};
        const overlaps=occupied.some(r=>rect.left<r.right+5&&rect.right>r.left-5&&rect.top<r.bottom+4&&rect.bottom>r.top-4);
        if(overlaps||rect.left<4||rect.right>this.container.clientWidth-4)n.label.style.display='none';else occupied.push(rect);
      }
    }
    this.renderer.render(this.scene,this.camera);
  }
  dispose(){this.resizeObserver.disconnect();this.controls.dispose();this.scene.traverse(o=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});this.renderer.dispose();}
}
