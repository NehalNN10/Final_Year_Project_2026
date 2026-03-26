"use client";

import { useState, useEffect } from "react";
import { Clock, Users, Thermometer, Wind, Lightbulb, LightbulbOff, Check, X, User, UserMinus, AirVent } from "lucide-react";
import Navbar from "../../components/Navbar";
import StaffList from "../../components/StaffList";
import FormRow from "../../components/FormRow";
import StatRow from "@/components/StatRow";
import { statSync } from "fs";


export default function Dashboard() {
  // --- States ---
  const [roomsData, setRoomsData] = useState<any[]>([]);
  const [currentRole, setCurrentRole] = useState("Facilities Officer");
  const [name, setName] = useState("");
  const [isEmergencyModalOpen, setEmergencyModalOpen] = useState(false);

  const [facilityStaff, setFacilityStaff] = useState<any[]>([]);

  const [securityStaffList, setSecurityStaffList] = useState<any[]>([]);
  const [securityStaffRooms, setSecurityStaffRooms] = useState<any>({});
  
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
        setFacilityStaff(data.staff_list || []);
        
        if (data.current_role) setCurrentRole(data.current_role);
        if (data.name) setName(data.name);
      })
      .catch(err => console.error("Error fetching data:", err));
  }, []);

  useEffect(() => {
      fetch("/api/security_home_data")
        .then((res) => res.json())
        .then((data) => {
          setSecurityStaffList(data.staff_list || []);
          setSecurityStaffRooms(data.staff_rooms || {});
          setRoomsData(data.rooms || []);
          if (data.current_role) setCurrentRole(data.current_role);
          if (data.name) setName(data.name);
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
    const res = await fetch('/api/send_facilities_alert', {
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

      <div className="side-nav row mt-0! text-black">
        <span>Facilities Dashboard</span>
      </div>

      <div className="main-home scroll">
        <div className="row px-5">
          <div className="">
            <h2 className="font-bold">Welcome, {name}!</h2>
            <p className="text-gray-400">Security data and metrics will be displayed here.</p>
          </div>
          {currentRole === 'Facilities Admin' && (
            <button className="btn btn-red btn-auto m-0! py-1!" onClick={() => setEmergencyModalOpen(true)}>
            <h2 className="m-0! font-bold text-white text-xl">Send Alert</h2>
          </button>
          )}
        </div>
        
        {/* Top Alerts Row */}
        <div className="row boxes">
          <div className="tracker-ui scroll outer box basis-70">
            <h3 className="font-bold">AC Alerts</h3>
            <div className="tracker-ui mt-4 p-4 text-gray-400 text-center">No active alerts.</div>
          </div>
          <div className="tracker-ui scroll outer box basis-70">
            <h3 className="font-bold">Lights Alerts</h3>
            <div className="tracker-ui mt-4 p-4 text-gray-400 text-center">No active alerts.</div>
          </div>
          <div className="tracker-ui scroll outer box basis-70">
            <h3 className="font-bold">Temperature Alerts</h3>
            <div className="tracker-ui mt-4 p-4 text-gray-400 text-center">No active alerts.</div>
          </div>
          <div className="tracker-ui scroll outer box basis-70">
            <h3 className="font-bold">Occupancy Alerts</h3>
            {/* Dynamic Alerts will map here later */}
            <div className="tracker-ui mt-4 p-4 text-gray-400 text-center">
              No active alerts.
            </div>
          </div>
        </div>

        {/* Real-Time Data Table */}
        <div className="tracker-ui outer box basis-220 overflow-hidden flex flex-col mx-5!">
          <h3 className="row mt-0! font-bold shrink-0">
            <span className="flex-2">Rooms Real-Time Data</span>
            <StatRow icon={Clock} label={currentTimeSpan} size="32"/>
          </h3>
          <div className="w-full overflow-x-auto mt-4 pb-2">
            <table className="table w-full border-separate border-spacing-0 whitespace-nowrap">
              <thead>
                <tr>
                  <th className="w-[1%] sticky left-0 z-20 bg-black shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                    ID
                  </th>
                  
                  <th className="hidden min-[43rem]:table-cell w-full text-left">
                    Room Name
                  </th>
                  
                  <th className="text-center!">
                    <span className="iot">Occupancy</span>
                    <Users size={24} className="th-small-iot" />
                  </th>
                  <th className="text-center!">
                    <span className="iot">Temperature</span>
                    <Thermometer size={24} className="th-small-iot" />
                  </th>
                  <th className="text-center!">
                    <span className="iot">AC</span>
                    <AirVent size={24} className="th-small-iot" />
                  </th>
                  <th className="text-center!">
                    <span className="iot">Lights</span>
                    <Lightbulb size={24} className="th-small-iot" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {roomsData.map(room => {
                  const stats = currentRoomStats[room.room_id] || { occupancy: "--", temperature: "--", ac: null, lights: null };
                  const hasData = stats.occupancy !== "--";

                  const count = stats.occupancy;
                  const bgColor = count > room.max_occupancy ? "#ff4444" : (count !== "--" && count !== 0) ? "#00ff88" : "#ffffff";
                  
                  const isAcOn = stats.ac;
                  const acColor = stats.ac !== null ? (isAcOn ? "#00ff88" : "#ff4444") : "#ffffff";
                  
                  const isLightsOn = stats.lights;
                  const lightsColor = stats.lights !== null ? (isLightsOn ? "#00ff88" : "#ff4444") : "#ffffff";

                  const tempText = hasData ? `${stats.temperature} °C` : "--";
                  const tempTextSmall = hasData ? `${Math.round(stats.temperature)}°` : "--";
                  const tempColor = getTempColor(stats.temperature);

                  return (
                    <tr key={room.id}>
                      {/* 5. Matches the w-[1%] from the header */}
                      <td className="w-[1%] sticky left-0 z-10 bg-black font-bold shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                        {room.room_id}
                      </td>
                      <td className="hidden min-[43rem]:table-cell">{room.name}</td>
                      <td className="text-center!">
                        <span className="fill small-iot" style={{ backgroundColor: bgColor }}>
                          {count ?? "??"}
                        </span>
                      </td>
                      <td className="text-center!">
                        <span className="fill small-iot" style={{ backgroundColor: tempColor }}>
                          {hasData ? (
                            <>
                              <span className="small">{tempTextSmall}</span>
                              <span className="iot">{tempText}</span>
                            </>
                          ) : "--"}
                        </span>
                      </td>
                      <td className="text-center!">
                        <span className="fill small-iot" style={{ backgroundColor: acColor }}>
                          {stats.ac !== null ? (
                            <>
                              <span className="small">{isAcOn ? <Wind size={24} className="animate-pulse"/> : <X size={24}/>}</span>
                              <span className="iot">{isAcOn ? "• ON" : "- OFF"}</span>
                            </>
                          ) : "--"}
                        </span>
                      </td>
                      <td className="text-center!">
                        <span className="fill small-iot" style={{ backgroundColor: lightsColor }}>
                          {stats.lights !== null ? (
                            <>
                              <span className="small">{isLightsOn ? <Lightbulb size={24}/> : <LightbulbOff size={24}/>}</span>
                              <span className="iot">{isLightsOn ? "• ON" : "- OFF"}</span>
                            </>
                          ) : "--"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="row boxes">
          <StaffList 
            staffList={securityStaffList}
            staffRooms={securityStaffRooms}
            department="Security"
          />
          <StaffList 
            staffList={facilityStaff}
            department="Facilities"
          />
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
                <button type="button" className="btn btn-green btn-auto" onClick={() => setEmergencyModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-red btn-auto">Send Alert</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}