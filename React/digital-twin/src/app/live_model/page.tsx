"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "../../components/Navbar";
import RoomStatsPanel from "../../components/RoomStatsPanel";
import ModelControlsPanel from "../../components/ModelControlsPanel";
// 🌟 Added AlertTriangle to imports
import { ChevronLeft, ChevronRight, Thermometer, Droplets, Lightbulb, Snowflake, User, AlertTriangle } from "lucide-react";
// 1. IMPORT SOCKET.IO
import { io } from "socket.io-client";
import DataBox from "@/components/DataBox";
// 🌟 Import IntButton for the emergency trigger
import IntButton from "@/components/IntButton";

declare global {
  interface Window {
    updateLiveAvatars?: (detections: any[], roomCount: number) => void;
    updateLiveSensorData?: (sensorData: any) => void;
  }
}

export default function LiveModel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [department, setDepartment] = useState("Loading...");
  const [role, setRole] = useState("Loading..."); // 🌟 Added Role state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // IoT State
  const [sensorData, setSensorData] = useState({
    device_id: null,
    temperature: null,
    humidity: null,
    lights_state: null,
    ac_state: null
  });

  // YOLO Tracking State
  const [liveDetections, setLiveDetections] = useState([]);
  const [roomCount, setRoomCount] = useState(0);

  useEffect(() => {
    async function fetchSession() {
      try {
        const response = await fetch('/api/session');
        const data = await response.json();
        setDepartment(data.department || "Guest");
        setRole(data.role || "Guest"); // 🌟 Fetch the role
      } catch (error) {
        setDepartment("Security"); 
      }
    }
    fetchSession();
  }, []);

  // ==========================================
  // 🌟 EMERGENCY ALERT LOGIC
  // ==========================================
  const handleEmergencyAlert = async () => {
    if (!window.confirm("🚨 Are you sure you want to trigger an emergency alert for this live room?")) return;

    try {
      await fetch('/api/send_emergency_alert', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          // Use the ESP32 ID if available, otherwise fallback to a generic name
          room_number: sensorData.device_id || "Live_Room", 
          occupancy_count: roomCount
        })
      });
      alert('✅ Emergency alert successfully sent for the live room!');
    } catch (error) {
      console.error("Error sending alert:", error);
      alert('❌ Error sending alert. Check the console.'); 
    }
  };

  // ==========================================
  // 2. THE WEBSOCKET CONNECTION
  // ==========================================
  useEffect(() => {
    const socket = io('http://localhost:1767');

    socket.on('connect', () => {
      console.log('✅ Connected to Flask WebSocket Server!');
    });

    socket.on('iot_update', (data) => {
      console.log('🌡️ Live IoT Update:', data);
      setSensorData(data); 
      
      if (window.updateLiveSensorData) {
        window.updateLiveSensorData(data);
      }
    });

    socket.on('live_tracking_update', (data) => {
      console.log('🎥 Live YOLO Data:', data);
      
      if (data) {
        setRoomCount(data.room_count);
        setLiveDetections(data.detections || []); 
      
        if (window.updateLiveAvatars) {
          window.updateLiveAvatars(data.detections || [], data.room_count);
        }
      }
    });

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
            
            {/* 🌟 EMERGENCY ALERT BUTTON (Now visible to everyone!) */}
            <div className="mb-4">
              <IntButton 
                icon={AlertTriangle} 
                label="Create Emergency" 
                onClick={handleEmergencyAlert} 
                classes="btn btn-red btn-auto m-0! py-2! text-xl w-full flex justify-center" 
                size="24" 
              />
            </div>

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