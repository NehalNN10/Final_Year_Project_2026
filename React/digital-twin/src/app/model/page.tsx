"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "../../components/Navbar";
import RoomStatsPanel from "../../components/RoomStatsPanel";
import ModelControlsPanel from "../../components/ModelControlsPanel";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function DigitalTwinModel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [department, setDepartment] = useState("Loading...");

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

      <div className="main flex w-full" style={{ height: 'calc(100vh - 4.5rem)' }}>
        
        <div className={`float ${isSidebarOpen ? "w-[max(17rem,25vw)]" : "w-0"}`}>
          <div className="w-full h-full overflow-hidden relative">
            
            <div className="h-full overflow-y-auto overflow-x-hidden p-5 w-[max(17rem, 25vw)]">
              <RoomStatsPanel department={department} />
              
              <ModelControlsPanel />
              
              <div style={{ display: "none" }}>
                <span id="department">{department}</span>
                <span id="live">true</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute top-4 -right-8 z-50 bg-[#131313] text-[#00ff88] py-3 px-1 rounded-r-lg transition-colors shadow-[5px_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center cursor-pointer"
            title="Toggle Sidebar"
          >
            {isSidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
          </button>
        </div>

        <div id="model-container" ref={containerRef}>
          <div className="crosshair"></div>
        </div>

      </div>
    </>
  );
}