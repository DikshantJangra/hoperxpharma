'use client';

import { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const faqs = [
        {
            question: "Is my data safe?",
            answer: "Yes. We use bank-level encryption (AES-256). Your data is DPDPA compliant with daily backups. Your data never leaves India and is stored in secure data centers."
        },
        {
            question: "Can I migrate from my old software?",
            answer: "Absolutely. We handle migration for free. Our team imports all your data including inventory, customers, and suppliers. There's zero downtime during migration."
        },
        {
            question: "Do I need a barcode scanner?",
            answer: "No. HopeRx Pharma works with any standard USB barcode scanner. We also support manual entry and mobile scanning using your phone's camera."
        },
        {
            question: "Does it work offline?",
            answer: "Yes. Core POS functions work offline. Billing and inventory updates continue even without internet. Data syncs automatically when connection returns."
        },
        {
            question: "How does WhatsApp integration work?",
            answer: "We use the official WhatsApp Business API. Send automated order confirmations, refill reminders, and promotional messages. Full two-way communication. Completely compliant with WhatsApp policies."
        },
        {
            question: "How much does support cost?",
            answer: "Support is included in all plans. Contact us via email, WhatsApp, or phone. Average response time: 2 hours. Priority support for Pro and Enterprise customers."
        },
        {
            question: "What if I need custom features?",
            answer: "We build custom features for Enterprise plans. Our team works with you to understand requirements and delivers tailored solutions."
        },
        {
            question: "Is training provided?",
            answer: "Yes. Free onboarding session + comprehensive video tutorials + live training for your team. We ensure you're comfortable before going live."
        }
    ];

    return (
        <section className="py-20 bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-xl text-slate-600">
                        Everything you need to know about HopeRx Pharma
                    </p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full px-6 py-4 flex items-center justify-between text-left"
                            >
                                <span className="font-semibold text-slate-900 text-lg">
                                    {faq.question}
                                </span>
                                <FiChevronDown
                                    className={`w-5 h-5 text-slate-600 transition-transform ${openIndex === index ? 'rotate-180' : ''
                                        }`}
                                />
                            </button>
                            {openIndex === index && (
                                <div className="px-6 pb-4">
                                    <p className="text-slate-700 leading-relaxed">
                                        {faq.answer}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <p className="text-slate-600 mb-4">
                        Still have questions?
                    </p>
                    <a
                        href="/contact"
                        className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold"
                    >
                        Contact our team →
                    </a>
                </div>
            </div>
        </section>
    );
};

export default FAQ;
