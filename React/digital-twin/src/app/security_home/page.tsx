"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import StatRow from "@/components/StatRow";
import Navbar from "../../components/Navbar";
import StaffList from "../../components/StaffList";
import FormRow from "../../components/FormRow";

export default function SecurityHome() {
  // --- States ---
  const [staffList, setStaffList] = useState<any[]>([]);
  const [staffRooms, setStaffRooms] = useState<any>({});
  const [roomsData, setRoomsData] = useState<any[]>([]);
  const [currentRole, setCurrentRole] = useState("Security Admin");
  
  const [currentRoomStats, setCurrentRoomStats] = useState<any>({});
  const [currentTimeSpan, setCurrentTimeSpan] = useState("...");
  
  const LOOP_DURATION = 900;

  // --- Initial Data Fetch ---
  useEffect(() => {
    fetch("/api/security_home_data")
      .then((res) => res.json())
      .then((data) => {
        setStaffList(data.staff_list || []);
        setStaffRooms(data.staff_rooms || {});
        setRoomsData(data.rooms || []);
        if (data.current_role) setCurrentRole(data.current_role);
      })
      .catch(err => console.error("Error fetching data:", err));
  }, []);

  // --- Real-Time Simulation Loop ---
  useEffect(() => {
    if (roomsData.length === 0) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const currentFrame = Math.floor(now.getTime() / 1000) % LOOP_DURATION;
      
      const cycleStartTime = new Date(now.getTime() - (currentFrame * 1000));
      setCurrentTimeSpan(new Date(cycleStartTime.getTime() + (currentFrame * 1000)).toLocaleTimeString());

      const newStats: any = {};
      roomsData.forEach(room => {
        if (room.timeseries?.length > 0) {
          newStats[room.room_id] = room.timeseries.find((e: any) => e.time === currentFrame) 
            || [...room.timeseries].reverse().find((e: any) => e.time <= currentFrame) 
            || room.timeseries[0];
        } else {
          newStats[room.room_id] = { occupancy: "--", temperature: "--" };
        }
      });
      setCurrentRoomStats(newStats);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [roomsData]);

  const handleSendAllAlerts = async () => {
    // Failsafe to prevent accidental clicks
    if (!window.confirm("🚨 Are you sure you want to trigger a campus-wide emergency alert for ALL rooms")) return;

    try {
      // Create an array of fetch promises for every room
      const alertPromises = roomsData.map(room => {
        // Grab the live occupancy at this exact second
        const liveStats = currentRoomStats[room.room_id] || {};
        const currentOccupancy = liveStats.occupancy !== "--" ? liveStats.occupancy : 0;

        return fetch('/api/send_emergency_alert', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            room_number: room.room_id, 
            occupancy_count: currentOccupancy
          })
        });
      });

      // Fire them all off at the same time
      await Promise.all(alertPromises);
      alert('✅ Mass emergency alerts successfully sent to all rooms!');

    } catch (error) {
      console.error("Error sending mass alerts:", error);
      alert('❌ Error sending alerts. Check the console.'); 
    }
  };

  // --- UI Render ---
  return (
    <div className="min-h-screen bg-[#131313] text-white">
      <Navbar department="Security" />

      {/* Side Nav */}
      <div className="side-nav row mt-0! text-black">
        <span>Security Dashboard</span>
        {currentRole === 'Security Admin' && (
          <button className="btn btn-red btn-auto m-0! py-1!" onClick={handleSendAllAlerts}>
            <h2 className="font-bold text-white text-xl">Create Emergency</h2>
          </button>
        )}
      </div>

      <div className="main-home scroll">
        <div className="row boxes">
          
          {/* Column 1: Alerts */}
          <div className="tracker-ui scroll outer box basis-70">
            <h3 className="font-bold">Occupancy Alerts</h3>
            {/* Dynamic Alerts will map here later */}
            <div className="tracker-ui mt-4 p-4 text-gray-400 text-center">
              No active alerts.
            </div>
          </div>

          {/* Column 2: Rooms Table */}
          <div className="tracker-ui scroll outer box basis-120">
            <h3 className="row mt-0! font-bold shrink-0">
              <span className="flex-2">Rooms Real-Time Data</span>
              <StatRow icon={Clock} label={currentTimeSpan} size="32"/>
            </h3>
            <div className="w-full overflow-x-auto mt-4 pb-2">
              <table className="scroll table w-full mt-4">
                <thead>
                  <tr><th style={{width:'22%'}}>ID</th><th style={{width:'40%'}}>Name</th><th style={{width:'13%'}}>Occupancy</th></tr>
                </thead>
                <tbody>
                  {roomsData.map(room => {
                    const count = currentRoomStats[room.room_id]?.occupancy;
                    const bgColor = count > room.max_occupancy ? "#ff4444" : (count !== "--" && count !== 0) ? "#00ff88" : "#ffffff";
                    return (
                      <tr key={room.id}>
                        <td>{room.room_id}</td><td>{room.name}</td>
                        <td><span className="fill" style={{ backgroundColor: bgColor }}>{count ?? "??"}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Column 3: Staff List */}
          {currentRole === 'Security Admin' && (
            <StaffList 
              staffList={staffList}
              staffRooms={staffRooms}
              department="Security"
            />
          )}
        </div>
      </div>
    </div>
  );
}