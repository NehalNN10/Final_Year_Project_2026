"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (userId === "facility") router.push("/facility_home");
    else if (userId === "security") router.push("/security_home");
    else if (userId === "admin") router.push("/dashboard");
    else setError("Invalid credentials.");
  };

  return (
    <div className="tracker-ui" style={{ textAlign: 'center', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '2rem' }}>
      <div className="row">
          <h1>Welcome To HU Digital Twin</h1>
      </div>
      
      {error && (
        <div className="row">
            <div className="error-message" style={{ color: 'red', fontSize: '1.2rem', marginTop: '10px' }}>{error}</div>
        </div>
      )}
        
      <form onSubmit={handleLogin}>
          <div className="row" style={{ marginTop: '20px' }}>
              <label style={{ width: '10rem', textAlign: 'left' }}>ID/Email:</label>
              <input 
                type="text" 
                required 
                style={{ flex: 2, marginLeft: '10px', color: 'black', padding: '5px' }}
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
          </div>
          <div className="row" style={{ marginTop: '20px' }}>
              <label style={{ width: '10rem', textAlign: 'left' }}>Password:</label>
              <input 
                type="password" 
                required 
                style={{ flex: 2, marginLeft: '10px', color: 'black', padding: '5px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
          </div>
          <div className="row" style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}>
              <button className="btn" type="submit">Login</button>
          </div>
      </form>
    </div>
  );
}