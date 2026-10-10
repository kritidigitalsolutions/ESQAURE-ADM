import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  ShieldCheck,
  FileText,
  Scale,
  AlertCircle,
  CheckCircle2,
  Save,
  RotateCcw,
  RefreshCw,
  Sparkles,
  Bold,
  Italic,
  Underline,
  List,
  Link,
  Undo2,
  Redo2,
  Eye,
  SplitSquareHorizontal,
  Pencil,
  Clock,
  Download,
  Copy,
  Check,
  Radio,
  FileCheck2,
  Code2,
  Quote,
  X
} from 'lucide-react';
import { legalService } from '../../services/legalService';
import PageLoader from '../../components/common/PageLoader';

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

const renderMd = (txt = '') => {
  if (!txt.trim()) {
    return `<div class="text-slate-400 dark:text-slate-500 italic text-xs py-4 text-center">Nothing to preview — start writing on the left or load default policies.</div>`;
  }
  const inline = (s) =>
    s
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-950 dark:text-white">$1</strong>')
      .replace(/_(.*?)_/g, '<em class="italic text-slate-700 dark:text-slate-300">$1</em>')
      .replace(/`(.*?)`/g, '<code class="px-1 py-0.5 rounded bg-slate-100 dark:bg-white/[0.08] font-mono text-[11px] text-amber-600 dark:text-amber-400">$1</code>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-amber-600 dark:text-amber-400 underline underline-offset-2 hover:opacity-80 font-bold">$1</a>');

  const html = [];
  let inList = false;

  for (const raw of txt.split('\n')) {
    const line = raw.trim();
    if (!line) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push('<div class="h-2.5"></div>');
      continue;
    }
    if (/^# /.test(line)) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<h1 class="text-sm sm:text-base font-black text-slate-950 dark:text-white mt-3.5 mb-1.5 pb-1 border-b border-slate-200/60 dark:border-white/10 tracking-tight leading-snug">${inline(line.replace(/^# /, ''))}</h1>`);
    } else if (/^## /.test(line)) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<h2 class="text-xs sm:text-[13px] font-extrabold text-slate-950 dark:text-white mt-3 mb-1 tracking-tight">${inline(line.replace(/^## /, ''))}</h2>`);
    } else if (/^### /.test(line)) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<h3 class="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mt-2.5 mb-1">${inline(line.replace(/^### /, ''))}</h3>`);
    } else if (/^[-*] /.test(line)) {
      if (!inList) { html.push('<ul class="list-disc pl-4.5 space-y-1 my-1 text-xs text-slate-700 dark:text-slate-300">'); inList = true; }
      html.push(`<li class="leading-relaxed text-[11.5px]">${inline(line.replace(/^[-*] /, ''))}</li>`);
    } else if (/^\d+\. /.test(line)) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<p class="text-[11.5px] font-extrabold text-slate-900 dark:text-white mt-2 mb-0.5">${inline(line)}</p>`);
    } else {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<p class="text-[11.5px] leading-relaxed text-slate-700 dark:text-slate-300 mb-1">${inline(line)}</p>`);
    }
  }
  if (inList) html.push('</ul>');
  return html.join('');
};

/* ─── Document Definitions ───────────────────────────────────────────────── */
const DOC_DEFS = [
  {
    id: 'terms',
    slug: 'terms-and-conditions',
    title: 'Terms of Service',
    icon: FileText,
    category: 'User Agreement'
  },
  {
    id: 'privacy',
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    icon: ShieldCheck,
    category: 'Data & Ads'
  },
  {
    id: 'refund',
    slug: 'refund-policy',
    title: 'Refund Policy',
    icon: RotateCcw,
    category: 'Billing Terms'
  },
  {
    id: 'grievance',
    slug: 'grievance-compliance',
    title: 'Grievance & Ethics',
    icon: Scale,
    category: 'IT Rules 2021'
  }
];

/* ─── Toolbar Button Component ───────────────────────────────────────────── */
function ToolBtn({ action, title, accent, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={action}
      className={`flex items-center justify-center h-6.5 px-2 rounded-md text-[11px] font-bold transition-all select-none cursor-pointer ${
        accent
          ? 'bg-[#FEF08A]/30 text-amber-900 dark:text-[#FEF08A] hover:bg-[#FACC15]/40 border border-amber-300/40'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08]'
      }`}
    >
      {children}
    </button>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function LegalPage() {
  const textRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [viewMode, setViewMode] = useState('split'); // 'write' | 'split' | 'preview'
  const [activeId, setActiveId] = useState('terms');
  const [isCopied, setIsCopied] = useState(false);

  const [docData, setDocData] = useState({
    terms: { content: '', version: '1.0.0', lastUpdated: null, title: 'Terms of Service' },
    privacy: { content: '', version: '1.0.0', lastUpdated: null, title: 'Privacy Policy' },
    refund: { content: '', version: '1.0.0', lastUpdated: null, title: 'Cancellation & Refund Policy' },
    grievance: { content: '', version: '1.0.0', lastUpdated: null, title: 'OTT Ethics & Statutory Grievance Redressal' },
  });

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  /* Fetch all docs */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await legalService.getAllDocs();
      const bySlug = res?.bySlug || {};
      setDocData(prev => {
        const next = { ...prev };
        DOC_DEFS.forEach(def => {
          const doc = bySlug[def.slug];
          if (doc) {
            next[def.id] = {
              content: doc.content || '',
              version: doc.version || '1.0.0',
              lastUpdated: doc.lastUpdated || doc.updatedAt || null,
              title: doc.title || def.title,
              summary: doc.summary || ''
            };
          }
        });
        return next;
      });
    } catch (err) {
      showToast('error', err.message || 'Failed to load legal documents.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* Save / Publish */
  const handleSave = async () => {
    const currentDef = DOC_DEFS.find(d => d.id === activeId);
    if (!currentDef) return;

    setSaving(true);
    try {
      await legalService.updateDoc(currentDef.slug, {
        title: docData[activeId].title || currentDef.title,
        content: docData[activeId].content,
        version: docData[activeId].version || '1.0.0'
      });
      showToast('success', `${currentDef.title} published successfully! Live on mobile API.`);
      await loadData();
    } catch (err) {
      showToast('error', err.message || 'Failed to publish document.');
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
    const s = el.selectionStart;
    const e = el.selectionEnd;
    const sel = el.value.substring(s, e);
    const val = el.value.substring(0, s) + before + (sel || 'text') + after + el.value.substring(e);
    setDocData(prev => ({
      ...prev,
      [activeId]: { ...prev[activeId], content: val }
    }));
    setTimeout(() => {
      el.selectionStart = s + before.length;
      el.selectionEnd = s + before.length + (sel || 'text').length;
      el.focus();
    }, 0);
  };

  /* Copy active doc text */
  const handleCopy = () => {
    const text = docData[activeId]?.content || '';
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  /* Download as Markdown file */
  const handleDownload = () => {
    const currentDef = DOC_DEFS.find(d => d.id === activeId);
    const text = docData[activeId]?.content || '';
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentDef.slug}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const active = docData[activeId] || {};
  const activeDef = DOC_DEFS.find(d => d.id === activeId) || DOC_DEFS[0];

  // Character and word count
  const contentStats = useMemo(() => {
    const text = (active.content || '').trim();
    if (!text) return { words: 0, chars: 0 };
    const words = text.split(/\s+/).filter(Boolean).length;
    return { words, chars: text.length };
  }, [active.content]);


  return (
    <div className="space-y-3 font-urbanist selection:bg-[#FEF08A] selection:text-black">
      
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER BAR (Clean, Minimal, Compact)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#121216] rounded-xl p-3 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0 shadow-xs">
            <Scale className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-950 dark:text-white tracking-tight truncate">
                Legal & Compliance Hub
              </h2>
              <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-500" />
                <span>Mobile API Live</span>
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
              Manage and publish mobile app legal terms, privacy guidelines, and ethics compliance
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 transition-colors border border-slate-200/80 dark:border-white/10 cursor-pointer"
            title="Reload policies from server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          <button
            onClick={handleDownload}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] rounded-lg transition-colors border border-slate-200/80 dark:border-white/10 cursor-pointer"
            title="Download active policy markdown"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export .md</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold text-xs transition-colors shadow-xs cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>{saving ? 'Publishing...' : 'Publish Live'}</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-2.5 px-3 rounded-xl border flex items-center justify-between gap-2.5 text-xs font-bold shadow-xs transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span>{toast.msg}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-xs font-bold opacity-75 hover:opacity-100 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}



      {/* ─────────────────────────────────────────────────────────────
          3. HORIZONTAL DOCUMENT SELECTOR TABS (No cramped sidebar!)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#121216] rounded-xl p-1.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {DOC_DEFS.map((def) => {
          const Icon = def.icon;
          const isActive = activeId === def.id;
          const data = docData[def.id];

          return (
            <button
              key={def.id}
              onClick={() => setActiveId(def.id)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-[#FEF08A] text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{def.title}</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                isActive
                  ? 'bg-slate-950/15 text-slate-950'
                  : 'bg-slate-200/80 dark:bg-white/[0.08] text-slate-600 dark:text-slate-400'
              }`}>
                {data?.version ? `v${data.version}` : 'v1.0.0'}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. DOCUMENT WORKSPACE & EDITOR CARD
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#121216] rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden flex flex-col min-h-[520px]">
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <PageLoader size="sm" text="Loading legal document..." minHeight="min-h-[260px]" />
          </div>
        ) : (
          <>
            {/* Topbar: Title, Version, Mode Selector, Stats */}
            <div className="p-2.5 px-3.5 border-b border-slate-100 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2.5 min-w-0 flex-wrap">
                <span className="font-extrabold text-xs sm:text-sm text-slate-950 dark:text-white tracking-tight">
                  {activeDef.title}
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/[0.07] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                  {active.version ? `v${active.version}` : 'v1.0.0'}
                </span>
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Published &amp; Live</span>
                </span>
                {active.lastUpdated && (
                  <span className="text-[10.5px] text-slate-400 font-medium hidden md:inline">
                    · Last updated: {fmtDate(active.lastUpdated)}
                  </span>
                )}
              </div>

              {/* View Mode Toggle & Metrics */}
              <div className="flex items-center space-x-2 shrink-0">
                <div className="flex items-center bg-slate-100 dark:bg-black/20 rounded-lg p-0.5 border border-slate-200 dark:border-white/[0.07]">
                  <button
                    onClick={() => setViewMode('write')}
                    className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      viewMode === 'write'
                        ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Write</span>
                  </button>
                  <button
                    onClick={() => setViewMode('split')}
                    className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      viewMode === 'split'
                        ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <SplitSquareHorizontal className="w-3 h-3" />
                    <span>Split View</span>
                  </button>
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      viewMode === 'preview'
                        ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Preview</span>
                  </button>
                </div>

                <span className="text-[11px] font-mono font-semibold text-slate-400 dark:text-slate-500">
                  {contentStats.words} words · {contentStats.chars} chars
                </span>
              </div>
            </div>

            {/* Markdown Toolbar */}
            <div className="px-3 py-1 border-b border-slate-100 dark:border-white/10 bg-slate-50/40 dark:bg-black/10 flex items-center gap-0.5 overflow-x-auto scrollbar-none">
              <ToolBtn action={() => document.execCommand('undo')} title="Undo">
                <Undo2 className="w-3 h-3" />
              </ToolBtn>
              <ToolBtn action={() => document.execCommand('redo')} title="Redo">
                <Redo2 className="w-3 h-3" />
              </ToolBtn>

              <div className="w-px h-3.5 mx-1 bg-slate-200 dark:border-white/10" />

              <ToolBtn action={() => handleInsert('**', '**')} title="Bold">
                <Bold className="w-3 h-3" />
              </ToolBtn>
              <ToolBtn action={() => handleInsert('_', '_')} title="Italic">
                <Italic className="w-3 h-3" />
              </ToolBtn>
              <ToolBtn action={() => handleInsert('<u>', '</u>')} title="Underline">
                <Underline className="w-3 h-3" />
              </ToolBtn>

              <div className="w-px h-3.5 mx-1 bg-slate-200 dark:border-white/10" />

              <ToolBtn action={() => handleInsert('\n# ', '')} title="Heading 1" accent>
                H1
              </ToolBtn>
              <ToolBtn action={() => handleInsert('\n## ', '')} title="Heading 2">
                H2
              </ToolBtn>
              <ToolBtn action={() => handleInsert('\n### ', '')} title="Heading 3">
                H3
              </ToolBtn>

              <div className="w-px h-3.5 mx-1 bg-slate-200 dark:border-white/10" />

              <ToolBtn action={() => handleInsert('\n- ', '')} title="Bullet list">
                <List className="w-3 h-3" />
              </ToolBtn>
              <ToolBtn action={() => handleInsert('\n> ', '')} title="Quote block">
                <Quote className="w-3 h-3" />
              </ToolBtn>
              <ToolBtn action={() => handleInsert('`', '`')} title="Inline Code">
                <Code2 className="w-3 h-3" />
              </ToolBtn>
              <ToolBtn action={() => handleInsert('[', '](https://)')} title="Insert link">
                <Link className="w-3 h-3" />
              </ToolBtn>

              <div className="w-px h-3.5 mx-1 bg-slate-200 dark:border-white/10" />

              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center space-x-1 h-6.5 px-2 rounded-md text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all cursor-pointer ml-auto"
                title="Copy entire markdown text"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>

            {/* Editor & Preview Split Panes */}
            <div className="flex flex-1 min-h-[420px] overflow-hidden">
              {(viewMode === 'write' || viewMode === 'split') && (
                <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-transparent">
                  <textarea
                    ref={textRef}
                    value={active.content || ''}
                    onChange={(e) =>
                      setDocData((prev) => ({
                        ...prev,
                        [activeId]: { ...prev[activeId], content: e.target.value }
                      }))
                    }
                    spellCheck={false}
                    placeholder={`# ${activeDef.title}\n\nStart drafting policy content...\n\nSupports **bold**, _italic_, # Heading 1, ## Heading 2, - bullet lists.`}
                    className="w-full flex-1 p-3.5 text-xs font-mono resize-none focus:outline-hidden bg-transparent overflow-y-auto leading-relaxed text-slate-900 dark:text-slate-200 selection:bg-[#FEF08A] selection:text-black"
                    style={{ caretColor: '#FEF08A' }}
                  />
                </div>
              )}

              {viewMode === 'split' && (
                <div className="w-px shrink-0 bg-slate-200/80 dark:border-white/10" />
              )}

              {(viewMode === 'preview' || viewMode === 'split') && (
                <div
                  className="flex-1 p-4 overflow-y-auto bg-slate-50/70 dark:bg-[#18181E]/50 text-slate-800 dark:text-slate-300 leading-relaxed text-xs"
                  dangerouslySetInnerHTML={{ __html: renderMd(active.content || '') }}
                />
              )}
            </div>

            {/* Bottom Action Footer */}
            <div className="p-2.5 px-3.5 border-t border-slate-100 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                Published updates take effect immediately on viewer mobile devices.
              </span>

              <div className="flex items-center space-x-2 ml-auto">
                <button
                  type="button"
                  onClick={handleDiscard}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] transition-colors cursor-pointer"
                >
                  Discard Changes
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || loading}
                  className="px-4 py-1.5 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold text-xs transition-colors shadow-xs cursor-pointer active:scale-98 disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span>{saving ? 'Publishing...' : 'Publish Changes'}</span>
                </button>
              </div>
            </div>
          </>
        )}

      </div>

    </div>
  );
}
