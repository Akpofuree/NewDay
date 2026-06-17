"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";

interface TermsPageProps {
  onBack: () => void;
  darkMode: boolean;
}

export default function TermsPage({ onBack, darkMode }: TermsPageProps) {
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
          Terms and Conditions
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Last updated: June 03, 2026</p>

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
              <strong>Address:</strong> Behind Pricewise stores Gado Nasko, Kubwa, Abuja (FCT)
              900101
              <br />
              <strong>Phone:</strong> 09059003049
              <br />
              <strong>Email:</strong> vfe0579bakpofure@gmail.com
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              1. Our Services
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              NewDay provides a collaborative task management platform that includes AI-powered task
              suggestions, real-time team collaboration, group task management, productivity
              tracking, and workspace organization tools. By accessing or using our service, you
              agree to be bound by these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              2. Intellectual Property Rights
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              The content, features, and functionality of the NewDay platform are owned by NewDay
              and are protected by international copyright, trademark, and other intellectual
              property laws. You may not modify, reproduce, distribute, or create derivative works
              based on our service without explicit written permission.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              3. User Representations
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              By using NewDay, you represent and warrant that: (a) you are at least 13 years of age;
              (b) you have not been previously suspended or removed from the service; (c) your
              registration and use of the service complies with all applicable laws and regulations;
              and (d) you will not use the service for any illegal or unauthorized purpose.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              4. User Registration
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              To use certain features of the service, you must register for an account. You agree to
              provide accurate, current, and complete information during registration and to update
              such information to keep it accurate, current, and complete. You are responsible for
              maintaining the confidentiality of your account credentials.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              5. Purchases & Payment
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              All purchases on NewDay are denominated in Nigerian Naira (₦). We accept Mastercard
              and Visa payments. All purchases are non-refundable unless otherwise required by
              applicable law. By making a purchase, you agree to provide valid billing information
              and authorize us to charge your chosen payment method.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              6. Prohibited Activities
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              You may not access or use the service for any purpose other than that for which we
              make the service available. Prohibited activities include: (a) attempting to gain
              unauthorized access to the service; (b) interfering with or disrupting the service;
              (c) using the service to transmit malware or harmful code; (d) harvesting or
              collecting user data without consent; (e) impersonating any person or entity.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              7. User Generated Contributions
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              You may create, submit, display, and share content on NewDay. You retain ownership of
              your content but grant us a worldwide, non-exclusive, royalty-free license to use,
              reproduce, modify, and display your content for the purpose of operating and improving
              the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              8. Contribution Licence
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              By submitting content to NewDay, you grant us the right to use, reproduce, modify,
              adapt, publish, translate, distribute, and display such content throughout the world
              in any media. You represent and warrant that you own or control all rights to the
              content and that the content does not violate the rights of any third party.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              9. Guidelines for Reviews
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              If you submit reviews or feedback, you must: (a) provide only honest and accurate
              information; (b) not impersonate any person or entity; (c) not include defamatory,
              obscene, or illegal content; (d) not contain viruses or malicious code. We reserve the
              right to remove any review that violates these guidelines.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              10. Social Media
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              You may interact with our social media features. When you engage with our social media
              features, you may be disclosing information to third parties. Your interactions with
              these features are governed by the privacy policies of those third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              11. Services Management
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              We reserve the right at any time to modify or discontinue the service (or any part
              thereof) with or without notice. We shall not be liable to you or to any third party
              for any modification, price change, suspension, or discontinuance of the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              12. Privacy Policy
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Your use of the service is also governed by our Privacy Policy, which is incorporated
              into these Terms by reference. Please review our Privacy Policy, which also governs
              the service and describes how we collect, use, and protect your data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              13. Copyright Infringements
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              We respect the intellectual property rights of others. If you believe that your
              copyrighted work has been copied in a way that constitutes copyright infringement,
              please provide us with written notice including: (a) a description of the copyrighted
              work; (b) the location of the allegedly infringing content; (c) your contact
              information; (d) a statement of good faith belief; (e) a statement of accuracy under
              penalty of perjury.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              14. Term and Termination
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              These Terms shall remain in full force and effect while you use the service. We may
              terminate your access to the service at any time, without prior notice or liability,
              for any reason, including if you breach these Terms. Upon termination, your right to
              use the service will immediately cease.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              15. Modifications and Interruptions
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              We reserve the right to modify these Terms at any time. We will notify you of any
              material changes by posting the new Terms on the service. Your continued use of the
              service after such modifications constitutes your acceptance of the new Terms. We do
              not guarantee uninterrupted access to the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              16. Governing Law
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              These Terms shall be governed by and construed in accordance with the laws of Nigeria,
              without regard to its conflict of law provisions. Any disputes arising under these
              Terms shall be subject to the exclusive jurisdiction of the courts of Nigeria.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              17. Dispute Resolution
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Any dispute, controversy, or claim arising out of or relating to these Terms shall be
              resolved through the following process: (a) a 45-day informal negotiation period
              between the parties; (b) if unresolved, the dispute shall be submitted to ICAC
              arbitration seated in Abuja, Nigeria; (c) the arbitration shall be conducted by 3
              arbitrators; (d) proceedings shall be conducted in English; (e) the decision of the
              arbitrators shall be final and binding.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              18. Corrections
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              There may be information on the service that contains typographical errors,
              inaccuracies, or omissions. We reserve the right to correct any errors, inaccuracies,
              or omissions and to change or update information at any time without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              19. Disclaimer
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. WE EXPRESSLY DISCLAIM
              ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
              THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
              NON-INFRINGEMENT.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              20. Limitations of Liability
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              IN NO EVENT SHALL NEWDAY, OUR DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR
              AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
              DAMAGES, INCLUDING WITHOUT LIMITATION LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER
              INTANGIBLE LOSSES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE LESSER OF (A) THE AMOUNT
              YOU PAID TO US IN THE SIX MONTHS PRIOR TO THE CLAIM OR (B) ₦50,000.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              21. Indemnification
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              You agree to indemnify, defend, and hold harmless NewDay and our affiliates from and
              against any and all claims, damages, obligations, losses, liabilities, costs, or debt,
              and expenses (including but not limited to attorney's fees) arising from: (a) your use
              and access of the service; (b) your violation of any term of these Terms; (c) your
              violation of any third-party right, including without limitation any copyright,
              property, or privacy right.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">22. User Data</h2>
            <p className="text-gray-600 dark:text-gray-300">
              We will maintain certain data that you transmit to the service for the purpose of
              managing the service. You are responsible for maintaining the security of your account
              and all activities that occur under your account. We reserve the right to remove or
              reclaim any username that we deem inappropriate.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              23. Electronic Communications Transactions and Signatures
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Visiting the service, sending us emails, and completing online forms constitute
              electronic communications. You consent to receive electronic communications and agree
              that all agreements, notices, disclosures, and other communications that we provide to
              you electronically satisfy any legal requirement that such communications be in
              writing.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              24. California Users and Residents
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              If you are a resident of California, you may have specific rights regarding your
              personal information under the California Consumer Privacy Act (CCPA). While NewDay is
              a Nigerian company, we respect global privacy standards and will address reasonable
              requests from California residents regarding their personal data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              25. Miscellaneous
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              These Terms constitute the entire agreement between you and NewDay regarding the
              service. If any provision of these Terms is found to be unenforceable, the remaining
              provisions will remain in full force and effect. Our failure to enforce any right or
              provision of these Terms will not be considered a waiver of those rights.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-3">
              26. Contact Us
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              If you have any questions about these Terms, please contact us at:
              <br />
              <strong>Email:</strong> vfe0579bakpofure@gmail.com
              <br />
              <strong>Phone:</strong> 09059003049
              <br />
              <strong>Address:</strong> Behind Pricewise stores Gado Nasko, Kubwa, Abuja (FCT)
              900101, Nigeria
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
