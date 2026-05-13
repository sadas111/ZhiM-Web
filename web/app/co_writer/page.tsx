"use client";

import CoWriterEditor from "@/components/CoWriterEditor";
import { Edit3 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function CoWriterPage() {
  const { t } = useTranslation();
  return (
    <div className="h-screen animate-fade-in flex flex-col p-6">
      {/* Header */}
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Edit3 className="w-6 h-6 text-primary" />
          {t("Co-Writer")}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t("Intelligent markdown editor with AI-powered writing assistance.")}
        </p>
      </div>

      {/* Editor Container */}
      <div className="flex-1 min-h-0">
        <CoWriterEditor />
      </div>
    </div>
  );
}
