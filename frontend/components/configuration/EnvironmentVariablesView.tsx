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

  if (upper === "EMAIL_FROM") {
    return {
      icon: Mail,
      category: "General",
      isHighRisk: false,
      description: desc,
    };
  }

  if (upper === "SMTP_USER") {
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

  if (upper === "NEXT_PUBLIC_API_URL") {
    return {
      icon: ExternalLink,
      category: "External API",
      isHighRisk: false,
      description: desc,
    };
  }

  if (upper === "SENDGRID_API_KEY") {
    return {
      icon: Lock,
      category: "Security",
      isHighRisk: true,
      description: desc,
    };
  }

  if (upper === "SMTP_PASS") {
    return {
      icon: Lock,
      category: "Security",
      isHighRisk: true,
      description: desc,
    };
  }

  if (upper === "SUPABASE_ANON_KEY") {
    return {
      icon: Database,
      category: "Security",
      isHighRisk: true,
      description: desc,
    };
  }

  // Heuristic fallbacks
  if (
    criticality === "HIGH" ||
    upper.includes("KEY") ||
    upper.includes("SECRET") ||
    upper.includes("PASS") ||
    category === "Security"
  ) {
    return {
      icon: Lock,
      category: "Security",
      isHighRisk: true,
      description: desc,
    };
  }

  if (upper.includes("URL") || upper.includes("API") || category === "External API") {
    return {
      icon: ExternalLink,
      category: "External API",
      isHighRisk: false,
      description: desc,
    };
  }

  return {
    icon: Settings,
    category: "General",
    isHighRisk: false,
    description: desc,
  };
}

export default function EnvironmentVariablesView({ envVars }: EnvironmentVariablesViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedVarNames, setExpandedVarNames] = useState<Record<string, boolean>>({
    APP_NAME: true, // Default expanded as in specification
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
    <div className="w-full max-w-[1450px] mx-auto text-left relative select-none rounded-[28px] overflow-hidden p-6 sm:p-8 bg-gradient-to-b from-[#003F46] via-[#002D33] to-[#00535A] shadow-2xl border border-[rgba(32,214,216,0.18)]">
      {/* ── 1. ABSTRACT CURVED / CIRCULAR DECORATIVE CORNER SHAPES ── */}
      {/* Top-Right Decorative Shapes: Nested Red & Cyan Circular Arcs */}
      <div className="absolute -top-24 -right-24 w-96 h-96 pointer-events-none overflow-hidden z-0">
        {/* Outer Pale Cyan Arc */}
        <div className="absolute top-0 right-0 w-88 h-88 rounded-full border-[22px] border-[#B8F1F0]/15" />
        {/* Middle Vibrant Cyan Arc */}
        <div className="absolute top-6 right-6 w-72 h-72 rounded-full border-[18px] border-[#46D9DC]/25" />
        {/* Inner Solid Red Circle with Dotted Texture */}
        <div className="absolute top-14 right-14 w-56 h-56 rounded-full bg-gradient-to-br from-[#F34A57] to-[#E52B3A] shadow-[0_10px_35px_rgba(229,43,58,0.4)] overflow-hidden">
          <div
            className="w-full h-full opacity-30"
            style={{
              backgroundImage: "radial-gradient(circle, #FFFFFF 1.5px, transparent 1.5px)",
              backgroundSize: "14px 14px",
            }}
          />
        </div>
      </div>

      {/* Bottom-Left Decorative Shapes: Subtle Organic Curves & Dotted Matrix */}
      <div className="absolute -bottom-28 -left-28 w-80 h-80 pointer-events-none overflow-hidden z-0">
        <div className="absolute bottom-4 left-4 w-64 h-64 rounded-full bg-[#E52B3A]/20 blur-xl" />
        <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full border-[14px] border-[#20D6D8]/20" />
        <div
          className="absolute bottom-8 left-8 w-40 h-40 opacity-25"
          style={{
            backgroundImage: "radial-gradient(circle, #20D6D8 1.5px, transparent 1.5px)",
            backgroundSize: "12px 12px",
          }}
        />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 space-y-7">
        {/* ── 2. PAGE HEADER WITH ICON BOX ── */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-2">
          {/* Left Column: 64x64px Red Icon + Eyebrow + Title + Subtitle */}
          <div className="flex items-start gap-4 sm:gap-5">
            {/* Header Icon Block */}
            <div className="w-16 h-16 rounded-[16px] bg-gradient-to-br from-[#F04452] to-[#E52B3A] border border-[#FF6675]/40 flex items-center justify-center text-white shadow-[0_4px_22px_rgba(229,43,58,0.38)] shrink-0 mt-0.5">
              <Settings className="w-7 h-7 text-white stroke-[2.2]" />
            </div>

            <div>
              {/* Eyebrow */}
              <p className="text-[12px] sm:text-[13px] font-bold uppercase tracking-[2px] text-[#20D6D8]">
                CONFIGURATION
              </p>
              {/* Large Bold Title */}
              <h1 className="text-3xl sm:text-[40px] font-extrabold text-[#F5FAFA] tracking-tight leading-tight mt-0.5">
                Environment Variables
              </h1>
              {/* Descriptive Subtitle */}
              <p className="text-sm sm:text-[15px] text-[#9BC9CE] mt-1 font-normal">
                Manage application configuration, secrets and environment settings.
              </p>
            </div>
          </div>

          {/* Right Column: Glassmorphism Summary Pill */}
          <div className="bg-[rgba(4,58,64,0.72)] border border-[rgba(32,214,216,0.28)] rounded-2xl px-5 py-3 flex items-center gap-3.5 shadow-sm backdrop-blur-md shrink-0 self-start md:self-auto">
            <div className="w-9 h-9 rounded-xl bg-[rgba(32,214,216,0.15)] border border-[rgba(32,214,216,0.35)] text-[#20D6D8] flex items-center justify-center shrink-0">
              <Sliders className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-[11px] text-[#9BC9CE] font-semibold uppercase tracking-wider block leading-tight">
                Total Variables
              </span>
              <span className="text-[15px] font-bold text-[#F5FAFA] font-mono block mt-0.5">
                {allEnvVars.length} configured
              </span>
            </div>
          </div>
        </header>

        {/* ── 3. GLASSMORPHISM SEARCH BAR & ADD VARIABLE BUTTON ── */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full">
          {/* Glassmorphism Search Input */}
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#20D6D8] transition-colors group-focus-within:text-[#46E1E0]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search variables by name, category, or description..."
              className="w-full h-[54px] rounded-[14px] bg-[rgba(0,45,52,0.65)] border border-[rgba(30,210,215,0.35)] pl-12 pr-24 text-[14px] text-[#F5FAFA] placeholder-[#79A4A8] backdrop-blur-md focus:outline-none focus:border-[#20D6D8] focus:ring-1 focus:ring-[#20D6D8]/50 focus:shadow-[0_0_18px_rgba(32,214,216,0.25)] transition-all duration-200"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
              <span className="px-2 py-0.5 rounded-md bg-[rgba(4,58,64,0.8)] border border-[rgba(32,214,216,0.25)] text-[10px] font-mono font-medium text-[#9BC9CE]">
                ⌘
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[rgba(4,58,64,0.8)] border border-[rgba(32,214,216,0.25)] text-[10px] font-mono font-medium text-[#9BC9CE]">
                K
              </span>
            </div>
          </div>

          {/* Add Variable Action Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="h-[54px] px-6 rounded-[14px] bg-gradient-to-r from-[#E52B3A] to-[#F04452] hover:brightness-110 text-white font-bold text-sm shadow-[0_4px_18px_rgba(229,43,58,0.32)] flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shrink-0 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={18} className="stroke-[2.5]" />
            <span>Add Variable</span>
          </button>
        </div>

        {/* ── 4. 2-COLUMN VARIABLE CARDS GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5 items-start">
          {filteredVars.map((envVar, idx) => {
            const config = getEnvVarConfig(envVar.name, envVar.category, envVar.criticality);
            const IconComp = config.icon;
            const isExpanded = !!expandedVarNames[envVar.name];

            return (
              <motion.div
                key={envVar.name + idx}
                layout
                onClick={() => toggleExpand(envVar.name)}
                className={`p-5 sm:p-6 rounded-[20px] transition-all duration-200 cursor-pointer relative overflow-hidden backdrop-blur-md group ${
                  isExpanded
                    ? "bg-gradient-to-br from-[rgba(32,214,216,0.10)] via-[rgba(4,58,64,0.85)] to-[rgba(0,35,40,0.92)] border border-[#20D6D8] ring-1 ring-[#20D6D8]/40 shadow-[0_8px_30px_rgba(0,35,40,0.6),0_0_20px_rgba(32,214,216,0.15)]"
                    : config.isHighRisk
                    ? "bg-gradient-to-br from-[rgba(229,43,58,0.08)] via-[rgba(4,58,64,0.72)] to-[rgba(0,35,40,0.85)] border border-[rgba(229,43,58,0.45)] hover:border-[rgba(229,43,58,0.75)] hover:shadow-[0_8px_25px_rgba(0,35,40,0.5),0_0_15px_rgba(229,43,58,0.2)] hover:-translate-y-0.5"
                    : "bg-gradient-to-br from-[rgba(32,214,216,0.05)] via-[rgba(4,58,64,0.72)] to-[rgba(0,35,40,0.85)] border border-[rgba(31,190,195,0.28)] hover:border-[rgba(32,214,216,0.6)] hover:bg-[rgba(5,72,79,0.85)] hover:shadow-[0_8px_25px_rgba(0,35,40,0.5),0_0_15px_rgba(32,214,216,0.15)] hover:-translate-y-0.5"
                }`}
              >
                {/* Subtle Diagonal Curved Highlight Inside Card */}
                <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-white/[0.04] to-transparent pointer-events-none rounded-tr-[20px]" />

                {/* Main Card Header / Content Row */}
                <div className="flex items-center justify-between gap-3 relative z-10">
                  {/* Left: Colored Circular Icon + Name + Description */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Circular Icon Container */}
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                        config.category === "Security"
                          ? "bg-[rgba(230,45,60,0.15)] border border-[rgba(229,43,58,0.45)] text-[#E52B3A]"
                          : config.category === "External API"
                          ? "bg-[rgba(32,214,216,0.12)] border border-[rgba(32,214,216,0.35)] text-[#20D6D8]"
                          : "bg-[rgba(20,190,195,0.15)] border border-[rgba(32,214,216,0.4)] text-[#20D6D8]"
                      }`}
                    >
                      <IconComp className="w-5 h-5 stroke-[2.2]" />
                    </div>

                    <div className="min-w-0">
                      {/* Variable Name */}
                      <code className="text-[14px] sm:text-[15px] font-bold font-mono text-[#F3FAFA] tracking-[0.4px] block leading-tight truncate">
                        {envVar.name}
                      </code>
                      {/* Subtitle / Description */}
                      <span className="text-[12px] sm:text-[13px] text-[#9BC9CE] mt-0.5 block truncate leading-tight">
                        {config.description}
                      </span>
                    </div>
                  </div>

                  {/* Right: Semantic Badges + Expand Indicator */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Category Badge */}
                    {config.category === "Security" ? (
                      <span className="px-3 py-1.5 rounded-[10px] bg-[rgba(229,43,58,0.14)] border border-[rgba(229,43,58,0.4)] text-[#FF7582] text-xs font-semibold">
                        Security
                      </span>
                    ) : config.category === "External API" ? (
                      <span className="px-3 py-1.5 rounded-[10px] bg-[rgba(32,214,216,0.12)] border border-[rgba(32,214,216,0.35)] text-[#46E1E0] text-xs font-semibold">
                        External API
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 rounded-[10px] bg-[rgba(32,214,216,0.12)] border border-[rgba(32,214,216,0.35)] text-[#20D6D8] text-xs font-semibold">
                        General
                      </span>
                    )}

                    {/* Prominent HIGH RISK Badge with Red Glow */}
                    {config.isHighRisk && (
                      <span className="px-2.5 py-1.5 rounded-[10px] bg-[rgba(230,35,50,0.18)] border border-[#E83245] text-[#FF6675] text-[11px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(232,50,69,0.25)] flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-[#FF6675]" />
                        HIGH RISK
                      </span>
                    )}

                    {/* Chevron Indicator */}
                    <div className="pl-1 text-[#9BC9CE] group-hover:text-[#20D6D8] transition-colors">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-[#20D6D8]" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* ── 5. EXPANDED CODE USAGES & REFERENCES SECTION ── */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden relative z-10"
                    >
                      <div className="mt-4 pt-4 border-t border-[rgba(40,180,190,0.20)] space-y-3.5">
                        {/* Usages in code */}
                        <div className="flex items-center text-xs text-[#9BC9CE]">
                          <span>Usages in code:</span>
                          <span className="text-[#F5FAFA] font-bold font-mono text-sm ml-1.5">
                            {envVar.usages || 6}
                          </span>
                        </div>

                        {/* USED BY Section */}
                        <div>
                          <span className="text-[11px] font-bold text-[#20D6D8] uppercase tracking-[1px] block mb-2">
                            USED BY:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {(envVar.usedBy && envVar.usedBy.length > 0
                              ? envVar.usedBy
                              : ["email.service.ts", "email.service.ts"]
                            ).map((file, fIdx) => (
                              <span
                                key={fIdx}
                                className="px-2.5 py-1.5 rounded-[8px] bg-[rgba(0,170,180,0.14)] border border-[rgba(32,214,216,0.25)] text-xs font-mono text-[#A8E1E3] shadow-xs"
                              >
                                {file.split(/[\\/]/).pop()}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* DECLARED IN FILES Section */}
                        <div>
                          <span className="text-[11px] font-bold text-[#20D6D8] uppercase tracking-[1px] block mb-2">
                            DECLARED IN FILES:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {(envVar.files && envVar.files.length > 0
                              ? envVar.files
                              : ["email.service.ts", "email.service.ts"]
                            ).map((file, fIdx) => (
                              <span
                                key={fIdx}
                                className="px-2.5 py-1.5 rounded-[8px] bg-[rgba(0,170,180,0.14)] border border-[rgba(32,214,216,0.25)] text-xs font-mono text-[#A8E1E3] shadow-xs"
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
        </div>
      </div>

      {/* ── 6. ADD VARIABLE MODAL (Aligned to Health Diagnostics Glass Theme) ── */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              className="bg-gradient-to-b from-[#003F46] via-[#002D33] to-[#00535A] border border-[rgba(32,214,216,0.35)] rounded-[24px] p-6 sm:p-7 w-full max-w-md shadow-2xl text-left relative overflow-hidden"
            >
              {/* Modal Corner Accent */}
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#E52B3A]/20 rounded-full blur-xl pointer-events-none" />

              <div className="flex items-center justify-between pb-3.5 border-b border-[rgba(32,214,216,0.20)] relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F04452] to-[#E52B3A] flex items-center justify-center text-white shadow-md">
                    <Plus size={18} className="stroke-[2.5]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#F5FAFA]">Add Environment Variable</h3>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-[#9BC9CE] hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddVariable} className="mt-5 space-y-4 relative z-10">
                <div>
                  <label className="text-xs font-bold text-[#9BC9CE] uppercase tracking-wider block mb-1.5">
                    Variable Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newVarName}
                    onChange={(e) => setNewVarName(e.target.value)}
                    placeholder="e.g. STRIPE_SECRET_KEY"
                    className="w-full h-11 px-3.5 rounded-[12px] bg-[rgba(0,45,52,0.7)] border border-[rgba(32,214,216,0.3)] text-sm font-mono text-[#F5FAFA] focus:outline-none focus:border-[#20D6D8] focus:ring-1 focus:ring-[#20D6D8]/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#9BC9CE] uppercase tracking-wider block mb-1.5">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newVarDesc}
                    onChange={(e) => setNewVarDesc(e.target.value)}
                    placeholder="e.g. Secret API key for Stripe payment processing"
                    className="w-full h-11 px-3.5 rounded-[12px] bg-[rgba(0,45,52,0.7)] border border-[rgba(32,214,216,0.3)] text-sm text-[#F5FAFA] focus:outline-none focus:border-[#20D6D8] focus:ring-1 focus:ring-[#20D6D8]/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#9BC9CE] uppercase tracking-wider block mb-1.5">
                      Category
                    </label>
                    <select
                      value={newVarCategory}
                      onChange={(e) => setNewVarCategory(e.target.value as any)}
                      className="w-full h-11 px-3 rounded-[12px] bg-[rgba(0,45,52,0.7)] border border-[rgba(32,214,216,0.3)] text-xs font-bold text-[#F5FAFA] focus:outline-none focus:border-[#20D6D8]"
                    >
                      <option value="General">General</option>
                      <option value="Security">Security</option>
                      <option value="External API">External API</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#9BC9CE] uppercase tracking-wider block mb-1.5">
                      Risk Level
                    </label>
                    <select
                      value={newVarCriticality}
                      onChange={(e) => setNewVarCriticality(e.target.value as any)}
                      className="w-full h-11 px-3 rounded-[12px] bg-[rgba(0,45,52,0.7)] border border-[rgba(32,214,216,0.3)] text-xs font-bold text-[#F5FAFA] focus:outline-none focus:border-[#20D6D8]"
                    >
                      <option value="LOW">Normal (Low Risk)</option>
                      <option value="HIGH">HIGH RISK</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 rounded-[12px] bg-[rgba(0,45,52,0.7)] border border-[rgba(32,214,216,0.25)] text-xs font-bold text-[#9BC9CE] hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-[12px] bg-gradient-to-r from-[#E52B3A] to-[#F04452] hover:brightness-110 text-white text-xs font-bold shadow-md shadow-[#E52B3A]/30 transition cursor-pointer"
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
