import React from "react";
import { FiX, FiSend } from "react-icons/fi";

interface MessageComposerProps {
  patient: any;
  onClose: () => void;
}

export default function MessageComposer({ patient, onClose }: MessageComposerProps) {
  const [channel, setChannel] = React.useState("whatsapp");
  const [template, setTemplate] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const templates = [
    { id: "pickup", label: "Pickup Ready", text: "Your prescription is ready for pickup at HopeRx Pharmacy." },
    { id: "refill", label: "Refill Reminder", text: "Your prescription is due for refill. Please visit us soon." },
    { id: "custom", label: "Custom Message", text: "" }
  ];

  const handleTemplateChange = (templateId: string) => {
    setTemplate(templateId);
    const selected = templates.find(t => t.id === templateId);
    if (selected) {
      setMessage(selected.text);
    }
  };

  const handleSend = async () => {
    setSending(true);
    // Simulate API call
    setTimeout(() => {
      setSending(false);
      onClose();
      // Toast: Message sent to {patient.name}
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Send Message</h2>
            <p className="text-sm text-gray-500 mt-1">{patient.name} • {patient.maskedPhone}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Channel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Channel</label>
            <div className="flex gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer"
                style={{ borderColor: channel === "whatsapp" ? "#0ea5a3" : "#e5e7eb" }}>
                <input
                  type="radio"
                  name="channel"
                  value="whatsapp"
                  checked={channel === "whatsapp"}
                  onChange={(e) => setChannel(e.target.value)}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm font-medium">WhatsApp</span>
              </label>
              <label className="flex-1 flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer"
                style={{ borderColor: channel === "sms" ? "#0ea5a3" : "#e5e7eb" }}>
                <input
                  type="radio"
                  name="channel"
                  value="sms"
                  checked={channel === "sms"}
                  onChange={(e) => setChannel(e.target.value)}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm font-medium">SMS</span>
              </label>
            </div>
          </div>

          {/* Template */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
            <select
              value={template}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Select template</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Type your message..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">{message.length} characters</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!message || sending}
            className="px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <FiSend size={16} />
                Send Message
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
