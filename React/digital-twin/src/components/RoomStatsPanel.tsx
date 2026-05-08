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
  ChevronUp, 
  Droplets
} from "lucide-react";

interface RoomStatsPanelProps {
  department: string;
  isLive?: boolean;
  liveOccupancy?: number | null;
  sensorData?: {
    device_id: null,
    temperature: null,
    humidity: null,
    lights_state: null,
    ac_state: null
  };
}

export default function RoomStatsPanel({ 
  department, 
  isLive = false, 
  liveOccupancy = null,
  sensorData = {
    device_id: null,
    temperature: null,
    humidity: null,
    lights_state: null,
    ac_state: null
  }
}: RoomStatsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="tracker-ui outer p-0!">
      <div className="header p-4! bg-[var(--primary-color)] rounded-[8px]" onClick={() => setIsExpanded(!isExpanded)}>
        <h3 className="flex gap-2 items-center font-bold mt-0! justify-start! text-[var(--primary-text-color)]">
          <StatRow icon={MapPin} label="--" id="ui-room-name" size="32"/>
        </h3>
        <div className="text-[var(--primary-text-color)] ml-2">
          {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </div>
      </div>
      <div className={`content-expand ${isExpanded ? "expanded" : "collapsed"}`}>
        <div className="content" id="ui-content">
          <div className="row font-bold text-[var(--text-color)]">
            <span id="ui-room-id">--</span>
            <span id="ui-room-floor">--</span>
          </div>

          <div className="row text-[var(--text-color)] flex-wrap gap-4">
            <StatRow icon={Calendar} label="--" id="ui-iot-date" />
            <StatRow icon={Clock} label="--" id="ui-iot-time" />
          </div>

          <div className="row border-t mt-4! pt-4!" id="occupancy">
            {isLive && liveOccupancy !== null ? (
              <StatRow 
                icon={User} 
                label="Occupancy: " 
                value={liveOccupancy} 
                classes={`${
                  liveOccupancy === null ? "bg-white" : 
                  liveOccupancy <= 5 ? "bg-[#00ff88]" : 
                  "bg-[#f44]"}`
                }
              />
            ) : (
              <StatRow icon={User} label="Occupancy: " id="ui-iot-occu-header" id2="ui-iot-occupancy"/>
            )}
          </div>

          {/* Render environment stats only if NOT live and NOT security */}
          {!isLive && department !== "Security" && (
            <>
              <div className="row">
                <StatRow icon={Thermometer} label="Temp: " id2="ui-iot-temp"/>
              </div>
              
              <div className="row flex-wrap gap-4">
                <div className="flex gap-2 items-center">
                  <StatRow icon={AirVent} label="AC: " id2="ui-iot-ac"/>
                </div>
                <div className="flex gap-2 items-center">
                  <StatRow icon={Lightbulb} label="Lights: " id2="ui-iot-lights"/>
                </div>
              </div>
            </>
          )}

          {isLive && department !== "Security" && (
            <>
              <div className="row flex-wrap gap-4">
                <div className="flex gap-2 items-center">
                  <StatRow 
                    icon={Thermometer} label="Temp:" 
                    classes={`${
                      sensorData.temperature === null ? "bg-white" : 
                      sensorData.temperature <= 20 ? "bg-[#0088ff]" : 
                      sensorData.temperature <= 22 ? "bg-[#00ffff]" : 
                      sensorData.temperature <= 28 ? "bg-[#00ff88]" : 
                      sensorData.temperature <= 30 ? "bg-[#ff8800]" : 
                      "bg-[#f00]"}`
                    }
                    value={sensorData.temperature !== null ? `${sensorData.temperature}°` : '--°'} 
                    
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <StatRow 
                    icon={Droplets} 
                    label="Humidity:" value={sensorData.humidity !== null ? `${sensorData.humidity}%` : '--%'}
                    classes={`${
                      sensorData.humidity === null ? "bg-white" : 
                      sensorData.humidity <= 40 ? "bg-[#0088ff]" : 
                      sensorData.humidity <= 60 ? "bg-[#00ffff]" : 
                      "bg-[#f00]"}`
                    }
                  />
                </div>
              </div>
              
              <div className="row flex-wrap gap-4">
                <div className="flex gap-2 items-center">
                  <StatRow 
                    icon={AirVent} 
                    label="AC:" value={sensorData.ac_state || '--'} 
                    classes={`${
                      sensorData.ac_state === null ? "bg-white" : 
                      sensorData.ac_state === "on" ? "bg-[#0088ff]" : 
                      "bg-[#f44]"}`
                    }
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <StatRow 
                    icon={Lightbulb} 
                    label="Lights:" value={sensorData.lights_state || '--'} 
                    classes={`${
                      sensorData.lights_state === null ? "bg-white" : 
                      sensorData.lights_state === "on" ? "bg-[#0088ff]" : 
                      "bg-[#f44]"}`
                    }
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div> 
  );
}