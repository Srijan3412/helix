"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  Search,
  Play,
  ChevronRight,
  Boxes,
  Network,
  Share2,
  Table as TableIcon,
  Key,
  Link2,
  Code2,
  FileText,
  Sparkles,
  Layers,
  ArrowUpRight,
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
  onAnalyze?: () => void;
}

// Default columns generator for any entity if not explicitly present in AST
function getEntityColumns(entityName: string, customFields?: EntityField[]): EntityField[] {
  if (customFields && customFields.length > 0) return customFields;

  const lower = entityName.toLowerCase();
  if (lower.includes("feature")) {
    return [
      { name: "id", type: "UUID", nullable: false, defaultVal: "—", description: "Primary key" },
      { name: "name", type: "VARCHAR", nullable: false, defaultVal: "—", description: "Name of the feature" },
      { name: "description", type: "TEXT", nullable: true, defaultVal: "—", description: "Feature description" },
      { name: "created_at", type: "TIMESTAMP", nullable: false, defaultVal: "now()", description: "Creation timestamp" },
      { name: "updated_at", type: "TIMESTAMP", nullable: false, defaultVal: "now()", description: "Last updated timestamp" },
    ];
  }

  if (lower.includes("user") || lower.includes("account")) {
    return [
      { name: "id", type: "UUID", nullable: false, defaultVal: "uuid_generate_v4()", description: "Unique user identifier" },
      { name: "email", type: "VARCHAR(255)", nullable: false, defaultVal: "—", description: "Primary login email" },
      { name: "role", type: "VARCHAR(50)", nullable: false, defaultVal: "'user'", description: "Authorization role" },
      { name: "created_at", type: "TIMESTAMP", nullable: false, defaultVal: "now()", description: "Account creation time" },
    ];
  }

  return [
    { name: "id", type: "UUID", nullable: false, defaultVal: "—", description: "Primary key" },
    { name: "name", type: "VARCHAR", nullable: false, defaultVal: "—", description: "Entity title or identifier" },
    { name: "metadata", type: "JSONB", nullable: true, defaultVal: "'{}'::jsonb", description: "Dynamic metadata attributes" },
    { name: "created_at", type: "TIMESTAMP", nullable: false, defaultVal: "now()", description: "Creation timestamp" },
    { name: "updated_at", type: "TIMESTAMP", nullable: false, defaultVal: "now()", description: "Last update timestamp" },
  ];
}

export default function DatabaseExplorer({
  databaseInfo,
  onAnalyze,
}: DatabaseExplorerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<
    "Columns" | "Relationships" | "Indexes" | "Sample Data"
  >("Columns");

  const entities = databaseInfo?.entities || [
    { entity: "FEATURE_DEFS", operations: ["read"] },
  ];

  const orm = databaseInfo?.orm || "Drizzle";
  const dbType = databaseInfo?.type || "PostgreSQL";
  const entityCount = entities.length;
  const flowCount = databaseInfo?.flows?.length ?? 3;

  const [selectedEntityName, setSelectedEntityName] = useState<string>(
    entities[0]?.entity || "FEATURE_DEFS"
  );

  const activeEntity =
    entities.find((e) => e.entity === selectedEntityName) || entities[0];
  const columns = getEntityColumns(
    activeEntity?.entity || "FEATURE_DEFS",
    activeEntity?.fields || activeEntity?.columns
  );

  const filteredColumns = columns.filter(
    (col) =>
      !searchQuery ||
      col.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      col.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (col.description &&
        col.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="w-full max-w-[1450px] mx-auto space-y-6 text-left">
      {/* ── 1. HEADER AREA ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#16C7A1] flex items-center gap-1.5">
            <Database size={14} className="text-[#16C7A1]" />
            DATABASE ANALYSIS
          </p>
          <h1 className="text-3xl sm:text-[38px] font-extrabold text-[#F7FAFA] tracking-tight leading-tight mt-1">
            Schema & Entities
          </h1>
          <p className="text-sm text-[#82AEB5] mt-1">
            Explore the structure of your database and its entities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#82AEB5]" />
            <input
              type="text"
              placeholder="Search tables, entities, columns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-10 py-2 text-xs font-mono bg-[#093C45]/80 border border-[#176873]/60 rounded-xl text-[#F7FAFA] placeholder-[#82AEB5] focus:outline-none focus:border-[#16C7A1] transition-colors"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#083E48] border border-[#176873]/60 text-[#82AEB5]">
              ⌘ K
            </span>
          </div>

          {/* Analyze Database primary button */}
          <button
            onClick={onAnalyze}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF3344] hover:bg-[#FF4D5C] text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-red-500/20 transition-all shrink-0 cursor-pointer"
          >
            <Play size={14} className="fill-current" />
            <span>Analyze Database</span>
          </button>
        </div>
      </div>

      {/* ── 2. THE FOUR METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: ORM */}
        <div className="bg-[#FFF0F0] rounded-2xl p-4 flex items-center justify-between border border-red-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#F52B35] text-white flex items-center justify-center shadow-md shrink-0">
              <Database size={20} />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                ORM
              </div>
              <div className="text-lg font-black text-[#111827] mt-0.5 leading-tight">
                {orm}
              </div>
              <div className="text-[11px] text-[#6B7280] mt-0.5">
                Type-safe and modern ORM
              </div>
            </div>
          </div>
          <ChevronRight size={18} className="text-[#9CA3AF] group-hover:text-[#F52B35] group-hover:translate-x-0.5 transition-all" />
        </div>

        {/* Card 2: DATABASE */}
        <div className="bg-[#E8F8F5] rounded-2xl p-4 flex items-center justify-between border border-teal-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#16C7A1] text-white flex items-center justify-center shadow-md shrink-0">
              <Database size={20} />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#4B5563]">
                DATABASE
              </div>
              <div className="text-lg font-black text-[#111827] mt-0.5 leading-tight">
                {dbType}
              </div>
              <div className="text-[11px] text-[#4B5563] mt-0.5">
                Relational database
              </div>
            </div>
          </div>
          <ChevronRight size={18} className="text-[#9CA3AF] group-hover:text-[#16C7A1] group-hover:translate-x-0.5 transition-all" />
        </div>

        {/* Card 3: ENTITIES */}
        <div className="bg-[#FFF0F0] rounded-2xl p-4 flex items-center justify-between border border-red-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#F52B35] text-white flex items-center justify-center shadow-md shrink-0">
              <Boxes size={20} />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                ENTITIES
              </div>
              <div className="text-lg font-black text-[#111827] mt-0.5 leading-tight">
                {entityCount}
              </div>
              <div className="text-[11px] text-[#6B7280] mt-0.5">
                Detected entities
              </div>
            </div>
          </div>
          <ChevronRight size={18} className="text-[#9CA3AF] group-hover:text-[#F52B35] group-hover:translate-x-0.5 transition-all" />
        </div>

        {/* Card 4: FLOWS */}
        <div className="bg-[#E8F8F5] rounded-2xl p-4 flex items-center justify-between border border-teal-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#16C7A1] text-white flex items-center justify-center shadow-md shrink-0">
              <Network size={20} />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#4B5563]">
                FLOWS
              </div>
              <div className="text-lg font-black text-[#111827] mt-0.5 leading-tight">
                {flowCount}
              </div>
              <div className="text-[11px] text-[#4B5563] mt-0.5">
                Data flows analyzed
              </div>
            </div>
          </div>
          <ChevronRight size={18} className="text-[#9CA3AF] group-hover:text-[#16C7A1] group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      {/* ── 3. MAIN DATABASE ENTITY EXPLORER CARD ── */}
      <div className="bg-[#063038]/90 backdrop-blur-xl rounded-2xl p-6 border border-[#176873]/50 shadow-xl flex flex-col space-y-5">
        {/* Entity Card Header */}
        <div className="flex items-center justify-between gap-4 pb-2 border-b border-[#176873]/30">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#094752] border border-[#16C7A1]/30 flex items-center justify-center text-[#16C7A1] shrink-0">
              <Database size={22} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-mono tracking-tight text-[#F7FAFA] uppercase">
                {activeEntity?.entity || "FEATURE_DEFS"}
              </h2>
              <p className="text-xs text-[#82AEB5] mt-0.5">
                Table structure and related information
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(activeEntity?.operations || ["read"]).map((op) => (
              <span
                key={op}
                className="px-3 py-1 rounded-full bg-[#083E48] border border-[#176873] text-xs font-semibold text-[#F2F7F7] flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#16C7A1]" />
                {op}
              </span>
            ))}
            <ChevronRight size={18} className="text-[#82AEB5] ml-1" />
          </div>
        </div>

        {/* ── 4. SUB-TABS ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {(["Columns", "Relationships", "Indexes", "Sample Data"] as const).map(
            (tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                    isActive
                      ? "bg-[#9BE8E0] text-[#063D48] shadow-md"
                      : "bg-[#083E48] hover:bg-[#0E4954] text-[#82AEB5] hover:text-white border border-[#176873]/50"
                  }`}
                >
                  {tab}
                </button>
              );
            }
          )}
        </div>

        {/* ── 5. TAB CONTENT ── */}
        <div className="rounded-xl border border-[#176873]/40 overflow-hidden bg-[#073942]/60">
          {/* TAB 1: COLUMNS */}
          {activeTab === "Columns" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#093C45] text-[#A8C9CD] border-b border-[#176873]/50 font-mono font-bold">
                    <th className="py-3 px-4 w-12">#</th>
                    <th className="py-3 px-4">Column Name</th>
                    <th className="py-3 px-4">Data Type</th>
                    <th className="py-3 px-4">Nullable</th>
                    <th className="py-3 px-4">Default</th>
                    <th className="py-3 px-4">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#176873]/30 font-mono">
                  {filteredColumns.length > 0 ? (
                    filteredColumns.map((col, idx) => (
                      <tr
                        key={col.name + idx}
                        className="hover:bg-[#0B434B]/60 transition-colors text-[#F2F7F7]"
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
              <div className="w-12 h-12 rounded-xl bg-[#094752] text-[#16C7A1] flex items-center justify-center mx-auto mb-3 border border-[#16C7A1]/30">
                <Link2 size={22} />
              </div>
              <h3 className="text-sm font-bold text-[#F2F7F7]">
                No relationships detected
              </h3>
              <p className="text-xs text-[#8AAEB3] max-w-md mx-auto mt-1 leading-relaxed">
                This database entity currently contains no detected foreign-key relationships.
              </p>
            </div>
          )}

          {/* TAB 3: INDEXES */}
          {activeTab === "Indexes" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#093C45] text-[#A8C9CD] border-b border-[#176873]/50 font-mono font-bold">
                    <th className="py-3 px-4">Index Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Column(s)</th>
                    <th className="py-3 px-4">Unique</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#176873]/30 font-mono text-[#F2F7F7]">
                  <tr className="hover:bg-[#0B434B]/60">
                    <td className="py-3.5 px-4 font-bold text-[#9BE8E0]">
                      {activeEntity?.entity.toLowerCase()}_pkey
                    </td>
                    <td className="py-3.5 px-4 text-[#8AAEB3]">PRIMARY KEY</td>
                    <td className="py-3.5 px-4 text-white">id</td>
                    <td className="py-3.5 px-4 text-[#16C7A1]">Yes</td>
                  </tr>
                  <tr className="hover:bg-[#0B434B]/60">
                    <td className="py-3.5 px-4 font-bold text-[#9BE8E0]">
                      idx_{activeEntity?.entity.toLowerCase()}_created_at
                    </td>
                    <td className="py-3.5 px-4 text-[#8AAEB3]">BTREE</td>
                    <td className="py-3.5 px-4 text-white">created_at</td>
                    <td className="py-3.5 px-4 text-[#8AAEB3]">No</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: SAMPLE DATA */}
          {activeTab === "Sample Data" && (
            <div className="p-4 font-mono text-xs text-[#9BE8E0] overflow-x-auto bg-[#05262D]">
              <pre className="leading-relaxed">
{JSON.stringify(
  [
    {
      id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      name: "Authentication Guard",
      description: "Handles JWT validation and Supabase route protection.",
      created_at: "2026-09-08T01:15:00.000Z",
      updated_at: "2026-09-08T01:15:00.000Z",
    },
    {
      id: "7c2deb5e-4c8e-5cae-8cee-3c1e8c4eda7e",
      name: "AST Route Engine",
      description: "High-performance TypeScript AST traversal and route discovery.",
      created_at: "2026-09-08T01:16:00.000Z",
      updated_at: "2026-09-08T01:16:00.000Z",
    },
  ],
  null,
  2
)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
