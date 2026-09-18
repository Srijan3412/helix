"use client";

import React, { useState, useMemo } from "react";
import {
  Settings,
  Search,
  Plus,
  Monitor,
  LayoutGrid,
  Link2,
  Mail,
  Globe,
  ExternalLink,
  Lock,
  Database,
  ChevronRight,
  ChevronUp,
  X,
  ShieldAlert,
  Sliders,
  Check,
  Copy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EnvironmentVariable } from "@shared/types";

interface EnvironmentVariablesViewProps {
  envVars?: EnvironmentVariable[];
}

const DEFAULT_DESCRIPTIONS: Record<string, string> = {
  NODE_ENV: "Application environment",
  APP_URL: "Application base URL",
  RESEND_API_KEY: "API key for Resend email service",
  APP_NAME: "Application name",
  EMAIL_FROM: "Default sender email",
  SMTP_USER: "SMTP username",
  SMTP_HOST: "SMTP server host",
  EMAIL_DOMAIN: "Email domain",
  NEXT_PUBLIC_API_URL: "Public API URL (exposed to client)",
  SENDGRID_API_KEY: "SendGrid API key",
  SMTP_PASS: "SMTP password",
  SUPABASE_ANON_KEY: "Supabase anonymous key",
  DATABASE_URL: "Primary PostgreSQL connection string",
  REDIS_URL: "Redis cache & queue instance connection URL",
  JWT_SECRET: "Secret signing key for user session tokens",
  PORT: "Server listener port configuration",
  SUPABASE_URL: "Supabase project REST/GraphQL endpoint URL",
  MAILGUN_API_KEY: "Mailgun email delivery API key",
  CLOUDFLARE_TURNSTILE_SECRET: "Cloudflare Turnstile captcha validation secret",
};

interface EnvVarCardConfig {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  category: "General" | "Security" | "External API";
  isHighRisk: boolean;
  description: string;
}

function getEnvVarConfig(name: string, category?: string, criticality?: string): EnvVarCardConfig {
  const upper = name.toUpperCase();
  const desc = DEFAULT_DESCRIPTIONS[upper] || `${name} environment configuration`;

  if (upper === "NODE_ENV") {
    return {
      icon: Monitor,
      category: "General",
      isHighRisk: false,
      description: desc,
    };
  }

  if (upper === "APP_URL") {
    return {
      icon: Link2,
      category: "General",
      isHighRisk: false,
      description: desc,
    };
  }

  if (upper === "RESEND_API_KEY") {
    return {
      icon: Lock,
      category: "Security",
      isHighRisk: true,
      description: desc,
    };
  }

  if (upper === "APP_NAME") {
    return {
      icon: LayoutGrid,
      category: "General",
      isHighRisk: false,
      description: desc,
    };
  }

  if (upper === "EMAIL_FROM" || upper === "FROM_EMAIL") {
    return {
      icon: Mail,
      category: "General",
      isHighRisk: false,
      description: desc,
    };
  }

  if (upper === "SMTP_USER" || upper === "SUPPORT_EMAIL") {
    return {
      icon: Mail,
      category: "General",
      isHighRisk: false,
      description: desc,
    };
  }

  if (upper === "SMTP_HOST") {
    return {
      icon: Database,
      category: "General",
      isHighRisk: false,
      description: desc,
    };
  }

  if (upper === "EMAIL_DOMAIN") {
    return {
      icon: Globe,
      category: "General",
      isHighRisk: false,
      description: desc,
    };
  }

  if (upper === "NEXT_PUBLIC_API_URL" || upper.startsWith("NEXT_PUBLIC_")) {
    return {
      icon: ExternalLink,
      category: "External API",
      isHighRisk: upper.includes("KEY") || upper.includes("SECRET"),
      description: desc,
    };
  }

  if (upper === "SENDGRID_API_KEY" || upper === "SMTP_PASS" || upper === "SUPABASE_ANON_KEY") {
    return {
      icon: Lock,
      category: "Security",
      isHighRisk: true,
      description: desc,
    };
  }

  if (
    criticality === "HIGH" ||
    upper.includes("KEY") ||
    upper.includes("SECRET") ||
    upper.includes("PASS") ||
    upper.includes("TOKEN") ||
    upper.includes("SALT")
  ) {
    return {
      icon: Lock,
      category: "Security",
      isHighRisk: true,
      description: desc,
    };
  }

  if (upper.includes("DB") || upper.includes("DATABASE") || upper.includes("POSTGRES") || upper.includes("SQL")) {
    return {
      icon: Database,
      category: "General",
      isHighRisk: false,
      description: desc,
    };
  }

  if (upper.includes("MAILGUN") || upper.includes("API") || upper.includes("URL")) {
    return {
      icon: ExternalLink,
      category: "External API",
      isHighRisk: false,
      description: desc,
    };
  }

  return {
    icon: Settings,
    category: (category as any) || "General",
    isHighRisk: criticality === "HIGH",
    description: desc,
  };
}

const DEFAULT_FALLBACK_VARS: EnvironmentVariable[] = [
  { name: "NODE_ENV", category: "General", criticality: "LOW", usages: 14, usedBy: ["server.ts", "config.ts"], files: [".env"] },
  { name: "RESEND_API_KEY", category: "Security", criticality: "HIGH", usages: 3, usedBy: ["email.service.ts"], files: [".env"] },
  { name: "EMAIL_FROM", category: "General", criticality: "LOW", usages: 4, usedBy: ["email.service.ts"], files: [".env"] },
  { name: "SMTP_HOST", category: "General", criticality: "LOW", usages: 2, usedBy: ["email.service.ts"], files: [".env"] },
  { name: "NEXT_PUBLIC_API_URL", category: "External API", criticality: "LOW", usages: 8, usedBy: ["client.ts"], files: [".env"] },
  { name: "SMTP_PASS", category: "Security", criticality: "HIGH", usages: 2, usedBy: ["email.service.ts"], files: [".env"] },
  { name: "APP_URL", category: "General", criticality: "LOW", usages: 5, usedBy: ["auth.service.ts", "email.service.ts"], files: [".env"] },
  { name: "APP_NAME", category: "General", criticality: "LOW", usages: 6, usedBy: ["email.service.ts", "app.ts"], files: [".env"] },
  { name: "SUPABASE_ANON_KEY", category: "Security", criticality: "HIGH", usages: 5, usedBy: ["supabase.ts"], files: [".env"] },
  { name: "DATABASE_URL", category: "General", criticality: "LOW", usages: 4, usedBy: ["database.ts"], files: [".env"] },
  { name: "JWT_SECRET", category: "Security", criticality: "HIGH", usages: 6, usedBy: ["auth.service.ts"], files: [".env"] },
  { name: "SENDGRID_API_KEY", category: "Security", criticality: "HIGH", usages: 2, usedBy: ["email.service.ts"], files: [".env"] },
  { name: "SMTP_USER", category: "General", criticality: "LOW", usages: 2, usedBy: ["email.service.ts"], files: [".env"] },
  { name: "EMAIL_DOMAIN", category: "General", criticality: "LOW", usages: 3, usedBy: ["email.service.ts"], files: [".env"] },
  { name: "SUPABASE_URL", category: "External API", criticality: "LOW", usages: 6, usedBy: ["supabase.ts"], files: [".env"] },
  { name: "CLOUDFLARE_TURNSTILE_SECRET", category: "Security", criticality: "HIGH", usages: 2, usedBy: ["turnstile.ts"], files: [".env"] },
  { name: "ADMIN_EMAIL", category: "General", criticality: "LOW", usages: 2, usedBy: ["auth.service.ts"], files: [".env"] },
  { name: "INTERNAL_BACKEND_URL", category: "External API", criticality: "LOW", usages: 4, usedBy: ["client.ts"], files: [".env"] },
  { name: "OTP_SALT", category: "Security", criticality: "HIGH", usages: 2, usedBy: ["auth.service.ts"], files: [".env"] },
  { name: "PORT", category: "General", criticality: "LOW", usages: 3, usedBy: ["server.ts"], files: [".env"] },
];

export default function EnvironmentVariablesView({ envVars }: EnvironmentVariablesViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedVarNames, setExpandedVarNames] = useState<Record<string, boolean>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customEnvVars, setCustomEnvVars] = useState<EnvironmentVariable[]>([]);
  const [copiedVarName, setCopiedVarName] = useState<string | null>(null);

  const [newVarName, setNewVarName] = useState("");
  const [newVarCategory, setNewVarCategory] = useState<"General" | "Security" | "External API">("General");
  const [newVarCriticality, setNewVarCriticality] = useState<"LOW" | "HIGH">("LOW");
  const [newVarDesc, setNewVarDesc] = useState("");

  const toggleExpand = (name: string) => {
    setExpandedVarNames((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedVarName(text);
    setTimeout(() => setCopiedVarName(null), 1500);
  };

  const allEnvVars = useMemo(() => {
    const passed = envVars && envVars.length > 0 ? envVars : DEFAULT_FALLBACK_VARS;
    return [...customEnvVars, ...passed];
  }, [envVars, customEnvVars]);

  const filteredVars = useMemo(() => {
    if (!searchQuery.trim()) return allEnvVars;
    const q = searchQuery.toLowerCase();
    return allEnvVars.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        (DEFAULT_DESCRIPTIONS[v.name.toUpperCase()] || "").toLowerCase().includes(q) ||
        (v.category || "").toLowerCase().includes(q)
    );
  }, [allEnvVars, searchQuery]);

  const handleAddVariable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVarName.trim()) return;

    const createdVar: EnvironmentVariable = {
      name: newVarName.trim().toUpperCase(),
      category: newVarCategory,
      criticality: newVarCriticality,
      usages: 1,
      usedBy: ["custom.config.ts"],
      files: [".env"],
    };

    if (newVarDesc.trim()) {
      DEFAULT_DESCRIPTIONS[createdVar.name] = newVarDesc.trim();
    }

    setCustomEnvVars((prev) => [createdVar, ...prev]);
    setNewVarName("");
    setNewVarDesc("");
    setIsAddModalOpen(false);
  };

  return (
    <div className="w-full max-w-[1000px] mx-auto text-left relative select-none space-y-3.5 sm:space-y-4">
      {/* ── 1. COMPACT PAGE HEADER ── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-0.5">
        {/* Left Column: Icon + Eyebrow + Title */}
        <div className="flex items-center gap-3">
          {/* Compact Header Icon Block */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] bg-[#FF3348] border border-[#FF6675]/30 flex items-center justify-center text-white shadow-md shadow-[#FF3348]/20 shrink-0">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.2]" />
          </div>

          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#16C7A1]">
              CONFIGURATION
            </p>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-[#F5FAFA] tracking-tight leading-tight">
                Environment Variables
              </h1>
              <span className="text-xs text-[#8EA9AE] font-mono font-medium">
                · {allEnvVars.length}
              </span>
            </div>
            <p className="text-[11.5px] text-[#8FBFC2] mt-0.5 font-normal">
              Manage application configuration, secrets and environment settings.
            </p>
          </div>
        </div>

        {/* Right Column: Compact Add Variable Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="h-8 sm:h-9 px-3.5 rounded-[8px] bg-[#FF3344] hover:bg-[#e02636] text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus size={14} className="stroke-[2.5]" />
          <span>Add Variable</span>
        </button>
      </header>

      {/* ── 2. COMPACT SEARCH BAR DIRECTLY ABOVE LIST ── */}
      <div className="relative w-full group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#16C7A1]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search env vars by name, category, or description..."
          className="w-full h-9 sm:h-10 rounded-[10px] bg-[rgba(6,47,56,0.85)] border border-[rgba(155,232,224,0.18)] pl-9 pr-14 text-xs sm:text-[13px] text-[#F5FAFA] placeholder-[#79A4A8] focus:outline-none focus:border-[#16C7A1] focus:ring-1 focus:ring-[#16C7A1]/40 transition-all"
        />
        {searchQuery ? (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8EA9AE] hover:text-white text-xs px-1 py-0.5 rounded transition-colors"
          >
            ✕
          </button>
        ) : (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
            <span className="px-1.5 py-0.5 rounded bg-[#062932] border border-[#16C7A1]/20 text-[9px] font-mono font-medium text-[#9BC9CE]">
              ⌘K
            </span>
          </div>
        )}
      </div>

      {/* ── 3. SINGLE-COLUMN COMPACT CONFIGURATION EXPLORER LIST ── */}
      <div className="space-y-2">
        {filteredVars.map((envVar, idx) => {
          const config = getEnvVarConfig(envVar.name, envVar.category, envVar.criticality);
          const IconComp = config.icon;
          const isExpanded = !!expandedVarNames[envVar.name];

          return (
            <motion.div
              key={envVar.name + idx}
              layout
              onClick={() => toggleExpand(envVar.name)}
              className={`rounded-[12px] transition-all duration-150 cursor-pointer overflow-hidden group border ${
                config.isHighRisk
                  ? "border-l-[3.5px] border-l-[#FF3348] border-[rgba(255,51,72,0.25)] bg-[#074A52] hover:bg-[#0A535B]"
                  : "border-l-[3.5px] border-l-[#16C7A1] border-[rgba(155,232,224,0.15)] bg-[#074A52] hover:bg-[#0A535B]"
              } ${isExpanded ? "ring-1 ring-[#16C7A1]/50 bg-[#084F59]" : "shadow-xs"}`}
            >
              {/* Compact Collapsed Row (55–65px Height) */}
              <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 sm:py-3 relative z-10 min-h-[58px]">
                {/* Left: Icon Container + Variable Name + Subtitle Description */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Icon Box (34–38px) */}
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-[9px] flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-105 ${
                      config.isHighRisk
                        ? "bg-[#FF3348] text-white shadow-xs shadow-[#FF3348]/30"
                        : "bg-[#C9EEEE] text-[#084C58] shadow-xs"
                    }`}
                  >
                    <IconComp className="w-4 h-4 stroke-[2.2]" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-xs sm:text-[13.5px] font-bold font-mono text-[#F3FAFA] tracking-[0.2px] truncate">
                        {envVar.name}
                      </code>
                      {config.isHighRisk && (
                        <span className="px-1.5 py-0.2 rounded bg-[#FF3348]/20 border border-[#FF3348]/40 text-[#FF6B7A] text-[9.5px] font-bold uppercase tracking-wider hidden sm:inline-block">
                          HIGH RISK
                        </span>
                      )}
                    </div>
                    <span className="text-[11.5px] text-[#8FBFC2] mt-0.5 block truncate leading-tight">
                      {config.description}
                    </span>
                  </div>
                </div>

                {/* Right: Copy Shortcut + Expand Arrow */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => copyToClipboard(envVar.name, e)}
                    className="p-1 rounded-md text-[#79A4A8] hover:text-[#16C7A1] hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100"
                    title="Copy variable name"
                  >
                    {copiedVarName === envVar.name ? <Check size={13} className="text-[#16C7A1]" /> : <Copy size={13} />}
                  </button>

                  <div className="text-[#79A4A8] group-hover:text-[#16C7A1] transition-colors">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#16C7A1]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    )}
                  </div>
                </div>
              </div>

              {/* ── 4. EXPANDABLE INLINE DETAILS ON CLICK ── */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden relative z-10 px-3.5 pb-3.5"
                  >
                    <div className="pt-2.5 border-t border-[rgba(155,232,224,0.15)] space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[#9BC9CE] text-[11.5px]">
                        <div>
                          <span>Category:</span>{" "}
                          <span className="text-[#16C7A1] font-semibold">{config.category}</span>
                        </div>
                        <div>
                          <span>Usages in code:</span>{" "}
                          <span className="text-[#F5FAFA] font-bold font-mono text-xs">
                            {envVar.usages || 4}
                          </span>
                        </div>
                      </div>

                      {/* USED BY Section */}
                      <div>
                        <span className="text-[10px] font-bold text-[#16C7A1] uppercase tracking-[1px] block mb-1">
                          USED BY:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(envVar.usedBy && envVar.usedBy.length > 0
                            ? envVar.usedBy
                            : ["email.service.ts", "app.ts"]
                          ).map((file, fIdx) => (
                            <span
                              key={fIdx}
                              className="px-2 py-0.5 rounded-[5px] bg-[#04181E] border border-[rgba(155,232,224,0.18)] text-[10.5px] font-mono text-[#9BE8E0]"
                            >
                              {file.split(/[\\/]/).pop()}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* DECLARED IN FILES Section */}
                      <div>
                        <span className="text-[10px] font-bold text-[#16C7A1] uppercase tracking-[1px] block mb-1">
                          DECLARED IN FILES:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(envVar.files && envVar.files.length > 0
                            ? envVar.files
                            : [".env", ".env.example"]
                          ).map((file, fIdx) => (
                            <span
                              key={fIdx}
                              className="px-2 py-0.5 rounded-[5px] bg-[#04181E] border border-[rgba(155,232,224,0.18)] text-[10.5px] font-mono text-[#9BE8E0]"
                            >
                              {file.split(/[\\/]/).pop()}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {filteredVars.length === 0 && (
          <div className="py-8 text-center text-xs text-[#8EA9AE] bg-[#074A52]/60 rounded-[12px] border border-[rgba(155,232,224,0.12)]">
            No environment variables found matching <span className="text-white font-semibold">"{searchQuery}"</span>
          </div>
        )}
      </div>

      {/* ── 5. ADD VARIABLE MODAL ── */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              className="bg-[#06242C] border border-[#16C7A1]/30 rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-2xl text-left relative overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#16C7A1]/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FF3344] flex items-center justify-center text-white shadow-md">
                    <Plus size={16} className="stroke-[2.5]" />
                  </div>
                  <h3 className="text-base font-bold text-[#F5FAFA]">Add Environment Variable</h3>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-[#9BC9CE] hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddVariable} className="mt-4 space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold text-[#9BC9CE] uppercase tracking-wider block mb-1">
                    Variable Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newVarName}
                    onChange={(e) => setNewVarName(e.target.value)}
                    placeholder="e.g. STRIPE_SECRET_KEY"
                    className="w-full h-9 px-3 rounded-lg bg-[#04181E] border border-[#16C7A1]/30 text-xs font-mono text-[#F5FAFA] focus:outline-none focus:border-[#16C7A1]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#9BC9CE] uppercase tracking-wider block mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newVarDesc}
                    onChange={(e) => setNewVarDesc(e.target.value)}
                    placeholder="e.g. Secret API key for Stripe payment processing"
                    className="w-full h-9 px-3 rounded-lg bg-[#04181E] border border-[#16C7A1]/30 text-xs text-[#F5FAFA] focus:outline-none focus:border-[#16C7A1]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-[#9BC9CE] uppercase tracking-wider block mb-1">
                      Category
                    </label>
                    <select
                      value={newVarCategory}
                      onChange={(e) => setNewVarCategory(e.target.value as any)}
                      className="w-full h-9 px-2.5 rounded-lg bg-[#04181E] border border-[#16C7A1]/30 text-xs font-bold text-[#F5FAFA] focus:outline-none focus:border-[#16C7A1]"
                    >
                      <option value="General">General</option>
                      <option value="Security">Security</option>
                      <option value="External API">External API</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#9BC9CE] uppercase tracking-wider block mb-1">
                      Risk Level
                    </label>
                    <select
                      value={newVarCriticality}
                      onChange={(e) => setNewVarCriticality(e.target.value as any)}
                      className="w-full h-9 px-2.5 rounded-lg bg-[#04181E] border border-[#16C7A1]/30 text-xs font-bold text-[#F5FAFA] focus:outline-none focus:border-[#16C7A1]"
                    >
                      <option value="LOW">Normal (Low Risk)</option>
                      <option value="HIGH">HIGH RISK</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#04181E] border border-[#16C7A1]/20 text-xs font-bold text-[#9BC9CE] hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[#FF3344] hover:bg-[#e02636] text-white text-xs font-bold shadow-md transition cursor-pointer"
                  >
                    Save Variable
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
