"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "../../components/Navbar";
import RoomStatsPanel from "../../components/RoomStatsPanel";
import ModelControlsPanel from "../../components/ModelControlsPanel";
import { AirVent, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Lightbulb, UserMinus, UserPlus, Bomb, BrushCleaning, User } from "lucide-react";

export default function SandboxModel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(true);
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

    let sandboxApp: any;
    
    import("../../lib/three/sandbox.js").then((module) => {
      console.log("Booting up OOP Sandbox Engine...");
      sandboxApp = new module.SandboxEngine(containerRef.current!);
      window.sandboxAPI = sandboxApp.simulation;
      sandboxApp.init();
    });

    return () => {
      if (sandboxApp) sandboxApp.destroy();
      delete window.sandboxAPI;
    };
  }, [department]);

  // Handlers
  const handleSpawn = () => window.sandboxAPI?.spawnPerson();
  const handleRemove = () => window.sandboxAPI?.removePerson();
  const handleRemoveAll = () => window.sandboxAPI?.removeAll();
  const handleRemoveAllRoom = () => window.sandboxAPI?.removeAllRoom();

  const onChangeTempText = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseFloat(e.target.value);
    if (isNaN(val)) return;

    const tempSlider = document.getElementById('temp-scrubber') as HTMLInputElement | null;
    if (val < 15) val = 15;
    if (val > 35) val = 35;

    window.sandboxAPI?.changeTemp(val);
    if (tempSlider) tempSlider.value = val.toString();
  };

  // 2. These now just tell the engine to flip whatever room we are looking at!
  const handleToggleOccu = () => window.sandboxAPI?.toggleOccu();
  const handleToggleLights = () => window.sandboxAPI?.toggleLights();
  const handleToggleAC = () => window.sandboxAPI?.toggleAC();

  if (department === "Loading...") {
    return <div className="loading-screen text-white text-center mt-20">Loading Sandbox...</div>;
  }

  return (
    <>
      <Navbar department={department} />

      <div className="main flex h-[calc(100vh-4.5rem)] relative overflow-hidden">

        <div className={`float ${isSidebarOpen ? "w-[max(17rem,25vw)]" : "w-0"}`}>
          <div className="w-full h-full overflow-hidden relative">
            
            <div className="h-full overflow-y-auto overflow-x-hidden p-5 w-[max(17rem, 25vw)]">
              <RoomStatsPanel department={department} />

              <div className="tracker-ui outer p-4!">
                <div className="header cursor-pointer select-none" onClick={() => setIsExpanded(!isExpanded)}>
                  <h3 className="font-bold">Sandbox Controls</h3>
                  <div className="ml-2">
                    {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </div>
                </div>  
                
                <div className={`content-expand ${isExpanded ? "expanded" : "collapsed"}`}>
                  <div className="content">
                    {department !== "Facilities" && (
                    <>
                      <div className="row flex-wrap gap-5 mt-4!">
                        <button onClick={handleSpawn} className="btn btn-green m-0! flex-1">
                          <UserPlus size={20} /> <span className="ml-2">Spawn</span>
                        </button>
                        <button onClick={handleRemove} className="btn btn-red m-0! flex-1">
                          <UserMinus size={20} /> <span className="ml-2">Remove</span>
                        </button>
                      </div>
                      <div className="row flex-wrap gap-5 mt-4!">
                        <button onClick={handleRemoveAll} className="btn btn-red m-0! flex-1">
                          <Bomb size={20} /> <span className="ml-2">Clear All</span>
                        </button>
                        <button onClick={handleRemoveAllRoom} className="btn btn-red m-0! flex-1">
                          <BrushCleaning size={20} /> <span className="ml-2">Clear Room</span>
                        </button>
                      </div>
                    </>
                    )}

                    {department === "Facilities" && (
                      <div className="row flex-wrap gap-5 mt-4!">
                        <button id="sandbox-btn-occu" onClick={handleToggleOccu} className={`btn btn-red m-0! flex-1!`}>
                          <User size={20} /> <span className="ml-2">Toggle Occupancy</span>
                        </button>
                      </div>
                    )}

                    {department !== "Security" && (
                    <>
                      <div className="flex flex-wrap items-center my-3 border-t border-t-[#888] mt-4! py-4! text-[#ccc]">
                        <div className="w-10 text-left pr-2">Temp</div>
                        <div className="flex-1 flex items-center justify-end h-5">
                          <input 
                            type="range" min="15" max="35" step="0.1" defaultValue="25" id="temp-scrubber"
                            className="scrubber"
                            onChange={(e) => {
                              window.sandboxAPI?.changeTemp(e.target.value);
                              const textEl = document.getElementById('temp-text') as HTMLInputElement;
                              if (textEl) textEl.value = e.target.value;
                            }} 
                          />
                          <input 
                            id="temp-text"
                            type="text" 
                            defaultValue="25"
                            className="scrubber-text"
                            onChange={onChangeTempText} 
                          />      
                        </div>
                      </div>

                      <div className="row gap-5">
                        <button id="sandbox-btn-ac" onClick={handleToggleAC} className={`btn btn-red m-0! flex-1!`}>
                          <AirVent size={20} /> <span className="ml-2">AC</span>
                        </button>
                        <button id="sandbox-btn-lights" onClick={handleToggleLights} className={`btn btn-red m-0! flex-1!`}>
                          <Lightbulb size={20} /> <span className="ml-2">Lights</span>
                        </button>
                      </div>
                    </>
                    )}
                  </div>
                </div>
              </div>

              <ModelControlsPanel isReplay={true}/>
              
              <div style={{ display: "none" }}>
                <span id="department">{department}</span>
                <span id="live">false</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute top-4 -right-9 z-50 bg-[#131313] border border-l-0 border-[#00ff88]/50 hover:border-[#00ff88] text-[#00ff88] py-3 px-1 rounded-r-lg transition-colors shadow-[5px_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center cursor-pointer"
            title="Toggle Sidebar"
          >
            {isSidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
          </button>
        </div>
        
        <div id="model-container" ref={containerRef} className="flex-1 w-full h-full relative overflow-hidden bg-black/50">
          <div className="crosshair"></div>
        </div>
      </div>
    </>
  );
}