import React from "react";

interface PatientAvatarProps {
  name?: string; // Make name optional
}

export default function PatientAvatar({ name }: PatientAvatarProps) {
  // Handle undefined/null names
  const safeName = name || "Unknown";

  const initials = safeName
    .split(" ")
    .map((n) => n[0] || "")
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500"
  ];

  const colorIndex = safeName.charCodeAt(0) % colors.length;

  return (
    <div className={`w-10 h-10 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white text-sm font-medium`}>
      {initials}
    </div>
  );
}
