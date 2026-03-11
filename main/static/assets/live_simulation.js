import * as THREE from 'three';
import { createObjectMarker, models } from "./world.js";
import { camera, controls} from "./scene.js";
import { xor } from 'three/tsl';

export const raycaster = new THREE.Raycaster();
export const screenCenter = new THREE.Vector2(0, 0); // (0,0) is the center of the screen

// Define the "Floor" mathematically: A flat plane pointing Up (0,1,0) at height 0
export const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

// Create a variable to hold the result
export const intersectionPoint = new THREE.Vector3();

const uiElements = {
        uiOccupancy: document.getElementById('ui-iot-occupancy'),
        uiOccuHeader: document.getElementById('ui-iot-occu-header'),
        // uiTemp: document.getElementById('ui-iot-temp'),
        // uiAC: document.getElementById('ui-iot-ac'),
        // uiLights: document.getElementById('ui-iot-lights'),
        uiDate: document.getElementById('ui-iot-date'),
        uiTime: document.getElementById('ui-iot-time'),
        uiName: document.getElementById('ui-room-name'),
        uiID: document.getElementById('ui-room-id'),
        uiFloor: document.getElementById('ui-room-floor'),
        uiIot: document.getElementById('iot-data')
    };

export const livePlayback = {
    isLive: true,
    startTime: Date.now(),
    trackCount: 0
};

export function createLiveMarker(trackId, position, region, color = 0xff0000, size = 0.15) {
    if (region === "MAIN_VIEW")
        color = 0x00ff00; // Green for main view
    const marker = createObjectMarker(position.z, position.x, Math.PI, models.roblox);
    marker.position.y = 0.5;
    // marker.rotation.y = Math.random() * Math.PI * 2; // Random rotation for visual variety
    
    
    marker.position.set(position.x, 0.3, position.z);
    marker.userData = {
        trackId: trackId,
        createdAt: Date.now(),
        region: region
    };
    
    // Add a label above the marker
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'Bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Track ${trackId} Region ${region}`, 128, 45);
    
    const texture = new THREE.CanvasTexture(canvas);
    const labelGeometry = new THREE.PlaneGeometry(1, 0.25);
    const labelMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.set(0, 0.5, 0);
    marker.add(label);
    
    return marker;
}

export function updateLiveMarker(marker, position) {
    if (marker) {
        marker.position.set(position.x, 0.3, position.z);
    }
}

export function getLiveTrackMarkers() {
    return livePlayback.trackCount;
}

export function getFormattedTime() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
}

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

export function updateLiveStats(trackCount) {
    livePlayback.trackCount = trackCount;
    if (document.getElementById('ui-occupancy')) {
        document.getElementById('ui-occupancy').textContent = `${trackCount} people`;
    }
}

export function renderFrame() {
    // --- ADD THIS BLOCK ---
    // ----------------------

    const department = document.getElementById('department').textContent.trim();
    
    // trackMarkers.forEach(m => m.visible = false);

    // if (index < globalTrackFrames.length) {
    //     const realFrameNumber = globalTrackFrames[index];
    //     const detections = globalTrackData.get(realFrameNumber) || [];
    //     if (department != "Facilities") {
    //         detections.forEach(d => {
    //             const marker = trackMarkers.get(d.id);
    //             if (marker) {
    //                 marker.position.x = d.z; 
    //                 marker.position.z = d.x;
    //                 marker.visible = true;
    //             }
    //         });
    //     }
    
    //     // if (uiElements.uiOccupancy && uiElements.uiOccuHeader) {
    //     //     const l = detections.length;
    //     //     if (department == "Facilities"){
    //     //         uiElements.uiOccuHeader.innerText = "Occupancy: ";
    //     //         uiElements.uiOccupancy.innerText = (l > 0) ? "Occupied" : "Vacant";
    //     //         uiElements.uiOccupancy.style.color = (l > 0) ? "#ff4444" : "#00ff88";
    //     //     }
    //     //     else {
    //     //         uiElements.uiOccuHeader.innerText = "Occupancy: ";
    //     //         uiElements.uiOccupancy.innerText = l;
    //     //         uiElements.uiOccupancy.style.color = (l > 20) ? "#ff4444" : ( l === 0 ? "#fff" : "#00ff88");
    //     //     }
    //     // }
    // }

    // if (index < globalIoTData.length) {
    //     const row = globalIoTData[index];
        
    //     if (department == "Security") uiElements.uiIot.style.display = "none";
    //     else {
    //         uiElements.uiIot.style.display = "block";

    //         if (uiElements.uiTemp) {
    //             const t = parseFloat(row['temp']);
    //             uiElements.uiTemp.innerText = t + "°C";
                
    //             if (t <= 19) uiElements.uiTemp.style.color = "#0088ff";
    //             else if (t <= 22) uiElements.uiTemp.style.color = "#00ffff";
    //             else if (t <= 27) uiElements.uiTemp.style.color = "#00ff88";
    //             else if (t <= 30) uiElements.uiTemp.style.color = "#ff8800";
    //             else uiElements.uiTemp.style.color = "#f00";
    //         }
            
    //         if (uiElements.uiAC) {
    //             const ac = row['ac']; 
    //             uiElements.uiAC.innerText = (ac === "On") ? "• ON" : "- OFF";
    //             uiElements.uiAC.style.color = (ac === "On") ? "#00ff88" : "#ff4444";
    //         }

    //         if (uiElements.uiLights) {
    //             const l = row['lights'];
    //             uiElements.uiLights.innerText = (l === "On") ? "• ON" : "- OFF";
    //             uiElements.uiLights.style.color = (l === "On") ? "#00ff88" : "#ff4444";
    //         }
    //     }

        if (uiElements.uiDate) {
           displayCurrentDateTime();
        }
            
        // --- NEW CODE START: TIME CALCULATION ---
        if (uiElements.uiTime) {
            uiElements.uiTime.innerText = getFormattedTime();
        }

        // if (uiElements.uiOccupancy) {
        //     const l = row['occu'];
        //     uiElements.uiOccupancy.innerText = l;
        //     uiElements.uiOccupancy.style.color = (l > 20) ? "#ff4444" : ( l === 0 ? "#fff" : "#00ff88");
        // }
        // if (uiElements.uiOccupancy && uiElements.uiOccuHeader) {
        //     const l = row['occu'];
        //     if (department == "Facilities"){
        //         uiElements.uiOccuHeader.innerText = "Status: ";
        //         uiElements.uiOccupancy.innerText = (l > 0) ? "Occupied" : "Vacant";
        //         uiElements.uiOccupancy.style.color = (l > 0) ? "#ff4444" : "#00ff88";
        //     }
        //     else {
        //         uiElements.uiOccuHeader.innerText = "Occupancy Count: ";
        //         uiElements.uiOccupancy.innerText = l;
        //         uiElements.uiOccupancy.style.color = (l > 20) ? "#ff4444" : ( l === 0 ? "#fff" : "#00ff88");
        //     }
        // }
    // }
    
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

        }
    }
}

export function getRoomInfo(x, z) {
    if (z >= -9.1 && z <= 9.1 && x >= -9.35 && x <= 9.35) {
        return { name: "Projects Lab", id: "C-007", floor: "Lower Ground" };
    } else if (z > 9.1 && z <= 16.95 && x >= -9.35 && x <= 9.35) {
        return { name: "Power Lab", id: "C-006", floor: "Lower Ground" };
    }
    return { name: "Outside Bounds", id: "N/A", floor: "N/A" };
}