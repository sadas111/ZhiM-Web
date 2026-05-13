"use client";

import { useState, useEffect } from "react";
import {
  X,
  BookOpen,
  Plus,
  Check,
  Loader2,
  Book,
  FolderOpen,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiUrl } from "@/lib/api";

interface NotebookOption {
  id: string;
  name: string;
  description: string;
  color: string;
  record_count: number;
}

interface AddToNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordType: "solve" | "question" | "research" | "co_writer" | "chat";
  title: string;
  userQuery: string;
  output: string;
  metadata?: Record<string, any>;
  kbName?: string;
}

// Monochrome light-blue palette only
const COLORS = [
  "#0EA5E9", // sky-500
  "#38BDF8", // sky-400
  "#06B6D4", // cyan-500
  "#22D3EE", // cyan-400
  "#0284C7", // sky-600
  "#075985", // sky-800 (for contrast)
];

export default function AddToNotebookModal({
  isOpen,
  onClose,
  recordType,
  title,
  userQuery,
  output,
  metadata = {},
  kbName,
}: AddToNotebookModalProps) {
  const { t } = useTranslation();
  const [notebooks, setNotebooks] = useState<NotebookOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newNotebook, setNewNotebook] = useState({
    name: "",
    description: "",
    color: "#0EA5E9",
  });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchNotebooks();
      setSelectedIds([]);
      setSuccess(false);
      setShowCreateForm(false);
    }
  }, [isOpen]);

  const fetchNotebooks = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/v1/notebook/list"));
      const data = await res.json();
      setNotebooks(data.notebooks || []);
    } catch (err) {
      console.error("Failed to fetch notebooks:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleNotebook = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleCreateNotebook = async () => {
    if (!newNotebook.name.trim()) return;

    try {
      const res = await fetch(apiUrl("/api/v1/notebook/create"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNotebook),
      });
      const data = await res.json();
      if (data.success && data.notebook) {
        await fetchNotebooks();
        setSelectedIds((prev) => [...prev, data.notebook.id]);
        setShowCreateForm(false);
        setNewNotebook({ name: "", description: "", color: "#0EA5E9" });
      }
    } catch (err) {
      console.error("Failed to create notebook:", err);
    }
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) return;

    setSaving(true);
    try {
      const res = await fetch(apiUrl("/api/v1/notebook/add_record"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notebook_ids: selectedIds,
          record_type: recordType,
          title,
          user_query: userQuery,
          output,
          metadata,
          kb_name: kbName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error("Failed to add record:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
      <div className="bg-card/85 text-card-foreground backdrop-blur-md rounded-2xl shadow-2xl w-[480px] max-h-[80vh] flex flex-col animate-in zoom-in-95 ring-1 ring-sky-500/10 border border-border">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-sky-50/70 to-cyan-50/70 dark:from-sky-950/30 dark:to-cyan-950/20 rounded-t-2xl">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Book className="w-5 h-5 text-primary" />
            {t("Add to Notebook")}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {success ? (
            <div className="py-12 text-center animate-in zoom-in-95">
              <div className="w-16 h-16 bg-accent/60 rounded-full flex items-center justify-center mx-auto mb-4 border border-border ring-1 ring-sky-500/10">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <h4 className="text-lg font-bold text-foreground mb-1">
                {t("Added Successfully!")}
              </h4>
              <p className="text-sm text-muted-foreground">
                {t(
                  selectedIds.length === 1
                    ? "Record has been saved to {n} notebook"
                    : "Record has been saved to {n} notebooks",
                ).replace("{n}", String(selectedIds.length))}
              </p>
            </div>
          ) : loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">
                {t("Loading notebooks...")}
              </p>
            </div>
          ) : (
            <>
              {/* Record Preview */}
              <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  {t("Record Preview")}
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                  {userQuery}
                </p>
              </div>

              {/* Notebook Selection */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t("Select Notebooks")}
                  </label>
                  <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    {t("New Notebook")}
                  </button>
                </div>

                {/* Create New Notebook Form */}
                {showCreateForm && (
                  <div className="mb-3 p-3 bg-accent/50 rounded-xl border border-border ring-1 ring-sky-500/10 animate-in slide-in-from-top-2">
                    <input
                      type="text"
                      value={newNotebook.name}
                      onChange={(e) =>
                        setNewNotebook((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder={t("Notebook name")}
                      className="w-full px-3 py-2 mb-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/25 outline-none bg-card/80 text-foreground placeholder:text-muted-foreground"
                      autoFocus
                    />
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {t("Color:")}
                      </span>
                      <div className="flex gap-1">
                        {COLORS.slice(0, 6).map((color) => (
                          <button
                            key={color}
                            onClick={() =>
                              setNewNotebook((prev) => ({ ...prev, color }))
                            }
                            className={`w-5 h-5 rounded transition-all ${
                              newNotebook.color === color
                                ? "ring-2 ring-offset-1 ring-slate-400 dark:ring-slate-500 dark:ring-offset-slate-800 scale-110"
                                : ""
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowCreateForm(false)}
                        className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        {t("Cancel")}
                      </button>
                      <button
                        onClick={handleCreateNotebook}
                        disabled={!newNotebook.name.trim()}
                        className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1 ring-1 ring-sky-500/10"
                      >
                        <Plus className="w-3 h-3" />
                        {t("Create")}
                      </button>
                    </div>
                  </div>
                )}

                {/* Notebook List */}
                {notebooks.length === 0 ? (
                  <div className="py-8 text-center">
                    <FolderOpen className="w-10 h-10 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t("No notebooks yet")}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {t("Create your first notebook above")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[240px] overflow-y-auto">
                    {notebooks.map((nb) => (
                      <button
                        key={nb.id}
                        onClick={() => toggleNotebook(nb.id)}
                        className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all border-2 text-left ${
                          selectedIds.includes(nb.id)
                            ? "bg-accent/50 border-sky-300/60 ring-1 ring-sky-500/10"
                            : "bg-card/60 border-border hover:border-sky-300/60 hover:bg-card/70"
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${nb.color}20`,
                            color: nb.color,
                          }}
                        >
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm">
                            {nb.name}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {nb.record_count} {t("records")}
                          </p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            selectedIds.includes(nb.id)
                              ? "bg-sky-500 border-sky-500"
                              : "border-border"
                          }`}
                        >
                          {selectedIds.includes(nb.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!success && !loading && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {selectedIds.length > 0
                ? t(
                    selectedIds.length === 1
                      ? "{n} notebook selected"
                      : "{n} notebooks selected",
                  ).replace("{n}", String(selectedIds.length))
                : t("Select at least one notebook")}
            </span>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors text-sm"
              >
                {t("Cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={selectedIds.length === 0 || saving}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm flex items-center gap-2 ring-1 ring-sky-500/10"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("Saving...")}
                  </>
                ) : (
                  <>
                    <Book className="w-4 h-4" />
                    {t("Add to Notebook")}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
