import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';

const canvas = document.getElementById('scene');
const statusEl = document.getElementById('sceneStatus');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.4 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.setClearColor(0x050505, 1);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);

let camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.05, 2000);
camera.position.set(0, 1.7, 6);

scene.add(new THREE.AmbientLight(0xfff7d8, 1.35));

const keyLight = new THREE.DirectionalLight(0xfff3c1, 2.6);
keyLight.position.set(4, 7, 5);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xb4b27b, 1.2);
fillLight.position.set(-5, 3, -4);
scene.add(fillLight);

let mixer = null;
let animationDuration = 1;
let targetTime = 0;
let currentTime = 0;

const fallbackGroup = new THREE.Group();
scene.add(fallbackGroup);

function createFallbackCorridor() {
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xb4b27b, roughness: 0.92, metalness: 0.02, side: THREE.DoubleSide });
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x665b2b, roughness: 1, side: THREE.DoubleSide });
  const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0x979564, roughness: 0.9, side: THREE.DoubleSide });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(18, 0.08, 80), floorMaterial);
  floor.position.set(0, -0.05, -26);
  fallbackGroup.add(floor);

  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(18, 0.08, 80), ceilingMaterial);
  ceiling.position.set(0, 4.2, -26);
  fallbackGroup.add(ceiling);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.08, 4.2, 80), wallMaterial);
  leftWall.position.set(-9, 2.05, -26);
  fallbackGroup.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.08, 4.2, 80), wallMaterial);
  rightWall.position.set(9, 2.05, -26);
  fallbackGroup.add(rightWall);

  const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xfff4bd });
  for (let z = 4; z > -62; z -= 8) {
    const light = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.05, 0.25), lightMaterial);
    light.position.set(0, 4.15, z);
    fallbackGroup.add(light);

    const point = new THREE.PointLight(0xfff2bd, 0.55, 10);
    point.position.set(0, 3.8, z);
    fallbackGroup.add(point);
  }
}

createFallbackCorridor();

function normalizeModel(root) {
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxAxis = Math.max(size.x, size.y, size.z) || 1;

  root.position.sub(center);

  if (maxAxis > 120 || maxAxis < 2) {
    root.scale.multiplyScalar(34 / maxAxis);
  }

  root.traverse((object) => {
    if (object.isMesh) {
      object.frustumCulled = false;
      const mats = Array.isArray(object.material) ? object.material : [object.material];
      mats.filter(Boolean).forEach((mat) => {
        mat.side = THREE.DoubleSide;
        if ('roughness' in mat) mat.roughness = Math.min(1, mat.roughness + 0.12);
        mat.needsUpdate = true;
      });
    }
  });
}

const loader = new GLTFLoader();

loader.load(
  './assets/backrooms.glb',
  (gltf) => {
    const model = gltf.scene;
    normalizeModel(model);
    scene.add(model);

    const exportedCamera = gltf.cameras?.[0];

    if (exportedCamera && exportedCamera.isCamera) {
      camera = exportedCamera;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.near = Math.max(0.01, camera.near || 0.05);
      camera.far = Math.max(1000, camera.far || 1000);
      camera.updateProjectionMatrix();
    } else {
      camera.position.set(0, 1.8, 8);
      camera.lookAt(0, 1.6, -12);
    }

    if (gltf.animations && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(model);
      const clip = gltf.animations[0];
      const action = mixer.clipAction(clip);
      action.play();
      action.paused = true;
      animationDuration = clip.duration || 1;
      mixer.setTime(0);
    }

    fallbackGroup.visible = false;

    if (statusEl) {
      statusEl.textContent = 'percurso carregado / role para mover a câmera';
      window.setTimeout(() => statusEl.classList.add('is-hidden'), 1400);
    }
  },
  (event) => {
    if (!statusEl || !event.total) return;
    const progress = Math.round((event.loaded / event.total) * 100);
    statusEl.textContent = `carregando percurso interno... ${progress}%`;
  },
  (error) => {
    console.error('Falha ao carregar GLB:', error);
    fallbackGroup.visible = true;
    if (statusEl) {
      statusEl.textContent = 'fundo 3D alternativo ativo';
      window.setTimeout(() => statusEl.classList.add('is-hidden'), 1800);
    }
  }
);

function getScrollProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return 0;
  return Math.min(window.scrollY / maxScroll, 1);
}

function updateScrollAnimation() {
  const progress = getScrollProgress();

  if (mixer && !reducedMotion) {
    targetTime = progress * animationDuration;
    currentTime = THREE.MathUtils.lerp(currentTime, targetTime, 0.085);
    mixer.setTime(currentTime);
    return;
  }

  if (!reducedMotion) {
    const z = 8 - progress * 46;
    camera.position.set(Math.sin(progress * Math.PI * 1.2) * 1.2, 1.7 + Math.sin(progress * Math.PI) * 0.35, z);
    camera.lookAt(Math.sin(progress * Math.PI * 1.1) * 1.8, 1.55, z - 9);
  }
}

function animate() {
  requestAnimationFrame(animate);
  updateScrollAnimation();
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.4 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  if (camera && camera.isPerspectiveCamera) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
});
