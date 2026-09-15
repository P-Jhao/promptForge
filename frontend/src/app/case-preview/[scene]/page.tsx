"use client";

import { useParams } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import GeneratedNovelApp from "@/cases/generated/App";
import type { NovelCaseScene } from "@/cases/novelCase";

function readScene(value: string | string[] | undefined): NovelCaseScene {
  const scene = Array.isArray(value) ? value[0] : value;
  if (scene === "library" || scene === "notes") {
    return scene;
  }

  throw new Error("Unsupported novel case scene");
}

export default function CasePreviewPage() {
  const params = useParams<{ scene?: string | string[] }>();
  const scene = readScene(params.scene);
  const expectedHash = scene === "notes" ? "#/novels/novel_001" : "#/novels";
  const ready = useSyncExternalStore(
    subscribeToHashChange,
    () => window.location.hash === expectedHash,
    getServerSnapshot,
  );

  useEffect(() => {
    if (window.location.hash !== expectedHash) window.location.hash = expectedHash;
  }, [expectedHash]);

  if (!ready) {
    return <div className="case-route-loading">正在加载案例成果…</div>;
  }

  return <GeneratedNovelApp />;
}

function subscribeToHashChange(onStoreChange: () => void): () => void {
  window.addEventListener("hashchange", onStoreChange);
  return () => window.removeEventListener("hashchange", onStoreChange);
}

function getServerSnapshot(): boolean {
  return false;
}
