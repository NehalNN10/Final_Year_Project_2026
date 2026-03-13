"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "../../components/Navbar";
import RoomStatsPanel from "../../components/RoomStatsPanel";
import ModelControlsPanel from "../../components/ModelControlsPanel";


export default function LiveModel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [department, setDepartment] = useState("Loading...");

  useEffect(() => {
    async function fetchSession() {
      try {
        const response = await fetch('/api/session');
        const data = await response.json();
        setDepartment(data.department || "Guest");
      } catch (error) {
        setDepartment("Security"); 
      }
    }
    fetchSession();
  }, []);

  useEffect(() => {
    if (department === "Loading..." || !containerRef.current) return;

    let destroyFn: () => void;
    
    // Boot the specialized LIVE engine instead of the playback engine!
    import("../../lib/three/live_model.js").then((module) => {
      console.log("Three.js LIVE engine booting up...");
      module.initLiveEngine(containerRef.current!);
      destroyFn = module.destroyLiveEngine;
    });

    return () => {
      if (destroyFn) destroyFn();
    };
  }, [department]); 

  if (department === "Loading...") {
    return <div className="loading-screen text-white bg-[#131313] h-screen flex justify-center items-center">Loading Live Feed...</div>;
  }

return (
  <>
    <Navbar department={department} />

      <div className="main" style={{ display: 'flex', height: 'calc(100vh - 70px)' }}>
        
        {/* Model Container */}
        <div id="model-container" ref={containerRef}>
          <div className="crosshair"></div>
        </div>

        <div className="scroll" id="float">

          <div className="flex justify-center mb-4!">
            <div 
              id="data-status" 
              className="bg-[#555] text-white font-bold py-2 px-6 rounded-full shadow-lg transition-all duration-300"
            >
              Waiting...
            </div>
          </div>
          
          {/* Room Stats */}
          <RoomStatsPanel department={department} isLive={true}/>
          
          <ModelControlsPanel />
          
          {/* Hidden Variables for Three.js */}
          <div style={{ display: "none" }}>
            <span id="department">{department}</span>
            <span id="live">true</span>
          </div>

        </div>
      </div>
    </>
  );
}