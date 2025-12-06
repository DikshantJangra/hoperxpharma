'use client';

import { useState, useEffect } from 'react';
import {
  FaWhatsapp, FaCheckCircle, FaExclamationTriangle, FaPlug,
  FaKey, FaSync, FaUnlink, FaUsers, FaBolt, FaChartLine
} from 'react-icons/fa';
import { whatsappApi, WhatsAppConnection } from '@/lib/api/whatsapp';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import ConnectModal from '@/components/integrations/whatsapp/ConnectModal';
import PhoneVerificationModal from '@/components/integrations/whatsapp/PhoneVerificationModal';
import ManualSetupModal from '@/components/integrations/whatsapp/ManualSetupModal';
import TemplateManager from '@/components/integrations/whatsapp/TemplateManager';

const StatCard = ({ icon, label, value, color = 'blue' }: any) => {
  const colors: any = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  };
  const colorClass = colors[color];

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center gap-3">
        <div className={`p-2 ${colorClass.bg} rounded-lg`}>
          {icon}
        </div>
        <div>
          <div className="text-sm text-gray-600">{label}</div>
          <div className="text-xl font-semibold text-gray-900">{value}</div>
        </div>
      </div>
    </div>
  );
};

export default function WhatsAppIntegrationPage() {
  const [connection, setConnection] = useState<WhatsAppConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showManualSetup, setShowManualSetup] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);

  const { storeId, loading: storeLoading } = useCurrentStore();

  useEffect(() => {
    if (storeId) {
      loadConnection();
    }
  }, [storeId]);

  const loadConnection = async () => {
    if (!storeId) return;

    try {
      const status = await whatsappApi.getStatus(storeId);
      setConnection(status);

      if (status.status === 'NEEDS_VERIFICATION') {
        setShowPhoneVerification(true);
      }
    } catch (error) {
      console.error('Failed to load connection:', error);
      setConnection({ connected: false, status: 'DISCONNECTED' });
    } finally {
      setLoading(false);
    }
  };

  const handleConnectSuccess = () => {
    setShowConnectModal(false);
    loadConnection();
  };

  const handleVerificationSuccess = () => {
    setShowPhoneVerification(false);
    loadConnection();
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect WhatsApp? Staff will no longer be able to send messages.')) {
      return;
    }

    try {
      await whatsappApi.disconnect(storeId!);
      loadConnection();
    } catch (error: any) {
      alert(`Failed to disconnect: ${error.message}`);
    }
  };

  if (loading || storeLoading || !storeId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f7fafc]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const isConnected = connection?.status === 'ACTIVE';

  return (
    <div className="p-6 bg-[#f7fafc] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">WhatsApp Business</h1>
          <p className="text-[#6b7280] mt-2">Connect and manage your pharmacy's WhatsApp integration</p>
        </div>
        {!isConnected && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowManualSetup(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
            >
              <FaKey className="h-4 w-4" />
              Manual Setup
            </button>
            <button
              onClick={() => setShowConnectModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 transition-colors"
            >
              <FaPlug className="h-4 w-4" />
              Connect WhatsApp
            </button>
          </div>
        )}
      </div>

      {/* Connection Status Card */}
      {!isConnected ? (
        // Not Connected State
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
          <div className="max-w-3xl mx-auto text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <FaWhatsapp className="w-8 h-8 text-green-600" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-[#0f172a] mb-2">
              Connect WhatsApp Business
            </h2>
            <p className="text-gray-600 mb-8">
              Enable real-time patient communication directly from HopeRx.
              Your staff can send and receive messages without leaving the platform.
            </p>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <StatCard
                icon={<FaUsers className="h-5 w-5" />}
                label="Multi-User Access"
                value="Shared"
                color="blue"
              />
              <StatCard
                icon={<FaBolt className="h-5 w-5" />}
                label="Template Messages"
                value="Enabled"
                color="purple"
              />
              <StatCard
                icon={<FaChartLine className="h-5 w-5" />}
                label="Analytics"
                value="Track"
                color="green"
              />
            </div>

            {/* Warning Banner */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3 text-left">
                <FaExclamationTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-yellow-900 mb-1 text-sm">
                    WhatsApp Not Connected
                  </h3>
                  <p className="text-xs text-yellow-800">
                    Staff cannot send or receive messages until you connect a WhatsApp Business Account.
                    Messages will appear under <strong>Messages → WhatsApp</strong> once connected.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Connected State
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    Connected & Active
                    <FaCheckCircle className="w-5 h-5 text-green-600" />
                  </h2>
                  {connection.phoneNumber && (
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {connection.phoneNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => loadConnection()}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
              >
                <FaSync className="h-4 w-4" />
                Refresh
              </button>
              <button
                onClick={handleDisconnect}
                className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 text-sm font-medium rounded-md hover:bg-red-50 transition-colors"
              >
                <FaUnlink className="h-4 w-4" />
                Disconnect
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Business Name</p>
              <p className="text-base font-semibold text-gray-900">
                {connection.businessName || 'Not set'}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Verification</p>
              <p className="text-base font-semibold">
                {connection.businessVerified ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <FaCheckCircle className="w-4 h-4" />
                    Verified
                  </span>
                ) : (
                  <span className="text-yellow-600">Pending</span>
                )}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Last Webhook</p>
              <p className="text-base font-semibold text-gray-900">
                {connection.lastWebhookAt
                  ? new Date(connection.lastWebhookAt).toLocaleString()
                  : 'Never'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Template Manager (only if connected) */}
      {isConnected && storeId && (
        <TemplateManager storeId={storeId} />
      )}

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
        <h3 className="font-semibold text-blue-900 mb-3 text-lg">
          Quick Setup Guide
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 mb-4">
          <li>Click "Connect WhatsApp" and log in with Facebook</li>
          <li>Verify your phone number via SMS or voice OTP</li>
          <li>Complete Business Verification (if required for advanced features)</li>
          <li>Staff can now reply to messages under Messages → WhatsApp</li>
        </ol>
        <p className="text-xs text-blue-700">
          Need help? <a href="/help" className="underline hover:no-underline font-medium">View full documentation</a>
        </p>
      </div>

      {/* Modals */}
      {showConnectModal && storeId && (
        <ConnectModal
          storeId={storeId}
          onClose={() => setShowConnectModal(false)}
          onSuccess={handleConnectSuccess}
        />
      )}

      {showManualSetup && storeId && (
        <ManualSetupModal
          storeId={storeId}
          onClose={() => setShowManualSetup(false)}
          onSuccess={handleConnectSuccess}
        />
      )}

      {showPhoneVerification && connection?.phoneNumber && storeId && (
        <PhoneVerificationModal
          storeId={storeId}
          phoneNumber={connection.phoneNumber}
          onClose={() => setShowPhoneVerification(false)}
          onSuccess={handleVerificationSuccess}
        />
      )}
    </div>
  );
}
