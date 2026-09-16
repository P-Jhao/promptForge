export type NewProjectDecision = "allow" | "confirm-dirty" | "blocked-loading" | "blocked-candidate";

export interface NewProjectGuardInput {
  dirty: boolean;
  isLoading: boolean;
  candidatePresent: boolean;
}

export function evaluateNewProjectDecision(input: NewProjectGuardInput): NewProjectDecision {
  if (input.isLoading) return "blocked-loading";
  if (input.candidatePresent) return "blocked-candidate";
  if (input.dirty) return "confirm-dirty";
  return "allow";
}
