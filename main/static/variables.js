export const FPS = 25; 
export const LOOP_DURATION = 900; 

export async function getRoomData(roomId) {
    try {
        // 1. Call the API with the room_id query parameter
        const response = await fetch(`/api/room_data?room_id=${roomId}`);

        // 2. Check if the response is successful (status 200-299)
        if (!response.ok) {
            // This catches your 404 (Room not found) and 500 (Server error)
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        }

        // 3. Parse the JSON response
        const data = await response.json();
        
        // 4. Access the 'room_data' array from your Python response
        const roomDataArray = data.room_data;
        
        console.log(`Successfully fetched ${roomDataArray.length} records for room ${roomId}`);
        console.log(roomDataArray);

        return roomDataArray;

    } catch (error) {
        console.error("Failed to fetch room data:", error.message);
    }
}

export async function getRoomInfo(roomId) {
    try {
        const response = await fetch(`/api/room_info?room_id=${roomId}`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Successfully fetched info for room ${roomId}`);
        console.log(data);

        return data;
    } catch (error) {
        console.error("Failed to fetch room info:", error.message);
    }
}

export const roomInfo = {
    "C-007": await getRoomInfo("C-007"),
    "C-006": await getRoomInfo("C-006")
};

export const iot = {
    "C-007": await getRoomData("C-007"),
    "C-006": await getRoomData("C-006")
};

export function getRoom(x, z) {
    if (z >= -9.1 && z <= 9.1 && x >= -9.35 && x <= 9.35) {
        return "C-007";
    } else if (z > 9.1 && z <= 16.95 && x >= -9.35 && x <= 9.35) {
        return "C-006";
    }
    return "N/A";
}