'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn } from '@/components/landing/animations/FadeIn';
import { FiSearch, FiPlus, FiTrash2, FiPrinter } from 'react-icons/fi';

const LiveDemoWidget = () => {
    const [cart, setCart] = useState([
        { id: 1, name: "Dolo 650mg", price: 30, qty: 2 },
        { id: 2, name: "Azithral 500mg", price: 120, qty: 1 }
    ]);

    const addToCart = () => {
        const newItem = { id: Date.now(), name: "Pan D Capsules", price: 150, qty: 1 };
        setCart([...cart, newItem]);
    };

    const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

    return (
        <section className="py-24 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <FadeIn>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-4">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            Interactive Demo
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                            Experience the Speed Yourself
                        </h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                            Try our lightning-fast billing interface right here. No signup needed.
                        </p>
                    </FadeIn>
                </div>

                <FadeIn delay={0.2}>
                    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                        {/* Fake Browser Header */}
                        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-4">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                            </div>
                            <div className="flex-1 bg-white border border-slate-200 rounded-md px-3 py-1 text-xs text-slate-500 flex items-center justify-center">
                                hoperxpharma.com/pos/new-sale
                            </div>
                        </div>

                        {/* POS Interface */}
                        <div className="flex flex-col md:flex-row h-[500px]">
                            {/* Left: Product Search */}
                            <div className="flex-1 p-6 border-r border-slate-100 bg-slate-50/50">
                                <div className="relative mb-6">
                                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search medicine (e.g. Dolo)"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Popular Items</div>
                                    <button onClick={addToCart} className="w-full bg-white p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all text-left flex justify-between items-center group">
                                        <div>
                                            <div className="font-medium text-slate-900">Pan D Capsules</div>
                                            <div className="text-xs text-slate-500">Strip of 15</div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-emerald-50 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 transition-colors">
                                            <FiPlus />
                                        </div>
                                    </button>
                                    <div className="w-full bg-white p-3 rounded-xl border border-slate-200 opacity-60 cursor-not-allowed text-left">
                                        <div className="font-medium text-slate-900">Crosin Advance</div>
                                        <div className="text-xs text-red-500">Out of Stock</div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Cart */}
                            <div className="w-full md:w-[400px] bg-white flex flex-col">
                                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-800">Current Bill</h3>
                                    <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium">New Sale</span>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    <AnimatePresence initial={false}>
                                        {cart.map((item) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="flex justify-between items-center bg-slate-50 p-3 rounded-lg"
                                            >
                                                <div>
                                                    <div className="font-medium text-slate-900 text-sm">{item.name}</div>
                                                    <div className="text-xs text-slate-500">₹{item.price} x {item.qty}</div>
                                                </div>
                                                <div className="font-bold text-slate-700">₹{item.price * item.qty}</div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>

                                <div className="p-6 bg-slate-50 border-t border-slate-100">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-slate-500">Total Amount</span>
                                        <span className="text-2xl font-bold text-slate-900">₹{total}</span>
                                    </div>
                                    <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2">
                                        <FiPrinter />
                                        Print Bill & Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
};

export default LiveDemoWidget;
