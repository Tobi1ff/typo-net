import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'An unexpected error occurred.';
      try {
        const parsedError = JSON.parse(this.state.error?.message || '');
        if (parsedError.error) {
          errorMessage = `Firebase Error: ${parsedError.error} during ${parsedError.operationType} on ${parsedError.path}`;
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#111] border border-red-500/50 p-8 text-center">
            <h2 className="text-2xl font-black text-red-500 mb-4 italic transform -skew-x-12 uppercase tracking-tighter">System_Failure</h2>
            <p className="text-[#888] font-mono text-sm mb-6 leading-relaxed">
              {errorMessage}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500 text-white font-bold px-6 py-2 hover:bg-red-600 transition-all uppercase text-xs tracking-widest"
            >
              Reboot_System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
