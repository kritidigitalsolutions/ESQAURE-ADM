import React from 'react';
import {
  Shield,
  Film,
  Sparkles,
  X,
  Check,
  ShieldCheck,
  CreditCard,
  ArrowUpRight,
  Users,
  Clock,
  Video,
  FileText,
  Lock,
  Unlock,
} from 'lucide-react';

/**
 * Universal Pastel Pill Badge — Matches the requested design standard:
 * - Full rounded capsule shape (rounded-full)
 * - Soft pastel solid background fill
 * - Deep, dark matching hue text & icon for optimal readability and contrast
 * - Matching icon embedded in the badge (Check for active, X for offline/inactive, Clock for unread/pending, Video, FileText, etc.)
 */

// ─── Variant Config Map ───────────────────────────────────────────────────────
export const BADGE_CONFIGS = {

  // ── Role ──────────────────────────────────────────────────────────────────
  admin: {
    label: 'Admin',
    icon: Shield,
    bg: 'bg-amber-200 dark:bg-amber-400/20',
    text: 'text-amber-950 dark:text-amber-300',
    border: 'border border-amber-300/40 dark:border-amber-400/30',
  },
  'content-manager': {
    label: 'Content Manager',
    icon: Film,
    bg: 'bg-blue-200 dark:bg-blue-500/20',
    text: 'text-blue-950 dark:text-blue-300',
    border: 'border border-blue-300/40 dark:border-blue-500/30',
  },
  'content-partner': {
    label: 'Content Partner',
    icon: Sparkles,
    bg: 'bg-purple-200 dark:bg-purple-500/20',
    text: 'text-purple-950 dark:text-purple-300',
    border: 'border border-purple-300/40 dark:border-purple-500/30',
  },

  // ── Status (Matching user pictures 2, 4, 5) ──────────────────────────────
  active: {
    label: 'Active',
    icon: Check,
    bg: 'bg-emerald-200 dark:bg-emerald-500/20',
    text: 'text-emerald-950 dark:text-emerald-300',
    border: 'border border-emerald-300/40 dark:border-emerald-500/30',
  },
  offline: {
    label: 'Offline',
    icon: X,
    bg: 'bg-rose-200 dark:bg-rose-500/20',
    text: 'text-rose-950 dark:text-rose-300',
    border: 'border border-rose-300/40 dark:border-rose-500/30',
  },
  inactive: {
    label: 'Offline',
    icon: X,
    bg: 'bg-rose-200 dark:bg-rose-500/20',
    text: 'text-rose-950 dark:text-rose-300',
    border: 'border border-rose-300/40 dark:border-rose-500/30',
  },
  suspended: {
    label: 'Suspended',
    icon: X,
    bg: 'bg-rose-200 dark:bg-rose-500/20',
    text: 'text-rose-950 dark:text-rose-300',
    border: 'border border-rose-300/40 dark:border-rose-500/30',
  },
  failed: {
    label: 'Failed',
    icon: X,
    bg: 'bg-rose-200 dark:bg-rose-500/20',
    text: 'text-rose-950 dark:text-rose-300',
    border: 'border border-rose-300/40 dark:border-rose-500/30',
  },
  expired: {
    label: 'Expired',
    icon: X,
    bg: 'bg-rose-200 dark:bg-rose-500/20',
    text: 'text-rose-950 dark:text-rose-300',
    border: 'border border-rose-300/40 dark:border-rose-500/30',
  },
  published: {
    label: 'Published',
    icon: Check,
    bg: 'bg-emerald-200 dark:bg-emerald-500/20',
    text: 'text-emerald-950 dark:text-emerald-300',
    border: 'border border-emerald-300/40 dark:border-emerald-500/30',
  },
  'given-by-admin': {
    label: 'Given by Admin',
    icon: ShieldCheck,
    bg: 'bg-emerald-200 dark:bg-emerald-500/20',
    text: 'text-emerald-950 dark:text-emerald-300',
    border: 'border border-emerald-300/40 dark:border-emerald-500/30',
  },
  unread: {
    label: 'Unread',
    icon: Clock,
    bg: 'bg-amber-200 dark:bg-amber-400/20',
    text: 'text-amber-950 dark:text-amber-300',
    border: 'border border-amber-300/40 dark:border-amber-400/30',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    bg: 'bg-amber-200 dark:bg-amber-400/20',
    text: 'text-amber-950 dark:text-amber-300',
    border: 'border border-amber-300/40 dark:border-amber-400/30',
  },
  paused: {
    label: 'Paused',
    icon: Clock,
    bg: 'bg-amber-200 dark:bg-amber-400/20',
    text: 'text-amber-950 dark:text-amber-300',
    border: 'border border-amber-300/40 dark:border-amber-400/30',
  },
  draft: {
    label: 'Draft',
    icon: null,
    bg: 'bg-slate-200 dark:bg-white/[0.08]',
    text: 'text-slate-900 dark:text-slate-300',
    border: 'border border-slate-300/40 dark:border-white/10',
  },
  'no-plan': {
    label: 'No Plan',
    icon: null,
    bg: 'bg-slate-200 dark:bg-white/[0.08]',
    text: 'text-slate-900 dark:text-slate-300',
    border: 'border border-slate-300/40 dark:border-white/10',
  },

  // ── Media / Format (Matching user picture 1) ───────────────────────────────
  video: {
    label: 'Video',
    icon: Video,
    bg: 'bg-blue-200 dark:bg-blue-500/20',
    text: 'text-blue-950 dark:text-blue-300',
    border: 'border border-blue-300/40 dark:border-blue-500/30',
  },
  text: {
    label: 'Text',
    icon: FileText,
    bg: 'bg-blue-200 dark:bg-blue-500/20',
    text: 'text-blue-950 dark:text-blue-300',
    border: 'border border-blue-300/40 dark:border-blue-500/30',
  },

  // ── Categories / Genres (Matching user picture 3) ─────────────────────────
  sports: {
    label: 'sports',
    icon: null,
    bg: 'bg-emerald-200 dark:bg-emerald-500/20',
    text: 'text-emerald-950 dark:text-emerald-300',
    border: 'border border-emerald-300/40 dark:border-emerald-500/30',
  },
  news: {
    label: 'news',
    icon: null,
    bg: 'bg-amber-200 dark:bg-amber-400/20',
    text: 'text-amber-950 dark:text-amber-300',
    border: 'border border-amber-300/40 dark:border-amber-400/30',
  },
  entertainment: {
    label: 'entertainment',
    icon: null,
    bg: 'bg-purple-200 dark:bg-purple-500/20',
    text: 'text-purple-950 dark:text-purple-300',
    border: 'border border-purple-300/40 dark:border-purple-500/30',
  },

  // ── Payment / Source ──────────────────────────────────────────────────────
  razorpay: {
    label: 'Razorpay',
    icon: CreditCard,
    bg: 'bg-sky-200 dark:bg-sky-500/20',
    text: 'text-sky-950 dark:text-sky-300',
    border: 'border border-sky-300/40 dark:border-sky-500/30',
  },

  // ── Plan Tiers ────────────────────────────────────────────────────────────
  'flix9-basic': {
    label: '1 Month Pass',
    icon: null,
    bg: 'bg-amber-200 dark:bg-amber-400/20',
    text: 'text-amber-950 dark:text-amber-300',
    border: 'border border-amber-300/40 dark:border-amber-400/30',
  },
  'flix9-medium': {
    label: '6 Months Pass',
    icon: null,
    bg: 'bg-sky-200 dark:bg-sky-500/20',
    text: 'text-sky-950 dark:text-sky-300',
    border: 'border border-sky-300/40 dark:border-sky-500/30',
  },
  'flix9-premium': {
    label: '12 Months All-Access',
    icon: null,
    bg: 'bg-purple-200 dark:bg-purple-500/20',
    text: 'text-purple-950 dark:text-purple-300',
    border: 'border border-purple-300/40 dark:border-purple-500/30',
  },
  'flix9-trial': {
    label: '7-Day Free Trial',
    icon: Clock,
    bg: 'bg-emerald-200 dark:bg-emerald-500/20',
    text: 'text-emerald-950 dark:text-emerald-300',
    border: 'border border-emerald-300/40 dark:border-emerald-500/30',
  },

  // ── Access Tiers ──────────────────────────────────────────────────────────
  paid: {
    label: 'Paid',
    icon: Lock,
    bg: 'bg-amber-200 dark:bg-amber-400/20',
    text: 'text-amber-950 dark:text-amber-300',
    border: 'border border-amber-300/40 dark:border-amber-400/30',
  },
  free: {
    label: 'Free',
    icon: Unlock,
    bg: 'bg-slate-200 dark:bg-white/[0.08]',
    text: 'text-slate-900 dark:text-slate-300',
    border: 'border border-slate-300/40 dark:border-white/10',
  },

  // ── KPI Accent Tags ───────────────────────────────────────────────────────
  'kpi-amber': {
    label: '',
    icon: null,
    bg: 'bg-amber-200 dark:bg-amber-400/20',
    text: 'text-amber-950 dark:text-amber-300',
    border: 'border border-amber-300/40 dark:border-amber-400/30',
  },
  'kpi-neutral': {
    label: '',
    icon: null,
    bg: 'bg-slate-200 dark:bg-white/[0.08]',
    text: 'text-slate-900 dark:text-slate-300',
    border: 'border border-slate-300/40 dark:border-white/10',
  },

  // ── Live / Real-time Pills ────────────────────────────────────────────────
  live: {
    label: 'Live',
    icon: Check,
    bg: 'bg-emerald-200 dark:bg-emerald-500/20',
    text: 'text-emerald-950 dark:text-emerald-300',
    border: 'border border-emerald-300/40 dark:border-emerald-500/30',
  },
  'live-mrr': {
    label: 'Live MRR',
    icon: ArrowUpRight,
    bg: 'bg-emerald-200 dark:bg-emerald-500/20',
    text: 'text-emerald-950 dark:text-emerald-300',
    border: 'border border-emerald-300/40 dark:border-emerald-500/30',
  },
  'live-base': {
    label: 'Active Base',
    icon: ArrowUpRight,
    bg: 'bg-emerald-200 dark:bg-emerald-500/20',
    text: 'text-emerald-950 dark:text-emerald-300',
    border: 'border border-emerald-300/40 dark:border-emerald-500/30',
  },
  'live-users': {
    label: 'Subscriber Base',
    icon: Users,
    bg: 'bg-emerald-200 dark:bg-emerald-500/20',
    text: 'text-emerald-950 dark:text-emerald-300',
    border: 'border border-emerald-300/40 dark:border-emerald-500/30',
  },
};

// ─── Variant Resolver ─────────────────────────────────────────────────────────
export function resolveBadgeVariant(input) {
  if (!input) return 'no-plan';
  const val = String(input).trim().toLowerCase();

  // Roles
  if (val === 'admin' || val.includes('administrator')) return 'admin';
  if (val.includes('content manager')) return 'content-manager';
  if (val.includes('content partner') || val.includes('partner')) return 'content-partner';

  // Live / real-time
  if (val === 'live') return 'live';
  if (val.includes('live mrr') || val.includes('mrr')) return 'live-mrr';
  if (val.includes('active base')) return 'live-base';
  if (val.includes('subscriber base')) return 'live-users';

  // Statuses
  if (val === 'active' || val === 'success' || val === 'enabled') return 'active';
  if (val === 'published') return 'published';
  if (val === 'unread') return 'unread';
  if (val === 'pending' || val === 'processing') return 'pending';
  if (val === 'paused') return 'paused';
  if (val === 'offline') return 'offline';
  if (val === 'video') return 'video';
  if (val === 'text') return 'text';
  if (val === 'sports') return 'sports';
  if (val === 'news') return 'news';
  if (val === 'entertainment') return 'entertainment';
  if (val === 'paid') return 'paid';
  if (
    val === 'inactive' || val === 'suspended' || val === 'revoked' ||
    val === 'expired' || val === 'failed' || val === 'blocked' || val === 'disabled'
  ) return 'inactive';

  // Payment / Source
  if (val.includes('razorpay') || val.includes('autopay') || val.includes('upi')) return 'razorpay';
  if (val.includes('given by admin') || val.includes('manual') || val.includes('admin override')) return 'given-by-admin';

  // Plan Tiers - Priority matching from most specific to general
  if (
    val.includes('12 month') || val.includes('12m') || val.includes('annual') ||
    val.includes('yearly') || val.includes('365 day') || val.includes('all-access') ||
    val.includes('flix9 premium')
  ) return 'flix9-premium';

  if (
    val.includes('6 month') || val.includes('6m') || val.includes('180 day') ||
    val.includes('half year')
  ) return 'flix9-medium';

  if (
    val.includes('1 month') || val.includes('1m') || val.includes('monthly') ||
    val.includes('30 day') || val.includes('flix9 basic') || val.includes('starter')
  ) return 'flix9-basic';

  if (
    val.includes('trial') || val.includes('7-day') || val.includes('7 day')
  ) return 'flix9-trial';

  if (
    val.includes('free') || val.includes('no plan') || val.includes('none') ||
    val.includes('draft') || val.includes('tier plan')
  ) return 'no-plan';

  if (val.includes('premium') || val.includes('vip')) return 'flix9-premium';

  return 'flix9-basic';
}

// ─── Plan Name Normalizer ───────────────────────────────────────────────────
export function cleanPlanName(input) {
  if (!input) return 'Free Tier';
  const val = String(input).trim();
  if (!val || val === '—' || val === 'N/A') return 'Free Tier';

  const lower = val.toLowerCase();

  if (
    lower.includes('12 month') || lower.includes('12m') || lower.includes('annual') ||
    lower.includes('yearly') || lower.includes('all-access') || lower.includes('365 day') ||
    lower.includes('plan_12m')
  ) {
    return '12 Months All-Access';
  }

  if (
    lower.includes('6 month') || lower.includes('6m') || lower.includes('180 day') ||
    lower.includes('half year') || lower.includes('plan_6m')
  ) {
    return '6 Months Pass';
  }

  if (
    lower.includes('1 month') || lower.includes('1m') || lower.includes('monthly') ||
    lower.includes('30 day') || lower.includes('starter') || lower.includes('plan_1m')
  ) {
    return '1 Month Pass';
  }

  if (
    lower.includes('trial') || lower.includes('7-day') || lower.includes('7 day')
  ) {
    return '7-Day Free Trial';
  }

  if (
    lower.includes('free') || lower.includes('no plan') || lower.includes('none') ||
    lower.includes('draft')
  ) {
    return 'Free Tier';
  }

  return val.replace(/\s*\([^)]*₹[^)]*\)/gi, '').replace(/\s*\(\s*₹.*?\)/gi, '').replace(/\s+VIP/gi, '').trim() || 'Free Tier';
}

// ─── Single Canonical Size ────────────────────────────────────────────────────
// ONE size to rule them all — consistent across KPI cards, tables, modals, drawers.
// xs = compact table cells. sm = standard universal. lg = hero contexts.
const SIZE_CLASSES = {
  xs: 'px-2 py-0.5 text-[10px] font-bold gap-1 leading-none',
  sm: 'px-2.5 py-1 text-xs font-bold gap-1.5 leading-none',
  md: 'px-3 py-1.5 text-xs font-bold gap-1.5 leading-none',
  lg: 'px-3.5 py-2 text-sm font-bold gap-2 leading-none',
};

const ICON_SIZES = {
  xs: 'w-2.5 h-2.5 stroke-[2.5]',
  sm: 'w-3 h-3 stroke-[2.5]',
  md: 'w-3.5 h-3.5 stroke-[2.5]',
  lg: 'w-4 h-4 stroke-[2.5]',
};

// ─── Badge Component ──────────────────────────────────────────────────────────
export default function Badge({
  variant,
  status,
  role,
  plan,
  label,
  children,
  icon: CustomIcon,
  hideIcon = false,
  size = 'sm',          // ← universal default — use sm everywhere
  className = '',
  onClick,
  ...props
}) {
  const resolvedVariantKey =
    variant ||
    (status && resolveBadgeVariant(status)) ||
    (role && resolveBadgeVariant(role)) ||
    (plan && resolveBadgeVariant(plan)) ||
    (children && typeof children === 'string' && resolveBadgeVariant(children)) ||
    (label && resolveBadgeVariant(label)) ||
    'no-plan';

  const config = BADGE_CONFIGS[resolvedVariantKey] || BADGE_CONFIGS['no-plan'];

  const isPlanBadge = Boolean(
    plan ||
    (resolvedVariantKey && (resolvedVariantKey.startsWith('flix9-') || resolvedVariantKey === 'no-plan'))
  );

  let rawText = children || label || config.label;
  if (isPlanBadge && typeof rawText === 'string') {
    rawText = cleanPlanName(rawText);
  }
  const textContent = rawText;

  const IconComponent = CustomIcon !== undefined ? CustomIcon : config.icon;

  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.sm;
  const iconClass = ICON_SIZES[size] || ICON_SIZES.sm;
  const isLivePulse = config.pulse === true;

  const Comp = onClick ? 'button' : 'span';

  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={[
        'inline-flex items-center justify-center rounded-full select-none',
        'transition-all duration-150',
        sizeClass,
        config.bg,
        config.text,
        config.border,
        onClick ? 'cursor-pointer hover:opacity-85 active:scale-95' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {/* Animated pulse dot — live variant only */}
      {!hideIcon && isLivePulse && (
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
      )}

      {/* Lucide icon */}
      {!hideIcon && !isLivePulse && IconComponent && (
        <IconComponent className={`${iconClass} shrink-0`} />
      )}

      <span className="truncate whitespace-nowrap">{textContent}</span>
    </Comp>
  );
}
