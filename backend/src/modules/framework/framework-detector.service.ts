import fs from "fs/promises";
import path from "path";
import { PackageAnalyzer } from "./package-analyzer.js";
import { FRAMEWORK_RULES as STATIC_FRAMEWORK_RULES } from "./framework-rules.js";
import { FrameworkInfo, FrameworkMetadata, FrameworkRule } from "./types.js";
import { logger } from "../../core/logger/index.js";
import { supabase } from "../../core/supabase/index.js";

export class FrameworkDetectorService {
  private static cachedRules: { rules: FrameworkRule[]; cachedAt: number } | null = null;

  /**
   * Load framework detection rules from database with in-memory caching and fallback to static rules.
   */
  private static async getRules(): Promise<FrameworkRule[]> {
    const now = Date.now();
    if (this.cachedRules && (now - this.cachedRules.cachedAt) < 10 * 60 * 1000) {
      return this.cachedRules.rules;
    }

    const rules = [...STATIC_FRAMEWORK_RULES];

    try {
      const { data: dbRules, error } = await supabase
        .from("detection_rules")
        .select("name, patterns")
        .eq("category", "framework")
        .eq("enabled", true);

      if (!error && dbRules) {
        for (const r of dbRules) {
          const patterns = r.patterns as any;
          if (patterns?.dependencies) {
            rules.push({
              name: r.name,
              dependencies: patterns.dependencies,
              fileCues: patterns.fileCues,
              codeCues: patterns.codeCues,
            });
          }
        }
      }
    } catch (err) {
      logger.warn({ err }, "Could not fetch dynamic framework rules from database, using static fallback");
    }

    this.cachedRules = { rules, cachedAt: now };
    return rules;
  }

  /**
   * Evaluates the repository to extract frameworks, runtime, package manager, and monorepo configurations.
   * 
   * @param repoPath Absolute path to the repository directory
   * @param filePaths Relative paths of all files in the repository
   * @param langResult Detected language data (including primary language)
   */
  static async detect(
    repoPath: string,
    filePaths: string[],
    langResult: { primaryLanguage: string }
  ): Promise<FrameworkMetadata> {
    logger.info({ repoPath }, "🔍 Initiating Framework Intelligence Engine detection");

    const filePathsSet = new Set(filePaths.map((f) => f.replace(/\\/g, "/")));

    // 1. Analyze package.json
    const parsedPkg = await PackageAnalyzer.analyze(repoPath);

    // 2. Sample code contents to check for code patterns (secondary signals)
    const sampleFiles = filePaths
      .filter((f) => {
        const ext = path.extname(f).toLowerCase();
        return (ext === ".ts" || ext === ".tsx" || ext === ".js" || ext === ".jsx") && 
               !f.startsWith("node_modules/") && 
               !f.startsWith("dist/") &&
               !f.startsWith(".next/");
      })
      .slice(0, 15);

    const codeContents: string[] = [];
    for (const file of sampleFiles) {
      try {
        const fullPath = path.join(repoPath, file);
        const stats = await fs.stat(fullPath);
        // Safety guard: only read small files (less than 100KB)
        if (stats.size < 100 * 1024) {
          const content = await fs.readFile(fullPath, "utf8");
          codeContents.push(content);
        }
      } catch {
        // Ignore file read failures
      }
    }

    // 3. Match Frameworks using rules engine
    const frameworks: FrameworkInfo[] = [];
    const frameworkRules = await this.getRules();

    for (const rule of frameworkRules) {
      let detected = false;
      let confidence = 0;

      // A. Check package.json dependencies / devDependencies
      const hasDep = rule.dependencies.some((dep) => parsedPkg.dependencies[dep] !== undefined);
      const hasDevDep = rule.devDependencies?.some((dep) => parsedPkg.devDependencies[dep] !== undefined) || false;

      if (hasDep || hasDevDep) {
        detected = true;
        confidence = 100;
      }

      // B. Check file cues (e.g. next.config.js)
      if (!detected && rule.fileCues) {
        const hasFileCue = rule.fileCues.some((fileCue) => filePathsSet.has(fileCue));
        if (hasFileCue) {
          detected = true;
          confidence = 95;
        }
      }

      // C. Check code cues (e.g. express() instantiation)
      if (!detected && rule.codeCues) {
        const hasCodeCue = rule.codeCues.some((cue) =>
          codeContents.some((content) => content.includes(cue))
        );
        if (hasCodeCue) {
          detected = true;
          confidence = 70;
        }
      }

      if (detected) {
        frameworks.push({
          name: rule.name,
          confidence,
        });
      }
    }

    // Sort frameworks by confidence in descending order
    frameworks.sort((a, b) => b.confidence - a.confidence);

    // 4. Detect Package Manager
    let packageManager = "npm";
    if (filePathsSet.has("pnpm-lock.yaml")) {
      packageManager = "pnpm";
    } else if (filePathsSet.has("yarn.lock")) {
      packageManager = "yarn";
    } else if (filePathsSet.has("bun.lockb")) {
      packageManager = "bun";
    }

    // 5. Detect Runtime
    let runtime = "Node.js";
    if (filePathsSet.has("bun.lockb") || filePathsSet.has("bunfig.toml")) {
      runtime = "Bun";
    } else if (filePathsSet.has("deno.json") || filePathsSet.has("deno.lock")) {
      runtime = "Deno";
    }

    // 6. Detect Monorepo
    let monorepo = false;
    const hasWorkspacesKey = parsedPkg.workspaces.length > 0;
    const hasPnpmWorkspace = filePathsSet.has("pnpm-workspace.yaml");
    const hasLerna = filePathsSet.has("lerna.json");
    const hasTurbo = filePathsSet.has("turbo.json");
    
    // Structure signals: both apps/ and packages/ exist in the paths list
    const hasAppsDir = filePaths.some((f) => f.startsWith("apps/"));
    const hasPackagesDir = filePaths.some((f) => f.startsWith("packages/"));

    if (hasWorkspacesKey || hasPnpmWorkspace || hasLerna || hasTurbo || (hasAppsDir && hasPackagesDir)) {
      monorepo = true;
    }

    const metadata: FrameworkMetadata = {
      frameworks,
      runtime,
      packageManager,
      language: langResult.primaryLanguage,
      monorepo,
      dependencies: parsedPkg.dependencies,
      devDependencies: parsedPkg.devDependencies,
    };

    logger.info(
      {
        primaryFramework: frameworks[0]?.name || "Unknown",
        confidence: frameworks[0]?.confidence || 0,
        runtime,
        packageManager,
        monorepo,
      },
      "🔍 Framework Intelligence Engine detection finished successfully"
    );

    return metadata;
  }
}
