"use client";

import { useState } from "react";
import { Camera, ChevronDown, ChevronUp, ListRestart } from "lucide-react";

interface ModelControlsPanelProps {
    isReplay?: boolean;
}

export default function ModelControlsPanel({ isReplay = false }: ModelControlsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="tracker-ui outer p-4!">
      <div className="header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3 className="font-bold">
          Model Controls
        </h3>
        <div className="ml-2">
          {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </div>
      </div>
      <div className={`content-expand ${isExpanded ? "expanded" : "collapsed"}`}>
        <div className="content" id="ui-content">
          <div className="row">
            <span>Zoom:</span>
            <span>Scroll Wheel/Pinch</span>
          </div>
          <div className="row">
              <span>Move:</span>
              <span>Right Click & Pan</span>
          </div>
          <div className="row">
              <span>Rotate:</span>
              <span>Left Click & Pan</span>
          </div>

          <button 
            className="btn btn-green mx-0! mb-0!" 
            onClick={() => import("../lib/three/ui.js").then(mod => mod.resetCameraView())}
          >
            <Camera size={20} /> <span className="ml-2">Reset Camera</span>
          </button>
          {!isReplay && (
              <button 
              className="btn btn-green mx-0! mb-0! mt-2!" 
              id="replay-btn" 
              onClick={() => {
                  import("../lib/three/simulation.js").then(mod => {
                  const currentFrame = Math.floor(mod.playback.frame);
                  window.location.href = `/model_replay?frame=${currentFrame}`;
                  });
              }}
              >
                <ListRestart size={20} /> <span className="ml-2">Model Replay</span>
              </button>
          )}
        </div>
      </div>
    </div>
  );
}