const LOOP_DURATION_SECONDS = 120; 
const FPS = 10;

const TRACKER_CSV = './files/mapped_tracks_angle_01.csv';
const IOT_CSV = './files/iot.csv';

let globalTrackData = new Map(); 
let globalIoTData = [];      

const uiElements = {
    time: document.getElementById('time'),
    occ: document.getElementById('occ'),
    temp: document.getElementById('temp'),
    ac: document.getElementById('ac'),
    lights: document.getElementById('lights')
};

async function loadData() {
    try {
        const tResp = await fetch(TRACKER_CSV);
        const tText = await tResp.text();
        const tLines = tText.split('\n').filter(l => l.trim());
        
        if (tLines.length > 1) {
            const headers = tLines[0].split(',').map(h => h.trim().toLowerCase());
            const frameIdx = headers.indexOf('frame');
            
            tLines.slice(1).forEach(line => {
                const cols = line.split(',');
                const frame = parseInt(cols[frameIdx]);
                if (!isNaN(frame)) {
                    if (!globalTrackData.has(frame)) globalTrackData.set(frame, []);
                    globalTrackData.get(frame).push(cols);
                }
            });
        }

        const iResp = await fetch(IOT_CSV);
        const iText = await iResp.text();
        const iRows = iText.split('\n').map(r => r.trim()).filter(r => r);
        const iHeaders = iRows[0].split(',').map(h => h.trim().toLowerCase());

        globalIoTData = iRows.slice(1).map(row => {
            const vals = row.split(',');
            const obj = {};
            iHeaders.forEach((h, i) => obj[h] = vals[i]);
            return obj;
        });

        console.log("Facility Data Loaded");
        
    } catch (e) {
        console.error("Error loading CSVs:", e);
    }
}

function getCurrentFrame() {
    const now = Date.now() / 1000;
    const currentLoopSeconds = now % LOOP_DURATION_SECONDS;
    return Math.floor(currentLoopSeconds * FPS);
}

function updateDashboard() {
    requestAnimationFrame(updateDashboard);

    const frame = getCurrentFrame();

    if (uiElements.time) {
        const now = new Date();
        const nowSeconds = Math.floor(now.getTime() / 1000);
        const secondsIntoCycle = nowSeconds % LOOP_DURATION_SECONDS;
        const cycleStartTime = new Date(now.getTime() - (secondsIntoCycle * 1000));
        const simTime = new Date(cycleStartTime.getTime() + (frame / FPS) * 1000);
        
        uiElements.time.innerText = simTime.toLocaleTimeString();
    }

    if (uiElements.occ) {
        const detections = globalTrackData.get(frame) || [];
        const count = detections.length;
        
        uiElements.occ.innerText = count > 0 ? "Occupied" : "Vacant";
        
        
        uiElements.occ.style.backgroundColor = count > 0 ? "#ff4444" : "#00ff88";
        uiElements.occ.style.color = "#000000";
    }

    if (frame < globalIoTData.length) {
        const row = globalIoTData[frame];

        if (uiElements.temp && row['temp']) {
            const t = parseFloat(row['temp']);
            uiElements.temp.innerText = t + "°C";
            if (t <= 19) uiElements.temp.style.backgroundColor = "#0088ff";
            else if (t <= 22) uiElements.temp.style.backgroundColor = "#00ffff";
            else if (t <= 27) uiElements.temp.style.backgroundColor = "#00ff88";
            else if (t <= 30) uiElements.temp.style.backgroundColor = "#ff8800";
            else uiElements.temp.style.backgroundColor = "#f00";

            uiElements.temp.style.color = "#000000";
        }

        if (uiElements.ac && row['ac']) {
            uiElements.ac.innerText = row['ac'];
            uiElements.ac.style.backgroundColor = (row['ac'] === "On") ? "#00ff88" : "#ff4444";
            uiElements.ac.style.color = "#000000";
        }

        if (uiElements.lights && row['lights']) {
            uiElements.lights.innerText = row['lights'];
            uiElements.lights.style.backgroundColor = (row['lights'] === "On") ? "#00ff88" : "#ff4444";
            uiElements.lights.style.color = "#000000";
        }
    }
}

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
                alert_type: document.getElementById('alertType').value,
                time_since: document.getElementById('timeSince').value,
                // emergency_type: document.getElementById('emergencyType').value,
                description: document.getElementById('description').value
            };

            console.log('Submitting emergency alert:', formData);

            try {
                // Send facilities alert to backend
                const response = await fetch('/send_facilities_alert', {
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