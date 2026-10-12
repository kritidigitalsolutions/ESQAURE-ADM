import React, { useEffect, useRef } from 'react';

/**
 * Standard Admin ToggleSwitch powered by Web Awesome <wa-switch>
 * Provides full drop-in compatibility across the whole admin panel:
 * - checked / enabled
 * - onChange(nextValue)
 * - disabled
 * - size ('sm' | 'md' | 'lg' | 'small' | 'medium' | 'large')
 * - children (optional label)
 * - id, name, ariaLabel, title, className
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
  activeColor,
  size = 'small',
  children,
  ...rest
}) {
  const switchRef = useRef(null);
  const isChecked = Boolean(checked ?? enabled);

  // Normalize size for Web Awesome (small, medium, large)
  const waSize =
    size === 'sm' || size === 'small'
      ? 'small'
      : size === 'lg' || size === 'large'
      ? 'large'
      : 'medium';

  // Synchronize DOM properties with React state
  useEffect(() => {
    const el = switchRef.current;
    if (!el) return;

    if (el.checked !== isChecked) {
      el.checked = isChecked;
    }
    if (el.disabled !== Boolean(disabled)) {
      el.disabled = Boolean(disabled);
    }
  }, [isChecked, disabled]);

  // Listen to Web Awesome custom events (wa-change) and native change events
  useEffect(() => {
    const el = switchRef.current;
    if (!el) return;

    const handleChange = (e) => {
      if (disabled) return;
      e.stopPropagation();
      const nextChecked = Boolean(el.checked);
      if (onChange) {
        onChange(nextChecked);
      }
    };

    el.addEventListener('wa-change', handleChange);
    el.addEventListener('change', handleChange);

    return () => {
      el.removeEventListener('wa-change', handleChange);
      el.removeEventListener('change', handleChange);
    };
  }, [onChange, disabled]);

  return (
    <wa-switch
      ref={switchRef}
      id={id}
      name={name}
      size={waSize}
      title={title}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      checked={isChecked ? true : undefined}
      disabled={disabled ? true : undefined}
      data-state={isChecked ? 'checked' : 'unchecked'}
      className={`admin-wa-switch inline-flex items-center select-none cursor-pointer ${
        isChecked ? 'is-on' : 'is-off'
      } ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </wa-switch>
  );
}
