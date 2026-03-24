"use client";

import { useState } from "react"; // <-- 1. Import useState
import { useRouter, usePathname } from "next/navigation";
// <-- 2. Import MoreVertical (3 dots) and X for the toggle button
import { Home, Box, Activity, LogOut, MoreVertical, X, Wrench } from "lucide-react";
import IntButton from "./IntButton";

export default function Navbar({ department }: { department: string }) {
  const router = useRouter();
  const pathname = usePathname();
  
  // --- STATE ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  // Helper to change pages AND close the mobile menu automatically
  const handleNav = (path: string) => {
    router.push(path);
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 w-full z-150">
      <nav className="relative"> {/* Keep relative so the dropdown pins correctly to the bottom */}
        <div className="nav-left">
          <h1>HU Digital Twin</h1>
        </div>
        
        {/* --- DESKTOP VIEW (Hidden on Mobile) --- */}
        {/* Added 'hidden md:flex' so these hide on screens smaller than 768px */}
        <div className="nav-center hidden! md:flex!">
          <IntButton icon={Home} label="Home" isActive={pathname === homeNav} onClick={() => router.push(homeNav)} classes="btn-header" />
          <IntButton icon={Box} label="Model" isActive={pathname === "/model"} onClick={() => router.push("/model")} classes="btn-header" />
          <IntButton icon={Activity} label="Live Model" isActive={pathname === "/live_model"} onClick={() => router.push("/live_model")} classes="btn-header" />
          <IntButton 
          icon={Wrench} 
          label="Sandbox" 
          isActive={pathname === "/sandbox"} 
          onClick={() => router.push("/sandbox")} 
          classes="btn-header" 
        />
      </div>

        <div className="nav-right gap-2">
          <IntButton icon={LogOut} label="Log Out" onClick={handleLogout} classes={"btn-header btn-red"} />
          <IntButton icon={MoreVertical} label="Menus" onClick={() => setIsMenuOpen(!isMenuOpen)} classes={"btn-header btn-green text-black! md:hidden!"} />
        </div>
      </nav>

      {isMenuOpen && (
        <div className="absolute top-18 right-8 tracker-ui h-auto w-55 mt-0! z-150!">
          <IntButton icon={Home} label="Home" isActive={pathname === homeNav} onClick={() => handleNav(homeNav)} classes="btn-header !justify-start w-full" />
          <IntButton icon={Box} label="Model" isActive={pathname === "/model"} onClick={() => handleNav("/model")} classes="btn-header !justify-start w-full" />
          <IntButton icon={Activity} label="Live Model" isActive={pathname === "/live_model"} onClick={() => handleNav("/live_model")} classes="btn-header !justify-start w-full" />
        </div>
      )}
    </header>
  );
}