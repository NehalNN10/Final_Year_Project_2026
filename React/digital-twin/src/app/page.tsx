"use client"; // Tells Next.js this component uses interactive client-side features (like state)

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FormRow from "../components/FormRow";
import IntButton from "@/components/IntButton";
import { Moon, Sun } from "lucide-react";

export default function Login() {
  // React State to hold our form inputs and errors
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const router = useRouter();

  // Handle the form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevents the browser from refreshing the page
    setError(""); // Clear any previous errors

    try {
      // Send the login data to our backend API
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, password }),
      });

      if (response.ok) {
        const data = await response.json();

        document.cookie = `department=${data.department}; path=/`;
        
        // Next.js client-side routing based on department
        if (data.department === "Security") {
          router.push("/security_home");
        } else if (data.department === "Facilities") {
          router.push("/facility_home");
        } else {
          router.push("/dashboard");
        }
      } else {
        const errData = await response.json();
        setError(errData.error || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      setError("An error occurred connecting to the server.");
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
      setIsDarkMode(true);
    }
  }, []);

  // ✨ ADD THIS: The function to handle the switch
  const toggleTheme = () => {
    const newIsDark = !isDarkMode;
    setIsDarkMode(newIsDark);
    
    if (newIsDark) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      document.cookie = "department=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = '/'; 
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  return (
    <>
      <div className="flex flex-row">
        <div className="bg-[var(--primary-color)] text-[var(--primary-text-color)] rounded-r-[1rem] rounded-l-0 h-screen w-3/5">yo</div>
        <div className="w-2/5 h-screen flex flex-col items-center justify-center relative">
          <IntButton 
            icon={isDarkMode ? Moon : Sun} 
            label="Switch Theme" 
            onClick={toggleTheme} 
            classes={"btn-header btn-primary absolute top-8 right-8 z-200"} 
          />
          <div className="pt-5 font-bold text-center px-5">
            <h1>Welcome To HU Digital Twin</h1>
          </div>

          {error && (
            <div className="row px-10">
              <div className="text-[#ff4444] font-bold">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full px-10">
            
            <FormRow label="Username/ID" value={userId} onChange={(e) => setUserId(e.target.value)} />
            
            <FormRow label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            
            <div className="row" style={{ marginTop: '20px' }}>
              <button className="btn btn-primary text-2xl" type="submit">
                Login
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </>
  );
}