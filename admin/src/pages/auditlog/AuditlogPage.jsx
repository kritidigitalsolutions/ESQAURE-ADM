import React, { useState } from 'react';
import { mockAuditLogs } from '../../data/mockOttData';
import { ShieldAlert, Search, Download, CheckCircle2, XCircle, Code, Eye, X, Clock, Calendar } from 'lucide-react';

export default function AuditlogPage() {
  const [logs, setLogs] = useState(mockAuditLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState('1M'); // '1D' | '1W' | '1M' | '1Y' | 'MAX'
  const [selectedDiff, setSelectedDiff] = useState(null);

  const filteredLogs = logs.filter(l => {
    return l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
           l.admin.toLowerCase().includes(searchTerm.toLowerCase()) ||
           l.targetId.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const histogramBars = [24, 38, 45, 60, 52, 78, 95, 82, 110, 125, 95, 140, 160, 130, 115, 145, 180, 150, 120, 95, 110, 135, 160, 175];

  return (
    <div class="space-y-6 font-urbanist">
      
      {/* Nodus Audit Stats Header */}
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-nodus">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Authorized Admin Actions</span>
          <div class="mt-2 flex items-baseline justify-between">
            <span class="text-3xl font-extrabold text-slate-950 font-urbanist">1,395</span>
            <span class="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">+14%</span>
          </div>
          <p class="text-[11px] text-slate-400 mt-1">Zero unverified mutation attempts</p>
        </div>

        <div class="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-nodus">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Protected Media Resources</span>
          <div class="mt-2 flex items-baseline justify-between">
            <span class="text-3xl font-extrabold text-slate-950 font-urbanist">1,258</span>
            <span class="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">+8%</span>
          </div>
          <p class="text-[11px] text-slate-400 mt-1">Episodes with strict DRM & JWT tokens</p>
        </div>

        <div class="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-nodus">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Security & Transcode Alerts</span>
          <div class="mt-2 flex items-baseline justify-between">
            <span class="text-3xl font-extrabold text-slate-950 font-urbanist">62</span>
            <span class="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">-22%</span>
          </div>
          <p class="text-[11px] text-slate-400 mt-1">Automated CDN failover healthy</p>
        </div>
      </div>

      {/* Nodus Activity Density Histogram */}
      <div class="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-nodus">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 class="font-bold text-slate-950 text-base">Administrative Action Density</h3>
            <p class="text-xs text-slate-400">Hourly mutation frequency across content and user models</p>
          </div>

          {/* 1D, 1W, 1M, 1Y, MAX Range Pills */}
          <div class="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {['1D', '1W', '1M', '1Y', 'MAX'].map((rng) => (
              <button
                key={rng}
                onClick={() => setTimeRange(rng)}
                class={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  timeRange === rng
                    ? 'bg-[#FEF08A] text-slate-950'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {rng}
              </button>
            ))}
          </div>
        </div>

        {/* Histogram Bars */}
        <div class="h-24 flex items-end justify-between gap-1 pt-4 border-t border-slate-100">
          {histogramBars.map((height, i) => (
            <div key={i} class="flex-1 flex flex-col items-center group relative cursor-pointer">
              <div
                class="w-full bg-slate-200 group-hover:bg-[#FEF08A] rounded-t transition-colors"
                style={{ height: `${(height / 180) * 100}%` }}
              ></div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter & Audit Table */}
      <div class="bg-white rounded-2xl border border-slate-200/90 shadow-nodus overflow-hidden">
        
        <div class="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div class="relative w-full sm:w-80">
            <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search audit actions, admins, entities..."
              class="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:border-[#FEF08A] focus:outline-none"
            />
          </div>

          <span class="text-xs font-bold text-slate-500">{filteredLogs.length} Records Logged</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4">Action Event</th>
                <th class="py-3 px-4">Administrator</th>
                <th class="py-3 px-4">Target Resource</th>
                <th class="py-3 px-4">Time</th>
                <th class="py-3 px-4">Latency</th>
                <th class="py-3 px-4 text-right">Payload Diff</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium">
              {filteredLogs.map((log) => (
                <tr key={log.id} class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3 px-4">
                    <span class={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {log.status === 'SUCCESS' ? <CheckCircle2 class="w-3 h-3 mr-0.5" /> : <XCircle class="w-3 h-3 mr-0.5" />}
                      <span>{log.status}</span>
                    </span>
                  </td>
                  <td class="py-3 px-4 font-mono font-bold text-slate-900">
                    {log.action}
                  </td>
                  <td class="py-3 px-4 font-bold text-slate-700">
                    {log.admin}
                  </td>
                  <td class="py-3 px-4 text-slate-600 font-medium truncate max-w-[200px]" title={log.targetId}>
                    {log.targetId}
                  </td>
                  <td class="py-3 px-4 font-mono text-slate-500 text-[11px]">
                    {log.time}
                  </td>
                  <td class="py-3 px-4 font-mono text-slate-400 text-[11px]">
                    {log.duration}
                  </td>
                  <td class="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedDiff(log)}
                      class="px-2.5 py-1 bg-slate-100 hover:bg-[#FEF08A] hover:text-black rounded-lg font-bold text-xs transition-colors"
                    >
                      View Diff
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* JSON Diff Inspector Modal */}
      {selectedDiff && (
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-slate-950 text-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-800">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <span class="text-xs font-mono font-bold text-[#FEF08A]">{selectedDiff.action}</span>
                <h4 class="text-sm font-bold text-white mt-0.5">{selectedDiff.targetId}</h4>
              </div>
              <button onClick={() => setSelectedDiff(null)} class="p-1 text-slate-400 hover:text-white rounded-lg">
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="space-y-3 text-xs font-mono">
              <div>
                <p class="text-[10px] font-bold text-slate-400 mb-1">MUTATION DIFF (BEFORE / AFTER):</p>
                <div class="bg-slate-900 p-3 rounded-xl border border-slate-800 overflow-x-auto text-[11px]">
                  <pre class="text-emerald-400 leading-relaxed">
                    {JSON.stringify(selectedDiff.diff, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            <div class="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedDiff(null)}
                class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors"
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
