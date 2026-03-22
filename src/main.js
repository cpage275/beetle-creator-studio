import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Import all images as URLs - this ensures Vite handles them properly

// Badge icons (default + hover/active variants)
import bodyBadgeUrl from './assets/body-badge-img.png?url';
import bodyBadgeHoverUrl from './assets/body-badge-img-hover.png?url';
import headShapeBadgeUrl from './assets/head-badge-img.png?url';
import headShapeBadgeHoverUrl from './assets/head-badge-img-hover.png?url';
import patternBadgeUrl from './assets/pattern-badge-img.png?url';
import patternBadgeHoverUrl from './assets/pattern-badge-img-hover.png?url';
import colorBadgeUrl from './assets/color-badge-img.png?url';
import colorBadgeHoverUrl from './assets/color-badge-img-hover.png?url';
import surfaceBadgeUrl from './assets/surface-badge-img.png?url';
import surfaceBadgeHoverUrl from './assets/surface-badge-img-hover.png?url';

// Badge image map for easy lookup
const badgeImages = {
  'body': { default: bodyBadgeUrl, hover: bodyBadgeHoverUrl },
  'head-shape': { default: headShapeBadgeUrl, hover: headShapeBadgeHoverUrl },
  'pattern': { default: patternBadgeUrl, hover: patternBadgeHoverUrl },
  'color': { default: colorBadgeUrl, hover: colorBadgeHoverUrl },
  'surface': { default: surfaceBadgeUrl, hover: surfaceBadgeHoverUrl },
};

// Head preview images
import stagPreviewUrl from './assets/stag-preview.png?url';
import longhornPreviewUrl from './assets/longhorn-preview.png?url';
import scarabHeadPreviewUrl from './assets/scarab-head-preview.png?url';
import tigerPreviewUrl from './assets/tiger-preview.png?url';
import weevilPreviewUrl from './assets/weevil-preview.png?url';

// Head real example images
import enlargedMandiblesRealExImg from './assets/enlarged-mandibles-real-example.png?url';
import extendedAntennaeRealExImg from './assets/extended-antennae-real-example.png?url';
import scoopingMouthpartsRealExImg from './assets/scooping-mouthparts-real-example.png?url';
import sharpJawsBigEyesRealExImg from './assets/sharp-jaws-big-eyes-real-example.png?url';
import elongatedSnoutRealExImg from './assets/elongated-snout-real-example.png?url';

// Body preview images
import darklingPreviewUrl from './assets/darkling-preview.png?url';
import rhinoPreviewUrl from './assets/rhino-preview.png?url';
import scarabPreviewUrl from './assets/scarab-preview.png?url';
import ladybugPreviewUrl from './assets/ladybug-preview.png?url';
import bombardierPreviewUrl from './assets/bombardier-preview.png?url';

// Body real example images
import longLegsRealExImg from './assets/long-legs-real-example.png?url';
import armoredBodyRealExImg from './assets/armored-body-real-example.png?url';
import shovelingLegsRealExImg from './assets/shoveling-legs-real-example.png?url';
import roundedShellRealExImg from './assets/rounded-shell-real-example.png?url';
import chemicalDefenseRealExImg from './assets/chemical-defense-real-example.png?url';

// Texture preview images
import stripesPreviewUrl from './assets/stripes-preview.png?url';
import mottledPreviewUrl from './assets/mottled-preview.png?url';
import spottedPreviewUrl from './assets/spotted-preview.png?url';
import bandedPreviewUrl from './assets/banded-preview.png?url';
import plainPreviewUrl from './assets/plain-preview.png?url';

// Texture real example images
import stripesRealExImg from './assets/stripes-real-example.png?url';
import mottledRealExImg from './assets/mottled-real-example.png?url';
import spottedRealExImg from './assets/spotted-real-example.png?url';
import bandedRealExImg from './assets/banded-real-example.png?url';
import plainRealExImg from './assets/plain-real-example.png?url';

// Color real example images
import warningColorRealExImg from './assets/warning-color-real-example.png?url';
import camouflageRealExImg from './assets/camouflage-real-example.png?url';

// Surface real example images
import iridGlossRealExImg from './assets/irid-gloss-real-example.png?url';
import iridMatteRealExImg from './assets/irid-matte-real-example.png?url';
import noIridGlossRealExImg from './assets/no-irid-gloss-real-example.png?url';
import noIridMatteRealExImg from './assets/no-irid-matte-real-example.png?url';

const canvas = document.querySelector('#canvas');
const canvasContainer = document.querySelector('#canvas-container');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfafafa);

// Add grid helper as fixed background
const gridHelper = new THREE.GridHelper(50, 50, 0x888888, 0xcccccc);
gridHelper.position.y = -2;
scene.add(gridHelper);

// Create simple environment map using CubeCamera for reflections
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget);
scene.add(cubeCamera);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
const INITIAL_CAMERA_POSITION = new THREE.Vector3(0, 2, 6);
const INITIAL_CAMERA_TARGET = new THREE.Vector3(0, 0, 0);
const RELEASE_CAMERA_POSITION = new THREE.Vector3(0, 3, 10);
const RELEASE_CAMERA_TARGET = new THREE.Vector3(0, 0, 0);
camera.position.copy(INITIAL_CAMERA_POSITION);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.copy(INITIAL_CAMERA_TARGET);

const releaseButtonEl = document.getElementById('release-beetle-btn');

const customizerDialogEl = document.getElementById('customizer-dialog');

const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
hemi.position.set(0, 5, 0);
scene.add(hemi);

const loader = new GLTFLoader();
const beetleModels = {}; // Store all body models
const beetleMixersByBody = {};
const beetleWalkActionsByBody = {};
let currentBeetle; // Reference to currently active beetle
let carapaceMesh;
const headMeshesByBody = {}; // Store head meshes for each body type
let currentBody = 'darkling'; // Default body type
const darklingModelPath = `${import.meta.env.BASE_URL}models/darkling-rigging.glb`;
const ladybugModelPath = `${import.meta.env.BASE_URL}models/ladybug-rigged.glb`;
const rhinoModelPath = `${import.meta.env.BASE_URL}models/rhino-riggged.glb`;
const scarabModelPath = `${import.meta.env.BASE_URL}models/scarab-rigged.glb`;
const bombardierModelPath = `${import.meta.env.BASE_URL}models/bombardier-rigged.glb`;
let currentWalkMixer = null;
let currentWalkAction = null;
let releaseSequenceRunning = false;
let releaseAscentActive = false;
const RELEASE_ASCENT_SPEED = 2.6;
const RELEASE_HIDE_Y = 12;
const beetleStartYByBody = {};
const beetleBaseRotationByBody = {
  darkling: { x: Math.PI/2, y: 0, z: 0 },
  rhino: { x: Math.PI / 2, y: 0, z: 0 },
  scarab: { x: Math.PI / 2, y: 0, z: 0 },
  ladybug: { x: Math.PI / 2, y: 0, z: 0 },
  bombardier: { x: Math.PI / 2, y: 0, z: 0 },
};

// Data structures for heads and bodies
const headData = {
  'Stag': { 
    title: 'Enlarged mandibles', 
    niche: 'Fights for mates',
    previewImage: stagPreviewUrl,
    exampleName: 'Stag Beetle',
    scientificName: 'Lucanus cervus',
    exampleDescription: 'The jaws of male stag beetles are enlarged pincers that are used for fighting over females. <br><br>Their larvae spend four to six years feeding on rotting tree stumps and other decaying wood. Despite their impressive size (up to 3 in), stag beetles can still fly!',
    exampleImage: enlargedMandiblesRealExImg
  },
  'Longhorn': { 
    title: 'Extended antennae', 
    niche: 'Enhanced sensing',
    previewImage: longhornPreviewUrl,
    exampleName: 'Longhorn Beetle',
    scientificName: 'Anoplophora medenbachii',
    exampleDescription: 'Longhorn beetles have antennae that are typically longer than their bodies, and are used for sensing and navigating their environments. <br><br> Males often have much longer antennae than females, which may extend the reach of males searching for mates.',
    exampleImage: extendedAntennaeRealExImg
  },
  'Scarab': { 
    title: 'Scooping mouthparts', 
    niche: 'Recycler',
    previewImage: scarabHeadPreviewUrl,
    exampleName: 'Dung Beetle',
    scientificName: 'Scarabaeus ambiguus',
    exampleDescription: 'Many species of dung beetles have sharp, shovel-shaped heads adapted to scoop and mold dung into balls for food and egg-laying. There are thousands of species of dung beetles, and without them we would not be able to recycle all of the waste produced by animals. <br><br>They are also the first known insects to navigate using the Milky Way, relying on it to orient themselves as they roll dung balls at night.',
    exampleImage: scoopingMouthpartsRealExImg
  },
  'Tiger': { 
    title: 'Sharp jaws & big eyes', 
    niche: 'Active predator',
    previewImage: tigerPreviewUrl,
    exampleName: 'Tiger Beetle',
    scientificName: 'Tetracha virginica',
    exampleDescription: 'Tiger beetles are known for their powerful mandibles and huge compound eyes, which they use to catch prey. Even the larva have jaws, and can ambush passing victims to pull them into their burrows. <br><br>Tiger beetles are also the fastest running insects. If a tiger beetle were the size of a human, it would be able to run 720 mph!',
    exampleImage: sharpJawsBigEyesRealExImg
  },
  'Weevil': { 
    title: 'Elongated snout', 
    niche: 'Wood drilling',
    previewImage: weevilPreviewUrl,
    exampleName: 'Acorn Weevil',
    scientificName: 'Curculio glandium',
    exampleDescription: 'The acorn weevil\'s most striking feature is its long snout, called a rostrum. Females have longer rostrums, which they use to bore in to the center of an acorn to lay eggs. <br><br>The larva feed on the acorn until it falls, then they tunnel into the soil where they remain for 1-2 years before emerging as an adult weevil and repeating the cycle. Weevils can infest as many as 50% of an acorn crop in a season!',
    exampleImage: elongatedSnoutRealExImg
  }
};

const bodyData = {
  'darkling': { 
    title: 'Long legs', 
    niche: 'Speedy runner', 
    model: darklingModelPath,
    previewImage: darklingPreviewUrl,
    exampleName: 'Namib Desert Beetle',
    scientificName: 'Onymacris unguicularis',
    exampleDescription: 'This species of darkling beetle has long legs that let it run quickly over dunes. But it is called the "fog-basking beetle" or "head-standing beetle" because its hind legs also help position it head-down in the fog, where water droplets condense on its back and run down into its mouth. These are vital adaptations to survive in the desert.',
    exampleImage: longLegsRealExImg
  },
  'rhino': { 
    title: 'Armored body', 
    niche: 'Defense against competitors', 
    model: rhinoModelPath,
    previewImage: rhinoPreviewUrl,
    exampleName: 'Rhinoceros Beetle',
    scientificName: 'Eupatorus gracilicornis',
    exampleDescription: 'Male rhinoceros beetles have horns and a thick exoskeleton that lets them lift objects 30 times their own weight without sacrificing speed (that would be like a human having no problem carrying an adult rhinoceros). They use this extreme strength to fight off other males and win the right to mate with females. <br><br>Rhinoceros beetles might look scary, but are completely harmless to humans because they cannot bite or sting.',
    exampleImage: armoredBodyRealExImg
  },
  'scarab': { 
    title: 'Shoveling legs', 
    niche: 'Digging and burrowing', 
    model: scarabModelPath,
    previewImage: scarabPreviewUrl,
    exampleName: 'Deepdigger Scarab',
    scientificName: 'Peltotrupes profundus',
    exampleDescription: 'The Florida deepdigger beetle only measures up to about 1 inch, but it has been recorded tunneling up to 10 feet underground. Like many digging scarab beetles, it has flattened front legs with sharp spikes that help it push through soil. <br><br>This species is found only in Florida, and breeds in the winter (which is unusual for a beetle). The female lays a single egg at the bottom of the tunnel and seals it.',
    exampleImage: shovelingLegsRealExImg
  },
  'ladybug': { 
    title: 'Rounded shell', 
    niche: 'Good flier', 
    model: ladybugModelPath,
    previewImage: ladybugPreviewUrl,
    exampleName: 'Seven-Spotted Ladybug',
    scientificName: 'Coccinella septempunctata',
    exampleDescription: 'They might not look aerodynamic, but ladybugs are actually strong fliers. Its dome shaped shell may assist with folding in its wings inwards like origami when not in use. <br><br> One study found that ladybugs can fly as far as 75 mi at speeds of 19 mph and reach altitudes of close to 3,600 ft.',
    exampleImage: roundedShellRealExImg
  },
  'bombardier': { 
    title: 'Chemical defense', 
    niche: 'Deters predators', 
    model: bombardierModelPath,
    previewImage: bombardierPreviewUrl,
    exampleName: 'Bombardier Beetle',
    scientificName: 'Brachinus crepitans',
    exampleDescription: 'When threatened, the bombardier beetle mixes two chemicals stored separately in its abdomen, triggering an explosive reaction that fires a boiling-hot, foul-smelling spray from its rear end. <br><br>The spray is hot enough to blister skin and can be aimed in almost any direction with impressive accuracy. Studies have shown that about 43% of bombardier beetles survive being swallowed by frogs when the spray causes the frog to spit them back out alive.',
    exampleImage: chemicalDefenseRealExImg
  }
};

const headOrder = ['Stag', 'Longhorn', 'Scarab', 'Tiger', 'Weevil'];
const bodyOrder = ['darkling', 'rhino', 'scarab', 'ladybug', 'bombardier'];

// Initialize with Stag head (first in order)
let currentHead = 'Stag';

// Pattern/texture data
const patternData = {
  'stripes': {
    title: 'Stripes',
    niche: 'Warns predators',
    previewImage: stripesPreviewUrl,
    exampleName: 'Potato Beetle',
    scientificName: 'Leptinotarsa decemlineata',
    exampleDescription: 'The potato beetle\'s vivid yellow and black stripes are a genuine warning: its body is loaded with toxins absorbed from the nightshade plants it feeds on. Studies confirm that predators quickly learn to avoid the bold pattern. <br><br>Sometimes, a striped pattern can also be a way to confuse predators. When combined with quick motion, stripes can make it harder to judge speed and direction of a moving animal. This is called "motion dazzle" and is also used by zebras and fish.',
    exampleImage: stripesRealExImg,
  },
  'mottled': {
    title: 'Mottled',
    niche: 'Confuses predators',
    previewImage: mottledPreviewUrl,
    exampleName: 'Globemallow Leaf Beetle',
    scientificName: 'Calligrapha serpentina',
    exampleDescription: 'This particular genus of beetle is called Calligrapha (Greek for "beautiful writing"), named for their script-like patterns. Biologists think this intricate pattern may help confuse predators by breaking up the beetle\'s outline, making it harder to read as a single recognizable object. <br><br>Mottled patterns can also sometimes be useful as camouflage, mimicking patterns in nature like leaves, bark, or dappled sunlight.',
    exampleImage: mottledRealExImg,
  },
  'spotted': {
    title: 'Spotted',
    niche: 'Warns predators',
    previewImage: spottedPreviewUrl,
    exampleName: 'Philippine Snout Weevil',
    scientificName: 'Pachyrrhynchus congestus',
    exampleDescription: 'This family of weevils is also known as easter egg weevils, and have an extremely tough exoskeleton that predators do not like - imagine eating a walnut with the shell still on! <br><br>Its bright spots are a visual reminder to avoid eating them, a technique used by many other beetles (like ladybugs).',
    exampleImage: spottedRealExImg,
  },
  'banded': {
    title: 'Banded',
    niche: 'Warns predators',
    previewImage: bandedPreviewUrl,
    exampleName: 'Wasp Beetle',
    scientificName: 'Clytus arietis',
    exampleDescription: 'Those bold yellow bands mimic the warning colors of a stinging wasp, even though this beetle is completely harmless. It reinforces the disguise by moving in short, jerky bursts just like the real thing. <br><br>Dozens of unrelated beetle species have independently evolved the same pattern, a testament to how effectively it deters predators.',
    exampleImage: bandedRealExImg,
  },
  'plain': {
    title: 'Plain',
    niche: 'Low-cost camouflage',
    previewImage: plainPreviewUrl,
    exampleName: 'Bloody-nosed Beetle',
    scientificName: 'Timarcha tenebricosa',
    exampleDescription: 'The best camouflage for a beetle may be no patterns at all, especially if they are primarily nocturnal or live in a dark habitat. <br><br>This also lets a beetle invest in other defenses. For example, the bloody-nosed beetle can ooze large drops of foul-tasting bright red liquid from its mouth when threatened by predators.',
    exampleImage: plainRealExImg,
  }
};

const patternOrder = ['stripes', 'mottled', 'spotted', 'banded', 'plain'];
let currentPatternIndex = 0;

// Load texture patterns per body type
const textureLoader = new THREE.TextureLoader();

// Create a plain white texture (1x1 pixel)
const textureCanvas = document.createElement('canvas');
textureCanvas.width = 1;
textureCanvas.height = 1;
const ctx = textureCanvas.getContext('2d');
ctx.fillStyle = 'white';
ctx.fillRect(0, 0, 1, 1);
const plainTexture = new THREE.CanvasTexture(textureCanvas);

// Preload all body-specific textures
const bodyTextures = {};
bodyOrder.forEach(body => {
  ['stripes', 'mottled', 'spotted', 'banded'].forEach(pattern => {
    const key = `${body}-${pattern}`;
    const tex = textureLoader.load(`./textures/${body}-${pattern}.png`);
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.flipY = false;
    bodyTextures[key] = tex;
  });
});

function getPatternTexture(bodyType, patternName) {
  if (patternName === 'plain') return plainTexture;
  const key = `${bodyType}-${patternName}`;
  return bodyTextures[key] || plainTexture;
}

let currentTexture = getPatternTexture(currentBody, patternOrder[currentPatternIndex]);

// Color presets (from Figma)
const brightColors = ['#3fc3bb', '#38a850', '#D2D52F', '#e68738', '#F95549', '#CC50A7', '#ededed'];
const dullColors = ['#1A1F5F', '#1F4527', '#867E4D', '#6a4525', '#4a1a14', '#571949', '#0b0b0b'];

let primaryColorHex = brightColors[0];
let secondaryColorHex = brightColors[1];
let primaryColorType = 'bright';
let secondaryColorType = 'bright';
let activeSwatchTarget = null; // 'primary' or 'secondary'

const baseColor = new THREE.Color(primaryColorHex);
const accentColor = new THREE.Color(secondaryColorHex);

// Color example data
const colorExamples = {
  warning: {
    name: 'Net-winged Beetle',
    scientificName: 'Calopteron reticulatum',
    description: 'The net-winged beetle\'s bold orange-and-black coloring is a warning that it is toxic. Birds, spiders, and other predators that try eating one tend to avoid the pattern afterward. <br><br>The color combination is so effective that multiple species of beetles and moths have evolved to copy it, getting protection without any of the actual defenses.',
    image: warningColorRealExImg
  },
  camouflage: {
    name: 'Lesser Pine-borer',
    scientificName: 'Acanthocinus nodosus',
    description: 'Dull colors are usually a form of camouflage (although bright colors can also be camouflage, depending on the environment). <br><br>The lesser pine-borer has mottled brown-gray patterning that closely mimics the bark of pine trees where it spends most of its adult life, making it nearly invisible to predators.',
    image: camouflageRealExImg
  }
};

// Surface example data (iridescence × gloss = 4 combos)
const surfaceExamples = {
  'on-on': {
    name: 'Jewel Beetle',
    scientificName: 'Sternocera aequisignata',
    description: 'Research is still ongoing, but one leading theory is that a jewel beetle\'s shimmer might actually hide them. <br><br>The mirrored, color-shifting surface seems to confuse predators, and might even startle them. Even a brief hesitation can be the difference between life and death for a beetle.',
    image: iridGlossRealExImg
  },
  'on-off': {
    name: 'Frog Beetle',
    scientificName: 'Sagra buqueti',
    description: 'Many beetles display iridescence, which is not caused by pigments but rather the way that light is reflected off their exoskeleton ("structural coloration"). This requires less energy than creating pigments, and you can even see iridescent colors preserved in beetle fossils! <br><br>A beetle does not have to be smooth and shiny to be iridescent, which you can see from the frog beetle (named for its long legs, used for clinging to plants rather than jumping).',
    image: iridMatteRealExImg
  },
  'off-on': {
    name: 'Shining Flower Beetle',
    scientificName: 'Olibrus bicolor',
    description: 'Similarly to iridescence, a highly glossy shell may dazzle and confuse predators. These tiny 1-3mm flower beetles might be mistaken for drops of dew on the flowers that they feed on.',
    image: noIridGlossRealExImg
  },
  'off-off': {
    name: 'Diabolical Ironclad Beetle',
    scientificName: 'Phloeodes diabolicus',
    description: 'The diabolical ironclad beetle\'s shell might look simple, but it is actually so strong that it can withstand being run over by a car. <br><br>This beetle evolved to invest in its tough armor rather than flashy colors for defense. In fact, it is so tough that entomologists need to drill a hole through it before they can even mount a specimen for display.',
    image: noIridMatteRealExImg
  }
};

function getColorNiche() {
  const patternName = patternOrder[currentPatternIndex];
  if (patternName === 'plain') {
    // Only primary color matters when plain (no secondary visible)
    return primaryColorType === 'dull' ? 'Camouflage' : 'Warning coloration or mimicry';
  }
  if (primaryColorType === 'dull' && secondaryColorType === 'dull') {
    return 'Camouflage';
  }
  return 'Warning coloration or mimicry';
}

let beetleMaterial;
let headMaterial;

// Create beetle material using MeshPhysicalMaterial with custom color mixing
beetleMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff, // Will be overridden by custom color mixing
  metalness: 1.0,
  roughness: 1.0 - (195 / 200) * 0.95, // Gloss ON (shininess 195)
  clearcoat: 1.0, // Specular strength fixed at 1
  clearcoatRoughness: 0.05,
  iridescence: 1.0,
  iridescenceIOR: 1.0 + (0.8 * 0.5), // Iridescence shift ON (0.8)
  envMap: cubeRenderTarget.texture,
  envMapIntensity: 0.5 + (2.5 / 3) * 0.5, // Iridescence strength fixed at 2.5
});

// Store custom uniforms for color mixing (will be used in onBeforeCompile)
const materialUniforms = {
  baseColor: { value: baseColor },
  accentColor: { value: accentColor },
  maskMap: { value: currentTexture }
};

// Inject custom color mixing shader code
beetleMaterial.onBeforeCompile = (shader) => {
  // Add custom uniforms to the shader
  shader.uniforms.baseColor = materialUniforms.baseColor;
  shader.uniforms.accentColor = materialUniforms.accentColor;
  shader.uniforms.maskMap = materialUniforms.maskMap;
  
  // Add uniform and varying declarations to fragment shader
  // Insert right after the first #include <common>
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <common>',
    `#include <common>
uniform vec3 baseColor;
uniform vec3 accentColor;
uniform sampler2D maskMap;
varying vec2 vUv;`
  );
  
  // Add varying declaration to vertex shader
  // Insert right after the first #include <common>
  shader.vertexShader = shader.vertexShader.replace(
    '#include <common>',
    `#include <common>
varying vec2 vUv;`
  );
  
  // Make sure vUv is assigned in vertex shader
  shader.vertexShader = shader.vertexShader.replace(
    '#include <uv_vertex>',
    `#include <uv_vertex>
vUv = uv;`
  );
  
  // Replace the diffuse color calculation to use our color mixing
  shader.fragmentShader = shader.fragmentShader.replace(
    `vec4 diffuseColor = vec4( diffuse, opacity );`,
    `vec4 maskSample = texture2D(maskMap, vUv);
      vec3 mixedColor = mix(accentColor, baseColor, maskSample.r);
      vec4 diffuseColor = vec4( mixedColor, opacity );`
  );
};

// Create black material for head and legs with visible highlights
headMaterial = new THREE.ShaderMaterial({
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
        vec3 baseColor = vec3(0.05); // Very dark gray instead of pure black

        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);
        vec3 lightDir = normalize(lightPosition - vWorldPosition);

        // Diffuse lighting
        float diffuse = max(dot(normal, lightDir), 0.0);
        vec3 col = baseColor * (0.3 + diffuse * 0.7); // Ambient + diffuse

        // Specular highlights
        vec3 halfVector = normalize(lightDir + viewDir);
        float specAngle = max(dot(halfVector, normal), 0.0);
        float specular = pow(specAngle, shininess);
        vec3 specularColor = vec3(1.0) * specular * specularStrength;
        col += specularColor;

        gl_FragColor = vec4(col, 1.0);
      }
    `,
});

// Function to apply materials to a model
function applyMaterialsToModel(model, bodyType) {
  if (!headMeshesByBody[bodyType]) {
    headMeshesByBody[bodyType] = {};
  }
  
  model.traverse(obj => {
    if (!obj.isMesh) return;

    if (obj.name === 'Carapace') {
      carapaceMesh = obj;
      obj.material = beetleMaterial;
    }

    if (obj.name === 'Longhorn' || obj.name === 'Scarab' || obj.name === 'Stag' || obj.name === 'Tiger' || obj.name === 'Weevil') {
      headMeshesByBody[bodyType][obj.name] = obj;
      obj.material = headMaterial;
    }
    
    if (obj.name === 'Legs') {
      obj.material = headMaterial; 
    }
  });
}

// Load all body models
let modelsLoaded = 0;
const totalModels = bodyOrder.length;

function setAnimationStateForBody(bodyType, shouldPlay) {
  const action = beetleWalkActionsByBody[bodyType];
  if (!action) return;

  if (shouldPlay) {
    action.reset();
    action.paused = false;
    action.enabled = true;
    action.play();
  } else {
    // Deactivate animation influence so the model returns to its bind/rest pose.
    action.stop();
    action.enabled = false;
  }
}

function syncCurrentAnimationController() {
  currentWalkMixer = beetleMixersByBody[currentBody] || null;
  currentWalkAction = beetleWalkActionsByBody[currentBody] || null;
}

bodyOrder.forEach(bodyType => {
  const bodyInfo = bodyData[bodyType];
  loader.load(bodyInfo.model, gltf => {
    const model = gltf.scene;
    beetleModels[bodyType] = model;
    model.position.y=-0.2; //beetle position on the scene
    const baseRotation = beetleBaseRotationByBody[bodyType] || { x: 0, y: 0, z: 0 };
    model.rotation.set(baseRotation.x, baseRotation.y, baseRotation.z);
    beetleStartYByBody[bodyType] = model.position.y;
    scene.add(model);
    
    // Apply materials to meshes
    applyMaterialsToModel(model, bodyType);

    if (gltf.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(model);
      const walkAction = mixer.clipAction(gltf.animations[0]);
      walkAction.loop = THREE.LoopRepeat;
      walkAction.clampWhenFinished = false;
      walkAction.enabled = false; // Stay in rest pose until release.
      beetleMixersByBody[bodyType] = mixer;
      beetleWalkActionsByBody[bodyType] = walkAction;
    }
    
    // Set visibility based on current body
    if (bodyType === currentBody) {
      currentBeetle = model;
      syncCurrentAnimationController();
      switchHead(currentHead);
    } else {
      model.visible = false;
    }
    
    modelsLoaded++;
    
    // Apply initial pattern texture when all models are loaded
    if (modelsLoaded === totalModels) {
      applyPattern(patternOrder[currentPatternIndex]);
    }
  });
});

function switchHead(targetHeadName) {
  const headMeshes = headMeshesByBody[currentBody];
  
  if (!headMeshes || Object.keys(headMeshes).length === 0) {
    console.warn('No head meshes loaded yet.');
    return;
  }

  console.log(`Switching to head: ${targetHeadName}`);
  
  // Update index to match the head name
  const newIndex = headOrder.indexOf(targetHeadName);
  if (newIndex !== -1) {
    currentHeadIndex = newIndex;
  }

  for (const name in headMeshes) {
    const mesh = headMeshes[name];
    if (!mesh) {
      console.warn(`Head mesh "${name}" is undefined.`);
      continue;
    }

    mesh.visible = (name === targetHeadName);
    console.log(`  - ${name} visibility: ${mesh.visible}`);
  }

  if (!headMeshes[targetHeadName]) {
    console.error(`Head "${targetHeadName}" not found in loaded model.`);
  }
  
  currentHead = targetHeadName;
  
  // Update UI
  updateHeadCarouselUI();
}

function switchBody(bodyType) {
  setAnimationStateForBody(currentBody, false);
  releaseAscentActive = false;

  if (bodyType === currentBody) return;
  
  // Update index to match the body type
  const newIndex = bodyOrder.indexOf(bodyType);
  if (newIndex !== -1) {
    currentBodyIndex = newIndex;
  }
  
  // Hide current body
  if (currentBeetle) {
    currentBeetle.visible = false;
  }
  
  currentBody = bodyType;
  
  // Show new body
  if (beetleModels[bodyType]) {
    beetleModels[bodyType].visible = true;
    currentBeetle = beetleModels[bodyType];
    syncCurrentAnimationController();
    
    // Update carapaceMesh reference
    beetleModels[bodyType].traverse(obj => {
      if (obj.isMesh && obj.name === 'Carapace') {
        carapaceMesh = obj;
      }
    });
  }
  
  // Reapply head visibility for the new body
  switchHead(currentHead);
  
  // Update texture for current pattern on new body
  applyPattern(patternOrder[currentPatternIndex]);
  
  // Update UI
  updateBodyCarouselUI();
}

function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function tweenCameraToStart(durationMs = 1000) {
  const fromPosition = camera.position.clone();
  const fromTarget = controls.target.clone();

  return new Promise(resolve => {
    const start = performance.now();

    function step(now) {
      const t = Math.min((now - start) / durationMs, 1);
      const eased = easeInOutCubic(t);

      camera.position.lerpVectors(fromPosition, RELEASE_CAMERA_POSITION, eased);
      controls.target.lerpVectors(fromTarget, RELEASE_CAMERA_TARGET, eased);
      controls.update();

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(step);
  });
}

async function runReleaseSequence() {
  if (releaseSequenceRunning) return;
  releaseSequenceRunning = true;

  if (releaseButtonEl) {
    releaseButtonEl.disabled = true;
    releaseButtonEl.textContent = 'Releasing...';
  }

  try {
    await tweenCameraToStart(1000);
    if (currentWalkAction && currentBeetle) {
      currentBeetle.position.y = beetleStartYByBody[currentBody] ?? currentBeetle.position.y;
      currentBeetle.visible = true;
      setAnimationStateForBody(currentBody, true);
      releaseAscentActive = true;
    } else {
      console.warn(`No walk animation found for body "${currentBody}".`);
    }
  } finally {
    releaseSequenceRunning = false;
    if (releaseButtonEl) {
      releaseButtonEl.disabled = false;
      releaseButtonEl.textContent = 'Release beetle';
    }
  }
}

function initReleaseButton() {
  if (!releaseButtonEl) return;
  releaseButtonEl.style.backgroundImage = `url('${import.meta.env.BASE_URL}images/release-button.svg')`;
  releaseButtonEl.addEventListener('click', runReleaseSequence);
}

// Panel management
let activePanel = null;
const customizerDialog = customizerDialogEl;

function showPanel(panelId) {
  // Close any open color picker popup
  const colorPopup = document.getElementById('color-picker-popup');
  if (colorPopup) colorPopup.classList.remove('visible');
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));

  // Hide all panels
  document.querySelectorAll('.panel').forEach(panel => {
    panel.classList.remove('active');
  });
  
  // Remove active state from all badges
  document.querySelectorAll('.badge-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Show selected panel if it exists
  const panel = document.getElementById(`${panelId}-panel`);
  if (panel) {
    panel.classList.add('active');
    activePanel = panelId;
    
    // Open the dialog container
    customizerDialog.classList.add('open');
    
    // Mark corresponding badge as active
    const badge = document.querySelector(`.badge-btn[data-panel="${panelId}"]`);
    if (badge) {
      badge.classList.add('active');
    }
    
    // Swap badge images to reflect active state
    updateBadgeImages();
  }
}

function hidePanel() {
  // Close any open color picker popup
  const colorPopup = document.getElementById('color-picker-popup');
  if (colorPopup) colorPopup.classList.remove('visible');
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
  activeSwatchTarget = null;

  document.querySelectorAll('.panel').forEach(panel => {
    panel.classList.remove('active');
  });
  document.querySelectorAll('.badge-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Close the dialog container
  customizerDialog.classList.remove('open');
  activePanel = null;
  
  // Reset all badge images to default
  updateBadgeImages();
}

// Close button handlers — only close buttons close the dialog
document.querySelectorAll('.close-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    hidePanel();
  });
});

// Badge click handlers
document.querySelectorAll('.badge-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const panelId = btn.getAttribute('data-panel');
    if (activePanel === panelId) {
      hidePanel();
    } else {
      showPanel(panelId);
    }
  });
});

// Carousel state
let currentHeadIndex = 0; // Start with Stag (first in headOrder)
let currentBodyIndex = bodyOrder.indexOf('darkling');

// Carousel navigation functions
function navigateHead(direction) {
  if (direction === 'next') {
    currentHeadIndex = (currentHeadIndex + 1) % headOrder.length;
  } else {
    currentHeadIndex = (currentHeadIndex - 1 + headOrder.length) % headOrder.length;
  }
  const headName = headOrder[currentHeadIndex];
  currentHead = headName;
  currentHeadIndex = headOrder.indexOf(headName); // Ensure index is correct
  switchHead(headName);
  const box = document.querySelector('#head-shape-panel .real-example-box');
  if (box) box.scrollTop = 0;
}

function navigateBody(direction) {
  if (direction === 'next') {
    currentBodyIndex = (currentBodyIndex + 1) % bodyOrder.length;
  } else {
    currentBodyIndex = (currentBodyIndex - 1 + bodyOrder.length) % bodyOrder.length;
  }
  const bodyType = bodyOrder[currentBodyIndex];
  switchBody(bodyType);
  const box = document.querySelector('#body-panel .real-example-box');
  if (box) box.scrollTop = 0;
}

// Update carousel UI
function updateHeadCarouselUI() {
  const headName = headOrder[currentHeadIndex];
  const headInfo = headData[headName];
  
  // Update title
  const titleEl = document.querySelector('#head-shape-panel .carousel-title');
  if (titleEl) titleEl.textContent = headInfo.title;
  
  // Update niche characteristic chip
  const nicheEl = document.querySelector('#head-shape-panel .carousel-niche-chip');
  if (nicheEl) nicheEl.textContent = headInfo.niche;
  
  // Update preview image
  const previewImg = document.getElementById('head-preview-image');
  if (previewImg && headInfo.previewImage) {
    previewImg.src = headInfo.previewImage;
  }
  
  // Update real example content
  const exampleName = document.getElementById('head-example-name');
  const exampleScientific = document.getElementById('head-example-scientific-name');
  const exampleDescription = document.getElementById('head-example-description');
  const exampleImage = document.getElementById('head-example-image');
  
  if (exampleName) exampleName.textContent = headInfo.exampleName;
  if (exampleScientific) exampleScientific.textContent = headInfo.scientificName;
  if (exampleDescription) exampleDescription.innerHTML = headInfo.exampleDescription;
  if (exampleImage && headInfo.exampleImage) {
    exampleImage.src = headInfo.exampleImage;
  }
  
  // Update indicators
  updateIndicators('head-shape-panel', headOrder.length, currentHeadIndex);
  
  // Update bottom row niche chips
  updateNicheChips();
}

function updateBodyCarouselUI() {
  const bodyType = bodyOrder[currentBodyIndex];
  const bodyInfo = bodyData[bodyType];
  
  // Update title
  const titleEl = document.querySelector('#body-panel .carousel-title');
  if (titleEl) titleEl.textContent = bodyInfo.title;
  
  // Update niche characteristic chip
  const nicheEl = document.querySelector('#body-panel .carousel-niche-chip');
  if (nicheEl) nicheEl.textContent = bodyInfo.niche;
  
  // Update preview image
  const previewImg = document.getElementById('body-preview-image');
  if (previewImg && bodyInfo.previewImage) {
    previewImg.src = bodyInfo.previewImage;
  }
  
  // Update real example content
  const exampleName = document.getElementById('body-example-name');
  const exampleScientific = document.getElementById('body-example-scientific-name');
  const exampleDescription = document.getElementById('body-example-description');
  const exampleImage = document.getElementById('body-example-image');
  
  if (exampleName) exampleName.textContent = bodyInfo.exampleName;
  if (exampleScientific) exampleScientific.textContent = bodyInfo.scientificName;
  if (exampleDescription) exampleDescription.innerHTML = bodyInfo.exampleDescription;
  if (exampleImage && bodyInfo.exampleImage) {
    exampleImage.src = bodyInfo.exampleImage;
  }
  
  // Update indicators
  updateIndicators('body-panel', bodyOrder.length, currentBodyIndex);
  
  // Update bottom row niche chips
  updateNicheChips();
}

function updateIndicators(panelId, total, currentIndex) {
  const indicatorsContainer = document.querySelector(`#${panelId} .carousel-indicators`);
  if (!indicatorsContainer) return;
  
  indicatorsContainer.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('div');
    dot.className = `carousel-dot ${i === currentIndex ? 'active' : ''}`;
    indicatorsContainer.appendChild(dot);
  }
}

// Update bottom row niche characteristic chips
function updateNicheChips() {
  const container = document.getElementById('niche-chips-container');
  if (!container) return;
  
  container.innerHTML = '';
  const categoryToPanel = {
    head: 'head-shape',
    body: 'body',
    pattern: 'pattern',
    color: 'color',
    surface: 'surface',
  };
  
  // Collect niche characteristics with their category for color-coding
  const niches = [];
  
  const headName = headOrder[currentHeadIndex];
  const headInfo = headData[headName];
  if (headInfo && headInfo.niche) {
    niches.push({ text: headInfo.niche, category: 'head' });
  }
  
  const bodyType = bodyOrder[currentBodyIndex];
  const bodyInfo = bodyData[bodyType];
  if (bodyInfo && bodyInfo.niche) {
    niches.push({ text: bodyInfo.niche, category: 'body' });
  }
  
  const patternName = patternOrder[currentPatternIndex];
  const patternInfo = patternData[patternName];
  if (patternInfo && patternInfo.niche) {
    niches.push({ text: patternInfo.niche, category: 'pattern' });
  }
  
  // Color niche (based on bright/dull selection)
  niches.push({ text: getColorNiche(), category: 'color' });
  
  // Surface niche
  niches.push({ text: 'Still being researched', category: 'surface' });
  
  // Create chip elements with category-based colors
  niches.forEach(({ text, category }) => {
    const chip = document.createElement('div');
    chip.className = `niche-chip niche-chip--${category}`;
    chip.textContent = text;
    chip.setAttribute('role', 'button');
    chip.setAttribute('tabindex', '0');
    chip.setAttribute('aria-label', `Open ${category} panel`);

    const panelId = categoryToPanel[category];
    if (panelId) {
      chip.addEventListener('click', () => {
        showPanel(panelId);
      });
      chip.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          showPanel(panelId);
        }
      });
    }

    container.appendChild(chip);
  });
}

// Set badge images from imported URLs and wire up hover listeners
function setBadgeImages() {
  document.querySelectorAll('.badge-btn').forEach(btn => {
    const panelId = btn.getAttribute('data-panel');
    const img = btn.querySelector('img');
    const images = badgeImages[panelId];
    if (!img || !images) return;

    // Set default image
    img.src = images.default;

    // Hover: switch to hover image (unless already active)
    btn.addEventListener('mouseenter', () => {
      if (!btn.classList.contains('active')) {
        img.src = images.hover;
      }
    });
    btn.addEventListener('mouseleave', () => {
      if (!btn.classList.contains('active')) {
        img.src = images.default;
      }
    });
  });
}

// Swap all badge images to match their active/default state
function updateBadgeImages() {
  document.querySelectorAll('.badge-btn').forEach(btn => {
    const panelId = btn.getAttribute('data-panel');
    const img = btn.querySelector('img');
    const images = badgeImages[panelId];
    if (!img || !images) return;
    img.src = btn.classList.contains('active') ? images.hover : images.default;
  });
}

// Initialize carousel controls
function initCarouselControls() {
  // Head carousel controls
  const headPrevBtn = document.querySelector('#head-shape-panel .carousel-prev');
  const headNextBtn = document.querySelector('#head-shape-panel .carousel-next');
  if (headPrevBtn) headPrevBtn.addEventListener('click', () => navigateHead('prev'));
  if (headNextBtn) headNextBtn.addEventListener('click', () => navigateHead('next'));
  
  // Body carousel controls
  const bodyPrevBtn = document.querySelector('#body-panel .carousel-prev');
  const bodyNextBtn = document.querySelector('#body-panel .carousel-next');
  if (bodyPrevBtn) bodyPrevBtn.addEventListener('click', () => navigateBody('prev'));
  if (bodyNextBtn) bodyNextBtn.addEventListener('click', () => navigateBody('next'));
  
  // Pattern carousel controls
  const patternPrevBtn = document.querySelector('#pattern-panel .carousel-prev');
  const patternNextBtn = document.querySelector('#pattern-panel .carousel-next');
  if (patternPrevBtn) patternPrevBtn.addEventListener('click', () => navigatePattern('prev'));
  if (patternNextBtn) patternNextBtn.addEventListener('click', () => navigatePattern('next'));
  
  // Initialize UI
  updateHeadCarouselUI();
  updateBodyCarouselUI();
  updatePatternCarouselUI();
  updateNicheChips();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setBadgeImages();
    initCarouselControls();
    initColorPanel();
    initSurfacePanel();
    initReleaseButton();
  });
} else {
  setBadgeImages();
  initCarouselControls();
  initColorPanel();
  initSurfacePanel();
  initReleaseButton();
}

// Pattern application
function applyPattern(patternName) {
  currentTexture = getPatternTexture(currentBody, patternName);
  materialUniforms.maskMap.value = currentTexture;
  beetleMaterial.needsUpdate = true;
}

// Pattern carousel navigation
function navigatePattern(direction) {
  if (direction === 'next') {
    currentPatternIndex = (currentPatternIndex + 1) % patternOrder.length;
  } else {
    currentPatternIndex = (currentPatternIndex - 1 + patternOrder.length) % patternOrder.length;
  }
  applyPattern(patternOrder[currentPatternIndex]);
  updatePatternCarouselUI();
  const box = document.querySelector('#pattern-panel .real-example-box');
  if (box) box.scrollTop = 0;
}

function updatePatternCarouselUI() {
  const patternName = patternOrder[currentPatternIndex];
  const patternInfo = patternData[patternName];
  
  const titleEl = document.querySelector('#pattern-panel .carousel-title');
  if (titleEl) titleEl.textContent = patternInfo.title;
  
  const nicheEl = document.querySelector('#pattern-panel .carousel-niche-chip');
  if (nicheEl) nicheEl.textContent = patternInfo.niche;
  
  // Update preview image
  const previewImg = document.getElementById('pattern-preview-image');
  if (previewImg && patternInfo.previewImage) {
    previewImg.src = patternInfo.previewImage;
  }
  
  // Update real example content
  const exampleName = document.getElementById('pattern-example-name');
  const exampleScientific = document.getElementById('pattern-example-scientific-name');
  const exampleDescription = document.getElementById('pattern-example-description');
  const exampleImage = document.getElementById('pattern-example-image');
  
  if (exampleName) exampleName.textContent = patternInfo.exampleName;
  if (exampleScientific) exampleScientific.textContent = patternInfo.scientificName;
  if (exampleDescription) exampleDescription.innerHTML = patternInfo.exampleDescription;
  if (exampleImage && patternInfo.exampleImage) exampleImage.src = patternInfo.exampleImage;
  
  updateIndicators('pattern-panel', patternOrder.length, currentPatternIndex);
  updateColorSwatchVisibility();
  updateColorUI();
  updateNicheChips();
}

// Color panel initialization
function initColorPanel() {
  // Populate bright/dull color presets in the popup
  const brightRow = document.getElementById('bright-colors-row');
  const dullRow = document.getElementById('dull-colors-row');
  
  if (brightRow) {
    brightColors.forEach(color => {
      const swatch = document.createElement('div');
      swatch.className = 'color-preset';
      swatch.dataset.color = color;
      swatch.dataset.type = 'bright';
      swatch.style.backgroundColor = color;
      brightRow.appendChild(swatch);
    });
  }
  
  if (dullRow) {
    dullColors.forEach(color => {
      const swatch = document.createElement('div');
      swatch.className = 'color-preset';
      swatch.dataset.color = color;
      swatch.dataset.type = 'dull';
      swatch.style.backgroundColor = color;
      dullRow.appendChild(swatch);
    });
  }
  
  // Set initial swatch colors
  const primarySwatch = document.getElementById('primary-swatch');
  const secondarySwatch = document.getElementById('secondary-swatch');
  if (primarySwatch) primarySwatch.style.backgroundColor = primaryColorHex;
  if (secondarySwatch) secondarySwatch.style.backgroundColor = secondaryColorHex;
  
  const popup = document.getElementById('color-picker-popup');
  
  // Swatch click handlers (open/close popup)
  document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = swatch.dataset.target;
      
      if (activeSwatchTarget === target && popup.classList.contains('visible')) {
        popup.classList.remove('visible');
        swatch.classList.remove('active');
        activeSwatchTarget = null;
      } else {
        activeSwatchTarget = target;
        
        // Position popup as floating overlay to the right of the clicked swatch
        const swatchRect = swatch.getBoundingClientRect();
        popup.style.top = swatchRect.top + 'px';
        popup.style.left = (swatchRect.right + 8) + 'px';
        popup.style.width = 'auto';
        
        popup.classList.add('visible');
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        updatePresetSelection();
      }
    });
  });
  
  // Preset color click handler — don't close popup, only close on click-outside
  if (popup) {
    popup.addEventListener('click', (e) => {
      e.stopPropagation();
      const preset = e.target.closest('.color-preset');
      if (!preset) return;
      
      const color = preset.dataset.color;
      const type = preset.dataset.type;
      
      if (activeSwatchTarget === 'primary') {
        primaryColorHex = color;
        primaryColorType = type;
        baseColor.set(color);
        materialUniforms.baseColor.value = baseColor;
        if (primarySwatch) primarySwatch.style.backgroundColor = color;
      } else if (activeSwatchTarget === 'secondary') {
        secondaryColorHex = color;
        secondaryColorType = type;
        accentColor.set(color);
        materialUniforms.accentColor.value = accentColor;
        if (secondarySwatch) secondarySwatch.style.backgroundColor = color;
      }
      
      updatePresetSelection();
      updateColorUI();
    });
  }
  
  // Click outside popup to close
  document.addEventListener('click', (e) => {
    if (popup && popup.classList.contains('visible') &&
        !e.target.closest('.color-picker-popup') && !e.target.closest('.color-swatch')) {
      popup.classList.remove('visible');
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      activeSwatchTarget = null;
    }
  });
  
  // Initialize UI
  updateColorSwatchVisibility();
  updateColorUI();
}

// Surface panel initialization
function initSurfacePanel() {
  const iridToggle = document.getElementById('iridescenceToggle');
  const glossToggle = document.getElementById('glossToggle');
  
  if (iridToggle) {
    iridToggle.addEventListener('change', (e) => {
      if (!beetleMaterial) return;
      beetleMaterial.iridescenceIOR = e.target.checked ? 1.0 + (0.8 * 0.5) : 1.0;
      updateSurfaceExampleUI();
    });
  }
  
  if (glossToggle) {
    glossToggle.addEventListener('change', (e) => {
      if (!beetleMaterial) return;
      beetleMaterial.roughness = e.target.checked ? 1.0 - (195 / 200) * 0.95 : 1.0;
      updateSurfaceExampleUI();
    });
  }
  
  updateSurfaceExampleUI();
}

// Show/hide secondary color swatch based on current pattern
function updateColorSwatchVisibility() {
  const secondaryGroup = document.getElementById('secondary-color-group');
  if (!secondaryGroup) return;
  
  const patternName = patternOrder[currentPatternIndex];
  if (patternName === 'plain') {
    secondaryGroup.classList.add('hidden');
    // Close popup if it was open for the secondary swatch
    if (activeSwatchTarget === 'secondary') {
      const popup = document.getElementById('color-picker-popup');
      if (popup) popup.classList.remove('visible');
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      activeSwatchTarget = null;
    }
  } else {
    secondaryGroup.classList.remove('hidden');
  }
}

function updatePresetSelection() {
  const currentColor = activeSwatchTarget === 'primary' ? primaryColorHex : secondaryColorHex;
  document.querySelectorAll('.color-preset').forEach(preset => {
    preset.classList.toggle('selected', preset.dataset.color === currentColor);
  });
}

function updateColorUI() {
  const niche = getColorNiche();
  const nicheChip = document.getElementById('color-niche-chip');
  if (nicheChip) nicheChip.textContent = niche;
  
  const exampleKey = (primaryColorType === 'dull' && secondaryColorType === 'dull') ? 'camouflage' : 'warning';
  const example = colorExamples[exampleKey];
  
  const nameEl = document.getElementById('color-example-name');
  const scientificEl = document.getElementById('color-example-scientific-name');
  const descEl = document.getElementById('color-example-description');
  const imgEl = document.getElementById('color-example-image');
  
  if (nameEl) nameEl.textContent = example.name;
  if (scientificEl) scientificEl.textContent = example.scientificName;
  if (descEl) descEl.innerHTML = example.description;
  if (imgEl) imgEl.src = example.image;
  
  updateNicheChips();
}

function updateSurfaceExampleUI() {
  const iridOn = document.getElementById('iridescenceToggle')?.checked;
  const glossOn = document.getElementById('glossToggle')?.checked;
  
  const key = `${iridOn ? 'on' : 'off'}-${glossOn ? 'on' : 'off'}`;
  const example = surfaceExamples[key];
  if (!example) return;
  
  const nameEl = document.getElementById('surface-example-name');
  const scientificEl = document.getElementById('surface-example-scientific-name');
  const descEl = document.getElementById('surface-example-description');
  const imgEl = document.getElementById('surface-example-image');
  
  if (nameEl) nameEl.textContent = example.name;
  if (scientificEl) scientificEl.textContent = example.scientificName;
  if (descEl) descEl.innerHTML = example.description;
  if (imgEl) imgEl.src = example.image;
}

let frameCount = 0;
let previousFrameTimeMs = performance.now();
function animate(now = performance.now()) {
  const deltaSeconds = Math.max((now - previousFrameTimeMs) / 1000, 0);
  previousFrameTimeMs = now;

  // Continuously match renderer to container size — resize + render in the
  // same frame means no flash or jerk, even during CSS transitions.
  const pixelRatio = renderer.getPixelRatio();
  const width = canvasContainer.clientWidth;
  const height = canvasContainer.clientHeight;
  const needsResize =
    canvas.width !== Math.floor(width * pixelRatio) ||
    canvas.height !== Math.floor(height * pixelRatio);

  if (needsResize && width > 0 && height > 0) {
    // false = don't touch canvas.style (CSS flexbox handles that)
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  controls.update();

  if (currentWalkMixer) {
    currentWalkMixer.update(deltaSeconds);
  }

  if (releaseAscentActive && currentBeetle) {
    currentBeetle.position.y += RELEASE_ASCENT_SPEED * deltaSeconds;
    if (currentBeetle.position.y >= RELEASE_HIDE_Y) {
      currentBeetle.visible = false;
      setAnimationStateForBody(currentBody, false);
      releaseAscentActive = false;
    }
  }

  // Update environment map every 30 frames for better performance
  if (currentBeetle && frameCount % 30 === 0) {
    const wasVisible = currentBeetle.visible;
    currentBeetle.visible = false; // Hide beetle to avoid self-reflection
    cubeCamera.position.copy(currentBeetle.position);
    cubeCamera.update(renderer, scene);
    currentBeetle.visible = wasVisible;
  }

  renderer.render(scene, camera);
  frameCount++;
  requestAnimationFrame(animate);
}
animate();