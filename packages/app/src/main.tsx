import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.js";
import "./styles/globals.css";
import "./styles/tokens.css";
import "./styles/app.css";

type RuntimeErrorBoundaryState = { err: Error | null };

class RuntimeErrorBoundary extends React.Component<
  { children: React.ReactNode },
  RuntimeErrorBoundaryState
> {
  state: RuntimeErrorBoundaryState = { err: null };
  static getDerivedStateFromError(err: Error) {
    return { err };
  }
  componentDidCatch(err: Error, info: React.ErrorInfo) {
    console.error("[agentsdraw] render error:", err, info);
  }
  render() {
    if (this.state.err) {
      const e = this.state.err;
      return (
        <pre
          style={{
            position: "fixed",
            inset: 0,
            margin: 0,
            padding: "16px 20px",
            boxSizing: "border-box",
            overflow: "auto",
            whiteSpace: "pre-wrap",
            background: "#1a0b0b",
            color: "#ffb4b4",
            font: "12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace",
            zIndex: 99999,
          }}
        >
          agentsdraw crashed:{"\n\n"}
          {e.message}
          {e.stack ? "\n\n" + e.stack : ""}
        </pre>
      );
    }
    return this.props.children;
  }
}

function showBootError(message: string, stack?: string) {
  const root = document.getElementById("root");
  const target = root ?? document.body;
  if (!target) return;
  target.innerHTML = `
    <pre style="
      position: fixed; inset: 0; margin: 0;
      padding: 16px 20px; box-sizing: border-box;
      overflow: auto; white-space: pre-wrap;
      background: #1a0b0b; color: #ffb4b4;
      font: 12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;
      z-index: 99999;
    ">agentsdraw failed to start:

${escape(message)}${stack ? "\n\n" + escape(stack) : ""}</pre>`;
  function escape(s: string) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}

window.addEventListener("error", (e) => {
  showBootError(String(e.message), e.error?.stack);
});
window.addEventListener("unhandledrejection", (e) => {
  const r = e.reason;
  showBootError(
    typeof r === "string" ? r : r?.message ?? "Unhandled promise rejection",
    r?.stack
  );
});

try {
  const container = document.getElementById("root");
  if (!container) throw new Error("#root element missing from index.html");
  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <RuntimeErrorBoundary>
        <App />
      </RuntimeErrorBoundary>
    </React.StrictMode>
  );
} catch (err) {
  const e = err as Error;
  showBootError(e.message, e.stack);
}
