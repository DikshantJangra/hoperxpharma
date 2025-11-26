'use client';

import React from 'react';
import { PurchaseOrder } from '@/types/po';
import { HiOutlineDocumentText, HiOutlinePrinter, HiOutlinePaperAirplane } from 'react-icons/hi2';

interface POSummaryProps {
  po: PurchaseOrder;
}

export default function POSummary({ po }: POSummaryProps) {
  const formatCurrency = (amount: number | string) => `₹${Number(amount || 0).toFixed(2)}`;

  const needsApproval = po.total > (po.approvalThreshold || 50000);

  return (
    <div className="space-y-4">
      {/* PO Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-semibold text-gray-800">Order Summary</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Items ({po.lines.length})</span>
            <span className="text-gray-900 font-medium">{formatCurrency(po.subtotal)}</span>
          </div>

          {po.taxBreakdown.map((tax) => (
            <div key={tax.gstPercent} className="flex justify-between text-sm">
              <span className="text-gray-500">GST {tax.gstPercent}%</span>
              <span className="text-gray-900 font-medium">{formatCurrency(tax.tax)}</span>
            </div>
          ))}

          <div className="border-t border-dashed border-gray-200 pt-4 mt-2">
            <div className="flex justify-between items-end">
              <span className="text-gray-900 font-semibold text-lg">Total</span>
              <span className="text-emerald-600 font-bold text-2xl">{formatCurrency(po.total)}</span>
            </div>
          </div>

          {needsApproval && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg flex gap-3">
              <div className="shrink-0 mt-0.5 text-amber-600">
                {/* Icon could go here */}
              </div>
              <div>
                <div className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
                  Approval Required
                </div>
                <div className="text-xs text-amber-700 mt-1">
                  Total exceeds {formatCurrency(po.approvalThreshold || 50000)} limit.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Supplier Info */}
      {po.supplier && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-800">Supplier Details</h3>
          </div>
          <div className="p-4 space-y-2">
            <div>
              <div className="text-sm font-medium text-gray-900">{po.supplier.name}</div>
              {po.supplier.gstin && (
                <div className="text-xs text-gray-500">GSTIN: {po.supplier.gstin}</div>
              )}
            </div>

            {po.supplier.contact.email && (
              <div className="text-xs text-gray-600">
                Email: {po.supplier.contact.email}
              </div>
            )}

            {po.supplier.contact.phone && (
              <div className="text-xs text-gray-600">
                Phone: {po.supplier.contact.phone}
              </div>
            )}

            <div className="text-xs text-gray-500 mt-2">
              Lead time: {po.supplier.defaultLeadTimeDays} days
            </div>

            {po.paymentTerms && (
              <div className="text-xs text-gray-500">
                Payment: {po.paymentTerms}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delivery Info */}
      {po.expectedDeliveryDate && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-800">Delivery</h3>
          </div>
          <div className="p-4">
            <div className="text-sm text-gray-600">Expected Date</div>
            <div className="text-sm font-medium text-gray-900">
              {new Date(po.expectedDeliveryDate).toLocaleDateString()}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-800">Quick Actions</h3>
        </div>
        <div className="p-4 space-y-2">
          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
            <HiOutlineDocumentText className="h-4 w-4" />
            Preview PDF
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
            <HiOutlinePrinter className="h-4 w-4" />
            Print PO
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
            <HiOutlinePaperAirplane className="h-4 w-4" />
            Send via WhatsApp
          </button>
        </div>
      </div>

      {/* Status */}
      {po.status !== 'draft' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-800">Status</h3>
          </div>
          <div className="p-4">
            <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${po.status === 'sent' ? 'bg-green-100 text-green-800' :
              po.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                po.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
              }`}>
              {po.status.replace('_', ' ').toUpperCase()}
            </div>

            {po.poId && (
              <div className="text-xs text-gray-500 mt-2">
                PO ID: {po.poId}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}