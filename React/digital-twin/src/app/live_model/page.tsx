"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "../../components/Navbar";
import RoomStatsPanel from "../../components/RoomStatsPanel";
import ModelControlsPanel from "../../components/ModelControlsPanel";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function LiveModel() {
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

    <div className="main flex w-full" style={{ height: 'calc(100vh - 4.5rem)' }}>
            
      <div className={`float ${isSidebarOpen ? "w-[max(17rem,25vw)]" : "w-0"}`}>
        <div className="w-full h-full overflow-hidden relative">
          
          <div className="h-full overflow-y-auto overflow-x-hidden p-5 w-[max(17rem, 25vw)]">
            <div className="flex justify-center mb-4!">
              <div 
                id="data-status" 
                className="bg-[#555] fill shadow-lg transition-all duration-300 w-full text-center text-3xl p-4! rounded-xl!"
              >
                Waiting...
              </div>
            </div>
            
            {/* Room Stats */}
            <RoomStatsPanel department={department} isLive={true}/>
            
            <ModelControlsPanel isReplay = {true}/>
            
            {/* Hidden Variables for Three.js */}
            <div style={{ display: "none" }}>
              <span id="department">{department}</span>
              <span id="live">true</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-4 -right-7 z-50 bg-[#131313] text-[#00ff88] py-3 px-1 rounded-r-lg transition-colors shadow-[5px_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center cursor-pointer"
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