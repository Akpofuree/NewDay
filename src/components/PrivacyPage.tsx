"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";

interface PrivacyPageProps {
  onBack: () => void;
  darkMode: boolean;
}

export default function PrivacyPage({ onBack, darkMode }: PrivacyPageProps) {
  return (
    <div
      className={`min-h-screen w-full ${darkMode ? "dark bg-[#0a0a14] text-gray-100" : "bg-[#FAFBFD] text-gray-900"}`}
    >
      <div className="max-w-4xl mx-auto px-1 sm:px-2 py-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-[#5C27FE] dark:text-[#a085ff] hover:underline mb-8"
        >
          <ArrowLeft size={16} />
          Back to App
        </button>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Last updated: June 03, 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              Company Information
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              <strong>Company:</strong> NewDay
              <br />
              <strong>Registered in:</strong> Nigeria
              <br />
              <strong>Address:</strong> Behind Pricewise stores Gado Nasko,
              Kubwa, Abuja (FCT) 900101
              <br />
              <strong>Phone:</strong> 09037841541
              <br />
              <strong>Email:</strong> vfe0579bakpofure@gmail.com
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              1. Introduction
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              NewDay ("we," "our," or "us") is committed to protecting your
              privacy. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our task
              management platform. Please read this privacy policy carefully. If
              you do not agree with the terms of this privacy policy, please do
              not access the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              2. Data We Collect
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              We collect information you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>
                <strong>Account Information:</strong> Name, email address,
                password, and profile information you provide when creating an
                account
              </li>
              <li>
                <strong>Task Content:</strong> Task titles, descriptions, due
                dates, priorities, tags, and other task-related data you create
              </li>
              <li>
                <strong>Group Data:</strong> Group names, descriptions, colors,
                and member information for collaborative workspaces
              </li>
              <li>
                <strong>Chat Messages:</strong> Content of messages sent through
                our real-time chat feature
              </li>
              <li>
                <strong>AI Interactions:</strong> Prompts and responses from our
                AI chatbox powered by Anthropic Claude
              </li>
              <li>
                <strong>Usage Data:</strong> Information about how you use our
                service, including login frequency, task completion rates, and
                feature usage patterns
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              3. How We Use Your Data
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              We use the collected data for various purposes:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>
                To provide, maintain, and improve our task management service
              </li>
              <li>
                To process and fulfill your requests for task management
                features
              </li>
              <li>
                To send you technical notices, updates, security alerts, and
                support messages
              </li>
              <li>
                To respond to your comments, questions, and customer service
                requests
              </li>
              <li>
                To monitor and analyze trends, usage, and activities in
                connection with our service
              </li>
              <li>
                To detect, prevent, and address technical issues and fraud
              </li>
              <li>
                To power our AI chatbox features using Anthropic Claude for task
                suggestions and assistance
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              4. Third-Party Services
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              We use third-party services to operate our platform. These
              services have their own privacy policies:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>
                <strong>Google OAuth:</strong> We use Google OAuth for
                authentication. Google collects and uses your data according to
                their privacy policy at https://policies.google.com/privacy
              </li>
              <li>
                <strong>Anthropic Claude:</strong> Our AI chatbox is powered by
                Anthropic Claude. When you interact with the AI, your prompts
                may be processed by Anthropic's services. Review Anthropic's
                privacy policy at https://www.anthropic.com/privacy
              </li>
              <li>
                <strong>Resend:</strong> We use Resend for email verification
                and communication. Resend processes email data according to
                their privacy policy at https://resend.com/privacy
              </li>
              <li>
                <strong>Firebase:</strong> We use Firebase for real-time
                database synchronization and authentication. Firebase's privacy
                policy is available at
                https://firebase.google.com/support/privacy
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              5. Data Storage and Security
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              We implement appropriate technical and organizational measures to
              protect your data:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>
                <strong>Encryption:</strong> Data is encrypted in transit using
                HTTPS/TLS and at rest using industry-standard encryption
              </li>
              <li>
                <strong>Access Controls:</strong> Access to your data is
                restricted to authorized personnel who need it for legitimate
                business purposes
              </li>
              <li>
                <strong>Secure Authentication:</strong> We use secure
                authentication methods including Google OAuth and password
                hashing
              </li>
              <li>
                <strong>Regular Security Audits:</strong> We conduct regular
                security reviews and updates to protect against vulnerabilities
              </li>
              <li>
                <strong>Data Backup:</strong> Your data is regularly backed up
                to prevent data loss
              </li>
            </ul>
            <p className="text-gray-600 dark:text-gray-300 mt-3">
              However, no method of transmission over the Internet or electronic
              storage is 100% secure. While we strive to use commercially
              acceptable means to protect your data, we cannot guarantee its
              absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              6. User Rights
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              You have certain rights regarding your personal data:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>
                <strong>Access:</strong> You can request access to the personal
                data we hold about you
              </li>
              <li>
                <strong>Correction:</strong> You can request correction of
                inaccurate or incomplete data
              </li>
              <li>
                <strong>Deletion:</strong> You can request deletion of your
                personal data, subject to certain legal obligations
              </li>
              <li>
                <strong>Export:</strong> You can request export of your data in
                a structured, commonly used format
              </li>
              <li>
                <strong>Objection:</strong> You can object to processing of your
                personal data in certain circumstances
              </li>
            </ul>
            <p className="text-gray-600 dark:text-gray-300 mt-3">
              To exercise these rights, please contact us at
              vfe0579bakpofure@gmail.com. We will respond to your request within
              30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              7. Cookies and Tracking
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              We use cookies and similar tracking technologies to track activity
              on our service:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>
                <strong>Authentication Cookies:</strong> Essential for keeping
                you logged in to your account
              </li>
              <li>
                <strong>Preferences Cookies:</strong> Remember your settings and
                preferences (e.g., dark mode, layout preferences)
              </li>
              <li>
                <strong>Analytics Cookies:</strong> Help us understand how users
                interact with our service
              </li>
            </ul>
            <p className="text-gray-600 dark:text-gray-300 mt-3">
              You can instruct your browser to refuse all cookies or to indicate
              when a cookie is being sent. However, if you do not accept
              cookies, you may not be able to use some portions of our service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              8. Children's Privacy
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Our service is not intended for children under the age of 13. We
              do not knowingly collect personally identifiable information from
              children under 13. If you are a parent or guardian and believe
              your child has provided us with personal data, please contact us,
              and we will delete such information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              9. Data Retention
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              We retain your personal data for different periods depending on
              the purpose:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>
                <strong>Account Data:</strong> Retained while your account is
                active and for a reasonable period after account closure
              </li>
              <li>
                <strong>Task Data:</strong> Retained according to your account
                settings and deletion requests
              </li>
              <li>
                <strong>Chat Messages:</strong> Retained according to your
                workspace settings and retention policies
              </li>
              <li>
                <strong>AI Interactions:</strong> May be retained for service
                improvement and quality purposes
              </li>
              <li>
                <strong>Analytics Data:</strong> Retained for business analysis
                and service improvement
              </li>
            </ul>
            <p className="text-gray-600 dark:text-gray-300 mt-3">
              When you delete your account, we will delete your personal data
              unless we are required to retain it for legal, security, or
              legitimate business purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              10. Real-Time Messaging
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              NewDay includes real-time messaging features powered by Socket.IO.
              Messages are transmitted in real-time between users in shared
              workspaces. While messages are encrypted in transit, please be
              aware that real-time messaging may have different privacy
              characteristics than stored data. Users should exercise caution
              when sharing sensitive information through chat features.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              11. Email Verification
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              We use Resend to send verification emails and other
              communications. When you provide your email address, we may send
              verification emails, notifications, and service-related messages.
              You can opt out of non-essential communications through your
              account settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              12. International Data Transfers
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Your information may be transferred to and processed in countries
              other than Nigeria. When we transfer your data internationally, we
              ensure appropriate safeguards are in place to protect your privacy
              and data security in accordance with this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              13. Changes to This Privacy Policy
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              We may update our Privacy Policy from time to time. We will notify
              you of any changes by posting the new Privacy Policy on this page
              and updating the "Last updated" date. You are advised to review
              this Privacy Policy periodically for any changes. Changes to this
              Privacy Policy are effective when they are posted on this page.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              14. Contact Us
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              If you have any questions about this Privacy Policy, please
              contact us:
              <br />
              <strong>Email:</strong> vfe0579bakpofure@gmail.com
              <br />
              <strong>Phone:</strong> 09037841541
              <br />
              <strong>Address:</strong> Behind Pricewise stores Gado Nasko,
              Kubwa, Abuja (FCT) 900101, Nigeria
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
