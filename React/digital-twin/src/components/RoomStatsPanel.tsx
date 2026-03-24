"use client";
import StatRow from "./StatRow";
import { useState } from "react";
import { MapPin, Calendar, Clock, User, Thermometer, AirVent, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";

interface RoomStatsPanelProps {
  department: string;
  isLive?: boolean;
}

export default function RoomStatsPanel({ department, isLive = false }: RoomStatsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="tracker-ui outer p-4!">
      <div className="header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3 className="flex gap-2 items-center font-bold mt-0! justify-start! text-[#0f8]">
          <StatRow icon={MapPin} label="--" id="ui-room-name" size="32"/>
        </h3>
        <div className="text-[#0f8] ml-2">
          {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </div>
      </div>
      <div className={`content-expand ${isExpanded ? "expanded" : "collapsed"}`}>
        <div className="content" id="ui-content">
          <div className="row font-bold text-[#aaa]">
            <span id="ui-room-id">--</span>
            <span id="ui-room-floor">--</span>
          </div>

          <div className="row text-[#ccc] flex-wrap gap-4">
            <StatRow icon={Calendar} label="--" id="ui-iot-date" />
            <StatRow icon={Clock} label="--" id="ui-iot-time" />
          </div>

          <div className="row border-t border-t-[#888] mt-4! pt-4!" id="occupancy">
            <StatRow icon={User} label="Occupancy: " id="ui-iot-occu-header" id2="ui-iot-occupancy"/>
          </div>

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
        </div>
      </div>
    </div> 
  );
}