import { motion } from "framer-motion";
import {
  Files,
  Route,
  Package,
  Key,
  Braces,
  Server,
  Terminal,
  Layers
} from "lucide-react";
import { Badge } from "../ui/badge";

interface OverviewAnalyticsProps {
  overview: {
    totalFiles: number;
    totalRoutes: number;
    totalDependencies: number;
    totalEnvVars: number;
  };
  frameworkMetadata?: {
    language: string;
    runtime: string;
    packageManager?: string;
    frameworks: Array<{ name: string }>;
  };
}

const statIcons = [Files, Route, Package, Key];
const statLabels = ["Files Analyzed", "API Routes", "Dependencies", "Environment Vars"];
const statColors = [
  "text-blue-400 bg-blue-500/10 border-blue-500/20",
  "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  "text-amber-400 bg-amber-500/10 border-amber-500/20",
  "text-purple-400 bg-purple-500/10 border-purple-500/20"
];

export default function OverviewAnalytics({ overview, frameworkMetadata }: OverviewAnalyticsProps) {
  const stats = [
    overview.totalFiles,
    overview.totalRoutes,
    overview.totalDependencies,
    overview.totalEnvVars
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((value, index) => {
          const Icon = statIcons[index];
          const colorClass = statColors[index];

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-zinc-900/60 backdrop-blur-xl rounded-xl p-5 border border-border/60 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${colorClass}`}>
                  <Icon size={16} />
                </div>
                <span className="dash-metadata text-muted-foreground uppercase tracking-wider font-semibold">
                  {statLabels[index]}
                </span>
              </div>
              <div className="dash-metric text-white">
                {value.toLocaleString()}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Auto-Stack Badging */}
      {frameworkMetadata && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900/60 backdrop-blur-xl rounded-xl p-6 border border-border/60 shadow-sm"
        >
          <h3 className="dash-section-heading uppercase tracking-widest text-primary mb-5 flex items-center gap-2">
            <Layers size={16} />
            Detected Technology Stack
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Primary Language */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Braces className="text-blue-400" size={18} />
              </div>
              <div>
                <div className="dash-metadata text-muted-foreground uppercase tracking-wider">Language</div>
                <div className="dash-card-title text-white mt-0.5">{frameworkMetadata.language || "Unknown"}</div>
              </div>
            </div>

            {/* Runtime */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Server className="text-emerald-400" size={18} />
              </div>
              <div>
                <div className="dash-metadata text-muted-foreground uppercase tracking-wider">Runtime</div>
                <div className="dash-card-title text-white mt-0.5">{frameworkMetadata.runtime || "Unknown"}</div>
              </div>
            </div>

            {/* Package Manager */}
            {frameworkMetadata.packageManager && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Terminal className="text-amber-400" size={18} />
                </div>
                <div>
                  <div className="dash-metadata text-muted-foreground uppercase tracking-wider">Package Manager</div>
                  <div className="dash-card-title text-white mt-0.5">{frameworkMetadata.packageManager}</div>
                </div>
              </div>
            )}
          </div>

          {/* Framework Badges */}
          {frameworkMetadata.frameworks && frameworkMetadata.frameworks.length > 0 && (
            <div className="mt-5 pt-4 border-t border-border/40">
              <div className="dash-metadata text-muted-foreground uppercase tracking-wider mb-2">
                Detected Frameworks
              </div>
              <div className="flex flex-wrap gap-2">
                {frameworkMetadata.frameworks.map((f: any, i: number) => (
                  <Badge key={i} variant="secondary" className="dash-badge px-2.5 py-1 bg-primary/10 text-primary border-primary/20">
                    {f.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}