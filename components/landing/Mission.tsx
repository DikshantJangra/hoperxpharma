'use client';

const Mission = () => {
    return (
        <section className="py-20 bg-white relative overflow-hidden">
            {/* Background image with overlay */}
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cg fill-rule=\'evenodd\'%3E%3Cg fill=\'%230ea5a3\' fill-opacity=\'0.4\'%3E%3Cpath opacity=\'.5\' d=\'M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z\'/%3E%3Cpath d=\'M6 5V0H5v5H0v1h5v94h1V6h94V5H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
                }}
            ></div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                <div className="mb-8">
                    <span className="inline-block px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold mb-6">
                        Our Mission
                    </span>
                </div>

                <blockquote className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-8">
                    "Pharmacies are the backbone of healthcare.
                    <br />
                    <span className="text-slate-600">But their tools are outdated.</span>
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-500">
                        HopeRx Pharma brings enterprise-level power to every pharmacy."
                    </span>
                </blockquote>

                <div className="grid sm:grid-cols-3 gap-8 mt-12">
                    <div className="p-6">
                        <div className="text-4xl font-bold text-emerald-600 mb-2">500+</div>
                        <div className="text-sm text-slate-600">Pharmacies Automated</div>
                    </div>
                    <div className="p-6">
                        <div className="text-4xl font-bold text-emerald-600 mb-2">₹2Cr+</div>
                        <div className="text-sm text-slate-600">Saved in Losses</div>
                    </div>
                    <div className="p-6">
                        <div className="text-4xl font-bold text-emerald-600 mb-2">10,000+</div>
                        <div className="text-sm text-slate-600">Hours Saved Monthly</div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Mission;
