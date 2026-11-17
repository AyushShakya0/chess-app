"use client";

import React, { Component, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  modeName: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ModeErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[Error in ${this.props.modeName}]:`, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="w-full max-w-lg mx-auto my-12 bg-slate-900 border border-red-900/60 rounded-3xl p-8 text-center shadow-2xl flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>

          <h3 className="text-base font-bold text-white mb-1">
            {this.props.modeName} Encountered an Error
          </h3>
          <p className="text-xs text-slate-400 mb-5 leading-relaxed">
            The error was isolated to this tab. You can safely switch tabs or reset this mode.
          </p>

          {this.state.error && (
            <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-red-300 mb-5 text-left truncate">
              {this.state.error.message}
            </div>
          )}

          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg"
          >
            <RefreshCw className="w-4 h-4" />
            Reload {this.props.modeName}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

