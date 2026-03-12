import {FPS, LOOP_DURATION, iot} from './variables.js';

const uiElements = {
    time: document.getElementById('time'),
    occ: document.getElementById('occ')
};

function getCurrentFrame() {
    const now = Date.now() / 1000;
    const currentLoopSeconds = now % LOOP_DURATION;
    return Math.floor(currentLoopSeconds);
}

function updateDashboard() {
    requestAnimationFrame(updateDashboard);

    const frame = getCurrentFrame();
    
    const row = iot["C-007"][frame];

    if (uiElements.time) {
        const now = new Date();
        const nowSeconds = Math.floor(now.getTime() / 1000);
        const secondsIntoCycle = nowSeconds % LOOP_DURATION;
        const cycleStartTime = new Date(now.getTime() - (secondsIntoCycle * 1000));
        const simTime = new Date(cycleStartTime.getTime() + (frame / FPS) * 1000);
        
        uiElements.time.innerText = simTime.toLocaleTimeString();
    }

    if (uiElements.occ) {
        // 
        const count = row.occupancy;
        uiElements.occ.innerText = isNaN(count) ? "--" : count;
        
        uiElements.occ.style.backgroundColor = count > 20 ? "#ff4444" : count != 0 ? "#00ff88" : "#ffffff";
        uiElements.occ.style.color = "#000000";
    
    }
}

// Start the app
updateDashboard();

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

window.toggleRoomList = function() {
    const container = document.getElementById('roomChecklistContainer');
    const btn = document.querySelector('button[onclick="toggleRoomList()"]');
    
    if (container.style.display === 'none') {
        container.style.display = 'block';
        btn.innerText = 'Hide Rooms ▲';
    } else {
        container.style.display = 'none';
        btn.innerText = 'Show Rooms ▼';
    }
}

// --- Updated Modal Logic (Back to Checkboxes) ---
window.openStaffModal = async function(id = '', userId = '', email = '', name = '', role = '') { // <--- Added name param
    const modal = document.getElementById('staffModal');
    const title = document.getElementById('staffModalTitle');
    const roleSelect = document.getElementById('staffRole');
    const roomContainer = document.getElementById('roomChecklist');
    
    // Reset toggle
    document.getElementById('roomChecklistContainer').style.display = 'none';
    document.querySelector('button[onclick="toggleRoomList()"]').innerText = 'Show Rooms ▼';

    // 1. Populate Basic Fields
    document.getElementById('staffDbId').value = id;
    document.getElementById('staffName').value = name;
    document.getElementById('staffUserId').value = userId;
    document.getElementById('staffEmail').value = email;
    // document.getElementById('staffPassword').value = password; // Only if you have this field
    
    // 2. Reset Dynamic Fields
    roleSelect.innerHTML = '<option>Loading...</option>';
    roomContainer.innerHTML = '<span style="color:#888;">Loading rooms...</span>';

    try {
        // 3. API Call 1: Meta Info
        const metaResponse = await fetch('/api/security_info');
        const metaData = await metaResponse.json();

        // 4. API Call 2: Assignments (only if editing)
        let assignedRoomIds = [];
        if (id) {
            const assignResponse = await fetch(`/api/user_assignments/${id}`);
            const assignData = await assignResponse.json();
            assignedRoomIds = assignData.assigned_rooms || [];
        }

        // --- A. Roles ---
        roleSelect.innerHTML = '';
        metaData.roles.forEach(r => {
            const option = document.createElement('option');
            option.value = r.name;
            option.innerText = r.name;
            if (r.name === role) option.selected = true;
            roleSelect.appendChild(option);
        });

        // --- B. Rooms (Checkboxes) ---
        roomContainer.innerHTML = '';
        metaData.rooms.forEach(room => {
            // 1. Create Container
            const div = document.createElement('div');
            div.className = 'checklist-item'; // Use CSS class

            // 2. Create Checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'assigned_rooms';
            checkbox.value = room.id;
            checkbox.id = `room_${room.id}`;
            checkbox.className = 'checklist-checkbox'; // Use CSS class

            if (assignedRoomIds.includes(room.id)) {
                checkbox.checked = true;
            }

            // 3. Create Label
            const label = document.createElement('label');
            label.htmlFor = `room_${room.id}`;
            label.innerText = `${room.room_id} - ${room.name}`;
            label.className = 'checklist-label'; // Use CSS class

            // 4. Assemble
            div.appendChild(checkbox);
            div.appendChild(label);
            roomContainer.appendChild(div);
        });

    } catch (error) {
        console.error(error);
        // Use a class for the error message too
        roomContainer.innerHTML = '<div class="checklist-error">Error loading data</div>';
    }

    // Change Title
    if (id) {
        title.innerText = "Edit Staff Member";
        document.getElementById('staffPassword').required = false;
    } else {
        title.innerText = "Add New Staff";
        document.getElementById('staffPassword').required = true;
    }

    modal.classList.add('active');
}

window.closeStaffModal = function() {
    document.getElementById('staffModal').classList.remove('active');
    document.getElementById('staffForm').reset();
}

// --- Submit Logic (Add/Edit) ---
document.getElementById('staffForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    const checkedRooms = formData.getAll('assigned_rooms');
    data.assigned_rooms = checkedRooms;
    
    // Determine if this is an Add or Edit based on hidden ID
    const endpoint = data.staffDbId ? '/api/staff/edit' : '/api/staff/add';

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            alert('Staff saved successfully!');
            location.reload(); // Reload to see changes
        } else {
            const err = await res.json();
            alert('Error: ' + err.error);
        }
    } catch (error) {
        console.error(error);
        alert('Failed to save staff.');
    }
});

// --- Delete Logic ---
window.deleteStaff = async function(id) {
    if (!confirm("Are you sure you want to delete this staff member? This cannot be undone.")) return;

    try {
        const res = await fetch('/api/staff/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });

        if (res.ok) {
            alert('Staff deleted.');
            location.reload();
        } else {
            alert('Error deleting staff.');
        }
    } catch (error) {
        console.error(error);
    }
}