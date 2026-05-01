/** Step rail labels (structural pattern from blocks.so onboarding-03). */
export const ONBOARDING_WIZARD_STEPS = [
  {
    id: "1.",
    title: "Welcome",
    description: "What Autodraw is and how you can use it with or without an agent.",
  },
  {
    id: "2.",
    title: "Connect your agent",
    description: "Add the Autodraw MCP server to Cursor, Claude Desktop, or download the CLI skill.",
  },
  {
    id: "3.",
    title: "Verify connection",
    description: "Confirm your client sees the Autodraw tools.",
  },
  {
    id: "4.",
    title: "First diagram",
    description: "Try a ready-made prompt and optionally load the example on the canvas.",
  },
] as const;

export type OnboardingWizardStep = (typeof ONBOARDING_WIZARD_STEPS)[number];
