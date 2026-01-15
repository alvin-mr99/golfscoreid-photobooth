import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    // Reload the page to reset everything
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-8">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-12">
            {/* Error Icon */}
            <div className="text-center mb-8">
              <div className="inline-block p-6 bg-red-100 rounded-full mb-6">
                <svg className="w-20 h-20 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              <h1 className="text-4xl font-bold text-gray-800 mb-4">
                Terjadi Kesalahan
              </h1>
              
              <p className="text-xl text-gray-600 mb-8">
                Aplikasi mengalami masalah yang tidak terduga. Silakan mulai ulang.
              </p>
            </div>

            {/* Error Details (for debugging) */}
            {this.state.error && (
              <div className="mb-8 p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Detail Error:
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-700 font-mono break-all">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-40 p-3 bg-white rounded border border-gray-200">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="px-8 py-4 bg-red-600 text-white rounded-xl font-bold text-lg
                         hover:bg-red-700 active:bg-red-800
                         transition-colors duration-200
                         focus:outline-none focus:ring-4 focus:ring-red-300
                         flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Mulai Ulang Aplikasi
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-4 bg-gray-600 text-white rounded-xl font-bold text-lg
                         hover:bg-gray-700 active:bg-gray-800
                         transition-colors duration-200
                         focus:outline-none focus:ring-4 focus:ring-gray-300"
              >
                Reload Halaman
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-8 text-center text-gray-500 text-sm">
              <p>Jika masalah terus berlanjut, hubungi administrator sistem.</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
