import React from "react";
import { FiClock, FiCheckCircle, FiXCircle } from "react-icons/fi";

interface TodayCardProps {
  timings: any;
}

export default function TodayCard({ timings }: TodayCardProps) {
  // Mock current status - in real app, call isOpen API
  const isOpen = true;
  const currentTime = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const nextChange = "20:00";

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <FiClock className="text-gray-400" size={18} />
        <h3 className="text-sm font-semibold text-gray-900">Today's Status</h3>
      </div>

      <div className="space-y-3">
        {/* Current Status */}
        <div className={`flex items-center gap-3 p-4 rounded-lg ${
          isOpen ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
        }`}>
          {isOpen ? (
            <FiCheckCircle className="text-green-600" size={24} />
          ) : (
            <FiXCircle className="text-red-600" size={24} />
          )}
          <div className="flex-1">
            <p className={`text-sm font-semibold ${isOpen ? "text-green-900" : "text-red-900"}`}>
              {isOpen ? "Currently Open" : "Currently Closed"}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">As of {currentTime}</p>
          </div>
        </div>

        {/* Next Change */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{isOpen ? "Closes at" : "Opens at"}</span>
          <span className="font-semibold text-gray-900">{nextChange}</span>
        </div>

        {/* Today's Hours */}
        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Today's Hours</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Morning</span>
              <span className="font-medium text-gray-900">09:00 – 13:00</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Evening</span>
              <span className="font-medium text-gray-900">17:00 – 20:00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
