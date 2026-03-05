import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";

export const w = window.innerWidth;
export const h = window.innerHeight;

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);

document.body.appendChild(renderer.domElement);

const fov = 75;
const aspect = w / h;
const near = 1;
const far = 200;
export const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(0, 20, 0);

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x131314);
scene.rotateY(Math.PI/2);

export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableRotate = true; 
controls.screenSpacePanning = true; 
controls.minPolarAngle = 0; 
controls.maxPolarAngle = 0;

const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);