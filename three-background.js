import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';

const CONFIG = {
  modelUrl: './assets/cam.glb',
  exposure: 1.08,
  background: 0x050505,
  fogColor: 0x050505,
  fogDensity: 0.0022,

  scrollForwardDistance: 7.5,
  scrollRightDrift: 0.32,
  rightTurnRadians: -1.08,
  rightTurnPower: 1.28,

  smoothFactor: 0.075,
  wigglePositionStrength: 0.015,
  wiggleRotationStrength: 0.0045,
  wiggleSpeed: 0.82
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
renderer.setClearColor(CONFIG.background, 1);
renderer.shadowMap.enabled = false;

const scene = new THREE.Scene();
scene.background = new THREE.Color(CONFIG.background);
scene.fog = new THREE.FogExp2(CONFIG.fogColor, CONFIG.fogDensity);

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 1.7, 6);

const loader = new GLTFLoader();

let model = null;
let sourceCamera = null;
let basePosition = new THREE.Vector3();
let baseQuaternion = new THREE.Quaternion();
let targetPosition = new THREE.Vector3();
let targetQuaternion = new THREE.Quaternion();
let smoothPosition = new THREE.Vector3();
let smoothQuaternion = new THREE.Quaternion();

const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const euler = new THREE.Euler(0, 0, 0, 'YXZ');

function setStatus(text, hideDelay = 1800) {
  if (!statusEl) return;
  statusEl.classList.remove('is-hidden');
  statusEl.textContent = text;
  window.setTimeout(() => statusEl.classList.add('is-hidden'), hideDelay);
}

function getScrollProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return 0;
  return THREE.MathUtils.clamp(window.scrollY / maxScroll, 0, 1);
}

function easeInOut(t) {
  return t * t * (3 - 2 * t);
}

function isLightMaterialName(name) {
  const value = String(name || '').toLowerCase();
  return value.includes('light') || value.includes('lamp') || value.includes('luz') || value.includes('ceiling_lights');
}

function preserveGLBMaterials(root) {
  root.traverse((object) => {
    if (!object.isMesh || !object.material) return;

    object.frustumCulled = false;
    object.castShadow = false;
    object.receiveShadow = false;

    const materials = Array.isArray(object.material) ? object.material : [object.material];

    materials.forEach((material) => {
      if (!material) return;

      material.side = THREE.DoubleSide;
      material.needsUpdate = true;

      if (material.map) {
        material.map.colorSpace = THREE.SRGBColorSpace;
        material.map.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
        material.map.needsUpdate = true;
      }

      if (material.normalMap) material.normalMap.colorSpace = THREE.NoColorSpace;
      if (material.roughnessMap) material.roughnessMap.colorSpace = THREE.NoColorSpace;
      if (material.metalnessMap) material.metalnessMap.colorSpace = THREE.NoColorSpace;
      if (material.aoMap) material.aoMap.colorSpace = THREE.NoColorSpace;

      if (!isLightMaterialName(material.name)) {
        material.emissive = new THREE.Color(0x000000);
        material.emissiveIntensity = 0;
      }

      material.roughness = Math.max(material.roughness ?? 0.86, 0.76);
      material.metalness = material.metalness ?? 0;
    });
  });
}

function addFallbackLights() {
  const ambient = new THREE.HemisphereLight(0xfff1dc, 0x17130d, 0.62);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xffe6bd, 0.86);
  key.position.set(6, 8, 5);
  scene.add(key);
}

function getCameraFromGLB(gltf) {
  if (gltf.cameras && gltf.cameras.length) return gltf.cameras[0];

  let found = null;
  gltf.scene.traverse((object) => {
    if (!found && object.isCamera) found = object;
  });

  return found;
}

function syncBaseCamera(gltfCamera) {
  sourceCamera = gltfCamera || camera;

  if (sourceCamera !== camera) {
    camera.fov = sourceCamera.fov || 40;
    camera.near = sourceCamera.near || 0.1;
    camera.far = sourceCamera.far || 2000;
    camera.aspect = window.innerWidth / window.innerHeight;
    sourceCamera.updateWorldMatrix(true, false);
    sourceCamera.getWorldPosition(basePosition);
    sourceCamera.getWorldQuaternion(baseQuaternion);
  } else {
    basePosition.copy(camera.position);
    baseQuaternion.copy(camera.quaternion);
  }

  smoothPosition.copy(basePosition);
  smoothQuaternion.copy(baseQuaternion);
  camera.position.copy(basePosition);
  camera.quaternion.copy(baseQuaternion);
  camera.updateProjectionMatrix();
}

function updateCamera() {
  const progress = getScrollProgress();
  const turnProgress = Math.pow(progress, CONFIG.rightTurnPower);
  const easedForward = easeInOut(progress);

  forward.set(0, 0, -1).applyQuaternion(baseQuaternion).normalize();
  right.set(1, 0, 0).applyQuaternion(baseQuaternion).normalize();

  targetPosition
    .copy(basePosition)
    .addScaledVector(forward, CONFIG.scrollForwardDistance * easedForward)
    .addScaledVector(right, CONFIG.scrollRightDrift * turnProgress);

  euler.setFromQuaternion(baseQuaternion, 'YXZ');
  euler.y += CONFIG.rightTurnRadians * turnProgress;
  targetQuaternion.setFromEuler(euler);

  const time = performance.now() * 0.001 * CONFIG.wiggleSpeed;
  targetPosition.x += Math.sin(time * 1.7) * CONFIG.wigglePositionStrength;
  targetPosition.y += Math.sin(time * 1.15 + 1.8) * CONFIG.wigglePositionStrength * 0.42;
  targetPosition.z += Math.cos(time * 1.35) * CONFIG.wigglePositionStrength * 0.55;

  const wiggleQuaternion = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(
      Math.sin(time * 1.2) * CONFIG.wiggleRotationStrength,
      Math.sin(time * 0.95 + 0.8) * CONFIG.wiggleRotationStrength,
      Math.cos(time * 1.05) * CONFIG.wiggleRotationStrength * 0.55,
      'YXZ'
    )
  );

  targetQuaternion.multiply(wiggleQuaternion);

  smoothPosition.lerp(targetPosition, CONFIG.smoothFactor);
  smoothQuaternion.slerp(targetQuaternion, CONFIG.smoothFactor);

  camera.position.copy(smoothPosition);
  camera.quaternion.copy(smoothQuaternion);
  camera.updateMatrixWorld();
}

loader.load(
  CONFIG.modelUrl,
  (gltf) => {
    model = gltf.scene;
    preserveGLBMaterials(model);
    scene.add(model);

    syncBaseCamera(getCameraFromGLB(gltf));
    addFallbackLights();
    setStatus('cam.glb carregado');
  },
  (event) => {
    if (!statusEl) return;
    if (event.total) {
      statusEl.textContent = `carregando 3D... ${Math.round((event.loaded / event.total) * 100)}%`;
    } else {
      statusEl.textContent = 'carregando 3D...';
    }
  },
  (error) => {
    console.error('Falha ao carregar cam.glb:', error);
    setStatus('modelo 3D não carregou: verifique assets/cam.glb', 4200);
  }
);

function animate() {
  requestAnimationFrame(animate);
  updateCamera();
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.35 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
