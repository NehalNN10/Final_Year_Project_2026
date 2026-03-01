import * as THREE from 'three';

export const livePlayback = {
    isLive: true,
    startTime: Date.now(),
    trackCount: 0
};

export function createLiveMarker(trackId, position, region, color = 0xff0000, size = 0.15) {
    if (region === "MAIN_VIEW")
        color = 0x00ff00; // Green for main view
    const geometry = new THREE.SphereGeometry(size, 32, 32);
    const material = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.5,
        metalness: 0.3,
        roughness: 0.4
    });
    const marker = new THREE.Mesh(geometry, material);
    
    marker.position.set(position.z, 0.3, position.x);
    marker.userData = {
        trackId: trackId,
        createdAt: Date.now(),
        region: region
    };
    
    // Add a label above the marker
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'Bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Track ${trackId} Region ${region}`, 128, 45);
    
    const texture = new THREE.CanvasTexture(canvas);
    const labelGeometry = new THREE.PlaneGeometry(1, 0.25);
    const labelMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.set(0, 0.5, 0);
    marker.add(label);
    
    return marker;
}

export function updateLiveMarker(marker, position) {
    if (marker) {
        marker.position.set(position.z, 0.3, position.x);
    }
}

export function getLiveTrackMarkers() {
    return livePlayback.trackCount;
}

export function getFormattedTime() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
}

export function updateLiveStats(trackCount) {
    livePlayback.trackCount = trackCount;
    if (document.getElementById('ui-occupancy')) {
        document.getElementById('ui-occupancy').textContent = `${trackCount} people`;
    }
}