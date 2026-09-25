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
} from 'lucide-react';

/**
 * Universal Pill Badge — Single consistent size across the entire admin.
 *
 * DEFAULT: size="sm"  →  used everywhere (KPI cards, tables, modals, drawers).
 * Only deviate with size="xs" for very dense table cells, or size="lg" for
 * prominent hero labels. Never mix sizes within the same card/row context.
 *
 * Variant families:
 *   Role       → admin | content-manager | content-partner
 *   Status     → active | inactive | published | given-by-admin
 *   Payment    → razorpay
 *   Plans      → flix9-basic | flix9-premium | no-plan
 *   KPI tags   → kpi-amber | kpi-neutral
 *   Live pills → live | live-mrr | live-base | live-users
 */

// ─── Variant Config Map ───────────────────────────────────────────────────────
export const BADGE_CONFIGS = {

  // ── Role ──────────────────────────────────────────────────────────────────
  admin: {
    label: 'Admin',
    icon: Shield,
    bg: 'bg-amber-100 dark:bg-amber-950/50',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border border-amber-300/50 dark:border-amber-700/40',
  },
  'content-manager': {
    label: 'Content Manager',
    icon: Film,
    bg: 'bg-blue-100 dark:bg-blue-950/50',
    text: 'text-blue-800 dark:text-blue-300',
    border: 'border border-blue-300/50 dark:border-blue-700/40',
  },
  'content-partner': {
    label: 'Content Partner',
    icon: Sparkles,
    bg: 'bg-pink-100 dark:bg-pink-950/50',
    text: 'text-pink-800 dark:text-pink-300',
    border: 'border border-pink-300/50 dark:border-pink-700/40',
  },

  // ── Status ────────────────────────────────────────────────────────────────
  'no-plan': {
    label: 'No Plan',
    icon: null,
    bg: 'bg-slate-100 dark:bg-slate-800/60',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border border-slate-200/70 dark:border-slate-600/30',
  },
  inactive: {
    label: 'Inactive',
    icon: X,
    bg: 'bg-red-100 dark:bg-red-950/50',
    text: 'text-red-700 dark:text-red-400',
    border: 'border border-red-200/60 dark:border-red-700/30',
  },
  active: {
    label: 'Active',
    icon: Check,
    bg: 'bg-emerald-100 dark:bg-emerald-950/50',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border border-emerald-200/60 dark:border-emerald-700/30',
  },
  published: {
    label: 'Published',
    icon: Check,
    bg: 'bg-emerald-100 dark:bg-emerald-950/50',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border border-emerald-200/60 dark:border-emerald-700/30',
  },
  'given-by-admin': {
    label: 'Given by Admin',
    icon: ShieldCheck,
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border border-emerald-200/50 dark:border-emerald-700/30',
  },

  // ── Payment / Source ──────────────────────────────────────────────────────
  razorpay: {
    label: 'Razorpay',
    icon: CreditCard,
    bg: 'bg-sky-100 dark:bg-sky-950/50',
    text: 'text-sky-700 dark:text-sky-400',
    border: 'border border-sky-200/60 dark:border-sky-700/30',
  },

  // ── Plan Tiers (Subscriber Page Badges Architecture) ──────────────────────
  'flix9-basic': {
    label: '1 Month Pass',
    icon: null,
    bg: 'bg-[#FEF08A]/40 dark:bg-amber-950/40',
    text: 'text-[#854d0e] dark:text-amber-400 font-bold',
    border: 'border border-amber-300/80 dark:border-amber-700/40',
  },
  'flix9-medium': {
    label: '6 Months Pass',
    icon: null,
    bg: 'bg-sky-100/90 dark:bg-sky-950/50',
    text: 'text-sky-800 dark:text-sky-300 font-bold',
    border: 'border border-sky-300/70 dark:border-sky-700/40',
  },
  'flix9-premium': {
    label: '12 Months All-Access',
    icon: null,
    bg: 'bg-violet-100/90 dark:bg-violet-950/50',
    text: 'text-violet-800 dark:text-violet-300 font-bold',
    border: 'border border-violet-300/70 dark:border-violet-700/40',
  },
  'flix9-trial': {
    label: '7-Day Free Trial',
    icon: null,
    bg: 'bg-emerald-100/90 dark:bg-emerald-950/50',
    text: 'text-emerald-800 dark:text-emerald-300 font-bold',
    border: 'border border-emerald-300/70 dark:border-emerald-700/40',
  },

  // ── KPI Accent Tags ───────────────────────────────────────────────────────
  // Pastel yellow (#FEF08A) — "Annual", "Avg", "₹2 Token", theme accent labels
  'kpi-amber': {
    label: '',
    icon: null,
    bg: 'bg-[#FEF08A] dark:bg-[#FEF08A]/10',
    text: 'text-slate-900 dark:text-amber-300',
    border: 'border border-amber-300/60 dark:border-amber-500/25',
  },
  // Neutral grey — "Total", "Catalog", "Cohort Rate", plain labels
  'kpi-neutral': {
    label: '',
    icon: null,
    bg: 'bg-slate-100 dark:bg-slate-800/70',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border border-slate-200/60 dark:border-slate-600/30',
  },

  // ── Live / Real-time Pills ────────────────────────────────────────────────
  // Solid emerald with animated pulse dot — "Live"
  live: {
    label: 'Live',
    icon: null,
    bg: 'bg-emerald-500',
    text: 'text-white',
    border: '',
    pulse: true,
  },
  // Emerald with ArrowUpRight — "Live MRR", "+12.5%", growth metrics
  'live-mrr': {
    label: 'Live MRR',
    icon: ArrowUpRight,
    bg: 'bg-emerald-500',
    text: 'text-white',
    border: '',
  },
  // Emerald with ArrowUpRight — "Active Base"
  'live-base': {
    label: 'Active Base',
    icon: ArrowUpRight,
    bg: 'bg-emerald-500',
    text: 'text-white',
    border: '',
  },
  // Emerald with Users icon — "Subscriber Base"
  'live-users': {
    label: 'Subscriber Base',
    icon: Users,
    bg: 'bg-emerald-500',
    text: 'text-white',
    border: '',
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
  if (val === 'active' || val === 'success') return 'active';
  if (val === 'published') return 'published';
  if (
    val === 'inactive' || val === 'suspended' || val === 'revoked' ||
    val === 'expired' || val === 'failed' || val === 'blocked'
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
// xs = only for ultra-dense table cells. lg = hero/featured contexts only.
const SIZE_CLASSES = {
  xs: 'px-2.5 py-1 text-[11px] font-semibold gap-1.5 leading-none',
  sm: 'px-3 py-1 text-xs font-semibold gap-1.5 leading-none',
  md: 'px-3.5 py-1.5 text-xs font-semibold gap-1.5 leading-none',
  lg: 'px-4 py-2 text-sm font-bold gap-2 leading-none',
};

const ICON_SIZES = {
  xs: 'w-3 h-3 stroke-[2.2]',
  sm: 'w-3.5 h-3.5 stroke-[2.2]',
  md: 'w-3.5 h-3.5 stroke-[2.2]',
  lg: 'w-4 h-4 stroke-[2.2]',
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
