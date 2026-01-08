/**
 * Razorpay Utility Functions
 */

export const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

export const createRazorpayOptions = (order: any, user: any, handler: any) => {
    return {
        key: order.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amountPaise,
        currency: order.currency,
        name: "HopeRxPharma",
        description: "Subscription Transaction",
        image: "https://hoperxpharma.com/logo.png",
        order_id: order.razorpayOrderId,
        handler: handler,
        prefill: {
            name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Guest',
            email: user?.email || '',
            contact: user?.phoneNumber || '',
        },
        notes: {
            address: "HopeRxPharma Corporate Office",
        },
        theme: {
            color: "#3399cc",
        },
        config: {
            display: {
                blocks: {
                    upi: {
                        name: "Pay via UPI",
                        instruments: [
                            {
                                method: "upi"
                            }
                        ]
                    },
                },
                sequence: ['block.upi'],
                preferences: {
                    show_default_blocks: false
                }
            }
        }
    };
};
