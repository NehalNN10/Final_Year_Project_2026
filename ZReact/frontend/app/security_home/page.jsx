"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function SecurityHome() {
  const router = useRouter();
  const [time, setTime] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(interval);
  }, []);

  const alerts = [
    { room: "Soorty Lecture Hall - E-121", time: "37 mins" },
    { room: "Horizon Room 07 - H-507", time: "45 mins" },
    { room: "Arif Habib Classroom - C-109", time: "1 hr 45 mins" },
    { room: "Linux Lab - E-003", time: "22 mins" },
    { room: "W-243", time: "1 min" }
  ];

  return (
    <>
      <div className="main-nav">
        <div style={{ flex: 1 }}>
          <h1>HU Digital Twin </h1>
        </div>
        <div style={{ flex: 2 }}> 
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly' }}>
            <button className="header selected" onClick={() => router.push('/security_home')}>Home</button>
            <button className="header" onClick={() => router.push('/model')}>Model</button>
            <button className="header" onClick={() => router.push('/')}>Log Out</button>
          </div>
        </div>
      </div>

      <div className="header2">
        <span>Security Dashboard</span>
      </div>

      <div className="main-home scroll" style={{ maxHeight: 'calc(100vh - 10rem)', overflowY: 'auto' }}>
        <div className="row boxes">
          <div className="tracker-ui scroll outer box">
            <div className="row" style={{ marginTop: '0px !important' }}>
              <h2>Occupancy Alert</h2>
              <button 
                className="track-btn btn-send-emergency" 
                style={{ width: '20rem', height: '3rem' }} 
                onClick={() => setIsModalOpen(true)}
              > 
                <h2>Send Emergency Alert</h2>
              </button>
            </div>
            
            <div id="ac-alerts">
              {alerts.map((alert, i) => (
                <div key={i} className="tracker-ui">
                  <div className="row" style={{ marginTop: '0px !important' }}>
                    <div style={{ flex: 3 }}>
                      <div className="row" style={{ marginTop: '0px !important' }}>
                        <h4>{alert.room}</h4>
                      </div>
                      <div className="row">
                        <div className="row" style={{ flex: 2, marginTop: '0px' }}>
                          <span>Vacant</span>
                          <span>On</span>
                          <span>23 °C</span>
                        </div>
                        <div style={{ flex: 1 }}></div>
                      </div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'right' }}>
                      <span style={{ color: 'red', fontWeight: 'bold' }}>{alert.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="tracker-ui scroll outer" style={{ flex: 1, margin: '0 20px 0 0', overflowY: 'auto' }}>
            <div className="row" style={{ marginTop: '0px !important' }}>
                <h2>Rooms Real-Time Data</h2>
                <h2> ⏰ <span id="time">{time}</span></h2>
            </div>
            
            <table className="scroll" style={{ width: '100%', marginTop: '10px', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <th style={{ width: '8%' }}>Room ID</th>
                  <th style={{ width: '40%' }}>Room Name</th>
                  <th style={{ width: '13%' }}>Occupancy</th>
                </tr>
                <tr>
                  <td>C-007</td>
                  <td>Projects Lab</td>
                  <td><span className='fill' id="occ">??</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Emergency Modal */}
      {isModalOpen && (
        <div className="modal-overlay" id="emergencyModal" style={{ display: 'flex' }}>
          <div className="tracker-ui modal">
            <div className="modal-header">
              🚨 EMERGENCY ALERT 🚨
            </div>
            <p style={{ marginBottom: '20px' }}>Please provide details about the emergency situation:</p>
            <form id="emergencyForm" onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }}>
              <div className="row">
                <h4 htmlFor="roomNumber">Room Number</h4>
                <input type="text" id="roomNumber" name="roomNumber" required />
              </div>
              <div className="row">
                <h4 htmlFor="occupancy">Current Occupancy</h4>
                <input type="number" id="occupancy" name="occupancy" min="0" required />
              </div>
              <div className="row">
                <h4 htmlFor="description">Description</h4>
                <input type="text" id="description" name="description" required />
              </div>
              <div className="row">
                <button type="button" className="btn btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-send-emergency">Send Emergency Alert</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}