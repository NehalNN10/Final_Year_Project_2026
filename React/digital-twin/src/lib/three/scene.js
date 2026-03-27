import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { worldObjects } from "./world.js";
// Alias the import so it's clear what it's doing
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

export let scene, camera, renderer, controls;
export let heatmapCanvas, heatmapCtx, heatmapTexture, heatmapPlane, heatmapSize, heatmapWidth, heatmapHeight;
export let showHeatmap = true;
export function initScene(container) {
    // Force a minimum size if container is briefly 0x0 during React hydration
    const w = container.clientWidth || window.innerWidth || 800;
    const h = container.clientHeight || window.innerHeight || 600;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    
    // PCFShadowMap (Without the 'Soft') is the new standard
    renderer.shadowMap.type = THREE.PCFShadowMap; 
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x131314);

    // Use the RGBELoader normally
    const hdrLoader = new RGBELoader();
    
    // Note: ensure your path starts with / for Next.js public folder
    hdrLoader.load('/models/qwantani_sunset_puresky_4k.hdr', function(texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture; 
        scene.background = texture; 
    });

    const fov = 75;
    const aspect = w / h;
    camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 200);
    camera.position.set(-10, 15, 0);

    // INJECT INTO REACT CONTAINER
    container.appendChild(renderer.domElement);

    const sunLight = new THREE.DirectionalLight(0xffffff, 3);
    sunLight.position.set(10, 20, 10); 
    sunLight.castShadow = true;

    const d = 20;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.mapSize.width = 4096; 
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.bias = -0.0001; 
    scene.add(sunLight);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableRotate = true; 
    controls.screenSpacePanning = false; 
    controls.maxPolarAngle = Math.PI / 2;

    scene.add(camera);



}

// export function setupHeatmap() {

//     const floor = worldObjects.floor;

//     const box = new THREE.Box3().setFromObject(floor);

//     const size = new THREE.Vector3();
//     box.getSize(size);

//     const center = new THREE.Vector3();
//     box.getCenter(center);

//     const floorWidth = size.x;
//     const floorDepth = size.z;

//     const aspectRatio = floorWidth / floorDepth;

//     const heatmapBaseSize = 1024;
//     const heatmapWidth = heatmapBaseSize;
//     const heatmapHeight = Math.round(heatmapBaseSize / aspectRatio);

//     heatmapSize = heatmapBaseSize;

//     heatmapCanvas = document.createElement("canvas");
//     heatmapCanvas.width = heatmapWidth;
//     heatmapCanvas.height = heatmapHeight;

//     heatmapCtx = heatmapCanvas.getContext("2d");

//     heatmapTexture = new THREE.CanvasTexture(heatmapCanvas);
//     heatmapTexture.minFilter = THREE.LinearFilter;
//     heatmapTexture.magFilter = THREE.LinearFilter;

//     heatmapPlane = new THREE.Mesh(
//         new THREE.PlaneGeometry(floorWidth, floorDepth),
//         new THREE.MeshBasicMaterial({
//             map: heatmapTexture,
//             transparent: true,
//             opacity: 0.6,
//             depthWrite: false
//         })
//     );

//     heatmapPlane.rotation.x = -Math.PI / 2;
//     heatmapPlane.position.set(center.x, 0.1, center.z);

//     scene.add(heatmapPlane);

//     console.log("Heatmap Bounds:", {
//         width: floorWidth,
//         depth: floorDepth
//     });
// }
// export function setupHeatmap() {
   
//     // ----------------- Heatmap Setup -----------------
//     // Floor dimensions: 20 wide × 10 deep
//     const floorWidth = 20;
//     const floorDepth = 20;
//     const aspectRatio = floorWidth / floorDepth; // 2:1 ratio

//     // Canvas size: maintain high resolution but rectangular
//     const heatmapBaseSize = 1024;
//     const heatmapWidth = heatmapBaseSize;
//     const heatmapHeight = Math.round(heatmapBaseSize / aspectRatio); // 512 for 2:1

//     heatmapSize = heatmapBaseSize; // Keep for compatibility
//     heatmapCanvas = document.createElement("canvas");
//     heatmapCanvas.width = heatmapWidth;
//     heatmapCanvas.height = heatmapHeight;
//     heatmapCtx = heatmapCanvas.getContext("2d");

//     // Create a Three.js plane to display the heatmap
//     heatmapTexture = new THREE.CanvasTexture(heatmapCanvas);
//     heatmapTexture.minFilter = THREE.LinearFilter;
//     heatmapTexture.magFilter = THREE.LinearFilter;
//     heatmapTexture.wrapS = THREE.ClampToEdgeWrapping;
//     heatmapTexture.wrapT = THREE.ClampToEdgeWrapping;

//     heatmapPlane = new THREE.Mesh(
//         new THREE.PlaneGeometry(floorWidth, floorDepth), // 20 × 10
//         new THREE.MeshBasicMaterial({
//             map: heatmapTexture,
//             transparent: true,
//             opacity: 0.6,
//             depthWrite: false
//         })
//     );
      
//     heatmapPlane.material.opacity = showHeatmap ? 0.6 : 0;
//     heatmapPlane.rotation.x = -Math.PI / 2;
//     heatmapPlane.position.y = 0.1;
//     scene.add(heatmapPlane);
// }

export function setupHeatmap() {
    // ----------------- Heatmap Setup -----------------
    // Manual floor dimensions from 3D model
    const floorWidth = 18;   // X-axis
    const floorDepth = 17.75; // Z-axis
    const aspectRatio = floorWidth / floorDepth; 

    // Canvas size: maintain high resolution but rectangular
    const heatmapBaseSize = 1024;

    heatmapWidth = heatmapBaseSize;
    heatmapHeight = Math.round(heatmapBaseSize / aspectRatio);

    heatmapSize = heatmapBaseSize; 
    heatmapCanvas = document.createElement("canvas");
    heatmapCanvas.width = Math.floor(heatmapWidth);
    heatmapCanvas.height = Math.floor(heatmapHeight);
    heatmapWidth = heatmapCanvas.width;
    heatmapHeight = heatmapCanvas.height;
    heatmapCtx = heatmapCanvas.getContext("2d");

    // Create a Three.js plane to display the heatmap
    heatmapTexture = new THREE.CanvasTexture(heatmapCanvas);
    heatmapTexture.minFilter = THREE.LinearFilter;
    heatmapTexture.magFilter = THREE.LinearFilter;
    heatmapTexture.wrapS = THREE.ClampToEdgeWrapping;
    heatmapTexture.wrapT = THREE.ClampToEdgeWrapping;

    heatmapPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(floorWidth, floorDepth), // Match actual floor
        new THREE.MeshBasicMaterial({
            map: heatmapTexture,
            transparent: true,
            opacity: 0.6,
            depthWrite: false
        })
    );

    // Position and rotate the plane to match floor
    heatmapPlane.material.opacity = showHeatmap ? 1 : 0;
    heatmapPlane.rotation.x = -Math.PI / 2;
    // Center it exactly on the floor
    heatmapPlane.position.x = ( -9 + 9 ) / 2;       // centerX = 0
    heatmapPlane.position.z = ( -9 + 8.75 ) / 2;    // centerZ ≈ -0.125
    heatmapPlane.position.y = 0.1;                  // slightly above floor
    scene.add(heatmapPlane);
}