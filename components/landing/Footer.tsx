import Link from 'next/link';
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from 'react-icons/fa';

const Footer = () => {
    return (
        <footer className="bg-slate-900 text-slate-300 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="text-2xl font-bold text-white tracking-tight mb-4 block">
                            HopeRxPharma
                        </Link>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">
                            The AI-powered operating system for modern independent pharmacies. Automate, optimize, and grow.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors"><FaTwitter size={20} /></a>
                            <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors"><FaLinkedin size={20} /></a>
                            <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors"><FaFacebook size={20} /></a>
                            <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors"><FaInstagram size={20} /></a>
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Product</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="#" className="hover:text-emerald-400 transition-colors">Features</Link></li>
                            <li><Link href="#" className="hover:text-emerald-400 transition-colors">Pricing</Link></li>
                            <li><Link href="#" className="hover:text-emerald-400 transition-colors">Security</Link></li>
                            <li><Link href="#" className="hover:text-emerald-400 transition-colors">Roadmap</Link></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Company</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="#" className="hover:text-emerald-400 transition-colors">About Us</Link></li>
                            <li><Link href="#" className="hover:text-emerald-400 transition-colors">Careers</Link></li>
                            <li><Link href="#" className="hover:text-emerald-400 transition-colors">Blog</Link></li>
                            <li><Link href="#" className="hover:text-emerald-400 transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Legal</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
                            <li><Link href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
                            <li><Link href="#" className="hover:text-emerald-400 transition-colors">HIPAA Compliance</Link></li>
                            <li><Link href="#" className="hover:text-emerald-400 transition-colors">Cookie Policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-slate-500">
                        © {new Date().getFullYear()} HopeRxPharma. All rights reserved.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        All Systems Operational
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
