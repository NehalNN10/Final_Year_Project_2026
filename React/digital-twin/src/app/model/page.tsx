"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "../../components/Navbar";
import RoomStatsPanel from "../../components/RoomStatsPanel";
import ModelControlsPanel from "../../components/ModelControlsPanel";


export default function DigitalTwinModel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [department, setDepartment] = useState("Loading...");

  useEffect(() => {
    async function fetchSession() {
      try {
        const response = await fetch('/api/session');
        const data = await response.json();
        setDepartment(data.department || "Guest");
      } catch (error) {
        console.error("Session fetch failed:", error);
        setDepartment("Security"); 
      }
    }
    fetchSession();
  }, []);

  useEffect(() => {
    if (department === "Loading..." || !containerRef.current) return;

    let destroyFn: () => void;
    
    import("../../lib/three/model.js").then((module) => {
      console.log("Three.js engine booting up...");
      module.initThreeEngine(containerRef.current!);
      destroyFn = module.destroyThreeEngine;
    });

    return () => {
      if (destroyFn) destroyFn();
    };
  }, [department]); 

  if (department === "Loading...") {
  return <div className="loading-screen">Loading Digital Twin...</div>;
}

return (
  <>
    <Navbar department={department} />

      <div className="main">
        
        {/* Model Container */}
        <div id="model-container" ref={containerRef}>
          <div className="crosshair"></div>
        </div>

        {/* Floating UI Panel */}
        <div className="scroll" id="float">
          
          {/* Room Stats */}
          <RoomStatsPanel department={department} />
          
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