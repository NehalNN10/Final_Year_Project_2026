"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "../../components/Navbar";
import RoomStatsPanel from "../../components/RoomStatsPanel";
import ModelControlsPanel from "../../components/ModelControlsPanel";
import { ChevronLeft, ChevronRight, Thermometer, Droplets, Lightbulb, Snowflake } from "lucide-react";

export default function LiveModel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [department, setDepartment] = useState("Loading...");

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [sensorData, setSensorData] = useState({
    device_id: null,
    temperature: null,
    humidity: null,
    lights_state: null,
    ac_state: null
  })

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

  // for fetching live sensor data
  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        // Change this URL to your actual Flask server IP/Port
        const response = await fetch('http://10.20.3.245:1767/api/live_sensor_data');
        if (response.ok) {
          const data = await response.json();
          setSensorData(data);
        }
      } catch (error) {
        console.error("Failed to fetch IoT data:", error);
      }
    };

    // Fetch immediately, then set an interval to fetch every 2 seconds
    fetchSensorData();
    const intervalId = setInterval(fetchSensorData, 2000);

    return () => clearInterval(intervalId); // Cleanup when user leaves page
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
            
      <div className={`float ${isSidebarOpen ? "float-width" : "w-0"}`}>
        <div className="w-full h-full overflow-hidden relative">
          
          <div className="h-full overflow-y-auto overflow-x-hidden p-5 pr-0! float-width">
            <div className="mb-4 bg-[#222] p-4 rounded-xl shadow-lg border border-[#444]">
              <h3 className="text-white text-lg font-semibold mb-3 flex items-center gap-2">
                Live IoT Feed
              </h3>
              
              <div className="grid grid-cols-2 gap-3 text-white">
                <div className="bg-[#333] p-3 rounded-lg flex flex-col items-center justify-center">
                  <span className="text-gray-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1"><Thermometer size={14}/> Temp</span>
                  <span className="text-2xl font-bold">{sensorData.temperature}°</span>
                </div>
                
                <div className="bg-[#333] p-3 rounded-lg flex flex-col items-center justify-center">
                  <span className="text-gray-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1"><Droplets size={14}/> Humidity</span>
                  <span className="text-2xl font-bold">{sensorData.humidity}%</span>
                </div>

                <div className={`p-3 rounded-lg flex flex-col items-center justify-center transition-colors ${sensorData.lights_state === 'ON' ? 'bg-yellow-900/40 text-yellow-400 border border-yellow-800' : 'bg-[#333] text-white'}`}>
                  <span className="text-gray-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1"><Lightbulb size={14}/> Lights</span>
                  <span className="text-xl font-bold">{sensorData.lights_state}</span>
                </div>

                <div className={`p-3 rounded-lg flex flex-col items-center justify-center transition-colors ${sensorData.ac_state === 'ON' ? 'bg-cyan-900/40 text-cyan-400 border border-cyan-800' : 'bg-[#333] text-white'}`}>
                  <span className="text-gray-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1"><Snowflake size={14}/> AC Unit</span>
                  <span className="text-xl font-bold">{sensorData.ac_state}</span>
                </div>
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
          className="sidebar-toggle"
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