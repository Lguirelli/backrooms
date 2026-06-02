import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/environments/RoomEnvironment.js';

const CONFIG = {
  modelUrl: './assets/cam.glb',

  // Correção principal: o GLB atual está vindo muito escuro/baked.
  exposure: 2.35,
  background: 0x15120d,

  // Mantém o modelo visível sem depender de fog/overlay escuro.
  fogEnabled: false,
  fogColor: 0x15120d,
  fogDensity: 0.0004,

  // Movimento de scroll.
  scrollForwardDistance: 7.5,
  scrollRightDrift: 0.32,
  rightTurnRadians: -1.08,
  rightTurnPower: 1.28,
  smoothFactor: 0.078,

  // Wiggle constante e leve.
  wigglePositionStrength: 0.015,
  wiggleRotationStrength: 0.0045,
  wiggleSpeed: 0.82,

  // Compensação de textura escura. Não substitui material do GLB.
  materialBrightnessLift: 0.18,
  textureEmissiveLift: 0.34,

  // Ceiling_Lights ilumina visualmente e também gera luz real no Three.js.
  ceilingLightEmissiveIntensity: 5.5,
  generatedLightIntensity: 4.8,
  generatedLightDistance: 30,
  maxGeneratedLights: 8
};

const canvas = document.getElementById('scene');
const statusEl = document.getElementById('sceneStatus');

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance'
});

function setRendererSize() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.35 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
}

setRendererSize();
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = CONFIG.exposure;
renderer.setClearColor(CONFIG.background, 1);
renderer.shadowMap.enabled = false;

const scene = new THREE.Scene();
scene.background = new THREE.Color(CONFIG.background);

if (CONFIG.fogEnabled) {
  scene.fog = new THREE.FogExp2(CONFIG.fogColor, CONFIG.fogDensity);
}

const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(renderer), 0.04).texture;

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 1.7, 6);

const loader = new GLTFLoader();

let model = null;
let basePosition = new THREE.Vector3();
let baseQuaternion = new THREE.Quaternion();
let targetPosition = new THREE.Vector3();
let targetQuaternion = new THREE.Quaternion();
let smoothPosition = new THREE.Vector3();
let smoothQuaternion = new THREE.Quaternion();
let generatedLights = 0;

const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const euler = new THREE.Euler(0, 0, 0, 'YXZ');
const whiteLift = new THREE.Color(0xffffff);
const neutralLift = new THREE.Color(0xfff3df);

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

function materialName(material) {
  return String(material?.name || '').toLowerCase();
}

function isLightMaterial(material) {
  const name = materialName(material);
  return name.includes('ceiling_lights') || name.includes('light') || name.includes('lamp') || name.includes('luz') || name.includes('emissive');
}

function prepareTexture(texture, colorSpace) {
  if (!texture) return;
  texture.colorSpace = colorSpace;
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  texture.needsUpdate = true;
}

function addGeneratedLightFromMesh(object) {
  if (generatedLights >= CONFIG.maxGeneratedLights) return;

  const box = new THREE.Box3().setFromObject(object);
  if (!Number.isFinite(box.min.x) || !Number.isFinite(box.max.x)) return;

  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  const light = new THREE.PointLight(
    0xffddb0,
    CONFIG.generatedLightIntensity,
    Math.max(CONFIG.generatedLightDistance, size.length() * 0.9)
  );

  light.name = `generated_ceiling_light_${generatedLights + 1}`;
  light.position.copy(center);
  light.position.y -= 0.35;
  scene.add(light);

  generatedLights += 1;
}

function preserveAndFixGLBMaterials(root) {
  root.traverse((object) => {
    if (!object.isMesh || !object.material) return;

    object.frustumCulled = false;
    object.castShadow = false;
    object.receiveShadow = false;

    if (object.geometry) {
      object.geometry.computeVertexNormals();
      object.geometry.computeBoundingBox();
    }

    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const objectUsesLightMaterial = materials.some(isLightMaterial);

    materials.forEach((material) => {
      if (!material) return;

      material.side = THREE.DoubleSide;

      prepareTexture(material.map, THREE.SRGBColorSpace);
      prepareTexture(material.emissiveMap, THREE.SRGBColorSpace);
      prepareTexture(material.normalMap, THREE.NoColorSpace);
      prepareTexture(material.roughnessMap, THREE.NoColorSpace);
      prepareTexture(material.metalnessMap, THREE.NoColorSpace);
      prepareTexture(material.aoMap, THREE.NoColorSpace);
      prepareTexture(material.lightMap, THREE.NoColorSpace);

      // O GLB está escuro. Desligamos AO/lightMap em runtime para não duplicar escurecimento.
      if (material.aoMap) {
        material.aoMapIntensity = 0;
      }
      if (material.lightMap) {
        material.lightMapIntensity = 0;
      }

      if (isLightMaterial(material)) {
        material.color = material.color || new THREE.Color(0xffffff);
        material.color.set(0xfff0c8);
        material.emissive = new THREE.Color(0xffd28a);
        material.emissiveIntensity = CONFIG.ceilingLightEmissiveIntensity;
      } else {
        // Lift controlado: preserva as texturas, mas tira a cena do preto.
        if (material.color) {
          material.color.lerp(whiteLift, CONFIG.materialBrightnessLift);
        }

        // Compensação visual para GLB/texturas baked escuros.
        // Não altera o arquivo GLB, só deixa o background legível no navegador.
        if (material.map) {
          material.emissive = neutralLift.clone();
          material.emissiveMap = material.map;
          material.emissiveIntensity = CONFIG.textureEmissiveLift;
        } else {
          material.emissive = neutralLift.clone();
          material.emissiveIntensity = CONFIG.textureEmissiveLift * 0.45;
        }
      }

      material.roughness = Math.max(material.roughness ?? 0.82, 0.72);
      material.metalness = material.metalness ?? 0;
      material.envMapIntensity = Math.max(material.envMapIntensity || 0, 1.15);
      material.needsUpdate = true;
    });

    if (objectUsesLightMaterial) {
      addGeneratedLightFromMesh(object);
    }
  });
}

function addSceneLights() {
  const ambient = new THREE.HemisphereLight(0xfff7ea, 0x4a3926, 2.8);
  ambient.name = 'realistic_visibility_ambient';
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xffead0, 2.15);
  key.name = 'realistic_visibility_key';
  key.position.set(6, 9, 5);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xd9e9ff, 1.2);
  fill.name = 'realistic_visibility_fill';
  fill.position.set(-7, 4, -5);
  scene.add(fill);

  const frontSoft = new THREE.PointLight(0xfff2db, 2.2, 36);
  frontSoft.name = 'realistic_visibility_front_soft';
  frontSoft.position.set(0, 2.8, 6);
  scene.add(frontSoft);

  const midSoft = new THREE.PointLight(0xffddb8, 2.4, 42);
  midSoft.name = 'realistic_visibility_mid_soft';
  midSoft.position.set(0, 3.4, -3.5);
  scene.add(midSoft);
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
  const sourceCamera = gltfCamera || camera;

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
    preserveAndFixGLBMaterials(model);
    scene.add(model);

    syncBaseCamera(getCameraFromGLB(gltf));
    addSceneLights();
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
  setRendererSize();
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
