import React, { useState } from 'react';
import {
  Copy,
  Check,
  Save,
  Loader2,
  ShieldAlert,
  Smartphone,
  Apple,
  Coins,
  Film,
  Sparkles,
  Layers,
  Zap,
  Play,
  RotateCcw,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export default function AdmobConfigTab({ settings, googleTestUnits, onSaveSettings }) {
  const [form, setForm] = useState(() => ({
    admobEnabled: settings?.admobEnabled ?? true,
    testMode: settings?.testMode ?? false,
    androidAppId: settings?.androidAppId || 'ca-app-pub-9920192847192847~1234567890',
    iosAppId: settings?.iosAppId || 'ca-app-pub-9920192847192847~0987654321',
    adUnits: {
      rewarded: {
        android: settings?.adUnits?.rewarded?.android || 'ca-app-pub-9920192847192847/1122334455',
        ios: settings?.adUnits?.rewarded?.ios || 'ca-app-pub-9920192847192847/5544332211',
        enabled: settings?.adUnits?.rewarded?.enabled ?? true,
        rewardDescription: settings?.adUnits?.rewarded?.rewardDescription || 'Unlock Episode / 1 Free Pass'
      },
      interstitial: {
        android: settings?.adUnits?.interstitial?.android || 'ca-app-pub-9920192847192847/2233445566',
        ios: settings?.adUnits?.interstitial?.ios || 'ca-app-pub-9920192847192847/6655443322',
        enabled: settings?.adUnits?.interstitial?.enabled ?? true,
        intervalEpisodes: settings?.adUnits?.interstitial?.intervalEpisodes ?? 3
      },
      banner: {
        android: settings?.adUnits?.banner?.android || 'ca-app-pub-9920192847192847/3344556677',
        ios: settings?.adUnits?.banner?.ios || 'ca-app-pub-9920192847192847/7766554433',
        enabled: settings?.adUnits?.banner?.enabled ?? true
      },
      appOpen: {
        android: settings?.adUnits?.appOpen?.android || 'ca-app-pub-9920192847192847/4455667788',
        ios: settings?.adUnits?.appOpen?.ios || 'ca-app-pub-9920192847192847/8877665544',
        enabled: settings?.adUnits?.appOpen?.enabled ?? false
      },
      native: {
        android: settings?.adUnits?.native?.android || 'ca-app-pub-9920192847192847/5566778899',
        ios: settings?.adUnits?.native?.ios || 'ca-app-pub-9920192847192847/9988776655',
        enabled: settings?.adUnits?.native?.enabled ?? true
      }
    }
  }));

  const [copiedKey, setCopiedKey] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleUnitChange = (format, field, value) => {
    setForm(prev => ({
      ...prev,
      adUnits: {
        ...prev.adUnits,
        [format]: {
          ...prev.adUnits[format],
          [field]: value
        }
      }
    }));
  };

  const handleApplyGoogleTestUnits = () => {
    if (!googleTestUnits) return;
    setForm(prev => ({
      ...prev,
      testMode: true,
      androidAppId: googleTestUnits.android.appId,
      iosAppId: googleTestUnits.ios.appId,
      adUnits: {
        rewarded: {
          ...prev.adUnits.rewarded,
          android: googleTestUnits.android.rewarded,
          ios: googleTestUnits.ios.rewarded
        },
        interstitial: {
          ...prev.adUnits.interstitial,
          android: googleTestUnits.android.interstitial,
          ios: googleTestUnits.ios.interstitial
        },
        banner: {
          ...prev.adUnits.banner,
          android: googleTestUnits.android.banner,
          ios: googleTestUnits.ios.banner
        },
        appOpen: {
          ...prev.adUnits.appOpen,
          android: googleTestUnits.android.appOpen,
          ios: googleTestUnits.ios.appOpen
        },
        native: {
          ...prev.adUnits.native,
          android: googleTestUnits.android.native,
          ios: googleTestUnits.ios.native
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await onSaveSettings(form);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert(err.message || 'Failed to save AdMob settings');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCards = [
    {
      key: 'rewarded',
      title: 'Rewarded Video Ads',
      desc: 'Users watch a 15-30s video to unlock locked episodes (Ep 3+) or earn a 24h pass.',
      icon: Film,
      yieldTag: 'Highest Yield (₹213.20 eCPM)',
      extraField: (
        <div className="mt-2.5">
          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
            Reward Description / Incentive Label
          </label>
          <input
            type="text"
            value={form.adUnits.rewarded.rewardDescription}
            onChange={(e) => handleUnitChange('rewarded', 'rewardDescription', e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
          />
        </div>
      )
    },
    {
      key: 'interstitial',
      title: 'Interstitial Full-Screen Ads',
      desc: 'Displayed between episodes or after completing a video before auto-advancing.',
      icon: Zap,
      yieldTag: 'Core Monetization (₹135.10 eCPM)',
      extraField: (
        <div className="mt-2.5 flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200/80 dark:border-white/10">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
            Show Interstitial Every X Episodes:
          </span>
          <div className="flex items-center space-x-1.5">
            <input
              type="number"
              min="1"
              max="20"
              value={form.adUnits.interstitial.intervalEpisodes}
              onChange={(e) => handleUnitChange('interstitial', 'intervalEpisodes', Number(e.target.value))}
              className="w-16 px-2 py-1 text-xs text-center font-black rounded-lg bg-white dark:bg-[#121612] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
            />
            <span className="text-xs text-slate-400 font-bold">Episodes</span>
          </div>
        </div>
      )
    },
    {
      key: 'banner',
      title: 'Standard Display Banners',
      desc: 'Standard 320x50 / 300x250 banners rendered at the bottom of the feed or episodes drawer.',
      icon: Layers,
      yieldTag: 'Steady Impressions (₹117.10 eCPM)',
      extraField: null
    },
    {
      key: 'appOpen',
      title: 'App Open Splash Ads',
      desc: 'Displays when the app opens or resumes from background on mobile devices.',
      icon: Smartphone,
      yieldTag: 'High Visibility',
      extraField: null
    },
    {
      key: 'native',
      title: 'Native In-Feed Ad Units',
      desc: 'Blends natively with drama carousels and browse trays on homepage and search.',
      icon: Sparkles,
      yieldTag: 'High CTR & Smooth UX',
      extraField: null
    }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-urbanist">
      
      {/* Test Mode Notice */}
      {form.testMode && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-300/60 dark:border-amber-700/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5 text-amber-900 dark:text-amber-200">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <strong className="font-black block">Google AdMob Test Mode is Currently ACTIVE</strong>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 font-medium">
                The mobile app is receiving official Google test ads to protect your AdMob account from policy violations.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setForm(p => ({ ...p, testMode: false }))}
            className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shrink-0 transition-colors cursor-pointer text-xs"
          >
            Switch to Live Mode
          </button>
        </div>
      )}

      {/* App IDs Configuration Card */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-white/10 shadow-nodus">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-white/10">
          <div>
            <h3 className="text-base font-black text-slate-950 dark:text-white">
              Google AdMob App IDs
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Required by the Google Mobile Ads SDK inside `AndroidManifest.xml` and `Info.plist`.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleApplyGoogleTestUnits}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#161B16] hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Fill Google Test IDs</span>
            </button>
            <a
              href="https://admob.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-700 dark:text-[#FEF08A] bg-amber-50 dark:bg-[#FEF08A]/10 border border-amber-200 dark:border-amber-700/40"
            >
              <span>AdMob Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Android App ID */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200/70 dark:border-white/10">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-500" />
                <span>Android App ID</span>
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(form.androidAppId, 'androidAppId')}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
              >
                {copiedKey === 'androidAppId' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'androidAppId' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={form.androidAppId}
              onChange={(e) => setForm(p => ({ ...p, androidAppId: e.target.value }))}
              placeholder="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
              className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-white dark:bg-[#121612] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FEF08A]/60"
            />
          </div>

          {/* iOS App ID */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200/70 dark:border-white/10">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Apple className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <span>iOS App ID</span>
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(form.iosAppId, 'iosAppId')}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
              >
                {copiedKey === 'iosAppId' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'iosAppId' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={form.iosAppId}
              onChange={(e) => setForm(p => ({ ...p, iosAppId: e.target.value }))}
              placeholder="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
              className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-white dark:bg-[#121612] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FEF08A]/60"
            />
          </div>

        </div>
      </div>

      {/* Ad Units Format Cards */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-base font-black text-slate-950 dark:text-white">
              Ad Units & Format Placements
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Configure unique Ad Unit IDs and behavior triggers for each format.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5">
          {formatCards.map((fmt) => {
            const Icon = fmt.icon;
            const unit = form.adUnits[fmt.key];
            const isEnabled = unit.enabled;

            return (
              <div
                key={fmt.key}
                className={`bg-white dark:bg-[#121612] rounded-2xl p-4 sm:p-5 border transition-all ${
                  isEnabled
                    ? 'border-slate-200/90 dark:border-white/10 shadow-nodus'
                    : 'border-slate-200/50 dark:border-white/5 opacity-70'
                }`}
              >
                {/* Header of format card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0">
                      <Icon className="w-4.5 h-4.5 stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          {fmt.title}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-[#FEF08A]/15 text-amber-800 dark:text-[#FEF08A] border border-amber-200 dark:border-amber-700/40">
                          {fmt.yieldTag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        {fmt.desc}
                      </p>
                    </div>
                  </div>

                  {/* Enable / Disable Switch */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {isEnabled ? 'Active' : 'Disabled'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUnitChange(fmt.key, 'enabled', !isEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-white/20'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Input Fields (Android + iOS IDs) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Android Ad Unit ID</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(unit.android, `${fmt.key}_android`)}
                        className="text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-white"
                      >
                        {copiedKey === `${fmt.key}_android` ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={unit.android}
                      onChange={(e) => handleUnitChange(fmt.key, 'android', e.target.value)}
                      placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FEF08A]/60"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Apple className="w-3.5 h-3.5 text-slate-500" />
                        <span>iOS Ad Unit ID</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(unit.ios, `${fmt.key}_ios`)}
                        className="text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-white"
                      >
                        {copiedKey === `${fmt.key}_ios` ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={unit.ios}
                      onChange={(e) => handleUnitChange(fmt.key, 'ios', e.target.value)}
                      placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FEF08A]/60"
                    />
                  </div>
                </div>

                {/* Extra parameters (like intervalEpisodes or rewardDescription) */}
                {fmt.extraField}
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Button Dock */}
      <div className="sticky bottom-3 p-3.5 rounded-2xl bg-white/95 dark:bg-[#161B16]/95 backdrop-blur-md border border-slate-200 dark:border-white/15 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4" /> AdMob Settings successfully updated and deployed!
            </span>
          )}
          {!savedSuccess && (
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Changes apply instantly to mobile app ad fetch requests.
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isSaving ? 'Saving...' : 'Save AdMob Settings'}</span>
        </button>
      </div>

    </form>
  );
}
