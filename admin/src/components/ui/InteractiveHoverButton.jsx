import React from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const InteractiveHoverButton = React.forwardRef(
  ({ text = "Sign In", className, children, isLoading = false, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={isLoading || props.disabled}
        className={cn(
          "group relative w-full cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-white py-3 px-4 text-center font-bold text-sm text-slate-950 shadow-sm transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
            <span>Signing in...</span>
          </div>
        ) : (
          <>
            <span className="inline-block translate-x-1 transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
              {children || text}
            </span>
            <div className="absolute inset-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 text-slate-950 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
              <span>{children || text}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="absolute left-[20%] top-[40%] h-2 w-2 scale-[1] rounded-full bg-[#FEF08A] transition-all duration-500 ease-out group-hover:left-[0%] group-hover:top-[0%] group-hover:h-full group-hover:w-full group-hover:scale-[2.5] group-hover:bg-[#FEF08A]"></div>
          </>
        )}
      </button>
    );
  }
);

InteractiveHoverButton.displayName = "InteractiveHoverButton";

export default InteractiveHoverButton;
export { InteractiveHoverButton };
