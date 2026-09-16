export function readCandidateEvidence(data, readFiles, redact, hash) {
  if (!isRecord(data) || data.operation !== "edit") return undefined;
  const files = readFiles(data);
  if (files === undefined || Object.keys(files).length === 0) return undefined;

  const candidateId = readIdentifier(data.candidateId);
  const runId = readIdentifier(data.runId);
  const projectId = readIdentifier(data.projectId);
  const baseVersionId = readNullableIdentifier(data.baseVersionId);
  const baseHash = readHash(data.baseHash);
  const acceptanceBaseHash = readHash(data.acceptanceBaseHash);
  const summary = readSummary(data.summary);
  const resources = readResources(data.resources);
  const changes = readChanges(data.changes);
  if (candidateId === undefined || runId === undefined || projectId === undefined
    || baseVersionId === undefined || baseHash === undefined || acceptanceBaseHash === undefined
    || summary === undefined || resources === undefined || changes === undefined) return undefined;

  const sourceCandidateId = readOptionalIdentifier(data.sourceCandidateId);
  const sourceBaseHash = readOptionalHash(data.sourceBaseHash);
  if ((data.sourceCandidateId !== undefined && sourceCandidateId === undefined)
    || (data.sourceBaseHash !== undefined && sourceBaseHash === undefined)) return undefined;
  if ((sourceCandidateId === undefined) !== (sourceBaseHash === undefined)) return undefined;

  const evidence = {
    source: "candidate",
    candidateId: redact(candidateId),
    runId: redact(runId),
    operation: "edit",
    projectId: redact(projectId),
    baseVersionId: baseVersionId === null ? null : redact(baseVersionId),
    baseHash,
    acceptanceBaseHash,
    fileCount: Object.keys(files).length,
    resourceCount: resources.length,
    resources: resources.map((resource) => summarizeResource(resource, redact)),
    changeCount: changes.length,
    changes: changes.map((change) => summarizeChange(change, hash, redact)),
    summary: redact(summary),
  };
  if (sourceCandidateId !== undefined && sourceBaseHash !== undefined) {
    evidence.sourceCandidateId = redact(sourceCandidateId);
    evidence.sourceBaseHash = sourceBaseHash;
  }
  return { files, evidence };
}

function readResources(value) {
  if (!Array.isArray(value) || value.length > 150) return undefined;
  const resources = value.map((item) => {
    if (!isRecord(item)) return undefined;
    const id = readBoundedString(item.id, 200);
    const kind = readBoundedString(item.kind, 2_048);
    const hostPath = readBoundedString(item.hostPath, 2_048);
    const sandpackPath = readBoundedString(item.sandpackPath, 2_048);
    const exportPath = readBoundedString(item.exportPath, 2_048);
    const contentType = readBoundedString(item.contentType, 2_048);
    const contentHash = item.contentHash === null ? null : readHash(item.contentHash);
    if (id === undefined || kind === undefined || hostPath === undefined || sandpackPath === undefined
      || exportPath === undefined || contentType === undefined || contentHash === undefined
      || (item.hashStatus !== "known" && item.hashStatus !== "unknown")) return undefined;
    return { id, kind, hostPath, sandpackPath, exportPath, contentType, contentHash, hashStatus: item.hashStatus };
  });
  if (resources.some((resource) => resource === undefined)) return undefined;
  const ids = resources.map((resource) => resource.id);
  return new Set(ids).size === ids.length ? resources : undefined;
}

function readChanges(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 150) return undefined;
  const changes = value.map((item) => {
    if (!isRecord(item)) return undefined;
    const path = readBoundedString(item.path, 512);
    if (path === undefined) return undefined;
    if (item.operation === "delete") return item.content === undefined ? { operation: "delete", path } : undefined;
    if ((item.operation !== "add" && item.operation !== "modify") || typeof item.content !== "string" || item.content.length === 0) return undefined;
    return { operation: item.operation, path, content: item.content };
  });
  if (changes.some((change) => change === undefined)) return undefined;
  const paths = changes.map((change) => change.path);
  return new Set(paths).size === paths.length ? changes : undefined;
}

function summarizeResource(resource, redact) {
  return {
    id: redact(resource.id), kind: redact(resource.kind), hostPath: redact(resource.hostPath),
    sandpackPath: redact(resource.sandpackPath), exportPath: redact(resource.exportPath),
    contentType: redact(resource.contentType), contentHash: resource.contentHash, hashStatus: resource.hashStatus,
  };
}

function summarizeChange(change, hash, redact) {
  const summary = { operation: change.operation, path: redact(change.path) };
  if (change.content !== undefined) {
    summary.contentCharacters = change.content.length;
    summary.contentSha256 = hash(change.content);
  }
  return summary;
}

function readIdentifier(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9._:-]{1,200}$/.test(value)) return undefined;
  return value;
}

function readOptionalIdentifier(value) { return value === undefined ? undefined : readIdentifier(value); }
function readNullableIdentifier(value) {
  if (value === null) return null;
  return readIdentifier(value);
}

function readHash(value) { return typeof value === "string" && /^[0-9a-f]{64}$/.test(value) ? value : undefined; }
function readOptionalHash(value) { return value === undefined ? undefined : readHash(value); }
function readSummary(value) { return typeof value === "string" && value.length > 0 && value.length <= 4_000 ? value : undefined; }
function readBoundedString(value, maxLength) { return typeof value === "string" && value.length > 0 && value.length <= maxLength ? value : undefined; }
function isRecord(value) { return typeof value === "object" && value !== null && !Array.isArray(value); }
