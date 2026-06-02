import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/postprocessing/BokehPass.js';
import { AfterimagePass } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/postprocessing/AfterimagePass.js';

/*
  BACKGROUND 3D — CAM1 COM CÂMERA RESTAURADA

  Importante:
  - cam1.glb não possui câmera exportada.
  - Por isso, a posição inicial foi restaurada manualmente com a câmera que estava funcionando.
  - O modelo usado continua sendo o cam1, para recuperar os materiais.
  - As luzes de reforço foram mantidas no Three.js.

  O código não altera materiais do GLB:
  - não clona material
  - não troca textura
  - não mexe em emissive
  - não mexe em roughness/metalness
  - não mexe em normalMap/aoMap
  - não altera flipY/colorSpace das texturas importadas
*/

const CONFIG = {
  modelPath: './assets/cam.glb?v=cam1-fixed-camera-01',
  clearColor: 0x080807,
  exposure: 1.48,

  camera: {
    // Câmera restaurada da versão que tinha enquadramento correto.
    position: new THREE.Vector3(-12.121020317077637, 0.8076560497283936, 0.593407154083252),
    quaternion: new THREE.Quaternion(
      0.01360255479812622,
      -0.690179705619812,
      0.012977774254977703,
      0.7233937978744507
    ),

    fov: THREE.MathUtils.radToDeg(0.39959652046304894),
    near: 0.1,
    far: 1000,

    scrollForwardDistance: 9.8,
    rightTurnRadians: -0.54,
    rightTurnPower: 1.32,

    arcStrength: 1.05,
    arcVerticalStrength: 0.12,

    lensBreathingStrength: 0.42,
    lensBreathingSpeed: 0.38,

    mousePositionStrength: 0.055,
    mouseRotationStrength: 0.025,
    mouseEase: 0.075
  },

  lights: {
    ambientIntensity: 1.15,
    keyIntensity: 1.0,
    fillIntensity: 0.64,
    frontIntensity: 0.42,

    // Luzes equivalentes às duas luzes que você adicionou no Blender.
    blenderPointIntensity: 1.1,
    blenderPointDistance: 58
  },

  post: {
    enabled: true,

    // Blur leve de movimento.
    motionBlurDamp: 0.872,

    // Depth of field solicitado.
    dofAperture: 1.2,
    dofFocus: 17.5,
    dofMaxBlur: 0.0048
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
  return Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.2 : 1.65);
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
  CONFIG.camera.fov,
  window.innerWidth / window.innerHeight,
  CONFIG.camera.near,
  CONFIG.camera.far
);

const baseCameraPosition = CONFIG.camera.position.clone();
const baseCameraQuaternion = CONFIG.camera.quaternion.clone().normalize();
const baseFov = CONFIG.camera.fov;

camera.position.copy(baseCameraPosition);
camera.quaternion.copy(baseCameraQuaternion);
camera.updateProjectionMatrix();

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
composer.setPixelRatio(getPixelRatio());
composer.setSize(window.innerWidth, window.innerHeight);
composer.addPass(renderPass);

if (CONFIG.post.enabled) {
  composer.addPass(afterimagePass);
  composer.addPass(bokehPass);
}

const ambient = new THREE.HemisphereLight(0xffffff, 0x2a2418, CONFIG.lights.ambientIntensity);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xfff0cf, CONFIG.lights.keyIntensity);
keyLight.position.set(8, 10, 4);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xd8e0ff, CONFIG.lights.fillIntensity);
fillLight.position.set(-8, 4, -6);
scene.add(fillLight);

const frontLight = new THREE.PointLight(0xffffff, CONFIG.lights.frontIntensity, 34);
frontLight.position.set(-7.5, 2.1, 2.8);
scene.add(frontLight);

// Mantém as duas luzes que você adicionou para resolver iluminação,
// mas como luzes no runtime para funcionarem mesmo usando cam1.glb.
const pointA = new THREE.PointLight(0xffd49a, CONFIG.lights.blenderPointIntensity, CONFIG.lights.blenderPointDistance, 1.2);
pointA.position.set(-3.7223145961761475, 0.9184240698814392, -3.2319529056549072);
scene.add(pointA);

const pointB = new THREE.PointLight(0xffd49a, CONFIG.lights.blenderPointIntensity, CONFIG.lights.blenderPointDistance, 1.2);
pointB.position.set(3.6361539363861084, 0.9184240698814392, 7.016952991485596);
scene.add(pointB);

let modelLoaded = false;

const mouse = {
  targetX: 0,
  targetY: 0,
  currentX: 0,
  currentY: 0,
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

function preserveOriginalGLBMaterials(root) {
  root.traverse((object) => {
    if (!object.isMesh) return;

    object.frustumCulled = false;
    object.castShadow = false;
    object.receiveShadow = false;

    const materials = Array.isArray(object.material) ? object.material : [object.material];

    materials.forEach((material) => {
      if (!material) return;

      // Segurança: não modificar os materiais do cam1.
      material.needsUpdate = true;
    });
  });
}

function updateMouseCameraInfluence() {
  mouse.currentX += (mouse.targetX - mouse.currentX) * CONFIG.camera.mouseEase;
  mouse.currentY += (mouse.targetY - mouse.currentY) * CONFIG.camera.mouseEase;
}

function updatePostFromScroll(scroll) {
  if (!CONFIG.post.enabled) return;

  const eased = easeInOutCubic(scroll);

  bokehPass.uniforms.focus.value = CONFIG.post.dofFocus - eased * 3.0;
  bokehPass.uniforms.aperture.value = CONFIG.post.dofAperture;
  bokehPass.uniforms.maxblur.value = CONFIG.post.dofMaxBlur;

  afterimagePass.uniforms.damp.value = CONFIG.post.motionBlurDamp + eased * 0.01;
}

function updateCameraFromScrollAndMouse() {
  const scroll = getScrollProgress();
  const eased = easeInOutCubic(scroll);
  const easeOut = easeOutSine(scroll);
  const time = performance.now() * 0.001;

  updateMouseCameraInfluence();

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

  // Movimento de mouse, substituindo o wiggle constante.
  const mouseMove = right.clone()
    .multiplyScalar(mouse.currentX * CONFIG.camera.mousePositionStrength)
    .add(up.clone().multiplyScalar(-mouse.currentY * CONFIG.camera.mousePositionStrength * 0.55));

  camera.position.copy(baseCameraPosition).add(moveForward).add(moveArc).add(mouseMove);

  const rightTurn = Math.pow(scroll, CONFIG.camera.rightTurnPower) * CONFIG.camera.rightTurnRadians;

  const mouseYaw = mouse.currentX * CONFIG.camera.mouseRotationStrength;
  const mousePitch = mouse.currentY * CONFIG.camera.mouseRotationStrength * 0.65;

  const scrollRotation = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(mousePitch, rightTurn + mouseYaw, 0, 'YXZ')
  );

  camera.quaternion.copy(baseCameraQuaternion).multiply(scrollRotation);

  // Respiração de lente.
  camera.fov =
    baseFov +
    Math.sin(time * CONFIG.camera.lensBreathingSpeed) * CONFIG.camera.lensBreathingStrength -
    easeOut * 1.05;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  updatePostFromScroll(scroll);
}

const loader = new GLTFLoader();

loader.load(
  CONFIG.modelPath,
  (gltf) => {
    modelLoaded = true;

    preserveOriginalGLBMaterials(gltf.scene);
    scene.add(gltf.scene);

    updateCameraFromScrollAndMouse();
    setStatus('cam1.glb carregado / câmera restaurada');
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

  updateCameraFromScrollAndMouse();

  const time = performance.now() * 0.001;
  frontLight.intensity = CONFIG.lights.frontIntensity + Math.sin(time * 0.8) * 0.018;

  renderScene();
}

animate();

window.addEventListener('pointermove', (event) => {
  const x = event.clientX / Math.max(window.innerWidth, 1);
  const y = event.clientY / Math.max(window.innerHeight, 1);

  mouse.targetX = (x - 0.5) * 2;
  mouse.targetY = (y - 0.5) * 2;
  mouse.hasPointer = true;
}, { passive: true });

window.addEventListener('pointerleave', () => {
  mouse.targetX = 0;
  mouse.targetY = 0;
}, { passive: true });

window.addEventListener('scroll', () => {
  updateCameraFromScrollAndMouse();
}, { passive: true });

window.addEventListener('resize', () => {
  const pixelRatio = getPixelRatio();

  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  composer.setPixelRatio(pixelRatio);
  composer.setSize(window.innerWidth, window.innerHeight);

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  updateCameraFromScrollAndMouse();
});
