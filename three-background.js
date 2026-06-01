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
renderer.toneMappingExposure = 0.94;
renderer.setClearColor(0x050505, 1);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);
scene.fog = new THREE.FogExp2(0x090804, 0.010);

// Mantém a câmera já usada no projeto. Não puxa câmera do GLTF.
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 4000);
camera.position.set(168.57467651367188, 4.034862995147705, 0.791530966758728);
camera.rotation.set(1.58, 0.0015, 2.758552312850952, 'XYZ');

const ambient = new THREE.HemisphereLight(0xfff2c7, 0x171109, 1.18);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffe8b0, 1.2);
keyLight.position.set(120, 80, 50);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xb8ae68, 0.52);
fillLight.position.set(-80, 35, -40);
scene.add(fillLight);

const fluorescent = new THREE.PointLight(0xffecaa, 0.72, 52);
fluorescent.position.set(80, 7, -8);
scene.add(fluorescent);

let modelLoaded = false;

const textureLoader = new THREE.TextureLoader();

function loadTexture(url, repeatX = 1, repeatY = 1) {
  const texture = textureLoader.load(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  texture.needsUpdate = true;
  return texture;
}

const materialTextures = {
  carpet: loadTexture('./assets/carpet.jpg', 9, 9),
  wallDot: loadTexture('./assets/wall.png', 5, 5),
  wallChevron: loadTexture('./assets/wall2.png', 7, 7),
  metallicGrid: loadTexture('./assets/wall.png', 4, 4),
  ceiling: loadTexture('./assets/ceiling-texture.png', 6, 6)
};

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

function applyMaterials(root) {
  root.traverse((object) => {
    if (!object.isMesh) return;

    object.frustumCulled = false;

    const materials = Array.isArray(object.material) ? object.material : [object.material];

    materials.filter(Boolean).forEach((material) => {
      const name = `${material.name || ''} ${object.name || ''}`.toLowerCase();

      material.side = THREE.DoubleSide;

      if (material.map) {
        material.map.colorSpace = THREE.SRGBColorSpace;
        material.map.needsUpdate = true;
      }

      if (name.includes('chao') || name.includes('floor') || name.includes('carpet') || name.includes('piso')) {
        material.map = materialTextures.carpet;
        material.color.set(0xffffff);
        material.roughness = 0.94;
        material.metalness = 0;
      }

      if (name.includes('wall.001') || name.includes('wall') || name.includes('parede')) {
        material.map = materialTextures.wallChevron;
        material.color.set(0xffffff);
        material.roughness = 0.9;
        material.metalness = 0;
      }

      if (name.includes('grid') || name.includes('metal') || name.includes('frame')) {
        material.map = materialTextures.metallicGrid;
        material.color.set(0xd8d2a4);
        material.roughness = 0.24;
        material.metalness = 0.9;
      }

      if (name.includes('luz') || name.includes('light') || name.includes('lamp')) {
        material.map = null;
        material.color.set(0xfff4c4);
        material.emissive = new THREE.Color(0xfff1b8);
        material.emissiveIntensity = 1.55;
        material.roughness = 0.35;
        material.metalness = 0;
      }

      if (
        (name.includes('teto') || name.includes('ceiling')) &&
        !name.includes('luz') &&
        !name.includes('light') &&
        !name.includes('lamp')
      ) {
        material.map = materialTextures.ceiling;
        material.color.set(0xCFCF9F);
        material.roughness = 0.9;
        material.metalness = 0;
      }

      material.needsUpdate = true;
    });
  });
}

// Camera atual do projeto controlada por scroll.
// 0% da página = posição inicial. 100% da página = final do movimento.
function setCameraFromScroll() {
  const progress = getScrollProgress();

  const x = THREE.MathUtils.lerp(168.57467651367188, 39.52294921875, progress);
  const y = THREE.MathUtils.lerp(4.034862995147705, 4.034862995147705, progress);
  const z = THREE.MathUtils.lerp(0.791530966758728, -3.4, progress);

  camera.position.set(x, y, z);
  camera.rotation.set(
    1.58,
    0.0015,
    THREE.MathUtils.lerp(2.758552312850952, 1.57088041305542, progress),
    'XYZ'
  );
  camera.updateProjectionMatrix();
}

const loader = new GLTFLoader();

const timeout = window.setTimeout(() => {
  if (!modelLoaded) setStatus('carregamento lento do modelo 3D', 2600);
}, 8000);

loader.load(
  './assets/backrooms.gltf',
  (gltf) => {
    window.clearTimeout(timeout);
    modelLoaded = true;

    // Mantém o modelo nas coordenadas exportadas.
    // Não centraliza, não escala e não rotaciona.
    applyMaterials(gltf.scene);
    scene.add(gltf.scene);

    setCameraFromScroll();
    setStatus('novo modelo carregado / câmera atual mantida');
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
    console.error('Falha ao carregar GLTF:', error);
    setStatus('modelo 3D não carregou: verifique assets/backrooms.gltf e assets/backrooms.bin', 4200);
  }
);

window.addEventListener('scroll', setCameraFromScroll, { passive: true });

function animate() {
  requestAnimationFrame(animate);
  setCameraFromScroll();

  const t = performance.now() * 0.001;
  fluorescent.intensity = 0.72 + Math.sin(t * 1.6) * 0.045 + Math.sin(t * 7.4) * 0.015;

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.35 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  setCameraFromScroll();
});
