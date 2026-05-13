"use client";

import { useState, useEffect } from "react";
import {
  PenTool,
  Loader2,
  RefreshCw,
  Database,
  Activity,
  CheckCircle2,
  BrainCircuit,
  FileText,
  Upload,
  Sparkles,
  Book,
  Zap,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Lightbulb,
} from "lucide-react";
import { useGlobal } from "@/context/GlobalContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { apiUrl } from "@/lib/api";
import { processLatexContent } from "@/lib/latex";
import AddToNotebookModal from "@/components/AddToNotebookModal";
import { LogDrawer } from "@/components/question";
import { useQuestionReducer } from "@/hooks/useQuestionReducer";
import { useTranslation } from "react-i18next";

export default function QuestionPage() {
  const {
    questionState,
    setQuestionState,
    startQuestionGen,
    startMimicQuestionGen,
    resetQuestionGen,
  } = useGlobal();
  const { t } = useTranslation();

  const PRESETS: Array<{
    id: string;
    label: string;
    topic: string;
    difficulty: "easy" | "medium" | "hard";
    type: "choice" | "written";
    count: number;
    additionalRequirements: string;
  }> = [
    {
      id: "cn-basic",
      label: "计算机网络｜基础（OSI/TCP-IP + 常见协议）",
      topic: "计算机网络基础（OSI/TCP-IP、交换与路由、常见协议）",
      difficulty: "medium",
      type: "choice",
      count: 10,
      additionalRequirements:
        "题目必须围绕计算机网络（OSI/TCP-IP、IP 子网与路由、ARP、ICMP、以太网/交换、NAT、MTU、DNS、HTTP/HTTPS 等）。避免出现机器学习/算法/操作系统等无关内容。选择题给出 A-D 选项与正确答案，并提供简洁解释。",
    },
    {
      id: "cn-transport",
      label: "计算机网络｜传输层（TCP/拥塞控制）",
      topic: "传输层：TCP/UDP、可靠传输、滑动窗口、拥塞控制",
      difficulty: "hard",
      type: "written",
      count: 6,
      additionalRequirements:
        "题目聚焦传输层：TCP 三次握手/四次挥手、序号确认号、滑动窗口、超时重传、流量控制、拥塞控制（慢启动/拥塞避免/快重传/快恢复）、TCP Reno/CUBIC 基本思想。尽量包含推理题或步骤题，答案需给出关键推导与解释。",
    },
    {
      id: "cn-network",
      label: "计算机网络｜网络层（IP/路由）",
      topic: "网络层：IPv4/IPv6、子网划分、路由与转发",
      difficulty: "medium",
      type: "written",
      count: 8,
      additionalRequirements:
        "题目聚焦网络层：CIDR/子网划分、路由表最长前缀匹配、静态/动态路由（RIP/OSPF/BGP 基本概念）、ICMP、NAT。可包含计算题（子网、可用主机数、路由匹配），并给出步骤化解答。",
    },
    {
      id: "cn-app",
      label: "计算机网络｜应用层（HTTP/DNS）",
      topic: "应用层：HTTP/HTTPS、DNS、CDN、缓存与 Cookie",
      difficulty: "medium",
      type: "choice",
      count: 10,
      additionalRequirements:
        "题目聚焦应用层：HTTP 方法与状态码、缓存（ETag/Last-Modified）、Cookie/Session、HTTPS/TLS 基础握手流程、DNS 解析与缓存、CDN。避免偏离到 Web 开发框架细节；强调协议机制与网络行为。",
    },
    {
      id: "cn-security",
      label: "计算机网络｜安全（TLS/常见攻击）",
      topic: "网络安全基础：TLS、认证、常见网络攻击与防护",
      difficulty: "hard",
      type: "written",
      count: 6,
      additionalRequirements:
        "题目聚焦网络安全与协议安全：TLS/证书/PKI、对称与非对称结合、MITM、重放、DNS 污染/劫持、ARP 欺骗、DDoS 基本原理与防护。答案需解释攻击条件与防护思路。",
    },
  ];

  // Dashboard state for parallel generation
  const [dashboardState, dispatchDashboard] = useQuestionReducer();

  // UI state
  const [activeIdx, setActiveIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [submittedMap, setSubmittedMap] = useState<Record<number, boolean>>({});
  const [kbs, setKbs] = useState<
    Array<{
      name: string;
      is_default?: boolean;
      statistics?: {
        raw_documents?: number;
        rag_initialized?: boolean;
        status?: string;
        rag_provider?: string;
      };
      status?: string;
    }>
  >([]);
  const [showLogDrawer, setShowLogDrawer] = useState(false);
  const [showNotebookModal, setShowNotebookModal] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Derived state
  const isGenerating = questionState.step === "generating";
  const isComplete = questionState.step === "result";
  const isConfigMode = questionState.step === "config";
  const totalQuestions = questionState.results.length;
  const currentQuestion = questionState.results[activeIdx];
  const extendedCount = questionState.results.filter(
    (r: any) => r.extended,
  ).length;

  const noRelevantKnowledge = (questionState.logs || []).some((l: any) =>
    String(l?.content || "")
      .toLowerCase()
      .includes("no relevant knowledge found"),
  );

  // Progress info from questionState
  const progress = questionState.progress || {};
  const stage =
    progress.stage ||
    (isGenerating ? "generating" : isComplete ? "complete" : null);
  const subFocuses = progress.subFocuses || [];

  // Fetch KBs on mount
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    fetch(apiUrl("/api/v1/knowledge/list"), { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : [];
        setKbs(list);
        if (!questionState.selectedKb && list.length > 0) {
          setQuestionState((prev) => ({ ...prev, selectedKb: list[0].name }));
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Failed to fetch KBs:", err);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedKbInfo = kbs.find((k) => k.name === questionState.selectedKb);
  const selectedKbDocs = selectedKbInfo?.statistics?.raw_documents ?? 0;
  const selectedKbReady =
    (selectedKbInfo?.statistics?.rag_initialized ?? false) ||
    selectedKbInfo?.statistics?.status === "ready" ||
    selectedKbInfo?.status === "ready";

  // Auto-select first question when results come in
  useEffect(() => {
    if (
      questionState.results.length > 0 &&
      activeIdx >= questionState.results.length
    ) {
      setActiveIdx(0);
    }
  }, [questionState.results.length, activeIdx]);

  const handleStart = () => {
    if (questionState.mode === "knowledge") {
      startQuestionGen(
        questionState.topic,
        questionState.difficulty,
        questionState.type,
        questionState.count,
        questionState.selectedKb,
        questionState.additionalRequirements,
      );
    } else {
      // Mimic mode: don't limit questions by default (process all reference questions)
      // Only limit if user explicitly sets a value via maxQuestions state
      startMimicQuestionGen(
        questionState.uploadedFile,
        questionState.paperPath,
        questionState.selectedKb,
        undefined, // Let backend process all reference questions
      );
    }
    setUserAnswers({});
    setSubmittedMap({});
    setActiveIdx(0);
  };

  const handleAnswer = (val: string) => {
    if (submittedMap[activeIdx]) return;
    setUserAnswers((prev) => ({ ...prev, [activeIdx]: val }));
  };

  const handleSubmit = () => {
    setSubmittedMap((prev) => ({ ...prev, [activeIdx]: true }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.type !== "application/pdf") {
      alert(t("Please upload a PDF exam paper"));
      return;
    }
    setQuestionState((prev) => ({
      ...prev,
      uploadedFile: file,
      paperPath: file ? "" : prev.paperPath,
    }));
  };

  const handleReset = () => {
    resetQuestionGen();
    setUserAnswers({});
    setSubmittedMap({});
    setActiveIdx(0);
  };

  const canStart =
    questionState.mode === "knowledge"
      ? questionState.topic.trim().length > 0 &&
        (questionState.count ?? 0) >= 1 &&
        (questionState.selectedKb || "").trim().length > 0
      : questionState.uploadedFile !== null ||
        questionState.paperPath.trim().length > 0;

  return (
    <div className="h-screen flex gap-0 p-4 animate-fade-in overflow-hidden">
      {/* Main Panel */}
      <div className="flex-1 flex flex-col bg-card/80 rounded-2xl shadow-sm border border-border overflow-hidden ring-1 ring-sky-500/10">
        {/* Header */}
        <div className="p-4 border-b border-border bg-background/40 flex justify-between items-center backdrop-blur-md shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <PenTool className="w-5 h-5 text-primary" />
              {t("Question Generator")}
            </div>

            {/* Mode Switching */}
            {isConfigMode && (
              <div className="flex bg-secondary p-1 rounded-lg border border-border">
                <button
                  onClick={() =>
                    setQuestionState((prev) => ({ ...prev, mode: "knowledge" }))
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    questionState.mode === "knowledge"
                      ? "bg-card/80 text-primary shadow-sm ring-1 ring-sky-500/10"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <BrainCircuit className="w-4 h-4" />
                  {t("Custom")}
                </button>
                <button
                  onClick={() =>
                    setQuestionState((prev) => ({ ...prev, mode: "mimic" }))
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    questionState.mode === "mimic"
                      ? "bg-card/80 text-primary shadow-sm ring-1 ring-sky-500/10"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  {t("Mimic Exam")}
                </button>
              </div>
            )}

            {/* Status indicator when generating/complete */}
            {!isConfigMode && (
              <div className="flex items-center gap-2 text-sm">
                {isGenerating ? (
                  <div className="flex items-center gap-2 px-3 py-1 bg-accent/70 text-primary rounded-full border border-border ring-1 ring-sky-500/10">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>
                      {t("Generating")} {totalQuestions}/{questionState.count}
                      ...
                    </span>
                  </div>
                ) : isComplete ? (
                  <div className="flex items-center gap-2 px-3 py-1 bg-accent/70 text-primary rounded-full border border-border ring-1 ring-sky-500/10">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {totalQuestions} {t("questions")}
                    </span>
                    {extendedCount > 0 && (
                      <span className="text-muted-foreground">
                        ({extendedCount} {t("extended")})
                      </span>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Knowledge Base selector */}
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-muted-foreground" />
              <select
                value={questionState.selectedKb}
                onChange={(e) =>
                  setQuestionState((prev) => ({
                    ...prev,
                    selectedKb: e.target.value,
                  }))
                }
                disabled={isGenerating}
                className="text-sm bg-card/70 border border-border rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary/25 text-foreground disabled:opacity-50"
              >
                {kbs.map((kb) => (
                  <option key={kb.name} value={kb.name}>
                    {kb.name}
                    {typeof kb.statistics?.raw_documents === "number"
                      ? ` (${kb.statistics.raw_documents})`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Log Drawer Toggle */}
            {!isConfigMode && (
              <button
                onClick={() => setShowLogDrawer(true)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary px-3 py-1.5 hover:bg-accent rounded-lg transition-colors border border-border"
              >
                <Activity className="w-4 h-4" />
                {t("Logs")}
              </button>
            )}

            {/* New/Reset button */}
            {!isConfigMode && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary px-3 py-1.5 hover:bg-accent rounded-lg border border-border transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                {t("New")}
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50/30 dark:bg-slate-900/30">
          {/* Config Mode */}
          {isConfigMode && (
            <div className="p-6">
              <div className="max-w-2xl mx-auto space-y-6">
                {/* KB readiness hint */}
                {questionState.mode === "knowledge" &&
                  questionState.selectedKb &&
                  (selectedKbDocs === 0 || !selectedKbReady) && (
                    <div className="p-4 rounded-xl border bg-accent/50 border-border ring-1 ring-sky-500/10">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
                        <div className="text-sm text-foreground/80">
                          <div className="font-semibold text-foreground mb-1">
                            {t("Knowledge base may be empty or not ready")}
                          </div>
                          <div className="text-muted-foreground">
                            {t("Selected KB")}:{" "}
                            <span className="font-semibold text-foreground">
                              {questionState.selectedKb}
                            </span>
                            {" • "}
                            {t("Documents")}:{" "}
                            <span className="font-semibold text-foreground">
                              {selectedKbDocs}
                            </span>
                            {" • "}
                            {t("Status")}:{" "}
                            <span className="font-semibold text-foreground">
                              {selectedKbReady ? t("Ready") : t("Indexing")}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              onClick={() =>
                                (window.location.href = "/knowledge")
                              }
                              className="px-4 py-2 rounded-xl text-sm font-semibold bg-secondary text-foreground/80 hover:bg-secondary/80 transition-colors border border-border ui-soft-inset"
                            >
                              <Database className="w-4 h-4 inline-block mr-2 text-muted-foreground" />
                              {t("Open Knowledge Bases")}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                {/* Mode Info Banner */}
                <div
                  className={`p-4 rounded-xl border ${
                    questionState.mode === "knowledge"
                      ? "bg-accent/50 border-border ring-1 ring-sky-500/10"
                      : "bg-accent/50 border-border ring-1 ring-sky-500/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {questionState.mode === "knowledge" ? (
                      <BrainCircuit className="w-6 h-6 text-primary" />
                    ) : (
                      <FileText className="w-6 h-6 text-primary" />
                    )}
                    <div>
                      <h3
                        className={`font-semibold ${
                          questionState.mode === "knowledge"
                            ? "text-primary"
                            : "text-primary"
                        }`}
                      >
                        {questionState.mode === "knowledge"
                          ? t("Custom Mode")
                          : t("Mimic Exam Paper Mode")}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {questionState.mode === "knowledge"
                          ? t(
                              "Generate questions based on knowledge base content",
                            )
                          : t(
                              "Generate similar questions based on an exam paper",
                            )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Knowledge Base Mode Config */}
                {questionState.mode === "knowledge" && (
                  <>
                    {/* Presets */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        预设（计算机网络）
                      </label>
                      <select
                        value={questionState.presetId || ""}
                        onChange={(e) => {
                          const id = e.target.value;
                          const preset = PRESETS.find((p) => p.id === id);
                          if (!preset) {
                            setQuestionState((prev) => ({
                              ...prev,
                              presetId: "",
                              additionalRequirements: "",
                            }));
                            return;
                          }
                          setQuestionState((prev) => ({
                            ...prev,
                            presetId: preset.id,
                            topic: preset.topic,
                            difficulty: preset.difficulty,
                            type: preset.type,
                            count: preset.count,
                            additionalRequirements: preset.additionalRequirements,
                          }));
                        }}
                        disabled={isGenerating}
                        className="w-full p-3 bg-card/80 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/25 text-foreground"
                      >
                        <option value="">不使用预设（自定义）</option>
                        {PRESETS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                      {(questionState.presetId || "").trim().length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          已应用预设：将自动加入更严格的生成约束（确保围绕计算机网络）。
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {t("Knowledge Point / Topic")}
                      </label>
                      <input
                        type="text"
                        value={questionState.topic}
                        onChange={(e) =>
                          setQuestionState((prev) => ({
                            ...prev,
                            topic: e.target.value,
                          }))
                        }
                        placeholder={t("e.g. Gradient Descent Optimization")}
                        className="w-full p-4 bg-card/80 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/25 transition-all text-lg text-foreground placeholder:text-muted-foreground"
                      />
                    </div>

                    {/* Additional constraints (visible + editable) */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        额外要求（可选）
                      </label>
                      <textarea
                        value={questionState.additionalRequirements || ""}
                        onChange={(e) =>
                          setQuestionState((prev) => ({
                            ...prev,
                            additionalRequirements: e.target.value,
                          }))
                        }
                        placeholder="例如：仅出计算机网络题；覆盖 TCP/IP、路由、DNS、HTTP；避免无关学科。"
                        className="w-full p-3 bg-card/80 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/25 text-foreground placeholder:text-muted-foreground min-h-[96px] resize-y"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {t("Count")}
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={questionState.count || ""}
                          onChange={(e) => {
                            const rawVal = e.target.value;
                            // Allow empty input while typing
                            if (rawVal === "") {
                              setQuestionState((prev) => ({
                                ...prev,
                                count: 0,
                              }));
                              return;
                            }
                            const val = parseInt(rawVal);
                            if (!isNaN(val)) {
                              setQuestionState((prev) => ({
                                ...prev,
                                count: Math.min(50, Math.max(0, val)),
                              }));
                            }
                          }}
                          onBlur={(e) => {
                            // Ensure valid value on blur
                            const val = parseInt(e.target.value) || 1;
                            setQuestionState((prev) => ({
                              ...prev,
                              count: Math.max(1, Math.min(50, val)),
                            }));
                          }}
                          className="w-full p-3 bg-card/80 border border-border rounded-xl text-center outline-none focus:ring-2 focus:ring-primary/25 text-foreground"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {t("Difficulty")}
                        </label>
                        <select
                          value={questionState.difficulty}
                          onChange={(e) =>
                            setQuestionState((prev) => ({
                              ...prev,
                              difficulty: e.target.value,
                            }))
                          }
                          className="w-full p-3 bg-card/80 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/25 text-foreground"
                        >
                          <option value="easy">{t("Easy")}</option>
                          <option value="medium">{t("Medium")}</option>
                          <option value="hard">{t("Hard")}</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {t("Type")}
                        </label>
                        <select
                          value={questionState.type}
                          onChange={(e) =>
                            setQuestionState((prev) => ({
                              ...prev,
                              type: e.target.value,
                            }))
                          }
                          className="w-full p-3 bg-card/80 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/25 text-foreground"
                        >
                          <option value="choice">{t("Multiple Choice")}</option>
                          <option value="written">{t("Written")}</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* Mimic Mode Config */}
                {questionState.mode === "mimic" && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {t("Upload Exam Paper (PDF)")}
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="pdf-upload"
                        />
                        <label
                          htmlFor="pdf-upload"
                          className="flex items-center justify-center gap-3 w-full py-8 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-sky-300/60 hover:bg-accent/40 transition-all"
                        >
                          {questionState.uploadedFile ? (
                            <div className="flex items-center gap-3 text-primary">
                              <FileText className="w-8 h-8" />
                              <div>
                                <p className="font-medium">
                                  {questionState.uploadedFile.name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {(
                                    questionState.uploadedFile.size /
                                    1024 /
                                    1024
                                  ).toFixed(2)}{" "}
                                  MB
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-slate-500 dark:text-slate-400">
                              <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                              <p className="font-medium">
                                {t("Click to upload PDF")}
                              </p>
                              <p className="text-xs">
                                {t(
                                  "The system will parse and generate questions",
                                )}
                              </p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-600"></div>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {t("OR")}
                      </span>
                      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-600"></div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {t("Pre-parsed Directory")}
                      </label>
                      <input
                        type="text"
                        value={questionState.paperPath}
                        onChange={(e) =>
                          setQuestionState((prev) => ({
                            ...prev,
                            paperPath: e.target.value,
                            uploadedFile: null,
                          }))
                        }
                        placeholder={t("e.g. 2211asm1")}
                        className="w-full p-3 bg-card/80 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/25 text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                )}

                {/* Generate Button */}
                <button
                  onClick={handleStart}
                  disabled={!canStart || isGenerating}
                  className="w-full py-4 bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-sky-500/25 hover:from-sky-600 hover:to-cyan-600 hover:shadow-sky-500/35 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ring-1 ring-sky-500/20"
                >
                  <Sparkles className="w-5 h-5" />
                  {t("Generate Questions")}
                </button>
                {questionState.mode === "knowledge" &&
                  (questionState.count ?? 0) < 1 && (
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-primary" />
                      {t("Count must be at least 1")}
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Question Display Mode */}
          {!isConfigMode && (
            <div className="flex h-full">
              {/* Left: Question List */}
              <div className="w-72 flex-shrink-0 border-r border-border bg-card/60 flex flex-col">
                <div className="p-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {t("Questions")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {totalQuestions}/{questionState.count}
                    </span>
                  </div>
                  {isGenerating && questionState.count > 0 && (
                    <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden border border-border">
                      <div
                        className="h-full bg-sky-500 transition-all duration-300"
                        style={{
                          width: `${(totalQuestions / questionState.count) * 100}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {totalQuestions === 0 && isGenerating && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <Loader2 className="w-8 h-8 animate-spin mb-2" />
                      <p className="text-sm">{t("Generating...")}</p>
                    </div>
                  )}
                  {totalQuestions === 0 && !isGenerating && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6">
                      <Book className="w-10 h-10 mb-3 opacity-30" />
                      <p className="text-sm mb-3">{t("No questions yet")}</p>
                      <button
                        onClick={handleReset}
                        className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors ring-1 ring-sky-500/10"
                      >
                        {t("Generate Questions")}
                      </button>
                    </div>
                  )}
                  {questionState.results.map((result: any, idx: number) => (
                    (() => {
                      const userAns = userAnswers[idx];
                      const correctAns = result?.question?.correct_answer;
                      const isChoice =
                        result?.question?.question_type === "choice" ||
                        result?.question?.type === "choice";
                      const isSubmitted = !!submittedMap[idx];
                      const isAnswered = typeof userAns === "string" && userAns.length > 0;
                      const isCorrect =
                        isSubmitted && isChoice && isAnswered && userAns === correctAns;
                      const isWrong =
                        isSubmitted && isChoice && isAnswered && userAns !== correctAns;

                      return (
                    <button
                      key={idx}
                      onClick={() => setActiveIdx(idx)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition-all mb-1 ${
                        activeIdx === idx
                          ? "bg-accent/50 border-l-2 border-sky-300/60"
                          : "hover:bg-accent/30"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            result.extended
                              ? "bg-accent/70 text-primary"
                              : submittedMap[idx]
                                ? isCorrect
                                  ? "bg-emerald-600 text-white"
                                  : isWrong
                                    ? "bg-rose-600 text-white"
                                    : "bg-accent/70 text-primary"
                                : activeIdx === idx
                                  ? "bg-accent/70 text-primary"
                                  : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {result.extended ? (
                            <Zap className="w-3.5 h-3.5" />
                          ) : submittedMap[idx] ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm line-clamp-2 ${activeIdx === idx ? "text-slate-800 dark:text-slate-100 font-medium" : "text-slate-600 dark:text-slate-300"}`}
                          >
                            {result.question.question.slice(0, 80)}...
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-400 uppercase">
                              {result.question.type ||
                                result.question.question_type}
                            </span>
                            {result.extended && (
                              <span className="text-xs text-muted-foreground">
                                {t("Extended")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                      );
                    })()
                  ))}
                </div>
              </div>

              {/* Right: Question Detail */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {currentQuestion ? (
                  <>
                    {/* Question Header */}
                    <div className="px-6 py-3 border-b border-border/70 flex items-center justify-between bg-background/35 backdrop-blur-md">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground">
                          Question {activeIdx + 1}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-secondary text-muted-foreground rounded border border-border ui-soft-inset">
                          {currentQuestion.question.type ||
                            currentQuestion.question.question_type}
                        </span>
                        {currentQuestion.extended && (
                          <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-accent/70 text-primary rounded flex items-center gap-1 border border-border ring-1 ring-sky-500/10">
                            <Zap className="w-3 h-3" />
                            {t("Extended")}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setShowNotebookModal(true)}
                        className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 px-2 py-1 hover:bg-accent rounded-lg transition-colors border border-border"
                      >
                        <Book className="w-3 h-3" />
                        {t("Add to Notebook")}
                      </button>
                    </div>

                    {/* Question Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      {/* Question Text */}
                      <div className="prose prose-slate dark:prose-invert max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {processLatexContent(
                            currentQuestion.question.question,
                          )}
                        </ReactMarkdown>
                      </div>

                      {/* Options or Input */}
                      {(currentQuestion.question.question_type === "choice" ||
                        currentQuestion.question.type === "choice") &&
                      currentQuestion.question.options &&
                      Object.keys(currentQuestion.question.options).length >
                        0 ? (
                        <div className="space-y-3">
                          {Object.entries(currentQuestion.question.options).map(
                            ([key, val]) => {
                              const isSelected = userAnswers[activeIdx] === key;
                              const isCorrect =
                                key === currentQuestion.question.correct_answer;
                              const showCorrectness = submittedMap[activeIdx];
                              const isWrongSelected =
                                showCorrectness && isSelected && !isCorrect;

                              return (
                                <button
                                  key={key}
                                  onClick={() =>
                                    !submittedMap[activeIdx] &&
                                    handleAnswer(key)
                                  }
                                  disabled={submittedMap[activeIdx]}
                                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4 prose dark:prose-invert max-w-none ${
                                    showCorrectness
                                      ? isCorrect
                                        ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300/70 dark:border-emerald-700/60 ring-1 ring-emerald-500/15"
                                        : isWrongSelected
                                          ? "bg-rose-50/80 dark:bg-rose-950/30 border-rose-300/70 dark:border-rose-700/60 ring-1 ring-rose-500/15"
                                          : "bg-card/70 border-border"
                                      : isSelected
                                        ? "bg-accent/60 border-sky-300/60 ring-1 ring-sky-500/10"
                                        : "bg-card/70 border-border hover:border-sky-300/60"
                                  }`}
                                >
                                  <span
                                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                                      showCorrectness && isCorrect
                                        ? "bg-emerald-600 text-white"
                                        : isWrongSelected
                                          ? "bg-rose-600 text-white"
                                          : isSelected
                                            ? "bg-sky-500 text-white"
                                            : "bg-secondary text-muted-foreground"
                                    }`}
                                  >
                                    {key}
                                  </span>
                                  <div className="flex-1">
                                    <ReactMarkdown
                                      remarkPlugins={[remarkGfm, remarkMath]}
                                      rehypePlugins={[rehypeKatex]}
                                    >
                                      {processLatexContent(String(val))}
                                    </ReactMarkdown>
                                  </div>
                                  {showCorrectness && isCorrect && (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                  )}
                                </button>
                              );
                            },
                          )}
                        </div>
                      ) : (
                        <textarea
                          value={userAnswers[activeIdx] || ""}
                          onChange={(e) => handleAnswer(e.target.value)}
                          disabled={submittedMap[activeIdx]}
                          placeholder={t("Type your answer here...")}
                          className="w-full h-40 p-4 bg-card/80 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/25 resize-none text-foreground placeholder:text-muted-foreground"
                        />
                      )}

                      {/* Answer & Explanation (shown after submit) */}
                      {submittedMap[activeIdx] && (
                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                          {/* Correct Answer */}
                          <div className="p-4 bg-accent/50 rounded-xl border border-border ring-1 ring-sky-500/10">
                            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                              {t("Correct Answer")}
                            </p>
                            <div className="text-foreground prose prose-sm dark:prose-invert max-w-none">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                              >
                                {processLatexContent(
                                  String(
                                    currentQuestion.question.correct_answer,
                                  ),
                                )}
                              </ReactMarkdown>
                            </div>
                          </div>

                          {/* Explanation */}
                          {currentQuestion.question.explanation && (
                            <div>
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                {t("Explanation")}
                              </p>
                              <div className="text-slate-700 dark:text-slate-300 prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm, remarkMath]}
                                  rehypePlugins={[rehypeKatex]}
                                >
                                  {processLatexContent(
                                    currentQuestion.question.explanation,
                                  )}
                                </ReactMarkdown>
                              </div>
                            </div>
                          )}

                          {/* Relevance Analysis (collapsible) */}
                          {currentQuestion.validation && (
                            <div className="border border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden">
                              <button
                                onClick={() => setShowAnalysis(!showAnalysis)}
                                className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                              >
                                <div className="flex items-center gap-2 text-sm">
                                  <AlertCircle className="w-4 h-4 text-slate-400" />
                                  <span className="font-medium text-slate-600 dark:text-slate-300">
                                    {t("Relevance Analysis")}
                                  </span>
                                  <span className="text-xs px-1.5 py-0.5 bg-slate-200 dark:bg-slate-600 text-slate-500 rounded">
                                    {currentQuestion.rounds || 1} {t("round")}
                                    {(currentQuestion.rounds || 1) > 1
                                      ? t("s")
                                      : ""}
                                  </span>
                                </div>
                                {showAnalysis ? (
                                  <ChevronUp className="w-4 h-4 text-slate-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-slate-400" />
                                )}
                              </button>

                              {showAnalysis && (
                                <div className="px-4 py-3 space-y-3 text-sm bg-white dark:bg-slate-800">
                                  {currentQuestion.validation.kb_coverage && (
                                    <div>
                                      <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-1">
                                        <Database className="w-3 h-3" />
                                        {t("KB Coverage")}
                                      </div>
                                      <div className="text-slate-600 dark:text-slate-300 prose prose-xs dark:prose-invert max-w-none">
                                        <ReactMarkdown
                                          remarkPlugins={[
                                            remarkGfm,
                                            remarkMath,
                                          ]}
                                          rehypePlugins={[rehypeKatex]}
                                        >
                                          {processLatexContent(
                                            currentQuestion.validation
                                              .kb_coverage,
                                          )}
                                        </ReactMarkdown>
                                      </div>
                                    </div>
                                  )}
                                  {currentQuestion.validation
                                    .extension_points && (
                                    <div>
                                      <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-1">
                                        <Zap className="w-3 h-3" />
                                        {t("Extension Points")}
                                      </div>
                                      <div className="text-slate-600 dark:text-slate-300 prose prose-xs dark:prose-invert max-w-none">
                                        <ReactMarkdown
                                          remarkPlugins={[
                                            remarkGfm,
                                            remarkMath,
                                          ]}
                                          rehypePlugins={[rehypeKatex]}
                                        >
                                          {processLatexContent(
                                            currentQuestion.validation
                                              .extension_points,
                                          )}
                                        </ReactMarkdown>
                                      </div>
                                    </div>
                                  )}
                                  {currentQuestion.extended &&
                                    currentQuestion.validation
                                      .kb_connection && (
                                      <div>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-1">
                                          <Database className="w-3 h-3" />
                                          {t("KB Connection")}
                                        </div>
                                        <div className="text-slate-600 dark:text-slate-300 prose prose-xs dark:prose-invert max-w-none">
                                          <ReactMarkdown
                                            remarkPlugins={[
                                              remarkGfm,
                                              remarkMath,
                                            ]}
                                            rehypePlugins={[rehypeKatex]}
                                          >
                                            {processLatexContent(
                                              currentQuestion.validation
                                                .kb_connection,
                                            )}
                                          </ReactMarkdown>
                                        </div>
                                      </div>
                                    )}
                                  {currentQuestion.extended &&
                                    currentQuestion.validation
                                      .extended_aspect && (
                                      <div>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-1">
                                          <Lightbulb className="w-3 h-3" />
                                          {t("Extended Aspects")}
                                        </div>
                                        <div className="text-slate-600 dark:text-slate-300 prose prose-xs dark:prose-invert max-w-none">
                                          <ReactMarkdown
                                            remarkPlugins={[
                                              remarkGfm,
                                              remarkMath,
                                            ]}
                                            rehypePlugins={[rehypeKatex]}
                                          >
                                            {processLatexContent(
                                              currentQuestion.validation
                                                .extended_aspect,
                                            )}
                                          </ReactMarkdown>
                                        </div>
                                      </div>
                                    )}
                                  {currentQuestion.validation.reasoning && (
                                    <div>
                                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                        {t("Reasoning")}
                                      </div>
                                      <div className="text-slate-600 dark:text-slate-300 prose prose-xs dark:prose-invert max-w-none">
                                        <ReactMarkdown
                                          remarkPlugins={[
                                            remarkGfm,
                                            remarkMath,
                                          ]}
                                          rehypePlugins={[rehypeKatex]}
                                        >
                                          {processLatexContent(
                                            currentQuestion.validation
                                              .reasoning,
                                          )}
                                        </ReactMarkdown>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                      {!submittedMap[activeIdx] ? (
                        <button
                          onClick={handleSubmit}
                          disabled={!userAnswers[activeIdx]}
                          className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-sky-500/15 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all ring-1 ring-sky-500/10"
                        >
                          {t("Submit Answer")}
                        </button>
                      ) : (
                        <div className="flex items-center justify-center gap-2 py-3 bg-accent/60 text-primary rounded-xl border border-border ring-1 ring-sky-500/10">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="font-medium">{t("Submitted")}</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-400">
                    <div className="text-center">
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-3 text-primary" />
                          <p className="text-lg font-medium text-slate-600 dark:text-slate-300">
                            {t("Generating questions...")}
                          </p>
                          <p className="text-sm">
                            {t("View progress in the Logs panel")}
                          </p>
                        </>
                      ) : (
                        <>
                          <Book className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p className="text-sm mb-3">
                            {totalQuestions === 0
                              ? t("No questions yet")
                              : t("Select a question to view details")}
                          </p>
                          {totalQuestions === 0 && (
                            <div className="space-y-3">
                              {(isComplete || noRelevantKnowledge) && (
                                <div className="max-w-md mx-auto text-left p-4 rounded-2xl bg-accent/50 border border-border ring-1 ring-sky-500/10">
                                  <div className="flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-primary mt-0.5" />
                                    <div className="text-sm text-foreground/80">
                                      {noRelevantKnowledge
                                        ? t(
                                            "No relevant knowledge found in the selected knowledge base. Try switching KB or adjusting the topic, or upload more CN materials first.",
                                          )
                                        : t(
                                            "Generation finished but no questions were produced. Check logs and try a different topic/KB.",
                                          )}
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                <button
                                  onClick={handleReset}
                                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md shadow-sky-500/15 ring-1 ring-sky-500/10"
                                >
                                  <Sparkles className="w-4 h-4 inline-block mr-2" />
                                  {t("Back to Config")}
                                </button>
                                <button
                                  onClick={() => (window.location.href = "/knowledge")}
                                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-secondary text-foreground/80 hover:bg-secondary/80 transition-colors border border-border ui-soft-inset"
                                >
                                  <Database className="w-4 h-4 inline-block mr-2 text-muted-foreground" />
                                  {t("Open Knowledge Bases")}
                                </button>
                                <button
                                  onClick={() => setShowLogDrawer(true)}
                                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-secondary text-foreground/80 hover:bg-secondary/80 transition-colors border border-border ui-soft-inset"
                                >
                                  <Activity className="w-4 h-4 inline-block mr-2 text-muted-foreground" />
                                  {t("View Logs")}
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Log Drawer */}
      <LogDrawer
        isOpen={showLogDrawer}
        onClose={() => setShowLogDrawer(false)}
        logs={questionState.logs || []}
        stage={stage}
        progress={progress.progress}
        subFocuses={subFocuses}
        mode={questionState.mode === "knowledge" ? "custom" : "mimic"}
        topic={questionState.topic}
        difficulty={questionState.difficulty}
        questionType={questionState.type}
        count={questionState.count}
        onClearLogs={() => setQuestionState((prev) => ({ ...prev, logs: [] }))}
      />

      {/* Add to Notebook Modal */}
      {currentQuestion && (
        <AddToNotebookModal
          isOpen={showNotebookModal}
          onClose={() => setShowNotebookModal(false)}
          recordType="question"
          title={`${questionState.topic} - ${currentQuestion.question.type || currentQuestion.question.question_type}`}
          userQuery={`Topic: ${questionState.topic}\nDifficulty: ${questionState.difficulty}\nType: ${questionState.type}`}
          output={`**Question:**\n${currentQuestion.question.question}\n\n**Options:**\n${
            currentQuestion.question.options
              ? Object.entries(currentQuestion.question.options)
                  .map(([k, v]) => `${k}. ${v}`)
                  .join("\n")
              : "N/A"
          }\n\n**Correct Answer:** ${currentQuestion.question.correct_answer}\n\n**Explanation:**\n${currentQuestion.question.explanation}`}
          metadata={{
            difficulty: questionState.difficulty,
            question_type: questionState.type,
            validation_rounds: currentQuestion.rounds,
            extended: currentQuestion.extended,
          }}
          kbName={questionState.selectedKb}
        />
      )}
    </div>
  );
}
