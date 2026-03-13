"use client";

interface RoomStatsPanelProps {
  department: string;
  isLive?: boolean;
}

export default function RoomStatsPanel({ department, isLive = false }: RoomStatsPanelProps) {
  return (
    <div className="tracker-ui outer p-4!">
      <h3 className="row font-bold mt-0!">
        <span>
          <span>📍 &nbsp; </span>
          <span id="ui-room-name">--</span>
        </span>
      </h3>
      
      <div className="content" id="ui-content">
        <div className="row">
            <span id="ui-room-id">--</span>
            <span id="ui-room-floor">--</span>
        </div>

        <div className="row">
          <span><span> 📅 </span><span id="ui-iot-date">??</span></span>
          <span><span> ⏰ </span><span id="ui-iot-time" className="font-bold value">??</span></span>
        </div>

        <div className="row border-t border-t-[#888] mt-4! pt-4!" id="occupancy">
          <span id="ui-iot-occu-header">Occupancy:</span>
          <span className="fill" id="ui-iot-occupancy">Detecting...</span>
        </div>

        {!isLive && department !== "Security" && (
          <div id="iot-data">
            <div className="row">
                <span> 🌡️ Temperature: </span>
                <span className="fill" id="ui-iot-temp">??</span>
            </div>

            <div className="row">
                <span>❄️ AC: </span>
                <span className="fill" id="ui-iot-ac">--</span>
                <span>💡 Lights: </span>
                <span className="fill" id="ui-iot-lights">--</span>
            </div>
          </div>
        )}
      </div>
    </div> 
  );
}