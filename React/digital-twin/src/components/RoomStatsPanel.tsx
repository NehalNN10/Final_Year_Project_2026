"use client";
import StatRow from "./StatRow";
import { MapPin, Calendar, Clock, User, Thermometer, AirVent, Lightbulb } from "lucide-react";

interface RoomStatsPanelProps {
  department: string;
  isLive?: boolean;
}

export default function RoomStatsPanel({ department, isLive = false }: RoomStatsPanelProps) {
  return (
    <div className="tracker-ui outer p-4!">
      <h3 className="flex gap-2 items-center font-bold mt-0! justify-start! text-[#0f8]">
        <StatRow icon={MapPin} label="--" id="ui-room-name" size="32"/>
      </h3>
      
      <div className="content" id="ui-content">
        <div className="row font-bold text-[#aaa]">
          <span id="ui-room-id">--</span>
          <span id="ui-room-floor">--</span>
        </div>

        <div className="row text-[#ccc]">
          <StatRow icon={Calendar} label="--" id="ui-iot-date" />
          <StatRow icon={Clock} label="--" id="ui-iot-time" />
        </div>

        <div className="row border-t border-t-[#888] mt-4! pt-4!" id="occupancy">
          <StatRow icon={User} label="Occupancy: " id="ui-iot-occu-header" id2="ui-iot-occupancy"/>
        </div>

        {!isLive && department !== "Security" && (
          <div id="iot-data">
            <div className="row">
              <StatRow icon={Thermometer} label="Temperature: " id2="ui-iot-temp"/>
            </div>
            
            <div className="row">
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
  );
}