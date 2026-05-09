"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "../../components/Navbar";
import RoomStatsPanel from "../../components/RoomStatsPanel";
import ModelControlsPanel from "../../components/ModelControlsPanel";
import { ChevronLeft, ChevronRight, Thermometer, Droplets, Lightbulb, Snowflake, User } from "lucide-react";
// 1. IMPORT SOCKET.IO
import { io } from "socket.io-client";
import DataBox from "@/components/DataBox";

declare global {
  interface Window {
    updateLiveAvatars?: (detections: any[]) => void;
  }
}

export default function LiveModel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [department, setDepartment] = useState("Loading...");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // IoT State
  const [sensorData, setSensorData] = useState({
    device_id: null,
    temperature: null,
    humidity: null,
    lights_state: null,
    ac_state: null
  });

  // YOLO Tracking State (For your 3D Avatars later!)
  const [liveDetections, setLiveDetections] = useState([]);
  const [roomCount, setRoomCount] = useState(0);

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

  // ==========================================
  // 2. THE WEBSOCKET CONNECTION
  // ==========================================
  useEffect(() => {
    // Change localhost to your Mac's IP on the presentation PC!
    const socket = io('http://localhost:1767');

    socket.on('connect', () => {
      console.log('✅ Connected to Flask WebSocket Server!');
    });

    // Listen for incoming IoT Data
    socket.on('iot_update', (data) => {
      console.log('🌡️ Live IoT Update:', data);
      setSensorData(data); // Instantly updates your UI dashboard
    });

    // Listen for incoming YOLO Detections
    socket.on('live_tracking_update', (data) => {
      console.log('🎥 Live YOLO Data:', data);
      
      // Update both states independently!
      if (data) {
        setRoomCount(data.room_count);
        setLiveDetections(data.detections || []); 
      
        if (window.updateLiveAvatars) {
          window.updateLiveAvatars(data.detections || []);
        }
      }
    });

    // Cleanup when user leaves the page
    return () => {
      socket.disconnect();
    };
  }, []);

  // ==========================================
  // 3. THREE.JS ENGINE BOOT
  // ==========================================
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
            
            <RoomStatsPanel 
              department={department} 
              isLive={true} 
              liveOccupancy={roomCount} 
              sensorData={sensorData}
            />
            
            <ModelControlsPanel isLive={true}/>
            
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