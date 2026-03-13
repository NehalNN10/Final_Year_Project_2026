"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "../../components/Navbar";
import RoomStatsPanel from "../../components/RoomStatsPanel";
import ModelControlsPanel from "../../components/ModelControlsPanel";
import SimulationControlsPanel from "../../components/SimulationControlsPanel";

export default function ModelReplay() {
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
      console.log("Three.js engine booting in REPLAY mode...");
      module.initThreeEngine(containerRef.current!);
      destroyFn = module.destroyThreeEngine;
    });

    return () => {
      if (destroyFn) destroyFn();
    };
  }, [department]); 

  if (department === "Loading...") {
    return <div className="loading-screen text-white bg-[#131313] h-screen flex justify-center items-center">Loading Replay...</div>;
  }

  return (
    <>
      <Navbar department={department} />

      <div className="main flex w-full" style={{ height: 'calc(100vh - 70px)' }}>
        
        {/* Replay Sidebar (Using your id="top-left" from style.css!) */}
        <div className="scroll" id="float">
          
          <RoomStatsPanel department={department} />
          
          <SimulationControlsPanel />
          
          <ModelControlsPanel isReplay={true} />
          
          {/* Hidden Variables for Three.js */}
          <div style={{ display: "none" }}>
            <span id="department">{department}</span>
            <span id="live">false</span>
          </div>

        </div>

        {/* Model Container */}
        <div id="model-container" ref={containerRef}>
          <div className="crosshair"></div>
        </div>

      </div>
    </>
  );
}