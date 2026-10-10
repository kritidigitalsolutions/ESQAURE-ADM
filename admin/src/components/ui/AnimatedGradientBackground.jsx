import { motion } from "framer-motion";
import React, { useEffect, useRef } from "react";

/**
 * AnimatedGradientBackground
 *
 * This component renders a customizable animated radial gradient background with a subtle breathing effect.
 * It uses `framer-motion` for an entrance animation and raw CSS gradients for the dynamic background.
 *
 * @param {Object} props
 * @param {number} [props.startingGap=125] - Initial size of the radial gradient, defining the starting width.
 * @param {boolean} [props.Breathing=true] - Enables or disables the breathing animation effect.
 * @param {boolean} [props.breathing] - Alternative alias for Breathing.
 * @param {string[]} [props.gradientColors] - Array of colors to use in the radial gradient.
 * @param {number[]} [props.gradientStops] - Array of percentage stops corresponding to each color in gradientColors.
 * @param {number} [props.animationSpeed=0.02] - Speed of the breathing animation.
 * @param {number} [props.breathingRange=5] - Maximum range for the breathing animation in percentage points.
 * @param {React.CSSProperties} [props.containerStyle={}] - Additional inline styles for the gradient container.
 * @param {string} [props.containerClassName=""] - Additional class names for the gradient container.
 * @param {number} [props.topOffset=0] - Additional top offset for the gradient container.
 * @returns {JSX.Element}
 */
const AnimatedGradientBackground = ({
  startingGap = 112,
  Breathing = true,
  breathing,
  position = "50% 12%",
  gradientColors = [
    "#0A0A0C",
    "#141418",
    "#382e0e",
    "#7d6518",
    "#c4a62d",
    "#FEF08A",
    "#4d3c0c",
    "#0A0A0C",
  ],
  gradientStops = [42, 55, 68, 77, 84, 90, 95, 100],
  animationSpeed = 0.02,
  breathingRange = 5,
  containerStyle = {},
  topOffset = 0,
  containerClassName = "",
}) => {
  const isBreathing = Breathing ?? breathing ?? true;

  // Validation: Ensure gradientStops and gradientColors lengths match
  if (gradientColors.length !== gradientStops.length) {
    throw new Error(
      `GradientColors and GradientStops must have the same length.
     Received gradientColors length: ${gradientColors.length},
     gradientStops length: ${gradientStops.length}`
    );
  }

  const containerRef = useRef(null);

  useEffect(() => {
    let animationFrame;
    let width = startingGap;
    let directionWidth = 1;

    const animateGradient = () => {
      if (width >= startingGap + breathingRange) directionWidth = -1;
      if (width <= startingGap - breathingRange) directionWidth = 1;

      if (!isBreathing) directionWidth = 0;
      width += directionWidth * animationSpeed;

      const gradientStopsString = gradientStops
        .map((stop, index) => `${gradientColors[index]} ${stop}%`)
        .join(", ");

      const gradient = `radial-gradient(${width}% ${width + topOffset}% at ${position}, ${gradientStopsString})`;

      if (containerRef.current) {
        containerRef.current.style.background = gradient;
      }

      animationFrame = requestAnimationFrame(animateGradient);
    };

    animationFrame = requestAnimationFrame(animateGradient);

    return () => cancelAnimationFrame(animationFrame); // Cleanup animation
  }, [
    startingGap,
    isBreathing,
    gradientColors,
    gradientStops,
    animationSpeed,
    breathingRange,
    topOffset,
    position,
  ]);

  return (
    <motion.div
      key="animated-gradient-background"
      initial={{
        opacity: 0,
        scale: 1.5,
      }}
      animate={{
        opacity: 1,
        scale: 1,
        transition: {
          duration: 2,
          ease: [0.25, 0.1, 0.25, 1], // Cubic bezier easing
        },
      }}
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${containerClassName}`}
    >
      <div
        ref={containerRef}
        style={containerStyle}
        className="absolute inset-0 transition-transform"
      />
    </motion.div>
  );
};

export default AnimatedGradientBackground;
