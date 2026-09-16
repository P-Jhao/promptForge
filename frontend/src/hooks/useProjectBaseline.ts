"use client";

import { useCallback, useEffect, useState, type MutableRefObject } from "react";
import { projectDraftFingerprint, snapshotToDraft } from "@/lib/projectSerialization";
import {
  getProjectBaseline,
  removeProjectBaseline,
  setProjectBaseline,
} from "@/lib/projectBaselineCache";
import type { ProjectDraft, ProjectRepository } from "@/types/project";

export interface ProjectBaselineController {
  expectedRevisionRef: MutableRefObject<number | null>;
  savedFingerprintRef: MutableRefObject<string | null>;
  savedDraftRef: MutableRefObject<ProjectDraft | null>;
  requestRef: MutableRefObject<Promise<void>>;
  remember: (draft: ProjectDraft, revision: number) => string;
  clear: () => void;
}

interface BaselineEntry {
  expectedRevisionRef: MutableRefObject<number | null>;
  savedFingerprintRef: MutableRefObject<string | null>;
  savedDraftRef: MutableRefObject<ProjectDraft | null>;
  requestRef: MutableRefObject<Promise<void>>;
  requestId: number;
}

const baselineEntries = new Map<string, BaselineEntry>();

function createEntry(projectId: string): BaselineEntry {
  const baseline = getProjectBaseline(projectId);
  return {
    expectedRevisionRef: { current: baseline?.revision ?? null },
    savedFingerprintRef: { current: baseline?.fingerprint ?? null },
    savedDraftRef: { current: baseline?.draft ?? null },
    requestRef: { current: Promise.resolve() },
    requestId: 0,
  };
}

function getEntry(projectId: string): BaselineEntry {
  const existing = baselineEntries.get(projectId);
  if (existing !== undefined) return existing;
  const created = createEntry(projectId);
  baselineEntries.set(projectId, created);
  return created;
}

export function useProjectBaseline(
  projectId: string,
  repository: ProjectRepository,
): ProjectBaselineController {
  const currentEntry = getEntry(projectId);
  const [, setEpoch] = useState(0);

  const remember = useCallback((draft: ProjectDraft, revision: number): string => {
    const entry = getEntry(draft.projectId);
    const fingerprint = projectDraftFingerprint(draft);
    entry.requestId += 1;
    entry.expectedRevisionRef.current = revision;
    entry.savedFingerprintRef.current = fingerprint;
    entry.savedDraftRef.current = draft;
    setProjectBaseline({ projectId: draft.projectId, revision, fingerprint, draft });
    setEpoch((value) => value + 1);
    return fingerprint;
  }, []);

  const clear = useCallback((): void => {
    const entry = getEntry(projectId);
    entry.requestId += 1;
    entry.expectedRevisionRef.current = null;
    entry.savedFingerprintRef.current = null;
    entry.savedDraftRef.current = null;
    removeProjectBaseline(projectId);
    setEpoch((value) => value + 1);
  }, [projectId]);

  useEffect(() => {
    const targetProjectId = projectId;
    const entry = getEntry(targetProjectId);
    const requestId = entry.requestId + 1;
    entry.requestId = requestId;
    const cachedBaseline = getProjectBaseline(targetProjectId);
    entry.expectedRevisionRef.current = cachedBaseline?.revision ?? null;
    entry.savedFingerprintRef.current = cachedBaseline?.fingerprint ?? null;
    entry.savedDraftRef.current = cachedBaseline?.draft ?? null;
    let active = true;
    const request = repository.loadProject(targetProjectId)
      .then((snapshot) => {
        if (!active || requestId !== entry.requestId) return;
        if (snapshot === null) {
          clear();
          return;
        }
        remember(snapshotToDraft(snapshot), snapshot.project.revision);
      })
      .catch(() => {
        // Keep a cached baseline, if any; a failed read must never imply clean content.
      });
    entry.requestRef.current = request;
    return () => {
      active = false;
    };
  }, [clear, projectId, remember, repository]);

  return {
    expectedRevisionRef: currentEntry.expectedRevisionRef,
    savedFingerprintRef: currentEntry.savedFingerprintRef,
    savedDraftRef: currentEntry.savedDraftRef,
    requestRef: currentEntry.requestRef,
    remember,
    clear,
  };
}
