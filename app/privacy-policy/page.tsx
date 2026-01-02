import React from 'react';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

                <div className="prose prose-emerald max-w-none text-gray-600 space-y-6">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Introduction</h2>
                        <p>
                            Welcome to HopeRxPharma ("we," "our," or "us"). We are committed to protecting your privacy and ensuring you have a positive experience on our website and in using our services. This Privacy Policy explains our practices regarding the collection, use, and disclosure of your information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Information We Collect</h2>
                        <p>We collect information you provide directly to us, such as when you create an account, specifically:</p>
                        <ul className="list-disc pl-5 space-y-2 mt-2">
                            <li><strong>Account Information:</strong> Name, email address, and phone number.</li>
                            <li><strong>Google OAuth Data:</strong> If you sign up using Google, we collect your name and email address provided by Google to verify your identity.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-3">3. How We Use Your Information</h2>
                        <p>We use the information we collect to:</p>
                        <ul className="list-disc pl-5 space-y-2 mt-2">
                            <li>Provide, maintain, and improve our services.</li>
                            <li>Process transactions and send related information, including confirmations and invoices.</li>
                            <li>Send you technical notices, updates, security alerts, and support and administrative messages.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at: <br />
                            <strong>Email:</strong> hoperxpharma@gmail.com <br />
                            <strong>Phone:</strong> 9812080390
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
