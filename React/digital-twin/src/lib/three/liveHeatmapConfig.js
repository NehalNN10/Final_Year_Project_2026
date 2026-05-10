// liveHeatmapConfig.js - Live Stream Lab Specific Configuration

export const liveHeatmapConfig = {
    // Live Lab Floor Dimensions (world units)
    floorWidth: 7.5,    // X-axis range - adjust based on your livestream lab
    floorDepth: 4.25,       // Z-axis range - adjust based on your livestream lab
    
    // World Bounds (for heatmap and avatar positioning)
    bounds: {
        xMin: 0,      // Adjust these to match your livestream lab's actual bounds
        xMax: 7.5,
        zMin: -4.25,
        zMax: 4.25,
    },
    
    // L-Shaped Floor Vertices (customize for your livestream lab layout)
    // Remove/modify this if your livestream lab has a different shape
    floorVertices: [
        [0, -4.25],   // Start at origin
        [7.5, -4.25],   // Cutout corner
        [7.5, 4.25],    // Bottom inner-corner
        [0, 4.25],
        [0, -4.25]
    ],
    
    // Heatmap Settings
    heatmap: {
        gridSize: 80,
        densityCap: 120,
        coolingFactor: 0.98,
        smoothSigma: 4.0,
        opacity: 0.6,
    },
};

// Use this to easily switch between different room configs if needed
export const roomConfigs = {
    livestream_lab: liveHeatmapConfig,
    // Add more rooms here as needed
    // other_room: { ... }
};