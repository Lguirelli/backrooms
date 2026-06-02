import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';

const CONFIG = {
  clearColor: 0x0a0a0a,
  exposure: 1.65,

  scrollForwardDistance: 10,
  rightTurnRadians: -0.55,
  rightTurnPower: 1.35,

  wigglePositionStrength: 0.012,
  wiggleRotationStrength: 0.004,
  wiggleSpeed: 0.85,

  ambientIntensity: 1.4,
  keyIntensity: 1.1,
  fillIntensity: 0.65,
  frontIntensity: 0.55
};

const canvas = document.getElementById('scene');
const statusEl = document.getElementById('sceneStatus');

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
renderer.toneMappingExposure = CONFIG.exposure;
renderer.setClearColor(CONFIG.clearColor, 1);
renderer.shadowMap.enabled = false;

const scene = new THREE.Scene();
scene.background = new THREE.Color(CONFIG.clearColor);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 4000);

const ambient = new THREE.HemisphereLight(0xffffff, 0x2e2e2e, CONFIG.ambientIntensity);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xfff2d6, CONFIG.keyIntensity);
keyLight.position.set(8, 10, 4);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xcfd8ff, CONFIG.fillIntensity);
fillLight.position.set(-6, 4, -5);
scene.add(fillLight);

const frontLight = new THREE.PointLight(0xffffff, CONFIG.frontIntensity, 30);
frontLight.position.set(0, 4, 6);
scene.add(frontLight);

let gltfRoot = null;
let baseCameraPosition = new THREE.Vector3();
let baseCameraQuaternion = new THREE.Quaternion();
let loadedCamera = null;

function setStatus(text, hideDelay = 1800) {
  if (!statusEl) return;
  statusEl.classList.remove('is-hidden');
  statusEl.textContent = text;
  window.setTimeout(() => statusEl.classList.add('is-hidden'), hideDelay);
}

function getScrollProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return 0;
  return Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
}

function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function setupOriginalMaterials(root) {
  root.traverse((object) => {
    if (!object.isMesh) return;

    object.frustumCulled = false;
    object.castShadow = false;
    object.receiveShadow = false;

    const materials = Array.isArray(object.material) ? object.material : [object.material];

    materials.forEach((mat) => {
      if (!mat) return;

      // Mantém exatamente os materiais do GLB
      mat.needsUpdate = true;

      if (mat.map) {
        mat.map.needsUpdate = true;
      }

      if (mat.normalMap) {
        mat.normalMap.needsUpdate = true;
      }

      if (mat.roughnessMap) {
        mat.roughnessMap.needsUpdate = true;
      }

      if (mat.metalnessMap) {
        mat.metalnessMap.needsUpdate = true;
      }

      if (mat.aoMap) {
        mat.aoMap.needsUpdate = true;
      }

      if (mat.emissiveMap) {
        mat.emissiveMap.needsUpdate = true;
      }
    });
  });
}

function findBestCamera(root) {
  let found = null;

  root.traverse((object) => {
    if (object.isCamera && !found) {
      found = object;
    }
  });

  return found;
}

function applyCameraBaseFromGLB(sourceCamera) {
  loadedCamera = sourceCamera;

  baseCameraPosition.copy(sourceCamera.position);
  baseCameraQuaternion.copy(sourceCamera.quaternion);

  camera.fov = sourceCamera.fov || 42;
  camera.near = sourceCamera.near || 0.1;
  camera.far = sourceCamera.far || 4000;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  camera.position.copy(baseCameraPosition);
  camera.quaternion.copy(baseCameraQuaternion);
}

function updateCameraFromScroll() {
  if (!loadedCamera) return;

  const scroll = getScrollProgress();
  const eased = easeInOutCubic(scroll);
  const t = performance.now() * 0.001;

  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(baseCameraQuaternion).normalize();
  const moveForward = forward.clone().multiplyScalar(eased * CONFIG.scrollForwardDistance);

  const rightTurn = Math.pow(scroll, CONFIG.rightTurnPower) * CONFIG.rightTurnRadians;
  const wigglePosX = Math.sin(t * CONFIG.wiggleSpeed * 1.37) * CONFIG.wigglePositionStrength;
  const wigglePosY = Math.cos(t * CONFIG.wiggleSpeed * 1.11) * CONFIG.wigglePositionStrength * 0.6;
  const wiggleYaw = Math.sin(t * CONFIG.wiggleSpeed * 1.25) * CONFIG.wiggleRotationStrength;
  const wigglePitch = Math.cos(t * CONFIG.wiggleSpeed * 0.93) * CONFIG.wiggleRotationStrength * 0.7;

  camera.position.copy(baseCameraPosition).add(moveForward);
  camera.position.x += wigglePosX;
  camera.position.y += wigglePosY;

  const scrollRotation = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(wigglePitch, rightTurn + wiggleYaw, 0, 'YXZ')
  );

  camera.quaternion.copy(baseCameraQuaternion).multiply(scrollRotation);
}

const loader = new GLTFLoader();

loader.load(
  './assets/cam.glb',
  (gltf) => {
    gltfRoot = gltf.scene;

    setupOriginalMaterials(gltfRoot);
    scene.add(gltfRoot);

    const sceneCamera = findBestCamera(gltf.scene) || gltf.cameras?.[0];

    if (sceneCamera) {
      applyCameraBaseFromGLB(sceneCamera);
      setStatus('cam.glb carregado / câmera original aplicada');
    } else {
      camera.position.set(0, 2, 8);
      camera.lookAt(0, 2, 0);
      setStatus('cam.glb carregado / câmera padrão usada');
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
    console.error('Falha ao carregar cam.glb:', error);
    setStatus('erro ao carregar assets/cam.glb', 4200);
  }
);

function animate() {
  requestAnimationFrame(animate);

  updateCameraFromScroll();

  const t = performance.now() * 0.001;
  frontLight.intensity = CONFIG.frontIntensity + Math.sin(t * 0.8) * 0.03;

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.35 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
