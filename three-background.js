import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';

/* =========================================================
   BACKGROUND 3D — CAM.GLB LIMPO
   - Ignora totalmente o modelo anterior.
   - Carrega apenas assets/cam.glb.
   - Mantém texturas e materiais originais do GLB.
   - Usa a câmera embutida do GLB como ponto inicial.
   - No scroll: avança para frente e gira levemente para a direita.
   ========================================================= */

const MODEL_URL = './assets/cam.glb';

const CONFIG = {
  renderer: {
    clearColor: 0x050505,
    exposure: 1.0,
    maxDprDesktop: 1.75,
    maxDprMobile: 1.25
  },
  camera: {
    fallbackFov: 40,
    near: 0.05,
    far: 2000,
    forwardDistance: 8.5,
    rightTurnRadians: -0.28,
    verticalDrift: 0.04,
    smoothing: 0.08
  },
  lights: {
    // Luzes neutras de visualização. Não trocam material nem textura do GLB.
    enabled: true,
    hemisphereSky: 0xffffff,
    hemisphereGround: 0x39332a,
    hemisphereIntensity: 0.75,
    keyColor: 0xfff2d2,
    keyIntensity: 0.75,
    keyPosition: [-4, 7, 6]
  },
  status: {
    loadingDelay: 8000,
    hideDelay: 1800
  }
};

const canvas = document.getElementById('scene');
const statusEl = document.getElementById('sceneStatus');

if (!canvas) {
  throw new Error('Canvas #scene não encontrado.');
}

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

let activeCamera = createFallbackCamera();
let baseCameraPosition = activeCamera.position.clone();
let baseCameraQuaternion = activeCamera.quaternion.clone();
let baseForward = getCameraForward(baseCameraQuaternion);
let currentScrollProgress = 0;
let targetScrollProgress = 0;
let modelLoaded = false;
let mixer = null;
let lastTime = performance.now();

function createFallbackCamera() {
  const camera = new THREE.PerspectiveCamera(
    CONFIG.camera.fallbackFov,
    window.innerWidth / window.innerHeight,
    CONFIG.camera.near,
    CONFIG.camera.far
  );

  camera.position.set(0, 1.6, 5);
  camera.lookAt(0, 1.4, 0);
  camera.updateProjectionMatrix();

  return camera;
}

function getMaxDpr() {
  return window.innerWidth < 768
    ? CONFIG.renderer.maxDprMobile
    : CONFIG.renderer.maxDprDesktop;
}

function resizeRenderer() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, getMaxDpr()));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  if (activeCamera?.isPerspectiveCamera) {
    activeCamera.aspect = window.innerWidth / window.innerHeight;
    activeCamera.updateProjectionMatrix();
  }
}

function setStatus(text, hideDelay = CONFIG.status.hideDelay) {
  if (!statusEl) return;

  statusEl.classList.remove('is-hidden');
  statusEl.textContent = text;

  window.setTimeout(() => {
    statusEl.classList.add('is-hidden');
  }, hideDelay);
}

function installNeutralLights() {
  if (!CONFIG.lights.enabled) return;

  const hemi = new THREE.HemisphereLight(
    CONFIG.lights.hemisphereSky,
    CONFIG.lights.hemisphereGround,
    CONFIG.lights.hemisphereIntensity
  );
  scene.add(hemi);

  const key = new THREE.DirectionalLight(
    CONFIG.lights.keyColor,
    CONFIG.lights.keyIntensity
  );
  key.position.set(...CONFIG.lights.keyPosition);
  scene.add(key);
}

function findCamera(gltf) {
  if (gltf.cameras?.length) return gltf.cameras[0];

  let camera = null;
  gltf.scene.traverse((object) => {
    if (!camera && object.isCamera) camera = object;
  });

  return camera;
}

function getCameraForward(quaternion) {
  return new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion).normalize();
}

function useCameraFromGLB(cameraFromGLB) {
  cameraFromGLB.updateMatrixWorld(true);

  const worldPosition = new THREE.Vector3();
  const worldQuaternion = new THREE.Quaternion();

  cameraFromGLB.getWorldPosition(worldPosition);
  cameraFromGLB.getWorldQuaternion(worldQuaternion);

  const camera = cameraFromGLB.isPerspectiveCamera
    ? new THREE.PerspectiveCamera(
        cameraFromGLB.fov,
        window.innerWidth / window.innerHeight,
        CONFIG.camera.near,
        CONFIG.camera.far
      )
    : createFallbackCamera();

  camera.position.copy(worldPosition);
  camera.quaternion.copy(worldQuaternion);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);

  activeCamera = camera;
  scene.add(activeCamera);

  baseCameraPosition = activeCamera.position.clone();
  baseCameraQuaternion = activeCamera.quaternion.clone();
  baseForward = getCameraForward(baseCameraQuaternion);

  currentScrollProgress = targetScrollProgress;
  applyScrollCamera(currentScrollProgress);
}

function keepGLBMaterialsAsIs(root) {
  const maxAnisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);

  root.traverse((object) => {
    if (!object.isMesh) return;

    object.frustumCulled = false;
    object.castShadow = false;
    object.receiveShadow = false;

    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];

    materials.forEach((material) => {
      if (!material) return;

      [
        material.map,
        material.normalMap,
        material.roughnessMap,
        material.metalnessMap,
        material.aoMap,
        material.emissiveMap
      ].forEach((texture) => {
        if (!texture) return;
        texture.anisotropy = maxAnisotropy;
        texture.needsUpdate = true;
      });

      material.needsUpdate = true;
    });
  });
}

function getScrollProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return 0;

  return THREE.MathUtils.clamp(window.scrollY / maxScroll, 0, 1);
}

function updateTargetScrollProgress() {
  targetScrollProgress = getScrollProgress();
}

function applyScrollCamera(progress) {
  const forward = CONFIG.camera.forwardDistance * progress;
  const yawRight = CONFIG.camera.rightTurnRadians * progress;
  const driftY = CONFIG.camera.verticalDrift * Math.sin(progress * Math.PI);

  activeCamera.position.copy(baseCameraPosition);
  activeCamera.position.addScaledVector(baseForward, forward);
  activeCamera.position.y += driftY;

  const localRightTurn = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 1, 0),
    yawRight
  );

  activeCamera.quaternion.copy(baseCameraQuaternion).multiply(localRightTurn);
  activeCamera.updateMatrixWorld(true);
}

function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();
  const delta = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  if (mixer) mixer.update(delta);

  currentScrollProgress = THREE.MathUtils.lerp(
    currentScrollProgress,
    targetScrollProgress,
    CONFIG.camera.smoothing
  );

  applyScrollCamera(currentScrollProgress);
  renderer.render(scene, activeCamera);
}

installNeutralLights();
resizeRenderer();
updateTargetScrollProgress();

const loader = new GLTFLoader();

const loadingTimeout = window.setTimeout(() => {
  if (!modelLoaded) {
    setStatus('carregamento lento do modelo 3D', 2600);
  }
}, CONFIG.status.loadingDelay);

loader.load(
  MODEL_URL,
  (gltf) => {
    window.clearTimeout(loadingTimeout);
    modelLoaded = true;

    scene.add(gltf.scene);
    gltf.scene.updateMatrixWorld(true);

    keepGLBMaterialsAsIs(gltf.scene);

    const cameraFromGLB = findCamera(gltf);
    if (cameraFromGLB) {
      useCameraFromGLB(cameraFromGLB);
    }

    if (gltf.animations?.length) {
      mixer = new THREE.AnimationMixer(gltf.scene);
      gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
    }

    updateTargetScrollProgress();
    setStatus(cameraFromGLB ? 'GLB carregado / câmera do arquivo aplicada' : 'GLB carregado / câmera fallback aplicada');
  },
  (event) => {
    if (!statusEl) return;

    if (event.total) {
      const progress = Math.round((event.loaded / event.total) * 100);
      statusEl.textContent = `carregando modelo 3D... ${progress}%`;
    } else {
      statusEl.textContent = 'carregando modelo 3D...';
    }
  },
  (error) => {
    window.clearTimeout(loadingTimeout);
    console.error('Falha ao carregar GLB:', error);
    setStatus('modelo 3D não carregou: verifique assets/cam.glb', 4200);
  }
);

window.addEventListener('scroll', updateTargetScrollProgress, { passive: true });

window.addEventListener('resize', () => {
  resizeRenderer();
  updateTargetScrollProgress();
  applyScrollCamera(currentScrollProgress);
});

animate();
