"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function FacilityHome() {
  const router = useRouter();
  const [time, setTime] = useState("");

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
          <h1>HU Digital Twin</h1>
        </div>
        <div style={{ flex: 2 }}> 
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly' }}>
            <button className="header selected" onClick={() => router.push('/facility_home')}>Home</button>
            <button className="header" onClick={() => router.push('/model')}>Model</button>
            <button className="header" onClick={() => router.push('/')}>Log Out</button>
          </div>
        </div>
      </div>

      <div className="header2">
        <span>Facilities Dashboard</span>
      </div>

      <div className="main-home scroll" style={{ maxHeight: 'calc(100vh - 10rem)', overflowY: 'auto' }}>
        <div className="row boxes">
          
          {/* Repeat this block for AC, Lights, and Temp just like your old HTML */}
          {['AC Alert', 'Lights Alert', 'Temperature Alert'].map((alertTitle, index) => (
            <div key={index} className="tracker-ui scroll outer box">
              <div className="row" style={{ marginTop: '0px !important' }}>
                <h2>{alertTitle}</h2>
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
                        {alertTitle === 'AC Alert' ? (
                            <span style={{ color: 'red', fontWeight: 'bold' }}>{alert.time}</span>
                        ) : (
                            <span>Status: <span style={{ color: 'red', fontWeight: 'bold' }}>Off</span></span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="row boxes">
          <div className="tracker-ui scroll outer box" style={{ width: '100%' }}>
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
                  <th style={{ width: '13%' }}>Temperature</th>
                  <th style={{ width: '13%' }}>AC Status</th>
                  <th style={{ width: '13%' }}>Light Status</th>
                </tr>
                <tr>
                  <td>C-007</td>
                  <td>Projects Lab</td>
                  <td><span className='fill' id="occ">??</span></td>
                  <td><span className='fill' id="temp">??</span></td>
                  <td><span className='fill' id="ac">??</span></td>
                  <td><span className='fill' id="lights">??</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}