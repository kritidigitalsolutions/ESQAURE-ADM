import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ShieldCheck, FileText, Scale, AlertCircle, CheckCircle2,
  Save, RotateCcw, Loader2, RefreshCw, Sparkles,
  Bold, Italic, Underline, List, Link, Undo2, Redo2,
  Eye, SplitSquareHorizontal, Pencil, Clock
} from 'lucide-react';
import { legalService } from '../../services/legalService';
import PageLoader from '../../components/common/PageLoader';

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
    <div className="h-[calc(100vh-92px)] flex flex-col gap-2.5 font-urbanist overflow-hidden">

      {/* ── Page header ── */}
      <div className="bg-white dark:bg-[#121612] rounded-xl px-4 py-2.5 border border-slate-200/90 dark:border-white/10 shadow-xs transition-colors shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center shrink-0">
              <Scale className="w-4 h-4 text-slate-950 dark:text-amber-400 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-950 dark:text-white leading-tight">Legal &amp; Policy Hub</h2>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                Edit and publish official documents served to your mobile app.
              </p>
            </div>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-white/[0.05] hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#FEF08A]' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className={`shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border ${
          toast.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
            : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* ── Two-column layout ── */}
      <div className="flex gap-3 items-stretch flex-1 min-h-0 overflow-hidden">

        {/* Sidebar */}
        <aside className="w-48 shrink-0 bg-white dark:bg-[#121612] rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-1.5 flex flex-col transition-colors overflow-hidden h-full">
          <div className="space-y-0.5 overflow-y-auto min-h-0 flex-1">
            <p className="text-[10px] font-extrabold text-slate-400 dark:text-white/25 uppercase tracking-[0.14em] px-2 pt-1 pb-1.5">
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
          </div>
        </aside>

        {/* Editor panel */}
        <div className="flex-1 min-w-0 bg-white dark:bg-[#121612] rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs overflow-hidden transition-colors flex flex-col h-full min-h-0">
          {loading ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <PageLoader size="sm" text="Loading..." minHeight="min-h-[200px]" />
            </div>
          ) : (
            <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden">

              {/* Doc topbar */}
              <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-slate-100 dark:border-white/[0.07] bg-slate-50/80 dark:bg-[#161B16]/60 shrink-0">
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
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Last revision & View toggle bar (Consolidated to save vertical space) */}
              <div className="flex items-center justify-between gap-3 px-5 py-2 border-b border-slate-100 dark:border-white/[0.07] bg-slate-50/60 dark:bg-black/10 shrink-0">
                <div className="flex items-center gap-3">
                  <ViewToggle mode={viewMode} onChange={setViewMode} />
                  {active.lastUpdated && (
                    <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-white/25 font-semibold">
                      <Clock className="w-3 h-3 opacity-70" />
                      <span>Last revision: {fmt(active.lastUpdated)}</span>
                    </div>
                  )}
                </div>
                <span className="text-[11px] font-mono text-slate-300 dark:text-white/20">
                  {(active.content || '').length.toLocaleString()} chars
                </span>
              </div>

              {/* Formatting toolbar */}
              <div className="flex items-center gap-0.5 px-4 py-1.5 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/40 dark:bg-black/10 shrink-0">
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

              {/* Editor + Preview panes (Fills available height, internal scrolling only) */}
              <div className="flex flex-1 overflow-hidden min-h-0 h-full">
                {(viewMode === 'write' || viewMode === 'split') && (
                  <div className="flex-1 relative overflow-hidden flex flex-col h-full">
                    <textarea
                      ref={textRef}
                      value={active.content}
                      onChange={e => setDocData(prev => ({ ...prev, [activeId]: { ...prev[activeId], content: e.target.value } }))}
                      spellCheck={false}
                      placeholder={`# ${activeDef.title}\n\nStart writing your document…\n\nSupports **bold**, _italic_, # Heading 1, ## Heading 2, - bullet list`}
                      className="w-full flex-1 resize-none focus:outline-none bg-white dark:bg-transparent overflow-y-auto"
                      style={{
                        padding: '16px 20px',
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
                    className="flex-1 overflow-y-auto bg-slate-50 dark:bg-black/20 text-slate-800 dark:text-slate-300 h-full"
                    style={{ padding: '16px 20px' }}
                    dangerouslySetInnerHTML={{ __html: renderMd(active.content) }}
                  />
                )}
              </div>

              {/* Bottom action bar */}
              <div className="flex items-center justify-end gap-2.5 px-5 py-3 border-t border-slate-100 dark:border-white/[0.07] bg-slate-50/70 dark:bg-[#161B16]/60 shrink-0">
                <button
                  type="button"
                  onClick={handleDiscard}
                  disabled={saving}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all cursor-pointer disabled:opacity-40"
                >
                  Discard Edits
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#161B16] hover:bg-slate-50 dark:hover:bg-white/[0.08] border border-slate-200/90 dark:border-white/10 shadow-xs transition-all cursor-pointer disabled:opacity-40"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-black text-slate-950 bg-[#FEF08A] hover:bg-[#FDE047] active:scale-[0.98] shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
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
