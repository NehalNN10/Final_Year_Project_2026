export const FPS = 25; 
export const LOOP_DURATION = 900; 

// Start them as empty objects
export const roomInfo = {};
export const iot = {};

// We will call this function right before booting the 3D world!
export async function initVariables() {
    roomInfo["C-007"] = await getRoomInfo("C-007");
    roomInfo["C-006"] = await getRoomInfo("C-006");

    iot["C-007"] = await getRoomData("C-007");
    iot["C-006"] = await getRoomData("C-006");
}

export async function getRoomData(roomId) {
    try {
        const response = await fetch(`/api/room_data?room_id=${roomId}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        return data.room_data;
    } catch (error) {
        console.error("Failed to fetch room data:", error.message);
        return []; // Return empty array on fail so app doesn't crash
    }
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

export function getRoom(x, z) {
    if (z >= -9.1 && z <= 9.1 && x >= -9.35 && x <= 9.35) {
        return "C-007";
    } else if (z > 9.1 && z <= 16.95 && x >= -9.35 && x <= 9.35) {
        return "C-006";
    }
    return null;
}