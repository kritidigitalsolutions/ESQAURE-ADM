import React, { useState } from 'react';
import { mockAuditLogs } from '../../data/mockOttData';
import { ShieldAlert, Search, Download, CheckCircle2, XCircle, Code, Eye, X, Clock, Calendar } from 'lucide-react';

export default function AuditlogPage() {
  const [logs, setLogs] = useState(mockAuditLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState('1M'); // '1D' | '1W' | '1M' | '1Y' | 'MAX'
  const [selectedDiff, setSelectedDiff] = useState(null);

  const filteredLogs = logs.filter(l => {
    const term = searchTerm.toLowerCase();
    return !term ||
           l.action.toLowerCase().includes(term) ||
           l.admin.toLowerCase().includes(term) ||
           l.targetId.toLowerCase().includes(term) ||
           l.id.toLowerCase().includes(term) ||
           l.status.toLowerCase().includes(term);
  });

  const histogramBars = [24, 38, 45, 60, 52, 78, 95, 82, 110, 125, 95, 140, 160, 130, 115, 145, 180, 150, 120, 95, 110, 135, 160, 175];

  return (
    <div className="space-y-6 font-urbanist">
      
      {/* Nodus Audit Stats Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#121612] rounded-2xl p-5 border border-slate-200/90 dark:border-white/10 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Authorized Admin Actions</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-950 dark:text-white font-urbanist">1,395</span>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">+14%</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Zero unverified mutation attempts</p>
        </div>

        <div className="bg-white dark:bg-[#121612] rounded-2xl p-5 border border-slate-200/90 dark:border-white/10 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Protected Media Resources</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-950 dark:text-white font-urbanist">1,258</span>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">+8%</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Episodes with strict DRM & JWT tokens</p>
        </div>

        <div className="bg-white dark:bg-[#121612] rounded-2xl p-5 border border-slate-200/90 dark:border-white/10 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Security & Transcode Alerts</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-950 dark:text-white font-urbanist">62</span>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">-22%</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Automated CDN failover healthy</p>
        </div>
      </div>

      {/* Nodus Activity Density Histogram */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-slate-950 dark:text-white text-base">Administrative Action Density</h3>
            <p className="text-xs text-slate-400 dark:text-slate-400">Hourly mutation frequency across content and user models</p>
          </div>

          {/* 1D, 1W, 1M, 1Y, MAX Range Pills */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-[#161B16] p-1 rounded-xl border border-slate-200 dark:border-white/10">
            {['1D', '1W', '1M', '1Y', 'MAX'].map((rng) => (
              <button
                key={rng}
                onClick={() => setTimeRange(rng)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeRange === rng
                    ? 'bg-[#FEF08A] text-slate-950 font-extrabold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {rng}
              </button>
            ))}
          </div>
        </div>

        {/* Histogram Bars */}
        <div className="h-24 flex items-end justify-between gap-1 pt-4 border-t border-slate-100 dark:border-white/10">
          {histogramBars.map((height, i) => (
            <div key={i} className="flex-1 flex flex-col items-center group relative cursor-pointer">
              <div
                className="w-full bg-slate-200 dark:bg-white/[0.08] group-hover:bg-[#FEF08A] dark:group-hover:bg-[#FEF08A] rounded-t transition-colors"
                style={{ height: `${(height / 180) * 100}%` }}
              ></div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter & Audit Table */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-sm overflow-hidden">
        
        <div className="p-4 border-b border-slate-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#161B16]">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search audit actions, admins, entities..."
              className="w-full pl-9 pr-8 py-2 text-xs font-semibold bg-white dark:bg-[#121612] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:border-[#FEF08A] focus:outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded-full cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{filteredLogs.length} Records Logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#161B16] border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Administrator</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4 text-right">Payload Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-slate-400">
                        <Search className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No activity logs match your search</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        No audit events found for "{searchTerm}". Try another search term.
                      </p>
                      <button
                        onClick={() => setSearchTerm('')}
                        className="mt-1 px-3 py-1 bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        Reset Search
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.04] transition-colors">
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      log.status === 'SUCCESS' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50' : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200/50 dark:border-red-800/50'
                    }`}>
                      {log.status === 'SUCCESS' ? <CheckCircle2 className="w-3 h-3 mr-0.5" /> : <XCircle className="w-3 h-3 mr-0.5" />}
                      <span>{log.status}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                    {log.admin}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium truncate max-w-[200px]" title={log.targetId}>
                    {log.targetId}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                    {log.time}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 dark:text-slate-400 text-[11px]">
                    {log.duration}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedDiff(log)}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-white/[0.06] hover:bg-[#FEF08A] hover:text-black dark:hover:bg-[#FEF08A] dark:hover:text-black text-slate-800 dark:text-slate-200 rounded-lg font-bold text-xs transition-colors border border-slate-200 dark:border-white/10 cursor-pointer"
                    >
                      View Diff
                    </button>
                  </td>
                </tr>
              ))
            )}
            </tbody>
          </table>
        </div>

      </div>

      {/* JSON Diff Inspector Modal */}
      {selectedDiff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#202620] text-slate-950 dark:text-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 dark:border-white/15">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10 mb-4">
              <div>
                <span className="text-xs font-mono font-bold text-amber-500 dark:text-[#FEF08A]">{selectedDiff.action}</span>
                <h4 className="text-sm font-bold text-slate-950 dark:text-white mt-0.5">{selectedDiff.targetId}</h4>
              </div>
              <button onClick={() => setSelectedDiff(null)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 mb-1">MUTATION DIFF (BEFORE / AFTER):</p>
                <div className="bg-slate-900 dark:bg-[#121612] p-3 rounded-xl border border-slate-800 dark:border-white/10 overflow-x-auto text-[11px]">
                  <pre className="text-emerald-400 leading-relaxed">
                    {JSON.stringify(selectedDiff.diff, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-white/10 flex justify-end">
              <button
                onClick={() => setSelectedDiff(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-800 dark:text-white font-bold text-xs rounded-xl transition-colors cursor-pointer border border-transparent dark:border-white/10"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
