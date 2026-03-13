import * as THREE from "three";
import { createMarker } from "./world.js";
import { FPS, LOOP_DURATION, iot, getRoom, roomInfo } from "./variables.js";
import { camera, controls} from "./scene.js";

export const playback = {
    frame: 0,
    maxFrames: FPS * LOOP_DURATION,
    playing: true,
    speed: 1
};

export const tracker = `/temp_files_15min/combined_frames_15min.csv`;
export const globalCount = 18;

export const raycaster = new THREE.Raycaster();
export const screenCenter = new THREE.Vector2(0, 0); // (0,0) is the center of the screen

// Define the "Floor" mathematically: A flat plane pointing Up (0,1,0) at height 0
export const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

// Create a variable to hold the result
export const intersectionPoint = new THREE.Vector3();

function displayCurrentDateTime(dateElement) {
    if (!dateElement) return; // Safety check
    
    const now = new Date();
    const options = { 
        weekday: 'short', 
        month: 'short',   
        day: 'numeric',   
        year: 'numeric'   
    };

    // Format the date
    const formattedDate = now.toLocaleDateString('en-US', options);
    
    // Apply the date to the element (NO uiElements mentioned here!)
    dateElement.innerHTML = formattedDate;
}

let globalTrackFrames = []; 
let globalTrackData = new Map(); 
let globalIoTData = []; 
let trackMarkers = new Map();
//new
let globalCountData = new Map();


export function renderFrame(index) {

    const uiElements = {
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
        uiCoords: document.getElementById('ui-coords'),
        uiIot: document.getElementById('iot-data')
    };

    const deptEl = document.getElementById('department');
    const department = deptEl ? deptEl.textContent.trim() : "Security";
    
    trackMarkers.forEach(m => m.visible = false);

    raycaster.setFromCamera(screenCenter, camera);

    // 2. Intersect
    // We use a temporary variable to check if we actually hit the floor
    const hit = raycaster.ray.intersectPlane(floorPlane, intersectionPoint);

    const room = hit ? getRoom(intersectionPoint.x, intersectionPoint.z) : null;
    const roomInf = room ? roomInfo[room] : null;
    const seconds = Math.floor(index / FPS);
    const row = room ? iot[room][seconds] : null;

    if (room == "C-007") {
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
        }
    }

    if (roomInf) {
        // Safe Check: Only update if React hasn't deleted the element yet!
        if (uiElements.uiName) {
            uiElements.uiName.innerText = roomInf.name;
            uiElements.uiName.style.color = "#00ff88";
        }
        if (uiElements.uiID) {
            uiElements.uiID.innerText = roomInf.room_id;
            uiElements.uiID.style.color = "#ffffff";
        }
        if (uiElements.uiFloor) {
            uiElements.uiFloor.innerText = roomInf.room_floor;
            uiElements.uiFloor.style.color = "#ffffff";
        }
    } else {
        if (uiElements.uiName) {
            uiElements.uiName.innerText = "N/A";
            uiElements.uiName.style.color = "#ff4444";
        }
        if (uiElements.uiID) {
            uiElements.uiID.innerText = "N/A";
            uiElements.uiID.style.color = "#ff4444";
        }
        if (uiElements.uiFloor) {
            uiElements.uiFloor.innerText = "N/A";
            uiElements.uiFloor.style.color = "#ff4444";
        }
    }
        


    if (row) {
        if (department !== "Security" && uiElements.uiIot) {
            uiElements.uiIot.style.display = "block";

            if (uiElements.uiTemp) {
                // const t = parseFloat(row['temp']);
                const t = row.temperature;
                uiElements.uiTemp.innerText = t + "°C";
                
                if (t <= 19) uiElements.uiTemp.style.backgroundColor = "#0088ff";
                else if (t <= 22) uiElements.uiTemp.style.backgroundColor = "#00ffff";
                else if (t <= 27) uiElements.uiTemp.style.backgroundColor = "#00ff88";
                else if (t <= 30) uiElements.uiTemp.style.backgroundColor = "#ff8800";
                else uiElements.uiTemp.style.backgroundColor = "#f00";
            }
            
            if (uiElements.uiAC) {
                // const ac = row['ac']; 
                const ac = row.ac;
                uiElements.uiAC.innerText = ac ? "• ON" : "- OFF";
                uiElements.uiAC.style.backgroundColor = ac ? "#00ff88" : "#ff4444";
            }

            if (uiElements.uiLights) {
                // const l = row['lights'];
                const l = row.lights;
                uiElements.uiLights.innerText = l ? "• ON" : "- OFF";
                uiElements.uiLights.style.backgroundColor = l ? "#00ff88" : "#ff4444";
            }
        }

        if (uiElements.uiOccupancy && uiElements.uiOccuHeader) {
            const l = row.occupancy;
                
            if (department == "Facilities"){
                uiElements.uiOccuHeader.innerText = "Status: ";
                uiElements.uiOccupancy.innerText = (l > 0) ? "Occupied" : "Vacant";
                uiElements.uiOccupancy.style.backgroundColor = (l > 0) ? "#ff4444" : "#00ff88";
            }
            else {
                uiElements.uiOccuHeader.innerText = "Occupancy Count: ";
                uiElements.uiOccupancy.innerText = l;
                uiElements.uiOccupancy.style.backgroundColor = (l > room.max_occupancy) ? "#ff4444" : ( l === 0 ? "#fff" : "#00ff88");
            }
        }
    }
    
    else {
        // We MUST check if React has rendered these elements before touching them!
        if (uiElements.uiTemp) {
            uiElements.uiTemp.innerText = "--";
            uiElements.uiTemp.style.backgroundColor = "#ffffff";
        }
        if (uiElements.uiAC) {
            uiElements.uiAC.innerText = "--";
            uiElements.uiAC.style.backgroundColor = "#ffffff";
        }
        if (uiElements.uiLights) {
            uiElements.uiLights.innerText = "--";
            uiElements.uiLights.style.backgroundColor = "#ffffff";
        }
        if (uiElements.uiOccupancy) {
            uiElements.uiOccupancy.innerText = "--";
            uiElements.uiOccupancy.style.backgroundColor = "#ffffff";
        }
    }

    if (uiElements.uiDate) {
        displayCurrentDateTime(uiElements.uiDate); // <-- Pass it here!
    }
        
    // --- NEW CODE START: TIME CALCULATION ---
    if (uiElements.uiTime) {
        const now = new Date();
        const nowSeconds = Math.floor(now.getTime() / 1000);
        
        const secondsIntoCycle = nowSeconds % LOOP_DURATION;
        const cycleStartTime = new Date(now.getTime() - (secondsIntoCycle * 1000));
        
        const frameTime = new Date(cycleStartTime.getTime() + (seconds) * 1000);
        
        uiElements.uiTime.innerText = frameTime.toLocaleTimeString(); 
        
    }
}

export async function loadSimulationData(onLoadComplete) {
    globalTrackFrames = [];
    globalTrackData.clear();
    trackMarkers.clear();
    
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
            //new
            const camIdx = headers.findIndex(h => h.includes('camera'));
            const countIdx = headers.findIndex((h) => h.includes("count"));
            /**********/

            if (frameIdx > -1 && xIdx > -1 && zIdx > -1) {
                tLines.slice(1).forEach(line => {
                    const cols = line.split(',');
                    const frame = parseInt(cols[frameIdx]);
                    //new
                    const id = `${cols[idIdx]}_${cols[camIdx]}`;
                    //comment
                    //const id = cols[idIdx];
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

    // try {
    //     const iResp = await fetch(iot["C-007"]);
    //     if (iResp.ok) {
    //         const iText = await iResp.text();
    //         const iRows = iText.split('\n').map(r => r.trim()).filter(r => r);
    //         const headers = iRows[0].split(',').map(h => h.trim().toLowerCase());
            
    //         globalIoTData = iRows.slice(1).map(row => {
    //             const vals = row.split(',');
    //             const obj = {};
    //             headers.forEach((h, i) => obj[h] = vals[i]);
    //             return obj;
    //         });
    //     }
    // } catch (e) { console.error("Error loading IoT", e); }

    // playback.maxFrames = Math.max(globalTrackFrames.length, globalIoTData.length) - 1;
    
    //neww  
//     try {
//         const iResp = await fetch(track_count);
//         if (iResp.ok) {
//         const iText = await iResp.text();
//         const iRows = iText
//             .split("\n")
//             .map((r) => r.trim())
//             .filter((r) => r);
//         const headers = iRows[0].split(",").map((h) => h.trim().toLowerCase());

//         iRows.slice(1).forEach((row) => {
//             const vals = row.split(",");
//             const frameNum = parseInt(vals[headers.indexOf("frame")]);
//             const countNum = parseInt(vals[headers.indexOf("count")]);
//             if (!isNaN(frameNum) && !isNaN(countNum)) {
//             globalCountData.set(frameNum, countNum);
//             }
//         });
//     }
//   } catch (e) {
//     console.error("Error loading Count", e);
//   }

    /*************** */
    
    if (onLoadComplete) onLoadComplete();
}

// const dummy = createMarker(-5, -4.3, "red", 0.1);
// const cam1 = createMarker(-8.65, 9, "white", 0.1, "Camera 1");
// const cam2 = createMarker(-8.65, -1.5, "white", 0.1, "Camera 2");
// const cam3 = createMarker(8.5, -5, "white", 0.1, "Camera 3");