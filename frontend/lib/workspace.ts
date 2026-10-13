export type Workspace = "resume" | "jobs" | "suggestions";

/**
 * Where a workflow step stands. `locked` means a prerequisite is missing, which
 * is distinct from `todo` — the user can't start it yet rather than hasn't.
 */
export type StepStatus = "locked" | "todo" | "active" | "done" | "attention";

export const WORKSPACE_LABELS: Record<Workspace, string> = {
  resume: "Resume",
  jobs: "Matched Jobs",
  suggestions: "AI Suggestions",
};
