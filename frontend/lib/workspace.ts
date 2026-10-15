export type Workspace = "resume" | "jobs" | "suggestions";


export const WORKSPACE_LABELS: Record<Workspace, string> = {
  resume: "Resume",
  jobs: "Matched jobs",
  suggestions: "AI suggestions",
};
