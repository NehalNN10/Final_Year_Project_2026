import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";

const w = window.innerWidth;
const h = window.innerHeight;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);

document.body.appendChild(renderer.domElement);

const fov = 75;
const aspect = w / h;
const near = 1;
const far = 200;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(0, 20, 0);

const scene = new THREE.Scene();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableRotate = true; 
controls.screenSpacePanning = true; 
controls.minPolarAngle = 0; 
controls.maxPolarAngle = 0;

const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x447c5a, side: THREE.DoubleSide });
const baseWallMat = new THREE.MeshBasicMaterial({ color: 0x999999, side: THREE.DoubleSide });
const baseWoodMat = new THREE.MeshBasicMaterial({ color: 0x462416, side: THREE.DoubleSide });
const baseGlassMat = new THREE.MeshBasicMaterial({ color: 0xffffffff, side: THREE.DoubleSide });
const basePillarMat = new THREE.MeshBasicMaterial({ color: 0xd1b100, side: THREE.DoubleSide })
const baseBenchMat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide })
const baseBuggyMat = new THREE.MeshBasicMaterial({ color: 0x880000, side: THREE.DoubleSide })

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

function createFloor(w, h, z, x, material) {
    const floorGeometry1 = new THREE.PlaneGeometry(w, h);
    const mesh = new THREE.Mesh(floorGeometry1, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.z = z
    mesh.position.x = x
    scene.add(mesh);
    return mesh
}

function createObject(w, h, z, x, material) {
    const floorGeometry1 = new THREE.PlaneGeometry(w, h);
    const mesh = new THREE.Mesh(floorGeometry1, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.z = z
    mesh.position.x = x
    mesh.position.y = 0.1
    scene.add(mesh);
    return mesh
}

/*
function createMarker(z, x, color, radius=0.1, label='') {
    const markerGeometry = new THREE.CircleGeometry(radius, 32);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: color });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.rotation.x = -Math.PI / 2;
    marker.position.z = z
    marker.position.x = x
    marker.position.y = 0.11
    scene.add(marker);
    return marker
}
*/

// ...existing code...
function createMarker(z, x, color, radius = 0.1, label = '') {
  const geom = new THREE.SphereGeometry(radius, 12, 8);
  const mat = new THREE.MeshBasicMaterial({ color });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.set(x, radius, z);

  var alpha = 0.15;
  if(label === '')
    alpha = 0;


  // label sprite
  const canvas = document.createElement('canvas');
  const size = 256;
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#000';
  ctx.font = '150px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, size / 2, size / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  const smat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sprite = new THREE.Sprite(smat);
  sprite.scale.set(0.8, 0.4, 1);      // tweak label size
  sprite.position.set(x, radius + 0.4, z);

  const group = new THREE.Group();
  group.add(mesh);
  group.add(sprite);
  scene.add(group);

  // expose helpers if needed
  group.marker = mesh;
  group.label = sprite;
  return group;
}
// ...existing code...
// Floor
const floor1 = createFloor(14, 11.5, 3, 2, floorMaterial)
const floor2 = createFloor(18, 6, -5.75, 0, floorMaterial)

// Wall

const wallThickness = 0.35;

const wallx1 = createFloor(wallThickness, 6.5, -5.5, 9 + wallThickness/2, baseWallMat)
const doorx1 = createFloor(wallThickness, 1, -1.75, 9 + wallThickness/2, baseWoodMat)
const wallx2 = createFloor(wallThickness, 5.5, 1.5, 9 + wallThickness/2, baseWallMat)
const doorx2 = createFloor(wallThickness, 1, 4.75, 9 + wallThickness/2, baseWoodMat)
const wallx3 = createFloor(wallThickness, 3.5, 7, 9 + wallThickness/2, baseWallMat)

const wallx4 = createFloor(wallThickness, 6 + wallThickness, -5.75 + wallThickness/2, -9 - wallThickness/2, baseWallMat)
const wallx5 = createFloor(wallThickness, 4, -0.75, -5 - wallThickness/2, baseWallMat)
const doorx3 = createFloor(wallThickness, 1, 1.75, -5 - wallThickness/2, baseGlassMat)
const wallx6 = createFloor(wallThickness, 6.5, 5.5, -5 - wallThickness/2, baseWallMat)

const wallz1 = createFloor(18 + wallThickness*2, wallThickness, -8.75 - wallThickness/2, 0, baseWallMat)

const doorz1 = createFloor(4 - wallThickness, wallThickness, -2.75 + wallThickness/2, -7 - wallThickness/2, baseGlassMat)

const wallz2 = createFloor(2 + wallThickness, wallThickness, 8.75 + wallThickness/2, -4 - wallThickness/2, baseWallMat)
const doorz2 = createFloor(5.5, wallThickness, 8.75 + wallThickness/2, -0.25, baseGlassMat)
const wallz3 = createFloor(6.5 + wallThickness, wallThickness, 8.75 + wallThickness/2, 5.75 + wallThickness/2, baseWallMat)

// Other structures & objects
const pillar = createObject(1, 1, 1.75, 2.5, basePillarMat)
const table_p1 = createObject(1, 4.5, -1, 2.5, baseGlassMat)
const table_p2 = createObject(1, 4.5, 5.5, 2.5, baseGlassMat)

const table_v1 = createObject(3, 1, -4, 6, baseGlassMat)
const table_v2 = createObject(3, 1, -1, 6, baseGlassMat)
const table_v3 = createObject(3, 1, 1.75, 6, baseGlassMat)
const table_v4 = createObject(3, 1, 4.55, 6, baseGlassMat)
const table_v5 = createObject(3, 1, 7.35, 6, baseGlassMat)

const workbench_v1 = createObject(1.8, 4.75, -1.1, 0.12, baseBenchMat)
const workbench_v2 = createObject(1.8, 4.75, 4.65, 0.12, baseBenchMat)
const workbench_v3 = createObject(1.8, 4.75, -1.1, -3.15, baseBenchMat)
const workbench_v4 = createObject(1.8, 4.75, 4.65, -3.15, baseBenchMat)

const buggy = createObject(1.8, 1, -8, -7.5, baseBuggyMat)

// const Waiz = createMarker(-0.3, 7, 0xff0000);

// const dummy = createMarker(7, 0, 0xffaf00);

let angle = 0; // Track the current angle in the orbit

function mockApiCall() {
    return new Promise((resolve) => {
        setTimeout(() => {
            // 1. Increment the angle (Increase 0.1 to move faster, decrease to slow down)
            angle += 0.05; 

            // 2. Define the Ellipse settings
            const centerX = 6;    // X position of the table you want to orbit (e.g., table_v series)
            const centerZ = -1; // Z position of the table
            const radiusX = 2.5;    // How wide the path is (X-axis)
            const radiusZ = 1.5;    // How deep the path is (Z-axis)

            // 3. Calculate new coordinates using Trig
            // x = h + rX * cos(theta)
            // z = k + rZ * sin(theta)
            const newX = centerX + (radiusX * Math.cos(angle));
            const newZ = centerZ + (radiusZ * Math.sin(angle));

            resolve({
                x: newX,
                z: newZ
            });
        }, 50); // Simulate 50ms network delay
    });
}

// ==========================================
// 3. FETCH & UPDATE LOGIC
// ==========================================
async function fetchAndMoveMarker() {
    try {
        // --- OPTION A: USE MOCK DATA (Testing) ---
        const data = await mockApiCall();

        // --- OPTION B: USE REAL API (Uncomment to use) ---
        // const response = await fetch(API_URL);
        // const data = await response.json(); 
        // Expected JSON format: { "x": 5.5, "z": -2.1 }

        // Update the marker position directly
        if (data.x !== undefined && data.z !== undefined) {
            Waiz.position.x = data.x;
            Waiz.position.z = data.z;
            
            console.log("Updated Position:", data.x, data.z);
        }

    } catch (error) {
        console.error("Error fetching coords:", error);
    }
}

// ==========================================
// 4. START THE LOOP (Every 0.1 seconds)
// ==========================================
// setInterval(fetchAndMoveMarker, 100); // 100ms = 0.1 seconds

function animate (t = 0) {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();

/**
 * Animate tracks from a CSV with columns: frame,track_id,...,three_x,three_z
 * - url: CSV path (default './mapped_tracks (1).csv')
 * - fps: frames per second (default 10)
 * - loop: whether to loop playback (default true)
 */
async function animateTracksFromCsv(url = './mapped_tracks.csv', fps = 10, loop = true) {
  // simple CSV parser (assumes no complex quoting)
  function parseCSV(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return { header: [], rows: [] };
    const header = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(l => {
      const cols = l.split(',').map(c => c.trim());
      const obj = {};
      header.forEach((h, i) => obj[h] = cols[i] ?? '');
      return obj;
    });
    return { header, rows };
  }

  // fetch CSV
  try {
    const resp = await fetch(encodeURI(url), { cache: 'no-store' });
    if (!resp.ok) {
      console.warn('CSV fetch failed:', resp.status, url);
      return;
    }
    const text = await resp.text();
    const { header, rows } = parseCSV(text);

    // column names expected in your mapped_tracks: 'frame','track_id','three_x','three_z'
    const hdrLower = header.map(h => h.toLowerCase());
    const frameKey = header[hdrLower.indexOf('frame')];
    const idKey = header[hdrLower.indexOf('track_id')];
    const xKey = header[hdrLower.indexOf('three_x')];
    const zKey = header[hdrLower.indexOf('three_z')];

    if (!frameKey || !idKey || !xKey || !zKey) {
      console.error('CSV missing required columns. Found header:', header);
      return;
    }

    // build frames map: frame -> detections[]
    const framesMap = new Map();
    const trackIds = new Set();
    for (const r of rows) {
      const frame = parseInt(r[frameKey], 10);
      if (Number.isNaN(frame)) continue;
      const id = String(r[idKey]);
      const x = parseFloat(r[xKey]);
      const z = parseFloat(r[zKey]);
      if (Number.isNaN(x) || Number.isNaN(z)) continue;
      if (!framesMap.has(frame)) framesMap.set(frame, []);
      framesMap.get(frame).push({ id, x, z });
      trackIds.add(id);
    }

    if (framesMap.size === 0) {
      console.warn('No valid frames found in CSV.');
      return;
    }

    const frames = Array.from(framesMap.keys()).sort((a, b) => a - b);

    // color generator per id (stable)
    function colorFromId(id) {
      let hash = 0;
      for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
      const h = Math.abs(hash) % 360;
      const c = new THREE.Color(`hsl(${h} 70% 50%)`);
      return c.getHex();
    }

    // create marker for each track id (hidden initially)
    const markers = new Map();
    for (const id of trackIds) {
      const color = colorFromId(id);
      var viewColor = 0xff0000;
      // place at origin; will set visible=false until first appearance
      const m = createMarker(0, 0, viewColor, 0.2, id); // createMarker(z, x, color)
      m.visible = false;
      m.name = `track_${id}`;
      markers.set(id, m);
    }

    // animation loop
    let idx = 0;
    const interval = 1000 / Math.max(1, fps);
    const timer = setInterval(() => {
      const frameNo = frames[idx];
      const detections = framesMap.get(frameNo) || [];

      // hide all markers first
      for (const m of markers.values()) m.visible = false;

      // place detections
      for (const d of detections) {
        const marker = markers.get(d.id);
        if (!marker) continue;
        marker.position.x = d.z;
        marker.position.z = d.x;
        marker.visible = true;
      }

      idx++;
      if (idx >= frames.length) {
        if (loop) idx = 0;
        else {
          clearInterval(timer);
        }
      }
    }, interval);

    // return control handles if needed
    return {
      stop() { clearInterval(timer); },
      framesCount: frames.length
    };

  } catch (err) {
    console.error('animateTracksFromCsv error:', err);
  }
}

// start animating immediately (matches your red-dot loop behavior)
animateTracksFromCsv('../../mapped_tracks_angle_01.csv', 10, true);