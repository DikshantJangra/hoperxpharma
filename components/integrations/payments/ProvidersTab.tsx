"use client";
import { useState } from "react";
import { FiCheckCircle, FiXCircle, FiSettings, FiTrendingUp } from "react-icons/fi";

const providers = [
  { id: "razorpay", name: "Razorpay", logo: "🔷", connected: true, settlement: "T+1", fees: "1.5% CC, 0% UPI", uptime: 99.8, limit: "₹5L/day" },
  { id: "paytm", name: "Paytm PG", logo: "💙", connected: false, settlement: "T+2", fees: "1.8% CC, 0% UPI", uptime: 98.5, limit: "₹3L/day" },
  { id: "phonepe", name: "PhonePe PG", logo: "💜", connected: true, settlement: "T+1", fees: "1.6% CC, 0% UPI", uptime: 99.2, limit: "₹10L/day" },
  { id: "cashfree", name: "Cashfree", logo: "🟢", connected: false, settlement: "T+1", fees: "1.5% CC, 0% UPI", uptime: 99.5, limit: "₹5L/day" },
  { id: "bharatpe", name: "BharatPe QR", logo: "🔵", connected: true, settlement: "T+1", fees: "0% UPI", uptime: 99.9, limit: "Unlimited" },
  { id: "gpay", name: "Google Pay Business", logo: "🟡", connected: true, settlement: "Instant", fees: "0% UPI", uptime: 99.7, limit: "₹1L/txn" },
  { id: "hdfc_pos", name: "HDFC POS", logo: "🏦", connected: true, settlement: "T+2", fees: "1.2% CC/DC", uptime: 99.0, limit: "₹2L/txn" },
  { id: "simpl", name: "Simpl UPI AutoPay", logo: "⚡", connected: false, settlement: "T+1", fees: "1% + ₹2", uptime: 98.8, limit: "₹15K/txn" },
];

export default function ProvidersTab() {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {providers.map((provider) => (
        <div
          key={provider.id}
          className={`bg-white border-2 rounded-lg p-5 hover:shadow-lg transition-all cursor-pointer ${
            provider.connected ? "border-green-200" : "border-gray-200"
          }`}
          onClick={() => setSelectedProvider(provider.id)}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{provider.logo}</span>
              <div>
                <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                <span className="text-xs text-gray-500">{provider.settlement}</span>
              </div>
            </div>
            {provider.connected ? (
              <FiCheckCircle size={20} className="text-green-600" />
            ) : (
              <FiXCircle size={20} className="text-gray-400" />
            )}
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Fees</span>
              <span className="font-medium text-gray-900">{provider.fees}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Uptime</span>
              <span className="font-medium text-green-600">{provider.uptime}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Limit</span>
              <span className="font-medium text-gray-900">{provider.limit}</span>
            </div>
          </div>

          {provider.connected ? (
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
              <FiSettings size={16} />
              Manage
            </button>
          ) : (
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium">
              <FiTrendingUp size={16} />
              Connect
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
