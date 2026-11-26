import { Component, type ReactNode } from "react";
import { Link } from "wouter";

interface Props {
  children: ReactNode;
  examName?: string;
  backPath?: string;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

/**
 * Per-flashcard-page error boundary.
 * Catches any runtime errors thrown while rendering a flashcard deck
 * (e.g. malformed question bank data) and shows a friendly recovery UI
 * instead of the generic app-level error screen.
 */
export default class FlashcardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: unknown): State {
    const msg =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return { hasError: true, errorMessage: msg };
  }

  componentDidCatch(error: unknown, info: { componentStack: string }) {
    console.error("[FlashcardErrorBoundary] Caught error:", error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, errorMessage: "" });
    // Force a full page reload so Vite re-evaluates the module
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { examName = "Flashcards", backPath = "/" } = this.props;

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0f172a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div
          style={{
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "1rem",
            padding: "2.5rem",
            maxWidth: "480px",
            width: "100%",
            textAlign: "center",
          }}
        >
          {/* Icon */}
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🃏</div>

          {/* Heading */}
          <h2
            style={{
              color: "#f1f5f9",
              fontSize: "1.4rem",
              fontWeight: 700,
              marginBottom: "0.5rem",
            }}
          >
            Couldn't load {examName}
          </h2>

          {/* Sub-text */}
          <p
            style={{
              color: "#94a3b8",
              fontSize: "0.95rem",
              marginBottom: "1.5rem",
              lineHeight: 1.6,
            }}
          >
            Something went wrong while loading the flashcard deck. This is
            usually caused by a temporary data issue and can be fixed with a
            quick reload.
          </p>

          {/* Error detail (collapsed) */}
          <details
            style={{
              background: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "0.5rem",
              padding: "0.75rem 1rem",
              marginBottom: "1.5rem",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <summary
              style={{
                color: "#64748b",
                fontSize: "0.8rem",
                userSelect: "none",
              }}
            >
              Error details
            </summary>
            <pre
              style={{
                color: "#f87171",
                fontSize: "0.75rem",
                marginTop: "0.5rem",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {this.state.errorMessage}
            </pre>
          </details>

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <button
              onClick={this.handleReload}
              style={{
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: "0.5rem",
                padding: "0.6rem 1.4rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              🔄 Reload
            </button>
            <Link href={backPath}>
              <button
                style={{
                  background: "transparent",
                  color: "#94a3b8",
                  border: "1px solid #334155",
                  borderRadius: "0.5rem",
                  padding: "0.6rem 1.4rem",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ← Back to Quiz
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
