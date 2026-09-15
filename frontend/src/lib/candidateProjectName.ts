export interface CandidateProjectNameMetadata {
  operation: "create" | "edit";
  suggestedProjectName?: string;
  projectNameAtRequest?: string;
}

/**
 * Resolve a model name only when the user has kept the name from request time.
 * A changed current name is treated as an explicit user choice.
 */
export function resolveCandidateProjectName(
  metadata: CandidateProjectNameMetadata,
  currentProjectName: string,
): string | undefined {
  if (metadata.operation !== "create") {
    return undefined;
  }
  if (metadata.suggestedProjectName === undefined || metadata.projectNameAtRequest === undefined) {
    return undefined;
  }
  if (currentProjectName !== metadata.projectNameAtRequest) {
    return undefined;
  }
  return metadata.suggestedProjectName;
}
