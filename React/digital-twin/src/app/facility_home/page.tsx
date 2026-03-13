"use client";

import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import StaffList from "../../components/StaffList";
import FormRow from "../../components/FormRow";


export default function FacilityHome() {
  // --- States ---
  const [roomsData, setRoomsData] = useState<any[]>([]);
  const [currentRole, setCurrentRole] = useState("Facilities Admin");
  const [isEmergencyModalOpen, setEmergencyModalOpen] = useState(false);

  const [staffList, setStaffList] = useState<any[]>([]);
  
  const [emergencyForm, setEmergencyForm] = useState({ roomNumber: "", alertType: "AC", timeSince: "", description: "" });
  const [currentRoomStats, setCurrentRoomStats] = useState<any>({});
  const [currentTimeSpan, setCurrentTimeSpan] = useState("Loading Time...");
  
  const LOOP_DURATION = 900;

  // --- Initial Data Fetch ---
  useEffect(() => {
    fetch("/api/facility_home_data")
      .then((res) => res.json())
      .then((data) => {
        setRoomsData(data.rooms || []);
        setStaffList(data.staff_list || []);
        
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
          newStats[room.room_id] = { occupancy: "--", temperature: "--", ac: null, lights: null };
        }
      });
      setCurrentRoomStats(newStats);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [roomsData]);

  // --- Handlers ---
  const handleEmergencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/send_facilities_alert', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        room_number: emergencyForm.roomNumber, 
        alert_type: emergencyForm.alertType,
        time_since: emergencyForm.timeSince,
        description: emergencyForm.description 
      })
    });
    
    if (res.ok) {
      alert('Facilities alert sent!');
      setEmergencyModalOpen(false);
      setEmergencyForm({ roomNumber: "", alertType: "AC", timeSince: "", description: "" });
    } else {
      alert('Error sending alert.');
    }
  };

  // Helper function for your temperature color logic
  const getTempColor = (t: any) => {
    if (t === "--" || t === undefined) return "#ffffff";
    if (t <= 19) return "#0088ff";
    if (t <= 22) return "#00ffff";
    if (t <= 27) return "#00ff88";
    if (t <= 30) return "#ff8800";
    return "#ff0000";
  };

  // --- UI Render ---
  return (
    <div className="min-h-screen bg-[#131313] text-white">
      <Navbar department="Facilities" />

      {/* Side Nav */}
      <div className="side-nav row mt-0! text-black">
        <span>Facilities Dashboard</span>
        {currentRole === 'Facilities Admin' && (
          <button className="btn btn-red btn-auto m-0! py-1!" onClick={() => setEmergencyModalOpen(true)}>
            <h2 className="m-0! font-bold text-white text-xl">Send Alert</h2>
          </button>
        )}
      </div>

      <div className="main-home scroll">
        
        {/* Top Alerts Row */}
        <div className="row boxes">
          <div className="tracker-ui scroll outer box min-w-70">
            <h3 className="font-bold">AC Alerts</h3>
            <div className="tracker-ui mt-4 p-4 text-gray-400 text-center">No active alerts.</div>
          </div>
          <div className="tracker-ui scroll outer box min-w-70">
            <h3 className="font-bold">Lights Alerts</h3>
            <div className="tracker-ui mt-4 p-4 text-gray-400 text-center">No active alerts.</div>
          </div>
          <div className="tracker-ui scroll outer box min-w-70">
            <h3 className="font-bold">Temperature Alerts</h3>
            <div className="tracker-ui mt-4 p-4 text-gray-400 text-center">No active alerts.</div>
          </div>

            {/* Real-Time Data Table */}
            <div className="tracker-ui scroll outer box min-w-220">
                <div className="row mt-0! font-bold">
                <h3 className="flex-2">Rooms Real-Time Data</h3>
                <h3 className="flex-1 text-right"> ⏰ <span>{currentTimeSpan}</span></h3>
                </div>
                
                <table className="scroll table w-full mt-4">
                <thead>
                    <tr>
                    <th style={{width:'15%'}}>ID</th>
                    <th style={{width:'33%'}}>Room Name</th>
                    <th style={{width:'13%'}}>Occupancy</th>
                    <th style={{width:'13%'}}>Temperature</th>
                    <th style={{width:'13%'}}>AC</th>
                    <th style={{width:'13%'}}>Lights</th>
                    </tr>
                </thead>
                <tbody>
                    {roomsData.map(room => {
                    // Fallback to our dummy missing-data object if stats aren't loaded yet
                    const stats = currentRoomStats[room.room_id] || { occupancy: "--", temperature: "--", ac: null, lights: null };
                    
                    // 1. Determine if we actually have data for this room
                    const hasData = stats.occupancy !== "--";

                    // 2. Set Text and Colors based on data availability
                    const occText = hasData ? (stats.occupancy > 0 ? "Occupied" : "Vacant") : "--";
                    const occColor = hasData ? (stats.occupancy > 0 ? "#ff4444" : "#00ff88") : "#ffffff"; // White if missing
                    
                    const tempText = hasData ? `${stats.temperature} °C` : "--";
                    const tempColor = getTempColor(stats.temperature); // getTempColor already handles "--"
                    
                    const acText = stats.ac !== null ? (stats.ac ? "• ON" : "- OFF") : "--";
                    const acColor = stats.ac !== null ? (stats.ac ? "#00ff88" : "#ff4444") : "#ffffff";
                    
                    const lightsText = stats.lights !== null ? (stats.lights ? "• ON" : "- OFF") : "--";
                    const lightsColor = stats.lights !== null ? (stats.lights ? "#00ff88" : "#ff4444") : "#ffffff";

                    return (
                        <tr key={room.id}>
                        <td>{room.room_id}</td>
                        <td>{room.name}</td>
                        <td><span className="fill" style={{ backgroundColor: occColor }}>{occText}</span></td>
                        <td><span className="fill" style={{ backgroundColor: tempColor }}>{tempText}</span></td>
                        <td><span className="fill" style={{ backgroundColor: acColor }}>{acText}</span></td>
                        <td><span className="fill" style={{ backgroundColor: lightsColor }}>{lightsText}</span></td>
                        </tr>
                    );
                    })}
                </tbody>
                </table>
            </div>
          {/* Column 3: Staff List */}
          {currentRole === 'Facilities Admin' && (
            <StaffList 
              staffList={staffList}
              department="Facilities"
            />
          )}
        </div>
      </div>

      {/* EMERGENCY MODAL */}
      {isEmergencyModalOpen && (
        <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && setEmergencyModalOpen(false)}>
          <div className="tracker-ui modal text-white">
            <div className="modal-header p-4 text-3xl text-[#f33]">🚨 FACILITIES ALERT 🚨</div>
            <p className="text-xl mb-4">Please provide details about the situation:</p>
            
            <form onSubmit={handleEmergencySubmit}>
              
              <FormRow label="Room Number" value={emergencyForm.roomNumber} onChange={e => setEmergencyForm({...emergencyForm, roomNumber: e.target.value})} />
              
              <FormRow label="Alert Type">
                <select className="formInput" required value={emergencyForm.alertType} onChange={e => setEmergencyForm({...emergencyForm, alertType: e.target.value})}>
                  <option value="AC">AC</option><option value="Lights">Lights</option><option value="Temperature">Temperature</option>
                </select>
              </FormRow>
              
              <FormRow label="Time Since (mins)">
                <input type="number" min="0" className="formInput" required value={emergencyForm.timeSince} onChange={e => setEmergencyForm({...emergencyForm, timeSince: e.target.value})} />
              </FormRow>
              
              <FormRow label="Description" value={emergencyForm.description} onChange={e => setEmergencyForm({...emergencyForm, description: e.target.value})} />
              
              <div className="row mt-4! justify-center!">
                <button type="button" className="btn btn-auto" onClick={() => setEmergencyModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-red btn-auto">Send Alert</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}