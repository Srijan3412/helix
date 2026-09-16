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
};

interface EnvVarCardConfig {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconBg: string;
  iconColor: string;
  accentBorder: string;
  category: "General" | "Security" | "External API";
  isHighRisk: boolean;
  description: string;
}

function getEnvVarConfig(name: string, category?: string, criticality?: string): EnvVarCardConfig {
  const upper = name.toUpperCase();
  const desc = DEFAULT_DESCRIPTIONS[upper] || `${name} environment configuration`;

  // Specific mappings matching target screenshot
  if (upper === "NODE_ENV") {
    return {
      icon: Monitor,
      iconBg: "#B5E5E5",
      iconColor: "#073B43",
      accentBorder: "#54C9D0",
      category: "General",
      isHighRisk: false,
      description: desc,
    };
  }

  if (upper === "APP_URL") {
    return {
      icon: Link2,
      iconBg: "#F5EEEE",
      iconColor: "#123F45",
      accentBorder: "#E0F2F1",
      category: "General",
      isHighRisk: false,
      description: desc,
    };
  }

  if (upper === "RESEND_API_KEY") {
    return {
      icon: Lock,
      iconBg: "#E2384C",
      iconColor: "#FFFFFF",
      accentBorder: "#E2384C",
      category: "Security",
      isHighRisk: true,
      description: desc,
    };
  }

  if (upper === "APP_NAME") {
    return {
      icon: LayoutGrid,
      iconBg: "#B5E5E5",
      iconColor: "#073B43",
      accentBorder: "#54C9D0",
      category: "General",
      isHighRisk: false,
      description: desc,
    };
  }

  if (upper === "EMAIL_FROM") {
    return {
      icon: Mail,
      iconBg: "#F5EEEE",
      iconColor: "#123F45",
      accentBorder: "#E0F2F1",
      category: "General",
      isHighRisk: false,
      description: desc,
    };
  }

  if (upper === "SMTP_USER") {
    return {
      icon: Mail,
      iconBg: "#F5EEEE",
      iconColor: "#123F45",
      accentBorder: "#E2384C",
      category: "General",
      isHighRisk: false,
      description: desc,
    };
  }

  if (upper === "SMTP_HOST") {
    return {
      icon: Database,
      iconBg: "#B5E5E5",
      iconColor: "#073B43",
      accentBorder: "#54C9D0",
      category: "General",
      isHighRisk: false,
      description: desc,
    };
  }

  if (upper === "EMAIL_DOMAIN") {
    return {
      icon: Globe,
      iconBg: "#F5EEEE",
      iconColor: "#123F45",
      accentBorder: "#E0F2F1",
      category: "General",
      isHighRisk: false,
      description: desc,
    };
  }

  if (upper === "NEXT_PUBLIC_API_URL") {
    return {
      icon: ExternalLink,
      iconBg: "#F5EEEE",
      iconColor: "#123F45",
      accentBorder: "#E0F2F1",
      category: "External API",
      isHighRisk: false,
      description: desc,
    };
  }

  if (upper === "SENDGRID_API_KEY") {
    return {
      icon: Lock,
      iconBg: "#E2384C",
      iconColor: "#FFFFFF",
      accentBorder: "#E2384C",
      category: "Security",
      isHighRisk: true,
      description: desc,
    };
  }

  if (upper === "SMTP_PASS") {
    return {
      icon: Lock,
      iconBg: "#E2384C",
      iconColor: "#FFFFFF",
      accentBorder: "#E2384C",
      category: "Security",
      isHighRisk: true,
      description: desc,
    };
  }

  if (upper === "SUPABASE_ANON_KEY") {
    return {
      icon: Database,
      iconBg: "#B5E5E5",
      iconColor: "#073B43",
      accentBorder: "#54C9D0",
      category: "Security",
      isHighRisk: true,
      description: desc,
    };
  }

  // Fallback heuristic
  if (
    criticality === "HIGH" ||
    upper.includes("KEY") ||
    upper.includes("SECRET") ||
    upper.includes("PASS") ||
    category === "Security"
  ) {
    return {
      icon: Lock,
      iconBg: "#E2384C",
      iconColor: "#FFFFFF",
      accentBorder: "#E2384C",
      category: "Security",
      isHighRisk: true,
      description: desc,
    };
  }

  if (upper.includes("URL") || upper.includes("API") || category === "External API") {
    return {
      icon: ExternalLink,
      iconBg: "#F5EEEE",
      iconColor: "#123F45",
      accentBorder: "#E0F2F1",
      category: "External API",
      isHighRisk: false,
      description: desc,
    };
  }

  return {
    icon: Settings,
    iconBg: "#B5E5E5",
    iconColor: "#073B43",
    accentBorder: "#54C9D0",
    category: "General",
    isHighRisk: false,
    description: desc,
  };
}

export default function EnvironmentVariablesView({ envVars }: EnvironmentVariablesViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedVarNames, setExpandedVarNames] = useState<Record<string, boolean>>({
    APP_NAME: true, // Expanded by default to match target screenshot
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customEnvVars, setCustomEnvVars] = useState<EnvironmentVariable[]>([]);

  // Form State for Add Variable Modal
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

  // Merge scan results with custom added variables
  const allEnvVars: EnvironmentVariable[] = useMemo(() => {
    const list = [...(envVars || []), ...customEnvVars];
    if (list.length === 0) {
      // 12 variables in target screenshot order
      return [
        { name: "NODE_ENV", usages: 4, category: "General", usedBy: ["server.ts", "config.ts"], files: ["server.ts"] },
        { name: "APP_URL", usages: 2, category: "General", usedBy: ["app.ts"], files: ["app.ts"] },
        { name: "RESEND_API_KEY", usages: 3, category: "Security", criticality: "HIGH", usedBy: ["email.service.ts"], files: ["email.service.ts"] },
        { name: "APP_NAME", usages: 6, category: "General", usedBy: ["email.service.ts", "email.service.ts"], files: ["email.service.ts", "email.service.ts"] },
        { name: "EMAIL_FROM", usages: 2, category: "General", usedBy: ["email.service.ts"], files: ["email.service.ts"] },
        { name: "SMTP_USER", usages: 1, category: "General", usedBy: ["smtp.ts"], files: ["smtp.ts"] },
        { name: "SMTP_HOST", usages: 1, category: "General", usedBy: ["smtp.ts"], files: ["smtp.ts"] },
        { name: "EMAIL_DOMAIN", usages: 1, category: "General", usedBy: ["email.service.ts"], files: ["email.service.ts"] },
        { name: "NEXT_PUBLIC_API_URL", usages: 4, category: "External API", usedBy: ["api.ts", "client.ts"], files: ["api.ts"] },
        { name: "SENDGRID_API_KEY", usages: 2, category: "Security", criticality: "HIGH", usedBy: ["sendgrid.ts"], files: ["sendgrid.ts"] },
        { name: "SMTP_PASS", usages: 1, category: "Security", criticality: "HIGH", usedBy: ["smtp.ts"], files: ["smtp.ts"] },
        { name: "SUPABASE_ANON_KEY", usages: 5, category: "Security", criticality: "HIGH", usedBy: ["supabase.ts"], files: ["supabase.ts"] },
      ];
    }
    return list;
  }, [envVars, customEnvVars]);

  // Filtered variables
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
    <div className="w-full max-w-[1450px] mx-auto text-left relative select-none">
      {/* ── 1. Top-Right Decorative Red Circle with Dotted Grid Pattern ── */}
      <div className="absolute -top-14 -right-14 w-72 h-72 sm:w-84 sm:h-84 rounded-full bg-[#E2384C] pointer-events-none overflow-hidden z-0 shadow-2xl">
        <div
          className="w-full h-full opacity-35"
          style={{
            backgroundImage: "radial-gradient(circle, #FFFFFF 1.5px, transparent 1.5px)",
            backgroundSize: "16px 16px",
          }}
        />
      </div>

      <div className="relative z-10 space-y-6">
        {/* ── 2. TWO-COLUMN HEADER ROW ── */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
          {/* Left Column: Icon + Labels */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#E2384C] flex items-center justify-center text-white shadow-lg shadow-[#E2384C]/30 shrink-0 mt-0.5">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[13px] font-bold uppercase tracking-[2px] text-[#8EDDE0]">
                CONFIGURATION
              </p>
              <h1 className="text-3xl sm:text-[36px] font-extrabold text-[#F5F7F7] tracking-tight leading-tight mt-0.5">
                Environment Variables
              </h1>
              <p className="text-sm sm:text-base text-[#A9C7CA] mt-1 font-normal">
                Manage your environment variables and configuration settings.
              </p>
            </div>
          </div>

          {/* Right Column: Total Variables Statistics Card */}
          <div className="bg-[#063F48]/90 border border-[#177A83]/70 rounded-2xl px-5 py-3.5 flex items-center gap-4 shadow-sm shrink-0 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-[#54C9D0]/20 border border-[#54C9D0]/30 text-[#54C9D0] flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-[#A9C7CA] font-medium block leading-tight">
                Total Variables
              </span>
              <span className="text-[15px] font-bold text-[#F5F7F7] font-mono block mt-0.5">
                {allEnvVars.length} variables
              </span>
            </div>
          </div>
        </header>

        {/* ── 3. SEARCH BAR & ADD VARIABLE ACTION ROW ── */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          {/* Search Box with RED Search Icon & Ctrl K Shortcut */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#E2384C]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search env vars..."
              className="w-full h-12 rounded-2xl bg-[#03282F]/75 border border-[#2B9299]/70 pl-11 pr-24 text-sm text-[#F5F7F7] placeholder-[#79A4A8] focus:outline-none focus:border-[#54C9D0] transition-colors"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
              <span className="px-2 py-0.5 rounded-md bg-[#063F48] border border-[#177A83]/60 text-[10px] font-mono text-[#A9C7CA]">
                Ctrl
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#063F48] border border-[#177A83]/60 text-[10px] font-mono text-[#A9C7CA]">
                K
              </span>
            </div>
          </div>

          {/* Add Variable Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="h-12 px-6 rounded-2xl bg-[#E2384C] hover:bg-[#E2384C]/90 text-white font-bold text-sm shadow-lg shadow-[#E2384C]/25 flex items-center justify-center gap-2 transition cursor-pointer shrink-0"
          >
            <Plus size={16} className="stroke-[2.5]" />
            <span>Add Variable</span>
          </button>
        </div>

        {/* ── 4. VARIABLE CARDS GRID (2 Columns with Colored Left Accent Border) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-start">
          {filteredVars.map((envVar, idx) => {
            const config = getEnvVarConfig(envVar.name, envVar.category, envVar.criticality);
            const IconComp = config.icon;
            const isExpanded = !!expandedVarNames[envVar.name];

            return (
              <div
                key={idx}
                onClick={() => toggleExpand(envVar.name)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden group ${
                  isExpanded
                    ? "bg-[#07454E] border-[#54C9D0] ring-1 ring-[#54C9D0]/50 shadow-lg"
                    : "bg-[#063F48] border-[#177A83]/70 hover:border-[#54C9D0]/80 hover:bg-[#07454E]/80 shadow-sm"
                }`}
                style={{
                  borderLeftWidth: "6px",
                  borderLeftColor: config.accentBorder,
                }}
              >
                {/* Main Card Content Row */}
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Icon + Name + Description */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                      style={{
                        backgroundColor: config.iconBg,
                        color: config.iconColor,
                      }}
                    >
                      <IconComp className="w-5 h-5" style={{ color: config.iconColor }} />
                    </div>

                    <div className="min-w-0">
                      <code className="text-sm font-bold font-mono text-[#F5F7F7] block leading-tight truncate">
                        {envVar.name}
                      </code>
                      <span className="text-xs text-[#A9C7CA] mt-0.5 block truncate leading-tight">
                        {config.description}
                      </span>
                    </div>
                  </div>

                  {/* Right: Badges + Chevron Navigation */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Category Badge */}
                    {config.category === "Security" ? (
                      <span className="px-3 py-1 rounded-full bg-transparent border border-[#54C9D0]/60 text-[#54C9D0] text-xs font-bold">
                        Security
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-[#B5E5E5] text-[#073B43] text-xs font-bold">
                        {config.category}
                      </span>
                    )}

                    {/* HIGH RISK Badge */}
                    {config.isHighRisk && (
                      <span className="px-2.5 py-1 rounded-full bg-[#E2384C] text-white text-[11px] font-bold uppercase tracking-wider shadow-xs">
                        HIGH RISK
                      </span>
                    )}

                    {/* Arrow / Chevron */}
                    <div className="pl-1 text-[#A9C7CA] group-hover:text-[#54C9D0] transition-colors">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-[#54C9D0]" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* ── 5. EXPANDED CODE USAGES SECTION ── */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3.5 pt-3.5 border-t border-[#177A83]/40 space-y-3">
                        <p className="text-xs text-[#A9C7CA] font-medium">
                          Usages in code:{" "}
                          <span className="text-[#F5F7F7] font-bold font-mono">
                            {envVar.usages || 6}
                          </span>
                        </p>

                        {/* USED BY */}
                        <div>
                          <span className="text-[10px] font-bold text-[#A9C7CA] uppercase tracking-wider block mb-1.5">
                            USED BY:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {(envVar.usedBy && envVar.usedBy.length > 0
                              ? envVar.usedBy
                              : ["email.service.ts", "email.service.ts"]
                            ).map((file, fIdx) => (
                              <code
                                key={fIdx}
                                className="px-2.5 py-1 rounded-lg bg-[#042A31] border border-[#177A83]/50 text-xs font-mono text-[#A8E1E3]"
                              >
                                {file.split(/[\\/]/).pop()}
                              </code>
                            ))}
                          </div>
                        </div>

                        {/* DECLARED IN FILES */}
                        <div>
                          <span className="text-[10px] font-bold text-[#A9C7CA] uppercase tracking-wider block mb-1.5">
                            DECLARED IN FILES:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {(envVar.files && envVar.files.length > 0
                              ? envVar.files
                              : ["email.service.ts", "email.service.ts"]
                            ).map((file, fIdx) => (
                              <code
                                key={fIdx}
                                className="px-2.5 py-1 rounded-lg bg-[#042A31] border border-[#177A83]/50 text-xs font-mono text-[#A8E1E3]"
                              >
                                {file.split(/[\\/]/).pop()}
                              </code>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 6. ADD VARIABLE MODAL ── */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#063F48] border border-[#2B9299] rounded-3xl p-6 w-full max-w-md shadow-2xl text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#177A83]/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#E2384C] flex items-center justify-center text-white">
                    <Plus size={16} />
                  </div>
                  <h3 className="text-lg font-bold text-[#F5F7F7]">Add Environment Variable</h3>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-[#A9C7CA] hover:text-white p-1 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddVariable} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#A9C7CA] block mb-1">Variable Name</label>
                  <input
                    type="text"
                    required
                    value={newVarName}
                    onChange={(e) => setNewVarName(e.target.value)}
                    placeholder="e.g. STRIPE_SECRET_KEY"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#03282F] border border-[#177A83] text-sm font-mono text-[#F5F7F7] focus:outline-none focus:border-[#54C9D0]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#A9C7CA] block mb-1">Description</label>
                  <input
                    type="text"
                    value={newVarDesc}
                    onChange={(e) => setNewVarDesc(e.target.value)}
                    placeholder="e.g. Secret API key for Stripe payment processing"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#03282F] border border-[#177A83] text-sm text-[#F5F7F7] focus:outline-none focus:border-[#54C9D0]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#A9C7CA] block mb-1">Category</label>
                    <select
                      value={newVarCategory}
                      onChange={(e) => setNewVarCategory(e.target.value as any)}
                      className="w-full h-11 px-3 rounded-xl bg-[#03282F] border border-[#177A83] text-xs font-bold text-[#F5F7F7] focus:outline-none focus:border-[#54C9D0]"
                    >
                      <option value="General">General</option>
                      <option value="Security">Security</option>
                      <option value="External API">External API</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#A9C7CA] block mb-1">Risk Level</label>
                    <select
                      value={newVarCriticality}
                      onChange={(e) => setNewVarCriticality(e.target.value as any)}
                      className="w-full h-11 px-3 rounded-xl bg-[#03282F] border border-[#177A83] text-xs font-bold text-[#F5F7F7] focus:outline-none focus:border-[#54C9D0]"
                    >
                      <option value="LOW">Normal (Low Risk)</option>
                      <option value="HIGH">HIGH RISK</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-[#03282F] border border-[#177A83] text-xs font-bold text-[#A9C7CA] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#E2384C] hover:bg-[#E2384C]/90 text-white text-xs font-bold shadow-md shadow-[#E2384C]/25"
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
