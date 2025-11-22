import { FaQuoteLeft, FaStar } from 'react-icons/fa';

const SocialProof = () => {
    const testimonials = [
        {
            quote: "HopeRx saved me $4,000 in expired stock in the first month alone. It pays for itself.",
            author: "Dr. A. Sharma",
            role: "Owner, City Care Pharmacy",
            initial: "A"
        },
        {
            quote: "The OCR scanning is a game changer. My team saves hours every day on data entry.",
            author: "Priya Patel",
            role: "Lead Pharmacist, HealthPlus",
            initial: "P"
        },
        {
            quote: "Finally, a system that handles compliance automatically. I sleep better at night.",
            author: "Rahul Verma",
            role: "Director, Verma Chemists",
            initial: "R"
        }
    ];

    return (
        <section className="py-24 bg-emerald-900 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Trusted by Independent Pharmacies Like Yours.
                    </h2>
                    <p className="text-emerald-200 text-lg">
                        Join the community of forward-thinking pharmacy owners.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((item, index) => (
                        <div key={index} className="bg-emerald-800/50 backdrop-blur-sm p-8 rounded-2xl border border-emerald-700/50">
                            <div className="text-emerald-400 mb-6">
                                <FaQuoteLeft size={32} />
                            </div>
                            <p className="text-lg text-emerald-50 mb-8 leading-relaxed italic">
                                "{item.quote}"
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-xl">
                                    {item.initial}
                                </div>
                                <div>
                                    <div className="font-bold">{item.author}</div>
                                    <div className="text-sm text-emerald-300">{item.role}</div>
                                </div>
                            </div>
                            <div className="flex text-yellow-400 gap-1 mt-4">
                                {[...Array(5)].map((_, i) => (
                                    <FaStar key={i} size={14} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default SocialProof;
