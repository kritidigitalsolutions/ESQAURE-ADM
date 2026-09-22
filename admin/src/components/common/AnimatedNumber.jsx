import React, { useState, useEffect, useRef } from 'react';

/**
 * Parses numeric strings like "₹94,500", "148,920", "+18.2%", "₹24.8 Lakh", "1.82 Cr", "₹199"
 * into prefix, numeric target, decimal count, comma format preference, and suffix.
 */
function parseNumberString(str) {
  if (typeof str === 'number') {
    return {
      prefix: '',
      target: str,
      decimals: Number.isInteger(str) ? 0 : 2,
      hasCommas: false,
      isIndian: false,
      suffix: '',
      raw: String(str),
    };
  }

  const raw = String(str ?? '');
  // Match prefix, numeric sequence (with optional decimal and commas), and suffix
  const match = raw.match(/^([^\d]*?)([-+]?[0-9][0-9.,]*)(.*)$/);
  if (!match) {
    return { isNaN: true, raw };
  }

  let prefix = match[1];
  let numPart = match[2];
  let suffix = match[3];

  if (numPart.startsWith('+')) {
    prefix = prefix + '+';
    numPart = numPart.slice(1);
  } else if (numPart.startsWith('-') && !prefix.includes('-')) {
    prefix = prefix + '-';
    numPart = numPart.slice(1);
  }

  const hasCommas = numPart.includes(',');
  const isIndian = prefix.includes('₹') || /,\d{2},/.test(numPart);

  const cleanNumStr = numPart.replace(/,/g, '');
  const target = parseFloat(cleanNumStr);

  if (isNaN(target)) {
    return { isNaN: true, raw };
  }

  const dotIdx = cleanNumStr.indexOf('.');
  const decimals = dotIdx >= 0 ? cleanNumStr.length - dotIdx - 1 : 0;

  return {
    prefix,
    target: prefix.endsWith('-') ? -target : target,
    decimals,
    hasCommas,
    isIndian,
    suffix,
    raw,
  };
}

/**
 * Ease out cubic function for smooth deceleration
 */
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export default function AnimatedNumber({
  value,
  duration = 750,
  className = '',
  decimals: forcedDecimals,
  prefix: forcedPrefix,
  suffix: forcedSuffix,
}) {
  const parsed = parseNumberString(value);

  // If value is not a valid number, render as-is
  if (parsed.isNaN) {
    return <span className={className}>{parsed.raw}</span>;
  }

  const target = parsed.target;
  const decimals = forcedDecimals !== undefined ? forcedDecimals : parsed.decimals;
  const prefix = forcedPrefix !== undefined ? forcedPrefix : parsed.prefix;
  const suffix = forcedSuffix !== undefined ? forcedSuffix : parsed.suffix;

  const [displayValue, setDisplayValue] = useState(() => {
    return formatValue(0, prefix, suffix, decimals, parsed.hasCommas, parsed.isIndian);
  });

  const prevTargetRef = useRef(0);
  const isFirstMountRef = useRef(true);
  const currentValRef = useRef(0);
  const rafRef = useRef(null);

  function formatValue(num, p, s, dec, withCommas, indian) {
    const isNeg = num < 0 && !p.includes('-');
    const absNum = Math.abs(num);
    let formattedNum;
    if (dec > 0) {
      formattedNum = absNum.toFixed(dec);
    } else {
      formattedNum = Math.round(absNum).toString();
    }

    if (withCommas) {
      const parts = formattedNum.split('.');
      const intPart = parseInt(parts[0], 10);
      const formattedInt = isNaN(intPart)
        ? parts[0]
        : intPart.toLocaleString(indian ? 'en-IN' : 'en-US');
      formattedNum = parts.length > 1 ? `${formattedInt}.${parts[1]}` : formattedInt;
    }

    return `${isNeg ? '-' : ''}${p}${formattedNum}${s}`;
  }

  useEffect(() => {
    const startValue = isFirstMountRef.current ? 0 : currentValRef.current;
    isFirstMountRef.current = false;
    const endValue = target;
    prevTargetRef.current = endValue;

    // If identical, just display raw
    if (startValue === endValue) {
      setDisplayValue(parsed.raw);
      currentValRef.current = endValue;
      return;
    }

    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easedProgress = easeOutCubic(progress);

      const currentNum = startValue + (endValue - startValue) * easedProgress;
      currentValRef.current = currentNum;

      if (progress < 1) {
        setDisplayValue(formatValue(currentNum, prefix, suffix, decimals, parsed.hasCommas, parsed.isIndian));
        rafRef.current = requestAnimationFrame(animate);
      } else {
        // Animation finished: render original raw string to ensure perfect formatting
        setDisplayValue(parsed.raw);
        currentValRef.current = endValue;
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, duration, target, decimals, prefix, suffix, parsed.raw, parsed.hasCommas, parsed.isIndian]);

  return <span className={`inline-block tabular-nums transition-opacity duration-200 ${className}`}>{displayValue}</span>;
}
