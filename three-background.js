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
renderer.toneMappingExposure = 1.35;
renderer.setClearColor(0x050505, 1);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);

let camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.05, 2000);
camera.position.set(0, 1.7, 7);

scene.add(new THREE.AmbientLight(0xfff7d8, 1.45));

const keyLight = new THREE.DirectionalLight(0xfff3c1, 2.8);
keyLight.position.set(4, 7, 5);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xb4b27b, 1.25);
fillLight.position.set(-5, 3, -4);
scene.add(fillLight);

let mixer = null;
let animationDuration = 1;
let targetTime = 0;
let currentTime = 0;
let glbLoaded = false;

const fallbackGroup = new THREE.Group();
scene.add(fallbackGroup);

function createFallbackCorridor() {
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0xb4b27b,
    roughness: 0.94,
    metalness: 0.02,
    side: THREE.DoubleSide
  });

  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x665b2b,
    roughness: 1,
    side: THREE.DoubleSide
  });

  const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: 0x8f8a55,
    roughness: 0.92,
    side: THREE.DoubleSide
  });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(18, 0.08, 90), floorMaterial);
  floor.position.set(0, -0.05, -32);
  fallbackGroup.add(floor);

  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(18, 0.08, 90), ceilingMaterial);
  ceiling.position.set(0, 4.2, -32);
  fallbackGroup.add(ceiling);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.08, 4.2, 90), wallMaterial);
  leftWall.position.set(-9, 2.05, -32);
  fallbackGroup.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.08, 4.2, 90), wallMaterial);
  rightWall.position.set(9, 2.05, -32);
  fallbackGroup.add(rightWall);

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(18, 4.2, 0.08), wallMaterial);
  backWall.position.set(0, 2.05, -76);
  fallbackGroup.add(backWall);

  const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xfff4bd });
  for (let z = 4; z > -72; z -= 8) {
    const light = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.05, 0.28), lightMaterial);
    light.position.set(0, 4.15, z);
    fallbackGroup.add(light);

    const point = new THREE.PointLight(0xfff2bd, 0.65, 12);
    point.position.set(0, 3.75, z);
    fallbackGroup.add(point);
  }

  // Paredes modulares laterais para dar profundidade mesmo antes do GLB carregar.
  for (let z = -4; z > -62; z -= 12) {
    const divider = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.6, 0.12), wallMaterial);
    divider.position.set(z % 24 === 0 ? -5.5 : 5.5, 1.75, z);
    divider.rotation.y = Math.PI / 2;
    fallbackGroup.add(divider);
  }
}

createFallbackCorridor();

function normalizeModel(root) {
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxAxis = Math.max(size.x, size.y, size.z) || 1;

  root.position.sub(center);

  // Garante que o modelo apareça mesmo se exportado muito grande ou muito pequeno.
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

const glbTimeout = window.setTimeout(() => {
  if (!glbLoaded && statusEl) {
    statusEl.textContent = 'carregamento lento do GLB / fundo alternativo ativo';
    window.setTimeout(() => statusEl.classList.add('is-hidden'), 1800);
  }
}, 6500);

loader.load(
  './assets/backrooms.glb',
  (gltf) => {
    glbLoaded = true;
    window.clearTimeout(glbTimeout);

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
    if (!statusEl) return;

    if (event.total) {
      const progress = Math.round((event.loaded / event.total) * 100);
      statusEl.textContent = `carregando percurso interno... ${progress}%`;
    } else {
      statusEl.textContent = 'carregando percurso interno...';
    }
  },
  (error) => {
    glbLoaded = false;
    window.clearTimeout(glbTimeout);

    console.error('Falha ao carregar GLB:', error);

    fallbackGroup.visible = true;

    if (statusEl) {
      statusEl.textContent = 'GLB não carregou / fundo alternativo ativo';
      window.setTimeout(() => statusEl.classList.add('is-hidden'), 2200);
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
    const z = 8 - progress * 50;
    camera.position.set(
      Math.sin(progress * Math.PI * 1.2) * 1.2,
      1.7 + Math.sin(progress * Math.PI) * 0.35,
      z
    );
    camera.lookAt(Math.sin(progress * Math.PI * 1.1) * 1.8, 1.55, z - 10);
  }
}

function animate() {
  requestAnimationFrame(animate);
  updateScrollAnimation();
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
