import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Scale,
  FileText,
  AlertCircle,
  CheckCircle2,
  Save,
  RotateCcw,
  Loader2,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { legalService } from '../../services/legalService';

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState('compliance');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Content for legal sections
  const [grievanceOfficer, setGrievanceOfficer] = useState({
    name: 'Rajesh Mehta',
    designation: 'Grievance Redressal Officer (Rule 11, Digital Media Ethics Code)',
    email: 'grievance@e2stories.in',
    address: 'E² Stories Entertainment Ltd, Bandra Kurla Complex, Mumbai 400051',
    sla: '15 Days Maximum Resolution SLA'
  });

  const [termsText, setTermsText] = useState('');
  const [termsMeta, setTermsMeta] = useState({ version: '1.0.0', lastUpdated: null });

  const [privacyText, setPrivacyText] = useState('');
  const [privacyMeta, setPrivacyMeta] = useState({ version: '1.0.0', lastUpdated: null });

  const [refundText, setRefundText] = useState('');
  const [refundMeta, setRefundMeta] = useState({ version: '1.0.0', lastUpdated: null });

  // Load existing legal documents from backend
  const loadLegalData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await legalService.getAllDocs();
      const bySlug = res?.bySlug || {};

      if (bySlug['grievance-compliance']) {
        const comp = bySlug['grievance-compliance'];
        if (comp.metadata) {
          setGrievanceOfficer({
            name: comp.metadata.officerName || 'Rajesh Mehta',
            designation: comp.metadata.designation || 'Grievance Redressal Officer (Rule 11, Digital Media Ethics Code)',
            email: comp.metadata.email || 'grievance@e2stories.in',
            address: comp.metadata.address || 'E² Stories Entertainment Ltd, Bandra Kurla Complex, Mumbai 400051',
            sla: comp.metadata.sla || '15 Days Maximum Resolution SLA'
          });
        }
      }

      if (bySlug['terms-and-conditions']) {
        const terms = bySlug['terms-and-conditions'];
        setTermsText(terms.content || '');
        setTermsMeta({
          version: terms.version || '1.0.0',
          lastUpdated: terms.lastUpdated || terms.updatedAt
        });
      }

      if (bySlug['privacy-policy']) {
        const privacy = bySlug['privacy-policy'];
        setPrivacyText(privacy.content || '');
        setPrivacyMeta({
          version: privacy.version || '1.0.0',
          lastUpdated: privacy.lastUpdated || privacy.updatedAt
        });
      }

      if (bySlug['refund-policy']) {
        const refund = bySlug['refund-policy'];
        setRefundText(refund.content || '');
        setRefundMeta({
          version: refund.version || '1.0.0',
          lastUpdated: refund.lastUpdated || refund.updatedAt
        });
      }
    } catch (err) {
      console.error('Failed to load legal documents:', err);
      setErrorMessage(err.message || 'Could not load legal documents from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLegalData();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setErrorMessage(null);

      if (activeTab === 'compliance') {
        await legalService.updateCompliance({
          name: grievanceOfficer.name,
          designation: grievanceOfficer.designation,
          email: grievanceOfficer.email,
          address: grievanceOfficer.address,
          sla: grievanceOfficer.sla
        });
      } else if (activeTab === 'terms') {
        await legalService.updateDoc('terms-and-conditions', {
          title: 'Terms & Conditions',
          content: termsText,
          lastUpdated: new Date()
        });
      } else if (activeTab === 'privacy') {
        await legalService.updateDoc('privacy-policy', {
          title: 'Privacy Policy',
          content: privacyText,
          lastUpdated: new Date()
        });
      } else if (activeTab === 'refund') {
        await legalService.updateDoc('refund-policy', {
          title: 'Cancellation & Refund Policy',
          content: refundText,
          lastUpdated: new Date()
        });
      }

      setSaveMessage('Legal policies and compliance records updated successfully!');
      setTimeout(() => setSaveMessage(null), 3500);
      await loadLegalData();
    } catch (err) {
      console.error('Error saving legal documents:', err);
      setErrorMessage(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm('Reset legal documents to standard E² Stories defaults? Any unsaved edits will be replaced.')) {
      return;
    }
    try {
      setSaving(true);
      setErrorMessage(null);
      await legalService.seedDocs(true);
      await loadLegalData();
      setSaveMessage('Default OTT legal policies restored successfully!');
      setTimeout(() => setSaveMessage(null), 3500);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to restore default documents.');
    } finally {
      setSaving(false);
    }
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
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">Legal & Compliance</h2>
              <span className="px-2.5 py-0.5 text-[11px] font-bold tracking-wide rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/40">
                Rule 11 Ready
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              Live APIs powering Mobile Profile (Privacy Policy, Terms & Conditions) and Indian IT digital ethics code compliance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleResetDefaults}
            disabled={saving || loading}
            title="Reset to default legal templates"
            className="inline-flex items-center space-x-1.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#161B16] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300 text-xs font-bold transition-all disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset Defaults</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 text-xs font-bold transition-all shadow-xs shrink-0 active:scale-98 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 text-slate-950 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-slate-950" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center space-x-3 text-emerald-900 dark:text-emerald-300 text-xs font-bold transition-colors animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 rounded-2xl flex items-center space-x-3 text-rose-900 dark:text-rose-300 text-xs font-bold transition-colors">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-white/10 pb-2 text-xs font-bold">
        {[
          { id: 'compliance', label: 'OTT Ethics & Grievance', count: 'Rule 11' },
          { id: 'terms', label: 'Terms of Service', count: 'Mobile' },
          { id: 'privacy', label: 'Privacy Policy', count: 'Mobile' },
          { id: 'refund', label: 'Refund Policy', count: 'AutoPay' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-[#FEF08A] text-slate-950 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                activeTab === tab.id
                  ? 'bg-black/10 text-slate-900'
                  : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white dark:bg-[#121612] rounded-2xl p-12 border border-slate-200/90 dark:border-white/10 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-7 h-7 text-amber-500 animate-spin" />
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Loading legal document models from API...</p>
        </div>
      ) : (
        <>
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

                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Designation</label>
                    <input
                      type="text"
                      value={grievanceOfficer.designation}
                      onChange={(e) => setGrievanceOfficer({ ...grievanceOfficer, designation: e.target.value })}
                      className="w-full px-3.5 py-2.5 font-semibold bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#121612] focus:outline-none focus:border-[#FEF08A] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Resolution SLA</label>
                    <input
                      type="text"
                      value={grievanceOfficer.sla}
                      onChange={(e) => setGrievanceOfficer({ ...grievanceOfficer, sla: e.target.value })}
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
            <div className="bg-white dark:bg-[#121612] rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 shadow-nodus space-y-4 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-950 dark:text-[#FEF08A]" />
                  <label className="font-extrabold text-base text-slate-950 dark:text-white">
                    Terms & Conditions (Mobile Profile Screen)
                  </label>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 font-semibold">
                    <Layers className="w-3.5 h-3.5" /> v{termsMeta.version}
                  </span>
                  {termsMeta.lastUpdated && (
                    <span className="flex items-center gap-1 font-semibold">
                      <Calendar className="w-3.5 h-3.5" /> {new Date(termsMeta.lastUpdated).toLocaleDateString()}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                    Live Mobile API
                  </span>
                </div>
              </div>

              <textarea
                rows={16}
                value={termsText}
                onChange={(e) => setTermsText(e.target.value)}
                placeholder="Enter Terms & Conditions legal document text..."
                className="w-full p-4 font-mono text-xs leading-relaxed bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#121612] focus:outline-none focus:border-[#FEF08A] transition-colors"
              />
            </div>
          )}

          {/* Tab 3: Privacy Policy */}
          {activeTab === 'privacy' && (
            <div className="bg-white dark:bg-[#121612] rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 shadow-nodus space-y-4 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-slate-950 dark:text-[#FEF08A]" />
                  <label className="font-extrabold text-base text-slate-950 dark:text-white">
                    Privacy Policy (Mobile Profile Screen)
                  </label>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 font-semibold">
                    <Layers className="w-3.5 h-3.5" /> v{privacyMeta.version}
                  </span>
                  {privacyMeta.lastUpdated && (
                    <span className="flex items-center gap-1 font-semibold">
                      <Calendar className="w-3.5 h-3.5" /> {new Date(privacyMeta.lastUpdated).toLocaleDateString()}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                    Live Mobile API
                  </span>
                </div>
              </div>

              <textarea
                rows={16}
                value={privacyText}
                onChange={(e) => setPrivacyText(e.target.value)}
                placeholder="Enter Privacy Policy legal document text..."
                className="w-full p-4 font-mono text-xs leading-relaxed bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#121612] focus:outline-none focus:border-[#FEF08A] transition-colors"
              />
            </div>
          )}

          {/* Tab 4: Refund Policy */}
          {activeTab === 'refund' && (
            <div className="bg-white dark:bg-[#121612] rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 shadow-nodus space-y-4 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-950 dark:text-[#FEF08A]" />
                  <label className="font-extrabold text-base text-slate-950 dark:text-white">
                    Refund & AutoPay Cancellation Policy
                  </label>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 font-semibold">
                    <Layers className="w-3.5 h-3.5" /> v{refundMeta.version}
                  </span>
                  {refundMeta.lastUpdated && (
                    <span className="flex items-center gap-1 font-semibold">
                      <Calendar className="w-3.5 h-3.5" /> {new Date(refundMeta.lastUpdated).toLocaleDateString()}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                    Live Mobile API
                  </span>
                </div>
              </div>

              <textarea
                rows={16}
                value={refundText}
                onChange={(e) => setRefundText(e.target.value)}
                placeholder="Enter Refund & Cancellation Policy legal document text..."
                className="w-full p-4 font-mono text-xs leading-relaxed bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#121612] focus:outline-none focus:border-[#FEF08A] transition-colors"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
