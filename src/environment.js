import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { supabase } from './supabaseClient.js';
import starBgUrl from './assets/star-background.png?url';

const envCanvas = document.querySelector('#env-canvas');
const envContainer = document.querySelector('#env-canvas-container');
const renderer = new THREE.WebGLRenderer({ canvas: envCanvas, antialias: true, alpha: false });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputColorSpace = THREE.SRGBColorSpace;
// Match editor renderer (no tone mapping)
renderer.toneMapping = THREE.NoToneMapping;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Pure black behind star skybox

// Star skybox using image texture
const starTex = new THREE.TextureLoader().load(starBgUrl);
starTex.colorSpace = THREE.SRGBColorSpace;
starTex.wrapS = starTex.wrapT = THREE.RepeatWrapping;
starTex.repeat.set(4, 4); // tile 4×4 to make stars appear smaller/denser
const starSky = new THREE.Mesh(
  new THREE.SphereGeometry(1000, 64, 32),
  new THREE.MeshBasicMaterial({ map: starTex, side: THREE.BackSide, depthWrite: false, depthTest: false })
);
starSky.renderOrder = -1; // always render behind everything else
scene.add(starSky);

// Use bright IBL for lighting while keeping dark background
const pmremGen = new THREE.PMREMGenerator(renderer);
const iblTex = pmremGen.fromScene(new RoomEnvironment(renderer), 1.0).texture;
scene.environment = iblTex;

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
camera.position.set(0, 12, 16);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.enableZoom = true;
// Keep pivot anchored at world origin (center of grid)
controls.minPolarAngle = Math.PI / 6;
controls.maxPolarAngle = Math.PI / 3;
controls.target.set(0, 0, 0);
if ('zoomToCursor' in controls) {
  // Avoid cursor-position zoom drift; always zoom toward target
  controls.zoomToCursor = false;
}
camera.lookAt(controls.target);
controls.update();
// Optional distance limits to keep pivot framed
controls.minDistance = 6;
controls.maxDistance = 38.4;

// Lights (hemi + key directional)
// Match editor lighting: hemisphere only
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
hemi.position.set(0, 5, 0);
scene.add(hemi);
// No directional/fill lights in the editor

// Tiled dirt ground
const dirtTex = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}images/grass_0.png.preview.jpg`);
dirtTex.wrapS = dirtTex.wrapT = THREE.RepeatWrapping;
dirtTex.repeat.set(4, 4);
dirtTex.colorSpace = THREE.SRGBColorSpace;
const groundMat = new THREE.MeshStandardMaterial({
  map: dirtTex,
  color: 0xbbbbbb, // dims the texture brightness
  roughness: 1,
  metalness: 0
});
const ground = new THREE.Mesh(new THREE.CircleGeometry(30, 80), groundMat);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Models
const loader = new GLTFLoader();
const modelPaths = {
  darkling: `${import.meta.env.BASE_URL}models/darkling-rigging.glb`,
  ladybug: `${import.meta.env.BASE_URL}models/ladybug-rigged.glb`,
  rhino: `${import.meta.env.BASE_URL}models/rhino-riggged.glb`,
  scarab: `${import.meta.env.BASE_URL}models/scarab-rigged.glb`,
  bombardier: `${import.meta.env.BASE_URL}models/bombardier-rigged.glb`,
};
// Body-specific base walking speeds (units/sec), fastest → slowest:
// darkling > bombardier > ladybug > scarab = rhino
const bodyBaseSpeeds = {
  darkling: 3.0,
  bombardier: 2.5,
  ladybug: 2.1,
  scarab: 1.6,
  rhino: 1.6,
};
const baseRots = {
  darkling: new THREE.Euler(0, -Math.PI / 2, 0),
  rhino: new THREE.Euler(0, -Math.PI / 2, 0),
  scarab: new THREE.Euler(0, -Math.PI / 2, 0),
  ladybug: new THREE.Euler(0, -Math.PI / 2, 0),
  bombardier: new THREE.Euler(0, -Math.PI / 2, 0),
};

const baseModels = {};
const mixers = [];
const agents = [];

// Pattern textures and editor-accurate materials
const textureLoader = new THREE.TextureLoader();
const textureCache = new Map();
const plainTexture = (() => {
  const c = document.createElement('canvas');
  c.width = 1; c.height = 1;
  const cx = c.getContext('2d');
  cx.fillStyle = 'white';
  cx.fillRect(0, 0, 1, 1);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.flipY = false;
  return t;
})();

function getPatternTexture(bodyType, patternName) {
  if (!patternName || patternName === 'plain') return plainTexture;
  const key = `${bodyType}-${patternName}`;
  if (textureCache.has(key)) return textureCache.get(key);
  const url = `${import.meta.env.BASE_URL}textures/${key}.png`;
  const tex = textureLoader.load(url);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.flipY = false;
  textureCache.set(key, tex);
  return tex;
}

function createBeetleMaterials(options) {
  const {
    primaryColor = '#cccccc',
    secondaryColor = '#888888',
    maskTexture = plainTexture,
    gloss = false,
    iridescence = false
  } = options || {};

  const baseColor = new THREE.Color(primaryColor);
  const accentColor = new THREE.Color(secondaryColor);

  const beetleMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: gloss ? 1.0 : 0.6,
    // Make non-gloss beetles visibly more matte
    roughness: gloss ? (1.0 - (195 / 200) * 0.95) : 0.95,
    clearcoat: gloss ? 1.0 : 0.0,
    clearcoatRoughness: gloss ? 0.05 : 0.2,
    iridescence: iridescence ? 1.0 : 0.0,
    iridescenceIOR: iridescence ? 1.0 + (0.8 * 0.5) : 1.0,
    envMap: scene.environment,
    envMapIntensity: gloss ? 1.0 : 0.6
  });

  const uniforms = {
    baseColor: { value: baseColor },
    accentColor: { value: accentColor },
    maskMap: { value: maskTexture }
  };

  beetleMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.baseColor = uniforms.baseColor;
    shader.uniforms.accentColor = uniforms.accentColor;
    shader.uniforms.maskMap = uniforms.maskMap;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
uniform vec3 baseColor;
uniform vec3 accentColor;
uniform sampler2D maskMap;
varying vec2 vUv;`
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
varying vec2 vUv;`
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <uv_vertex>',
      `#include <uv_vertex>
vUv = uv;`
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      `vec4 diffuseColor = vec4( diffuse, opacity );`,
      `vec4 maskSample = texture2D(maskMap, vUv);
vec3 mixedColor = mix(accentColor, baseColor, maskSample.r);
vec4 diffuseColor = vec4( mixedColor, opacity );`
    );
  };

  const headMaterial = new THREE.ShaderMaterial({
    uniforms: {
      shininess: { value: 60.0 },
      specularStrength: { value: 0.5 },
      lightPosition: { value: new THREE.Vector3(5, 10, 5) }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      void main(){
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float shininess;
      uniform float specularStrength;
      uniform vec3 lightPosition;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      void main(){
        vec3 baseColor = vec3(0.05);
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);
        vec3 lightDir = normalize(lightPosition - vWorldPosition);
        float diffuse = max(dot(normal, lightDir), 0.0);
        vec3 col = baseColor * (0.3 + diffuse * 0.7);
        vec3 halfVector = normalize(lightDir + viewDir);
        float specAngle = max(dot(halfVector, normal), 0.0);
        float specular = pow(specAngle, shininess);
        vec3 specularColor = vec3(1.0) * specular * specularStrength;
        col += specularColor;
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });

  return { beetleMaterial, headMaterial, uniforms };
}

function loadModel(key) {
  return new Promise((resolve, reject) => {
    loader.load(modelPaths[key], gltf => {
      const model = gltf.scene;
      model.traverse(obj => {
        if (obj.isMesh) {
          obj.castShadow = false;
          obj.receiveShadow = false;
        }
      });
      model.rotation.copy(baseRots[key] || new THREE.Euler());
      model.visible = false;
      scene.add(model);

      let action = null;
      let mixer = null;
      if (gltf.animations && gltf.animations.length) {
        mixer = new THREE.AnimationMixer(model);
        action = mixer.clipAction(gltf.animations[0]);
        action.loop = THREE.LoopRepeat;
        action.enabled = false;
      }
      baseModels[key] = { model, gltf, mixer, action };
      resolve();
    }, undefined, reject);
  });
}

async function loadAllModels() {
  const keys = Object.keys(modelPaths);
  for (const k of keys) {
    await loadModel(k);
  }
}

// Fetch latest 15 released beetles from Supabase
async function getRecentBeetles() {
  const { data, error } = await supabase
    .from('beetles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(15);
  if (error) {
    console.error('Failed to fetch recent beetles:', error);
    return [];
  }
  return (data || []).map(row => ({
    id: row.id,
    body: row.body,
    head: row.head,
    pattern: row.pattern,
    primary_color: row.primary_color,
    secondary_color: row.secondary_color,
    iridescence: !!row.iridescence,
    gloss: !!row.gloss,
    seed: row.id, // stable-ish seed
    createdAt: new Date(row.created_at).getTime()
  }));
}

function seededRandom(seed) {
  // Mulberry32
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function spawnAgent(beetle) {
  const base = baseModels[beetle.body];
  if (!base) return;
  const beetleClone = clone(base.model);
  beetleClone.visible = true;
  beetleClone.position.set((Math.random() - 0.5) * 24, 0.5, (Math.random() - 0.5) * 24);
  beetleClone.rotation.copy(baseRots[beetle.body] || new THREE.Euler());
  scene.add(beetleClone);

  // Apply editor-accurate materials and head visibility
  const maskTex = getPatternTexture(beetle.body, beetle.pattern || 'plain');
  const { beetleMaterial, headMaterial } = createBeetleMaterials({
    primaryColor: beetle.primary_color,
    secondaryColor: beetle.secondary_color || '#888888',
    maskTexture: maskTex,
    gloss: !!beetle.gloss,
    iridescence: !!beetle.iridescence
  });
  const headNames = new Set(['Longhorn', 'Scarab', 'Stag', 'Tiger', 'Weevil']);
  beetleClone.traverse(obj => {
    if (!obj.isMesh) return;
    if (obj.name === 'Carapace') {
      obj.material = beetleMaterial;
    } else if (obj.name === 'Legs') {
      obj.material = headMaterial;
    } else if (headNames.has(obj.name)) {
      obj.material = headMaterial;
      obj.visible = (obj.name === (beetle.head || 'Stag'));
    }
  });

  // Animation
  let mixer = null;
  let action = null;
  if (base.gltf.animations && base.gltf.animations.length) {
    mixer = new THREE.AnimationMixer(beetleClone);
    action = mixer.clipAction(base.gltf.animations[0]);
    action.enabled = true;
    action.play();
    mixers.push(mixer);
  }

  const rand = seededRandom(beetle.seed ?? Math.floor(Math.random() * 1e9));
  const dir = rand() * Math.PI * 2;
  const initialVelocity = new THREE.Vector2(Math.cos(dir), Math.sin(dir)).multiplyScalar(2.2);
  const baseSpeed = bodyBaseSpeeds[beetle.body] ?? 2.0;
  const preferredSpeed = baseSpeed * (0.9 + rand() * 0.2); // slight individual variance ±10%
  const maxspeed = preferredSpeed;
  const maxforce = 1.2 + rand() * 0.6;
  const baseRot = baseRots[beetle.body] || new THREE.Euler();

  agents.push({
    id: beetle.id,
    obj: beetleClone,
    velocity: initialVelocity,
    acceleration: new THREE.Vector2(0, 0),
    maxspeed,
    preferredSpeed,
    maxforce,
    yawOffset: baseRot.y || 0,
    xRot: baseRot.x || 0,
    zRot: baseRot.z || 0,
    isPaused: false,
    stateTimer: 1.0 + rand() * 2.0,
    resumeCooldown: 0,
    lastHeading: dir,
    action,
    rand,
  });
}

async function spawnFromRecent() {
  const data = await getRecentBeetles();
  const latest = data
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 25);
  latest.forEach(spawnAgent);
  // Refresh reflections once beetles are present
  try { cubeCamera.update(renderer, scene); } catch (_) { /* no-op */ }
}

function updateAgents(dt) {
  const minX = -20, maxX = 20, minZ = -20, maxZ = 20;
  const boundaryOffset = 9.0;
  const boundaryEpsilon = 0.05;      // how close counts as "at the wall"
  const bounceDamping = 0.6;         // lose some energy on bounce
  const slowZone = 1.5;              // start slowing within 1.5 units of edge

  function applyForce(agent, force) {
    agent.acceleration.add(force);
  }

  function steerTowards(agent, desired) {
    if (desired.lengthSq() === 0) return new THREE.Vector2(0, 0);
    desired.normalize().multiplyScalar(agent.maxspeed);
    const steer = desired.sub(agent.velocity);
    if (steer.length() > agent.maxforce) steer.setLength(agent.maxforce);
    return steer;
  }

  for (const a of agents) {
    a.stateTimer -= dt;
    if (a.stateTimer <= 0) {
      a.isPaused = !a.isPaused;
      a.stateTimer = a.isPaused
        ? 1.0 + a.rand() * 3.0   // pause duration
        : 3.0 + a.rand() * 5.0;  // moving duration
      if (a.action) {
        a.action.paused = a.isPaused;
      }
      if (!a.isPaused) {
        const heading = (a.velocity.lengthSq() > 0.0001)
          ? Math.atan2(a.velocity.y, a.velocity.x)
          : a.lastHeading;
        a.velocity.set(Math.cos(heading), Math.sin(heading)).setLength(a.preferredSpeed);
        a.resumeCooldown = 0.6;
      }
    }

    if (a.isPaused) {
      a.acceleration.set(0, 0);
      a.velocity.multiplyScalar(0.88);
      if (a.velocity.length() < 0.02) a.velocity.set(0, 0);
      if (a.velocity.lengthSq() > 0) {
        a.obj.position.x += a.velocity.x * dt;
        a.obj.position.z += a.velocity.y * dt;
      }
      if (a.velocity.lengthSq() > 0.0001) {
        a.lastHeading = Math.atan2(a.velocity.y, a.velocity.x);
      }
      continue;
    }

    if (a.resumeCooldown > 0) {
      a.resumeCooldown = Math.max(0, a.resumeCooldown - dt);
    }

    let desired = null;
    const px = a.obj.position.x;
    const pz = a.obj.position.z;

    // If approaching boundary, reduce target top speed to avoid tunneling through wall
    const distToXEdge = Math.min(Math.abs(px - minX), Math.abs(maxX - px));
    const distToZEdge = Math.min(Math.abs(pz - minZ), Math.abs(maxZ - pz));
    const nearEdge = (distToXEdge < slowZone) || (distToZEdge < slowZone);
    const targetSpeed = nearEdge ? a.maxspeed * 0.6 : a.maxspeed;

    if (px < minX + boundaryOffset) {
      desired = new THREE.Vector2(targetSpeed, a.velocity.y);
    } else if (px > maxX - boundaryOffset) {
      desired = new THREE.Vector2(-targetSpeed, a.velocity.y);
    }

    if (pz < minZ + boundaryOffset) {
      desired = new THREE.Vector2(a.velocity.x, targetSpeed);
    } else if (pz > maxZ - boundaryOffset) {
      desired = new THREE.Vector2(a.velocity.x, -targetSpeed);
    }

    if (desired) {
      const boundarySteer = steerTowards(a, desired);
      if (a.resumeCooldown > 0) boundarySteer.multiplyScalar(0.25);
      applyForce(a, boundarySteer);
    }

    // Subtle wander force so movement is less straight-line mechanical.
    const wanderAngle = (a.rand() - 0.5) * 0.6;
    const wanderDir = a.velocity.clone();
    if (wanderDir.lengthSq() < 0.0001) {
      const resetAngle = a.rand() * Math.PI * 2;
      wanderDir.set(Math.cos(resetAngle), Math.sin(resetAngle));
    }
    wanderDir.normalize();
    const cs = Math.cos(wanderAngle);
    const sn = Math.sin(wanderAngle);
    const wx = wanderDir.x * cs - wanderDir.y * sn;
    const wz = wanderDir.x * sn + wanderDir.y * cs;
    let wanderForce = new THREE.Vector2(wx, wz).multiplyScalar(0.25);
    if (a.resumeCooldown > 0) wanderForce.multiplyScalar(0.1);
    applyForce(a, wanderForce);

    // Vehicle integration (Nature of Code style)
    a.velocity.addScaledVector(a.acceleration, dt);
    if (a.velocity.length() > targetSpeed) a.velocity.setLength(targetSpeed);
    a.obj.position.x += a.velocity.x * dt;
    a.obj.position.z += a.velocity.y * dt;
    a.acceleration.set(0, 0);

    // Hard boundary clamp with soft bounce to keep within the plane
    if (a.obj.position.x < minX + boundaryEpsilon) {
      a.obj.position.x = minX + boundaryEpsilon;
      if (a.velocity.x < 0) a.velocity.x = -a.velocity.x * bounceDamping;
    } else if (a.obj.position.x > maxX - boundaryEpsilon) {
      a.obj.position.x = maxX - boundaryEpsilon;
      if (a.velocity.x > 0) a.velocity.x = -a.velocity.x * bounceDamping;
    }
    if (a.obj.position.z < minZ + boundaryEpsilon) {
      a.obj.position.z = minZ + boundaryEpsilon;
      if (a.velocity.y < 0) a.velocity.y = -a.velocity.y * bounceDamping;
    } else if (a.obj.position.z > maxZ - boundaryEpsilon) {
      a.obj.position.z = maxZ - boundaryEpsilon;
      if (a.velocity.y > 0) a.velocity.y = -a.velocity.y * bounceDamping;
    }

    // Face velocity direction while preserving per-body base orientation.
    if (a.velocity.lengthSq() > 0.0001) {
      const heading = Math.atan2(a.velocity.y, a.velocity.x);
      a.lastHeading = heading;
      a.obj.rotation.x = a.xRot;
      a.obj.rotation.y = a.yawOffset - heading;
      a.obj.rotation.z = a.zRot;
    }
  }
}

let prev = performance.now();
let frameCount = 0;
function animate(now = performance.now()) {
  const dt = Math.min((now - prev) / 1000, 0.05);
  prev = now;

  // fit canvas
  const pr = renderer.getPixelRatio();
  const w = envContainer.clientWidth;
  const h = envContainer.clientHeight;
  if (envCanvas.width !== Math.floor(w * pr) || envCanvas.height !== Math.floor(h * pr)) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // Re-affirm pivot after resizes to prevent drift
    controls.target.set(0, 0, 0);
    camera.lookAt(controls.target);
    controls.update();
  }

  // update
  for (const m of mixers) m.update(dt);
  updateAgents(dt);
  controls.update();
  renderer.render(scene, camera);
  frameCount++;
  requestAnimationFrame(animate);
}

async function init() {
  const loaderOverlay = document.getElementById('loader-overlay');
  try {
    await loadAllModels();
    await spawnFromRecent();
    // Hide loader once environment is ready
    if (loaderOverlay) loaderOverlay.classList.add('hidden');
  } catch (e) {
    console.error(e);
    if (loaderOverlay) loaderOverlay.classList.add('hidden');
  } finally {
    animate();
  }
}

// "Create a new beetle" button → back to onboarding
document.addEventListener('DOMContentLoaded', () => {
  const createBtn = document.getElementById('env-create-btn');
  if (createBtn) {
    createBtn.addEventListener('click', () => {
      window.location.href = `${import.meta.env.BASE_URL}onboarding.html`;
    });
  }
});

init();

