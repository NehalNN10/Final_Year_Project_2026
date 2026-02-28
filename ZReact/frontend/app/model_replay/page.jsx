"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { initModel } from "@/lib/model_runner"; 

export default function ModelReplay() {
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
      <div className="main-nav">
        <div style={{ flex: 1 }}>
          <h1>HU Digital Twin</h1>
        </div>
        <div style={{ flex: 2 }}> 
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly' }}>
            <button className="header" onClick={() => router.push('/dashboard')}>Home</button>
            <button className="header selected" onClick={() => router.push('/model')}>Model</button>
            <button className="header" onClick={() => router.push('/')}>Log Out</button>
          </div>
        </div>
      </div>

      <div className="main">
        <div className="model">
          <div className="scroll" id="top-left">
            
            <div className="tracker-ui outer" style={{ marginTop: '20px' }}>
              <h3 className="row">
                <span>
                  <span>📍</span>
                  <span id="ui-room-name" className="bold" style={{ color: uiState.occupancyColor }}>{uiState.roomName}</span>
                </span>
              </h3>
              
              <div className="content" id="ui-content">
                <div className="row">
                    <span id="ui-room-id">{uiState.roomId}</span>
                    <span id="ui-room-floor">{uiState.roomFloor}</span>
                </div>

                <div className="row">
                  <span><span> 📅 </span><span id="ui-iot-date">{uiState.date}</span></span>
                  <span><span> ⏰ </span><span id="ui-iot-time" className="bold value">{uiState.time}</span></span>
                </div>

                <div className="row border" id="occupancy">
                  <span id="ui-iot-occu-header">Occupancy:</span>
                  <span id="ui-iot-occupancy" className="bold value" style={{ color: uiState.occupancyColor }}>{uiState.occupancy}</span>
                </div>
            
                <div id="iot-data">
                  <div className="row">
                    <span>
                      <span className="label"> 🌡️ Temperature:</span>
                      <span id="ui-iot-temp" className="bold" style={{ color: uiState.tempColor }}>{uiState.temp}</span>
                    </span>
                  </div>
                  <div className="row">
                    <span>
                      <span className="label"> ❄️ AC State:</span>
                      <span id="ui-iot-ac" className="bold" style={{ color: uiState.acColor }}>{uiState.ac}</span>
                    </span>
                    <span>
                      <span className="label"> 💡 Lights State:</span>
                      <span id="ui-iot-lights" className="bold" style={{ color: uiState.lightsColor }}>{uiState.lights}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div> 

            <div className="tracker-ui outer">
              <h3>Simulation Controls</h3> 
              <div className="content" id="sim-content">
                  {/* Your simulation tools / dat.gui attach here automatically! */}
              </div>
            </div>

            <div className="tracker-ui outer">
              <h3>Model Controls</h3> 
              <div className="content" id="ui-content">
                <div className="row"><span className="label">Zoom:</span><span id="ui-room-name">Scroll Wheel/Pinch</span></div>
                <div className="row"><span className="label">Move:</span><span id="ui-room-id">Right Click & Pan</span></div>
                <div className="row"><span className="label">Rotate:</span><span id="ui-room-floor">Left Click & Pan</span></div>
                <div className="border" id="cam-content"></div>
              </div>
            </div>

          </div>

          <div id="model-container" ref={containerRef}>
            <div className="crosshair"></div>
          </div> 
        </div>
      </div>
    </>
  );
}