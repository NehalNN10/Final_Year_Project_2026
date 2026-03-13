"use client"; // Required for interactivity like button clicks

import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar"

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#131313] text-white">
      
      {/* 1. Drop the reusable Navbar right here! */}
      <Navbar department="Admin"/>

      {/* 2. Main Dashboard Content */}
      <div className="p-8">
        <h2>Welcome to the Admin Dashboard</h2>
        <p className="text-gray-400 mt-2">Dashboard metrics and data will be displayed here.</p>
      </div>
      
    </div>
  );
}