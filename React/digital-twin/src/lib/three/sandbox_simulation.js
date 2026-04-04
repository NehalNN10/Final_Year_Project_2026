import * as THREE from "three";
import { createMarker } from "./world.js";
import { FPS, LOOP_DURATION, iot, getRoom, roomInfo, getDate, getTime } from "./variables.js";

export class SandboxSimulation {
    constructor(engine) {
        this.engine = engine; 

        this.spawnedPeople = [];

        // Track the room we are currently looking at
        this.currentRoom = null;
        this.lastRoom = null;

        this.roomIoT = {
            "C-007": { occupancy: 0, temp: 25.0, ac: false, lights: false },
            "C-006": { occupancy: 0, temp: 25.0, ac: false, lights: false }
        }

        // --- NEW TRACKERS FOR ALERTS ---
        this.zeroOccupancyTracker = {}; // { roomId: secondsCount }
        this.alertCooldown = {};        // { roomId: boolean }
        this.lastSecond = -1;           
        // -------------------------------
        
        this.raycaster = new THREE.Raycaster();
        this.screenCenter = new THREE.Vector2(0, 0); 
        this.floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        this.intersectionPoint = new THREE.Vector3();
    }

    // --- NEW TARGETED ROOM CONTROLS ---
    toggleOccu() {
        if (this.currentRoom) {
            this.roomIoT[this.currentRoom].occupancy = this.roomIoT[this.currentRoom].occupancy === 0 ? 20 : 0;
        }
    }

    toggleAC() {
        if (this.currentRoom) {
            this.roomIoT[this.currentRoom].ac = !this.roomIoT[this.currentRoom].ac;
            console.log(`AC in ${this.currentRoom} is now ${this.roomIoT[this.currentRoom].ac ? "ON" : "OFF"}`);
        }
    }

    toggleLights() {
        if (this.currentRoom) {
            this.roomIoT[this.currentRoom].lights = !this.roomIoT[this.currentRoom].lights;
        }
    }

    changeTemp(value) {
        if (this.currentRoom) {
            if (!this.roomIoT[this.currentRoom]) {
                this.roomIoT[this.currentRoom] = { occupancy: 0, temp: 25.0, ac: false, lights: false };
            }
            // Change temp for THIS room only!
            this.roomIoT[this.currentRoom].temp = parseFloat(value);
        }
    }
    // ----------------------------------

    spawnPerson() {
        this.raycaster.setFromCamera(this.screenCenter, this.engine.camera);
        const hit = this.raycaster.ray.intersectPlane(this.floorPlane, this.intersectionPoint);
        
        if (hit) {
            const id = "SandboxNPC_" + Date.now();
            
            // Note: Make sure X is first, then Z!
            const marker = createMarker(this.intersectionPoint.z, this.intersectionPoint.x, 0x00ff88, 0.2, id);
            
            marker.visible = true;
            
            // 🌟 THE FIX: Brand the exact coordinates into the object's brain
            marker.userData.gridX = this.intersectionPoint.x;
            marker.userData.gridZ = this.intersectionPoint.z;
            
            this.spawnedPeople.push(marker); 
            
            const targetRoom = getRoom(this.intersectionPoint.x, this.intersectionPoint.z);
            if (targetRoom) {
                if (!this.roomIoT[targetRoom]) {
                    this.roomIoT[targetRoom] = { occupancy: 0, temp: 25.0, ac: false, lights: false };
                }
                this.roomIoT[targetRoom].occupancy += 1;
            }
        }
    }

    removePerson() {
        this.raycaster.setFromCamera(this.screenCenter, this.engine.camera);
        const hits = this.raycaster.intersectObjects(this.spawnedPeople, true);

        let personToRemove = null;

        if (hits.length > 0) {
            let hitMesh = hits[0].object;
            if (this.spawnedPeople.includes(hitMesh)) {
                personToRemove = hitMesh;
            } else {
                hitMesh.traverseAncestors((ancestor) => {
                    if (this.spawnedPeople.includes(ancestor)) personToRemove = ancestor;
                });
            }
        } else {
            personToRemove = this.spawnedPeople.pop();
        }

        if (personToRemove) {
            const posX = personToRemove.position.x;
            const posZ = personToRemove.position.z;
            const targetRoom = getRoom(posX, posZ);
            
            if (targetRoom && this.roomIoT[targetRoom] && this.roomIoT[targetRoom].occupancy > 0) {
                this.roomIoT[targetRoom].occupancy -= 1;
            }

            this.engine.scene.remove(personToRemove);
            const index = this.spawnedPeople.indexOf(personToRemove);
            if (index > -1) {
                this.spawnedPeople.splice(index, 1);
            }
        }
    }

    removeAll() {
        // 1. Physically remove all the 3D models from the scene first!
        for (const person of this.spawnedPeople) {
            this.engine.scene.remove(person);
        }

        // 2. Now it is safe to empty our tracking array
        this.spawnedPeople = [];

        // 3. Reset the IoT data (with the correct capital 'T'!)
        for (const room in this.roomIoT) {
            this.roomIoT[room].occupancy = 0;
        }
        
        console.log("Sandbox cleared!");
    }

    removeAllRoom() {
        this.raycaster.setFromCamera(this.screenCenter, this.engine.camera);
        const hit = this.raycaster.ray.intersectPlane(this.floorPlane, this.intersectionPoint);

        if (hit) {
            const targetRoom = getRoom(this.intersectionPoint.x, this.intersectionPoint.z);

            if (targetRoom) {
                for (let i = this.spawnedPeople.length - 1; i >= 0; i--) {
                    const person = this.spawnedPeople[i];
                    
                    // 🌟 THE FIX: Read from our custom stamped data!
                    const trueX = person.userData.gridX;
                    const trueZ = person.userData.gridZ;
                    
                    if (getRoom(trueX, trueZ) === targetRoom) {
                        this.engine.scene.remove(person);
                        this.spawnedPeople.splice(i, 1);
                    }
                }

                if (this.roomIoT[targetRoom]) {
                    this.roomIoT[targetRoom].occupancy = 0;
                }
                
                console.log(`Room ${targetRoom} is now completely empty!`);
            }
        }
    }

    renderFrame() {
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
            uiFloor: document.getElementById('ui-room-floor')
        };

        // Sandbox Controls Elements
        const btnOccu = document.getElementById('sandbox-btn-occu');
        const btnAC = document.getElementById('sandbox-btn-ac');
        const btnLights = document.getElementById('sandbox-btn-lights');
        const scrubTemp = document.getElementById('temp-scrubber');
        const textTemp = document.getElementById('temp-text');

        const deptEl = document.getElementById('department');
        const department = deptEl ? deptEl.textContent.trim() : "Security";

        this.raycaster.setFromCamera(this.screenCenter, this.engine.camera);
        const hit = this.raycaster.ray.intersectPlane(this.floorPlane, this.intersectionPoint);

        const room = hit ? getRoom(this.intersectionPoint.x, this.intersectionPoint.z) : null;
        const roomInf = (room && roomInfo && roomInfo[room]) ? roomInfo[room] : null;
        const row = (room && this.roomIoT && this.roomIoT[room]) ? this.roomIoT[room] : null;

        // Save the room globally so the buttons know what room to affect!
        this.currentRoom = room;

        // --- SYNCHRONIZE SANDBOX CONTROLS TO CURRENT ROOM ---
        if (this.currentRoom !== this.lastRoom) {
            this.lastRoom = this.currentRoom;
            
            // We just looked at a NEW room. Update the Temp slider instantly!
            if (this.currentRoom && row) {
                if (scrubTemp) scrubTemp.value = row.temp;
                if (textTemp) textTemp.value = row.temp;
            } else {
                if (scrubTemp) scrubTemp.value = 25;
                if (textTemp) textTemp.value = 25;
            }
        }

        // Color the buttons dynamically every frame based on the room's data
        if (roomInf && row && department !== "Security") {
            if (btnAC) btnAC.className = row.ac ? "btn btn-green m-0! flex-1!" : "btn btn-red m-0! flex-1!";
            if (btnLights) btnLights.className = row.lights ? "btn btn-green m-0! flex-1!" : "btn btn-red m-0! flex-1!";
            if (btnOccu) btnOccu.className = row.occupancy === 0 ? "btn btn-green m-0! flex-1!" : "btn btn-red m-0! flex-1!";
        } else {
            // Grey out the buttons if looking at a hallway!
            if (btnAC) btnAC.className = "btn bg-gray-700 m-0! flex-1! pointer-events-none";
            if (btnLights) btnLights.className = "btn bg-gray-700 m-0! flex-1! pointer-events-none";
            if (btnOccu) btnOccu.className = "btn bg-gray-700 m-0! flex-1! pointer-events-none";
        }
        // ----------------------------------------------------

        // --- Standard UI Panel Updates ---
        if (roomInf) {
            if (uiElements.uiName) uiElements.uiName.innerText = roomInf.name;
            if (uiElements.uiID) uiElements.uiID.innerText = roomInf.room_id;
            if (uiElements.uiFloor) uiElements.uiFloor.innerText = roomInf.room_floor;

            if (department !== "Security" && row) {
                if (uiElements.uiTemp) {
                    const t = row.temp;
                    uiElements.uiTemp.innerText = t.toFixed(1) + "°C";
                    
                    if (t <= 19) uiElements.uiTemp.style.backgroundColor = "#0088ff";
                    else if (t <= 22) uiElements.uiTemp.style.backgroundColor = "#00ffff";
                    else if (t <= 27) uiElements.uiTemp.style.backgroundColor = "#00ff88";
                    else if (t <= 30) uiElements.uiTemp.style.backgroundColor = "#ff8800";
                    else uiElements.uiTemp.style.backgroundColor = "#f00";
                }
                
                if (uiElements.uiAC) {
                    uiElements.uiAC.innerText = row.ac ? "ON" : "OFF";
                    uiElements.uiAC.style.backgroundColor = row.ac ? "#00ff88" : "#ff4444";
                }

                if (uiElements.uiLights) {
                    uiElements.uiLights.innerText = row.lights ? "ON" : "OFF";
                    uiElements.uiLights.style.backgroundColor = row.lights ? "#00ff88" : "#ff4444";
                }
            }

            if (uiElements.uiOccupancy && uiElements.uiOccuHeader && row) {
                const l = row.occupancy; 
                if (department === "Facilities"){
                    uiElements.uiOccuHeader.innerText = "Status: ";
                    uiElements.uiOccupancy.innerText = (l > 0) ? "Occupied" : "Vacant";
                    uiElements.uiOccupancy.style.backgroundColor = (l > 0) ? "#ff4444" : "#00ff88";
                } else {
                    uiElements.uiOccuHeader.innerText = "Occupancy Count: ";
                    uiElements.uiOccupancy.innerText = l;
                    uiElements.uiOccupancy.style.backgroundColor = (l > roomInf.max_occupancy) ? "#ff4444" : ( l === 0 ? "#fff" : "#00ff88");
                }
            }

        } else {
            if (uiElements.uiName) uiElements.uiName.innerText = "--";
            if (uiElements.uiID) uiElements.uiID.innerText = "--";
            if (uiElements.uiFloor) uiElements.uiFloor.innerText = "--";
            
            if (uiElements.uiAC) { uiElements.uiAC.innerText = "--"; uiElements.uiAC.style.backgroundColor = "#ffffff"; }
            if (uiElements.uiLights) { uiElements.uiLights.innerText = "--"; uiElements.uiLights.style.backgroundColor = "#ffffff"; }
            if (uiElements.uiOccupancy) { uiElements.uiOccupancy.innerText = "--"; uiElements.uiOccupancy.style.backgroundColor = "#ffffff"; }
            if (uiElements.uiTemp) { uiElements.uiTemp.innerText = "--"; uiElements.uiTemp.style.backgroundColor = "#ffffff"; }
        }

        if (uiElements.uiDate) uiElements.uiDate.innerText = getDate();
        if (uiElements.uiTime) uiElements.uiTime.innerText = getTime();

        // ---- Facilities email notification -----
        const seconds = Math.floor(Date.now() / 1000);

        if (seconds !== this.lastSecond) {
            this.lastSecond = seconds;

            Object.keys(this.roomIoT).forEach(roomId => {
                const roomRow = this.roomIoT[roomId];
                
                // Streak Logic: Increment if occupancy is 0, reset if > 0
                if (roomRow.occupancy === 0) {
                    this.zeroOccupancyTracker[roomId] = (this.zeroOccupancyTracker[roomId] || 0) + 1;
                } else {
                    this.zeroOccupancyTracker[roomId] = 0;
                    this.alertCooldown[roomId] = false; 
                }

                const currentStreak = this.zeroOccupancyTracker[roomId] || 0;
                const wasteDetected = roomRow.ac || roomRow.lights;
                
                // DEFINE THRESHOLD (120 seconds = 2 minutes)
                const thresholdMet = currentStreak >= 120;

                // Dynamic time string for the email
                const streakMinutes = Math.floor(currentStreak / 60);
                const streakSeconds = currentStreak % 60;
                const timeSinceStr = streakMinutes > 0 
                    ? `${streakMinutes} min ${streakSeconds} sec`
                    : `${streakSeconds} sec`;

                //  CHECK ALERT CONDITIONS
                if (thresholdMet && wasteDetected && !this.alertCooldown[roomId]) {
                    this.alertCooldown[roomId] = true;

                    const wasted = [];
                    if (roomRow.ac) wasted.push("AC");
                    if (roomRow.lights) wasted.push("Lights");

                    console.warn(`[Sandbox Alert] ${roomId} firing: 0 occupancy for ${timeSinceStr}`);

                    fetch('http://localhost:1767/api/send_facilities_alert', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            room_number: roomId,
                            alert_type: `${wasted.join(' & ')} left on in empty room`,
                            time_since: timeSinceStr,
                            description: `${wasted.join(' and ')} has been running with zero occupancy for ${timeSinceStr} in Sandbox mode.`
                        })
                    })
                    .then(r => r.json())
                    .then(data => {
                        console.log(`[${roomId}] ✅ Alert sent:`, data);
                        // Optional: Reset immediately or wait for occupancy to change
                        this.zeroOccupancyTracker[roomId] = 0;
                        this.alertCooldown[roomId] = false;
                    })
                    .catch(err => {
                        console.error(`[${roomId}] ❌ Alert failed:`, err);
                        this.zeroOccupancyTracker[roomId] = 0;
                        this.alertCooldown[roomId] = false;
                    });
                }
            });
        }
    }
}