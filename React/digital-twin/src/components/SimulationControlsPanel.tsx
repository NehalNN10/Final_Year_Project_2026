"use client";



export default function SimulationControlsPanel() {
  const onChangeScrubberText = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value, 10);
      
    if (isNaN(val)) return;

    const rangeSlider = document.getElementById('frame-scrubber') as HTMLInputElement | null;
    const maxLimit = rangeSlider ? parseInt(rangeSlider.max, 10) : 22500;

    if (val < 0) val = 0;
    if (val > maxLimit) val = maxLimit;

    import("../lib/three/ui.js").then(mod => mod.scrubFrame(val));

    if (rangeSlider) rangeSlider.value = val.toString();
  };

  const onChangeSpeedText = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseFloat(e.target.value);
      
    if (isNaN(val)) return;

    const speedSlider = document.getElementById('speed-scrubber') as HTMLInputElement | null;
    const maxLimit = 5;

    if (val < 0.1) val = 0.1;
    if (val > maxLimit) val = maxLimit;

    import("../lib/three/ui.js").then(mod => mod.changeSpeed(val));

    if (speedSlider) speedSlider.value = val.toString();
  };
  
  return (
    <div className="tracker-ui outer p-4!">
      <h3 className="font-bold">Simulation Controls</h3> 
      <div className="content" id="sim-content">
        
        {/* Speed Slider Row (Matches dat.gui 40/60 split) */}
        <div className="flex items-center my-3 text-[#ccc]">
          <div className="w-1/3 text-left pr-2">Speed</div>
          <div className="w-2/3 flex items-center justify-end h-5">
            <input 
              type="range" min="0.1" max="5" step="0.1" defaultValue="1" id="speed-scrubber"
              className="scrubber"
              onChange={(e) => {
                import("../lib/three/ui.js").then(mod => mod.changeSpeed(e.target.value));
                // Update the little text box dynamically
                const textEl = document.getElementById('speed-text') as HTMLInputElement;
                if (textEl) textEl.value = e.target.value;
              }} 
            />
            {/* The dat.gui style text box */}
            <input 
              id="speed-text"
              type="text" 
              defaultValue="1"
              className="scrubber-text"
              onChange={onChangeSpeedText} 
            />      
          </div>
        </div>

        {/* Scrubber Row (Matches dat.gui 40/60 split) */}
        <div className="flex items-center my-3 text-[#ccc]">
          <div className="w-1/3 text-left pr-2">Scrubber</div>
          <div className="w-2/3 flex items-center justify-end h-5">
            <input 
              type="range" min="0" max="22499" step="1" defaultValue="0" id="frame-scrubber"
              className="scrubber"
              onChange={(e) => {
                import("../lib/three/ui.js").then(mod => mod.scrubFrame(e.target.value));
                // Update the little text box dynamically
                const textEl = document.getElementById('frame-scrubber-text') as HTMLInputElement;
                if (textEl) textEl.value = e.target.value;
              }} 
            />
            {/* The dat.gui style text box */}
            <input 
              id="frame-scrubber-text"
              type="text" 
              defaultValue="0" 
              className="scrubber-text"
              onChange={onChangeScrubberText} 
            />
          </div>
        </div>

        {/* Media Buttons Row (Using your .btn-track class!) */}
        <div className="row flex justify-between gap-2 mt-4!">
          <button 
            className="btn btn-green flex-1 m-0!" 
            onClick={() => import("../lib/three/ui.js").then(mod => mod.rewindSim())}
          >
            &lt;&lt; -5s
          </button>
          
          <button 
            className="btn btn-green flex-1 m-0!" 
            onClick={(e) => {
              // 1. Capture the button element IMMEDIATELY before the async call
              const btnElement = e.currentTarget; 
              
              import("../lib/three/ui.js").then(mod => {
                const isPlaying = mod.togglePlayPause();
                // 2. Use the captured element instead of 'e.currentTarget'
                btnElement.innerText = isPlaying ? "Pause" : "Play";
              });
            }}
          >
            Play
          </button>
          
          <button 
            className="btn btn-green flex-1 m-0!" 
            onClick={() => import("../lib/three/ui.js").then(mod => mod.fastForwardSim())}
          >
            +5s &gt;&gt;
          </button>
        </div>

        {/* Reset Button */}
        <div className="row mt-3!">
          <button 
            className="btn btn-green w-full m-0!" 
            onClick={() => import("../lib/three/ui.js").then(mod => mod.resetSim())}
          >
            Reset Playback
          </button>
        </div>

      </div>
    </div>
  );
}