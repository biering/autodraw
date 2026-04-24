import React from "react";
import ReactDOM from "react-dom/client";
import type { Root } from "react-dom/client";
import { LicenseWindowRoot } from "./licensing/LicenseWindowRoot.js";
import { isTauri } from "./platform/isTauri.js";
import "./styles/globals.css";

type RootHost = HTMLElement & { __agentsdrawRoot?: Root };

function LicenseBoot() {
  if (!isTauri()) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#131316] px-6 text-center text-sm text-[#a1a1aa]">
        Open the agentsdraw desktop app to activate your license.
      </div>
    );
  }
  return <LicenseWindowRoot />;
}

const container = document.getElementById("root") as RootHost | null;
if (!container) throw new Error("#root element missing from license.html");

const root = container.__agentsdrawRoot ?? ReactDOM.createRoot(container);
container.__agentsdrawRoot = root;
root.render(
  <React.StrictMode>
    <div className="min-h-dvh bg-[#1a1a1a]">
      <LicenseBoot />
    </div>
  </React.StrictMode>,
);
