'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiMenu, FiX, FiArrowRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showStickyCTA, setShowStickyCTA] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Handle scroll effects
    useEffect(() => {
        const handleScroll = () => {
            setShowStickyCTA(window.scrollY > 600);
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                    ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm'
                    : 'bg-transparent border-b border-transparent'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        {/* Logo */}
                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/" className="text-2xl font-bold text-emerald-600 tracking-tight flex items-center gap-2">
                                <span className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-white text-lg">H</span>
                                HopeRx Pharma
                            </Link>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex space-x-8 items-center">
                            {['Features', 'Pricing', 'Testimonials'].map((item) => (
                                <Link
                                    key={item}
                                    href={`#${item.toLowerCase()}`}
                                    className="text-slate-600 hover:text-emerald-600 font-medium transition-colors relative group"
                                >
                                    {item}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-500 transition-all group-hover:w-full"></span>
                                </Link>
                            ))}
                        </div>

                        {/* Right Side Actions */}
                        <div className="hidden md:flex items-center space-x-4">
                            <Link href="/login" className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">
                                Log In
                            </Link>
                            <Link
                                href="/signup"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-105 flex items-center gap-2"
                            >
                                Start Free
                                <FiArrowRight />
                            </Link>
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="text-slate-600 hover:text-emerald-600 focus:outline-none p-2 rounded-md hover:bg-slate-100 transition-colors"
                            >
                                {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden bg-white border-t border-slate-200 absolute w-full shadow-xl overflow-hidden"
                        >
                            <div className="px-4 pt-2 pb-6 space-y-2">
                                {['Features', 'Pricing', 'Testimonials'].map((item) => (
                                    <Link
                                        key={item}
                                        href={`#${item.toLowerCase()}`}
                                        className="block px-3 py-3 text-slate-600 hover:text-emerald-600 font-medium hover:bg-slate-50 rounded-lg transition-colors"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {item}
                                    </Link>
                                ))}
                                <div className="pt-4 flex flex-col space-y-3 border-t border-slate-100 mt-2">
                                    <Link href="/login" className="block px-3 py-2 text-center text-slate-600 hover:text-emerald-600 font-medium">
                                        Log In
                                    </Link>
                                    <Link
                                        href="/signup"
                                        className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-lg font-semibold shadow-md"
                                    >
                                        Start Free Trial
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.nav>

            {/* Sticky CTA Bar - CRO Tactic #1 */}
            <AnimatePresence>
                {showStickyCTA && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-0 left-0 right-0 z-40 bg-emerald-600 text-white py-4 shadow-2xl"
                    >
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                            <div className="hidden sm:block">
                                <p className="font-semibold text-lg">Ready to transform your pharmacy?</p>
                                <p className="text-sm text-emerald-100">Join 500+ pharmacies saving time and money</p>
                            </div>
                            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                <div className="sm:hidden">
                                    <p className="font-bold text-sm">Start saving today</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Link
                                        href="/signup"
                                        className="bg-white text-emerald-600 px-6 py-2.5 rounded-lg font-bold hover:bg-emerald-50 transition-colors text-center shadow-lg"
                                    >
                                        Start Free →
                                    </Link>
                                    <button
                                        onClick={() => setShowStickyCTA(false)}
                                        className="text-white/80 hover:text-white p-1 rounded-full hover:bg-emerald-700 transition-colors"
                                    >
                                        <FiX size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
