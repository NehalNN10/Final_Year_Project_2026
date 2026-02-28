"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { initModel } from "@/lib/model_runner"; 

export default function ModelPage() {
  const router = useRouter();
  const containerRef = useRef(null);

  const [uiState, setUiState] = useState({
    roomName: "--", roomId: "--", roomFloor: "--",
    date: "??", time: "??",
    occupancy: "Detecting...", occupancyColor: "#fff",
    temp: "??", tempColor: "#fff",
    ac: "--", acColor: "#fff",
    lights: "--", lightsColor: "#fff",
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const cleanup = initModel(containerRef.current, (newData) => {
      setUiState((prev) => ({ ...prev, ...newData }));
    });
    return () => { if (cleanup) cleanup(); };
  }, []);

  return (
    <>
       <div class="main-nav">
        <div style="flex: 1;">
          <h1>HU Digital Twin</h1>
        </div>
        <div style="flex: 2;"> 
          <div style="display: flex; flex-direction: row; justify-content: space-evenly">
            
              <button class="header" onclick="window.location.href='/facility_home'">Home</button>
            
              <button class="header" onclick="window.location.href='/security_home'">Home</button>
            
              <button class="header" onclick="window.location.href='/dashboard'">Home</button>
            
            <button class="header selected" onclick="window.location.href='/model'">Model</button>
            <button class="header" onclick="window.location.href='/'">Log Out</button>
          </div>
        </div>
        
      </div>

      <div class="main">

        <div id="model-container">
          <div class="crosshair"></div>
          </div> 
        <script type="module" src="{{ url_for('static', filename='model.js') }}"></script>
        <div class="scroll" id="float">
          

          <div class="tracker-ui outer" style="margin-top: 20px;">
          
            <h3 class="row">
              <span>
                <span>📍</span>
                <span id="ui-room-name" class="bold">--</span>
              </span>
            </h3>
            
            <div class="content" id="ui-content">

              <div class="row">
                  <span id="ui-room-id">--</span>
                  <span id="ui-room-floor">--</span>
              </div>

              <div class="row">
                <span>
                  <span> 📅 </span>
                  <span id="ui-iot-date">??</span>
                </span>
                <span>
                  <span> ⏰ </span>
                  <span id="ui-iot-time" class="bold value">??</span>
                </span>
              </div>

              <div class="row border" id="occupancy">

                <span id="ui-iot-occu-header">Occupancy:</span>
                <span id="ui-iot-occupancy" class="bold value">Detecting...</span>

              </div>
          
              <div id="iot-data">
                <div class="row">
                  <span>
                    <span class="label"> 🌡️ Temperature:</span>
                    <span id="ui-iot-temp" class="bold">??</span>
                  </span>
                </div>

                <div class="row">
                  <span>
                    <span class="label"> ❄️ AC State:</span>
                    <span id="ui-iot-ac" class="bold">--</span>
                  </span>

                  <span>
                    <span class="label"> 💡 Lights State:</span>
                    <span id="ui-iot-lights" class="bold">--</span>
                  </span>
                </div>
              </div>

            </div>
          </div> 

          <div class= "tracker-ui outer" style="display: none;">
            <h3>Simulation Controls</h3> 

            <div class="content" id="sim-content">
            
            </div>
            
          </div>

          <div class="tracker-ui outer">

            <h3>Model Controls</h3> 

            <div class="content" id="ui-content">
              <div class="row">
                <span class="label">Zoom:</span>
                <span id="ui-room-name">Scroll Wheel/Pinch</span>
              </div>
              <div class="row">
                  <span class="label">Move:</span>
                  <span id="ui-room-id">Right Click & Pan</span>
              </div>

              <div class="row">
                  <span class="label">Rotate:</span>
                  <span id="ui-room-floor">Left Click & Pan</span>
              </div>

              <div class="border" id="cam-content">

              </div>

              <div class="row">
                <button class="track-btn" id="replay-btn">Model Replay</button>
              </div>
            </div>
            

          </div>
          
          <div style="display: none">
            <span id="live">
              true
            </span>
          </div>
        </div>
      </div>
    </>
  );
}