"use client"; // Required because we are using the useRouter hook for navigation

import { useRouter, usePathname } from "next/navigation";

export default function Navbar({ department }: { department: string }) {
  const router = useRouter();
  const pathname = usePathname(); // This hook tells us what page we are currently on

  const handleLogout = async () => {
    try {
      // 1. Tell the Flask backend to destroy the session cookie
      await fetch('/api/logout', { method: 'POST' });
      document.cookie = "department=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
      window.location.href = '/'; 
      
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  const routes: Record<string, string> = {
    Security: "/security_home",
    Facilities: "/facility_home",
    Admin: "/dashboard",
  };

  const homeNav = department ? routes[department] || "/" : "/";

  return (
    <div className="main-nav">
      <div className="flex-1 font-bold">
        <h1>HU Digital Twin</h1>
      </div>
      
      <div style={{ flex: 2 }}>
        <div className="nav-headers">
          <button 
            className={`btn-header ${pathname === homeNav ? "selected" : ""}`} 
            onClick={() => router.push(homeNav)}
          >
            Home
          </button>
          
          <button 
            className={`btn-header ${pathname === "/model" ? "selected" : ""}`} 
            onClick={() => router.push("/model")}
          >
            Model
          </button>
          
          <button 
            className={`btn-header ${pathname === "/live_model" ? "selected" : ""}`} 
            onClick={() => router.push("/live_model")}
          >
            Live Model
          </button>
          
          <button 
            className="btn-header" 
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}