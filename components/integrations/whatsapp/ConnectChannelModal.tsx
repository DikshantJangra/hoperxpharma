'use client';

import { useState } from 'react';
import { FiX, FiCheckCircle } from 'react-icons/fi';
import { SiWhatsapp, SiTwilio } from 'react-icons/si';

export default function ConnectChannelModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [provider, setProvider] = useState<'meta' | 'twilio' | '360dialog' | null>(null);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-[#e2e8f0]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[#0f172a]">Connect WhatsApp Channel</h3>
              <p className="text-sm text-[#64748b]">Step {step} of 5</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-[#f1f5f9] rounded">
              <FiX className="w-5 h-5 text-[#64748b]" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div>
              <h4 className="font-semibold text-[#0f172a] mb-4">Choose Provider</h4>
              <div className="space-y-3">
                {[
                  { id: 'meta', name: 'Meta (WhatsApp Business)', icon: SiWhatsapp, color: 'text-[#25d366]', desc: 'Direct integration with Meta' },
                  { id: 'twilio', name: 'Twilio', icon: SiTwilio, color: 'text-[#f22f46]', desc: 'Use Twilio WhatsApp API' },
                  { id: '360dialog', name: '360dialog', icon: SiWhatsapp, color: 'text-[#0ea5a3]', desc: 'Official WhatsApp BSP' },
                ].map(p => (
                  <button key={p.id} onClick={() => { setProvider(p.id as any); setStep(2); }} className={`w-full p-4 border-2 rounded-lg text-left hover:border-[#0ea5a3] transition-colors ${
                      provider === p.id ? 'border-[#0ea5a3] bg-[#f0fdfa]' : 'border-[#e2e8f0]'
                    }`}>
                    <div className="flex items-center gap-3">
                      <p.icon className={`w-8 h-8 ${p.color}`} />
                      <div>
                        <div className="font-semibold text-[#0f172a]">{p.name}</div>
                        <div className="text-sm text-[#64748b]">{p.desc}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h4 className="font-semibold text-[#0f172a] mb-4">Enter API Credentials</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#64748b] mb-2">API Key</label>
                  <input type="text" placeholder="Enter your API key" className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#64748b] mb-2">API Secret</label>
                  <input type="password" placeholder="Enter your API secret" className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#64748b] mb-2">Phone Number ID</label>
                  <input type="text" placeholder="Enter phone number ID" className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-sm" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h4 className="font-semibold text-[#0f172a] mb-4">Verify Phone Number</h4>
              <div className="text-center py-8">
                <div className="w-32 h-32 bg-[#f1f5f9] rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <span className="text-[#64748b]">QR Code</span>
                </div>
                <p className="text-sm text-[#64748b] mb-4">Scan this QR code with your WhatsApp Business app</p>
                <div className="text-xs text-[#94a3b8]">Or enter verification code manually</div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h4 className="font-semibold text-[#0f172a] mb-4">Configure Webhooks</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#64748b] mb-2">Webhook URL</label>
                  <input type="text" value="https://hoperxpharma.com/api/webhooks/whatsapp" readOnly className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg bg-[#f8fafc] text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#64748b] mb-2">Verify Token</label>
                  <input type="text" value="hoperx_verify_token_2024" readOnly className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg bg-[#f8fafc] text-sm" />
                </div>
                <div className="p-3 bg-[#f0fdfa] border border-[#0ea5a3] rounded-lg">
                  <div className="flex items-start gap-2">
                    <FiCheckCircle className="w-4 h-4 text-[#0ea5a3] mt-0.5" />
                    <div className="text-xs text-[#0f172a]">
                      Copy these values to your provider's webhook configuration
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-[#d1fae5] rounded-full mx-auto mb-4 flex items-center justify-center">
                <FiCheckCircle className="w-8 h-8 text-[#065f46]" />
              </div>
              <h4 className="font-semibold text-[#0f172a] mb-2">Channel Connected!</h4>
              <p className="text-sm text-[#64748b] mb-6">Your WhatsApp channel is now ready to use</p>
              <div className="bg-[#f8fafc] rounded-lg p-4 text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Provider:</span>
                    <span className="font-semibold text-[#0f172a]">Meta</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Phone:</span>
                    <span className="font-semibold text-[#0f172a]">+91 98765 43210</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Status:</span>
                    <span className="font-semibold text-[#10b981]">Connected</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-[#e2e8f0] flex items-center justify-between">
          <button onClick={() => step > 1 ? setStep(step - 1) : onClose()} className="px-4 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] text-sm font-medium">
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map(s => (
              <div key={s} className={`w-2 h-2 rounded-full ${s <= step ? 'bg-[#0ea5a3]' : 'bg-[#e2e8f0]'}`} />
            ))}
          </div>
          <button onClick={() => step < 5 ? setStep(step + 1) : onClose()} className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] text-sm font-medium">
            {step === 5 ? 'Done' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
