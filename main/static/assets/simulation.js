import * as THREE from "three";
import { createMarker } from "./world.js";
import { camera, controls} from "./scene.js";

const FPS = 10; 
const LOOP_DURATION = 120; // Match model.js

export const playback = {
    frame: 0,
    maxFrames: 1200,
    playing: true,
    speed: 1
};

// const tracker = './files/mapped_tracks_angle_03.csv';
const tracker = './files/mapped_tracks_angle_01.csv';
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
    
    uiElements.uiDate.innerHTML = formattedDate;
}


export const uiElements = {
    uiOccupancy: document.getElementById('ui-iot-occupancy'),
    uiOccuHeader: document.getElementById('ui-iot-occu-header'),
    uiTemp: document.getElementById('ui-iot-temp'),
    uiAC: document.getElementById('ui-iot-ac'),
    uiLights: document.getElementById('ui-iot-lights'),
    uiDate: document.getElementById('ui-iot-date'),
    uiTime: document.getElementById('ui-iot-time'),
    uiName: document.getElementById('ui-room-name'),
    uiID: document.getElementById('ui-room-id'),
    uiFloor: document.getElementById('ui-room-floor'),
    // uiCoords: document.getElementById('ui-coords'),
    uiIot: document.getElementById('iot-data')
};

let globalTrackFrames = []; 
let globalTrackData = new Map(); 
let globalIoTData = []; 
let trackMarkers = new Map();

export function renderFrame(index) {

    const department = document.getElementById('department').textContent.trim();
    
    trackMarkers.forEach(m => m.visible = false);

    if (index < globalTrackFrames.length) {
        const realFrameNumber = globalTrackFrames[index];
        const detections = globalTrackData.get(realFrameNumber) || [];
        if (department != "Facilities") {
            detections.forEach(d => {
                const marker = trackMarkers.get(d.id);
                if (marker) {
                    marker.position.x = d.z; 
                    marker.position.z = d.x;
                    marker.visible = true;
                }
            });
        }
    
        // if (uiElements.uiOccupancy && uiElements.uiOccuHeader) {
        //     const l = detections.length;
        //     if (department == "Facilities"){
        //         uiElements.uiOccuHeader.innerText = "Occupancy: ";
        //         uiElements.uiOccupancy.innerText = (l > 0) ? "Occupied" : "Vacant";
        //         uiElements.uiOccupancy.style.color = (l > 0) ? "#ff4444" : "#00ff88";
        //     }
        //     else {
        //         uiElements.uiOccuHeader.innerText = "Occupancy: ";
        //         uiElements.uiOccupancy.innerText = l;
        //         uiElements.uiOccupancy.style.color = (l > 20) ? "#ff4444" : ( l === 0 ? "#fff" : "#00ff88");
        //     }
        // }
    }

    if (index < globalIoTData.length) {
        const row = globalIoTData[index];
        
        if (department == "Security") uiElements.uiIot.style.display = "none";
        else {
            uiElements.uiIot.style.display = "block";

            if (uiElements.uiTemp) {
                const t = parseFloat(row['temp']);
                uiElements.uiTemp.innerText = t + "°C";
                
                if (t <= 19) uiElements.uiTemp.style.color = "#0088ff";
                else if (t <= 22) uiElements.uiTemp.style.color = "#00ffff";
                else if (t <= 27) uiElements.uiTemp.style.color = "#00ff88";
                else if (t <= 30) uiElements.uiTemp.style.color = "#ff8800";
                else uiElements.uiTemp.style.color = "#f00";
            }
            
            if (uiElements.uiAC) {
                const ac = row['ac']; 
                uiElements.uiAC.innerText = (ac === "On") ? "• ON" : "- OFF";
                uiElements.uiAC.style.color = (ac === "On") ? "#00ff88" : "#ff4444";
            }

            if (uiElements.uiLights) {
                const l = row['lights'];
                uiElements.uiLights.innerText = (l === "On") ? "• ON" : "- OFF";
                uiElements.uiLights.style.color = (l === "On") ? "#00ff88" : "#ff4444";
            }
        }

        if (uiElements.uiDate) {
           displayCurrentDateTime();
        }
            
        // --- NEW CODE START: TIME CALCULATION ---
        if (uiElements.uiTime) {
            const now = new Date();
            const nowSeconds = Math.floor(now.getTime() / 1000);
            
            // 1. Find the start of the CURRENT 2-minute cycle
            // (Current Time minus the remainder of 120)
            const secondsIntoCycle = nowSeconds % LOOP_DURATION;
            const cycleStartTime = new Date(now.getTime() - (secondsIntoCycle * 1000));
            
            // 2. Add the frame's time to that start point
            // If we are at Frame 10 (1s), we add 1s to the cycle start
            const frameTime = new Date(cycleStartTime.getTime() + (index / FPS) * 1000);
            
            uiElements.uiTime.innerText = frameTime.toLocaleTimeString(); 
            
        }

        // if (uiElements.uiOccupancy) {
        //     const l = row['occu'];
        //     uiElements.uiOccupancy.innerText = l;
        //     uiElements.uiOccupancy.style.color = (l > 20) ? "#ff4444" : ( l === 0 ? "#fff" : "#00ff88");
        // }
        if (uiElements.uiOccupancy && uiElements.uiOccuHeader) {
            const l = row['occu'];
            if (department == "Facilities"){
                uiElements.uiOccuHeader.innerText = "Status: ";
                uiElements.uiOccupancy.innerText = (l > 0) ? "Occupied" : "Vacant";
                uiElements.uiOccupancy.style.color = (l > 0) ? "#ff4444" : "#00ff88";
            }
            else {
                uiElements.uiOccuHeader.innerText = "Occupancy Count: ";
                uiElements.uiOccupancy.innerText = l;
                uiElements.uiOccupancy.style.color = (l > 20) ? "#ff4444" : ( l === 0 ? "#fff" : "#00ff88");
            }
        }
    }
    
    if (uiElements.uiName && uiElements.uiID && uiElements.uiFloor) {
        
        // 1. Setup Ray
        raycaster.setFromCamera(screenCenter, camera);

        // 2. Intersect
        // We use a temporary variable to check if we actually hit the floor
        const hit = raycaster.ray.intersectPlane(floorPlane, intersectionPoint);

        // 3. Safety Check: Did we hit the floor?
        if (hit) {
            // Yes: Use the updated intersectionPoint
            const info = getRoomInfo(intersectionPoint.x, intersectionPoint.z);

            uiElements.uiName.innerText = info.name;
            uiElements.uiID.innerText = info.id;
            uiElements.uiFloor.innerText = info.floor;
            
            // if (uiElements.uiCoords) {
            //     uiElements.uiCoords.innerText = `${intersectionPoint.x.toFixed(1)}, ${intersectionPoint.z.toFixed(1)}`;
            // }
            
            // Color Logic
            const color = (info.id === "N/A") ? "#ff4444" : "#00ff88";
            const whiteColor = (info.id === "N/A") ? "#ff4444" : "#ffffff";
            uiElements.uiName.style.color = color;
            uiElements.uiID.style.color = whiteColor
            uiElements.uiFloor.style.color = whiteColor // Fix: uiFloor was declared but not colored

        } else {
            // No: We are looking at the sky/void
            // Keep the previous info or show nothing
            // uiElements.uiCoords.innerText = "--, --";
        }
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