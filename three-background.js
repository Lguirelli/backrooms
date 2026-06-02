import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/postprocessing/BokehPass.js';
import { AfterimagePass } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/postprocessing/AfterimagePass.js';

/*
  BACKGROUND 3D LIMPO — CAM1
  - Usa somente assets/cam.glb
  - Preserva materiais/texturas originais do GLB
  - Usa câmera existente do GLB como base
  - Mantém luzes de reforço no Three.js
  - Adiciona:
    1. respiração de lente
    2. movimento em arco leve
    3. blur leve de movimento
    4. depth of field 1.2
*/

const CONFIG = {
  modelPath: './assets/cam.glb',
  clearColor: 0x080807,
  exposure: 1.55,

  camera: {
    fallbackFov: 42,
    near: 0.1,
    far: 4000,

    scrollForwardDistance: 9.5,
    rightTurnRadians: -0.48,
    rightTurnPower: 1.35,

    arcStrength: 1.15,
    arcVerticalStrength: 0.18,

    lensBreathingStrength: 0.45,
    lensBreathingSpeed: 0.38,

    wigglePositionStrength: 0.01,
    wiggleRotationStrength: 0.0035,
    wiggleSpeed: 0.82
  },

  lights: {
    ambientIntensity: 1.25,
    keyIntensity: 1.15,
    fillIntensity: 0.72,
    frontIntensity: 0.48,
    ceilingBoostIntensity: 0.75
  },

  post: {
    enabled: true,

    // Blur leve de movimento. Quanto mais perto de 1, mais rastro.
    // 0.86 a 0.90 costuma ser sutil.
    motionBlurDamp: 0.875,

    // Depth of field solicitado.
    dofAperture: 1.2,

    // Distância base do foco.
    dofFocus: 18,

    // Quanto maior, mais suave/menos agressivo.
    dofMaxBlur: 0.006
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

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.25 : 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = CONFIG.exposure;
renderer.setClearColor(CONFIG.clearColor, 1);
renderer.shadowMap.enabled = false;

const scene = new THREE.Scene();
scene.background = new THREE.Color(CONFIG.clearColor);

const camera = new THREE.PerspectiveCamera(
  CONFIG.camera.fallbackFov,
  window.innerWidth / window.innerHeight,
  CONFIG.camera.near,
  CONFIG.camera.far
);

const renderPass = new RenderPass(scene, camera);
const afterimagePass = new AfterimagePass(CONFIG.post.motionBlurDamp);
const bokehPass = new BokehPass(scene, camera, {
  focus: CONFIG.post.dofFocus,
  aperture: CONFIG.post.dofAperture,
  maxblur: CONFIG.post.dofMaxBlur,
  width: window.innerWidth,
  height: window.innerHeight
});

const composer = new EffectComposer(renderer);
composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.25 : 1.75));
composer.setSize(window.innerWidth, window.innerHeight);
composer.addPass(renderPass);

if (CONFIG.post.enabled) {
  composer.addPass(afterimagePass);
  composer.addPass(bokehPass);
}

const ambient = new THREE.HemisphereLight(0xffffff, 0x252016, CONFIG.lights.ambientIntensity);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xfff0cf, CONFIG.lights.keyIntensity);
keyLight.position.set(8, 10, 4);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xd8e0ff, CONFIG.lights.fillIntensity);
fillLight.position.set(-8, 4, -6);
scene.add(fillLight);

const frontLight = new THREE.PointLight(0xffffff, CONFIG.lights.frontIntensity, 34);
frontLight.position.set(0, 4, 7);
scene.add(frontLight);

const ceilingBoost = new THREE.PointLight(0xffd38a, CONFIG.lights.ceilingBoostIntensity, 48);
ceilingBoost.position.set(0, 7, -4);
scene.add(ceilingBoost);

let gltfRoot = null;
let loadedCamera = null;
let baseFov = CONFIG.camera.fallbackFov;

const baseCameraPosition = new THREE.Vector3();
const baseCameraQuaternion = new THREE.Quaternion();
const baseCameraWorldPosition = new THREE.Vector3();
const baseCameraWorldQuaternion = new THREE.Quaternion();

const lastScrollState = {
  progress: -1,
  width: window.innerWidth,
  height: window.innerHeight
};

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

function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutSine(t) {
  return Math.sin((t * Math.PI) / 2);
}

function preserveOriginalGLBMaterials(root) {
  root.traverse((object) => {
    if (!object.isMesh) return;

    object.frustumCulled = false;
    object.castShadow = false;
    object.receiveShadow = false;

    const materials = Array.isArray(object.material) ? object.material : [object.material];

    materials.forEach((material) => {
      if (!material) return;

      // Não altera textura, emissive, roughness, metalness, normal, aoMap ou UV.
      // Apenas força atualização para o renderer reconhecer o estado original importado.
      material.needsUpdate = true;
    });
  });
}

function syncGLBLights(root) {
  root.traverse((object) => {
    if (!object.isLight) return;

    // Mantém luzes vindas do Blender, apenas garante um mínimo visível.
    if (object.intensity !== undefined && object.intensity < 0.4) {
      object.intensity = 0.4;
    }

    if (object.isPointLight || object.isSpotLight) {
      object.distance = object.distance || 80;
      object.decay = object.decay || 1.2;
    }
  });
}

function findBestCamera(gltf) {
  if (gltf.cameras && gltf.cameras.length) {
    return gltf.cameras[0];
  }

  let found = null;

  gltf.scene.traverse((object) => {
    if (!found && object.isCamera) {
      found = object;
    }
  });

  return found;
}

function applyCameraBaseFromGLB(sourceCamera) {
  loadedCamera = sourceCamera;

  sourceCamera.updateMatrixWorld(true);
  sourceCamera.getWorldPosition(baseCameraWorldPosition);
  sourceCamera.getWorldQuaternion(baseCameraWorldQuaternion);

  baseCameraPosition.copy(baseCameraWorldPosition);
  baseCameraQuaternion.copy(baseCameraWorldQuaternion);

  baseFov = sourceCamera.fov || CONFIG.camera.fallbackFov;

  camera.fov = baseFov;
  camera.near = sourceCamera.near || CONFIG.camera.near;
  camera.far = sourceCamera.far || CONFIG.camera.far;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  camera.position.copy(baseCameraPosition);
  camera.quaternion.copy(baseCameraQuaternion);
}

function updatePostFromScroll(scroll) {
  if (!CONFIG.post.enabled) return;

  const eased = easeInOutCubic(scroll);

  bokehPass.uniforms.focus.value = CONFIG.post.dofFocus - eased * 3.5;
  bokehPass.uniforms.aperture.value = CONFIG.post.dofAperture;
  bokehPass.uniforms.maxblur.value = CONFIG.post.dofMaxBlur;

  // Motion blur ligeiramente mais visível quando a câmera anda mais.
  afterimagePass.uniforms.damp.value = CONFIG.post.motionBlurDamp + eased * 0.012;
}

function updateCameraFromScroll() {
  if (!loadedCamera) return;

  const scroll = getScrollProgress();
  const eased = easeInOutCubic(scroll);
  const easeOut = easeOutSine(scroll);
  const time = performance.now() * 0.001;

  const forward = new THREE.Vector3(0, 0, -1)
    .applyQuaternion(baseCameraQuaternion)
    .normalize();

  const right = new THREE.Vector3(1, 0, 0)
    .applyQuaternion(baseCameraQuaternion)
    .normalize();

  const up = new THREE.Vector3(0, 1, 0)
    .applyQuaternion(baseCameraQuaternion)
    .normalize();

  const moveForward = forward.clone().multiplyScalar(eased * CONFIG.camera.scrollForwardDistance);

  // Movimento em arco leve.
  const arc = Math.sin(scroll * Math.PI) * CONFIG.camera.arcStrength;
  const arcVertical = Math.sin(scroll * Math.PI) * CONFIG.camera.arcVerticalStrength;
  const moveArc = right.clone().multiplyScalar(arc).add(up.clone().multiplyScalar(arcVertical));

  // Rotação progressiva para a direita.
  const rightTurn = Math.pow(scroll, CONFIG.camera.rightTurnPower) * CONFIG.camera.rightTurnRadians;

  // Wiggle constante.
  const wigglePosX = Math.sin(time * CONFIG.camera.wiggleSpeed * 1.37) * CONFIG.camera.wigglePositionStrength;
  const wigglePosY = Math.cos(time * CONFIG.camera.wiggleSpeed * 1.11) * CONFIG.camera.wigglePositionStrength * 0.55;
  const wiggleYaw = Math.sin(time * CONFIG.camera.wiggleSpeed * 1.25) * CONFIG.camera.wiggleRotationStrength;
  const wigglePitch = Math.cos(time * CONFIG.camera.wiggleSpeed * 0.93) * CONFIG.camera.wiggleRotationStrength * 0.7;

  camera.position.copy(baseCameraPosition).add(moveForward).add(moveArc);
  camera.position.add(right.clone().multiplyScalar(wigglePosX));
  camera.position.add(up.clone().multiplyScalar(wigglePosY));

  const scrollRotation = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(wigglePitch, rightTurn + wiggleYaw, 0, 'YXZ')
  );

  camera.quaternion.copy(baseCameraQuaternion).multiply(scrollRotation);

  // Respiração de lente.
  camera.fov =
    baseFov +
    Math.sin(time * CONFIG.camera.lensBreathingSpeed) * CONFIG.camera.lensBreathingStrength -
    easeOut * 1.15;

  camera.updateProjectionMatrix();

  updatePostFromScroll(scroll);
}

const loader = new GLTFLoader();

loader.load(
  CONFIG.modelPath,
  (gltf) => {
    gltfRoot = gltf.scene;

    preserveOriginalGLBMaterials(gltfRoot);
    syncGLBLights(gltfRoot);

    scene.add(gltfRoot);

    const sceneCamera = findBestCamera(gltf);

    if (sceneCamera) {
      applyCameraBaseFromGLB(sceneCamera);
      updateCameraFromScroll();
      setStatus('cam1.glb carregado / câmera original aplicada');
    } else {
      camera.position.set(0, 2, 8);
      camera.lookAt(0, 2, 0);
      setStatus('cam1.glb carregado / câmera padrão usada');
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

function renderScene() {
  if (CONFIG.post.enabled) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }
}

function animate() {
  requestAnimationFrame(animate);

  updateCameraFromScroll();

  const time = performance.now() * 0.001;
  frontLight.intensity = CONFIG.lights.frontIntensity + Math.sin(time * 0.8) * 0.025;
  ceilingBoost.intensity = CONFIG.lights.ceilingBoostIntensity + Math.sin(time * 0.55) * 0.035;

  renderScene();
}

animate();

window.addEventListener('resize', () => {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.25 : 1.75);

  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  composer.setPixelRatio(pixelRatio);
  composer.setSize(window.innerWidth, window.innerHeight);

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  lastScrollState.width = window.innerWidth;
  lastScrollState.height = window.innerHeight;

  updateCameraFromScroll();
});
