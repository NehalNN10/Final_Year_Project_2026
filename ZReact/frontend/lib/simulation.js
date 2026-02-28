import * as THREE from "three";
import { createMarker } from "./world.js";
import { camera, controls} from "./scene.js";

const FPS = 10; 
const LOOP_DURATION = 120; // Match model.js

export const playback = {
    frame: 0,
    maxFrames: LOOP_DURATION*FPS,
    playing: true,
    speed: 1
};

// const tracker = './files/mapped_tracks_angle_03.csv';
const tracker = './files/combined_frames.csv';
// const tracker = './files/mapped_tracks_angle_01_try_2.csv';
const iot = './files/iot.csv'

export const raycaster = new THREE.Raycaster();
export const screenCenter = new THREE.Vector2(0, 0); // (0,0) is the center of the screen

// Define the "Floor" mathematically: A flat plane pointing Up (0,1,0) at height 0
export const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

// Create a variable to hold the result
export const intersectionPoint = new THREE.Vector3();

function displayCurrentDateTime() {
    const now = new Date();
  
    const options = { 
        weekday: 'short', // "Mon"
        month: 'short',   // "Jan"
        day: 'numeric',   // "19"
        year: 'numeric'   // "2026"
    };

    // Format the date using the 'en-US' locale
    const formattedDate = now.toLocaleDateString('en-US', options);
    
    const ui = getUiElements();
    if (ui.uiDate) ui.uiDate.innerHTML = formattedDate;
}

function safeGet(id) {
    return (typeof document !== 'undefined') ? document.getElementById(id) : null;
}

// Instead of capturing DOM elements once at module load (which happens
// before React renders), provide a getter that queries when needed.
export function getUiElements() {
    return {
        uiOccupancy: safeGet('ui-iot-occupancy'),
        uiOccuHeader: safeGet('ui-iot-occu-header'),
        uiTemp: safeGet('ui-iot-temp'),
        uiAC: safeGet('ui-iot-ac'),
        uiLights: safeGet('ui-iot-lights'),
        uiDate: safeGet('ui-iot-date'),
        uiTime: safeGet('ui-iot-time'),
        uiName: safeGet('ui-room-name'),
        uiID: safeGet('ui-room-id'),
        uiFloor: safeGet('ui-room-floor'),
        // uiCoords: safeGet('ui-coords'),
        uiIot: safeGet('iot-data')
    };
}

let globalTrackFrames = []; 
let globalTrackData = new Map(); 
let globalIoTData = []; 
let trackMarkers = new Map();

export function renderFrame(index) {
    const uiElements = getUiElements();
    
    // Get department from DOM (safe way)
    const deptEl = safeGet('department');
    const department = deptEl ? deptEl.textContent.trim() : '';
    
    // 1. Reset markers
    trackMarkers.forEach(m => m.visible = false);

    // --- TRACKING LOOP ---
    if (index < globalTrackFrames.length) {
        const realFrameNumber = globalTrackFrames[index];
        const detections = globalTrackData.get(realFrameNumber) || [];
        
        // Save the count for UI use later
        // currentOccupancy = detections.length; 

        // Update 3D Markers (Red Dots)
        if (department !== "Facilities") {
            detections.forEach(d => {
                const marker = trackMarkers.get(d.id);
                if (marker) {
                    marker.position.x = d.z; 
                    marker.position.z = d.x;
                    marker.visible = true;
                }
            });
        }
    }

    // --- IOT LOOP ---
    if (index < globalIoTData.length) {
        const row = globalIoTData[index];
        
        // Handle Security View (Hide IoT Data)
        if (department === "Security") {
            if (uiElements.uiIot) uiElements.uiIot.style.display = "none";
        } else {
            if (uiElements.uiIot) uiElements.uiIot.style.display = "block";

            // Temp
            if (uiElements.uiTemp) {
                const t = parseFloat(row['temp']);
                uiElements.uiTemp.innerText = t + "°C";
                // Color logic for Temp...
                if (t <= 19) uiElements.uiTemp.style.color = "#0088ff";
                else if (t <= 22) uiElements.uiTemp.style.color = "#00ffff";
                else if (t <= 27) uiElements.uiTemp.style.color = "#00ff88";
                else if (t <= 30) uiElements.uiTemp.style.color = "#ff8800";
                else uiElements.uiTemp.style.color = "#f00";
            }
            
            // AC
            if (uiElements.uiAC) {
                const ac = row['ac']; 
                uiElements.uiAC.innerText = (ac === "On") ? "• ON" : "- OFF";
                uiElements.uiAC.style.color = (ac === "On") ? "#00ff88" : "#ff4444";
            }

            // Lights
            if (uiElements.uiLights) {
                const l = row['lights'];
                uiElements.uiLights.innerText = (l === "On") ? "• ON" : "- OFF";
                uiElements.uiLights.style.color = (l === "On") ? "#00ff88" : "#ff4444";
            }
        }

        if (uiElements.uiOccupancy && uiElements.uiOccuHeader) {
            const currentOccupancy = row['occu']
            if (department === "Facilities") {
                uiElements.uiOccuHeader.innerText = "Status: ";
                uiElements.uiOccupancy.innerText = (currentOccupancy > 0) ? "Occupied" : "Vacant";
                uiElements.uiOccupancy.style.color = (currentOccupancy > 0) ? "#ff4444" : "#00ff88"; // Red/Green
            } else {
                // Admin/Security View: Exact Count
                uiElements.uiOccuHeader.innerText = "Occupancy Count: ";
                uiElements.uiOccupancy.innerText = currentOccupancy;
                // Color scale: Green (0) -> White (Normal) -> Red (Crowded > 20)
                uiElements.uiOccupancy.style.color = (currentOccupancy > 20) ? "#ff4444" : (currentOccupancy === 0 ? "#00ff88" : "#ffffff");
            }
        }
    }

    // --- UPDATE OCCUPANCY UI ---
    // We do this outside the loops to ensure we use the tracking count we calculated
    

    // --- TIME & ROOM INFO ---
    if (uiElements.uiTime) {
        const now = new Date();
        uiElements.uiTime.innerText = now.toLocaleTimeString();
    }

    if (uiElements.uiName && uiElements.uiID && uiElements.uiFloor) {
        const info = getRoomInfo(controls.target.x, controls.target.z);
        uiElements.uiName.innerText = info.name;
        uiElements.uiID.innerText = info.id;
        uiElements.uiFloor.innerText = info.floor;
        
        // Color Logic
        const color = (info.id === "N/A") ? "#ff4444" : "#00ff88";
        const whiteColor = (info.id === "N/A") ? "#ff4444" : "#ffffff";
        uiElements.uiName.style.color = color;
        uiElements.uiID.style.color = whiteColor;
        uiElements.uiFloor.style.color = whiteColor;
    } else if (uiElements.uiCoords) {
        uiElements.uiCoords.innerText = "--, --";
    }
}

export function getRoomInfo(x, z) {
    if (z >= -9.1 && z <= -2.4 && x >= -9.35 && x <= 9.35) {
        return { name: "Projects Lab", id: "C-007", floor: "Lower Ground" };
    }
    else if (z >= -2.4 && z <= 9.1 && x >= -5.35 && x <= 9.35) {
         return { name: "Projects Lab", id: "C-007", floor: "Lower Ground" };
    }
    return { name: "Outside Bounds", id: "N/A", floor: "N/A" };
}

export async function loadSimulationData(onLoadComplete) {
    
    try {
        const tResp = await fetch(tracker); 
        if (!tResp.ok) throw new Error(`Track CSV not found`);

        const tText = await tResp.text();
        const tLines = tText.split('\n').filter(l => l.trim());

        if (tLines.length > 1) {
            const headers = tLines[0].split(',').map(h => h.trim().toLowerCase());
            const frameIdx = headers.indexOf('frame');
            const idIdx = headers.findIndex(h => h.includes('id') || h.includes('track'));
            const xIdx = headers.findIndex(h => h.includes('three_x') || h === 'x');
            const zIdx = headers.findIndex(h => h.includes('three_z') || h === 'z');

            if (frameIdx > -1 && xIdx > -1 && zIdx > -1) {
                tLines.slice(1).forEach(line => {
                    const cols = line.split(',');
                    const frame = parseInt(cols[frameIdx]);
                    const id = cols[idIdx];
                    const x = parseFloat(cols[xIdx]);
                    const z = parseFloat(cols[zIdx]);
                    
                    if (isNaN(frame) || isNaN(x) || isNaN(z)) return;

                    if (!globalTrackData.has(frame)) globalTrackData.set(frame, []);
                    globalTrackData.get(frame).push({ id, x, z });

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
            }
        }
    } catch (e) { 
        console.error("Error loading tracks:", e); 
    }

    try {
        const iResp = await fetch(iot);
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

    // playback.maxFrames = Math.max(globalTrackFrames.length, globalIoTData.length) - 1;
    
    if (onLoadComplete) onLoadComplete();
}

// const dummy = createMarker(-5, -4.3, "red", 0.1);
// const cam1 = createMarker(-8.65, 9, "white", 0.1, "Camera 1");
// const cam2 = createMarker(-8.65, -1.5, "white", 0.1, "Camera 2");
// const cam3 = createMarker(8.5, -5, "white", 0.1, "Camera 3");