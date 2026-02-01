import * as THREE from "three";
import { createMarker } from "./world.js";
import { camera, controls } from "./scene.js";
//1200
export const playback = {
  frame: 0,
  maxFrames: 2400,
  playing: true,
  speed: 1,
};

// const tracker = './files/combined_frames.csv';
// const tracker = './temp_files/tracks_output_cam1_allframes.csv';
// const tracker = "./temp_files/nehal_tracks_output.csv";
const tracker = "./temp_files/nehal_tracks_output (1).csv";
//'./files/combined_flicker_free.csv';

//'./files/tracks_output_cam2_allframes.csv';
//mapped_tracks_cam1_manal
// const tracker = './files/mapped_tracks_angle_01.csv';
// const tracker = './files/tracks_output.csv';
// const tracker = './files/mapped_tracks_angle_01_try_2.csv';
const iot = "./files/iot.csv";

export const uiElements = {
  uiOccupancy: document.getElementById("ui-iot-occupancy"),
  uiOccuHeader: document.getElementById("ui-iot-occu-header"),
  uiTemp: document.getElementById("ui-iot-temp"),
  uiAC: document.getElementById("ui-iot-ac"),
  uiLights: document.getElementById("ui-iot-lights"),
  uiTime: document.getElementById("ui-iot-time"),
  uiName: document.getElementById("ui-room-name"),
  uiID: document.getElementById("ui-room-id"),
  uiFloor: document.getElementById("ui-room-floor"),
  uiCoords: document.getElementById("ui-coords"),
  uiIot: document.getElementById("iot-data"),
};

let globalTrackFrames = [];
let globalTrackData = new Map();
let globalIoTData = [];
let trackMarkers = new Map();
let globalId = 1;
export function renderFrame(index) {
  const view = document.querySelector('input[name="view"]:checked').value;

  trackMarkers.forEach((m) => (m.visible = false));

  if (index < globalTrackFrames.length) {
    const realFrameNumber = globalTrackFrames[index];
    const detections = globalTrackData.get(realFrameNumber) || [];
    if (view != "fac") {
      detections.forEach((d) => {
        const marker = trackMarkers.get(d.id);
        // print(d);

        if (marker) {
          marker.position.x = d.z;
          marker.position.z = d.x;
          // marker.id = d.tracker_id;
          marker.visible = true;
        }
      });
    }

    if (uiElements.uiOccupancy && uiElements.uiOccuHeader) {
      const l = detections.length;
      if (view == "fac") {
        uiElements.uiOccuHeader.innerText = "Status: ";
        uiElements.uiOccupancy.innerText = l > 0 ? "Occupied" : "Vacant";
        uiElements.uiOccupancy.style.color = l > 0 ? "#ff4444" : "#00ff88";
      } else {
        uiElements.uiOccuHeader.innerText = "Occupancy Count: ";
        uiElements.uiOccupancy.innerText = l;
        uiElements.uiOccupancy.style.color =
          l > 20 ? "#ff4444" : l === 0 ? "#fff" : "#00ff88";
      }
    }
  }

  if (index < globalIoTData.length) {
    const row = globalIoTData[index];

    if (view == "sec") uiElements.uiIot.style.display = "none";
    else {
      uiElements.uiIot.style.display = "block";

      if (uiElements.uiTemp) {
        const t = parseFloat(row["temp"]);
        uiElements.uiTemp.innerText = t + "°C";

        if (t <= 19) uiElements.uiTemp.style.color = "#0088ff";
        else if (t <= 22) uiElements.uiTemp.style.color = "#00ffff";
        else if (t <= 27) uiElements.uiTemp.style.color = "#00ff88";
        else if (t <= 30) uiElements.uiTemp.style.color = "#ff8800";
        else uiElements.uiTemp.style.color = "#f00";
      }

      if (uiElements.uiAC) {
        const ac = row["ac"];
        uiElements.uiAC.innerText = ac;
        uiElements.uiAC.style.color = ac === "On" ? "#00ff88" : "#ff4444";
      }

      if (uiElements.uiLights) {
        const l = row["lights"];
        uiElements.uiLights.innerText = l;
        uiElements.uiLights.style.color = l === "On" ? "#00ff88" : "#ff4444";
      }
    }

    if (uiElements.uiTime) {
      uiElements.uiTime.innerText =
        ((row["timestamp"] || index) / 10).toFixed(1) + "s";
    }

    // if (uiElements.uiOccupancy) {
    //     const l = row['occu'];
    //     uiElements.uiOccupancy.innerText = l;
    //     uiElements.uiOccupancy.style.color = (l > 20) ? "#ff4444" : ( l === 0 ? "#fff" : "#00ff88");
    // }
    // if (uiElements.uiOccupancy && uiElements.uiOccuHeader) {
    //     const l = row['occu'];
    //     if (view == "fac"){
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
  }

  if (uiElements.uiName && uiElements.uiID && uiElements.uiFloor) {
    const camX = camera.position.x;
    const camZ = camera.position.z;
    const info = getRoomInfo(camX, camZ);

    uiElements.uiName.innerText = info.name;
    uiElements.uiID.innerText = info.id;
    uiElements.uiFloor.innerText = info.floor;

    if (uiElements.uiCoords)
      uiElements.uiCoords.innerText = `${camX.toFixed(1)}, ${camZ.toFixed(1)}`;

    if (info.id === "N/A") {
      uiElements.uiName.style.color = "#ff4444";
      uiElements.uiID.style.color = "#ff4444";
      uiElements.uiFloor.style.color = "#ff4444";
      uiElements.uiTemp.innerText = "N/A";
      uiElements.uiTemp.style.color = "#ff4444";
      uiElements.uiAC.innerText = "N/A";
      uiElements.uiAC.style.color = "#ff4444";
      uiElements.uiLights.innerText = "N/A";
      uiElements.uiLights.style.color = "#ff4444";
      uiElements.uiOccupancy.innerText = "N/A";
      uiElements.uiOccupancy.style.color = "#ff4444";
    } else {
      uiElements.uiFloor.style.color = "#fff";
      uiElements.uiID.style.color = "#fff";
      uiElements.uiName.style.color = "#00ff88";
    }
  }
}

export function getRoomInfo(x, z) {
  if (x >= -9.1 && x <= -2.4 && z >= -9.35 && z <= 9.35) {
    return { name: "Projects Lab", id: "C-007", floor: "Lower Ground" };
  } else if (x >= -2.4 && x <= 9.1 && z <= 5.35 && z >= -9.35) {
    return { name: "Projects Lab", id: "C-007", floor: "Lower Ground" };
  }
  return { name: "Outside Bounds", id: "N/A", floor: "N/A" };
}

export async function loadSimulationData(onLoadComplete) {
  try {
    const tResp = await fetch(tracker);
    if (!tResp.ok) throw new Error(`Track CSV not found`);

    const tText = await tResp.text();
    const tLines = tText.split("\n").filter((l) => l.trim());

    if (tLines.length > 1) {
      const headers = tLines[0].split(",").map((h) => h.trim().toLowerCase());
      const frameIdx = headers.indexOf("frame");
      const idIdx = headers.findIndex(
        // (h) => h.includes("id") || h.includes("track"),
        (h) => h === "track_id",
      );
      const xIdx = headers.findIndex((h) => h.includes("three_x") || h === "x");
      const zIdx = headers.findIndex((h) => h.includes("three_z") || h === "z");
      const camIdx = headers.findIndex((h) => h.includes("camera"));

      if (frameIdx > -1 && xIdx > -1 && zIdx > -1) {
        tLines.slice(1).forEach((line) => {
          const cols = line.split(",");
          const frame = parseInt(cols[frameIdx]);
          const id = parseInt(cols[idIdx]);
          // const id = `${cols[idIdx]}_${cols[camIdx]}`;
          //alert(id);
          //cols[idIdx];
          const x = parseFloat(cols[xIdx]);
          const z = parseFloat(cols[zIdx]);

          if (isNaN(frame) || isNaN(x) || isNaN(z)) return;

          if (!globalTrackData.has(frame)) globalTrackData.set(frame, []);
          globalTrackData.get(frame).push({ id, x, z });

          if (!trackMarkers.has(id)) {
            const PERSON_COLOR = 0x00ff88;
            // create marker with the track id as label for debugging
            const marker = createMarker(0, 0, PERSON_COLOR, 0.15, id);
            marker.visible = false;
            trackMarkers.set(id, marker);
          }
        });
        globalTrackFrames = Array.from(globalTrackData.keys()).sort(
          (a, b) => a - b,
        );
      }
    }
  } catch (e) {
    console.error("Error loading tracks:", e);
  }

  try {
    const iResp = await fetch(iot);
    if (iResp.ok) {
      const iText = await iResp.text();
      const iRows = iText
        .split("\n")
        .map((r) => r.trim())
        .filter((r) => r);
      const headers = iRows[0].split(",").map((h) => h.trim().toLowerCase());

      globalIoTData = iRows.slice(1).map((row) => {
        const vals = row.split(",");
        const obj = {};
        headers.forEach((h, i) => (obj[h] = vals[i]));
        return obj;
      });
    }
  } catch (e) {
    console.error("Error loading IoT", e);
  }

  // playback.maxFrames = Math.max(globalTrackFrames.length, globalIoTData.length) - 1;

  if (onLoadComplete) onLoadComplete();
}
const dummy = createMarker(9, 7.5, "red", 0.1);
// const cam1 = createMarker(-8.65, 9, "white", 0.1, "Camera 1");
// const cam2 = createMarker(-8.65, -1.5, "white", 0.1, "Camera 2");
// const cam3 = createMarker(8.5, -5, "white", 0.1, "Camera 3");
