import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ShieldCheck, FileText, Scale, AlertCircle, CheckCircle2,
  Save, RotateCcw, Loader2, RefreshCw, Sparkles,
  Bold, Italic, Underline, List, Link, Undo2, Redo2,
  Eye, SplitSquareHorizontal, Pencil, Clock
} from 'lucide-react';
import { legalService } from '../../services/legalService';

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : null;

const renderMd = (txt = '') => {
  if (!txt.trim())
    return `<p style="color:rgba(100,116,139,0.5);font-style:italic;font-size:13px;font-family:Urbanist,sans-serif">Nothing to preview — start writing on the left.</p>`;
  const inline = (s) =>
    s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/_(.*?)_/g, '<em>$1</em>');
  const html = [];
  let inList = false;
  for (const raw of txt.split('\n')) {
    if (!raw.trim()) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push('<div style="height:6px"></div>');
      continue;
    }
    if (/^# /.test(raw)) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<h1 style="font-size:20px;font-weight:900;color:inherit;margin:20px 0 6px;letter-spacing:-0.3px;line-height:1.2;font-family:Urbanist,sans-serif">${inline(raw.replace(/^# /,''))}</h1>`);
    } else if (/^## /.test(raw)) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<h2 style="font-size:14px;font-weight:800;margin:16px 0 4px;color:inherit;font-family:Urbanist,sans-serif">${inline(raw.replace(/^## /,''))}</h2>`);
    } else if (/^### /.test(raw)) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<h3 style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin:12px 0 3px;opacity:0.65;font-family:Urbanist,sans-serif">${inline(raw.replace(/^### /,''))}</h3>`);
    } else if (/^[-*] /.test(raw)) {
      if (!inList) { html.push('<ul style="padding-left:18px;margin:4px 0">'); inList = true; }
      html.push(`<li style="font-size:13px;line-height:1.75;margin-bottom:2px;font-family:Urbanist,sans-serif">${inline(raw.replace(/^[-*] /,''))}</li>`);
    } else {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<p style="font-size:13px;line-height:1.8;margin-bottom:2px;font-family:Urbanist,sans-serif">${inline(raw)}</p>`);
    }
  }
  if (inList) html.push('</ul>');
  return html.join('');
};

/* ─── Constants ──────────────────────────────────────────────────────────── */
const DOC_DEFS = [
  { id: 'terms',   title: 'Terms of Service', icon: FileText,    tag: 'Mobile' },
  { id: 'privacy', title: 'Privacy Policy',   icon: ShieldCheck, tag: 'Mobile' },
];
const SLUG_MAP  = { terms: 'terms-and-conditions', privacy: 'privacy-policy' };
const TITLE_MAP = { terms: 'Terms of Service',     privacy: 'Privacy Policy'  };

/* ─── Sidebar Card ───────────────────────────────────────────────────────── */
function DocCard({ def, data, active, onClick }) {
  const Icon = def.icon;
  return (
    <button
      onClick={onClick}
      className={`group w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all duration-150 ${
        active ? 'bg-[#FEF08A]' : 'hover:bg-slate-100 dark:hover:bg-white/[0.06]'
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
        active
          ? 'bg-slate-900/10'
          : 'bg-slate-200 dark:bg-white/10 group-hover:bg-slate-300 dark:group-hover:bg-white/15'
      }`}>
        <Icon className={`w-4 h-4 transition-colors ${
          active
            ? 'text-slate-900'
            : 'text-slate-500 dark:text-white/50 group-hover:text-slate-700 dark:group-hover:text-white/80'
        }`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-[13px] font-bold leading-tight truncate ${
          active ? 'text-slate-950' : 'text-slate-700 dark:text-white/75 group-hover:text-slate-900 dark:group-hover:text-white'
        }`}>{def.title}</p>
        <p className={`text-[11px] font-semibold mt-0.5 ${active ? 'text-slate-600' : 'text-slate-400 dark:text-white/35'}`}>
          {data?.version ? `v${data.version} · Published` : 'No content yet'}
        </p>
      </div>
      {active && <div className="w-1.5 h-1.5 rounded-full bg-slate-900/20 shrink-0" />}
    </button>
  );
}

/* ─── View Toggle ────────────────────────────────────────────────────────── */
function ViewToggle({ mode, onChange }) {
  const opts = [
    { id: 'write',   label: 'Write',      icon: Pencil },
    { id: 'split',   label: 'Split View', icon: SplitSquareHorizontal },
    { id: 'preview', label: 'Preview',    icon: Eye },
  ];
  return (
    <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-black/20 rounded-lg p-0.5 border border-slate-200 dark:border-white/[0.07]">
      {opts.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-bold transition-all ${
            mode === id
              ? 'bg-white dark:bg-white/10 text-slate-800 dark:text-white shadow-sm border border-slate-200/80 dark:border-white/[0.12]'
              : 'text-slate-400 dark:text-white/35 hover:text-slate-700 dark:hover:text-white/70'
          }`}
        >
          <Icon className="w-3 h-3" />{label}
        </button>
      ))}
    </div>
  );
}

/* ─── Toolbar Button ─────────────────────────────────────────────────────── */
function ToolBtn({ action, title, accent, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={action}
      className={`flex items-center justify-center w-7 h-7 rounded-md text-[12px] font-extrabold transition-all select-none ${
        accent
          ? 'bg-[#FEF08A]/20 text-amber-600 dark:text-[#FEF08A] hover:bg-[#FEF08A]/30'
          : 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.07]'
      }`}
    >
      {children}
    </button>
  );
}

/* ─── Published Badge ────────────────────────────────────────────────────── */
function PublishedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[11px] font-bold">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
      Published
    </span>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function LegalPage() {
  const textRef = useRef(null);

  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState(null);
  const [viewMode, setViewMode] = useState('split');
  const [activeId, setActiveId] = useState('terms');

  const [docData, setDocData] = useState({
    terms:   { content: '', version: '', lastUpdated: null },
    privacy: { content: '', version: '', lastUpdated: null },
  });

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  /* Fetch */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res    = await legalService.getAllDocs();
      const bySlug = res?.bySlug || {};
      setDocData(prev => {
        const next = { ...prev };
        const map  = { 'terms-and-conditions': 'terms', 'privacy-policy': 'privacy' };
        for (const [slug, id] of Object.entries(map)) {
          const doc = bySlug[slug];
          if (doc) next[id] = { content: doc.content || '', version: doc.version || '', lastUpdated: doc.lastUpdated || doc.updatedAt || null };
        }
        return next;
      });
    } catch (err) {
      showToast('error', err.message || 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* Save */
  const handleSave = async () => {
    setSaving(true);
    try {
      await legalService.updateDoc(SLUG_MAP[activeId], {
        title:   TITLE_MAP[activeId],
        content: docData[activeId].content,
      });
      showToast('success', 'Saved — document is now live on mobile API.');
      await loadData();
    } catch (err) {
      showToast('error', err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  /* Discard */
  const handleDiscard = async () => {
    if (!window.confirm('Discard all unsaved edits and reload from database?')) return;
    await loadData();
    showToast('success', 'Changes discarded.');
  };

  /* Insert markdown at cursor */
  const handleInsert = (before, after = '') => {
    const el = textRef.current;
    if (!el) return;
    const s   = el.selectionStart;
    const e   = el.selectionEnd;
    const sel = el.value.substring(s, e);
    const val = el.value.substring(0, s) + before + (sel || 'text') + after + el.value.substring(e);
    setDocData(prev => ({ ...prev, [activeId]: { ...prev[activeId], content: val } }));
    setTimeout(() => {
      el.selectionStart = s + before.length;
      el.selectionEnd   = s + before.length + (sel || 'text').length;
      el.focus();
    }, 0);
  };

  const active    = docData[activeId];
  const activeDef = DOC_DEFS.find(d => d.id === activeId) || DOC_DEFS[0];

  return (
    <div className="space-y-5 font-urbanist">

      {/* ── Page header ── */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl px-6 py-5 border border-slate-200/90 dark:border-white/10 shadow-sm transition-colors">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5 text-slate-950 dark:text-amber-400 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">Legal &amp; Policy Hub</h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                Edit and publish official documents served to your mobile app.
              </p>
            </div>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-white/[0.05] hover:text-slate-700 dark:hover:text-white transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#FEF08A]' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold border ${
          toast.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
            : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* ── Two-column layout ── */}
      <div className="flex gap-5 items-start">

        {/* Sidebar */}
        <aside className="w-52 shrink-0 bg-white dark:bg-[#121612] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-sm p-2 space-y-0.5 transition-colors">
          <p className="text-[10px] font-extrabold text-slate-400 dark:text-white/25 uppercase tracking-[0.14em] px-2.5 pt-1.5 pb-2">
            Documents
          </p>
          {DOC_DEFS.map(def => (
            <DocCard
              key={def.id}
              def={def}
              data={docData[def.id]}
              active={activeId === def.id}
              onClick={() => setActiveId(def.id)}
            />
          ))}
          <div className="pt-3 pb-1 px-1">
            <div className="rounded-xl p-3 bg-amber-50 dark:bg-[#FEF08A]/[0.04] border border-amber-100 dark:border-[#FEF08A]/[0.12]">
              <p className="text-[10px] font-extrabold text-amber-700 dark:text-[#FEF08A]/60 uppercase tracking-wider mb-1">IT Rules 2021</p>
              <p className="text-[11px] text-amber-800/60 dark:text-white/30 font-medium leading-[1.55]">
                Rule 11 mandates a published Grievance Officer for all OTT platforms.
              </p>
            </div>
          </div>
        </aside>

        {/* Editor panel */}
        <div
          className="flex-1 min-w-0 bg-white dark:bg-[#121612] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-sm overflow-hidden transition-colors flex flex-col"
          style={{ minHeight: '560px' }}
        >
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-24">
              <div className="w-10 h-10 rounded-2xl bg-[#FEF08A]/20 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-amber-500 dark:text-[#FEF08A]" />
              </div>
              <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">Loading from database…</p>
            </div>
          ) : (
            <div className="flex flex-col flex-1 min-h-0">

              {/* Doc topbar */}
              <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.07] bg-slate-50/80 dark:bg-[#161B16]/60 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                  <h3 className="text-[15px] font-extrabold text-slate-950 dark:text-white leading-none">{activeDef.title}</h3>
                  {active.version && (
                    <span className="text-[11px] font-mono font-bold text-slate-400 dark:text-white/35 bg-slate-100 dark:bg-white/[0.07] border border-slate-200 dark:border-white/[0.08] px-2 py-0.5 rounded-md shrink-0">
                      {active.version}
                    </span>
                  )}
                  <PublishedBadge />
                  {active.version && (
                    <span className="text-[10px] font-extrabold text-slate-300 dark:text-white/25 bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.06] px-2.5 py-0.5 rounded-lg font-mono shrink-0 hidden md:inline">
                      v{active.version} · PUBLISHED
                    </span>
                  )}
                </div>
                <button
                  onClick={loadData}
                  disabled={loading}
                  className="p-2 rounded-lg border border-slate-200 dark:border-white/[0.1] text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Last revision */}
              {active.lastUpdated && (
                <div className="flex items-center gap-1.5 px-5 pt-2.5 text-[11px] text-slate-400 dark:text-white/25 font-semibold shrink-0">
                  <Clock className="w-3 h-3 opacity-70" />
                  Last revision: {fmt(active.lastUpdated)}
                </div>
              )}



              {/* View toggle bar */}
              <div className="flex items-center gap-3 px-5 py-2.5 mt-3 border-b border-slate-100 dark:border-white/[0.07] bg-slate-50/60 dark:bg-black/10 shrink-0">
                <ViewToggle mode={viewMode} onChange={setViewMode} />
                <span className="ml-auto text-[11px] font-mono text-slate-300 dark:text-white/20">
                  {(active.content || '').length.toLocaleString()} chars
                </span>
              </div>

              {/* Formatting toolbar */}
              <div className="flex items-center gap-0.5 px-4 py-2 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/40 dark:bg-black/10 shrink-0">
                <ToolBtn action={() => document.execCommand('undo')} title="Undo"><Undo2 className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn action={() => document.execCommand('redo')} title="Redo"><Redo2 className="w-3.5 h-3.5" /></ToolBtn>
                <div className="w-px h-4 mx-1.5 bg-slate-200 dark:bg-white/[0.08]" />
                <ToolBtn action={() => handleInsert('**', '**')} title="Bold"><Bold className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn action={() => handleInsert('_', '_')} title="Italic"><Italic className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn action={() => handleInsert('<u>', '</u>')} title="Underline"><Underline className="w-3.5 h-3.5" /></ToolBtn>
                <div className="w-px h-4 mx-1.5 bg-slate-200 dark:bg-white/[0.08]" />
                <ToolBtn action={() => handleInsert('\n# ', '')} title="Heading 1" accent>H1</ToolBtn>
                <ToolBtn action={() => handleInsert('\n## ', '')} title="Heading 2">
                  <span className="text-slate-400 dark:text-white/50">H2</span>
                </ToolBtn>
                <ToolBtn action={() => handleInsert('\n### ', '')} title="Heading 3">
                  <span className="text-slate-300 dark:text-white/30">T</span>
                </ToolBtn>
                <div className="w-px h-4 mx-1.5 bg-slate-200 dark:bg-white/[0.08]" />
                <ToolBtn action={() => handleInsert('\n- ', '')} title="Bullet list"><List className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn action={() => handleInsert('[', '](https://)')} title="Insert link"><Link className="w-3.5 h-3.5" /></ToolBtn>
              </div>

              {/* Editor + Preview panes */}
              <div className="flex flex-1 overflow-hidden min-h-0">
                {(viewMode === 'write' || viewMode === 'split') && (
                  <div className="flex-1 relative overflow-hidden">
                    <textarea
                      ref={textRef}
                      value={active.content}
                      onChange={e => setDocData(prev => ({ ...prev, [activeId]: { ...prev[activeId], content: e.target.value } }))}
                      spellCheck={false}
                      placeholder={`# ${activeDef.title}\n\nStart writing your document…\n\nSupports **bold**, _italic_, # Heading 1, ## Heading 2, - bullet list`}
                      className="w-full h-full resize-none focus:outline-none bg-white dark:bg-transparent"
                      style={{
                        padding: '18px 22px',
                        fontFamily: '"JetBrains Mono","Fira Code","Cascadia Code",ui-monospace,monospace',
                        fontSize: '12.5px',
                        lineHeight: '1.85',
                        color: 'inherit',
                        caretColor: '#FEF08A',
                      }}
                    />
                  </div>
                )}
                {viewMode === 'split' && (
                  <div className="w-px shrink-0 bg-slate-200 dark:bg-white/[0.10]" />
                )}
                {(viewMode === 'preview' || viewMode === 'split') && (
                  <div
                    className="flex-1 overflow-y-auto bg-slate-50 dark:bg-black/20 text-slate-800 dark:text-slate-300"
                    style={{ padding: '18px 22px' }}
                    dangerouslySetInnerHTML={{ __html: renderMd(active.content) }}
                  />
                )}
              </div>

              {/* Bottom action bar */}
              <div className="flex items-center justify-end gap-2.5 px-5 py-3 border-t border-slate-100 dark:border-white/[0.07] bg-slate-50/60 dark:bg-[#161B16]/40 shrink-0">
                <button
                  onClick={handleDiscard}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-[12px] font-bold hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-all disabled:opacity-40"
                >
                  <RotateCcw className="w-3 h-3" /> Discard Edits
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.07] text-[12px] font-bold transition-all disabled:opacity-40"
                >
                  <Save className="w-3.5 h-3.5" /> Save Draft
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 text-[12px] font-extrabold active:scale-[0.97] transition-all disabled:opacity-50 shadow-sm"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {saving ? 'Publishing…' : 'Publish Changes'}
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
