"use client";

import { useState } from "react";
import { Loader2, FolderOpen, Link as LinkIcon, X } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { useTranslation } from "react-i18next";

interface FolderSyncManagerProps {
  kbName: string;
  showToast: (message: string, type: "success" | "error" | "info") => void;
  onFolderLinked?: () => void;
  onFolderUnlinked?: () => void;
  onSyncComplete?: () => void;
}

interface FolderInfo {
  id: string;
  path: string;
  added_at: string;
  file_count: number;
}

export default function FolderSyncManager({
  kbName,
  showToast,
  onFolderLinked,
  onFolderUnlinked,
  onSyncComplete,
}: FolderSyncManagerProps) {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const [folderPath, setFolderPath] = useState("");
  const [linking, setLinking] = useState(false);

  const handleLinkFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderPath || !kbName) return;

    setLinking(true);
    try {
      const res = await fetch(
        apiUrl(`/api/v1/knowledge/${kbName}/link-folder`),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder_path: folderPath }),
        },
      );

      if (!res.ok) throw new Error(t("Failed to link folder"));

      showToast(t("Folder linked successfully!"), "success");
      setModalOpen(false);
      setFolderPath("");
      onFolderLinked?.();
    } catch (err: any) {
      showToast(err.message || t("Failed to link folder"), "error");
    } finally {
      setLinking(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-1 px-2 py-1 text-xs text-primary hover:bg-accent rounded-lg transition-colors border border-border"
      >
        <FolderOpen className="w-3 h-3" />
        {t("Link Folder")}
      </button>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card/85 text-card-foreground backdrop-blur-md rounded-2xl p-6 w-full max-w-md shadow-2xl border border-border ring-1 ring-sky-500/10 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-primary" />
                {t("Link Local Folder")}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {t("Link a local folder to")}{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {kbName}
              </span>
              {t(
                ". Documents in the folder will be processed and added to this knowledge base.",
              )}
            </p>

            <form onSubmit={handleLinkFolder} className="space-y-4">
              <div>
                <label
                  htmlFor="folder-path"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  {t("Folder Path")}
                </label>
                <input
                  type="text"
                  id="folder-path"
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  placeholder={t("Paste or type the full folder path")}
                  className="w-full px-4 py-2.5 border border-border rounded-xl bg-card/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-transparent"
                />
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    <strong>{t("macOS/Linux:")}</strong> ~/Documents/papers or
                    /Users/name/folder
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    <strong>{t("Windows:")}</strong>{" "}
                    {t("C:\\Users\\name\\Documents\\papers")}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  {t("📄 Supported files: PDF, DOCX, TXT, MD")}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  {t(
                    "New and modified files will be automatically detected when you sync.",
                  )}
                </p>
              </div>

              <div className="bg-accent/50 rounded-lg p-3 border border-border ring-1 ring-sky-500/10">
                <p className="text-xs text-foreground/80">
                  <strong>{t("💡 Tip:")}</strong>{" "}
                  {t(
                    "Use folders synced with Google Drive, OneDrive, SharePoint, or Dropbox for automatic cloud integration.",
                  )}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  {t("Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={!folderPath || linking}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 ring-1 ring-sky-500/10"
                >
                  {linking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <LinkIcon className="w-4 h-4" />
                      {t("Link Folder")}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
