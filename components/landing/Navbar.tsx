import Link from 'next/link';
import { useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="text-2xl font-bold text-emerald-600 tracking-tight">
                            HopeRxPharma
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex space-x-8 items-center">
                        <div className="relative group">
                            <button className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">
                                Product
                            </button>
                            {/* Dropdown placeholder - can be expanded later */}
                        </div>
                        <div className="relative group">
                            <button className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">
                                Solutions
                            </button>
                        </div>
                        <Link href="#pricing" className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">
                            Pricing
                        </Link>
                        <Link href="#resources" className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">
                            Resources
                        </Link>
                    </div>

                    {/* Right Side Actions */}
                    <div className="hidden md:flex items-center space-x-4">
                        <Link href="/login" className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">
                            Log In
                        </Link>
                        <Link
                            href="/signup"
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-semibold transition-all shadow-lg shadow-emerald-500/20"
                        >
                            Start Free Trial
                        </Link>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-slate-600 hover:text-emerald-600 focus:outline-none"
                        >
                            {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-white border-t border-gray-100 absolute w-full">
                    <div className="px-4 pt-2 pb-6 space-y-2">
                        <Link href="#" className="block px-3 py-2 text-slate-600 hover:text-emerald-600 font-medium">
                            Product
                        </Link>
                        <Link href="#" className="block px-3 py-2 text-slate-600 hover:text-emerald-600 font-medium">
                            Solutions
                        </Link>
                        <Link href="#pricing" className="block px-3 py-2 text-slate-600 hover:text-emerald-600 font-medium">
                            Pricing
                        </Link>
                        <Link href="#resources" className="block px-3 py-2 text-slate-600 hover:text-emerald-600 font-medium">
                            Resources
                        </Link>
                        <div className="pt-4 flex flex-col space-y-3">
                            <Link href="/login" className="block px-3 py-2 text-center text-slate-600 hover:text-emerald-600 font-medium">
                                Log In
                            </Link>
                            <Link
                                href="/signup"
                                className="block w-full text-center bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-lg font-semibold"
                            >
                                Start Free Trial
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
