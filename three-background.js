import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';

const CONFIG = {
  clearColor: 0x050505,
  exposure: 1.35,

  // Movimento baseado na câmera original do GLB.
  scrollForwardDistance: 10,
  rightTurnRadians: -0.55,
  rightTurnPower: 1.35,

  wigglePositionStrength: 0.01,
  wiggleRotationStrength: 0.0035,
  wiggleSpeed: 0.85,

  // Luzes leves de segurança. As luzes reais do cam.glb continuam sendo usadas.
  ambientIntensity: 0.95,
  keyIntensity: 0.55,
  fillIntensity: 0.35,
  frontIntensity: 0.22
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

const ambient = new THREE.HemisphereLight(0xffffff, 0x303030, CONFIG.ambientIntensity);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xfff0d2, CONFIG.keyIntensity);
keyLight.position.set(8, 10, 4);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xdde4ff, CONFIG.fillIntensity);
fillLight.position.set(-7, 5, -6);
scene.add(fillLight);

const frontLight = new THREE.PointLight(0xffffff, CONFIG.frontIntensity, 28);
frontLight.position.set(0, 3, 6);
scene.add(frontLight);

let modelLoaded = false;
let loadedCamera = null;
let baseCameraPosition = new THREE.Vector3();
let baseCameraQuaternion = new THREE.Quaternion();
let lastScrollProgress = -1;

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

function prepareGLBWithoutChangingMaterials(root) {
  root.traverse((object) => {
    if (!object.isMesh) return;

    object.frustumCulled = false;
    object.castShadow = false;
    object.receiveShadow = false;

    // Importante: não troca, não clona e não corrige textura manualmente.
    // O GLTFLoader já aplica corretamente as texturas embutidas no GLB.
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (!material) return;
      material.needsUpdate = true;
    });
  });
}

function findBestCamera(root, cameras = []) {
  let cameraFromScene = null;

  root.traverse((object) => {
    if (!cameraFromScene && object.isCamera) {
      cameraFromScene = object;
    }
  });

  return cameraFromScene || cameras[0] || null;
}

function applyCameraBaseFromGLB(sourceCamera) {
  loadedCamera = sourceCamera;

  // Ponto principal da correção:
  // usa transformação GLOBAL da câmera do GLB, não posição/rotação local.
  // Isso evita câmera deslocada, parede gigante na frente e aparência de material quebrado.
  sourceCamera.updateMatrixWorld(true);
  sourceCamera.getWorldPosition(baseCameraPosition);
  sourceCamera.getWorldQuaternion(baseCameraQuaternion);

  camera.fov = sourceCamera.fov || 42;
  camera.near = sourceCamera.near || 0.1;
  camera.far = Math.max(sourceCamera.far || 100, 4000);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  camera.position.copy(baseCameraPosition);
  camera.quaternion.copy(baseCameraQuaternion);
}

function updateCameraFromScroll(force = false) {
  if (!loadedCamera) return;

  const scroll = getScrollProgress();
  const t = performance.now() * 0.001;

  if (!force && Math.abs(scroll - lastScrollProgress) < 0.00001) {
    // Mantém o wiggle rodando mesmo sem scroll.
  }

  lastScrollProgress = scroll;

  const eased = easeInOutCubic(scroll);
  const forward = new THREE.Vector3(0, 0, -1)
    .applyQuaternion(baseCameraQuaternion)
    .normalize();

  const moveForward = forward.multiplyScalar(eased * CONFIG.scrollForwardDistance);

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

const timeout = window.setTimeout(() => {
  if (!modelLoaded) setStatus('carregamento lento do modelo 3D', 2600);
}, 8000);

loader.load(
  './assets/cam.glb',
  (gltf) => {
    window.clearTimeout(timeout);
    modelLoaded = true;

    const root = gltf.scene;
    scene.add(root);
    root.updateMatrixWorld(true);

    prepareGLBWithoutChangingMaterials(root);

    const sceneCamera = findBestCamera(root, gltf.cameras);

    if (sceneCamera) {
      applyCameraBaseFromGLB(sceneCamera);
      updateCameraFromScroll(true);
      setStatus('cam.glb carregado / materiais preservados');
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
    window.clearTimeout(timeout);
    console.error('Falha ao carregar cam.glb:', error);
    setStatus('erro ao carregar assets/cam.glb', 4200);
  }
);

function animate() {
  requestAnimationFrame(animate);

  updateCameraFromScroll();

  const t = performance.now() * 0.001;
  frontLight.intensity = CONFIG.frontIntensity + Math.sin(t * 0.8) * 0.018;

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.35 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  updateCameraFromScroll(true);
});
