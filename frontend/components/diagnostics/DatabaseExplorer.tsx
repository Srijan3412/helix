"use client";

import React, { useState, useMemo } from "react";
import {
  Database,
  Search,
  Boxes,
  Network,
  Link2,
  Layers,
  Table as TableIcon,
  Play,
  Activity,
  Code2,
  Calendar,
} from "lucide-react";

interface EntityField {
  name: string;
  type: string;
  nullable: boolean;
  defaultVal?: string;
  description?: string;
}

interface EntityData {
  entity: string;
  operations?: string[];
  fields?: EntityField[];
  columns?: EntityField[];
}

interface DatabaseInfo {
  orm?: string;
  type?: string;
  entities?: EntityData[];
  flows?: Array<{ route?: string; method?: string; query?: string }>;
}

interface DatabaseExplorerProps {
  databaseInfo?: DatabaseInfo;
  files?: Array<{ path: string }>;
  dependencies?: Array<{ source: string; target: string }>;
  envVars?: Array<{ name: string; value?: string }>;
  onAnalyze?: () => void;
}

function inferFieldsForEntity(entityName: string): EntityField[] {
  const lower = entityName.toLowerCase();
  if (lower.includes("user") || lower.includes("account") || lower.includes("auth")) {
    return [
      { name: "id", type: "UUID / VARCHAR", nullable: false, defaultVal: "gen_random_uuid()", description: "Primary unique identifier" },
      { name: "email", type: "VARCHAR(255)", nullable: false, defaultVal: "—", description: "Account email address" },
      { name: "role", type: "VARCHAR(50)", nullable: false, defaultVal: "'user'", description: "Access level / RBAC role" },
      { name: "created_at", type: "TIMESTAMP", nullable: false, defaultVal: "now()", description: "Record creation timestamp" },
      { name: "updated_at", type: "TIMESTAMP", nullable: true, defaultVal: "now()", description: "Last modification time" },
    ];
  }

  if (lower.includes("scan") || lower.includes("job") || lower.includes("task") || lower.includes("analysis")) {
    return [
      { name: "id", type: "UUID", nullable: false, defaultVal: "—", description: "Scan / Job identifier" },
      { name: "user_id", type: "UUID", nullable: false, defaultVal: "—", description: "Foreign key to users table" },
      { name: "status", type: "VARCHAR(50)", nullable: false, defaultVal: "'pending'", description: "Execution status" },
      { name: "metrics", type: "JSONB", nullable: true, defaultVal: "'{}'::jsonb", description: "Analyzed architectural metadata" },
      { name: "created_at", type: "TIMESTAMP", nullable: false, defaultVal: "now()", description: "Creation timestamp" },
    ];
  }

  return [
    { name: "id", type: "UUID / INT", nullable: false, defaultVal: "PRIMARY KEY", description: "Unique entity identifier" },
    { name: "name", type: "VARCHAR(255)", nullable: false, defaultVal: "—", description: "Entity name or identifier" },
    { name: "status", type: "VARCHAR(50)", nullable: true, defaultVal: "'active'", description: "Entity state" },
    { name: "metadata", type: "JSONB / TEXT", nullable: true, defaultVal: "'{}'", description: "Attribute payload" },
    { name: "created_at", type: "TIMESTAMP", nullable: false, defaultVal: "now()", description: "Creation timestamp" },
  ];
}

export default function DatabaseExplorer({
  databaseInfo,
  files = [],
  dependencies = [],
  envVars = [],
  onAnalyze,
}: DatabaseExplorerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"Columns" | "Relationships" | "Indexes">("Columns");

  // Dynamically detect ORM & DB from repository files / env vars / dependencies
  const detectedOrm = useMemo(() => {
    if (databaseInfo?.orm && databaseInfo.orm !== "Unknown") return databaseInfo.orm;
    const depStr = dependencies.map((d) => d.target.toLowerCase()).join(" ");
    const fileStr = files.map((f) => f.path.toLowerCase()).join(" ");
    if (depStr.includes("drizzle") || fileStr.includes("drizzle")) return "Drizzle";
    if (depStr.includes("prisma") || fileStr.includes("prisma")) return "Prisma";
    if (depStr.includes("typeorm") || fileStr.includes("typeorm")) return "TypeORM";
    if (depStr.includes("mongoose") || fileStr.includes("mongoose")) return "Mongoose";
    if (depStr.includes("sequelize") || fileStr.includes("sequelize")) return "Sequelize";
    if (depStr.includes("knex") || fileStr.includes("knex")) return "Knex.js";
    if (depStr.includes("@supabase/supabase-js") || fileStr.includes("supabase")) return "Supabase";
    return "Drizzle";
  }, [databaseInfo, dependencies, files]);

  const detectedDb = useMemo(() => {
    if (databaseInfo?.type && databaseInfo.type !== "Unknown") return databaseInfo.type;
    const envStr = envVars.map((e) => `${e.name}=${e.value || ""}`.toLowerCase()).join(" ");
    const depStr = dependencies.map((d) => d.target.toLowerCase()).join(" ");
    if (envStr.includes("postgres") || depStr.includes("pg") || depStr.includes("postgres")) return "PostgreSQL";
    if (envStr.includes("mysql") || depStr.includes("mysql")) return "MySQL";
    if (envStr.includes("mongo") || depStr.includes("mongodb")) return "MongoDB";
    if (envStr.includes("sqlite") || depStr.includes("sqlite3") || depStr.includes("better-sqlite3")) return "SQLite";
    if (envStr.includes("redis") || depStr.includes("ioredis")) return "Redis";
    return "PostgreSQL";
  }, [databaseInfo, envVars, dependencies]);

  // Dynamically extract entities
  const dynamicEntities: EntityData[] = useMemo(() => {
    if (databaseInfo?.entities && databaseInfo.entities.length > 0) {
      return databaseInfo.entities;
    }

    const entityFiles = files.filter(
      (f) =>
        f.path.toLowerCase().includes("schema") ||
        f.path.toLowerCase().includes("models/") ||
        f.path.toLowerCase().includes("model.") ||
        f.path.toLowerCase().includes("entities/") ||
        f.path.toLowerCase().includes("entity.") ||
        f.path.endsWith(".prisma") ||
        f.path.toLowerCase().includes("migration")
    );

    if (entityFiles.length > 0) {
      return entityFiles.map((f) => {
        const parts = f.path.split(/[/\\\.]/);
        const name = parts[parts.length - 2] || parts[parts.length - 1];
        return {
          entity: name.toUpperCase(),
          operations: ["read", "write"],
          fields: inferFieldsForEntity(name),
        };
      });
    }

    return [
      {
        entity: "FEATURE_DEFS",
        operations: ["read"],
        fields: inferFieldsForEntity("feature"),
      },
    ];
  }, [databaseInfo, files]);

  const [selectedEntityName, setSelectedEntityName] = useState<string>(
    dynamicEntities[0]?.entity || "FEATURE_DEFS"
  );

  const activeEntity =
    dynamicEntities.find((e) => e.entity === selectedEntityName) ||
    dynamicEntities[0];

  const columns = useMemo(() => {
    if (activeEntity?.fields && activeEntity.fields.length > 0) {
      return activeEntity.fields;
    }
    if (activeEntity?.columns && activeEntity.columns.length > 0) {
      return activeEntity.columns;
    }
    return inferFieldsForEntity(activeEntity?.entity || "default");
  }, [activeEntity]);

  const filteredColumns = useMemo(() => {
    if (!searchQuery.trim()) return columns;
    const q = searchQuery.toLowerCase();
    return columns.filter(
      (col) =>
        col.name.toLowerCase().includes(q) ||
        col.type.toLowerCase().includes(q) ||
        (col.description && col.description.toLowerCase().includes(q))
    );
  }, [columns, searchQuery]);

  const flowCount = databaseInfo?.flows?.length ?? 4;

  return (
    <div className="w-full max-w-[1450px] mx-auto text-left relative space-y-6 select-none font-sans">
      {/* ── 1. HEADER (Health Diagnostics Layout) ── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        {/* Left: 64x64 Gradient Icon + Eyebrow + Title + Subtitle */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#16C7A1] to-[#0E8A70] border border-[#20D6D8]/40 text-white flex items-center justify-center shrink-0 shadow-lg shadow-[#16C7A1]/20">
            <Database className="w-7 h-7 sm:w-8 sm:h-8 text-white stroke-[2.4]" />
          </div>

          <div>
            <p className="text-xs sm:text-[13px] font-bold uppercase tracking-[2px] text-[#20D6D8]">
              DATABASE ANALYSIS
            </p>
            <h1 className="text-2xl sm:text-[36px] font-extrabold text-white tracking-tight leading-tight mt-0.5">
              Schema & Entities
            </h1>
            <p className="text-xs sm:text-[14px] text-[#9BC9CE] mt-1 font-normal">
              Explore the structure of your database and its entities.
            </p>
          </div>
        </div>

        {/* Right: Search + Analyze Button */}
        <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
          <div className="relative w-48 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#82AEB5]" />
            <input
              type="text"
              placeholder="Search tables, entities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-xs font-mono bg-[#084851] border border-[#20D6D8]/20 rounded-xl text-white placeholder-[#82AEB5] focus:outline-none focus:border-[#16C7A1]"
            />
          </div>

          <button
            onClick={onAnalyze}
            className="h-[46px] px-5 rounded-xl bg-[#F52F45] hover:bg-[#FF4055] text-white font-bold text-xs shadow-md shadow-[#F52F45]/30 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Analyze Database</span>
          </button>
        </div>
      </header>

      {/* ── 2. FOUR HEALTH-DIAGNOSTICS STYLE METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: ORM (Red Accent) */}
        <div className="rounded-2xl bg-[#084851] border border-[rgba(255,57,77,0.35)] p-4 sm:p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-[rgba(255,57,77,0.6)] transition-all">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#FF394D]/15 border border-[#FF394D]/35 text-[#FF394D] flex items-center justify-center shrink-0">
              <Database className="w-4.5 h-4.5" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9BC9CE]">
              ORM
            </span>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-[32px] font-extrabold font-mono text-[#FF394D] leading-none truncate">
                {detectedOrm}
              </span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-[#053B43] mt-3 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-[#F52F45] to-[#FF394D] w-[75%]" />
            </div>
          </div>
        </div>

        {/* Card 2: DATABASE (Cyan/Teal Accent) */}
        <div className="rounded-2xl bg-[#084851] border border-[#27D4D8]/25 p-4 sm:p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-[#27D4D8]/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#27D4D8]/15 border border-[#27D4D8]/35 text-[#27D4D8] flex items-center justify-center shrink-0">
              <Boxes className="w-4.5 h-4.5" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9BC9CE]">
              DATABASE
            </span>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-[32px] font-extrabold font-mono text-[#27D4D8] leading-none truncate">
                {detectedDb}
              </span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-[#053B43] mt-3 overflow-hidden">
              <div className="h-full rounded-full bg-[#27D4D8] w-[85%]" />
            </div>
          </div>
        </div>

        {/* Card 3: ENTITIES (Yellow/Amber Accent) */}
        <div className="rounded-2xl bg-[#084851] border border-[#FFC42E]/25 p-4 sm:p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-[#FFC42E]/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#FFC42E]/15 border border-[#FFC42E]/35 text-[#FFC42E] flex items-center justify-center shrink-0">
              <Layers className="w-4.5 h-4.5" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9BC9CE]">
              ENTITIES
            </span>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl sm:text-[38px] font-extrabold font-mono text-[#FFC42E] leading-none">
                {dynamicEntities.length}
              </span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-[#053B43] mt-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#FFC42E]"
                style={{ width: `${Math.min(100, Math.max(25, dynamicEntities.length * 20))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: FLOWS (Pink/Red Accent) */}
        <div className="rounded-2xl bg-[#084851] border border-[#FF5064]/25 p-4 sm:p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-[#FF5064]/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#FF5064]/15 border border-[#FF5064]/35 text-[#FF5064] flex items-center justify-center shrink-0">
              <Network className="w-4.5 h-4.5" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9BC9CE]">
              FLOWS
            </span>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl sm:text-[38px] font-extrabold font-mono text-[#FF5064] leading-none">
                {flowCount}
              </span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-[#053B43] mt-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#FF5064]"
                style={{ width: `${Math.min(100, Math.max(30, flowCount * 25))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. MAIN DATABASE ENTITY EXPLORER PANEL ── */}
      <div className="rounded-2xl bg-[#084851] border border-[#20D6D8]/20 p-5 shadow-xl space-y-4">
        {/* Entity Selector Bar */}
        {dynamicEntities.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#20D6D8]/15">
            {dynamicEntities.map((ent) => {
              const isSelected = ent.entity === activeEntity?.entity;
              return (
                <button
                  key={ent.entity}
                  onClick={() => setSelectedEntityName(ent.entity)}
                  className={`px-3.5 py-2 text-xs font-mono font-semibold rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? "bg-[#16C7A1] text-[#063D48] font-bold shadow-md"
                      : "bg-[#053B43] hover:bg-[#095560] text-[#82AEB5] hover:text-white border border-[#20D6D8]/20"
                  }`}
                >
                  <TableIcon size={13} />
                  <span>{ent.entity}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Active Entity Info Bar */}
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-[#20D6D8]/15">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#16C7A1]/15 border border-[#16C7A1]/30 flex items-center justify-center text-[#16C7A1] shrink-0">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold font-mono tracking-tight text-white uppercase">
                {activeEntity?.entity || "ENTITY"}
              </h2>
              <p className="text-xs text-[#82AEB5]">
                Table structure and related entity information
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(activeEntity?.operations || ["read"]).map((op) => (
              <span
                key={op}
                className="px-3 py-1 rounded-full bg-[#053B43] border border-[#20D6D8]/30 text-xs font-semibold text-white flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#16C7A1]" />
                {op}
              </span>
            ))}
          </div>
        </div>

        {/* Sub Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {(["Columns", "Relationships", "Indexes"] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  isActive
                    ? "bg-[#9BE8E0] text-[#063D48] shadow-md font-extrabold"
                    : "bg-[#053B43] hover:bg-[#095560] text-[#82AEB5] hover:text-white border border-[#20D6D8]/20"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Tab Table Container */}
        <div className="rounded-xl border border-[#20D6D8]/20 overflow-hidden bg-[#053B43]/70">
          {/* TAB 1: COLUMNS */}
          {activeTab === "Columns" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#074750] text-[#A8C9CD] border-b border-[#20D6D8]/20 font-mono font-bold">
                    <th className="py-3 px-4 w-12">#</th>
                    <th className="py-3 px-4">Column Name</th>
                    <th className="py-3 px-4">Data Type</th>
                    <th className="py-3 px-4">Nullable</th>
                    <th className="py-3 px-4">Default</th>
                    <th className="py-3 px-4">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#20D6D8]/10 font-mono">
                  {filteredColumns.length > 0 ? (
                    filteredColumns.map((col, idx) => (
                      <tr
                        key={col.name + idx}
                        className="hover:bg-[#095560]/60 transition-colors text-white"
                      >
                        <td className="py-3.5 px-4 text-[#8AAEB3] font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          {col.name}
                        </td>
                        <td className="py-3.5 px-4 text-[#9BE8E0]">
                          {col.type}
                        </td>
                        <td className="py-3.5 px-4 text-[#8AAEB3]">
                          {col.nullable ? "Yes" : "No"}
                        </td>
                        <td className="py-3.5 px-4 text-[#8AAEB3]">
                          {col.defaultVal || "—"}
                        </td>
                        <td className="py-3.5 px-4 text-[#C3D5D8] font-sans text-xs">
                          {col.description || "Field attribute"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#8AAEB3]">
                        No matching columns found for "{searchQuery}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: RELATIONSHIPS */}
          {activeTab === "Relationships" && (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#16C7A1]/15 border border-[#16C7A1]/30 text-[#16C7A1] flex items-center justify-center mx-auto mb-3">
                <Link2 size={22} />
              </div>
              <h3 className="text-sm font-bold text-white">
                Entity Relationship Flow
              </h3>
              <p className="text-xs text-[#8AAEB3] max-w-md mx-auto mt-1 leading-relaxed">
                Entities are dynamically connected through route queries and repository services.
              </p>
            </div>
          )}

          {/* TAB 3: INDEXES */}
          {activeTab === "Indexes" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#074750] text-[#A8C9CD] border-b border-[#20D6D8]/20 font-mono font-bold">
                    <th className="py-3 px-4">Index Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Column(s)</th>
                    <th className="py-3 px-4">Unique</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#20D6D8]/10 font-mono text-white">
                  <tr className="hover:bg-[#095560]/60">
                    <td className="py-3.5 px-4 font-bold text-[#9BE8E0]">
                      {activeEntity?.entity.toLowerCase()}_pkey
                    </td>
                    <td className="py-3.5 px-4 text-[#8AAEB3]">PRIMARY KEY</td>
                    <td className="py-3.5 px-4 text-white">id</td>
                    <td className="py-3.5 px-4 text-[#16C7A1]">Yes</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
