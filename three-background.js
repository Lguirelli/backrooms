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

// Movimento exportado da câmera original.
// O scroll controla diretamente o frame: começo da página = frame 1, fim da página = frame 300.
// Formato: [location.x, rotation.x, rotation.z]
const CAMERA_FRAMES = [[168.574677,1.618378,2.758552],[168.563919,1.618282,2.757795],[168.531876,1.617999,2.75555],[168.478943,1.617534,2.751862],[168.405457,1.616894,2.746773],[168.311798,1.616086,2.740327],[168.198364,1.615118,2.732566],[168.065475,1.613994,2.723534],[167.913528,1.612722,2.713273],[167.742889,1.611308,2.701828],[167.553925,1.60976,2.68924],[167.347,1.608083,2.675553],[167.122482,1.606284,2.660811],[166.880753,1.604369,2.645056],[166.622162,1.602347,2.628331],[166.347107,1.600222,2.61068],[166.055908,1.598001,2.592145],[165.748993,1.595691,2.57277],[165.426682,1.5933,2.552597],[165.089371,1.590832,2.531671],[164.737427,1.588295,2.510033],[164.371201,1.585696,2.487727],[163.991089,1.583041,2.464796],[163.597412,1.580336,2.441283],[163.190598,1.577588,2.417232],[162.770981,1.574805,2.392685],[162.338943,1.571991,2.367686],[161.894836,1.569155,2.342277],[161.439041,1.566302,2.316502],[160.971924,1.563439,2.290403],[160.493851,1.560573,2.264024],[160.005203,1.55771,2.237409],[159.506332,1.554857,2.210599],[158.99762,1.55202,2.183638],[158.479416,1.549207,2.15657],[157.952118,1.546423,2.129437],[157.416092,1.543676,2.102282],[156.871674,1.540971,2.075149],[156.319244,1.538316,2.04808],[155.759201,1.535716,2.02112],[155.191879,1.53318,1.994309],[154.617676,1.530712,1.967693],[154.036926,1.52832,1.941314],[153.450012,1.526011,1.915215],[152.857315,1.52379,1.889438],[152.259201,1.521665,1.864029],[151.656021,1.519642,1.839028],[151.048172,1.517728,1.81448],[150.436005,1.515929,1.790428],[149.81987,1.514252,1.766914],[149.200165,1.512703,1.743982],[148.577271,1.51129,1.721674],[147.951508,1.510018,1.700035],[147.323273,1.508894,1.679107],[146.692932,1.507925,1.658932],[146.060883,1.507118,1.639555],[145.427444,1.506478,1.621018],[144.792999,1.506013,1.603365],[144.157928,1.505729,1.586638],[143.522614,1.505633,1.57088],[142.887344,1.505633,1.556119],[142.252121,1.505633,1.542317],[141.616943,1.505633,1.529419],[140.981781,1.505633,1.51737],[140.346619,1.505633,1.506118],[139.71138,1.505633,1.495607],[139.076065,1.505633,1.485784],[138.440613,1.505633,1.476593],[137.805038,1.505633,1.467981],[137.16925,1.505633,1.459895],[136.533264,1.505633,1.452279],[135.897034,1.505633,1.445078],[135.260498,1.505633,1.43824],[134.623672,1.505633,1.43171],[133.986481,1.505633,1.425434],[133.348938,1.505633,1.419357],[132.710968,1.505633,1.413425],[132.072556,1.505633,1.407584],[131.43367,1.505633,1.40178],[130.794281,1.505633,1.395958],[130.154358,1.505633,1.390064],[129.513855,1.505633,1.384045],[128.872757,1.505633,1.377846],[128.231018,1.505633,1.371412],[127.588608,1.505633,1.364689],[126.945503,1.505633,1.357624],[126.301651,1.505633,1.350162],[125.657051,1.505633,1.342249],[125.011635,1.505633,1.33383],[124.365402,1.505633,1.324852],[123.71833,1.505765,1.315273],[123.070503,1.506154,1.305105],[122.42205,1.506791,1.294375],[121.773064,1.507668,1.283109],[121.123695,1.508776,1.27133],[120.474014,1.510105,1.259066],[119.824173,1.511648,1.246342],[119.174255,1.513394,1.233183],[118.524406,1.515336,1.219615],[117.874725,1.517464,1.205664],[117.225311,1.51977,1.191355],[116.576302,1.522244,1.176715],[115.927803,1.524878,1.161767],[115.27993,1.527662,1.146539],[114.632797,1.530589,1.131055],[113.986519,1.533649,1.115342],[113.341217,1.536833,1.099425],[112.696991,1.540132,1.083329],[112.053955,1.543538,1.067081],[111.412254,1.547042,1.050706],[110.771965,1.550634,1.034229],[110.133217,1.554306,1.017676],[109.496132,1.558049,1.001072],[108.860802,1.561854,0.984444],[108.227371,1.565712,0.967817],[107.595924,1.569615,0.951217],[106.966614,1.573553,0.934668],[106.339523,1.577518,0.918198],[105.714767,1.581501,0.90183],[105.092468,1.585492,0.885592],[104.472748,1.589483,0.869508],[103.855721,1.593466,0.853605],[103.241478,1.597431,0.837907],[102.630157,1.601369,0.822441],[102.021873,1.605272,0.807232],[101.416725,1.60913,0.792305],[100.814835,1.612935,0.777687],[100.216324,1.616678,0.763403],[99.6213,1.62035,0.749478],[99.029877,1.623943,0.735939],[98.442154,1.627446,0.72281],[97.858284,1.630852,0.710117],[97.278358,1.634151,0.697887],[96.702477,1.637335,0.686144],[96.130791,1.640395,0.674915],[95.563377,1.643322,0.664224],[95.000374,1.646106,0.654098],[94.441879,1.64874,0.644561],[93.888023,1.651214,0.635641],[93.338928,1.65352,0.627362],[92.794678,1.655648,0.619749],[92.255402,1.65759,0.61283],[91.721222,1.659336,0.606628],[91.192253,1.660879,0.60117],[90.668594,1.662208,0.596482],[90.150368,1.663316,0.592588],[89.637695,1.664193,0.589516],[89.130684,1.66483,0.587289],[88.62944,1.665219,0.585934],[88.134102,1.665351,0.585477],[87.644608,1.665329,0.588874],[87.160286,1.665265,0.598834],[86.680321,1.665159,0.615015],[86.20388,1.665011,0.637073],[85.730118,1.664822,0.664665],[85.258232,1.664593,0.697447],[84.787376,1.664325,0.735077],[84.316719,1.664018,0.77721],[83.845444,1.663673,0.823503],[83.372726,1.66329,0.873613],[82.897736,1.66287,0.927197],[82.419624,1.662414,0.98391],[81.937569,1.661922,1.04341],[81.450768,1.661396,1.105354],[80.958366,1.660835,1.169397],[80.459541,1.66024,1.235197],[79.953461,1.659613,1.30241],[79.439323,1.658952,1.370692],[78.91626,1.658261,1.439702],[78.383469,1.657538,1.509094],[77.840103,1.656784,1.578525],[77.285355,1.656001,1.647652],[76.718399,1.655189,1.716133],[76.138367,1.654348,1.783623],[75.544464,1.653479,1.849778],[74.935867,1.652583,1.914256],[74.311737,1.651661,1.976714],[73.671227,1.650712,2.036807],[73.013535,1.649739,2.094193],[72.337822,1.64874,2.148527],[71.643341,1.647718,2.19956],[70.929604,1.646671,2.247412],[70.196251,1.645602,2.292295],[69.442902,1.644508,2.334423],[68.669144,1.643391,2.374008],[67.874588,1.642252,2.411264],[67.058868,1.641089,2.446404],[66.221596,1.639904,2.47964],[65.362358,1.638696,2.511184],[64.480789,1.637466,2.541252],[63.576504,1.636214,2.570055],[62.649105,1.63494,2.597807],[61.6982,1.633644,2.62472],[60.723412,1.632327,2.651007],[59.72435,1.630988,2.676882],[58.700626,1.629628,2.702557],[57.651852,1.628247,2.728245],[56.577641,1.626845,2.75416],[55.477608,1.625422,2.780514],[54.35136,1.623979,2.80752],[53.198517,1.622516,2.835391],[52.019234,1.621032,2.86429],[50.815887,1.61953,2.894174],[49.591385,1.618009,2.924951],[48.348648,1.616471,2.956529],[47.090595,1.614917,2.988814],[45.820141,1.613347,3.021715],[44.540207,1.611762,3.055138],[43.253704,1.610164,3.088991],[41.963566,1.608553,3.123182],[40.672691,1.60693,3.157617],[39.383999,1.605296,3.192204],[38.100422,1.603652,3.226852],[36.824863,1.601998,3.261466],[35.560246,1.600337,3.295954],[34.309486,1.598668,3.330224],[33.075504,1.596993,3.364183],[31.861216,1.595313,3.397739],[30.669538,1.593628,3.430799],[29.503386,1.591939,3.46327],[28.365679,1.590248,3.49506],[27.259338,1.588554,3.526076],[26.187275,1.58686,3.556225],[25.152414,1.585166,3.585416],[24.157665,1.583473,3.613554],[23.205954,1.581781,3.640549],[22.30019,1.580093,3.666307],[21.443293,1.578408,3.690735],[20.638184,1.576727,3.713741],[19.887779,1.575052,3.735232],[19.194992,1.573384,3.755116],[18.562744,1.571722,3.7733],[17.993954,1.570069,3.789692],[17.491535,1.568425,3.804199],[17.058405,1.566791,3.816728],[16.697489,1.565169,3.827186],[16.411694,1.563558,3.835482],[16.203939,1.561959,3.841522],[16.077154,1.560375,3.845214],[16.034245,1.558805,3.846465],[16.0536,1.55725,3.844589],[16.1108,1.555712,3.839048],[16.204536,1.55419,3.829967],[16.333508,1.552684,3.817472],[16.496407,1.551195,3.801691],[16.691927,1.549724,3.782748],[16.918768,1.54827,3.760772],[17.175623,1.546834,3.735888],[17.461184,1.545416,3.708223],[17.774149,1.544017,3.677903],[18.113213,1.542637,3.645055],[18.47707,1.541277,3.609804],[18.864416,1.539936,3.572278],[19.273947,1.538615,3.532603],[19.704355,1.537315,3.490905],[20.154337,1.536036,3.44731],[20.622589,1.534777,3.401946],[21.107803,1.533541,3.354939],[21.608679,1.532326,3.306414],[22.123909,1.531133,3.256499],[22.652187,1.529963,3.205319],[23.192211,1.528815,3.153002],[23.742672,1.527691,3.099673],[24.302269,1.52659,3.045459],[24.869696,1.525514,2.990487],[25.443645,1.524462,2.934883],[26.022816,1.523434,2.878773],[26.605902,1.522431,2.822284],[27.191597,1.521454,2.765541],[27.778597,1.520502,2.708673],[28.365597,1.519576,2.651804],[28.951294,1.518677,2.595062],[29.534376,1.517805,2.538573],[30.113548,1.516959,2.482463],[30.687498,1.516141,2.426858],[31.254925,1.515351,2.371886],[31.814522,1.514589,2.317673],[32.364983,1.513855,2.264344],[32.905006,1.51315,2.212027],[33.433285,1.512475,2.160847],[33.948513,1.511829,2.110931],[34.449387,1.511213,2.062407],[34.934601,1.510627,2.015399],[35.402855,1.510072,1.970035],[35.85284,1.509547,1.926441],[36.283249,1.509054,1.884743],[36.69278,1.508593,1.845068],[37.080124,1.508164,1.807541],[37.443985,1.507766,1.772291],[37.783043,1.507402,1.739442],[38.096016,1.507071,1.709122],[38.381577,1.506773,1.681457],[38.63842,1.506508,1.656573],[38.865261,1.506278,1.634597],[39.060787,1.506083,1.615655],[39.22369,1.505922,1.599873],[39.352654,1.505796,1.587379],[39.446396,1.505706,1.578297],[39.503601,1.505651,1.572756],[39.522949,1.505633,1.57088]];

const CAMERA_Y = 4.0348629951;
const CAMERA_Z = 0.7915309668;
const CAMERA_ROT_Y = 0.0015753791;

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 4000);
camera.position.set(CAMERA_FRAMES[0][0], CAMERA_Y, CAMERA_Z);
camera.rotation.set(CAMERA_FRAMES[0][1], CAMERA_ROT_Y, CAMERA_FRAMES[0][2], 'XYZ');

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
  const rotX = lerp(current[1], next[1], t);
  const rotZ = lerp(current[2], next[2], t);

  camera.position.set(x, CAMERA_Y, CAMERA_Z);
  camera.rotation.set(rotX, CAMERA_ROT_Y, rotZ, 'XYZ');
  camera.updateProjectionMatrix();
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

const loader = new GLTFLoader();

const timeout = window.setTimeout(() => {
  if (!modelLoaded) setStatus('carregamento lento do modelo 3D', 2600);
}, 8000);

loader.load(
  './assets/backrooms.gltf',
  (gltf) => {
    window.clearTimeout(timeout);
    modelLoaded = true;

    // Mantém o novo modelo nas coordenadas exportadas.
    // A câmera usada é a curva exportada em camera_motion_export.py, controlada pelo scroll.
    applyMaterials(gltf.scene);
    scene.add(gltf.scene);

    setCameraFromScroll();
    setStatus('movimento original de câmera restaurado no scroll');
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
