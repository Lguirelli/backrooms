import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';

const canvas = document.getElementById('scene');
const statusEl = document.getElementById('sceneStatus');

const renderer = new THREE.WebGLRenderer({
  canvas, antialias: true, alpha: false, powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.35 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
renderer.setClearColor(0x050505, 1);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);
scene.fog = new THREE.FogExp2(0x080704, 0.012);

let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 3000);
camera.position.set(168.57467651367188, 4.034862995147705, 0.791530966758728);

const ambient = new THREE.HemisphereLight(0xfff2c7, 0x171109, 1.28);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffe8b0, 1.35);
keyLight.position.set(120, 80, 50);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xb8ae68, 0.58);
fillLight.position.set(-80, 35, -40);
scene.add(fillLight);

let mixer = null;
let actions = [];
let animationDuration = 1;
let hasCameraAnimation = false;
let modelLoaded = false;

const textureLoader = new THREE.TextureLoader();
const materialTextures = {
  carpet: textureLoader.load('./assets/carpet.jpg'),
  wallDot: textureLoader.load('./assets/wall.png'),
  wallChevron: textureLoader.load('./assets/wall2.png'),
  metallicGrid: new THREE.TextureLoader().load('./assets/wall2.png') // grid metálico
};
materialTextures.metallicGrid.wrapS = materialTextures.metallicGrid.wrapT = THREE.RepeatWrapping;
materialTextures.metallicGrid.repeat.set(4,4);

function setStatus(text, hideDelay = 1800){
  if(!statusEl) return;
  statusEl.classList.remove('is-hidden');
  statusEl.textContent = text;
  window.setTimeout(()=>statusEl.classList.add('is-hidden'), hideDelay);
}

function getScrollProgress(){
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if(maxScroll<=0) return 0;
  return Math.min(Math.max(window.scrollY/maxScroll,0),1);
}

function applyMaterials(root){
  root.traverse((o)=>{
    if(!o.isMesh) return;
    o.frustumCulled = false;
    const mats = Array.isArray(o.material)?o.material:[o.material];
    mats.filter(Boolean).forEach(m=>{
      m.side = THREE.DoubleSide;
      const name = (m.name||o.name||'').toLowerCase();

      if(name.includes('chao')||name.includes('floor')||name.includes('carpet')||name.includes('piso')){
        m.map = materialTextures.carpet; m.color.set(0xffffff); m.roughness=0.92; m.metalness=0;
      }

      if(name.includes('wall.001')||name.includes('wall')||name.includes('parede')){
        m.map = materialTextures.wallChevron; m.color.set(0xffffff); m.roughness=0.9; m.metalness=0;
      }

      if(name.includes('grid')||name.includes('wall_dot')||name.includes('wall-dot')){
        m.map = materialTextures.metallicGrid; m.color.set(0xffffff); m.roughness=0.22; m.metalness=0.92;
      }

      if(name.includes('luz')||name.includes('light')||name.includes('lamp')){
        m.map = null; m.color.set(0xfff4c4); m.emissive = new THREE.Color(0xfff1b8); m.emissiveIntensity=1.65; m.roughness=0.35; m.metalness=0;
      }

      if(name.includes('teto')||name.includes('ceiling')){
        m.map = null; m.color.set(0xCFCF9F); m.roughness=0.86; m.metalness=0;
      }
      m.needsUpdate = true;
    });
  });
}

function bindScrollAnimation(gltf,cameraExported){
  if(!gltf.animations||!gltf.animations.length) return;
  const cameraName = cameraExported?.name||'Camera';
  mixer = new THREE.AnimationMixer(gltf.scene);
  actions = [];
  gltf.animations.forEach((clip)=>{
    const action = mixer.clipAction(clip);
    action.reset(); action.setLoop(THREE.LoopOnce,1); action.clampWhenFinished=true; action.enabled=true; action.paused=false; action.play();
    actions.push(action);
    if(clip.tracks.some(track=>track.name.includes(cameraName)||track.name.includes('Camera'))){
      hasCameraAnimation=true;
    }
    animationDuration = Math.max(animationDuration,clip.duration||1);
  });
  setAnimationTimeFromScroll();
}

function setAnimationTimeFromScroll(){
  const progress = getScrollProgress();
  const time = progress*animationDuration;
  if(mixer && actions.length){
    actions.forEach(a=>{a.enabled=true;a.paused=false;a.time=time;});
    mixer.setTime(time); mixer.update(0); scene.updateMatrixWorld(true);
    if(camera){camera.updateMatrixWorld(true); camera.updateProjectionMatrix();}
    return;
  }
  // fallback
  const x = THREE.MathUtils.lerp(168.57467651367188,39.52294921875,progress);
  const z = THREE.MathUtils.lerp(0.791530966758728,-3.4,progress);
  camera.position.set(x,4.034862995147705,z);
  camera.rotation.set(1.58,0.0015,THREE.MathUtils.lerp(2.758552312850952,1.57088041305542,progress),'XYZ');
}

const loader = new GLTFLoader();
const timeout = window.setTimeout(()=>{if(!modelLoaded){setStatus('carregamento lento do modelo 3D',2600);}},8000);

loader.load(
  './assets/backrooms.gltf',
  (gltf)=>{
    window.clearTimeout(timeout); modelLoaded=true;
    applyMaterials(gltf.scene);
    scene.add(gltf.scene);
    const cam = gltf.cameras?.[0];
    if(cam && cam.isCamera){
      camera=cam; camera.aspect=window.innerWidth/window.innerHeight;
      camera.near=Math.max(0.01,camera.near||0.05); camera.far=Math.max(3000,camera.far||1000);
      camera.updateProjectionMatrix();
    }
    bindScrollAnimation(gltf,cam);
    setAnimationTimeFromScroll();
    setStatus(hasCameraAnimation?'câmera do modelo conectada ao scroll':'modelo carregado / fallback de câmera ativo');
  },
  (event)=>{
    if(!statusEl) return;
    if(event.total){
      const progress = Math.round((event.loaded/event.total)*100);
      statusEl.textContent=`carregando Unidade 811... ${progress}%`;
    }else{statusEl.textContent='carregando Unidade 811...';}
  },
  (error)=>{
    window.clearTimeout(timeout); console.error('Falha ao carregar GLTF:',error);
    setStatus('modelo 3D não carregou: verifique assets/backrooms.gltf',4000);
  }
);

window.addEventListener('scroll',setAnimationTimeFromScroll,{passive:true});

function animate(){
  requestAnimationFrame(animate);
  setAnimationTimeFromScroll();
  renderer.render(scene,camera);
}

animate();

window.addEventListener('resize',()=>{
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, window.innerWidth<768?1.35:2));
  renderer.setSize(window.innerWidth,window.innerHeight);
  if(camera && camera.isPerspectiveCamera){camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();}
  setAnimationTimeFromScroll();
});
