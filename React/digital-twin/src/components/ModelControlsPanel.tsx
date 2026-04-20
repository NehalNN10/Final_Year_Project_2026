"use client";

import { useState } from "react";
import { Camera, ChevronDown, ChevronUp, ListRestart, Radar } from "lucide-react";
import IntButton from "./IntButton";

interface ModelControlsPanelProps {
    isReplay?: boolean;
}

export default function ModelControlsPanel({ isReplay = false }: ModelControlsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const ui = "../lib/three/ui.js";

  return (
    <div className="tracker-ui outer p-0!">
      <div className="header p-4!" onClick={() => setIsExpanded(!isExpanded)}>
        <h3 className="font-bold">
          Model Controls
        </h3>
        <div className="ml-2">
          {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </div>
      </div>
      <div className={`content-expand ${isExpanded ? "expanded" : "collapsed"}`}>
        <div className="content" id="ui-content">
          <div className="row mt-0!">
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
            className="btn btn-primary mx-0! mb-0! mt-2!" 
            onClick={() => import(ui).then(mod => mod.resetCameraView())}
          >
            <Camera size={20} /> <span className="ml-2">Reset Camera</span>
          </button>
          {!isReplay && (
              <button 
              className="btn btn-primary mx-0! mb-0! mt-2!" 
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
          {!isReplay && (
              <button 
              className="btn btn-primary mx-0! mb-0! mt-2!" 
              id="replay-btn" 
              onClick={() => {
                  import("../lib/three/simulation.js").then(mod => {
                  window.location.href = `/model_replay?frame=44999`;
                  });
              }}
              >
                <ListRestart size={20} /> <span className="ml-2">Full Model Replay</span>
              </button>
          )}
        </div>
      </div>
    </div>
  );
}