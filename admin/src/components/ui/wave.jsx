import React from "react";
import { cn } from "@/lib/utils";

const WAVE_BAR_HEIGHTS = ["50%", "75%", "100%", "75%", "50%"];

function Wave({ className, style, ...props }) {
  // If no width/height class is passed, provide default h-5 w-6 so the percentage bars render visibly
  const hasDimensions = className && (/(\b|^)(h-|w-|size-|min-h-|min-w-)/.test(className));

  return (
    <>
      <style>{`
        @keyframes loading-ui-wave {
          0%,
          100% {
            transform: scaleY(1);
          }

          50% {
            transform: scaleY(0.6);
          }
        }
      `}</style>
      <span
        role="status"
        className={cn(
          "inline-flex items-center gap-[2.5%]",
          !hasDimensions && "h-5 w-6",
          className
        )}
        style={style}
        {...props}
      >
        {WAVE_BAR_HEIGHTS.map((height, index) => (
          <span
            key={index}
            aria-hidden="true"
            className="inline-block rounded-full bg-current"
            style={{
              width: "12.5%",
              height,
              animation:
                "loading-ui-wave var(--duration, 1s) ease-in-out infinite",
              animationDelay: `calc(var(--delay, 100ms) * ${index})`,
            }}
          />
        ))}
        <span className="sr-only">Loading</span>
      </span>
    </>
  );
}

export { Wave };
export default Wave;
