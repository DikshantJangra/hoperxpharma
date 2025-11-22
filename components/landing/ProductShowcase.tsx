'use client';

import Image from 'next/image';

const ProductShowcase = () => {
    const showcases = [
        {
            title: "Your Pharmacy at a Glance",
            description: "Real-time revenue, stock levels, alerts. Everything on one screen.",
            image: "/screenshots/dashboard.png",
            reverse: false
        },
        {
            title: "Lightning-Fast Billing",
            description: "Barcode scan. Auto-calculate. WhatsApp receipt. Done in 30 seconds.",
            image: "/screenshots/pos.png",
            reverse: true
        },
        {
            title: "Never Run Out, Never Over-Stock",
            description: "Smart alerts. Supplier performance. Expiry tracking. Auto-reorder.",
            image: "/screenshots/inventory.png",
            reverse: false
        },
        {
            title: "Verify Safely, Dispense Confidently",
            description: "Drug interaction alerts. Insurance claims. Patient history. All automated.",
            image: "/screenshots/prescriptions.png",
            reverse: true
        },
        {
            title: "Your Pharmacy on WhatsApp",
            description: "Order confirmations. Refill reminders. Loyalty rewards. All automated.",
            image: "/screenshots/whatsapp.png",
            reverse: false
        },
        {
            title: "Smart Supplier Management",
            description: "Performance analytics. Auto POs. Credit tracking. Damage claims.",
            image: "/screenshots/suppliers.png",
            reverse: true
        }
    ];

    return (
        <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
                        See HopeRx Pharma in Action
                    </h2>
                    <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                        Real screenshots from actual pharmacy owners using HopeRx Pharma every day
                    </p>
                </div>

                <div className="space-y-24">
                    {showcases.map((showcase, index) => (
                        <div
                            key={index}
                            className={`grid md:grid-cols-2 gap-12 items-center ${showcase.reverse ? 'md:flex-row-reverse' : ''
                                }`}
                            style={showcase.reverse ? { direction: 'rtl' } : {}}
                        >
                            {/* Text Content */}
                            <div style={{ direction: 'ltr' }}>
                                <h3 className="text-3xl font-bold text-slate-900 mb-4">
                                    {showcase.title}
                                </h3>
                                <p className="text-lg text-slate-600 leading-relaxed">
                                    {showcase.description}
                                </p>
                            </div>

                            {/* Screenshot */}
                            <div style={{ direction: 'ltr' }} className="relative">
                                <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 shadow-2xl hover:shadow-3xl transition-shadow duration-300">
                                    <Image
                                        src={showcase.image}
                                        alt={showcase.title}
                                        width={1200}
                                        height={800}
                                        className="w-full h-auto"
                                        priority={index < 2}
                                    />
                                </div>
                                {/* Decorative glow */}
                                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-600/10 to-blue-600/10 rounded-3xl blur-2xl -z-10 opacity-50"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ProductShowcase;
