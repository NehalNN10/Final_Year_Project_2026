import * as THREE from 'three';
import { camera } from "./scene.js"; // We need the camera for raycasting

export const raycaster = new THREE.Raycaster();
export const screenCenter = new THREE.Vector2(0, 0); 
export const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
export const intersectionPoint = new THREE.Vector3();

// Define Room boundaries
export function getRoom(x, z) {
    if (z >= -9.1 && z <= 9.1 && x >= -9.35 && x <= 9.35) {
        return { name: "Projects Lab", id: "C-007", floor: "Lower Ground" };
    } else if (z > 9.1 && z <= 16.95 && x >= -9.35 && x <= 9.35) {
        return { name: "Power Lab", id: "C-006", floor: "Lower Ground" };
    }
    return { name: "Outside Bounds", id: "N/A", floor: "N/A" };
}

// Format Real-Time Clock
export function getFormattedTime() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour12: false });
}

// Format Real-Time Date
function displayCurrentDateTime() {
    const now = new Date();
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return now.toLocaleDateString('en-US', options);
}

// The Live Engine Render Loop
export function renderLiveFrame() {
    // 1. Fetch UI Elements directly from the DOM
    const uiName = document.getElementById('ui-room-name');
    const uiID = document.getElementById('ui-room-id');
    const uiFloor = document.getElementById('ui-room-floor');
    const uiDate = document.getElementById('ui-iot-date');
    const uiTime = document.getElementById('ui-iot-time');

    // 2. Update Date & Time
    if (uiDate) uiDate.innerText = displayCurrentDateTime();
    if (uiTime) uiTime.innerText = getFormattedTime();

    // 3. Raycast for Room Name/ID
    if (uiName && uiID && uiFloor && camera) {
        raycaster.setFromCamera(screenCenter, camera);
        const hit = raycaster.ray.intersectPlane(floorPlane, intersectionPoint);

        if (hit) {
            const info = getRoom(intersectionPoint.x, intersectionPoint.z);

            uiName.innerText = info.name;
            uiID.innerText = info.id;
            uiFloor.innerText = info.floor;
            
            // Apply colors based on whether we hit a room or went out of bounds
            if (info.id === "N/A") {
                uiName.style.color = "#ff4444";
                uiID.style.color = "#ff4444";
                uiFloor.style.color = "#ff4444";
            } else {
                uiName.style.color = "#00ff88"; // Let Tailwind handle the text color!
                uiID.style.color = "#fff";
                uiFloor.style.color = "#fff";
            }
        }
    }
}