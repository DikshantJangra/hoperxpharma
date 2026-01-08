/**
 * Payment API Service
 * Frontend service for Razorpay payment integration
 * NEVER trusts Razorpay success callback alone - always polls backend
 */

import { apiClient } from './apiClient';

/**
 * Get Razorpay public key from backend
 * @returns {Promise<string>} Razorpay key ID
 */
export const getRazorpayKey = async () => {
    const response = await apiClient.get('/payments/razorpay-key');
    return response.data.data.keyId; // Fixed: response.data is ApiResponse wrapper
};

/**
 * Create payment order (server calculates amount)
 * @param {string} planId - Subscription plan ID
 * @param {string} storeId - Store ID
 * @returns {Promise<Object>} Order details
 */
export const createPaymentOrder = async (planId, storeId) => {
    const response = await apiClient.post('/payments/create-order', {
        planId,
        storeId
    });
    return response.data.data;
};

/**
 * Verify payment signature
 * Marks payment as PROCESSING (not SUCCESS - need to poll for webhook confirmation)
 * @param {Object} razorpayResponse - Response from Razorpay checkout
 * @returns {Promise<Object>} Verification result
 */
export const verifyPayment = async (razorpayResponse) => {
    const response = await apiClient.post('/payments/verify', {
        razorpay_order_id: razorpayResponse.razorpay_order_id,
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_signature: razorpayResponse.razorpay_signature
    });
    return response.data.data;
};

/**
 * Poll payment status (wait for webhook to mark SUCCESS)
 * @param {string} paymentId - Payment ID
 * @param {number} maxAttempts - Maximum polling attempts (default: 20)
 * @param {number} intervalMs - Polling interval in ms (default: 2000)
 * @returns {Promise<Object>} Final payment status
 */
export const pollPaymentStatus = async (
    paymentId,
    maxAttempts = 20,
    intervalMs = 2000
) => {
    for (let i = 0; i < maxAttempts; i++) {
        // Wait before polling
        await new Promise(resolve => setTimeout(resolve, intervalMs));

        try {
            const response = await apiClient.get(`/payments/${paymentId}/status`);
            const { status } = response.data.data;

            // Terminal states
            if (status === 'SUCCESS') {
                return { success: true, status, data: response.data.data };
            }

            if (['FAILED', 'EXPIRED'].includes(status)) {
                return { success: false, status, data: response.data.data };
            }

            // Continue polling if still PROCESSING
            console.log(`[Payment] Status: ${status}, polling again in ${intervalMs}ms...`);
        } catch (error) {
            console.error('[Payment] Polling error:', error);
            // Continue polling on error
        }
    }

    // Timeout - payment still processing
    return {
        success: false,
        status: 'TIMEOUT',
        message: 'Payment verification timeout - please check your payment history'
    };
};

/**
 * Get payment history for store
 * @param {string} storeId - Store ID
 * @returns {Promise<Array>} Payment history
 */
export const getPaymentHistory = async (storeId) => {
    const response = await apiClient.get('/payments/history', {
        params: { storeId }
    });
    return response.data.data.payments;
};

/**
 * Complete payment flow with Razorpay Checkout
 * @param {string} planId - Subscription plan ID
 * @param {string} storeId - Store ID
 * @param {Object} options - Additional options (prefill, theme, etc.)
 * @returns {Promise<Object>} Payment result
 */
export const initiatePaymentFlow = async (planId, storeId, options = {}) => {
    try {
        // 1. Create order on backend
        const orderData = await createPaymentOrder(planId, storeId);

        // 2. Load Razorpay script if not already loaded
        if (!window.Razorpay) {
            await loadRazorpayScript();
        }

        // 3. Get Razorpay key if not in orderData
        if (!orderData.keyId && !options.keyId) {
            orderData.keyId = await getRazorpayKey();
        }

        // 4. Open Razorpay checkout
        const razorpayResponse = await openRazorpayCheckout(orderData, options);

        // 5. Verify payment signature with backend
        const verificationResult = await verifyPayment(razorpayResponse);

        // 6. Poll for final status (wait for webhook)
        const finalResult = await pollPaymentStatus(orderData.paymentId);

        return finalResult;
    } catch (error) {
        console.error('[Payment] Flow failed:', error);
        throw error;
    }
};

/**
 * Load Razorpay checkout script
 * @returns {Promise<void>}
 */
const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
        if (window.Razorpay) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load Razorpay script'));
        document.body.appendChild(script);
    });
};

/**
 * Open Razorpay checkout modal
 * @param {Object} orderData - Order data from backend
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Razorpay response
 */
const openRazorpayCheckout = (orderData, options = {}) => {
    return new Promise((resolve, reject) => {
        const razorpayOptions = {
            key: orderData.keyId || options.keyId,
            amount: orderData.amountPaise,
            currency: orderData.currency,
            name: 'HopeRx Pharma',
            description: orderData.planName || 'Subscription Payment',
            order_id: orderData.razorpayOrderId,

            // Success handler (NEVER trust this alone!)
            handler: (response) => {
                resolve(response);
            },

            // Cancellation handler
            modal: {
                ondismiss: () => {
                    reject(new Error('Payment cancelled by user'));
                }
            },

            // Prefill customer data
            prefill: options.prefill || {},

            // Theme
            theme: {
                color: options.themeColor || '#3399cc'
            },

            ...options
        };

        const razorpay = new window.Razorpay(razorpayOptions);
        razorpay.open();
    });
};

/**
 * Format amount for display
 * @param {number} paise - Amount in paise
 * @returns {string} Formatted amount
 */
export const formatAmount = (paise) => {
    const rupees = paise / 100;
    return `₹${rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Get payment status badge props
 * @param {string} status - Payment status
 * @returns {Object} Badge props (color, label)
 */
export const getPaymentStatusBadge = (status) => {
    const badges = {
        CREATED: { color: 'gray', label: 'Created' },
        INITIATED: { color: 'blue', label: 'Initiated' },
        PROCESSING: { color: 'yellow', label: 'Processing' },
        SUCCESS: { color: 'green', label: 'Success' },
        FAILED: { color: 'red', label: 'Failed' },
        EXPIRED: { color: 'gray', label: 'Expired' },
        DISPUTED: { color: 'orange', label: 'Disputed' },
        REFUNDED: { color: 'purple', label: 'Refunded' }
    };

    return badges[status] || { color: 'gray', label: status };
};

export default {
    getRazorpayKey,
    createPaymentOrder,
    verifyPayment,
    pollPaymentStatus,
    getPaymentHistory,
    initiatePaymentFlow,
    formatAmount,
    getPaymentStatusBadge
};
