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
renderer.toneMappingExposure = 0.96;
renderer.setClearColor(0x050505, 1);
renderer.shadowMap.enabled = false;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);
scene.fog = new THREE.FogExp2(0x090804, 0.003);

// Câmera atual do projeto, corrigida para não olhar para o teto.
// O scroll percorre os 300 frames exportados.
const CAMERA_FRAMES = [[168.574677,0.047582,1.570796],[168.563919,0.047486,1.570039],[168.531876,0.047202,1.567794],[168.478943,0.046737,1.564106],[168.405457,0.046098,1.559017],[168.311798,0.04529,1.552571],[168.198364,0.044321,1.54481],[168.065475,0.043198,1.535778],[167.913528,0.041926,1.525517],[167.742889,0.040512,1.514072],[167.553925,0.038963,1.501484],[167.347,0.037286,1.487797],[167.122482,0.035487,1.473055],[166.880753,0.033573,1.4573],[166.622162,0.03155,1.440575],[166.347107,0.029425,1.422924],[166.055908,0.027205,1.404389],[165.748993,0.024895,1.385014],[165.426682,0.022503,1.364841],[165.089371,0.020036,1.343915],[164.737427,0.017499,1.322277],[164.371201,0.0149,1.299971],[163.991089,0.012244,1.27704],[163.597412,0.00954,1.253527],[163.190598,0.006792,1.229476],[162.770981,0.004008,1.204929],[162.338943,0.001195,1.17993],[161.894836,-0.001642,1.154521],[161.439041,-0.004495,1.128746],[160.971924,-0.007357,1.102647],[160.493851,-0.010224,1.076268],[160.005203,-0.013086,1.049653],[159.506332,-0.015939,1.022843],[158.99762,-0.018776,0.995882],[158.479416,-0.021589,0.968814],[157.952118,-0.024373,0.941681],[157.416092,-0.027121,0.914526],[156.871674,-0.029825,0.887393],[156.319244,-0.032481,0.860324],[155.759201,-0.03508,0.833364],[155.191879,-0.037617,0.806553],[154.617676,-0.040084,0.779937],[154.036926,-0.042476,0.753558],[153.450012,-0.044786,0.727459],[152.857315,-0.047006,0.701682],[152.259201,-0.049131,0.676273],[151.656021,-0.051154,0.651272],[151.048172,-0.053068,0.626724],[150.436005,-0.054867,0.602672],[149.81987,-0.056544,0.579158],[149.200165,-0.058093,0.556226],[148.577271,-0.059506,0.533918],[147.951508,-0.060778,0.512279],[147.323273,-0.061902,0.491351],[146.692932,-0.062871,0.471176],[146.060883,-0.063679,0.451799],[145.427444,-0.064318,0.433262],[144.792999,-0.064783,0.415609],[144.157928,-0.065067,0.398882],[143.522614,-0.065163,0.383124],[142.887344,-0.065163,0.368363],[142.252121,-0.065163,0.354561],[141.616943,-0.065163,0.341663],[140.981781,-0.065163,0.329614],[140.346619,-0.065163,0.318362],[139.71138,-0.065163,0.307851],[139.076065,-0.065163,0.298028],[138.440613,-0.065163,0.288837],[137.805038,-0.065163,0.280225],[137.16925,-0.065163,0.272139],[136.533264,-0.065163,0.264523],[135.897034,-0.065163,0.257322],[135.260498,-0.065163,0.250484],[134.623672,-0.065163,0.243954],[133.986481,-0.065163,0.237678],[133.348938,-0.065163,0.231601],[132.710968,-0.065163,0.225669],[132.072556,-0.065163,0.219828],[131.43367,-0.065163,0.214024],[130.794281,-0.065163,0.208202],[130.154358,-0.065163,0.202308],[129.513855,-0.065163,0.196289],[128.872757,-0.065163,0.19009],[128.231018,-0.065163,0.183656],[127.588608,-0.065163,0.176933],[126.945503,-0.065163,0.169868],[126.301651,-0.065163,0.162406],[125.657051,-0.065163,0.154493],[125.011635,-0.065163,0.146074],[124.365402,-0.065163,0.137096],[123.71833,-0.065031,0.127517],[123.070503,-0.064643,0.117349],[122.42205,-0.064005,0.106619],[121.773064,-0.063128,0.095353],[121.123695,-0.06202,0.083574],[120.474014,-0.060691,0.07131],[119.824173,-0.059149,0.058586],[119.174255,-0.057402,0.045427],[118.524406,-0.05546,0.031859],[117.874725,-0.053332,0.017908],[117.225311,-0.051027,0.003599],[116.576302,-0.048552,-0.011041],[115.927803,-0.045919,-0.025989],[115.27993,-0.043134,-0.041217],[114.632797,-0.040207,-0.056701],[113.986519,-0.037147,-0.072414],[113.341217,-0.033964,-0.088331],[112.696991,-0.030664,-0.104427],[112.053955,-0.027258,-0.120675],[111.412254,-0.023755,-0.13705],[110.771965,-0.020163,-0.153527],[110.133217,-0.016491,-0.17008],[109.496132,-0.012748,-0.186684],[108.860802,-0.008942,-0.203312],[108.227371,-0.005084,-0.219939],[107.595924,-0.001181,-0.236539],[106.966614,0.002757,-0.253088],[106.339523,0.006722,-0.269558],[105.714767,0.010704,-0.285926],[105.092468,0.014696,-0.302164],[104.472748,0.018687,-0.318248],[103.855721,0.02267,-0.334151],[103.241478,0.026635,-0.349849],[102.630157,0.030573,-0.365315],[102.021873,0.034476,-0.380524],[101.416725,0.038334,-0.395451],[100.814835,0.042139,-0.410069],[100.216324,0.045882,-0.424353],[99.6213,0.049554,-0.438278],[99.029877,0.053146,-0.451817],[98.442154,0.05665,-0.464946],[97.858284,0.060056,-0.477639],[97.278358,0.063355,-0.489869],[96.702477,0.066539,-0.501612],[96.130791,0.069599,-0.512841],[95.563377,0.072525,-0.523532],[95.000374,0.07531,-0.533658],[94.441879,0.077944,-0.543195],[93.888023,0.080418,-0.552115],[93.338928,0.082724,-0.560394],[92.794678,0.084852,-0.568006],[92.255402,0.086793,-0.574926],[91.721222,0.08854,-0.581128],[91.192253,0.090082,-0.586586],[90.668594,0.091412,-0.591274],[90.150368,0.09252,-0.595168],[89.637695,0.093396,-0.59824],[89.130684,0.094034,-0.600467],[88.62944,0.094423,-0.601822],[88.134102,0.094554,-0.602279],[87.644608,0.094533,-0.598882],[87.160286,0.094469,-0.588922],[86.680321,0.094362,-0.572741],[86.20388,0.094214,-0.550683],[85.730118,0.094026,-0.523091],[85.258232,0.093797,-0.490309],[84.787376,0.093529,-0.452679],[84.316719,0.093222,-0.410546],[83.845444,0.092876,-0.364253],[83.372726,0.092494,-0.314143],[82.897736,0.092074,-0.260559],[82.419624,0.091618,-0.203846],[81.937569,0.091126,-0.144346],[81.450768,0.0906,-0.082402],[80.958366,0.090038,-0.018359],[80.459541,0.089444,0.047441],[79.953461,0.088816,0.114654],[79.439323,0.088156,0.182936],[78.91626,0.087464,0.251946],[78.383469,0.086741,0.321338],[77.840103,0.085988,0.390769],[77.285355,0.085205,0.459896],[76.718399,0.084393,0.528377],[76.138367,0.083552,0.595867],[75.544464,0.082683,0.662022],[74.935867,0.081787,0.7265],[74.311737,0.080864,0.788958],[73.671227,0.079916,0.849051],[73.013535,0.078942,0.906437],[72.337822,0.077944,0.960771],[71.643341,0.076921,1.011804],[70.929604,0.075875,1.059656],[70.196251,0.074805,1.104539],[69.442902,0.073712,1.146667],[68.669144,0.072595,1.186252],[67.874588,0.071456,1.223508],[67.058868,0.070293,1.258648],[66.221596,0.069108,1.291884],[65.362358,0.0679,1.323428],[64.480789,0.06667,1.353496],[63.576504,0.065418,1.382299],[62.649105,0.064144,1.410051],[61.6982,0.062848,1.436964],[60.723412,0.06153,1.463251],[59.72435,0.060191,1.489126],[58.700626,0.058831,1.514801],[57.651852,0.05745,1.540489],[56.577641,0.056048,1.566404],[55.477608,0.054626,1.592758],[54.35136,0.053183,1.619764],[53.198517,0.051719,1.647635],[52.019234,0.050236,1.676534],[50.815887,0.048734,1.706418],[49.591385,0.047213,1.737195],[48.348648,0.045675,1.768773],[47.090595,0.04412,1.801058],[45.820141,0.04255,1.833959],[44.540207,0.040966,1.867382],[43.253704,0.039367,1.901235],[41.963566,0.037756,1.935426],[40.672691,0.036133,1.969861],[39.383999,0.034499,2.004448],[38.100422,0.032855,2.039096],[36.824863,0.031202,2.07371],[35.560246,0.029541,2.108198],[34.309486,0.027872,2.142468],[33.075504,0.026197,2.176427],[31.861216,0.024517,2.209983],[30.669538,0.022831,2.243043],[29.503386,0.021143,2.275514],[28.365679,0.019451,2.307304],[27.259338,0.017758,2.33832],[26.187275,0.016064,2.368469],[25.152414,0.01437,2.39766],[24.157665,0.012677,2.425798],[23.205954,0.010985,2.452793],[22.30019,0.009296,2.478551],[21.443293,0.007611,2.502979],[20.638184,0.005931,2.525985],[19.887779,0.004256,2.547476],[19.194992,0.002587,2.56736],[18.562744,0.000926,2.585544],[17.993954,-0.000727,2.601936],[17.491535,-0.002371,2.616443],[17.058405,-0.004005,2.628972],[16.697489,-0.005628,2.63943],[16.411694,-0.007239,2.647726],[16.203939,-0.008837,2.653766],[16.077154,-0.010421,2.657458],[16.034245,-0.011991,2.658709],[16.0536,-0.013546,2.656833],[16.1108,-0.015084,2.651292],[16.204536,-0.016607,2.642211],[16.333508,-0.018112,2.629716],[16.496407,-0.019601,2.613935],[16.691927,-0.021073,2.594992],[16.918768,-0.022527,2.573016],[17.175623,-0.023963,2.548132],[17.461184,-0.02538,2.520467],[17.774149,-0.026779,2.490147],[18.113213,-0.028159,2.457299],[18.47707,-0.02952,2.422048],[18.864416,-0.03086,2.384522],[19.273947,-0.032181,2.344847],[19.704355,-0.033481,2.303149],[20.154337,-0.034761,2.259554],[20.622589,-0.036019,2.21419],[21.107803,-0.037256,2.167183],[21.608679,-0.038471,2.118658],[22.123909,-0.039664,2.068743],[22.652187,-0.040834,2.017563],[23.192211,-0.041981,1.965246],[23.742672,-0.043105,1.911917],[24.302269,-0.044206,1.857703],[24.869696,-0.045283,1.802731],[25.443645,-0.046335,1.747127],[26.022816,-0.047362,1.691017],[26.605902,-0.048365,1.634528],[27.191597,-0.049343,1.577785],[27.778597,-0.050294,1.520917],[28.365597,-0.05122,1.464048],[28.951294,-0.052119,1.407306],[29.534376,-0.052992,1.350817],[30.113548,-0.053837,1.294707],[30.687498,-0.054655,1.239102],[31.254925,-0.055445,1.18413],[31.814522,-0.056207,1.129917],[32.364983,-0.056941,1.076588],[32.905006,-0.057646,1.024271],[33.433285,-0.058321,0.973091],[33.948513,-0.058967,0.923175],[34.449387,-0.059584,0.874651],[34.934601,-0.060169,0.827643],[35.402855,-0.060724,0.782279],[35.85284,-0.061249,0.738685],[36.283249,-0.061742,0.696987],[36.69278,-0.062203,0.657312],[37.080124,-0.062633,0.619785],[37.443985,-0.06303,0.584535],[37.783043,-0.063394,0.551686],[38.096016,-0.063726,0.521366],[38.381577,-0.064024,0.493701],[38.63842,-0.064288,0.468817],[38.865261,-0.064518,0.446841],[39.060787,-0.064714,0.427899],[39.22369,-0.064874,0.412117],[39.352654,-0.065,0.399623],[39.446396,-0.06509,0.390541],[39.503601,-0.065145,0.385],[39.522949,-0.065163,0.383124]];

const CAMERA_Y = 4.0348629951;
const CAMERA_Z = 0.7915309668;

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 4000);
camera.position.set(CAMERA_FRAMES[0][0], CAMERA_Y, CAMERA_Z);
camera.rotation.set(CAMERA_FRAMES[0][1], CAMERA_FRAMES[0][2], 0, 'YXZ');

const ambient = new THREE.HemisphereLight(0xfff2c7, 0x171109, 1.28);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffe8b0, 1.28);
keyLight.position.set(120, 80, 50);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xb8ae68, 0.58);
fillLight.position.set(-80, 35, -40);
scene.add(fillLight);

const fluorescent = new THREE.PointLight(0xffecaa, 1, 64);
fluorescent.position.set(80, 7, -8);
scene.add(fluorescent);

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

const textures = {
  carpet: loadTexture('./assets/carpet.jpg', 9, 9),
  wallDots: loadTexture('./assets/wall.png', 5, 5),
  wallChevron: loadTexture('./assets/wall2.png', 7, 7),
  ceiling: loadTexture('./assets/ceiling-texture.png', 6, 6),
  metalGrid: loadTexture('./assets/wall.png', 3, 3)
};

function makeStandardMaterial(options) {
  const material = new THREE.MeshStandardMaterial({
    side: THREE.DoubleSide,
    ...options
  });

  material.needsUpdate = true;
  return material;
}

const materialMap = {
  grid: makeStandardMaterial({
    name: 'web_grid_metal',
    map: textures.metalGrid,
    color: 0xd8d2a4,
    roughness: 0.24,
    metalness: 0.9
  }),
  chao: makeStandardMaterial({
    name: 'web_floor_carpet',
    map: textures.carpet,
    color: 0xffffff,
    roughness: 0.96,
    metalness: 0
  }),
  luz: makeStandardMaterial({
    name: 'web_light_emissive',
    color: 0xfff4c4,
    roughness: 0.35,
    metalness: 0,
    emissive: 0xfff1b8,
    emissiveIntensity: 2.6
  }),
  wall: makeStandardMaterial({
    name: 'web_wall_chevron',
    map: textures.wallChevron,
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0
  }),
  wallDots: makeStandardMaterial({
    name: 'web_wall_dots',
    map: textures.wallDots,
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0
  }),
  teto: makeStandardMaterial({
    name: 'web_ceiling_texture',
    map: textures.ceiling,
    color: 0xcfcf9f,
    roughness: 0.92,
    metalness: 0
  }),
  default: makeStandardMaterial({
    name: 'web_default_warm',
    color: 0xbfb786,
    roughness: 0.85,
    metalness: 0
  })
};

function normalize(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s.-]+/g, '_');
}

function chooseMaterial(object) {
  const originalMaterialNames = Array.isArray(object.material)
    ? object.material.map((mat) => mat?.name || '').join(' ')
    : object.material?.name || '';

  const name = normalize(`${object.name || ''} ${originalMaterialNames}`);

  // O GLTF atual usa estes materiais principais:
  // grid, chao, luz, wall.001, teto
  if (name.includes('luz') || name.includes('light') || name.includes('lamp') || name.includes('emissive')) return materialMap.luz;
  if (name.includes('grid') || name.includes('grade') || name.includes('metal') || name.includes('frame')) return materialMap.grid;
  if (name.includes('chao') || name.includes('piso') || name.includes('floor') || name.includes('carpet')) return materialMap.chao;
  if (name.includes('teto') || name.includes('ceiling')) return materialMap.teto;
  if (name.includes('wall_001') || name.includes('wall') || name.includes('parede')) return materialMap.wall;

  return materialMap.default;
}

function addRealLightNearMesh(object) {
  const name = `${object.name}_web_light`;
  if (scene.getObjectByName(name)) return;

  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());

  const light = new THREE.PointLight(0xffecaa, 0.72, 34);
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

    const selectedMaterial = chooseMaterial(object);

    // Clona para evitar que uma alteração por malha contamine outras superfícies.
    object.material = selectedMaterial.clone();
    object.material.needsUpdate = true;

    if (selectedMaterial.name.includes('light')) {
      addRealLightNearMesh(object);
    }
  });
}

function getScrollProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return 0;
  return Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function setCameraFromScroll() {
  const progress = getScrollProgress();
  const scaled = progress * (CAMERA_FRAMES.length - 1);
  const index = Math.floor(scaled);
  const nextIndex = Math.min(index + 1, CAMERA_FRAMES.length - 1);
  const t = scaled - index;

  const current = CAMERA_FRAMES[index];
  const next = CAMERA_FRAMES[nextIndex];

  const x = lerp(current[0], next[0], t);
  const pitch = lerp(current[1], next[1], t);
  const yaw = lerp(current[2], next[2], t);

  camera.position.set(x, CAMERA_Y, CAMERA_Z);
  camera.rotation.set(pitch, yaw, 0, 'YXZ');
  camera.updateProjectionMatrix();
}

const loader = new GLTFLoader();

const timeout = window.setTimeout(() => {
  if (!modelLoaded) setStatus('carregamento lento do modelo 3D', 2600);
}, 8000);

// Importante: carrega apenas o GLTF.
// O GLB antigo não entra como fallback, porque ele estava sobrescrevendo materiais e câmera.
loader.load(
  './assets/backrooms.gltf',
  (gltf) => {
    window.clearTimeout(timeout);
    modelLoaded = true;

    applyMaterials(gltf.scene);
    scene.add(gltf.scene);

    setCameraFromScroll();
    setStatus('GLTF carregado / materiais reaplicados');
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
  fluorescent.intensity = 0.82 + Math.sin(t * 1.6) * 0.045 + Math.sin(t * 7.4) * 0.015;

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
/* =========================================================
   FAKE AMBIENT OCCLUSION
   Colar no final do three-background.js existente
   ========================================================= */

const FAKE_AO_CONFIG = {
  strength: 0.72,
  maxDarken: 0.52,

  floorDistanceRatio: 0.16,
  ceilingDistanceRatio: 0.10,
  sideDistanceRatio: 0.09,

  minFloorDistance: 0.42,
  minCeilingDistance: 0.28,
  minSideDistance: 0.34,

  floorWeight: 0.42,
  ceilingWeight: 0.22,
  sideWeight: 0.24,
  cornerWeight: 0.46,
  cavityWeight: 0.18
};

function fakeAOClamp01(value) {
  return Math.min(Math.max(value, 0), 1);
}

function fakeAOSmoothstep(edge0, edge1, value) {
  const t = fakeAOClamp01((value - edge0) / Math.max(edge1 - edge0, 0.00001));
  return t * t * (3 - 2 * t);
}

function fakeAOInverseSmoothstep(edge0, edge1, value) {
  return 1 - fakeAOSmoothstep(edge0, edge1, value);
}

function getFakeAOColor(baseColor, ao) {
  const darken = 1 - Math.min(
    ao * FAKE_AO_CONFIG.strength,
    FAKE_AO_CONFIG.maxDarken
  );

  return {
    r: baseColor.r * darken,
    g: baseColor.g * darken,
    b: baseColor.b * darken
  };
}

function applyFakeAmbientOcclusionToMesh(object) {
  const geometry = object.geometry;

  if (!geometry || !geometry.attributes || !geometry.attributes.position) return;
  if (!object.material) return;

  geometry.computeBoundingBox();
  geometry.computeVertexNormals();

  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  const box = geometry.boundingBox;

  if (!box) return;

  const size = new THREE.Vector3();
  box.getSize(size);

  const height = Math.max(size.y, 0.0001);
  const width = Math.max(size.x, 0.0001);
  const depth = Math.max(size.z, 0.0001);

  const floorDistance = Math.max(
    height * FAKE_AO_CONFIG.floorDistanceRatio,
    FAKE_AO_CONFIG.minFloorDistance
  );

  const ceilingDistance = Math.max(
    height * FAKE_AO_CONFIG.ceilingDistanceRatio,
    FAKE_AO_CONFIG.minCeilingDistance
  );

  const sideDistanceX = Math.max(
    width * FAKE_AO_CONFIG.sideDistanceRatio,
    FAKE_AO_CONFIG.minSideDistance
  );

  const sideDistanceZ = Math.max(
    depth * FAKE_AO_CONFIG.sideDistanceRatio,
    FAKE_AO_CONFIG.minSideDistance
  );

  const baseColor = object.material.color
    ? object.material.color.clone()
    : new THREE.Color(0xffffff);

  const colors = new Float32Array(position.count * 3);

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);

    const nx = normal ? normal.getX(i) : 0;
    const ny = normal ? normal.getY(i) : 1;
    const nz = normal ? normal.getZ(i) : 0;

    const distanceFromFloor = y - box.min.y;
    const distanceFromCeiling = box.max.y - y;

    const distanceFromLeft = x - box.min.x;
    const distanceFromRight = box.max.x - x;

    const distanceFromBack = z - box.min.z;
    const distanceFromFront = box.max.z - z;

    const verticalSurface = 1 - Math.abs(ny);
    const horizontalSurface = Math.abs(ny);

    const floorAO = fakeAOInverseSmoothstep(
      0,
      floorDistance,
      distanceFromFloor
    );

    const ceilingAO = fakeAOInverseSmoothstep(
      0,
      ceilingDistance,
      distanceFromCeiling
    );

    const sideXAO = Math.max(
      fakeAOInverseSmoothstep(0, sideDistanceX, distanceFromLeft),
      fakeAOInverseSmoothstep(0, sideDistanceX, distanceFromRight)
    );

    const sideZAO = Math.max(
      fakeAOInverseSmoothstep(0, sideDistanceZ, distanceFromBack),
      fakeAOInverseSmoothstep(0, sideDistanceZ, distanceFromFront)
    );

    const sideAO = Math.max(sideXAO, sideZAO);
    const cornerAO = Math.sqrt(sideXAO * sideZAO);

    const cavityAO =
      Math.max(0, -ny) * 0.35 +
      Math.abs(nx) * sideXAO * 0.18 +
      Math.abs(nz) * sideZAO * 0.18;

    const ao =
      floorAO * FAKE_AO_CONFIG.floorWeight * verticalSurface +
      ceilingAO * FAKE_AO_CONFIG.ceilingWeight * verticalSurface +
      sideAO * FAKE_AO_CONFIG.sideWeight +
      cornerAO * FAKE_AO_CONFIG.cornerWeight +
      cavityAO * FAKE_AO_CONFIG.cavityWeight * horizontalSurface;

    const finalAO = fakeAOClamp01(ao);
    const finalColor = getFakeAOColor(baseColor, finalAO);

    colors[i * 3 + 0] = finalColor.r;
    colors[i * 3 + 1] = finalColor.g;
    colors[i * 3 + 2] = finalColor.b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  object.material.vertexColors = true;
  object.material.needsUpdate = true;
}

function applyFakeAmbientOcclusionToRoot(root) {
  root.traverse((object) => {
    if (!object.isMesh) return;

    applyFakeAmbientOcclusionToMesh(object);
  });
}

/* Intercepta a função original sem precisar editar o código acima */
if (typeof applyMaterials === 'function') {
  const originalApplyMaterials = applyMaterials;

  applyMaterials = function patchedApplyMaterials(root) {
    originalApplyMaterials(root);
    applyFakeAmbientOcclusionToRoot(root);
  };
}
