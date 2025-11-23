"use client"
import { FiTrendingUp, FiAlertCircle, FiCheckCircle, FiEdit2, FiShoppingCart } from 'react-icons/fi';
import { BsLightningChargeFill } from 'react-icons/bs';

interface ForecastTableProps {
  forecastWindow: '7' | '14' | '30' | '60' | '90';
  onSelectSKU: (sku: any) => void;
  selectedSKU: any;
}

export default function ForecastTable({ forecastWindow, onSelectSKU, selectedSKU }: ForecastTableProps) {
  const loading = true; // Default to loading state

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
            <tr>
              <th className="px-6 py-3">Product Name</th>
              <th className="px-6 py-3">Current Stock</th>
              <th className="px-6 py-3">Avg. Daily Sales</th>
              <th className="px-6 py-3">Predicted Demand (30d)</th>
              <th className="px-6 py-3">Reorder Suggestion</th>
              <th className="px-6 py-3">Confidence</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              // Loading rows
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-100 rounded"></div></td>
                  <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-100 rounded"></div></td>
                  <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-100 rounded"></div></td>
                  <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded"></div></td>
                  <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-100 rounded"></div></td>
                  <td className="px-6 py-4"><div className="h-4 w-12 bg-gray-100 rounded"></div></td>
                  <td className="px-6 py-4"><div className="h-8 w-20 bg-gray-100 rounded ml-auto"></div></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No forecast data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
