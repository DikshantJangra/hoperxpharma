'use client';

import { useState, useEffect } from 'react';
import { FaWhatsapp, FaCheckCircle, FaExclamationTriangle, FaPlug, FaCog, FaKey } from 'react-icons/fa';
import { whatsappApi, WhatsAppConnection } from '@/lib/api/whatsapp';
import ConnectModal from '@/components/integrations/whatsapp/ConnectModal';
import PhoneVerificationModal from '@/components/integrations/whatsapp/PhoneVerificationModal';
import ManualSetupModal from '@/components/integrations/whatsapp/ManualSetupModal';
import TemplateManager from '@/components/integrations/whatsapp/TemplateManager';

export default function WhatsAppIntegrationPage() {
  const [connection, setConnection] = useState<WhatsAppConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showManualSetup, setShowManualSetup] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);

  // TODO: Get from user context
  const storeId = 'store-id-placeholder';

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

      // Auto-show verification modal if needed
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
      await whatsappApi.disconnect(storeId);
      loadConnection();
    } catch (error: any) {
      alert(`Failed to disconnect: ${error.message}`);
    }
  };

  if (loading || !storeId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const isConnected = connection?.status === 'ACTIVE';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
            <FaWhatsapp className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            WhatsApp Business Integration
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Connect your pharmacy's WhatsApp to message patients directly from HopeRx
        </p>
      </div>

      {/* Connection Status Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Connection Status
            </h2>
            {isConnected && connection.phoneNumber && (
              <div className="flex items-center gap-3">
                <FaCheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Connected Number</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {connection.phoneNumber}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {isConnected ? (
              <>
                <button
                  onClick={() => loadConnection()}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  Refresh
                </button>
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-sm font-medium"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowManualSetup(true)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <FaKey className="w-4 h-4" />
                  Manual Setup
                </button>
                <button
                  onClick={() => setShowConnectModal(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <FaPlug className="w-4 h-4" />
                  Connect WhatsApp
                </button>
              </>
            )}
          </div>
        </div>

        {/* Status Details */}
        {!isConnected && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FaExclamationTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-900 dark:text-yellow-200 mb-1">
                  WhatsApp Not Connected
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  Connect your WhatsApp Business Account to start messaging patients from HopeRx.
                  Staff will be able to view and reply to messages under Messages → WhatsApp.
                </p>
              </div>
            </div>
          </div>
        )}

        {isConnected && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Business Name</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {connection.businessName || 'Not set'}
              </p>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Verification Status</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {connection.businessVerified ? (
                  <span className="text-green-600 dark:text-green-400">✓ Verified</span>
                ) : (
                  <span className="text-yellow-600 dark:text-yellow-400">Pending</span>
                )}
              </p>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last Webhook</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {connection.lastWebhookAt
                  ? new Date(connection.lastWebhookAt).toLocaleString()
                  : 'Never'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Template Manager (only if connected) */}
      {isConnected && (
        <TemplateManager storeId={storeId} />
      )}

      {/* Help Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mt-6">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
          <FaCog className="w-5 h-5" />
          Quick Setup Guide
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-300">
          <li>Click "Connect WhatsApp" and log in with Facebook</li>
          <li>Verify your phone number via SMS or voice OTP</li>
          <li>Complete Business Verification (if required for advanced features)</li>
          <li>Staff can now reply to messages under Messages → WhatsApp</li>
        </ol>
        <p className="mt-4 text-xs text-blue-700 dark:text-blue-400">
          Need help? <a href="/help" className="underline hover:no-underline">View full documentation</a>
        </p>
      </div>

      {/* Modals */}
      {showConnectModal && (
        <ConnectModal
          storeId={storeId}
          onClose={() => setShowConnectModal(false)}
          onSuccess={handleConnectSuccess}
        />
      )}

      {showManualSetup && (
        <ManualSetupModal
          storeId={storeId}
          onClose={() => setShowManualSetup(false)}
          onSuccess={handleConnectSuccess}
        />
      )}

      {showPhoneVerification && connection?.phoneNumber && (
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
