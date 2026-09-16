"use client";

import { Pencil, RotateCcw } from "lucide-react";
import { useState } from "react";
import type { VersionCardProps } from "@/types/components";

export function VersionCard({
  version,
  projectName,
  isCurrentVersion = false,
  onRollback,
  onMetadataSave,
}: VersionCardProps) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(version.label ?? "");
  const [notes, setNotes] = useState(version.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const beginEditing = (): void => {
    setLabel(version.label ?? "");
    setNotes(version.notes ?? "");
    setError(null);
    setNotice(null);
    setEditing(true);
  };

  const saveMetadata = async (): Promise<void> => {
    if (onMetadataSave === undefined) return;
    setSaving(true);
    setError(null);
    try {
      const mode = await onMetadataSave(version.versionId, {
        label: label.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setNotice(mode === "memory" ? "已暂存于未保存项目；保存项目后才会写入本地项目。" : "版本元数据已保存。" );
      setEditing(false);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "版本元数据保存失败");
    } finally {
      setSaving(false);
    }
  };

  const status = `${isCurrentVersion ? "当前版本" : "历史版本"} · ${version.operation === "restore" ? "恢复产生" : "已接受"}`;

  return (
    <div className="mt-3 w-full rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 text-base truncate">
              {projectName}
            </h3>
            {version.operation && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 shrink-0">
                {version.operation === "create" ? "创建" : version.operation === "restore" ? "恢复" : "编辑"}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">v{version.versionNumber} · {status}</p>
          {version.restoredFromVersionId !== undefined && (
            <p className="text-xs text-gray-500 mt-1">来源：{version.restoredFromVersionId}</p>
          )}

          {editing ? (
            <div className="mt-3 space-y-2">
              <label className="block text-xs font-medium text-gray-600" htmlFor={`${version.versionId}-label`}>版本标签</label>
              <input id={`${version.versionId}-label`} value={label} onChange={(event) => setLabel(event.target.value)} maxLength={200} className="w-full rounded border border-gray-300 px-2 py-1 text-sm" placeholder="例如：首版交付" />
              <label className="block text-xs font-medium text-gray-600" htmlFor={`${version.versionId}-notes`}>版本备注</label>
              <textarea id={`${version.versionId}-notes`} value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={4000} rows={2} className="w-full rounded border border-gray-300 px-2 py-1 text-sm" placeholder="记录这次版本的用途或验收信息" />
              <div className="flex gap-2">
                <button type="button" onClick={() => void saveMetadata()} disabled={saving} className="rounded border border-blue-300 bg-blue-50 px-2 py-1 text-xs text-blue-700">{saving ? "保存中…" : "保存元数据"}</button>
                <button type="button" onClick={() => { setEditing(false); setError(null); }} disabled={saving} className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600">取消</button>
              </div>
              {error !== null && <p className="text-xs text-red-600" role="alert">{error}</p>}
            </div>
          ) : (
            <>
              {notice !== null && <p className="mt-2 text-xs text-blue-700" role="status">{notice}</p>}
              {version.label !== undefined && <p className="mt-2 text-sm font-medium text-gray-800">标签：{version.label}</p>}
              {version.notes !== undefined && <p className="mt-1 whitespace-pre-wrap text-xs text-gray-600">备注：{version.notes}</p>}
              {onMetadataSave !== undefined && <button type="button" onClick={beginEditing} className="mt-2 inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"><Pencil size={12} /> 编辑标签/备注</button>}
            </>
          )}

          {version.fileCount > 0 && (
            <div className="mt-3 text-sm text-gray-600 font-medium">
              {version.fileCount} 个文件快照
            </div>
          )}

          {version.changes && (
            <div className="mt-2 flex items-center gap-3 text-xs font-medium">
              {version.changes.added.length > 0 && (
                <span className="text-green-600">
                  +{version.changes.added.length}
                </span>
              )}
              {version.changes.deleted.length > 0 && (
                <span className="text-red-600">
                  -{version.changes.deleted.length}
                </span>
              )}
            </div>
          )}
        </div>

        {onRollback && (
          <button
            type="button"
            onClick={onRollback}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-400 active:scale-95 shadow-sm shrink-0"
            title="回滚到此版本"
          >
            <RotateCcw size={14} />
            回滚
          </button>
        )}
      </div>
    </div>
  );
}
