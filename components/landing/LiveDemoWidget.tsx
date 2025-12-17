'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn } from '@/components/landing/animations/FadeIn';
import { FiSearch, FiPlus, FiMinus, FiTrash2, FiPrinter, FiPercent, FiUser, FiShoppingCart } from 'react-icons/fi';
import { demoMedicines } from './demoMedicines';

interface CartItem {
    id: number;
    name: string;
    price: number;
    qty: number;
    pack: string;
    discount: number;
}

const LiveDemoWidget = () => {
    const [cart, setCart] = useState<CartItem[]>([
        { id: 1, name: "Dolo 650 Tablet", price: 30, qty: 2, pack: "strip of 15 tablets", discount: 0 },
        { id: 2, name: "Azithral 500 Tablet", price: 132, qty: 1, pack: "strip of 5 tablets", discount: 5 }
    ]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [customerName, setCustomerName] = useState('Walk-in Customer');

    const filteredMedicines = searchTerm.length > 0
        ? demoMedicines
            .filter(med =>
                med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                med.composition.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .slice(0, 6)
        : [];

    const addToCart = (medicine: typeof demoMedicines[0]) => {
        const existing = cart.find(item => item.id === medicine.id);
        if (existing) {
            setCart(cart.map(item =>
                item.id === medicine.id
                    ? { ...item, qty: item.qty + 1 }
                    : item
            ));
        } else {
            setCart([...cart, {
                id: medicine.id,
                name: medicine.name,
                price: medicine.price,
                qty: 1,
                pack: medicine.pack,
                discount: 0
            }]);
        }
        setSearchTerm('');
        setShowResults(false);
    };

    const updateQuantity = (id: number, delta: number) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.qty + delta);
                return { ...item, qty: newQty };
            }
            return item;
        }));
    };

    const updateDiscount = (id: number, discount: number) => {
        setCart(cart.map(item =>
            item.id === id ? { ...item, discount: Math.min(100, Math.max(0, discount)) } : item
        ));
    };

    const removeFromCart = (id: number) => {
        setCart(cart.filter(item => item.id !== id));
    };

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const totalDiscount = cart.reduce((acc, item) => acc + (item.price * item.qty * item.discount / 100), 0);
    const total = subtotal - totalDiscount;

    return (
        <section className="py-24 bg-gradient-to-b from-white to-slate-50 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <FadeIn>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 text-emerald-700 text-sm font-semibold mb-6 shadow-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Live Interactive Demo
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                            Experience the Speed <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Yourself</span>
                        </h2>
                        <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                            See why 500+ pharmacies trust our POS. Search real medicines, manage quantities, apply discounts — experience lightning-fast billing.
                        </p>
                    </FadeIn>
                </div>

                <FadeIn delay={0.2}>
                    <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
                        {/* Enhanced Browser Header */}
                        <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-6 py-4 flex items-center gap-4">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400 shadow-sm"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-sm"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400 shadow-sm"></div>
                            </div>
                            <div className="flex-1 bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm text-slate-600 flex items-center gap-2 shadow-inner">
                                <div className="w-3 h-3 text-green-500">🔒</div>
                                <span className="font-medium">hoperxpharma.com/pos/new-sale</span>
                            </div>
                            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded font-medium">Demo Mode</span>
                            </div>
                        </div>

                        {/* POS Interface */}
                        <div className="flex flex-col lg:flex-row min-h-[600px]">
                            {/* Left: Product Search */}
                            <div className="flex-1 p-8 border-r border-slate-100 bg-gradient-to-br from-slate-50 to-white">
                                {/* Customer Info */}
                                <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                            <FiUser className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-xs text-slate-500 font-medium">CUSTOMER</div>
                                            <input
                                                type="text"
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                className="text-sm font-semibold text-slate-900 bg-transparent border-none outline-none w-full"
                                                placeholder="Customer name"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Search Bar */}
                                <div className="relative mb-6">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <FiSearch className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search medicine name or composition..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setShowResults(e.target.value.length > 0);
                                        }}
                                        onFocus={() => setShowResults(searchTerm.length > 0)}
                                        className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:outline-none shadow-sm text-slate-900 placeholder:text-slate-400 transition-all"
                                    />

                                    {/* Enhanced Search Results */}
                                    <AnimatePresence>
                                        {showResults && filteredMedicines.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute top-full mt-2 w-full bg-white rounded-xl border-2 border-slate-200 shadow-2xl z-20 max-h-80 overflow-y-auto"
                                            >
                                                {filteredMedicines.map((med, idx) => (
                                                    <button
                                                        key={med.id}
                                                        onClick={() => addToCart(med)}
                                                        className={`w-full p-4 hover:bg-emerald-50 transition-all text-left border-b border-slate-100 last:border-b-0 group ${idx === 0 ? 'rounded-t-xl' : ''} ${idx === filteredMedicines.length - 1 ? 'rounded-b-xl' : ''}`}
                                                    >
                                                        <div className="flex justify-between items-start gap-4">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors truncate">
                                                                    {med.name}
                                                                </div>
                                                                <div className="text-xs text-slate-500 mt-1 truncate">
                                                                    {med.pack}
                                                                </div>
                                                                <div className="text-xs text-slate-400 mt-1 line-clamp-1">
                                                                    {med.composition}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                                <div className="text-right">
                                                                    <div className="font-bold text-lg text-emerald-600">₹{med.price}</div>
                                                                    <div className="text-xs text-slate-500">per {med.pack.includes('strip') ? 'strip' : 'unit'}</div>
                                                                </div>
                                                                <div className="w-8 h-8 rounded-full bg-emerald-500 group-hover:bg-emerald-600 flex items-center justify-center shadow-md transition-all">
                                                                    <FiPlus className="w-4 h-4 text-white" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Quick Search Tags */}
                                {!showResults && (
                                    <div className="space-y-3">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Search</div>
                                        <div className="flex flex-wrap gap-2">
                                            {['Dolo 650', 'Azithral', 'Pan D', 'Crocin', 'Paracetamol', 'Allegra'].map((term) => (
                                                <button
                                                    key={term}
                                                    onClick={() => {
                                                        setSearchTerm(term);
                                                        setShowResults(true);
                                                    }}
                                                    className="px-4 py-2 bg-white rounded-lg border border-slate-200 text-sm text-slate-700 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition-all shadow-sm font-medium"
                                                >
                                                    {term}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right: Cart */}
                            <div className="w-full lg:w-[480px] bg-white flex flex-col">
                                {/* Cart Header */}
                                <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                                <FiShoppingCart className="w-5 h-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-lg">Current Bill</h3>
                                                <p className="text-xs text-slate-500">{cart.length} items</p>
                                            </div>
                                        </div>
                                        <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-md">DEMO</span>
                                    </div>
                                </div>

                                {/* Cart Items */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50">
                                    <AnimatePresence mode="popLayout">
                                        {cart.map((item) => (
                                            <motion.div
                                                key={item.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-slate-900 text-sm truncate">{item.name}</div>
                                                        <div className="text-xs text-slate-500 mt-1">₹{item.price} × {item.qty}</div>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all ml-2"
                                                    >
                                                        <FiTrash2 className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="flex items-center justify-between gap-3">
                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => updateQuantity(item.id, -1)}
                                                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                                                        >
                                                            <FiMinus className="w-4 h-4 text-slate-600" />
                                                        </button>
                                                        <span className="w-12 text-center font-bold text-slate-900">{item.qty}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, 1)}
                                                            className="w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center transition-colors"
                                                        >
                                                            <FiPlus className="w-4 h-4 text-white" />
                                                        </button>
                                                    </div>

                                                    {/* Discount Input */}
                                                    <div className="flex items-center gap-2">
                                                        <FiPercent className="w-4 h-4 text-slate-400" />
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={item.discount}
                                                            onChange={(e) => updateDiscount(item.id, parseInt(e.target.value) || 0)}
                                                            className="w-16 px-2 py-1 text-sm border border-slate-200 rounded-lg text-center focus:border-emerald-500 focus:outline-none"
                                                            placeholder="0"
                                                        />
                                                    </div>

                                                    {/* Item Total */}
                                                    <div className="font-bold text-slate-900">
                                                        ₹{Math.round(item.price * item.qty * (1 - item.discount / 100))}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>

                                    {cart.length === 0 && (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                                <FiShoppingCart className="w-8 h-8 text-slate-400" />
                                            </div>
                                            <p className="text-slate-500 font-medium">Cart is empty</p>
                                            <p className="text-xs text-slate-400 mt-1">Search and add medicines above</p>
                                        </div>
                                    )}
                                </div>

                                {/* Cart Footer */}
                                <div className="p-6 bg-white border-t-2 border-slate-200 space-y-4">
                                    {/* Totals */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600">Subtotal</span>
                                            <span className="font-semibold text-slate-900">₹{subtotal}</span>
                                        </div>
                                        {totalDiscount > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-emerald-600">Discount</span>
                                                <span className="font-semibold text-emerald-600">-₹{Math.round(totalDiscount)}</span>
                                            </div>
                                        )}
                                        <div className="h-px bg-slate-200"></div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600 font-medium">Total</span>
                                            <span className="text-3xl font-bold text-slate-900">₹{Math.round(total)}</span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-3 text-lg">
                                        <FiPrinter className="w-5 h-5" />
                                        Print Bill & Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Demo Disclaimer */}
                    <div className="max-w-6xl mx-auto mt-8">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg px-6 py-4 flex items-center gap-3">
                            <div className="text-2xl">↑</div>
                            <p className="text-sm text-slate-600">
                                <span className="font-semibold text-slate-900">Interactive Demo:</span> This is a simplified preview. The actual POS includes advanced features like prescription management, batch tracking, GST reports, and more.
                            </p>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
};

export default LiveDemoWidget;
