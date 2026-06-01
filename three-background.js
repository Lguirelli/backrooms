import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';

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
renderer.toneMappingExposure = 1.0;
renderer.setClearColor(0x050505, 1);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);

// Camera provisória. Será substituída pela câmera exportada do GLB.
let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 3000);
camera.position.set(168.57467651367188, 4.034862995147705, 0.791530966758728);

const ambient = new THREE.HemisphereLight(0xfff2c7, 0x171109, 1.15);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffe8b0, 1.35);
keyLight.position.set(120, 80, 50);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xb8ae68, 0.55);
fillLight.position.set(-80, 35, -40);
scene.add(fillLight);

let mixer = null;
let actions = [];
let animationDuration = 1;
let hasCameraAnimation = false;
let modelLoaded = false;

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

function preserveGLBMaterials(root) {
  root.traverse((object) => {
    if (!object.isMesh) return;

    object.frustumCulled = false;

    const materials = Array.isArray(object.material) ? object.material : [object.material];

    materials.filter(Boolean).forEach((material) => {
      // Não altera cor, roughness ou metalness. Preserva o material original do GLB.
      material.side = THREE.DoubleSide;

      if (material.map) {
        material.map.colorSpace = THREE.SRGBColorSpace;
        material.map.needsUpdate = true;
      }

      if (material.emissiveMap) {
        material.emissiveMap.colorSpace = THREE.SRGBColorSpace;
        material.emissiveMap.needsUpdate = true;
      }

      material.needsUpdate = true;
    });
  });
}

function bindCameraAnimation(gltf, exportedCamera) {
  if (!gltf.animations || !gltf.animations.length) return;

  const cameraName = exportedCamera?.name || 'Camera';

  mixer = new THREE.AnimationMixer(gltf.scene);
  actions = [];

  gltf.animations.forEach((clip) => {
    const action = mixer.clipAction(clip);
    action.reset();
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.enabled = true;
    action.paused = false;
    action.play();

    actions.push(action);

    const clipHasCameraTrack = clip.tracks.some((track) => {
      const name = track.name || '';
      return name.includes(cameraName) || name.includes('Camera');
    });

    if (clipHasCameraTrack) {
      hasCameraAnimation = true;
      animationDuration = Math.max(animationDuration, clip.duration || 1);
    }
  });

  if (!hasCameraAnimation && gltf.animations[0]) {
    animationDuration = gltf.animations[0].duration || 1;
  }

  setAnimationTimeFromScroll();
}

function setAnimationTimeFromScroll() {
  const progress = getScrollProgress();
  const time = progress * animationDuration;

  if (mixer && actions.length) {
    actions.forEach((action) => {
      action.enabled = true;
      action.paused = false;
      action.time = time;
    });

    mixer.setTime(time);
    mixer.update(0);
    scene.updateMatrixWorld(true);

    if (camera) {
      camera.updateMatrixWorld(true);
      camera.updateProjectionMatrix();
    }

    return;
  }

  // Fallback exato por scroll se algum GLB for publicado sem animação.
  const x = THREE.MathUtils.lerp(168.57467651367188, 39.52294921875, progress);
  const z = THREE.MathUtils.lerp(0.791530966758728, -3.4, progress);
  camera.position.set(x, 4.034862995147705, z);
  camera.rotation.set(1.58, 0.0015, THREE.MathUtils.lerp(2.758552312850952, 1.57088041305542, progress), 'XYZ');
}

const loader = new GLTFLoader();

const timeout = window.setTimeout(() => {
  if (!modelLoaded) {
    setStatus('carregamento lento do GLB', 2400);
  }
}, 8000);

loader.load(
  './assets/backrooms.glb',
  (gltf) => {
    window.clearTimeout(timeout);
    modelLoaded = true;

    // Mantém o GLB exatamente nas coordenadas exportadas.
    // Não centraliza, não escala e não rotaciona, porque isso quebra a câmera exportada.
    preserveGLBMaterials(gltf.scene);
    scene.add(gltf.scene);

    const exportedCamera = gltf.cameras?.[0];

    if (exportedCamera && exportedCamera.isCamera) {
      camera = exportedCamera;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.near = Math.max(0.01, camera.near || 0.05);
      camera.far = Math.max(3000, camera.far || 1000);
      camera.updateProjectionMatrix();
    }

    bindCameraAnimation(gltf, exportedCamera);
    setAnimationTimeFromScroll();

    setStatus(hasCameraAnimation ? 'câmera do GLB conectada ao scroll' : 'GLB carregado / fallback de câmera ativo');
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
    console.error('Falha ao carregar GLB:', error);
    setStatus('GLB não carregou: verifique assets/backrooms.glb', 4000);
  }
);

window.addEventListener('scroll', setAnimationTimeFromScroll, { passive: true });

function animate() {
  requestAnimationFrame(animate);
  setAnimationTimeFromScroll();
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.35 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  if (camera && camera.isPerspectiveCamera) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  setAnimationTimeFromScroll();
});
