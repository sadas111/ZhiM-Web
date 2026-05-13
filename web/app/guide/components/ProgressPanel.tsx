"use client";

import { Loader2, Play, ChevronRight, CheckCircle2 } from "lucide-react";
import { SessionState } from "../types";
import { useTranslation } from "react-i18next";

interface ProgressPanelProps {
  sessionState: SessionState;
  isLoading: boolean;
  canStart: boolean;
  canNext: boolean;
  isLastKnowledge: boolean;
  onStartLearning: () => void;
  onNextKnowledge: () => void;
}

export default function ProgressPanel({
  sessionState,
  isLoading,
  canStart,
  canNext,
  isLastKnowledge,
  onStartLearning,
  onNextKnowledge,
}: ProgressPanelProps) {
  const { t } = useTranslation();
  return (
    <div className="bg-card/80 p-4 rounded-2xl shadow-sm border border-border ring-1 ring-sky-500/10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("Learning Progress")}
        </span>
        <span className="text-xs text-muted-foreground">
          {sessionState.progress}%
        </span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden mb-4 border border-border">
        <div
          className="h-full bg-gradient-to-r from-sky-500 to-cyan-500 rounded-full transition-all duration-500"
          style={{ width: `${sessionState.progress}%` }}
        />
      </div>
      {sessionState.knowledge_points.length > 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
          {t("Knowledge Point {n} / {total}")
            .replace("{n}", String(sessionState.current_index + 1))
            .replace("{total}", String(sessionState.knowledge_points.length))}
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {canStart && (
          <button
            onClick={onStartLearning}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium ring-1 ring-sky-500/10 shadow-md shadow-sky-500/10"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("Generating...")}
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                {t("Start Learning")}
              </>
            )}
          </button>
        )}

        {canNext && (
          <button
            onClick={onNextKnowledge}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium ring-1 ring-sky-500/10 shadow-md shadow-sky-500/10"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("Loading...")}
              </>
            ) : (
              <>
                <ChevronRight className="w-4 h-4" />
                {t("Next")}
              </>
            )}
          </button>
        )}

        {isLastKnowledge && (
          <button
            onClick={onNextKnowledge}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium ring-1 ring-sky-500/10 shadow-md shadow-sky-500/10"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("Generating Summary...")}
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {t("Complete Learning")}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
