import React from 'react';

/**
 * Standard Admin ToggleSwitch
 * Consistent sizing, animations, and color styling across the entire admin panel:
 * - Active: Vibrant Mint / Emerald Green (#10B981)
 * - Inactive: Slate-300 / Slate-700
 * - Knob: Pure White circular thumb with shadow
 * - Dimensions: h-5 w-9 with h-4 w-4 knob (translate-x-4)
 */
export default function ToggleSwitch({
  checked,
  enabled,
  onChange,
  id,
  name,
  disabled = false,
  ariaLabel,
  title,
  className = '',
}) {
  const isChecked = Boolean(checked ?? enabled);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && onChange) {
      onChange(!isChecked);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.key === ' ' || e.key === 'Enter') && !disabled && onChange) {
      e.preventDefault();
      e.stopPropagation();
      onChange(!isChecked);
    }
  };

  return (
    <button
      id={id}
      name={name}
      type="button"
      role="switch"
      title={title}
      aria-label={ariaLabel}
      aria-checked={isChecked}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40 select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${
        isChecked
          ? 'bg-[#10B981]'
          : 'bg-slate-300 dark:bg-slate-700'
      } ${className}`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-md transform ring-0 transition duration-200 ease-in-out ${
          isChecked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
