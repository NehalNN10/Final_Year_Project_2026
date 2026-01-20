import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import { RGBELoader } from 'jsm/loaders/RGBELoader.js';

export const w = window.innerWidth - 420;
export const h = window.innerHeight - 100;

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);

// Enable Shadows and Tone Mapping
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x131314);

const rgbeLoader = new RGBELoader();
rgbeLoader.load('./files/qwantani_sunset_puresky_4k.hdr', function(texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture; 
    scene.background = texture; 
});

const fov = 75;
const aspect = w / h;
const near = 0.1;
const far = 200;
export const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(-10, 15);

document.body.appendChild(renderer.domElement);

// const headlight = new THREE.DirectionalLight(0xffffff, 1);
// headlight.position.set(0, 0, 1);
// camera.add(headlight);

// Directional Light (The "Sun" - Casts Shadows)
const sunLight = new THREE.DirectionalLight(0xffffff, 3);
sunLight.position.set(10, 20, 10); // Angle it so shadows fall nicely
sunLight.castShadow = true;

const d = 20; // 20 meters in every direction
sunLight.shadow.camera.left = -d;
sunLight.shadow.camera.right = d;
sunLight.shadow.camera.top = d;
sunLight.shadow.camera.bottom = -d;

sunLight.shadow.mapSize.width = 4096; 
sunLight.shadow.mapSize.height = 4096;
sunLight.shadow.bias = -0.0001; // Removes stripes

scene.add(sunLight);

export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableRotate = true; 
controls.screenSpacePanning = false; 
controls.maxPolarAngle = Math.PI / 2;

scene.add(camera);

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);