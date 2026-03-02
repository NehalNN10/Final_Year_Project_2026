import {FPS, LOOP_DURATION, track_count, iot} from './assets/simulation.js';

let globalTrackData = new Map(); 
let globalIoTData = [];      

const uiElements = {
    time: document.getElementById('time'),
    occ: document.getElementById('occ')
};

function getCurrentFrame() {
    const now = Date.now() / 1000;
    const currentLoopSeconds = now % LOOP_DURATION;
    return Math.floor(currentLoopSeconds * FPS); // Ensure FPS is applied
}

async function loadData() {
    try {
        console.log("Fetching track count from:", track_count); // Debugging
        const tResp = await fetch(track_count);
        if (!tResp.ok) throw new Error(`Failed to load track CSV: ${tResp.status}`);
        
        const tText = await tResp.text();
        const tLines = tText.split('\n').filter(l => l.trim());
        
        if (tLines.length > 1) {
            const headers = tLines[0].split(',').map(h => h.trim().toLowerCase());
            const frameIdx = headers.indexOf('frame');
            // 1. Find the index of the 'Count' column (usually index 1)
            const countIdx = headers.indexOf('count'); 
            
            tLines.slice(1).forEach(line => {
                const cols = line.split(',');
                const frame = parseInt(cols[frameIdx]);
                
                if (!isNaN(frame)) {
                    // 2. Store the EXACT row data directly
                    globalTrackData.set(frame, cols);
                }
            });
        }

        const iResp = await fetch(iot);
        if (!iResp.ok) throw new Error(`Failed to load IoT CSV: ${iResp.status}`);
        
        const iText = await iResp.text();
        const iRows = iText.split('\n').map(r => r.trim()).filter(r => r);
        const iHeaders = iRows[0].split(',').map(h => h.trim().toLowerCase());

        globalIoTData = iRows.slice(1).map(row => {
            const vals = row.split(',');
            const obj = {};
            iHeaders.forEach((h, i) => obj[h] = vals[i]);
            return obj;
        });

        console.log("Facility Data Loaded Successfully");
        
    } catch (e) {
        console.error("Error loading CSVs:", e);
        // Fallback: If data fails, set text to Error so you know
        if(uiElements.occ) uiElements.occ.innerText = "Error";
    }
}

function updateDashboard() {
    requestAnimationFrame(updateDashboard);

    const frame = getCurrentFrame();

    // --- TIME UPDATE ---
    if (uiElements.time) {
        const now = new Date();
        const nowSeconds = Math.floor(now.getTime() / 1000);
        const secondsIntoCycle = nowSeconds % LOOP_DURATION;
        const cycleStartTime = new Date(now.getTime() - (secondsIntoCycle * 1000));
        const simTime = new Date(cycleStartTime.getTime() + (frame / FPS) * 1000);
        
        uiElements.time.innerText = simTime.toLocaleTimeString();
    }

    // --- OCCUPANCY UPDATE (FIXED) ---
    if (uiElements.occ) {
        // 3. Retrieve the row for this frame
        const row = globalTrackData.get(frame); 
        
        if (row) {
            // 4. Read the value from the 2nd column (Index 1)
            // The CSV format is: Frame, Count (e.g., "0,18")
            const count = parseInt(row[1]); 

            uiElements.occ.innerText = isNaN(count) ? "--" : count;
            
            // Color Logic
            uiElements.occ.style.backgroundColor = count > 20 ? "#ff4444" : count != 0 ? "#00ff88" : "#ffffff";
            uiElements.occ.style.color = "#000000";
        } else {
            // Optional: Keep last known value or show placeholder if frame is out of range
            // uiElements.occ.innerText = "--"; 
        }
    }
}

// Start the app
loadData().then(() => {
    updateDashboard();
});

// ===== Emergency Modal Functions =====
function openEmergencyModal() {
    const modal = document.getElementById('emergencyModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeEmergencyModal() {
    const modal = document.getElementById('emergencyModal');
    if (modal) {
        modal.classList.remove('active');
    }
    // Reset form
    document.getElementById('emergencyForm').reset();
}

// module scripts don't expose functions to the global scope by default;
// make them available for inline handlers
window.openEmergencyModal = openEmergencyModal;
window.closeEmergencyModal = closeEmergencyModal;

// Close modal when clicking outside the modal content
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('emergencyModal');
    
    if (modal) {
        modal.addEventListener('click', function(event) {
            // Close only if clicking on the overlay itself, not the content
            if (event.target === modal) {
                closeEmergencyModal();
            }
        });

        // Handle form submission
        document.getElementById('emergencyForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                room_number: document.getElementById('roomNumber').value,
                occupancy_count: document.getElementById('occupancy').value,
                // emergency_type: document.getElementById('emergencyType').value,
                description: document.getElementById('description').value
            };

            console.log('Submitting emergency alert:', formData);

            try {
                // Send emergency alert to backend
                const response = await fetch('/send_emergency_alert', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();
                console.log('Response:', response.status, result);
                
                if (response.ok) {
                    console.log('Emergency alert sent successfully!');
                    alert('Emergency alert sent successfully!\n\nRecipients: ' + result.recipients.join(', '));
                    closeEmergencyModal();
                } else {
                    console.error('Error:', result.error);
                    alert('Error sending emergency alert:\n' + result.error);
                }
            } catch (error) {
                console.error('Error sending emergency alert:', error);
                alert('Error sending emergency alert:\n' + error.message);
            }
        });
    }
});