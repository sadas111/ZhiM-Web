"use client";

import { useState } from "react";
import { Bug, X, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFix: (description: string) => Promise<boolean>;
}

export default function DebugModal({
  isOpen,
  onClose,
  onFix,
}: DebugModalProps) {
  const { t } = useTranslation();
  const [description, setDescription] = useState("");
  const [fixing, setFixing] = useState(false);

  if (!isOpen) return null;

  const handleFix = async () => {
    if (!description.trim() || fixing) return;

    setFixing(true);
    const success = await onFix(description);
    setFixing(false);

    if (success) {
      setDescription("");
      onClose();
    }
  };

  const handleClose = () => {
    setDescription("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
      <div className="bg-card/85 text-card-foreground backdrop-blur-md rounded-2xl shadow-2xl w-[500px] animate-in zoom-in-95 ring-1 ring-sky-500/10 border border-border">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Bug className="w-5 h-5 text-primary" />
            {t("Fix HTML Issue")}
          </h3>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-accent rounded-lg"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              {t("Issue Description")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t(
                "Describe the HTML issue, e.g.: button not clickable, style display error, interaction not working...",
              )}
              rows={6}
              className="w-full px-4 py-2 border border-border bg-card/80 text-foreground rounded-xl focus:ring-2 focus:ring-primary/25 outline-none resize-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors"
          >
            {t("Cancel")}
          </button>
          <button
            onClick={handleFix}
            disabled={!description.trim() || fixing}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 ring-1 ring-sky-500/10"
          >
            {fixing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("Fixing...")}
              </>
            ) : (
              <>
                <Bug className="w-4 h-4" />
                {t("Fix")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
