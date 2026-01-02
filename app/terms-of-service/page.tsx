import React from 'react';

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>

                <div className="prose prose-emerald max-w-none text-gray-600 space-y-6">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using the services provided by HopeRxPharma, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use our services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Use of Service</h2>
                        <p>
                            You must be at least 18 years years old to use our service. You are responsible for maintaining the security of your account and password. HopeRxPharma cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Account Terms</h2>
                        <ul className="list-disc pl-5 space-y-2 mt-2">
                            <li>You must provide your legal full name, a valid email address, and any other information requested in order to complete the signup process.</li>
                            <li>You are responsible for all Content posted and activity that occurs under your account.</li>
                            <li>You may not use the Service for any illegal or unauthorized purpose.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Contact Us</h2>
                        <p>
                            If you have any questions about these Terms, please contact us at: <br />
                            <strong>Email:</strong> hoperxpharma@gmail.com <br />
                            <strong>Phone:</strong> 9812080390
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
