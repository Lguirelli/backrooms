import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';

const canvas = document.getElementById('scene');
const statusEl = document.getElementById('sceneStatus');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!canvas) {
  throw new Error('Canvas #scene não encontrado.');
}

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.5 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();

let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 8);

const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 2.4);
directionalLight.position.set(5, 8, 6);
scene.add(directionalLight);

let mixer = null;
let animationDuration = 1;
let targetTime = 0;
let currentTime = 0;
let modelLoaded = false;

const loader = new GLTFLoader();
loader.load(
  './assets/backrooms.glb',
  (gltf) => {
    scene.add(gltf.scene);

    const exportedCamera = gltf.cameras?.[0] || gltf.scene.getObjectByProperty('type', 'PerspectiveCamera');
    if (exportedCamera) {
      camera = exportedCamera;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    }

    if (gltf.animations && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(gltf.scene);
      const clip = gltf.animations[0];
      const action = mixer.clipAction(clip);
      action.play();
      action.paused = true;
      animationDuration = clip.duration;
      mixer.setTime(0);
    }

    modelLoaded = true;
    if (statusEl) {
      statusEl.textContent = 'percurso carregado / role para mover a câmera';
      window.setTimeout(() => statusEl.classList.add('is-hidden'), 1600);
    }
  },
  (progressEvent) => {
    if (!statusEl || !progressEvent.total) return;
    const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
    statusEl.textContent = `carregando percurso do Oregon 811... ${progress}%`;
  },
  (error) => {
    console.error(error);
    if (statusEl) {
      statusEl.textContent = 'não foi possível carregar o fundo 3D';
    }
  }
);

function getScrollProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return 0;
  return Math.min(window.scrollY / maxScroll, 1);
}

function updateScrollAnimation() {
  if (!mixer || reducedMotion) return;
  targetTime = getScrollProgress() * animationDuration;
  currentTime = THREE.MathUtils.lerp(currentTime, targetTime, 0.08);
  mixer.setTime(currentTime);
}

function animate() {
  requestAnimationFrame(animate);
  if (modelLoaded) updateScrollAnimation();
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (camera) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
});
