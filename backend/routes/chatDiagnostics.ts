import type { MockConfig } from "../config/mock.js";
import { NodeExecutionError } from "../agents/utils/nodeError.js";

export type UnknownRecord = Record<string, unknown>;

const TRADITIONAL_NODE_NAMES: readonly string[] = [
  "analysisNode",
  "intentNode",
  "capabilityNode",
  "uiNode",
  "componentNode",
  "structureNode",
  "dependencyNode",
  "typeNode",
  "utilsNode",
  "mockDataNode",
  "serviceNode",
  "hooksNode",
  "componentSubgraph",
  "pageSubgraph",
  "layoutNode",
  "styleGenNode",
  "appGenNode",
  "assembleNode",
];

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isBooleanRecord(value: unknown): value is Record<string, boolean> {
  return (
    isRecord(value) &&
    Object.values(value).every((entry) => typeof entry === "boolean")
  );
}

export function isMockConfig(value: unknown): value is MockConfig {
  if (!isRecord(value)) return false;

  const hasGlobal = value.global !== undefined;
  const hasPhases = value.phases !== undefined;
  const hasNodes = value.nodes !== undefined;
  const phasesValid = !hasPhases || isBooleanRecord(value.phases);
  const nodesValid = !hasNodes || isBooleanRecord(value.nodes);

  if (
    (hasGlobal && typeof value.global !== "boolean") ||
    !phasesValid ||
    !nodesValid
  ) {
    return false;
  }

  const hasConfiguredPhases =
    hasPhases && isRecord(value.phases) && Object.keys(value.phases).length > 0;
  const hasConfiguredNodes =
    hasNodes && isRecord(value.nodes) && Object.keys(value.nodes).length > 0;
  return typeof value.global === "boolean" || hasConfiguredPhases || hasConfiguredNodes;
}

export function getNextTraditionalNode(nodeName: string): string {
  const nodeIndex = TRADITIONAL_NODE_NAMES.indexOf(nodeName);
  if (nodeIndex < 0) return "unknown node";

  return TRADITIONAL_NODE_NAMES[nodeIndex + 1] ?? "waiting for graph completion";
}

export interface TimeoutDiagnosticEvent {
  type: "error";
  data: {
    node: string;
    lastCompletedNode?: string;
    message: string;
  };
  message: string;
}

export function createTimeoutDiagnostic(
  currentNode: string,
  lastCompletedNode: string | undefined,
): TimeoutDiagnosticEvent {
  const message = "Chat generation timed out";
  return {
    type: "error",
    data: { node: currentNode, lastCompletedNode, message },
    message,
  };
}

export function resolveDiagnosticNode(
  error: unknown,
  currentNode: string,
): string {
  return error instanceof NodeExecutionError ? error.node : currentNode;
}

export function readPositiveInteger(name: string, fallback: number): number {
  const rawValue = process.env[name];
  if (rawValue === undefined) return fallback;

  const parsedValue = Number.parseInt(rawValue, 10);
  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return parsedValue;
}
