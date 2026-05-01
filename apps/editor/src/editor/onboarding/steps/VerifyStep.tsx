"use client";

export function VerifyStep() {
  return (
    <div className="space-y-4">
      <ol className="list-decimal space-y-2 pl-5 text-muted-foreground text-sm leading-relaxed">
        <li>Restart Cursor or Claude Desktop so it loads the new MCP entry.</li>
        <li>Open a chat in that app.</li>
        <li>
          Ask the model to list available tools (e.g. &quot;What MCP tools do you have for autodraw?&quot; or use your client&apos;s
          tool picker).
        </li>
      </ol>
      <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
        If you see tools like <code className="font-mono text-xs text-foreground">autodraw_init</code>,{" "}
        <code className="font-mono text-xs text-foreground">autodraw_add_node</code>, and{" "}
        <code className="font-mono text-xs text-foreground">autodraw_export</code>, the connection is working.
      </div>
    </div>
  );
}
