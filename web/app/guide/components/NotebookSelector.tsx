"use client";

import {
  BookOpen,
  Loader2,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Check,
} from "lucide-react";
import {
  Notebook,
  NotebookRecord,
  SelectedRecord,
  getTypeColor,
} from "../types";
import { useTranslation } from "react-i18next";

interface NotebookSelectorProps {
  notebooks: Notebook[];
  expandedNotebooks: Set<string>;
  notebookRecordsMap: Map<string, NotebookRecord[]>;
  selectedRecords: Map<string, SelectedRecord>;
  loadingNotebooks: boolean;
  loadingRecordsFor: Set<string>;
  isLoading: boolean;
  onToggleExpanded: (notebookId: string) => void;
  onToggleRecord: (
    record: NotebookRecord,
    notebookId: string,
    notebookName: string,
  ) => void;
  onSelectAll: (notebookId: string, notebookName: string) => void;
  onDeselectAll: (notebookId: string) => void;
  onClearAll: () => void;
  onCreateSession: () => void;
}

export default function NotebookSelector({
  notebooks,
  expandedNotebooks,
  notebookRecordsMap,
  selectedRecords,
  loadingNotebooks,
  loadingRecordsFor,
  isLoading,
  onToggleExpanded,
  onToggleRecord,
  onSelectAll,
  onDeselectAll,
  onClearAll,
  onCreateSession,
}: NotebookSelectorProps) {
  const { t } = useTranslation();
  return (
    <div className="bg-card/80 rounded-2xl shadow-sm border border-border flex flex-col overflow-hidden ring-1 ring-sky-500/10">
      <div className="p-3 border-b border-border bg-background/40 flex justify-between items-center">
        <h2 className="font-bold text-foreground flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          {t("Select Source (Cross-Notebook)")}
        </h2>
        {selectedRecords.size > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs text-muted-foreground hover:text-primary"
          >
            Clear ({selectedRecords.size})
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto max-h-[400px]">
        {loadingNotebooks ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : notebooks.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-400 dark:text-slate-500">
            {t("No notebooks with records found")}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notebooks.map((notebook) => {
              const isExpanded = expandedNotebooks.has(notebook.id);
              const records = notebookRecordsMap.get(notebook.id) || [];
              const isLoadingRecords = loadingRecordsFor.has(notebook.id);
              const selectedFromThis = records.filter((r) =>
                selectedRecords.has(r.id),
              ).length;

              return (
                <div key={notebook.id}>
                  {/* Notebook Header */}
                  <div
                    className="p-3 flex items-center gap-2 cursor-pointer hover:bg-accent/30 transition-colors"
                    onClick={() => onToggleExpanded(notebook.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: notebook.color || "#94a3b8",
                      }}
                    />
                    <span className="flex-1 text-sm font-medium text-foreground truncate">
                      {notebook.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {selectedFromThis > 0 && (
                        <span className="text-primary font-medium">
                          {selectedFromThis}/
                        </span>
                      )}
                      {notebook.record_count}
                    </span>
                  </div>

                  {/* Records List */}
                  {isExpanded && (
                    <div className="pl-6 pr-2 pb-2 bg-background/20">
                      {isLoadingRecords ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        </div>
                      ) : records.length === 0 ? (
                        <div className="py-2 text-xs text-slate-400 dark:text-slate-500 text-center">
                          {t("No records")}
                        </div>
                      ) : (
                        <>
                          <div className="flex gap-2 mb-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectAll(notebook.id, notebook.name);
                              }}
                              className="text-xs text-primary hover:text-primary/80"
                            >
                              {t("Select All")}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeselectAll(notebook.id);
                              }}
                              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                            >
                              {t("Deselect")}
                            </button>
                          </div>
                          <div className="space-y-1">
                            {records.map((record) => (
                              <div
                                key={record.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleRecord(
                                    record,
                                    notebook.id,
                                    notebook.name,
                                  );
                                }}
                                className={`p-2 rounded-lg cursor-pointer transition-all border ${
                                  selectedRecords.has(record.id)
                                    ? "bg-accent/50 border-sky-300/60 ring-1 ring-sky-500/10"
                                    : "hover:bg-card/70 border-transparent hover:border-border"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                      selectedRecords.has(record.id)
                                        ? "bg-sky-500 border-sky-500 text-white"
                                        : "border-border"
                                    }`}
                                  >
                                    {selectedRecords.has(record.id) && (
                                      <Check className="w-2.5 h-2.5" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span
                                      className={`text-[10px] font-bold uppercase px-1 py-0.5 rounded ${getTypeColor(record.type)}`}
                                    >
                                      {record.type}
                                    </span>
                                    <span className="text-xs text-slate-700 dark:text-slate-200 ml-2 truncate">
                                      {record.title}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className="p-3 border-t border-border">
        <button
          onClick={onCreateSession}
          disabled={isLoading || selectedRecords.size === 0}
          className="w-full px-4 py-2.5 bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-xl hover:from-sky-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-md shadow-sky-500/20 ring-1 ring-sky-500/20"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("Generating...")}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {t("Generate Learning Plan ({n} items)").replace(
                "{n}",
                String(selectedRecords.size),
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
