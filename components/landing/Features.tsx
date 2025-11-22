import Image from 'next/image';
import { FaRobot, FaFilePrescription, FaWhatsapp } from 'react-icons/fa';

const Features = () => {
    return (
        <section className="py-24 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">

                {/* Block 1: AI Advantage */}
                <div className="flex flex-col md:flex-row items-center gap-12">
                    <div className="w-full md:w-1/2 order-2 md:order-1">
                        <div className="bg-white p-2 rounded-xl shadow-lg border border-gray-200 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                            {/* Placeholder for Screenshot */}
                            <div className="aspect-[4/3] bg-slate-100 rounded-lg flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                                    <span className="flex flex-col items-center">
                                        <FaRobot size={48} className="mb-2 text-emerald-500/50" />
                                        Inventory Intelligence Dashboard
                                    </span>
                                </div>
                                {/* Mock UI Elements */}
                                <div className="absolute top-4 right-4 bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                                    Reorder Alert
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="w-full md:w-1/2 order-1 md:order-2">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 font-semibold text-sm mb-6">
                            <FaRobot /> AI Advantage
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                            Inventory that Thinks for You.
                        </h2>
                        <p className="text-lg text-slate-600 leading-relaxed mb-8">
                            Stop guessing. HopeRx analyzes local trends to tell you exactly what to order and when. Reduce dead stock and ensure you always have what your patients need.
                        </p>
                        <ul className="space-y-4">
                            {['Predictive Reordering', 'Expiry Date Tracking', 'Demand Forecasting'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-700">
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-sm">✓</div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Block 2: Workflow Revolution */}
                <div className="flex flex-col md:flex-row items-center gap-12">
                    <div className="w-full md:w-1/2">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm mb-6">
                            <FaFilePrescription /> Workflow Revolution
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                            Scan. Verify. Dispense.
                        </h2>
                        <p className="text-lg text-slate-600 leading-relaxed mb-8">
                            Our AI-powered OCR reads handwritten scripts in seconds, reducing data entry errors by 90%. Free up your pharmacists to focus on patient care, not typing.
                        </p>
                        <ul className="space-y-4">
                            {['Handwriting Recognition', 'Instant Drug Interaction Check', 'Automated Label Printing'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-700">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm">✓</div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="w-full md:w-1/2">
                        <div className="bg-white p-2 rounded-xl shadow-lg border border-gray-200 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                            {/* Placeholder for GIF */}
                            <div className="aspect-[4/3] bg-slate-100 rounded-lg flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                                    <span className="flex flex-col items-center">
                                        <FaFilePrescription size={48} className="mb-2 text-blue-500/50" />
                                        OCR Scanner Demo
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Block 3: Patient Engagement */}
                <div className="flex flex-col md:flex-row items-center gap-12">
                    <div className="w-full md:w-1/2 order-2 md:order-1">
                        <div className="bg-white p-2 rounded-xl shadow-lg border border-gray-200 transform rotate-2 hover:rotate-0 transition-transform duration-500 max-w-sm mx-auto">
                            {/* Placeholder for Mobile Mockup */}
                            <div className="aspect-[9/16] bg-slate-100 rounded-lg flex items-center justify-center relative overflow-hidden border-4 border-slate-800">
                                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                                    <span className="flex flex-col items-center">
                                        <FaWhatsapp size={48} className="mb-2 text-green-500/50" />
                                        WhatsApp Reminder
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="w-full md:w-1/2 order-1 md:order-2">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 font-semibold text-sm mb-6">
                            <FaWhatsapp /> Patient Engagement
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                            Retain Patients on Autopilot.
                        </h2>
                        <p className="text-lg text-slate-600 leading-relaxed mb-8">
                            Send automated WhatsApp reminders and launch secure Telepharmacy calls with one click. Build loyalty and improve adherence without lifting a finger.
                        </p>
                        <ul className="space-y-4">
                            {['WhatsApp Refill Reminders', 'One-Click Telepharmacy', 'Digital Health Records'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-700">
                                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-sm">✓</div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default Features;
