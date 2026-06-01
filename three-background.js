import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';

const canvas = document.getElementById('scene');
const statusEl = document.getElementById('sceneStatus');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance'
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.35 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.72;
renderer.setClearColor(0x030302, 1);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030302);

let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(168.57467651367188, 4.034862995147705, 0.791530966758728);

const ambient = new THREE.AmbientLight(0xffedb8, 0.88);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffe8a5, 1.25);
keyLight.position.set(120, 80, 50);
scene.add(keyLight);

const cinematicRig = new THREE.Group();
scene.add(cinematicRig);

let mixer = null;
let action = null;
let animationDuration = 1;
let currentTime = 0;
let targetTime = 0;
let modelLoaded = false;
let hasNativeCameraMotion = false;
let scrollRAF = null;

function getScrollProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return 0;
  return Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
}

function addCinematicOverlayLights() {
  cinematicRig.clear();

  const stripMaterial = new THREE.MeshBasicMaterial({ color: 0xfff0b5 });
  const positions = [
    [152, 21, 0],
    [118, 21, 0],
    [84, 21, 0],
    [50, 21, 0],
    [24, 21, 0]
  ];

  positions.forEach(([x, y, z]) => {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(9, 0.16, 1.1), stripMaterial);
    strip.position.set(x, y, z);
    cinematicRig.add(strip);

    const light = new THREE.PointLight(0xffe9aa, 0.7, 70);
    light.position.set(x, y - 3, z);
    cinematicRig.add(light);
  });
}

function updateCameraByScroll() {
  const progress = reducedMotion ? 0 : getScrollProgress();

  if (mixer && action && hasNativeCameraMotion) {
    targetTime = progress * animationDuration;
    currentTime = THREE.MathUtils.lerp(currentTime, targetTime, 0.09);
    mixer.setTime(currentTime);
    return;
  }

  // Fallback só é usado se o GLB não tiver animação de câmera.
  const x = THREE.MathUtils.lerp(168.57467651367188, 39.52294921875, progress);
  const angle = THREE.MathUtils.lerp(2.758552312850952, 1.57088041305542, progress);
  camera.position.set(x, 4.034862995147705, 0.791530966758728);
  camera.rotation.set(1.58, 0.0015, angle, 'XYZ');
}

function setStatus(text, hideDelay = 1800) {
  if (!statusEl) return;
  statusEl.classList.remove('is-hidden');
  statusEl.textContent = text;
  window.setTimeout(() => statusEl.classList.add('is-hidden'), hideDelay);
}

const loader = new GLTFLoader();

const loadTimeout = window.setTimeout(() => {
  if (!modelLoaded) setStatus('carregamento lento do GLB', 2400);
}, 8000);

loader.load(
  './assets/backrooms.glb',
  (gltf) => {
    window.clearTimeout(loadTimeout);
    modelLoaded = true;

    // Importante: não centralizar, não escalar e não rotacionar o GLB.
    // A câmera exportada depende das coordenadas originais do Blender/GLB.
    const model = gltf.scene;
    scene.add(model);

    model.traverse((object) => {
      if (!object.isMesh) return;
      object.frustumCulled = false;

      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.filter(Boolean).forEach((material) => {
        material.side = THREE.DoubleSide;
        if ('roughness' in material) material.roughness = Math.min(1, material.roughness + 0.14);
        if ('metalness' in material) material.metalness = Math.max(0, material.metalness * 0.35);
        material.needsUpdate = true;
      });
    });

    const exportedCamera = gltf.cameras?.[0];
    if (exportedCamera && exportedCamera.isCamera) {
      camera = exportedCamera;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.near = Math.max(0.05, camera.near || 0.1);
      camera.far = Math.max(1200, camera.far || 1000);
      camera.updateProjectionMatrix();
    }

    if (gltf.animations && gltf.animations.length > 0) {
      const cameraName = exportedCamera?.name || 'Camera';
      const clip = gltf.animations.find((candidate) => {
        return candidate.tracks.some((track) => track.name.includes(cameraName) || track.name.includes('Camera'));
      }) || gltf.animations[0];

      mixer = new THREE.AnimationMixer(model);
      action = mixer.clipAction(clip);
      action.reset();
      action.play();
      action.paused = false;
      action.enabled = true;

      animationDuration = clip.duration || 1;
      hasNativeCameraMotion = clip.tracks.some((track) => track.name.includes(cameraName) || track.name.includes('Camera'));
      mixer.setTime(0);
    }

    addCinematicOverlayLights();
    updateCameraByScroll();

    setStatus(hasNativeCameraMotion ? 'movimento de câmera conectado ao scroll' : 'GLB carregado / fallback de câmera ativo');
  },
  (event) => {
    if (!statusEl) return;
    if (event.total) {
      const progress = Math.round((event.loaded / event.total) * 100);
      statusEl.textContent = `carregando Unidade 811... ${progress}%`;
    } else {
      statusEl.textContent = 'carregando Unidade 811...';
    }
  },
  (error) => {
    window.clearTimeout(loadTimeout);
    console.error('Falha ao carregar GLB:', error);
    setStatus('GLB não carregou: verifique assets/backrooms.glb', 4000);
  }
);

window.addEventListener('scroll', () => {
  if (scrollRAF) return;
  scrollRAF = window.requestAnimationFrame(() => {
    updateCameraByScroll();
    scrollRAF = null;
  });
}, { passive: true });

function animate() {
  requestAnimationFrame(animate);
  updateCameraByScroll();

  const t = performance.now() * 0.001;
  cinematicRig.children.forEach((child) => {
    if (child.isPointLight) {
      child.intensity = 0.58 + Math.sin(t * 1.6 + child.position.x * 0.01) * 0.05;
    }
  });

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.35 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  if (camera && camera.isPerspectiveCamera) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
});
