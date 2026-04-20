"use client"; // Tells Next.js this component uses interactive client-side features (like state)

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormRow from "../components/FormRow";

export default function Login() {
  // React State to hold our form inputs and errors
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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

  return (
    <div className="tracker-ui outer login p-8">
      <div className="pt-5 font-bold text-center">
        <h1>Welcome To HU Digital Twin</h1>
      </div>

      {error && (
        <div className="row">
          <div className="text-[#ff4444] font-bold">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        
        <FormRow label="Username/ID" value={userId} onChange={(e) => setUserId(e.target.value)} />
        
        <FormRow label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        
        <div className="row" style={{ marginTop: '20px' }}>
          <button className="btn btn-primary text-2xl" type="submit">
            Login
          </button>
        </div>
        
      </form>
    </div>
  );
}