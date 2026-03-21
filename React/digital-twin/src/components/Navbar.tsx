"use client";

import { useRouter, usePathname } from "next/navigation";
import { Home, Box, Activity, LogOut } from "lucide-react";
import IntButton from "./IntButton";

// --- 2. YOUR MAIN NAVBAR ---
export default function Navbar({ department }: { department: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
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
    <nav>
      <div className="nav-left">
        <h1>
          HU Digital Twin
        </h1>
      </div>
      
      <div className="nav-center">
        <IntButton icon={Home} label="Home" isActive={pathname === homeNav} onClick={() => router.push(homeNav)} classes="btn-header" />
        <IntButton icon={Box} label="Model" isActive={pathname === "/model"} onClick={() => router.push("/model")} classes="btn-header" />
        <IntButton icon={Activity} label="Live Model" isActive={pathname === "/live_model"} onClick={() => router.push("/live_model")} classes="btn-header" />
      </div>

      <div className="nav-right">
        <IntButton icon={LogOut} label="Log Out" onClick={handleLogout} classes={"btn-header btn-red"} />
      </div>
      
    </nav>
  );
}