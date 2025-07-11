
import React from 'react';

export const PrivacyPolicy = () => {
  return (
    <div className="space-y-6 text-sm">
      <p className="text-slate-600 dark:text-slate-400">
        <em>Last updated: January 11, 2025</em>
      </p>
      
      <p>
        Welcome to <strong>Rìan</strong>. Your privacy matters to us. This Privacy Policy explains what data we collect, why we collect it, how we use it, and your rights.
      </p>

      <div>
        <h3 className="text-lg font-semibold mb-3">1. Who We Are</h3>
        <p className="mb-4">
          Rìan is an AI-driven crypto compliance platform that helps businesses assess wallet risk, trace transactions, and generate compliance reports.
        </p>
        <p>Our contact: support@rian.io</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">2. What Data We Collect</h3>
        <p className="mb-4">We collect only the minimum data needed to provide the service:</p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-300 dark:border-slate-600">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="border border-slate-300 dark:border-slate-600 p-2 text-left">Data Type</th>
                <th className="border border-slate-300 dark:border-slate-600 p-2 text-left">What We Collect</th>
                <th className="border border-slate-300 dark:border-slate-600 p-2 text-left">Why We Collect It</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 dark:border-slate-600 p-2 font-medium">Account Information</td>
                <td className="border border-slate-300 dark:border-slate-600 p-2">Email address, sign-up date, login history</td>
                <td className="border border-slate-300 dark:border-slate-600 p-2">To create and manage your account</td>
              </tr>
              <tr>
                <td className="border border-slate-300 dark:border-slate-600 p-2 font-medium">Investigation Records</td>
                <td className="border border-slate-300 dark:border-slate-600 p-2">Wallet addresses, risk scores, case notes</td>
                <td className="border border-slate-300 dark:border-slate-600 p-2">To provide compliance risk assessments</td>
              </tr>
              <tr>
                <td className="border border-slate-300 dark:border-slate-600 p-2 font-medium">Usage Data</td>
                <td className="border border-slate-300 dark:border-slate-600 p-2">Number of investigations, last login</td>
                <td className="border border-slate-300 dark:border-slate-600 p-2">To monitor service usage and performance</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-green-600 dark:text-green-400">✅ We <strong>do not</strong> collect sensitive personal data (e.g., name, address, financial account numbers).</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">3. How We Use Your Data</h3>
        <ul className="list-disc list-inside space-y-2">
          <li>To provide wallet risk scoring and investigation services.</li>
          <li>To maintain the security and integrity of the platform.</li>
          <li>To contact you for support, service updates, or account issues.</li>
        </ul>
        <p className="mt-4 font-medium">We <strong>never sell or share your data with third parties</strong> for marketing or unrelated purposes.</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">4. How We Store and Protect Your Data</h3>
        <ul className="list-disc list-inside space-y-2">
          <li>All data is stored securely using modern encryption standards.</li>
          <li>Access is limited to authorized personnel only.</li>
          <li>We conduct regular reviews to ensure data security.</li>
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">5. Your Rights</h3>
        <p className="mb-4">Under GDPR (if you are in the EU or UK), you have the right to:</p>
        <ul className="list-disc list-inside space-y-2">
          <li>Access the data we hold about you.</li>
          <li>Correct inaccuracies in your data.</li>
          <li>Request deletion of your data ("Right to be Forgotten").</li>
          <li>Withdraw consent where applicable.</li>
        </ul>
        <p className="mt-4">To exercise any of these rights, contact us at: support@rian.io</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">6. Data Retention</h3>
        <p>
          We retain user accounts and investigation records <strong>only as long as necessary</strong> for compliance, legal obligations, or service delivery.
        </p>
        <p className="mt-2">You may request deletion of your account and all related data at any time.</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">7. Cookies & Tracking</h3>
        <p>
          Rìan <strong>does not currently use cookies or third-party tracking</strong> beyond what is strictly necessary for platform functionality.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">8. Changes to This Policy</h3>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any significant changes via email or through the platform.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">9. Contact</h3>
        <p>
          If you have any questions or concerns about this Privacy Policy or your data, please contact:
        </p>
        <p className="mt-2">📧 <strong>support@rian.io</strong></p>
      </div>
    </div>
  );
};
