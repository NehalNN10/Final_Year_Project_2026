"use client";

interface ModelControlsPanelProps {
    isReplay?: boolean;
}

export default function ModelControlsPanel({ isReplay = false }: ModelControlsPanelProps) {
  return (
    <div className="tracker-ui outer p-4!">
      <h3 className="font-bold">Model Controls</h3> 
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
          📷 Reset Camera
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
            Model Replay
            </button>
        )}
      </div>
    </div>
  );
}