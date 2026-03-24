"use client";

import Link from "next/link";

export default function SandboxPage() {
  return (
    <div className="baseStyle flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl text-[#00ff88] mb-4">Sandbox Mode</h1>
      <p className="text-gray-400 mb-8">Spawn people, adjust AC, and control the lights.</p>
      
      {/* This will eventually hold your Three.js Canvas */}
      <div className="w-full max-w-4xl h-[60vh] border-2 border-[#888] rounded-lg bg-black flex items-center justify-center">
        <span className="text-gray-600">[ Empty 3D Model Goes Here ]</span>
      </div>

      <div className="mt-8">
        <Link href="/" className="btn btn-blue btn-auto">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}