import { Component, type ReactNode, type ErrorInfo } from "react";

interface ErrorBoundaryProps {
  onError?: (error: Error) => void;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[LGTM] Render error:", error, errorInfo);
    this.props.onError?.(error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="lgtm-error-boundary">
          <div className="lgtm-error-boundary__card">
            <p className="lgtm-error-boundary__title">Something went wrong</p>
            <p className="lgtm-error-boundary__message">
              {this.state.error?.message ?? "An unexpected error occurred."}
            </p>
            <button
              className="lgtm-error-boundary__retry"
              onClick={this.handleRetry}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
