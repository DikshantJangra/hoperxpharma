import { FaChartLine, FaShieldAlt, FaUserMd } from 'react-icons/fa';

const ProblemSolution = () => {
    const items = [
        {
            icon: <FaChartLine className="w-8 h-8 text-red-500" />,
            problem: "Crippling Inventory Costs",
            solutionTitle: "AI-Driven Forecasting",
            solution: "Our AI predicts demand before you run out, reducing dead stock by 25%.",
            color: "bg-red-50"
        },
        {
            icon: <FaShieldAlt className="w-8 h-8 text-orange-500" />,
            problem: "Compliance Nightmares",
            solutionTitle: "Automated Audit Trails",
            solution: "HIPAA/DPDPA logs are generated automatically. Never fear an audit again.",
            color: "bg-orange-50"
        },
        {
            icon: <FaUserMd className="w-8 h-8 text-blue-500" />,
            problem: "Pharmacist Burnout",
            solutionTitle: "Smart Workflow",
            solution: "OCR scanning and automated verification queues save your team 2 hours every day.",
            color: "bg-blue-50"
        }
    ];

    return (
        <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                        Is Your Pharmacy System Holding You Back?
                    </h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Legacy systems weren't built for today's challenges. See how HopeRx Pharma solves the problems that cost you money.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {items.map((item, index) => (
                        <div key={index} className="group relative bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                            <div className={`w-16 h-16 rounded-xl ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                {item.icon}
                            </div>

                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-slate-500 mb-2 uppercase tracking-wide text-xs">The Problem</h3>
                                <p className="text-xl font-bold text-slate-800">{item.problem}</p>
                            </div>

                            <div className="pt-6 border-t border-gray-100">
                                <h3 className="text-lg font-semibold text-emerald-600 mb-2 uppercase tracking-wide text-xs">The Solution</h3>
                                <h4 className="text-xl font-bold text-slate-900 mb-2">{item.solutionTitle}</h4>
                                <p className="text-slate-600 leading-relaxed">
                                    {item.solution}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ProblemSolution;
