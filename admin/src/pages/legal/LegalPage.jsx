import React, { useState } from 'react';
import { ShieldCheck, Scale, FileText, AlertCircle, CheckCircle2, Save, ExternalLink } from 'lucide-react';

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState('compliance');
  const [saveMessage, setSaveMessage] = useState(false);

  // Content for legal sections
  const [grievanceOfficer, setGrievanceOfficer] = useState({
    name: 'Rajesh Mehta',
    designation: 'Grievance Redressal Officer (Rule 11, Digital Media Ethics Code)',
    email: 'grievance@e2stories.in',
    address: 'E² Stories Entertainment Ltd, Bandra Kurla Complex, Mumbai 400051',
    sla: '15 Days Maximum Resolution SLA'
  });

  const [termsText, setTermsText] = useState(`TERMS OF SERVICE — E² STORIES VERTICAL OTT PLATFORM
Last Updated: September 2026

1. ACCEPTANCE OF TERMS
By downloading, registering, or subscribing to the E² Stories application, you agree to be bound by these Terms of Service.

2. USER ACCOUNTS & PHONE OTP AUTHENTICATION
Users authenticate via verified mobile phone numbers (+91 OTP). Each account is licensed for personal, non-commercial entertainment purposes.

3. SUBSCRIPTIONS & MEMBERSHIPS
- Monthly Pass (₹199): Auto-renews every 30 days unless canceled 24 hours prior to renewal.
- Yearly All-Access Pass (₹1,499): Billed annually with 365 days of uninterrupted access.
- Payments are processed via PCI-DSS certified gateway (Razorpay).

4. INTELLECTUAL PROPERTY
All vertical micro-dramas, scripts, character portrayals, subtitles, and audio tracks are proprietary assets of E² Stories Ltd.`);

  const [privacyText, setPrivacyText] = useState(`PRIVACY POLICY — E² STORIES
Last Updated: September 2026

1. DATA COLLECTION
We collect verified phone numbers, basic profile details (Name, Email), device identifiers, and playback telemetry (watch time, completed episodes, pause/resume positions).

2. ADMOB & AD TARGETING
Free-tier episodes may display rewarded video advertisements and interstitial banners provided by Google AdMob. No sensitive personal data is shared with third-party advertisers.

3. DATA RETENTION & SECURITY
All telemetry is encrypted in transit (TLS 1.3) and at rest (AES-256). Users may request complete data deletion by emailing privacy@e2stories.in.`);

  const [refundText, setRefundText] = useState(`CANCELLATION & REFUND POLICY
Last Updated: September 2026

1. CANCELLATION
Subscribers may cancel their monthly recurring auto-pay at any time from the Profile > Manage Subscriptions tab in the mobile app.

2. REFUND ELIGIBILITY
Due to the digital streaming nature of the platform, subscription fees are generally non-refundable once content streaming has commenced. Exceptions apply for verified duplicate billing or technical playback failure exceeding 48 hours.`);

  const handleSave = () => {
    setSaveMessage(true);
    setTimeout(() => setSaveMessage(false), 2000);
  };

  return (
    <div className="space-y-6 font-urbanist">
      
      {/* Header */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 shadow-nodus flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0 shadow-xs">
            <Scale className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">Legal & Compliance</h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              Manage OTT platform terms, privacy policy, Indian IT ethics code compliance, and grievance officer details.
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 text-xs font-bold transition-all shadow-xs shrink-0 active:scale-98"
        >
          <Save className="w-4 h-4 text-slate-950" />
          <span>Save Changes</span>
        </button>
      </div>

      {saveMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center space-x-3 text-emerald-900 dark:text-emerald-300 text-xs font-bold transition-colors">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Legal policies and compliance records updated successfully!</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-white/10 pb-2 text-xs font-bold">
        {[
          { id: 'compliance', label: 'OTT Ethics & Grievance' },
          { id: 'terms', label: 'Terms of Service' },
          { id: 'privacy', label: 'Privacy Policy' },
          { id: 'refund', label: 'Refund Policy' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              activeTab === tab.id
                ? 'bg-[#FEF08A] text-slate-950 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Compliance */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#121612] rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 shadow-nodus space-y-4 transition-colors">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-white/10">
              <Scale className="w-5 h-5 text-slate-950 dark:text-[#FEF08A]" />
              <h3 className="font-extrabold text-base text-slate-950 dark:text-white">
                Statutory Grievance Officer (Information Technology Rules, 2021)
              </h3>
            </div>
            
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              In accordance with Rule 11 of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, the following officer is appointed for redressal of user complaints:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Grievance Officer Name</label>
                <input
                  type="text"
                  value={grievanceOfficer.name}
                  onChange={(e) => setGrievanceOfficer({ ...grievanceOfficer, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 font-semibold bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#121612] focus:outline-none focus:border-[#FEF08A] transition-colors"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Contact Email Address</label>
                <input
                  type="email"
                  value={grievanceOfficer.email}
                  onChange={(e) => setGrievanceOfficer({ ...grievanceOfficer, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 font-semibold bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#121612] focus:outline-none focus:border-[#FEF08A] transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Office / Postal Address</label>
                <input
                  type="text"
                  value={grievanceOfficer.address}
                  onChange={(e) => setGrievanceOfficer({ ...grievanceOfficer, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 font-semibold bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#121612] focus:outline-none focus:border-[#FEF08A] transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#121612] rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 shadow-nodus space-y-3 transition-colors">
            <h3 className="font-extrabold text-base text-slate-950 dark:text-white flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Self-Classification & Age Gating Compliance</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Every vertical drama uploaded to E² Stories must carry one of the 5 certified maturity tags:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs font-bold pt-2">
              <div className="p-3 bg-emerald-50 dark:bg-[#161B16] text-emerald-900 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800/60">U (Universal)</div>
              <div className="p-3 bg-blue-50 dark:bg-[#161B16] text-blue-900 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-800/60">U/A 7+</div>
              <div className="p-3 bg-amber-50 dark:bg-[#161B16] text-amber-900 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-800/60">U/A 13+</div>
              <div className="p-3 bg-orange-50 dark:bg-[#161B16] text-orange-900 dark:text-orange-400 rounded-xl border border-orange-200 dark:border-orange-800/60">U/A 16+</div>
              <div className="p-3 bg-rose-50 dark:bg-[#161B16] text-rose-900 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-800/60">A 18+ (Adults)</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Terms of Service */}
      {activeTab === 'terms' && (
        <div className="bg-white dark:bg-[#121612] rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 shadow-nodus space-y-3 transition-colors">
          <label className="block font-extrabold text-base text-slate-950 dark:text-white">
            Terms of Service Document Content
          </label>
          <textarea
            rows={14}
            value={termsText}
            onChange={(e) => setTermsText(e.target.value)}
            className="w-full p-4 font-mono text-xs leading-relaxed bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#121612] focus:outline-none focus:border-[#FEF08A] transition-colors"
          />
        </div>
      )}

      {/* Tab 3: Privacy Policy */}
      {activeTab === 'privacy' && (
        <div className="bg-white dark:bg-[#121612] rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 shadow-nodus space-y-3 transition-colors">
          <label className="block font-extrabold text-base text-slate-950 dark:text-white">
            Privacy Policy Document Content
          </label>
          <textarea
            rows={14}
            value={privacyText}
            onChange={(e) => setPrivacyText(e.target.value)}
            className="w-full p-4 font-mono text-xs leading-relaxed bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#121612] focus:outline-none focus:border-[#FEF08A] transition-colors"
          />
        </div>
      )}

      {/* Tab 4: Refund Policy */}
      {activeTab === 'refund' && (
        <div className="bg-white dark:bg-[#121612] rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 shadow-nodus space-y-3 transition-colors">
          <label className="block font-extrabold text-base text-slate-950 dark:text-white">
            Refund & Cancellation Policy Content
          </label>
          <textarea
            rows={14}
            value={refundText}
            onChange={(e) => setRefundText(e.target.value)}
            className="w-full p-4 font-mono text-xs leading-relaxed bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#121612] focus:outline-none focus:border-[#FEF08A] transition-colors"
          />
        </div>
      )}

    </div>
  );
}
