import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";


const gui = new dat.GUI();

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
scene.background = new THREE.Color(0x131314);

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
  mesh.position.y= 0.01;

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
  ctx.font = '100px League Spartan';
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

scene.rotateY(Math.PI/2)

// 1. Create the Folder
const params = {
    x: 0,
    z: 0,
    y: 20,
    rotation: 0, // New Rotation Value (Radians)
    darkMode: true
};

const camFolder = gui.addFolder('Camera Controls');


camFolder.add(params, 'rotation', -Math.PI, Math.PI, 0.1)
    .name("Rotate View")
    .listen() // Syncs if user rotates with mouse
    .onChange((angle) => {
        // 1. Calculate how far the camera is from the target (Radius)
        // We use Pythagorean theorem in 2D (X and Z only)
        const dx = camera.position.x - controls.target.x;
        const dz = camera.position.z - controls.target.z;
        const radius = Math.sqrt(dx * dx + dz * dz);

        // 2. Set new Camera Position based on the Angle and Radius
        // x = center + r * sin(a)
        // z = center + r * cos(a)
        camera.position.x = controls.target.x + radius * Math.sin(angle);
        camera.position.z = controls.target.z + radius * Math.cos(angle);
        
        // 3. Force controls to update
        controls.update();
    });

// --- X AXIS (Left/Right) ---
camFolder.add(params, 'x', -50, 50, 0.1)
    .name("Position X")
    .listen() // Update slider if user drags mouse
    .onChange((value) => {
        // Calculate how much the slider moved
        const delta = value - controls.target.x;
        
        // Move the Target (Anchor)
        controls.target.x = value;
        
        // Move the Camera by the EXACT same amount
        camera.position.x += delta;
    });

// --- Z AXIS (Forward/Back) ---
camFolder.add(params, 'z', -50, 50, 0.1)
    .name("Position Z")
    .listen()
    .onChange((value) => {
        const delta = value - controls.target.z;
        controls.target.z = value;
        camera.position.z += delta;
    });

// --- Y AXIS (Zoom/Height) ---
// For height, we usually just want to move the camera up/down
camFolder.add(camera.position, 'y', 1, 100, 0.1)
    .name("Zoom Height")
    .listen();

camFolder.open();

// 3. Optional: Add a Reset Button
const settings = {
    resetView: function() {
        // 1. Reset the variables bound to the sliders
        params.x = 0;
        params.z = 0;
        params.rotation = 0; // <--- This updates the slider visually

        // 2. Reset the Camera
        // We set Z to 0.1 instead of 0. This tiny offset forces the math
        // to calculate the angle as "0" immediately.
        camera.position.set(0, 20, 0.1);
        
        // 3. Reset the Focus Point
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
    }
};

camFolder.add(settings, 'resetView').name("Reset Camera");

camFolder.add(params, 'darkMode')
    .name("Dark Mode")
    .onChange((value) => {
        if (value) {
            scene.background = new THREE.Color(0x131314);

            doorx3.material = baseGlassMat;
            doorz1.material = baseGlassMat;
            doorz2.material = baseGlassMat;
        }
        else {
            scene.background = new THREE.Color(0xffffff);
            doorx3.material = baseBenchMat;
            doorz1.material = baseBenchMat;
            doorz2.material = baseBenchMat;
        }
    });

camFolder.open();

// --- ANIMATION STATE ---
const playback = {
    frame: 0,        // Current frame
    maxFrames: 0,    // Will be set after data loads
    playing: true,   // Play/Pause toggle
    speed: 1         // How fast it plays
};

const animFolder = gui.addFolder('Playback Controls');

// We will update the 'max' of this slider once data loads
const frameController = animFolder.add(playback, 'frame', 0, 100, 1)
    .name("Frame Scrubber")
    .listen() // Important: Makes the slider move automatically
    .onChange((val) => {
        // Allow manual seeking
        renderFrame(Math.floor(val));
    });

const play = {
    resetPlayback: function() {
        // 1. Reset the variables bound to the sliders
        playback.frame = 0;
        playback.playing = true;
        playback.speed = 1;

    }
};


animFolder.add(playback, 'playing').name("Play / Pause");
animFolder.add(playback, 'speed', 0.1, 5, 0.1).name("Speed");
animFolder.add(play, 'resetPlayback').name("Reset Playback");
animFolder.open();

// --- ADD THESE LINES ---
// Grab the new HTML elements
const uiName = document.getElementById('ui-room-name');
const uiID = document.getElementById('ui-room-id');
const uiFloor = document.getElementById('ui-room-floor');
const uiCoords = document.getElementById('ui-coords');

let iotData = [];
let simulationStartTime = null; // When did the animation start?

// 2. UI ELEMENTS
const uiOccupancy = document.getElementById('ui-iot-occupancy');
const uiTemp = document.getElementById('ui-iot-temp');
const uiAC = document.getElementById('ui-iot-ac');
const uiLights = document.getElementById('ui-iot-lights');
const uiTime = document.getElementById('ui-iot-time');

const uiElements = {
    uiOccupancy,
    uiTemp,
    uiAC,
    uiLights,
    uiName,
    uiID,
    uiFloor
};

function renderFrame(index) {
    // A. UPDATE TRACKS ---------------------------
    // 1. Hide all markers first
    trackMarkers.forEach(m => m.visible = false);

    // 2. Get the specific frame number from our sorted list
    // (Check bounds to prevent errors)
    if (index < globalTrackFrames.length) {
        const realFrameNumber = globalTrackFrames[index];
        const detections = globalTrackData.get(realFrameNumber) || [];

        // 3. Move and Show active markers
        detections.forEach(d => {
            const marker = trackMarkers.get(d.id);
            if (marker) {
                marker.position.x = d.z; // Swap X/Z if needed based on your previous code
                marker.position.z = d.x;
                marker.visible = true;
            }
        });
        
        if (uiOccupancy) uiOccupancy.innerText = detections.length;
    }

    // B. UPDATE IOT UI ---------------------------
    if (index < globalIoTData.length) {
        const row = globalIoTData[index];
        
        // Temp
        if (uiTemp) {
            const t = parseFloat(row['temp']);
            uiTemp.innerText = t + "°C";
            // Color Logic
            if (t <= 19) uiTemp.style.color = "#0088ff";
            else if (t <= 22) uiTemp.style.color = "#00ffff";
            else if (t <= 27) uiTemp.style.color = "#00ff88";
            else if (t <= 30) uiTemp.style.color = "#ff8800";
            else uiTemp.style.color = "#f00";
        }
        
        // AC
        if (uiAC) {
            const ac = row['ac']; 
            uiAC.innerText = ac;
            uiAC.style.color = (ac === "On") ? "#00ff88" : "#ff4444";
        }

        // Lights
        if (uiLights) {
            const l = row['lights'];
            uiLights.innerText = l;
            uiLights.style.color = (l === "On") ? "#00ff88" : "#ff4444";
        }
        
        // Time
        if (uiTime) {
            uiTime.innerText = ((row['timestamp'] || index)/10).toFixed(1) + "s";
        }
    }
}

// Function to determine the name of the location based on X/Z coords
function getRoomInfo(x, z) {
    // 1. Check for "C-007" (The big room)
    if (x >= -8.75 && x <= -2.75) {
        if (z >= -9 && z <= 9) {
            return {
                name: "Projects Lab",
                id: "C-007",
                floor: "Lower Ground Floor"
            };
        }
    }
    else if (x >= -2.75 && x <= 8.75) {
        if (z <= 5 && z >= -9) {
             return {
                name: "Projects Lab",
                id: "C-007",
                floor: "Lower Ground Floor"
            };
        }
    }

    // 2. Default (Outside)
    return {
        name: "Outside Bounds",
        id: "N/A",
        floor: "N/A"
    };
}

/**
 * Animate tracks from a CSV with columns: frame,track_id,...,three_x,three_z
 * - url: CSV path (default './mapped_tracks (1).csv')
 * - fps: frames per second (default 10)
 * - loop: whether to loop playback (default true)
 */
// Global storage for the data
let globalTrackFrames = []; // Array of frame numbers
let globalTrackData = new Map(); // Map<FrameNumber, ListOfDetections>
let globalIoTData = [];     // Array of IoT rows
let trackMarkers = new Map(); // Map<TrackID, Mesh>

async function loadSimulationData() {
    
    // --- 1. LOAD TRACKS (Robuster Version) ---
    try {
        // Double check this path! If the file is in the SAME folder, remove the ".."
        // const tResp = await fetch('./mapped_tracks_angle_01.csv'); 
        const tResp = await fetch('./mapped_tracks.csv'); 
        
        if (!tResp.ok) throw new Error(`Track CSV not found: ${tResp.statusText}`);

        const tText = await tResp.text();
        const tLines = tText.split('\n').filter(l => l.trim());

        if (tLines.length < 2) throw new Error("Track CSV is empty or missing headers");

        // 1. Find the correct column indices by name
        const headers = tLines[0].split(',').map(h => h.trim().toLowerCase());
        
        // We look for 'frame', 'track_id' (or 'id'), 'three_x' (or 'x'), 'three_z' (or 'z')
        const frameIdx = headers.indexOf('frame');
        const idIdx = headers.findIndex(h => h.includes('id') || h.includes('track'));
        const xIdx = headers.findIndex(h => h.includes('three_x') || h === 'x');
        const zIdx = headers.findIndex(h => h.includes('three_z') || h === 'z');

        if (frameIdx === -1 || xIdx === -1 || zIdx === -1) {
            console.error("Missing columns in CSV:", headers);
            return;
        }

        // 2. Process Rows
        const rows = tLines.slice(1); // Skip header
        rows.forEach(line => {
            const cols = line.split(',');
            // Use the indices we found above
            const frame = parseInt(cols[frameIdx]);
            const id = cols[idIdx];
            const x = parseFloat(cols[xIdx]);
            const z = parseFloat(cols[zIdx]);
            
            if (isNaN(frame) || isNaN(x) || isNaN(z)) return; // Skip bad data

            if (!globalTrackData.has(frame)) globalTrackData.set(frame, []);
            globalTrackData.get(frame).push({ id, x, z });

            // Create Marker if needed
            if (!trackMarkers.has(id)) {
                let hash = 0;
                for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
                const color = new THREE.Color(`hsl(${Math.abs(hash) % 360}, 70%, 50%)`);
                
                const marker = createMarker(0, 0, color.getHex(), 0.2, id);
                marker.visible = false;
                trackMarkers.set(id, marker);
            }
        });

        globalTrackFrames = Array.from(globalTrackData.keys()).sort((a, b) => a - b);
        
    } catch (e) { 
        console.error("Error loading tracks:", e); 
        alert("Track CSV failed to load. Check console for details."); // Visual alert
    }

    // --- 2. LOAD IOT ---
    try {
        const iResp = await fetch('./iot.csv');
        if (iResp.ok) {
            const iText = await iResp.text();
            const iRows = iText.split('\n').map(r => r.trim()).filter(r => r);
            const headers = iRows[0].split(',').map(h => h.trim().toLowerCase());
            
            globalIoTData = iRows.slice(1).map(row => {
                const vals = row.split(',');
                const obj = {};
                headers.forEach((h, i) => obj[h] = vals[i]);
                return obj;
            });
        }
    } catch (e) { console.error("Error loading IoT", e); }

    // --- 3. SYNC SETTINGS ---
    const maxT = globalTrackFrames.length;
    const maxI = globalIoTData.length;
    
    playback.maxFrames = Math.max(maxT, maxI) - 1;
    
    // Update the Slider Limit
    if (frameController) {
        frameController.max(playback.maxFrames);
        frameController.updateDisplay();
    }
    
    console.log(`Loaded! Tracks: ${maxT}, IoT: ${maxI}`);
}

// Trigger the load
loadSimulationData();

function animate(t=0) {
    if (t === undefined) t = performance.now();
    requestAnimationFrame(animate);

    // --- NEW PLAYBACK LOGIC ---
    if (playback.maxFrames > 0) {
        if (playback.playing) {
            // Increment frame
            playback.frame += (0.1 * playback.speed); 
            
            // Loop if we hit the end
            if (playback.frame > playback.maxFrames) {
                playback.frame = 0;
            }
        }
        
        // Actually render the scene at this integer frame
        renderFrame(Math.floor(playback.frame));
    }
    // ---------------------------
    
    // Only Room Info and Controls update here now
    if (uiName && uiID && uiFloor) {
        const camX = camera.position.x;
        const camZ = camera.position.z;
        const info = getRoomInfo(camX, camZ);
        uiName.innerText = info.name;
        uiID.innerText = info.id;
        uiFloor.innerText = info.floor;
        if(uiCoords) uiCoords.innerText = `${camX.toFixed(1)}, ${camZ.toFixed(1)}`;
        if (info.id === "N/A") {
            for (const key in uiElements) {
                if (uiElements[key]) {
                    uiElements[key].style.color = "#ff4444";
                    uiElements[key].innerText = "N/A";
                }
            }
        }
        else {
            uiFloor.style.color = "#fff";
            uiID.style.color = "#fff";
            uiName.style.color = "#00ff88";
            uiOccupancy.style.color = "#00ff88";
        }
    }

    params.x = controls.target.x;
    params.z = controls.target.z;
    controls.update();
    renderer.render(scene, camera);
}
animate();