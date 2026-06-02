import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';

/*
  BACKGROUND 3D — CAM1 LIMPO
  ---------------------------------------------------------
  Regras deste arquivo:
  - usa somente assets/cam.glb
  - volta para o cam1.glb
  - usa a câmera existente do GLB como base
  - preserva 100% dos materiais/texturas do GLB
  - não clona material
  - não troca textura
  - não altera emissive/roughness/metalness/normal/aoMap
  - não altera flipY/colorSpace das texturas importadas

  Movimento:
  - scroll empurra a câmera para frente
  - scroll gera movimento em arco leve
  - scroll gira progressivamente para a direita
  - mouse gera wiggle/parallax, sem wiggle automático constante
  - respiração de lente sutil
*/

const CONFIG = {
  // Query string evita cache do cam2/cam quebrado no navegador.
  modelPath: './assets/cam.glb?v=cam1-material-camera-fix-04',

  clearColor: 0x080807,
  exposure: 1.42,

  camera: {
    fallbackFov: 42,
    near: 0.1,
    far: 4000,

    scrollForwardDistance: 14,
    rightTurnRadians: -0.72,
    rightTurnPower: 1.22,

    arcStrength: 1.35,
    arcVerticalStrength: 0.12,

    lensBreathingStrength: 0.38,
    lensBreathingSpeed: 0.34,

    mousePositionStrength: 0.035,
    mouseRotationStrength: 0.038,
    mouseVelocityStrength: 0.018,
    mouseLerp: 0.075
  },

  lights: {
    // Mantém luzes do GLB e adiciona reforços leves por fora.
    ambientIntensity: 0.9,
    keyIntensity: 0.85,
    fillIntensity: 0.5,
    frontIntensity: 0.32,
    ceilingBoostIntensity: 0.5
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

function getPixelRatio() {
  return Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.25 : 1.75);
}

renderer.setPixelRatio(getPixelRatio());
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

const ambient = new THREE.HemisphereLight(0xffffff, 0x272016, CONFIG.lights.ambientIntensity);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xfff1d0, CONFIG.lights.keyIntensity);
keyLight.position.set(9, 11, 5);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xd7e0ff, CONFIG.lights.fillIntensity);
fillLight.position.set(-8, 4, -7);
scene.add(fillLight);

const frontLight = new THREE.PointLight(0xffffff, CONFIG.lights.frontIntensity, 36);
frontLight.position.set(0, 4, 7);
scene.add(frontLight);

const ceilingBoost = new THREE.PointLight(0xffd28a, CONFIG.lights.ceilingBoostIntensity, 52);
ceilingBoost.position.set(0, 7, -5);
scene.add(ceilingBoost);

let loadedCamera = null;
let baseFov = CONFIG.camera.fallbackFov;

const baseCameraPosition = new THREE.Vector3();
const baseCameraQuaternion = new THREE.Quaternion();

const mouse = {
  x: 0,
  y: 0,
  targetX: 0,
  targetY: 0,
  velocityX: 0,
  velocityY: 0,
  lastX: 0,
  lastY: 0,
  hasPointer: false
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

function preserveOriginalGLB(root) {
  root.traverse((object) => {
    if (object.isMesh) {
      object.frustumCulled = false;
      object.castShadow = false;
      object.receiveShadow = false;

      // Não tocar no material. O GLTFLoader já interpreta o GLB.
      // Nenhum material é clonado, substituído ou editado aqui.
    }

    if (object.isLight) {
      // Mantém as luzes do Blender e só garante que elas continuem ativas.
      object.visible = true;
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

  sourceCamera.getWorldPosition(baseCameraPosition);
  sourceCamera.getWorldQuaternion(baseCameraQuaternion);

  baseFov = sourceCamera.fov || CONFIG.camera.fallbackFov;

  camera.fov = baseFov;
  camera.near = sourceCamera.near || CONFIG.camera.near;
  camera.far = sourceCamera.far || CONFIG.camera.far;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  camera.position.copy(baseCameraPosition);
  camera.quaternion.copy(baseCameraQuaternion);
}

function updateMouseSmooth() {
  mouse.x += (mouse.targetX - mouse.x) * CONFIG.camera.mouseLerp;
  mouse.y += (mouse.targetY - mouse.y) * CONFIG.camera.mouseLerp;

  mouse.velocityX *= 0.88;
  mouse.velocityY *= 0.88;
}

function updateCamera() {
  if (!loadedCamera) return;

  updateMouseSmooth();

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

  // Movimento em arco leve pelo scroll.
  const arc = Math.sin(scroll * Math.PI) * CONFIG.camera.arcStrength;
  const arcVertical = Math.sin(scroll * Math.PI) * CONFIG.camera.arcVerticalStrength;
  const moveArc = right.clone().multiplyScalar(arc).add(up.clone().multiplyScalar(arcVertical));

  // Mouse wiggle/parallax. Não existe wiggle automático constante.
  const mousePosition = right.clone()
    .multiplyScalar(mouse.x * CONFIG.camera.mousePositionStrength)
    .add(up.clone().multiplyScalar(-mouse.y * CONFIG.camera.mousePositionStrength * 0.65));

  const velocityKick = right.clone()
    .multiplyScalar(mouse.velocityX * CONFIG.camera.mouseVelocityStrength)
    .add(up.clone().multiplyScalar(-mouse.velocityY * CONFIG.camera.mouseVelocityStrength * 0.5));

  camera.position
    .copy(baseCameraPosition)
    .add(moveForward)
    .add(moveArc)
    .add(mousePosition)
    .add(velocityKick);

  const rightTurn = Math.pow(scroll, CONFIG.camera.rightTurnPower) * CONFIG.camera.rightTurnRadians;

  const mouseYaw = mouse.x * CONFIG.camera.mouseRotationStrength + mouse.velocityX * 0.004;
  const mousePitch = -mouse.y * CONFIG.camera.mouseRotationStrength * 0.58 - mouse.velocityY * 0.0025;

  const scrollRotation = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(mousePitch, rightTurn + mouseYaw, 0, 'YXZ')
  );

  camera.quaternion.copy(baseCameraQuaternion).multiply(scrollRotation);

  // Respiração de lente sutil.
  camera.fov =
    baseFov +
    Math.sin(time * CONFIG.camera.lensBreathingSpeed) * CONFIG.camera.lensBreathingStrength -
    easeOut * 0.9;

  camera.updateProjectionMatrix();
}

window.addEventListener('pointermove', (event) => {
  const nx = (event.clientX / window.innerWidth) * 2 - 1;
  const ny = (event.clientY / window.innerHeight) * 2 - 1;

  if (mouse.hasPointer) {
    mouse.velocityX += nx - mouse.lastX;
    mouse.velocityY += ny - mouse.lastY;
  }

  mouse.targetX = nx;
  mouse.targetY = ny;
  mouse.lastX = nx;
  mouse.lastY = ny;
  mouse.hasPointer = true;
}, { passive: true });

window.addEventListener('pointerleave', () => {
  mouse.targetX = 0;
  mouse.targetY = 0;
  mouse.velocityX = 0;
  mouse.velocityY = 0;
}, { passive: true });

const loader = new GLTFLoader();

loader.load(
  CONFIG.modelPath,
  (gltf) => {
    preserveOriginalGLB(gltf.scene);
    scene.add(gltf.scene);
    gltf.scene.updateMatrixWorld(true);

    const sceneCamera = findBestCamera(gltf);

    if (sceneCamera) {
      applyCameraBaseFromGLB(sceneCamera);
      updateCamera();
      setStatus('cam1.glb carregado / materiais originais preservados');
    } else {
      loadedCamera = camera;
      camera.position.set(0, 2, 8);
      camera.lookAt(0, 2, 0);
      camera.updateProjectionMatrix();
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

function animate() {
  requestAnimationFrame(animate);

  updateCamera();

  const time = performance.now() * 0.001;
  frontLight.intensity = CONFIG.lights.frontIntensity + Math.sin(time * 0.8) * 0.018;
  ceilingBoost.intensity = CONFIG.lights.ceilingBoostIntensity + Math.sin(time * 0.55) * 0.025;

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  renderer.setPixelRatio(getPixelRatio());
  renderer.setSize(window.innerWidth, window.innerHeight);

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  updateCamera();
});
