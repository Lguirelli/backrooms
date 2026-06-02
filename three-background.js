import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';

/* =========================================================
   BACKGROUND 3D — CAM2.GLB
   - Usa apenas ./assets/cam.glb
   - Mantém materiais, texturas e luzes originais do GLB
   - Mantém a câmera existente do GLB como base exata
   - Scroll: avança para frente + gira progressivamente para a direita
   - Wiggle leve constante aplicado em cima da câmera original
   ========================================================= */

const CONFIG = {
  modelUrl: './assets/cam.glb',

  renderer: {
    pixelRatioDesktop: 1.75,
    pixelRatioMobile: 1.25,
    exposure: 1.55,
    clearColor: 0x050505
  },

  cameraMotion: {
    forwardDistance: 9.5,
    rightTurnRadians: -0.95,
    rightTurnPower: 1.28,
    scrollLerp: 0.075
  },

  wiggle: {
    enabled: true,
    speed: 0.82,
    positionStrength: 0.015,
    rotationStrength: 0.0045
  },

  // Mantém as luzes do GLB. Estas luzes extras são apenas preenchimento leve.
  safetyLighting: {
    enabled: true,
    ambientIntensity: 0.28,
    hemisphereIntensity: 0.38,
    frontalIntensity: 0.22
  }
};

const canvas = document.getElementById('scene');
const statusEl = document.getElementById('sceneStatus');

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance'
});

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = CONFIG.renderer.exposure;
renderer.setClearColor(CONFIG.renderer.clearColor, 1);
renderer.shadowMap.enabled = false;

const scene = new THREE.Scene();
scene.background = new THREE.Color(CONFIG.renderer.clearColor);
scene.fog = null;

let camera = null;
let modelLoaded = false;
let activeCameraReady = false;
let scrollTarget = 0;
let scrollCurrent = 0;

const baseCameraPosition = new THREE.Vector3();
const baseCameraQuaternion = new THREE.Quaternion();
const baseCameraEuler = new THREE.Euler(0, 0, 0, 'YXZ');
const baseForward = new THREE.Vector3(0, 0, -1);
const tempPosition = new THREE.Vector3();
const tempEuler = new THREE.Euler(0, 0, 0, 'YXZ');
const tempVector = new THREE.Vector3();

function createFallbackCamera() {
  const fallback = new THREE.PerspectiveCamera(
    36,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  fallback.position.set(-12.121, 0.807, 0.593);
  fallback.rotation.set(-0.003, -1.523, 0, 'YXZ');

  return fallback;
}

function updateRendererSize() {
  const pixelRatioLimit = window.innerWidth < 768
    ? CONFIG.renderer.pixelRatioMobile
    : CONFIG.renderer.pixelRatioDesktop;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioLimit));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  if (camera) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
}

updateRendererSize();

function setStatus(text, hideDelay = 1800) {
  if (!statusEl) return;

  statusEl.classList.remove('is-hidden');
  statusEl.textContent = text;

  window.setTimeout(() => {
    statusEl.classList.add('is-hidden');
  }, hideDelay);
}

function getScrollProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return 0;
  return Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
}

function easeInOutCubic(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function updateScrollTarget() {
  scrollTarget = getScrollProgress();
}

window.addEventListener('scroll', updateScrollTarget, { passive: true });

function addSafetyLighting() {
  if (!CONFIG.safetyLighting.enabled) return;

  const ambient = new THREE.AmbientLight(0xffffff, CONFIG.safetyLighting.ambientIntensity);
  ambient.name = 'web_safety_ambient_light';
  scene.add(ambient);

  const hemisphere = new THREE.HemisphereLight(
    0xfff4dc,
    0x24200f,
    CONFIG.safetyLighting.hemisphereIntensity
  );
  hemisphere.name = 'web_safety_hemisphere_light';
  scene.add(hemisphere);

  const frontal = new THREE.DirectionalLight(0xfff2d0, CONFIG.safetyLighting.frontalIntensity);
  frontal.name = 'web_safety_frontal_light';
  frontal.position.set(-6, 4, 5);
  scene.add(frontal);
}

function normalizeImportedModel(root) {
  root.traverse((object) => {
    if (!object.isMesh) return;

    object.frustumCulled = false;
    object.castShadow = false;
    object.receiveShadow = false;

    if (object.geometry) {
      object.geometry.computeVertexNormals();
      object.geometry.computeBoundingBox();
    }

    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];

    materials.forEach((material) => {
      if (!material) return;

      material.needsUpdate = true;

      if (material.map) {
        material.map.colorSpace = THREE.SRGBColorSpace;
        material.map.needsUpdate = true;
      }

      if (material.emissiveMap) {
        material.emissiveMap.colorSpace = THREE.SRGBColorSpace;
        material.emissiveMap.needsUpdate = true;
      }
    });
  });
}

function getImportedCameraFromScene(gltf) {
  if (gltf.cameras?.[0]?.isPerspectiveCamera) {
    return gltf.cameras[0];
  }

  let foundCamera = null;

  gltf.scene.traverse((object) => {
    if (!foundCamera && object.isPerspectiveCamera) {
      foundCamera = object;
    }
  });

  return foundCamera;
}

function setupCameraFromExistingGLB(gltf) {
  const importedCamera = getImportedCameraFromScene(gltf);

  // Mantém a câmera existente do GLB. Não recria posição, rotação ou FOV.
  camera = importedCamera || createFallbackCamera();

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  camera.getWorldPosition(baseCameraPosition);
  camera.getWorldQuaternion(baseCameraQuaternion);

  baseCameraEuler.setFromQuaternion(baseCameraQuaternion, 'YXZ');
  baseForward.set(0, 0, -1).applyQuaternion(baseCameraQuaternion).normalize();

  activeCameraReady = true;
}

const loader = new GLTFLoader();

const timeout = window.setTimeout(() => {
  if (!modelLoaded) setStatus('carregamento lento do modelo 3D', 2600);
}, 8000);

addSafetyLighting();
updateScrollTarget();

loader.load(
  CONFIG.modelUrl,
  (gltf) => {
    window.clearTimeout(timeout);
    modelLoaded = true;

    normalizeImportedModel(gltf.scene);
    scene.add(gltf.scene);

    setupCameraFromExistingGLB(gltf);
    updateRendererSize();
    setStatus('cam2.glb carregado');
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
    setStatus('modelo 3D não carregou: verifique assets/cam.glb', 4200);
  }
);

function updateCameraMotion(timeSeconds) {
  if (!activeCameraReady || !camera) return;

  scrollCurrent += (scrollTarget - scrollCurrent) * CONFIG.cameraMotion.scrollLerp;

  const easedScroll = easeInOutCubic(scrollCurrent);
  const rightTurnProgress = Math.pow(scrollCurrent, CONFIG.cameraMotion.rightTurnPower);

  const wiggleSpeed = CONFIG.wiggle.speed;
  const wigglePosition = CONFIG.wiggle.enabled ? CONFIG.wiggle.positionStrength : 0;
  const wiggleRotation = CONFIG.wiggle.enabled ? CONFIG.wiggle.rotationStrength : 0;

  const wiggleX = Math.sin(timeSeconds * wiggleSpeed * 1.7) * wigglePosition;
  const wiggleY = Math.sin(timeSeconds * wiggleSpeed * 1.1 + 1.8) * wigglePosition * 0.55;
  const wiggleZ = Math.cos(timeSeconds * wiggleSpeed * 1.4 + 0.6) * wigglePosition * 0.65;

  tempVector.set(wiggleX, wiggleY, wiggleZ);

  tempPosition
    .copy(baseCameraPosition)
    .addScaledVector(baseForward, CONFIG.cameraMotion.forwardDistance * easedScroll)
    .add(tempVector);

  tempEuler.set(
    baseCameraEuler.x + Math.sin(timeSeconds * wiggleSpeed * 1.23) * wiggleRotation,
    baseCameraEuler.y + CONFIG.cameraMotion.rightTurnRadians * rightTurnProgress + Math.sin(timeSeconds * wiggleSpeed * 0.97) * wiggleRotation,
    baseCameraEuler.z + Math.cos(timeSeconds * wiggleSpeed * 1.11) * wiggleRotation * 0.7,
    'YXZ'
  );

  camera.position.copy(tempPosition);
  camera.rotation.copy(tempEuler);
}

function animate() {
  requestAnimationFrame(animate);

  const timeSeconds = performance.now() * 0.001;
  updateCameraMotion(timeSeconds);

  if (camera) {
    renderer.render(scene, camera);
  }
}

animate();

window.addEventListener('resize', () => {
  updateRendererSize();
  updateScrollTarget();
});
