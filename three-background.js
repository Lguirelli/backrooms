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
renderer.toneMappingExposure = 0.92;
renderer.setClearColor(0x050505, 1);
renderer.shadowMap.enabled = false;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);
scene.fog = new THREE.FogExp2(0x090804, 0.010);

let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 4000);
camera.position.set(168.57467651367188, 4.034862995147705, 0.791530966758728);

const ambient = new THREE.HemisphereLight(0xfff2c7, 0x171109, 1.18);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffe8b0, 1.25);
keyLight.position.set(120, 80, 50);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xb8ae68, 0.58);
fillLight.position.set(-80, 35, -40);
scene.add(fillLight);

const fluorescent = new THREE.PointLight(0xffecaa, 0.78, 60);
fluorescent.position.set(80, 7, -8);
scene.add(fluorescent);

let mixer = null;
let actions = [];
let animationDuration = 1;
let hasCameraAnimation = false;
let modelLoaded = false;

const textureLoader = new THREE.TextureLoader();
const maxAnisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);

function setStatus(text, hideDelay = 1800) {
  if (!statusEl) return;
  statusEl.classList.remove('is-hidden');
  statusEl.textContent = text;
  window.setTimeout(() => statusEl.classList.add('is-hidden'), hideDelay);
}

function loadTexture(url, repeatX = 1, repeatY = 1, colorSpace = THREE.SRGBColorSpace) {
  const texture = textureLoader.load(
    url,
    (loadedTexture) => {
      loadedTexture.needsUpdate = true;
    },
    undefined,
    (error) => {
      console.warn(`Textura não encontrada ou inválida: ${url}`, error);
    }
  );

  texture.colorSpace = colorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = maxAnisotropy;
  texture.flipY = false;
  texture.needsUpdate = true;

  return texture;
}

const materialTextures = {
  carpet: loadTexture('./assets/carpet.jpg', 9, 9),
  wall: loadTexture('./assets/wall.png', 5, 5),
  wall2: loadTexture('./assets/wall2.png', 7, 7),
  ceiling: loadTexture('./assets/ceiling-texture.png', 6, 6),
  metalPattern: loadTexture('./assets/wall.png', 3, 3)
};

function makeMaterial({ name, map = null, color = 0xffffff, roughness = 0.85, metalness = 0, emissive = 0x000000, emissiveIntensity = 0 }) {
  const material = new THREE.MeshStandardMaterial({
    name,
    map,
    color,
    roughness,
    metalness,
    emissive,
    emissiveIntensity,
    side: THREE.DoubleSide
  });

  material.needsUpdate = true;
  return material;
}

const webMaterials = {
  floor: makeMaterial({
    name: 'web_floor_carpet',
    map: materialTextures.carpet,
    color: 0xffffff,
    roughness: 0.96,
    metalness: 0
  }),
  wall: makeMaterial({
    name: 'web_wall_dots',
    map: materialTextures.wall,
    color: 0xffffff,
    roughness: 0.90,
    metalness: 0
  }),
  wall2: makeMaterial({
    name: 'web_wall_chevron',
    map: materialTextures.wall2,
    color: 0xffffff,
    roughness: 0.90,
    metalness: 0
  }),
  ceiling: makeMaterial({
    name: 'web_ceiling',
    map: materialTextures.ceiling,
    color: 0xcfcf9f,
    roughness: 0.92,
    metalness: 0
  }),
  grid: makeMaterial({
    name: 'web_grid_metal',
    map: materialTextures.metalPattern,
    color: 0xd8d2a4,
    roughness: 0.25,
    metalness: 0.88
  }),
  light: makeMaterial({
    name: 'web_light_emissive',
    map: null,
    color: 0xfff4c4,
    roughness: 0.35,
    metalness: 0,
    emissive: 0xfff1b8,
    emissiveIntensity: 2.8
  }),
  default: makeMaterial({
    name: 'web_default_warm',
    map: null,
    color: 0xbfb786,
    roughness: 0.82,
    metalness: 0
  })
};

function normalizeName(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s.-]+/g, '_');
}

function classifyMesh(object) {
  const materialName = Array.isArray(object.material)
    ? object.material.map((mat) => mat?.name || '').join(' ')
    : object.material?.name || '';

  const name = normalizeName(`${object.name || ''} ${materialName}`);
  const dims = object.geometry?.boundingBox ? new THREE.Vector3() : object.getWorldScale(new THREE.Vector3());

  if (name.match(/luz|light|lamp|lampada|led|emissive|fluorescent|tube/)) return 'light';
  if (name.match(/grid|grade|metal|grelha|grate|mesh|fence|barra|frame/)) return 'grid';
  if (name.match(/teto|ceiling/)) return 'ceiling';
  if (name.match(/wall2|parede2|faixa|stripe|chevron|pattern|detail|detalhe/)) return 'wall2';
  if (name.match(/wall|parede|walls|muro/)) return 'wall';
  if (name.match(/floor|piso|carpet|tapete|chao|ground/)) return 'floor';

  object.updateWorldMatrix(true, false);
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());

  if (size.y < 0.35 && size.x > 1.0 && size.z > 1.0) return 'floor';
  if (size.y > 1.0 && (size.x < 0.45 || size.z < 0.45)) return 'wall';

  return 'default';
}

function prepareTexture(texture) {
  if (!texture) return;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = maxAnisotropy;
  texture.flipY = false;
  texture.needsUpdate = true;
}

function disposeUnsafeMaterial(material) {
  if (!material) return;
  if (Array.isArray(material)) {
    material.forEach(disposeUnsafeMaterial);
    return;
  }

  Object.keys(material).forEach((key) => {
    const value = material[key];
    if (value?.isTexture) prepareTexture(value);
  });
}

function addRealLightNearMesh(object) {
  const name = `${object.name}_web_point_light`;
  if (scene.getObjectByName(name)) return;

  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());

  const light = new THREE.PointLight(0xffecaa, 0.65, 34);
  light.name = name;
  light.position.copy(center);
  light.position.y -= 0.25;
  scene.add(light);
}

function applyMaterials(root) {
  root.traverse((object) => {
    if (!object.isMesh) return;

    object.frustumCulled = false;
    object.castShadow = false;
    object.receiveShadow = false;

    if (object.geometry) {
      object.geometry.computeVertexNormals();
      object.geometry.computeBoundingBox();
    }

    disposeUnsafeMaterial(object.material);

    const category = classifyMesh(object);
    const material = webMaterials[category] || webMaterials.default;

    object.material = material;

    if (category === 'light') {
      addRealLightNearMesh(object);
    }
  });
}

function getScrollProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return 0;
  return Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
}

function bindScrollAnimation(gltf, cameraExported) {
  if (!gltf.animations || !gltf.animations.length) return;

  const cameraName = cameraExported?.name || 'Camera';

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

    if (clip.tracks.some((track) => {
      const trackName = track.name || '';
      return trackName.includes(cameraName) || trackName.includes('Camera');
    })) {
      hasCameraAnimation = true;
    }

    animationDuration = Math.max(animationDuration, clip.duration || 1);
  });

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

  const x = THREE.MathUtils.lerp(168.57467651367188, 39.52294921875, progress);
  const z = THREE.MathUtils.lerp(0.791530966758728, -3.4, progress);

  camera.position.set(x, 4.034862995147705, z);
  camera.rotation.set(
    1.58,
    0.0015,
    THREE.MathUtils.lerp(2.758552312850952, 1.57088041305542, progress),
    'XYZ'
  );
}

const loader = new GLTFLoader();

const timeout = window.setTimeout(() => {
  if (!modelLoaded) setStatus('carregamento lento do modelo 3D', 2600);
}, 8000);

function loadModel(urls, index = 0) {
  const url = urls[index];

  if (!url) {
    window.clearTimeout(timeout);
    setStatus('modelo 3D não carregou: verifique assets/backrooms.glb', 4200);
    return;
  }

  loader.load(
    url,
    (gltf) => {
      window.clearTimeout(timeout);
      modelLoaded = true;

      applyMaterials(gltf.scene);
      scene.add(gltf.scene);

      const exportedCamera = gltf.cameras?.[0];

      if (exportedCamera && exportedCamera.isCamera) {
        camera = exportedCamera;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.near = Math.max(0.01, camera.near || 0.05);
        camera.far = Math.max(4000, camera.far || 1000);
        camera.updateProjectionMatrix();
      }

      bindScrollAnimation(gltf, exportedCamera);
      setAnimationTimeFromScroll();

      setStatus(hasCameraAnimation ? 'câmera do modelo conectada ao scroll' : 'modelo carregado / fallback de câmera ativo');
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
      console.warn(`Falha ao carregar ${url}`, error);
      loadModel(urls, index + 1);
    }
  );
}

loadModel([
  './assets/backrooms.glb',
  './assets/backrooms.gltf'
]);

window.addEventListener('scroll', setAnimationTimeFromScroll, { passive: true });

function animate() {
  requestAnimationFrame(animate);
  setAnimationTimeFromScroll();

  const t = performance.now() * 0.001;
  fluorescent.intensity = 0.78 + Math.sin(t * 1.6) * 0.045 + Math.sin(t * 7.4) * 0.015;

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
