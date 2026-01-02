'use client';

import { useState, useEffect } from 'react';
import { FiX, FiMail, FiEye, FiSend, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

interface InvoiceEmailModalProps {
    isOpen: boolean;
    invoice: any;
    onClose: () => void;
}

// Helper to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };
};

export default function InvoiceEmailModal({ isOpen, invoice, onClose }: InvoiceEmailModalProps) {
    const [recipientEmail, setRecipientEmail] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [emailHtml, setEmailHtml] = useState('');

    useEffect(() => {
        if (isOpen && invoice) {
            // Try to get customer email from invoice
            const customerEmail = invoice.customer?.email || '';
            setRecipientEmail(customerEmail);

            // Generate email HTML
            generateInvoiceEmail();
        }
    }, [isOpen, invoice]);

    const generateInvoiceEmail = () => {
        if (!invoice) return;

        // Build items HTML
        const itemsHtml = invoice.items.map((item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #0f172a;">
          <strong>${item.name}</strong><br/>
          <span style="font-size: 12px; color: #64748b;">${item.strength} • ${item.pack}</span><br/>
          <span style="font-size: 11px; color: #64748b;">Batch: ${item.batch} | Exp: ${item.expiry} | GST: ${item.gst}%</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 14px; color: #0f172a;">${item.qty}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 14px; color: #0f172a;">₹${item.price}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 14px; font-weight: 600; color: #0f172a;">₹${item.total}</td>
      </tr>
    `).join('');

        // Build payment modes HTML
        const paymentModesHtml = invoice.paymentModes.map((pm: any) => `
      <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px;">
        <span style="color: #64748b;">${pm.mode}</span>
        <span style="color: #0f172a; font-weight: 500;">₹${pm.amount}</span>
      </div>
    `).join('');

        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.id}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Invoice</h1>
              <p style="margin: 8px 0 0 0; color: #d1fae5; font-size: 16px;">#${invoice.id}</p>
            </td>
          </tr>

          <!-- Invoice Details -->
          <tr>
            <td style="padding: 30px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding-bottom: 16px;">
                    <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Date</p>
                    <p style="margin: 0; font-size: 14px; color: #0f172a; font-weight: 500;">${invoice.date} at ${invoice.time}</p>
                  </td>
                  <td style="padding-bottom: 16px; text-align: right;">
                    <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Status</p>
                    <span style="display: inline-block; padding: 4px 12px; background-color: #d1fae5; color: #065f46; border-radius: 12px; font-size: 12px; font-weight: 600;">${invoice.status}</span>
                  </td>
                </tr>
              </table>

              <!-- Customer Details -->
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Customer Details</h3>
                <p style="margin: 0 0 8px 0; font-size: 16px; color: #0f172a; font-weight: 600;">${invoice.customer.name}</p>
                ${invoice.customer.phone && invoice.customer.phone !== '-' ? `<p style="margin: 0 0 4px 0; font-size: 14px; color: #64748b;">${invoice.customer.phone}</p>` : ''}
                ${invoice.type === 'GST' && invoice.customer.gstin ? `<p style="margin: 0; font-size: 12px; color: #64748b;">GSTIN: ${invoice.customer.gstin}</p>` : ''}
              </div>

              <!-- Items Table -->
              <h3 style="margin: 0 0 16px 0; font-size: 14px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Items (${invoice.items.length})</h3>
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f8fafc;">
                    <th style="padding: 12px; text-align: left; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Item</th>
                    <th style="padding: 12px; text-align: center; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
                    <th style="padding: 12px; text-align: right; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Rate</th>
                    <th style="padding: 12px; text-align: right; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Summary -->
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px;">
                  <span style="color: #64748b;">Subtotal</span>
                  <span style="color: #0f172a;">₹${invoice.summary.subtotal}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px;">
                  <span style="color: #64748b;">Discount</span>
                  <span style="color: #10b981;">-₹${invoice.summary.discount}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px;">
                  <span style="color: #64748b;">GST</span>
                  <span style="color: #0f172a;">₹${invoice.summary.gst}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
                  <span style="color: #64748b;">Round-off</span>
                  <span style="color: #0f172a;">${invoice.summary.roundOff < 0 ? '-' : ''}₹${Math.abs(invoice.summary.roundOff)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding-top: 12px; font-size: 18px;">
                  <span style="color: #0f172a; font-weight: 700;">Total</span>
                  <span style="color: #10b981; font-weight: 700;">₹${invoice.amount}</span>
                </div>
              </div>

              <!-- Payment Details -->
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #166534; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Payment Details</h3>
                ${paymentModesHtml}
              </div>

              ${invoice.hasRx ? `
              <!-- Prescription Info -->
              <div style="background-color: #dbeafe; border: 1px solid #93c5fd; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 14px; color: #1e40af; font-weight: 600;">✓ Prescription Linked</p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #1e40af;">ID: ${invoice.prescriptionId?.substring(0, 20)}...</p>
              </div>
              ` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0; font-size: 16px; color: #0f172a; font-weight: 600;">Thank you for your business!</p>
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #64748b;">If you have any questions, please contact us.</p>
              <div style="font-size: 12px; color: #94a3b8; line-height: 1.6;">
                <p style="margin: 0;">This is a computer-generated invoice.</p>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

        setEmailHtml(html);
    };

    const handleSend = async () => {
        if (!recipientEmail) {
            setError('Please enter a recipient email address');
            return;
        }

        setError(null);
        setSending(true);

        try {
            const response = await fetch('/api/v1/email/send', {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({
                    to: recipientEmail,
                    subject: `Invoice ${invoice.id} - ${invoice.customer.name}`,
                    bodyHtml: emailHtml,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to send email');
            }

            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setRecipientEmail('');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to send email');
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-[#e2e8f0] flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-[#0f172a]">Email Invoice</h2>
                        <p className="text-sm text-[#64748b] mt-1">Send invoice {invoice?.id} to customer</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[#f1f5f9] rounded-lg transition-colors"
                    >
                        <FiX className="w-5 h-5 text-[#64748b]" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {showPreview ? (
                        /* Email Preview */
                        <div>
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="font-semibold text-[#0f172a]">Email Preview</h3>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="text-sm text-[#10b981] hover:text-[#059669] font-medium"
                                >
                                    ← Back to form
                                </button>
                            </div>
                            <div className="border border-[#e2e8f0] rounded-lg overflow-hidden">
                                <div dangerouslySetInnerHTML={{ __html: emailHtml }} />
                            </div>
                        </div>
                    ) : (
                        /* Email Form */
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-[#0f172a] mb-2">
                                    Recipient Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={recipientEmail}
                                    onChange={(e) => setRecipientEmail(e.target.value)}
                                    placeholder="customer@example.com"
                                    className="w-full px-4 py-2.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                                />
                                {!recipientEmail && invoice?.customer?.phone && (
                                    <p className="text-xs text-[#64748b] mt-1">
                                        Customer phone: {invoice.customer.phone} (email not available)
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#0f172a] mb-2">Subject</label>
                                <input
                                    type="text"
                                    value={`Invoice ${invoice?.id} - ${invoice?.customer?.name}`}
                                    disabled
                                    className="w-full px-4 py-2.5 border border-[#e2e8f0] rounded-lg bg-[#f8fafc] text-[#64748b]"
                                />
                            </div>

                            <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <FiCheckCircle className="w-5 h-5 text-[#10b981] mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-[#0f172a] mb-1">Professional invoice email ready</p>
                                        <p className="text-xs text-[#64748b]">
                                            Includes all invoice details, itemized list, GST breakdown, and payment information
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowPreview(true)}
                                className="w-full px-4 py-2 border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] transition-colors flex items-center justify-center gap-2 text-sm font-medium text-[#64748b]"
                            >
                                <FiEye className="w-4 h-4" />
                                Preview Email
                            </button>

                            {error && (
                                <div className="p-4 bg-[#fee2e2] border border-[#ef4444] rounded-lg flex items-start gap-2">
                                    <FiAlertCircle className="w-5 h-5 text-[#ef4444] mt-0.5 shrink-0" />
                                    <p className="text-sm text-[#dc2626]">{error}</p>
                                </div>
                            )}

                            {success && (
                                <div className="p-4 bg-[#d1fae5] border border-[#10b981] rounded-lg flex items-start gap-2">
                                    <FiCheckCircle className="w-5 h-5 text-[#10b981] mt-0.5 shrink-0" />
                                    <p className="text-sm text-[#065f46]">Email sent successfully!</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!showPreview && (
                    <div className="p-6 border-t border-[#e2e8f0] flex gap-3 shrink-0 bg-[#f8fafc]">
                        <button
                            onClick={onClose}
                            disabled={sending}
                            className="flex-1 px-4 py-2 border border-[#e2e8f0] text-[#64748b] bg-white rounded-lg hover:bg-[#f8fafc] transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={sending || !recipientEmail}
                            className="flex-1 px-4 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {sending ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <FiSend className="w-4 h-4" />
                                    Send Invoice
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
