/** Shared CLI snippet for landing + onboarding (`npx -y` installs `@autodraw/cli`, which exposes the `autodraw` binary). */
export const CLI_EXAMPLE_LINES = [
  {
    id: "init",
    text: "npx -y @autodraw/cli init ./design.adraw",
  },
  {
    id: "add-wrap",
    text: "npx -y @autodraw/cli add node ./design.adraw \\",
  },
  {
    id: "add-args",
    text: '  --text "API Gateway" --x 240 --y 200',
  },
] as const;
