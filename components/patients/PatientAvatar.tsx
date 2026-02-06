import React from "react";

interface PatientAvatarProps {
  name?: string;
  src?: string;
}

export default function PatientAvatar({ name, src }: PatientAvatarProps) {
  const safeName = name || "Unknown";

  if (src) {
    return (
      <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 shadow-sm">
        <img src={src} alt={safeName} className="w-full h-full object-cover" />
      </div>
    );
  }

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

  const colorIndex = safeName.length > 0 ? safeName.charCodeAt(0) % colors.length : 0;

  return (
    <div className={`w-10 h-10 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white text-xs font-black tracking-tighter shadow-inner`}>
      {initials}
    </div>
  );
}
