import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = 'summary';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center font-urbanist">
          <div className="bg-white dark:bg-[#121612] border border-slate-200/80 dark:border-white/10 rounded-2xl p-8 max-w-lg w-full shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center mx-auto mb-4 text-slate-950 dark:text-amber-400">
              <AlertCircle className="w-7 h-7 stroke-[2.2]" />
            </div>

            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-2">
              Something went wrong
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              An unexpected error occurred while rendering this page. You can reload or return to the dashboard.
            </p>

            {this.state.error?.message && (
              <div className="p-3 mb-6 bg-slate-100 dark:bg-[#161B16] rounded-xl text-left border border-slate-200 dark:border-white/10 overflow-x-auto text-[11px] font-mono text-rose-600 dark:text-rose-400">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Home className="w-3.5 h-3.5" />
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
