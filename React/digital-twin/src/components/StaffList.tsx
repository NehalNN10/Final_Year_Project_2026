"use client";

import { useState, useEffect } from "react";
import StaffModal from "./StaffModal";

// It only needs the raw data from the main page now!
interface StaffListProps {
  staffList: any[];
  staffRooms?: any;
  department: string; // Passed down so the modal knows whether to show Rooms
}

export default function StaffList({ staffList, staffRooms, department }: StaffListProps) {
  // --- States moved from the main page! ---
  const [isStaffModalOpen, setStaffModalOpen] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [staffForm, setStaffForm] = useState({ 
    id: "", user_id: "", name: "", email: "", password: "", role: "", assigned_rooms: [] as string[] 
  });

  // Fetch roles and rooms just for this component
  useEffect(() => {
    if (department === "Security") {
      fetch("/api/security_info")
        .then(res => res.json())
        .then(data => {
          setAvailableRoles(data.roles || []);
          setAvailableRooms(data.rooms || []);
        });
    } else if (department === "Facilities") {
      fetch("/api/facility_info")
        .then(res => res.json())
        .then(data => {
          setAvailableRoles(data.roles || []);
        });
    }
  }, [department]); // <-- Add 'department' to the dependency array

  // --- Functions moved from the main page! ---
  const openStaffModal = async (staff: any = null) => {
    if (staff) {
      setStaffForm({ ...staff, password: "", assigned_rooms: [] });
      const res = await fetch(`/api/user_assignments/${staff.id}`);
      const data = await res.json();
      setStaffForm(prev => ({ ...prev, assigned_rooms: data.assigned_rooms || [] }));
    } else {
      setStaffForm({ id: "", user_id: "", name: "", email: "", password: "", role: "", assigned_rooms: [] });
    }
    setStaffModalOpen(true);
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(staffForm.id ? '/api/staff/edit' : '/api/staff/add', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffDbId: staffForm.id, ...staffForm })
    });
    if (res.ok) window.location.reload();
    else alert('Error saving staff.');
  };

  const deleteStaff = async (id: string) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return;
    const res = await fetch('/api/staff/delete', { 
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) 
    });
    if (res.ok) window.location.reload();
  };

  const toggleRoom = (roomId: string) => {
    setStaffForm(p => ({ 
      ...p, assigned_rooms: p.assigned_rooms.includes(roomId) 
        ? p.assigned_rooms.filter(id => id !== roomId) 
        : [...p.assigned_rooms, roomId] 
    }));
  };

  return (
    <>
      {/* The List UI */}
      <div className="tracker-ui scroll outer box min-w-90">
        <div className="row mt-0! font-bold">
          <h3>Staff Information</h3>
          <button className="btn btn-blue btn-auto m-0!" onClick={() => openStaffModal()}>
            <h4>Add Staff</h4>
          </button>
        </div>
        <div className="flex flex-wrap items-stretch gap-2 mt-4">
            {staffList.map(staff => (
            <div key={staff.id} className="tracker-ui mt-4 p-4! flex-1 min-w-78">
                <div className="row m-0! font-bold">
                <h4 className="m-0 flex-5">{staff.name}</h4>
                <div className="row m-0! gap-2 flex-2 justify-end!">
                    <button className="btn btn-yellow btn-list m-0!" onClick={() => openStaffModal(staff)}>✏️</button>
                    <button className="btn btn-red btn-list m-0!" onClick={() => deleteStaff(staff.id)}>🗑️</button>
                </div>
                </div>
                <div><span className="text-[#999]">{staff.user_id} - {staff.email} <br/> {staff.role}</span></div>
                {staffRooms && (
                <>
                    <div className="mt-2">
                    <span>Rooms Assigned: </span>
                    <span className="text-[#999]">{staffRooms[staff.user_id]?.length > 0 ? staffRooms[staff.user_id].join(", ") : "N/A"}</span>
                    </div>
                </>
                )}
            </div>
            ))}
        </div>
      </div>

      {/* The Modal perfectly encapsulated inside the component! */}
      {isStaffModalOpen && (
        <StaffModal 
          onClose={() => setStaffModalOpen(false)}
          onSubmit={handleStaffSubmit}
          staffForm={staffForm}
          setStaffForm={setStaffForm}
          availableRoles={availableRoles}
          availableRooms={availableRooms}
        />
      )}
    </>
  );
}