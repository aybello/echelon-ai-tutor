import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Component, ReactNode, ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught render error:", error.message);
    console.error("[ErrorBoundary] Component stack:", info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#FFFFFF",
            fontFamily: "'Sora', sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            style={{
              maxWidth: 480,
              width: "100%",
              background: "#fff",
              borderRadius: 20,
              padding: "40px 32px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: "#FEE2E2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <AlertTriangle size={28} color="#DC2626" />
            </div>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 900,
                color: "#FFFFFF",
                margin: "0 0 10px",
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "#64748B",
                lineHeight: 1.6,
                margin: "0 0 24px",
              }}
            >
              An unexpected error occurred. Try refreshing the page or go back to
              the homepage. If the problem persists, contact{" "}
              <a href="mailto:support@echeloninstitute.ca" style={{ color: "#1D4ED8" }}>
                support@echeloninstitute.ca
              </a>
              .
            </p>
            {this.state.error && (
              <details
                style={{
                  marginBottom: 24,
                  textAlign: "left",
                  background: "#FFFFFF",
                  borderRadius: 10,
                  padding: "12px 14px",
                  fontSize: 12,
                  color: "#64748B",
                  fontFamily: "monospace",
                  wordBreak: "break-word",
                }}
              >
                <summary style={{ cursor: "pointer", fontWeight: 700, color: "#64748B" }}>
                  Error details
                </summary>
                <div style={{ marginTop: 8 }}>{this.state.error.message}</div>
              </details>
            )}
            <div
              className={cn("flex gap-3 justify-center flex-wrap")}
            >
              <button
                onClick={this.handleReset}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "12px 20px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #1D4ED8 0%, #0EA5E9 100%)",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 14,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <RotateCcw size={14} />
                Try Again
              </button>
              <a
                href="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "12px 20px",
                  borderRadius: 10,
                  background: "#FFFFFF",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: "none",
                }}
              >
                <Home size={14} />
                Go to Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
