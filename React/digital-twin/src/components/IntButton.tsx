"use client";

interface IntButtonProps {
  icon: React.ElementType; // Type for the Lucide icons
  label: string;
  onClick: () => void;
  isActive?: boolean;
  classes?: string;
}

export default function IntButton ({ icon: Icon, label, onClick, isActive = false, classes = "" }: IntButtonProps){
  return (
    <button className={`group ${isActive ? "selected" : ""} ${classes}`} onClick={onClick}>
      <Icon size="20" />
      <span className={`btn-base ${isActive ? "btn-inactive" : "btn-active"}`}> {label}</span>
    </button>
  );
};