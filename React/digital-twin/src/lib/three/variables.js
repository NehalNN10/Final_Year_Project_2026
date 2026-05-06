export const FPS = 25; 
export const LOOP_DURATION = 1800; 

// Start them as empty objects
export const roomInfo = {};
export const iot = {};  // now stores Maps instead of arrays
export const iotState = {
    loadedStart: 0,
    loadedEnd: 0,
    isFetching: false
};

export async function fetchIotChunk(startSecond, endSecond) {
    if (iotState.isFetching) return;
    iotState.isFetching = true;

    try {
        const roomIds = ["C-007", "C-006"];
        
        await Promise.all(roomIds.map(async (roomId) => {
            const response = await fetch(`/api/room_data?room_id=${roomId}&start=${startSecond}&end=${endSecond}`);
            
            if (!response.ok) {
                console.warn(`[IoT Fetch] Server error ${response.status} for ${roomId}. Skipping chunk.`);
                return; 
            }

            const data = await response.json();
            
            if (!iot[roomId] || !(iot[roomId] instanceof Map)) {
                iot[roomId] = new Map();
            }

            if (data && Array.isArray(data.room_data)) {
                data.room_data.forEach(row => {
                    iot[roomId].set(row.second ?? row.time, {  
                        occupancy: row.occupancy,
                        temperature: row.temperature,
                        ac: row.ac,
                        lights: row.lights
                    });
                });
            }
        }));

        iotState.loadedStart = startSecond;
        iotState.loadedEnd = endSecond;

    } catch (e) {
        console.error("Failed to fetch IoT chunk:", e);
    } finally {
        iotState.isFetching = false;
    }
}

export function pruneOldIotFrames(beforeSecond) {
    ["C-007", "C-006"].forEach(roomId => {
        if (iot[roomId] instanceof Map) {
            for (let [sec] of iot[roomId].entries()) {
                if (sec < beforeSecond) iot[roomId].delete(sec);
            }
        }
    });
    iotState.loadedStart = beforeSecond;
}

export async function initVariables(startSecond = 0) {
    await initRoomInfo();
    await fetchIotChunk(startSecond, startSecond + 60);
}

export async function getRoomInfo(roomId) {
    try {
        const response = await fetch(`/api/room_info?room_id=${roomId}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch room info:", error.message);
        return null;
    }
}

export async function resetIotBuffer(startSecond) {
    // Clear out the old maps
    if (iot["C-007"] instanceof Map) iot["C-007"].clear();
    if (iot["C-006"] instanceof Map) iot["C-006"].clear();
    
    // Reset the tracking boundaries
    iotState.loadedStart = startSecond;
    iotState.loadedEnd = startSecond;
    iotState.isFetching = false;
    
    // Fetch the new chunk
    await fetchIotChunk(startSecond, startSecond + 60);
}

export async function initRoomInfo() {
    roomInfo["C-007"] = await getRoomInfo("C-007");
    roomInfo["C-006"] = await getRoomInfo("C-006");
}

export async function initRoomData() {
    iot["C-007"] = await getRoomData("C-007");
    iot["C-006"] = await getRoomData("C-006");
}

export function getRoom(x, z) {
    if (z >= -9.1 && z <= 9.1 && x >= -9.35 && x <= 9.35) {
        return "C-007";
    } else if (z > 9.1 && z <= 16.95 && x >= -9.35 && x <= 9.35) {
        return "C-006";
    }
    return null;
}

export function getTime() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour12: true });
}

// Format Real-Time Date
export function getDate() {
    const now = new Date();
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return now.toLocaleDateString('en-US', options);
}

export function sendFacilitiesAlert(roomId, alertType, timeStr, description) {
    console.warn(`[Sandbox Alert] ${roomId} firing: ${alertType} at ${timeStr}`);

    fetch('http://localhost:1767/api/send_facilities_alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            room_number: roomId,
            alert_type: alertType,
            time_since: timeStr,
            description: description + " (Sandbox Mode)"
        })
    })
    .then(r => r.json())
    .then(data => console.log(`[${roomId}] ✅ Alert sent:`, data))
    .catch(err => console.error(`[${roomId}] ❌ Alert failed:`, err));
}