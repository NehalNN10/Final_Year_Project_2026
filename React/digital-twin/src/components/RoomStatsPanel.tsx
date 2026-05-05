"use client";

import StatRow from "./StatRow";
import { useState } from "react";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Thermometer, 
  AirVent, 
  Lightbulb, 
  ChevronDown, 
  ChevronUp 
} from "lucide-react";

interface RoomStatsPanelProps {
  department: string;
  isLive?: boolean;
  liveOccupancy?: number | null;
}

export default function RoomStatsPanel({ 
  department, 
  isLive = false, 
  liveOccupancy = null 
}: RoomStatsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="tracker-ui outer p-0!">
      {/* Changed to a button for better accessibility and semantic HTML */}
      <button 
        className="header p-4! bg-[var(--primary-color)] rounded-[8px] w-full flex justify-between items-center cursor-pointer border-none"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <h3 className="flex gap-2 items-center font-bold mt-0! text-[var(--primary-text-color)] m-0">
          <StatRow icon={MapPin} label="--" id="ui-room-name" size="32"/>
        </h3>
        <div className="text-[var(--primary-text-color)] ml-2">
          {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </div>
      </button>

      <div className={`content-expand overflow-hidden transition-all duration-300 ${isExpanded ? "expanded max-h-[500px] opacity-100" : "collapsed max-h-0 opacity-0"}`}>
        <div className="content p-4" id="ui-content">
          <div className="row font-bold text-[var(--text-color)] mb-2 flex gap-2">
            <span id="ui-room-id">--</span>
            <span id="ui-room-floor">--</span>
          </div>

          <div className="row text-[var(--text-color)] flex-wrap gap-4 mb-2">
            <StatRow icon={Calendar} label="--" id="ui-iot-date" />
            <StatRow icon={Clock} label="--" id="ui-iot-time" />
          </div>

          <div className="row border-t border-gray-600 mt-4! pt-4!" id="occupancy">
             {/* If we are live, display the React prop. Otherwise, keep the ID so your vanilla JS can still target and update it! */}
            {isLive && liveOccupancy !== null ? (
              <StatRow icon={User} label={`Occupancy: ${liveOccupancy}`} />
            ) : (
              <StatRow icon={User} label="Occupancy: " id="ui-iot-occu-header" id2="ui-iot-occupancy"/>
            )}
          </div>

          {/* Render environment stats only if NOT live and NOT security */}
          {!isLive && department !== "Security" && (
            <div className="mt-4 flex flex-col gap-2">
              <div className="row">
                <StatRow icon={Thermometer} label="Temp: " id2="ui-iot-temp"/>
              </div>
              
              <div className="row flex flex-wrap gap-4">
                <div className="flex gap-2 items-center">
                  <StatRow icon={AirVent} label="AC: " id2="ui-iot-ac"/>
                </div>
                <div className="flex gap-2 items-center">
                  <StatRow icon={Lightbulb} label="Lights: " id2="ui-iot-lights"/>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div> 
  );
}