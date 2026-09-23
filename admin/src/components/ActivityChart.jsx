import React, { useState, useMemo } from 'react';
import { Coins, ChevronRight } from 'lucide-react';
import ProgressMetricCard from './ui/progress-metric-card';
import AnimatedNumber from './common/AnimatedNumber';

export default function ActivityChart({ onNavigate }) {
  const [timeRange, setTimeRange] = useState('7D'); // '1D', '7D', '1M', '1Y', 'MAX'
  const [chartType, setChartType] = useState('users'); // 'users' or 'subscribers'

  // Time ranges definition with rich data points
  const periodOptions = [
    { label: '1D', points: 12 },
    { label: '7D', points: 14 },
    { label: '1M', points: 15 },
    { label: '1Y', points: 12 },
    { label: 'MAX', points: 12 },
  ];

  // Base anchor date
  const baseDate = useMemo(() => new Date(), []);

  // Smart dynamic dataset generator with 12-15 data bars
  const chartDatasets = useMemo(() => {
    const isHoliday = baseDate.getMonth() === 11;
    const boost = isHoliday ? 1.35 : 1.0;

    // 1D: 12 bi-hourly checkpoints (00:00 to 22:00)
    const hours = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
    const d1Users = hours.map((h, i) => {
      const val = Math.round((400 + Math.sin(i / 1.8) * 1800 + i * 150) * boost);
      return { time: h, date: h, raw: Math.max(300, val), badge: `+${(12 + i * 2).toFixed(0)}%`, note: `${h} user traffic` };
    });
    const d1Subs = hours.map((h, i) => {
      const val = Math.round((20 + Math.sin(i / 1.8) * 120 + i * 12) * boost);
      return { time: h, date: h, raw: Math.max(15, val), badge: `+${(10 + i * 2).toFixed(0)}%`, note: `${h} unlocks` };
    });

    // 7D: 14 dense rolling day points
    const d7Users = [];
    const d7Subs = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const timeLabel = `${weekday} ${dayNum}`;
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;

      const rawUsers = Math.round((3400 + (13 - i) * 320 + (isWeekend ? 850 : 0) + (i % 3) * 200) * boost);
      d7Users.push({
        time: timeLabel,
        date: timeLabel,
        raw: rawUsers,
        badge: '+20%',
        note: isWeekend ? 'Weekend engagement peak' : 'Daily active users',
      });

      const rawVal = Math.round((240 + (13 - i) * 26 + (isWeekend ? 70 : 0) + (i % 3) * 18) * boost);
      d7Subs.push({
        time: timeLabel,
        date: timeLabel,
        raw: rawVal,
        badge: '+18%',
        note: isWeekend ? 'Weekend paid volume' : 'Daily paid unlocks',
      });
    }

    // 1M: 15 evenly-spaced checkpoints
    const d1MUsers = [];
    const d1MSubs = [];
    for (let idx = 14; idx >= 0; idx--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - idx * 2);
      const dayNum = d.getDate();
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      const timeLabel = `${dayNum} ${monthName}`;

      const rawUsers = Math.round((2900 + (14 - idx) * 380 + (idx % 2 === 0 ? 400 : 0)) * boost);
      d1MUsers.push({ time: timeLabel, date: timeLabel, raw: rawUsers, badge: '+24%', note: `${monthName} active retention` });

      const rawVal = Math.round((190 + (14 - idx) * 28 + (idx % 2 === 0 ? 30 : 0)) * boost);
      d1MSubs.push({ time: timeLabel, date: timeLabel, raw: rawVal, badge: '+22%', note: `${monthName} renewals` });
    }

    // 1Y: 12 monthly points
    const d1YUsers = [];
    const d1YSubs = [];
    for (let k = 11; k >= 0; k--) {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - k, 1);
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      const yearShort = String(d.getFullYear()).slice(-2);
      const timeLabel = `${monthName} '${yearShort}`;

      const rawUsers = Math.round(2600 + (11 - k) * 540 + (k % 3) * 300);
      d1YUsers.push({ time: timeLabel, date: timeLabel, raw: rawUsers, badge: '+35%', note: 'Annual growth trend' });

      const rawVal = Math.round(180 + (11 - k) * 42 + (k % 3) * 25);
      d1YSubs.push({ time: timeLabel, date: timeLabel, raw: rawVal, badge: '+30%', note: 'Subscription growth trend' });
    }

    // MAX: 12 multi-quarter milestones
    const maxUsers = [
      { time: 'Q1 2024', date: 'Q1 2024', raw: 1200, badge: 'Launch', note: 'Platform beta' },
      { time: 'Q2 2024', date: 'Q2 2024', raw: 2100, badge: '+75%', note: 'First 10 dramas' },
      { time: 'Q3 2024', date: 'Q3 2024', raw: 3200, badge: '+52%', note: 'Catalog expansion' },
      { time: 'Q4 2024', date: 'Q4 2024', raw: 4100, badge: '+28%', note: 'Holiday campaign' },
      { time: 'Q1 2025', date: 'Q1 2025', raw: 5100, badge: '+24%', note: 'Viral release' },
      { time: 'Q2 2025', date: 'Q2 2025', raw: 6000, badge: '+17%', note: 'App store feature' },
      { time: 'Q3 2025', date: 'Q3 2025', raw: 6900, badge: '+15%', note: 'AdMob integration' },
      { time: 'Q4 2025', date: 'Q4 2025', raw: 7800, badge: '+13%', note: 'Regional marketing' },
      { time: 'Q1 2026', date: 'Q1 2026', raw: 8600, badge: '+10%', note: 'Global launch' },
      { time: 'Q2 2026', date: 'Q2 2026', raw: 9200, badge: '+7%', note: 'Subscription tier 2' },
      { time: 'Q3 2026', date: 'Q3 2026', raw: 9800, badge: '+6%', note: 'Current quarter peak' },
      { time: 'Current', date: 'Current', raw: 10400, badge: '+6%', note: 'All-time active user record' },
    ];

    const maxSubs = [
      { time: 'Q1 2024', date: 'Q1 2024', raw: 90, badge: 'Launch', note: 'Beta launch' },
      { time: 'Q2 2024', date: 'Q2 2024', raw: 180, badge: '+100%', note: 'First series' },
      { time: 'Q3 2024', date: 'Q3 2024', raw: 280, badge: '+55%', note: 'Catalog rollout' },
      { time: 'Q4 2024', date: 'Q4 2024', raw: 360, badge: '+28%', note: 'Pass unlock' },
      { time: 'Q1 2025', date: 'Q1 2025', raw: 450, badge: '+25%', note: 'Subscribers rollout' },
      { time: 'Q2 2025', date: 'Q2 2025', raw: 530, badge: '+17%', note: 'Retention uplift' },
      { time: 'Q3 2025', date: 'Q3 2025', raw: 620, badge: '+17%', note: 'Episode passes' },
      { time: 'Q4 2025', date: 'Q4 2025', raw: 700, badge: '+12%', note: 'Holiday rush' },
      { time: 'Q1 2026', date: 'Q1 2026', raw: 780, badge: '+11%', note: 'Micro-dramas surge' },
      { time: 'Q2 2026', date: 'Q2 2026', raw: 850, badge: '+9%', note: 'Auto renewals' },
      { time: 'Q3 2026', date: 'Q3 2026', raw: 920, badge: '+8%', note: 'Current quarter' },
      { time: 'Current', date: 'Current', raw: 990, badge: '+7%', note: 'All-time subscriber peak' },
    ];

    return {
      users: {
        unit: 'Users',
        title: 'Active Platform Users',
        subtitle: `Total active users & engagement (${baseDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`,
        data: {
          '1D': d1Users,
          '7D': d7Users,
          '1M': d1MUsers,
          '1Y': d1YUsers,
          'MAX': maxUsers,
        },
      },
      subscribers: {
        unit: 'Subscribers',
        title: 'Daily Subscriptions & Activations',
        subtitle: `New paid subscriptions & renewals (${baseDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`,
        data: {
          '1D': d1Subs,
          '7D': d7Subs,
          '1M': d1MSubs,
          '1Y': d1YSubs,
          'MAX': maxSubs,
        },
      },
    };
  }, [baseDate]);

  const currentMeta = chartDatasets[chartType];
  const rawList = currentMeta.data[timeRange] || currentMeta.data['7D'];

  const chartSeriesData = useMemo(() => {
    return rawList.map((item) => ({
      value: item.raw,
      date: item.time,
    }));
  }, [rawList]);

  // Compute peak value & current total display
  const peakVal = Math.max(...rawList.map((d) => d.raw), 0);
  const totalFormatted =
    chartType === 'users'
      ? `${(peakVal / 1000).toFixed(2)}k Users`
      : `${peakVal.toLocaleString()} Subscribers`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 font-sans">
      {/* Left Column: Progress Metric Card */}
      <div className="lg:col-span-8 flex">
        <ProgressMetricCard
          title={currentMeta.title}
          subtitle={currentMeta.subtitle}
          defaultView="bars"
          total={totalFormatted}
          percent="+20%"
          trend="up"
          accent="amber"
          period={timeRange}
          periodOptions={periodOptions}
          onPeriodChange={(opt) => setTimeRange(opt.label)}
          tabs={[
            { id: 'users', label: 'Users' },
            { id: 'subscribers', label: 'Subscribers' },
          ]}
          activeTab={chartType}
          onTabChange={(tabId) => setChartType(tabId)}
          data={chartSeriesData}
          size="md"
          showStats={true}
          className="h-full min-h-[380px]"
        />
      </div>

      {/* Right Column: Google AdMob Monetization Side Card */}
      <div className="lg:col-span-4 bg-white dark:bg-[#111111] rounded-[28px] p-6 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_24px_rgba(0,0,0,0.03)] card-subtle-hover flex flex-col justify-between group">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100/80 dark:bg-amber-900/30 border border-amber-300/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 shadow-2xs shrink-0">
                <Coins className="w-5 h-5 text-slate-950 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-950 dark:text-white text-base font-urbanist tracking-tight">
                  Google AdMob Monetization
                </h3>
              </div>
            </div>
          </div>

          {/* AdMob Monthly Revenue Box */}
          <div className="mt-4 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100/90 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-urbanist">
                  Monthly Ad Revenue (March 2026)
                </span>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-700/40">
                  Live Sync
                </span>
              </div>
              <div className="mt-1.5">
                <span className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white font-urbanist tracking-tight block">
                  <AnimatedNumber value="₹4,85,200" />
                </span>
              </div>
            </div>

            {/* Ad Format Share Breakdown (Stacked Pill Shape with Curved BG) */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block font-urbanist">
                AD FORMAT REVENUE SHARE
              </span>

              {/* Format 1: Rewarded Video */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 transition-all shadow-2xs flex items-center justify-between">
                <span className="font-semibold text-slate-600 dark:text-slate-400 text-[11px] font-urbanist">Rewarded Video (Ep Unlock)</span>
                <div className="text-right flex items-baseline space-x-1.5">
                  <span className="text-slate-950 dark:text-white font-black text-2xl sm:text-3xl font-urbanist tracking-tight">
                    <AnimatedNumber value="62.4%" />
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 font-bold text-xs">(₹3.02L)</span>
                </div>
              </div>

              {/* Format 2: Interstitial Ads */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 transition-all shadow-2xs flex items-center justify-between">
                <span className="font-semibold text-slate-600 dark:text-slate-400 text-[11px] font-urbanist">Interstitial (Nav & End)</span>
                <div className="text-right flex items-baseline space-x-1.5">
                  <span className="text-slate-950 dark:text-white font-black text-2xl sm:text-3xl font-urbanist tracking-tight">
                    <AnimatedNumber value="24.8%" />
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 font-bold text-xs">(₹1.20L)</span>
                </div>
              </div>

              {/* Format 3: Native & Banner */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 transition-all shadow-2xs flex items-center justify-between">
                <span className="font-semibold text-slate-600 dark:text-slate-400 text-[11px] font-urbanist">Native Feed & Banner</span>
                <div className="text-right flex items-baseline space-x-1.5">
                  <span className="text-slate-950 dark:text-white font-black text-2xl sm:text-3xl font-urbanist tracking-tight">
                    <AnimatedNumber value="12.8%" />
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 font-bold text-xs">(₹62k)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end text-xs text-slate-500 dark:text-slate-500">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('admob')}
            className="font-bold text-slate-950 dark:text-white hover:underline flex items-center gap-0.5"
          >
            <span>View Full AdMob Analytics</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
