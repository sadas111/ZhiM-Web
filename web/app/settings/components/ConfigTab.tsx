"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Loader2, Pencil } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { ConfigItem, ConfigType } from "../types";
import ConfigForm from "./ConfigForm";

interface ConfigTabProps {
  configType: ConfigType;
  title: string;
  description: string;
  onUpdate: () => void;
  showDimensions?: boolean;
  showVoice?: boolean;
  isSearchConfig?: boolean;
  t: (key: string) => string;
}

export default function ConfigTab({
  configType,
  title,
  description,
  onUpdate,
  showDimensions = false,
  showVoice = false,
  isSearchConfig = false,
  t,
}: ConfigTabProps) {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ConfigItem | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const loadConfigs = useCallback(async () => {
    try {
      const res = await fetch(apiUrl(`/api/v1/config/${configType}`));
      if (res.ok) {
        const data = await res.json();
        setConfigs(data.configs || []);
      }
    } catch (e) {
      console.error(`Failed to load ${configType} configs:`, e);
    } finally {
      setLoading(false);
    }
  }, [configType]);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  const setActive = async (configId: string) => {
    try {
      const res = await fetch(
        apiUrl(`/api/v1/config/${configType}/${configId}/active`),
        {
          method: "POST",
        },
      );
      if (res.ok) {
        loadConfigs();
        onUpdate();
      }
    } catch (e) {
      console.error("Failed to set active config:", e);
    }
  };

  const deleteConfig = async (configId: string) => {
    if (!confirm(t("Are you sure you want to delete this configuration?")))
      return;

    try {
      const res = await fetch(
        apiUrl(`/api/v1/config/${configType}/${configId}`),
        {
          method: "DELETE",
        },
      );
      if (res.ok) {
        loadConfigs();
        onUpdate();
      }
    } catch (e) {
      console.error("Failed to delete config:", e);
    }
  };

  const testConnection = async (config: ConfigItem) => {
    if (isSearchConfig) return;

    setTesting(config.id);
    setTestResult(null);

    try {
      const res = await fetch(
        apiUrl(`/api/v1/config/${configType}/${config.id}/test`),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );
      const data = await res.json();
      setTestResult(data);
    } catch (e) {
      setTestResult({ success: false, message: t("Connection test failed") });
    } finally {
      setTesting(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors ring-1 ring-sky-500/10 shadow-md shadow-sky-500/10"
        >
          <Plus className="w-4 h-4" />
          {t("Add Configuration")}
        </button>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingConfig) && (
        <ConfigForm
          configType={configType}
          showDimensions={showDimensions}
          showVoice={showVoice}
          isSearchConfig={isSearchConfig}
          editConfig={editingConfig}
          t={t}
          onSuccess={() => {
            setShowAddForm(false);
            setEditingConfig(null);
            loadConfigs();
            onUpdate();
          }}
          onCancel={() => {
            setShowAddForm(false);
            setEditingConfig(null);
          }}
        />
      )}

      {/* Test Result */}
      {testResult && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            testResult.success
              ? "bg-accent/50 text-primary border border-border ring-1 ring-sky-500/10"
              : "bg-accent/50 text-primary border border-border ring-1 ring-sky-500/10"
          }`}
        >
          {testResult.message}
        </div>
      )}

      {/* Configuration List */}
      <div className="space-y-3">
        {configs.map((config) => (
          <div
            key={config.id}
            className={`p-4 rounded-xl border transition-all ${
              config.is_active
                ? "border-sky-300/60 bg-accent/40 ring-1 ring-sky-500/10"
                : "border-border bg-card/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {config.is_active && (
                  <div className="w-2 h-2 rounded-full bg-sky-500" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {config.name}
                    </span>
                    {config.is_default && (
                      <span className="px-2 py-0.5 text-xs bg-secondary text-muted-foreground rounded border border-border">
                        {t("Default")}
                      </span>
                    )}
                    {config.is_active && (
                      <span className="px-2 py-0.5 text-xs bg-accent/70 text-primary rounded border border-border ring-1 ring-sky-500/10">
                        {t("Active")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span>
                      {t("Provider")}: {config.provider}
                    </span>
                    {config.model && (
                      <span>
                        {t("Model")}: {config.model}
                      </span>
                    )}
                    {showDimensions && config.dimensions && (
                      <span>
                        {t("Dimensions")}: {config.dimensions}
                      </span>
                    )}
                    {showVoice && config.voice && (
                      <span>
                        {t("Voice")}: {config.voice}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!config.is_active && (
                  <button
                    onClick={() => setActive(config.id)}
                    className="px-3 py-1.5 text-sm text-primary hover:bg-accent rounded-lg transition-colors border border-border"
                  >
                    {t("Set Active")}
                  </button>
                )}
                {!isSearchConfig && (
                  <button
                    onClick={() => testConnection(config)}
                    disabled={testing === config.id}
                    className="px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent rounded-lg transition-colors border border-border disabled:opacity-50"
                  >
                    {testing === config.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      t("Test")
                    )}
                  </button>
                )}
                {!config.is_default && (
                  <button
                    onClick={() => {
                      setEditingConfig(config);
                      setShowAddForm(false);
                    }}
                    className="p-1.5 text-muted-foreground hover:bg-accent rounded-lg transition-colors border border-border"
                    title={t("Edit")}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                {!config.is_default && (
                  <button
                    onClick={() => deleteConfig(config.id)}
                    className="p-1.5 text-primary hover:bg-accent rounded-lg transition-colors border border-border"
                    title={t("Delete")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {configs.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {t("No configurations found. Add one to get started.")}
          </div>
        )}
      </div>
    </div>
  );
}
