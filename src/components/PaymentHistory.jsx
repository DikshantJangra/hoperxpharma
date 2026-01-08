import React, { useState, useEffect } from 'react';
import { getPaymentHistory, formatAmount, getPaymentStatusBadge } from '../services/api/payment.api';

/**
 * Standalone Payment History Component
 * Can be used in billing page or separately
 */
const PaymentHistoryComponent = ({ storeId, limit = 50 }) => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // all, success, failed, processing

    useEffect(() => {
        if (storeId) {
            loadPayments();
        }
    }, [storeId]);

    const loadPayments = async () => {
        setLoading(true);
        setError(null);
        try {
            const history = await getPaymentHistory(storeId);
            setPayments(history);
        } catch (err) {
            console.error('Failed to load payment history:', err);
            setError('Failed to load payment history');
        } finally {
            setLoading(false);
        }
    };

    const filteredPayments = payments.filter(payment => {
        if (filter === 'all') return true;
        if (filter === 'success') return payment.status === 'SUCCESS';
        if (filter === 'failed') return ['FAILED', 'EXPIRED'].includes(payment.status);
        if (filter === 'processing') return ['CREATED', 'INITIATED', 'PROCESSING'].includes(payment.status);
        return true;
    }).slice(0, limit);

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loading}>Loading payment history...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.container}>
                <div style={styles.error}>{error}</div>
                <button onClick={loadPayments} style={styles.retryButton}>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>Payment History</h2>
                <div style={styles.filters}>
                    <button
                        onClick={() => setFilter('all')}
                        style={{ ...styles.filterButton, ...(filter === 'all' ? styles.filterButtonActive : {}) }}
                    >
                        All ({payments.length})
                    </button>
                    <button
                        onClick={() => setFilter('success')}
                        style={{ ...styles.filterButton, ...(filter === 'success' ? styles.filterButtonActive : {}) }}
                    >
                        Success ({payments.filter(p => p.status === 'SUCCESS').length})
                    </button>
                    <button
                        onClick={() => setFilter('failed')}
                        style={{ ...styles.filterButton, ...(filter === 'failed' ? styles.filterButtonActive : {}) }}
                    >
                        Failed ({payments.filter(p => ['FAILED', 'EXPIRED'].includes(p.status)).length})
                    </button>
                    <button
                        onClick={() => setFilter('processing')}
                        style={{ ...styles.filterButton, ...(filter === 'processing' ? styles.filterButtonActive : {}) }}
                    >
                        Processing ({payments.filter(p => ['CREATED', 'INITIATED', 'PROCESSING'].includes(p.status)).length})
                    </button>
                </div>
            </div>

            {filteredPayments.length === 0 ? (
                <div style={styles.emptyState}>
                    <p>No payments found</p>
                </div>
            ) : (
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Date</th>
                                <th style={styles.th}>Plan</th>
                                <th style={styles.th}>Amount</th>
                                <th style={styles.th}>Payment Method</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>Payment ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPayments.map((payment) => {
                                const badge = getPaymentStatusBadge(payment.status);
                                return (
                                    <tr key={payment.id} style={styles.tr}>
                                        <td style={styles.td}>
                                            {new Date(payment.createdAt).toLocaleDateString('en-IN', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.planInfo}>
                                                <strong>{payment.metadata?.planDisplayName || 'N/A'}</strong>
                                                <br />
                                                <span style={styles.planCycle}>
                                                    {payment.metadata?.billingCycle || ''}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            <strong>{formatAmount(payment.amountPaise)}</strong>
                                            <br />
                                            <span style={styles.currency}>{payment.currency}</span>
                                        </td>
                                        <td style={styles.td}>
                                            {payment.method ? (
                                                <span style={styles.method}>{payment.method}</span>
                                            ) : (
                                                <span style={styles.methodPending}>Pending</span>
                                            )}
                                        </td>
                                        <td style={styles.td}>
                                            <span style={{
                                                ...styles.statusBadge,
                                                backgroundColor: getBadgeColor(badge.color),
                                                color: 'white'
                                            }}>
                                                {badge.label}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <code style={styles.paymentId}>
                                                {payment.id.substring(0, 12)}...
                                            </code>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <div style={styles.footer}>
                <button onClick={loadPayments} style={styles.refreshButton}>
                    🔄 Refresh
                </button>
                <span style={styles.footerText}>
                    Showing {filteredPayments.length} of {payments.length} payments
                </span>
            </div>
        </div>
    );
};

// Helper
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
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)'
    },
    header: {
        marginBottom: '1.5rem'
    },
    title: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: '1rem'
    },
    filters: {
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap'
    },
    filterButton: {
        padding: '0.5rem 1rem',
        backgroundColor: '#f3f4f6',
        border: '1px solid #d1d5db',
        borderRadius: '0.375rem',
        cursor: 'pointer',
        fontSize: '0.875rem',
        fontWeight: '500',
        transition: 'all 0.2s'
    },
    filterButtonActive: {
        backgroundColor: '#3b82f6',
        color: 'white',
        borderColor: '#3b82f6'
    },
    loading: {
        textAlign: 'center',
        padding: '2rem',
        color: '#6b7280',
        fontSize: '1rem'
    },
    error: {
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#991b1b',
        padding: '1rem',
        borderRadius: '0.375rem',
        marginBottom: '1rem'
    },
    retryButton: {
        padding: '0.5rem 1rem',
        backgroundColor: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '0.375rem',
        cursor: 'pointer'
    },
    emptyState: {
        textAlign: 'center',
        padding: '3rem',
        color: '#9ca3af'
    },
    tableContainer: {
        overflowX: 'auto'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.875rem'
    },
    th: {
        backgroundColor: '#f9fafb',
        padding: '0.75rem 1rem',
        textAlign: 'left',
        fontWeight: '600',
        color: '#374151',
        borderBottom: '2px solid #e5e7eb'
    },
    tr: {
        borderBottom: '1px solid #f3f4f6',
        transition: 'background-color 0.2s'
    },
    td: {
        padding: '1rem',
        color: '#4b5563'
    },
    planInfo: {
        lineHeight: '1.5'
    },
    planCycle: {
        fontSize: '0.75rem',
        color: '#9ca3af',
        textTransform: 'capitalize'
    },
    currency: {
        fontSize: '0.75rem',
        color: '#9ca3af'
    },
    method: {
        backgroundColor: '#f0f9ff',
        color: '#0369a1',
        padding: '0.25rem 0.5rem',
        borderRadius: '0.25rem',
        fontSize: '0.75rem',
        fontWeight: '500',
        textTransform: 'uppercase'
    },
    methodPending: {
        color: '#9ca3af',
        fontSize: '0.75rem'
    },
    statusBadge: {
        padding: '0.25rem 0.75rem',
        borderRadius: '1rem',
        fontSize: '0.75rem',
        fontWeight: '500',
        display: 'inline-block'
    },
    paymentId: {
        backgroundColor: '#f9fafb',
        padding: '0.25rem 0.5rem',
        borderRadius: '0.25rem',
        fontSize: '0.75rem',
        fontFamily: 'monospace'
    },
    footer: {
        marginTop: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '1rem',
        borderTop: '1px solid #e5e7eb'
    },
    refreshButton: {
        padding: '0.5rem 1rem',
        backgroundColor: 'white',
        border: '1px solid #d1d5db',
        borderRadius: '0.375rem',
        cursor: 'pointer',
        fontSize: '0.875rem'
    },
    footerText: {
        fontSize: '0.875rem',
        color: '#6b7280'
    }
};

export default PaymentHistoryComponent;
