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
renderer.toneMappingExposure = 0.82;
renderer.setClearColor(0x030302, 1);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030302);
scene.fog = new THREE.FogExp2(0x0b0903, 0.022);

const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.05, 5000);
camera.position.set(-10, 3.4, 16);
camera.lookAt(-18, 3.1, -8);

const warmAmbient = new THREE.HemisphereLight(0xffe7a2, 0x151008, 0.75);
scene.add(warmAmbient);

const keyLight = new THREE.DirectionalLight(0xffe8a8, 1.45);
keyLight.position.set(-8, 12, 10);
scene.add(keyLight);

const fluorescentRig = new THREE.Group();
scene.add(fluorescentRig);

let modelRoot = null;
let modelBox = null;
let glbLoaded = false;

const fallbackGroup = new THREE.Group();
scene.add(fallbackGroup);

function createFallbackCorridor() {
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x928b45, roughness: 0.96, metalness: 0.01, side: THREE.DoubleSide });
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x5e4d22, roughness: 1, side: THREE.DoubleSide });
  const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0x8f8a55, roughness: 0.92, side: THREE.DoubleSide });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(20, 0.08, 90), floorMaterial);
  floor.position.set(0, -0.05, -32);
  fallbackGroup.add(floor);

  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(20, 0.08, 90), ceilingMaterial);
  ceiling.position.set(0, 5.2, -32);
  fallbackGroup.add(ceiling);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 5.2, 90), wallMaterial);
  leftWall.position.set(-10, 2.55, -32);
  fallbackGroup.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 5.2, 90), wallMaterial);
  rightWall.position.set(10, 2.55, -32);
  fallbackGroup.add(rightWall);

  const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xfff2b2 });
  for (let z = 5; z > -72; z -= 8) {
    const light = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.05, 0.28), lightMaterial);
    light.position.set(0, 5.05, z);
    fallbackGroup.add(light);

    const point = new THREE.PointLight(0xffe7aa, 0.8, 16);
    point.position.set(0, 4.6, z);
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

  if (maxAxis > 160 || maxAxis < 2) {
    root.scale.multiplyScalar(42 / maxAxis);
  }

  // Mantém uma leitura mais cinematográfica: modelo um pouco abaixo da câmera,
  // evitando a composição branca/chapada do teto dominando o fundo.
  root.position.y -= 1.2;
  root.rotation.y = -Math.PI / 2;

  root.traverse((object) => {
    if (object.isMesh) {
      object.frustumCulled = false;
      object.castShadow = false;
      object.receiveShadow = true;

      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.filter(Boolean).forEach((mat) => {
        mat.side = THREE.DoubleSide;

        if ('roughness' in mat) mat.roughness = Math.min(1, mat.roughness + 0.18);
        if ('metalness' in mat) mat.metalness = Math.max(0, mat.metalness * 0.25);

        // Reduz aparência lavada do GLB no fundo.
        if (mat.color) {
          mat.color.convertSRGBToLinear();
          mat.color.multiplyScalar(0.72);
        }

        mat.needsUpdate = true;
      });
    }
  });

  root.updateMatrixWorld(true);
  modelBox = new THREE.Box3().setFromObject(root);
}

function addCinematicLights() {
  fluorescentRig.clear();

  const stripMat = new THREE.MeshBasicMaterial({ color: 0xffefb6 });

  for (let i = 0; i < 8; i += 1) {
    const z = 10 - i * 8;
    const x = -6 + (i % 3) * 2.8;

    const strip = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.05, 0.32), stripMat);
    strip.position.set(x, 4.7, z);
    strip.rotation.y = 0.05;
    fluorescentRig.add(strip);

    const light = new THREE.PointLight(0xffe8ac, 0.95, 20);
    light.position.set(x, 4.35, z);
    fluorescentRig.add(light);
  }
}

function getScrollProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return 0;
  return Math.min(window.scrollY / maxScroll, 1);
}

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function updateProceduralCamera() {
  const p = reducedMotion ? 0.08 : getScrollProgress();

  // Camera inspirada na referência enviada: lateral, baixa, comprimida,
  // olhando para dentro de corredores amarelados e não para o teto.
  const segment = p * 4.0;
  const drift = Math.sin(segment * Math.PI * 0.9) * 2.0;
  const side = Math.sin(segment * Math.PI * 0.45) * 1.1;

  const x = -12 + drift;
  const y = 2.55 + Math.sin(p * Math.PI * 2) * 0.12;
  const z = 16 - p * 48;

  const targetX = -19 + side;
  const targetY = 2.38 + Math.sin(p * Math.PI * 1.8) * 0.08;
  const targetZ = z - 15;

  camera.position.lerp(new THREE.Vector3(x, y, z), 0.075);
  camera.lookAt(targetX, targetY, targetZ);

  const fovTarget = 34 + smoothstep(0.25, 0.9, p) * 8;
  camera.fov += (fovTarget - camera.fov) * 0.04;
  camera.updateProjectionMatrix();
}

const loader = new GLTFLoader();

const loadTimeout = window.setTimeout(() => {
  if (!glbLoaded && statusEl) {
    statusEl.textContent = 'carregamento lento do GLB / fundo alternativo ativo';
    window.setTimeout(() => statusEl.classList.add('is-hidden'), 2200);
  }
}, 7000);

loader.load(
  './assets/backrooms.glb',
  (gltf) => {
    window.clearTimeout(loadTimeout);
    glbLoaded = true;

    modelRoot = gltf.scene;
    normalizeModel(modelRoot);
    scene.add(modelRoot);
    addCinematicLights();

    fallbackGroup.visible = false;

    if (statusEl) {
      statusEl.textContent = 'câmera cinematográfica conectada ao scroll';
      window.setTimeout(() => statusEl.classList.add('is-hidden'), 1800);
    }
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

    fallbackGroup.visible = true;

    if (statusEl) {
      statusEl.textContent = 'GLB não carregou / fundo alternativo ativo';
      window.setTimeout(() => statusEl.classList.add('is-hidden'), 2400);
    }
  }
);

function animate() {
  requestAnimationFrame(animate);

  updateProceduralCamera();

  const t = performance.now() * 0.001;
  fluorescentRig.children.forEach((child) => {
    if (child.isPointLight) {
      child.intensity = 0.88 + Math.sin(t * 1.4 + child.position.z) * 0.045;
    }
  });

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.35 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
