import React, { useState, useEffect } from 'react';
import { initiatePaymentFlow, getPaymentHistory, formatAmount, getPaymentStatusBadge } from '../services/api/payment.api';

/**
 * Complete Billing & Subscription Page
 * Integrates Razorpay payment flow
 */
const BillingPage = ({ storeId, currentPlan = null }) => {
    const [loading, setLoading] = useState(false);
    const [paymentInProgress, setPaymentInProgress] = useState(false);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Subscription plans
    const plans = [
        {
            id: 'retail_monthly',
            name: 'Retail Pharmacy',
            price: 29900, // in paise
            billing: 'monthly',
            features: ['Unlimited patients', 'POS system', 'Inventory management', '5GB storage']
        },
        {
            id: 'retail_yearly',
            name: 'Retail Pharmacy',
            price: 299900,
            billing: 'yearly',
            savings: '17%',
            features: ['Unlimited patients', 'POS system', 'Inventory management', '5GB storage', '2 months free']
        },
        {
            id: 'wholesale_monthly',
            name: 'Wholesale Pharmacy',
            price: 49900,
            billing: 'monthly',
            features: ['All Retail features', 'Bulk ordering', 'Distributor management', '10GB storage']
        },
        {
            id: 'wholesale_yearly',
            name: 'Wholesale Pharmacy',
            price: 499900,
            billing: 'yearly',
            savings: '17%',
            features: ['All Retail features', 'Bulk ordering', 'Distributor management', '10GB storage', '2 months free']
        },
        {
            id: 'hospital_monthly',
            name: 'Hospital Pharmacy',
            price: 99900,
            billing: 'monthly',
            features: ['All Wholesale features', 'Ward management', 'E-prescriptions', '20GB storage']
        },
        {
            id: 'hospital_yearly',
            name: 'Hospital Pharmacy',
            price: 999900,
            billing: 'yearly',
            savings: '17%',
            features: ['All Wholesale features', 'Ward management', 'E-prescriptions', '20GB storage', '2 months free']
        }
    ];

    // Load payment history
    useEffect(() => {
        if (storeId && showHistory) {
            loadPaymentHistory();
        }
    }, [storeId, showHistory]);

    const loadPaymentHistory = async () => {
        try {
            const history = await getPaymentHistory(storeId);
            setPaymentHistory(history);
        } catch (err) {
            console.error('Failed to load payment history:', err);
        }
    };

    const handlePlanSelect = (plan) => {
        setSelectedPlan(plan);
        setError(null);
        setSuccess(null);
    };

    const handlePayment = async () => {
        if (!selectedPlan) {
            setError('Please select a plan first');
            return;
        }

        setPaymentInProgress(true);
        setError(null);
        setSuccess(null);

        try {
            // Initiate payment flow with Razorpay
            const result = await initiatePaymentFlow(selectedPlan.id, storeId, {
                prefill: {
                    // Add user details if available
                },
                themeColor: '#3399cc'
            });

            if (result.success) {
                setSuccess('Payment successful! Your subscription has been activated.');
                setSelectedPlan(null);
                // Refresh page or update subscriptionstatus
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                setError(`Payment failed: ${result.message || 'Please try again'}`);
            }
        } catch (err) {
            console.error('Payment error:', err);
            setError(err.message || 'Payment failed. Please try again.');
        } finally {
            setPaymentInProgress(false);
        }
    };

    return (
        <div className="billing-page" style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Billing & Subscription</h1>
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    style={styles.historyButton}
                >
                    {showHistory ? 'Show Plans' : 'View Payment History'}
                </button>
            </div>

            {/* Current Plan Status */}
            {currentPlan && (
                <div style={styles.currentPlan}>
                    <h3>Current Plan</h3>
                    <p><strong>{currentPlan.name}</strong> - {currentPlan.status}</p>
                    <p>Valid until: {new Date(currentPlan.validUntil).toLocaleDateString()}</p>
                </div>
            )}

            {/* Error/Success Messages */}
            {error && (
                <div style={{ ...styles.alert, ...styles.alertError }}>
                    {error}
                </div>
            )}
            {success && (
                <div style={{ ...styles.alert, ...styles.alertSuccess }}>
                    {success}
                </div>
            )}

            {!showHistory ? (
                <>
                    {/* Subscription Plans */}
                    <div style={styles.plansGrid}>
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                style={{
                                    ...styles.planCard,
                                    ...(selectedPlan?.id === plan.id ? styles.planCardSelected : {})
                                }}
                                onClick={() => handlePlanSelect(plan)}
                            >
                                {plan.savings && (
                                    <div style={styles.savingsBadge}>Save {plan.savings}</div>
                                )}
                                <h3 style={styles.planName}>{plan.name}</h3>
                                <div style={styles.planPrice}>
                                    <span style={styles.priceAmount}>{formatAmount(plan.price)}</span>
                                    <span style={styles.pricePeriod}>/{plan.billing}</span>
                                </div>
                                <ul style={styles.featureList}>
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} style={styles.feature}>✓ {feature}</li>
                                    ))}
                                </ul>
                                {selectedPlan?.id === plan.id && (
                                    <div style={styles.selectedIndicator}>Selected</div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Payment Button */}
                    {selectedPlan && (
                        <div style={styles.paymentSection}>
                            <p style={styles.paymentSummary}>
                                You're subscribing to <strong>{selectedPlan.name}</strong> ({selectedPlan.billing})
                                <br />
                                Total: <strong>{formatAmount(selectedPlan.price)}</strong>
                            </p>
                            <button
                                onClick={handlePayment}
                                disabled={paymentInProgress}
                                style={{
                                    ...styles.payButton,
                                    ...(paymentInProgress ? styles.payButtonDisabled : {})
                                }}
                            >
                                {paymentInProgress ? 'Processing...' : `Pay ${formatAmount(selectedPlan.price)}`}
                            </button>
                            <p style={styles.secureNote}>
                                🔒 Secure payment powered by Razorpay
                            </p>
                        </div>
                    )}
                </>
            ) : (
                /* Payment History */
                <PaymentHistory payments={paymentHistory} />
            )}
        </div>
    );
};

/**
 * Payment History Component
 */
const PaymentHistory = ({ payments }) => {
    if (!payments || payments.length === 0) {
        return (
            <div style={styles.emptyState}>
                <p>No payment history yet</p>
            </div>
        );
    }

    return (
        <div style={styles.historyContainer}>
            <h2 style={styles.historyTitle}>Payment History</h2>
            <table style={styles.historyTable}>
                <thead>
                    <tr>
                        <th style={styles.tableHeader}>Date</th>
                        <th style={styles.tableHeader}>Plan</th>
                        <th style={styles.tableHeader}>Amount</th>
                        <th style={styles.tableHeader}>Method</th>
                        <th style={styles.tableHeader}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {payments.map((payment) => {
                        const badge = getPaymentStatusBadge(payment.status);
                        return (
                            <tr key={payment.id} style={styles.tableRow}>
                                <td style={styles.tableCell}>
                                    {new Date(payment.createdAt).toLocaleDateString()}
                                </td>
                                <td style={styles.tableCell}>
                                    {payment.metadata?.planDisplayName || 'N/A'}
                                </td>
                                <td style={styles.tableCell}>
                                    {formatAmount(payment.amountPaise)}
                                </td>
                                <td style={styles.tableCell}>
                                    {payment.method || 'N/A'}
                                </td>
                                <td style={styles.tableCell}>
                                    <span style={{
                                        ...styles.statusBadge,
                                        backgroundColor: getBadgeColor(badge.color)
                                    }}>
                                        {badge.label}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// Helper function for badge colors
const getBadgeColor = (color) => {
    const colors = {
        green: '#10b981',
        red: '#ef4444',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        gray: '#6b7280',
        orange: '#f97316',
        purple: '#8b5cf6'
    };
    return colors[color] || colors.gray;
};

// Styles
const styles = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
    },
    title: {
        fontSize: '2rem',
        fontWeight: 'bold',
        color: '#1f2937'
    },
    historyButton: {
        padding: '0.5rem 1rem',
        backgroundColor: '#f3f4f6',
        border: '1px solid #d1d5db',
        borderRadius: '0.375rem',
        cursor: 'pointer',
        fontSize: '0.875rem',
        fontWeight: '500'
    },
    currentPlan: {
        backgroundColor: '#f0f9ff',
        border: '1px solid #bfdbfe',
        borderRadius: '0.5rem',
        padding: '1rem',
        marginBottom: '2rem'
    },
    alert: {
        padding: '1rem',
        borderRadius: '0.5rem',
        marginBottom: '1rem',
        fontSize: '0.875rem'
    },
    alertError: {
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#991b1b'
    },
    alertSuccess: {
        backgroundColor: '#f0fdf4',
        border: '1px solid #bbf7d0',
        color: '#166534'
    },
    plansGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
    },
    planCard: {
        position: 'relative',
        border: '2px solid #e5e7eb',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
        backgroundColor: 'white'
    },
    planCardSelected: {
        borderColor: '#3b82f6',
        boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.1)'
    },
    savingsBadge: {
        position: 'absolute',
        top: '-10px',
        right: '1rem',
        backgroundColor: '#10b981',
        color: 'white',
        padding: '0.25rem 0.75rem',
        borderRadius: '1rem',
        fontSize: '0.75rem',
        fontWeight: 'bold'
    },
    planName: {
        fontSize: '1.25rem',
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: '0.5rem'
    },
    planPrice: {
        marginBottom: '1rem'
    },
    priceAmount: {
        fontSize: '2rem',
        fontWeight: 'bold',
        color: '#3b82f6'
    },
    pricePeriod: {
        fontSize: '1rem',
        color: '#6b7280'
    },
    featureList: {
        listStyle: 'none',
        padding: 0,
        margin: 0
    },
    feature: {
        padding: '0.5rem 0',
        color: '#4b5563',
        fontSize: '0.875rem'
    },
    selectedIndicator: {
        marginTop: '1rem',
        padding: '0.5rem',
        backgroundColor: '#dbeafe',
        color: '#1e40af',
        textAlign: 'center',
        borderRadius: '0.375rem',
        fontWeight: '500',
        fontSize: '0.875rem'
    },
    paymentSection: {
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '0.75rem',
        padding: '2rem',
        textAlign: 'center'
    },
    paymentSummary: {
        fontSize: '1.125rem',
        color: '#374151',
        marginBottom: '1.5rem',
        lineHeight: '1.75'
    },
    payButton: {
        backgroundColor: '#3b82f6',
        color: 'white',
        padding: '1rem 3rem',
        fontSize: '1.125rem',
        fontWeight: 'bold',
        border: 'none',
        borderRadius: '0.5rem',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
    },
    payButtonDisabled: {
        backgroundColor: '#9ca3af',
        cursor: 'not-allowed'
    },
    secureNote: {
        marginTop: '1rem',
        color: '#6b7280',
        fontSize: '0.875rem'
    },
    historyContainer: {
        backgroundColor: 'white'
    },
    historyTitle: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        marginBottom: '1.5rem',
        color: '#1f2937'
    },
    historyTable: {
        width: '100%',
        borderCollapse: 'collapse',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        overflow: 'hidden'
    },
    tableHeader: {
        backgroundColor: '#f9fafb',
        padding: '0.75rem 1rem',
        textAlign: 'left',
        fontWeight: '600',
        fontSize: '0.875rem',
        color: '#374151',
        borderBottom: '1px solid #e5e7eb'
    },
    tableRow: {
        borderBottom: '1px solid #f3f4f6'
    },
    tableCell: {
        padding: '1rem',
        fontSize: '0.875rem',
        color: '#4b5563'
    },
    statusBadge: {
        padding: '0.25rem 0.75rem',
        borderRadius: '1rem',
        fontSize: '0.75rem',
        fontWeight: '500',
        color: 'white',
        display: 'inline-block'
    },
    emptyState: {
        textAlign: 'center',
        padding: '3rem',
        color: '#9ca3af',
        fontSize: '1.125rem'
    }
};

export default BillingPage;
