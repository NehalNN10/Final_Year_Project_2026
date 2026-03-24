import * as THREE from 'three';
import { camera } from "./scene.js"; // We need the camera for raycasting
import { getRoom, getTime, getDate, roomInfo } from './variables.js';

export const raycaster = new THREE.Raycaster();
export const screenCenter = new THREE.Vector2(0, 0); 
export const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
export const intersectionPoint = new THREE.Vector3();

// The Live Engine Render Loop
export function renderLiveFrame() {

    raycaster.setFromCamera(screenCenter, camera);
    const hit = raycaster.ray.intersectPlane(floorPlane, intersectionPoint);

    const room = hit ? getRoom(intersectionPoint.x, intersectionPoint.z) : null;
    const roomInf = (room && roomInfo && roomInfo[room]) ? roomInfo[room] : null;

    // 1. Fetch UI Elements directly from the DOM
    const uiName = document.getElementById('ui-room-name');
    const uiID = document.getElementById('ui-room-id');
    const uiFloor = document.getElementById('ui-room-floor');
    const uiDate = document.getElementById('ui-iot-date');
    const uiTime = document.getElementById('ui-iot-time');

    // 2. Update Date & Time
    if (uiDate) uiDate.innerText = getDate();
    if (uiTime) uiTime.innerText = getTime();

    // 3. Raycast for Room Name/ID
    if (roomInf) {
        // Safe Check: Only update if React hasn't deleted the element yet!
        if (uiName) {
            uiName.innerText = roomInf.name;
        }
        if (uiID) {
            uiID.innerText = roomInf.room_id;
        }
        if (uiFloor) {
            uiFloor.innerText = roomInf.room_floor;
        }
    } else {
        if (uiName) {
            uiName.innerText = "--";
        }
        if (uiID) {
            uiID.innerText = "--";
        }
        if (uiFloor) {
            uiFloor.innerText = "--";
        }
    }
}