import { supabase } from "../../core/supabase/index.js";
import { logger } from "../../core/logger/index.js";
import {
  ScanSession,
  ScanSnapshot,
  DiffReport,
  UserScanStats,
} from "@shared/types";

export class ScanHistoryService {
  /**
   * Save a completed scan to the database
   */
  static async saveScan(
    userId: string,
    jobId: string,
    analysisResult: any,
  ): Promise<ScanSession> {
    try {
      // Extract data from analysis result
      const files = analysisResult.files || [];
      const routes = analysisResult.routes || [];
      const overview = analysisResult.overview || {};
      const architecture = analysisResult.architecture || {};
      const graph = analysisResult.graph || {};
      const staticAnalysis = analysisResult.staticAnalysis || {};

      // 1. Insert session record
      const { data: session, error: sessionError } = await supabase
        .from("scan_sessions")
        .insert({
          user_id: userId,
          job_id: jobId,
          repo_name: analysisResult.metadata?.repoName || "Unknown Repository",
          repo_path: analysisResult.metadata?.repoPath || "",
          total_files: overview.totalFiles || files.length,
          total_routes: overview.totalRoutes || routes.length,
          health_score: overview.healthScore || staticAnalysis.healthScore || 0,
          status: "completed",
          metadata: analysisResult.metadata || {},
        })
        .select()
        .single();

      if (sessionError) {
        logger.error(sessionError, "Session insert error");
        throw sessionError;
      }

      // 2. Insert snapshot with full analysis data - ✅ UPDATED with all fields
      const { error: snapshotError } = await supabase
        .from("scan_snapshots")
        .insert({
          session_id: session.id,
          architecture: architecture,
          graph: graph,
          static_analysis: staticAnalysis,
          files: files,
          routes: routes,
          dependencies: analysisResult.dependencies || [],
          // ✅ ADDED: All new fields
          envVars: analysisResult.envVars || [],
          features: analysisResult.features || [],
          aiSummary: analysisResult.aiSummary || null,
          onboarding: analysisResult.onboarding || null,
          tree: analysisResult.tree || null,
          frameworks: analysisResult.frameworks || [],
          graphIssues: analysisResult.graphIssues || [],
          subway: analysisResult.subway || null,
        });

      if (snapshotError) {
        logger.error(snapshotError, "Snapshot insert error");
        throw snapshotError;
      }

      logger.info(`✅ Saved scan session for user ${userId}, job ${jobId}`);
      return {
        id: session.id,
        userId: session.user_id,
        jobId: session.job_id,
        repoName: session.repo_name,
        repoPath: session.repo_path,
        totalFiles: session.total_files,
        totalRoutes: session.total_routes,
        healthScore: session.health_score,
        status: session.status,
        scannedAt: session.scanned_at,
        metadata: session.metadata,
      };
    } catch (error) {
      logger.error(error as any, "❌ Failed to save scan");
      throw error;
    }
  }

  /**
   * Get all scans for a user
   */
  /**
   * Get all scans for a user (excluding soft-deleted)
   */
  static async getScanHistory(userId: string): Promise<ScanSession[]> {
    try {
      const { data, error } = await supabase
        .from("scan_sessions")
        .select("*")
        .eq("user_id", userId)
        .is("deleted_at", null) // ✅ Exclude soft-deleted
        .order("scanned_at", { ascending: false });

      if (error) {
        logger.warn(
          { error: error.message, code: error.code },
          "Primary scan_sessions query failed, attempting fallback query without deleted_at filter"
        );

        // Fallback: production database may be missing deleted_at column or soft-delete schema
        const fallback = await supabase
          .from("scan_sessions")
          .select("*")
          .eq("user_id", userId)
          .order("scanned_at", { ascending: false });

        if (fallback.error) {
          logger.error(
            { error: fallback.error.message, code: fallback.error.code },
            "Fallback scan_sessions query failed (table may not exist or database uninitialized). Returning empty scan history."
          );
          return [];
        }
        return (fallback.data || []).map(this.mapScanRow);
      }

      return (data || []).map(this.mapScanRow);
    } catch (error) {
      logger.error(error as any, "❌ Failed to get scan history, returning empty list");
      return [];
    }
  }

  private static mapScanRow(row: any): ScanSession {
    return {
      id: row.id,
      userId: row.user_id,
      jobId: row.job_id,
      repoName: row.repo_name,
      repoPath: row.repo_path,
      totalFiles: row.total_files,
      totalRoutes: row.total_routes,
      healthScore: row.health_score,
      status: row.status,
      scannedAt: row.scanned_at,
      metadata: row.metadata,
      deletedAt: row.deleted_at ?? undefined,
      deletedBy: row.deleted_by ?? undefined,
    };
  }

  /**
   * Get a scan session by job ID
   */
  static async getScanSessionByJobId(
    jobId: string,
    userId?: string,
  ): Promise<ScanSession | null> {
    try {
      let query = supabase
        .from("scan_sessions")
        .select("*")
        .eq("job_id", jobId);

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        throw error;
      }
      if (!data) return null;
      return {
        id: data.id,
        userId: data.user_id,
        jobId: data.job_id,
        repoName: data.repo_name,
        repoPath: data.repo_path,
        totalFiles: data.total_files,
        totalRoutes: data.total_routes,
        healthScore: data.health_score,
        status: data.status,
        scannedAt: data.scanned_at,
        metadata: data.metadata,
      };
    } catch (error) {
      logger.error(
        error as any,
        `❌ Failed to get scan session for job ${jobId}`,
      );
      return null;
    }
  }

  /**
   * Get a scan session by session ID (UUID)
   */
  static async getScanSessionById(
    sessionId: string,
  ): Promise<ScanSession | null> {
    try {
      const { data, error } = await supabase
        .from("scan_sessions")
        .select("*")
        .eq("id", sessionId)
        .maybeSingle();

      if (error) {
        throw error;
      }
      if (!data) return null;
      return {
        id: data.id,
        userId: data.user_id,
        jobId: data.job_id,
        repoName: data.repo_name,
        repoPath: data.repo_path,
        totalFiles: data.total_files,
        totalRoutes: data.total_routes,
        healthScore: data.health_score,
        status: data.status,
        scannedAt: data.scanned_at,
        metadata: data.metadata,
      };
    } catch (error) {
      logger.error(error as any, `❌ Failed to get scan session ${sessionId}`);
      return null;
    }
  }

  /**
   * Get a scan snapshot by session ID
   */
  static async getScanSnapshot(
    sessionId: string,
    userId?: string,
  ): Promise<ScanSnapshot | null> {
    try {
      // First verify ownership if userId provided
      if (userId) {
        const isOwner = await this.verifyOwnership(sessionId, userId);
        if (!isOwner) {
          logger.warn(
            `User ${userId} attempted to access snapshot ${sessionId} without permission`,
          );
          return null;
        }
      }

      const { data, error } = await supabase
        .from("scan_snapshots")
        .select("*")
        .eq("session_id", sessionId)
        .maybeSingle();

      if (error) {
        throw error;
      }
      if (!data) return null;
      return {
        id: data.id,
        sessionId: data.session_id,
        architecture: data.architecture,
        graph: data.graph,
        staticAnalysis: data.static_analysis,
        files: data.files || [],
        routes: data.routes || [],
        dependencies: data.dependencies || [],
        envVars: data.envVars || [],
        features: data.features || [],
        aiSummary: data.aiSummary || null,
        onboarding: data.onboarding || null,
        tree: data.tree || null,
        frameworks: data.frameworks || [],
        graphIssues: data.graphIssues || [],
        subway: data.subway || null,
        createdAt: data.created_at,
      };
    } catch (error) {
      logger.error(
        error as any,
        `❌ Failed to get scan snapshot for session ${sessionId}`,
      );
      return null;
    }
  }

  /**
   * Get full analysis result by job ID (for reloading dashboards)
   */
  static async getFullAnalysisResult(jobId: string): Promise<any | null> {
    try {
      const session = await this.getScanSessionByJobId(jobId);
      if (!session) return null;

      const snapshot = await this.getScanSnapshot(session.id);
      if (!snapshot) return null;

      // Parse metadata with all fields
      const metadata = session.metadata || {};

      // Ensure all fields are present
      return {
        // Core data
        files: snapshot.files || [],
        routes: snapshot.routes || [],
        architecture: snapshot.architecture || {},
        graph: snapshot.graph || {},
        staticAnalysis: snapshot.staticAnalysis || {},
        dependencies: snapshot.dependencies || [],

        // Overview
        overview: {
          totalFiles: session.totalFiles || 0,
          totalRoutes: session.totalRoutes || 0,
          healthScore: session.healthScore || 0,
        },

        // Complete metadata
        metadata: {
          repoName:
            session.repoName || metadata.repoName || "Unknown Repository",
          repoPath: session.repoPath || metadata.repoPath || "",
          languages: metadata.languages || [],
          entryPoints: metadata.entryPoints || [],
          totalLines: metadata.totalLines || 0,
          frameworkMetadata: metadata.frameworkMetadata || {},
          databaseInfo: metadata.databaseInfo || {},
          routeMetrics: metadata.routeMetrics || {},
          missingEnvVars: metadata.missingEnvVars || [],
          repoType: metadata.repoType || "unknown",
          tree: metadata.tree || { name: session.repoName, children: [] },
          envVars: metadata.envVars || [],
          frameworks: metadata.frameworks || [],
          aiSummary: metadata.aiSummary || null,
          onboarding: metadata.onboarding || null,
          graphIssues: metadata.graphIssues || [],
          features: metadata.features || [],
          subway: metadata.subway || null,
        },

        // Job info
        jobId: session.jobId,
        scannedAt: session.scannedAt,
        status: session.status,
      };
    } catch (error) {
      logger.error({ error }, `Failed to get full analysis for job ${jobId}`);
      return null;
    }
  }

  // ── Ownership Verification ──
  static async verifyOwnership(
    sessionId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("scan_sessions")
        .select("user_id")
        .eq("id", sessionId)
        .single();

      if (error || !data) return false;
      return data.user_id === userId;
    } catch (error) {
      logger.error(
        { error },
        `Failed to verify ownership for session ${sessionId}`,
      );
      return false;
    }
  }

  /**
   * Compare two scans and generate a diff report
   */
  static async compareScans(
    baselineSessionId: string,
    compareSessionId: string,
    userId: string,
  ): Promise<DiffReport> {
    try {
      // Verify ownership of both sessions
      const isOwnerBaseline = await this.verifyOwnership(
        baselineSessionId,
        userId,
      );
      const isOwnerCompare = await this.verifyOwnership(
        compareSessionId,
        userId,
      );

      if (!isOwnerBaseline || !isOwnerCompare) {
        throw new Error("Unauthorized: You do not own one or both scans");
      }

      // Get both sessions
      // Get both sessions
      const baselineSession = await this.getScanSessionById(baselineSessionId);
      const compareSession = await this.getScanSessionById(compareSessionId);

      if (!baselineSession || !compareSession) {
        throw new Error("One or both scan sessions not found");
      }

      // Get both snapshots
      const baselineSnapshot = await this.getScanSnapshot(baselineSessionId);
      const compareSnapshot = await this.getScanSnapshot(compareSessionId);

      if (!baselineSnapshot || !compareSnapshot) {
        throw new Error("One or both scan snapshots not found");
      }

      // Extract file paths
      const baselineFiles = new Set(
        (baselineSnapshot.files || []).map((f: any) => f.path || f),
      );
      const compareFiles = new Set(
        (compareSnapshot.files || []).map((f: any) => f.path || f),
      );

      // Extract route paths
      const baselineRoutes = new Set(
        (baselineSnapshot.routes || []).map((r: any) => r.path || r),
      );
      const compareRoutes = new Set(
        (compareSnapshot.routes || []).map((r: any) => r.path || r),
      );

      // Extract layer names
      const baselineLayers = new Set(
        Object.keys(baselineSnapshot.architecture?.layers || {}),
      );
      const compareLayers = new Set(
        Object.keys(compareSnapshot.architecture?.layers || {}),
      );

      // ── Environment Variables Comparison ──
      const baselineEnvVars = new Set(
        (baselineSnapshot.envVars || []).map((e: any) => e.name || e),
      );
      const compareEnvVars = new Set(
        (compareSnapshot.envVars || []).map((e: any) => e.name || e),
      );

      const envVars = {
        added: [...compareEnvVars].filter((e) => !baselineEnvVars.has(e)),
        removed: [...baselineEnvVars].filter((e) => !compareEnvVars.has(e)),
        modified: [], // Could track value changes if stored
      };

      // ── Database Entities Comparison ──
      const baselineEntities = new Set(
        baselineSnapshot.architecture?.databaseInfo?.entities?.map(
          (e: any) => e.name || e,
        ) || [],
      );
      const compareEntities = new Set(
        compareSnapshot.architecture?.databaseInfo?.entities?.map(
          (e: any) => e.name || e,
        ) || [],
      );

      const databaseChanges = {
        added: [...compareEntities].filter((e) => !baselineEntities.has(e)),
        removed: [...baselineEntities].filter((e) => !compareEntities.has(e)),
      };

      // ── Feature/Module Comparison ──
      const baselineFeatures = new Set(
        (baselineSnapshot.features || []).map((f: any) => f.id || f.name || f),
      );
      const compareFeatures = new Set(
        (compareSnapshot.features || []).map((f: any) => f.id || f.name || f),
      );

      const featureChanges = {
        added: [...compareFeatures].filter((f) => !baselineFeatures.has(f)),
        removed: [...baselineFeatures].filter((f) => !compareFeatures.has(f)),
      };

      // ── Static Analysis Health ──
      const baselineHealth = baselineSession.healthScore || 0;
      const compareHealth = compareSession.healthScore || 0;

      // Build diff report
      const diffReport: DiffReport = {
        baseline: {
          id: baselineSession.id,
          userId: baselineSession.userId,
          jobId: baselineSession.jobId,
          repoName: baselineSession.repoName,
          repoPath: baselineSession.repoPath,
          totalFiles: baselineSession.totalFiles,
          totalRoutes: baselineSession.totalRoutes,
          healthScore: baselineSession.healthScore,
          status: baselineSession.status,
          scannedAt: baselineSession.scannedAt,
          metadata: baselineSession.metadata,
        },
        compare: {
          id: compareSession.id,
          userId: compareSession.userId,
          jobId: compareSession.jobId,
          repoName: compareSession.repoName,
          repoPath: compareSession.repoPath,
          totalFiles: compareSession.totalFiles,
          totalRoutes: compareSession.totalRoutes,
          healthScore: compareSession.healthScore,
          status: compareSession.status,
          scannedAt: compareSession.scannedAt,
          metadata: compareSession.metadata,
        },
        changes: {
          // ── File Changes ──
          files: {
            added: [...compareFiles].filter((f) => !baselineFiles.has(f)),
            removed: [...baselineFiles].filter((f) => !compareFiles.has(f)),
            modified: [...baselineFiles].filter((f) => compareFiles.has(f)),
          },

          // ── Route Changes ──
          routes: {
            added: [...compareRoutes].filter((r) => !baselineRoutes.has(r)),
            removed: [...baselineRoutes].filter((r) => !compareRoutes.has(r)),
            modified: [...baselineRoutes].filter((r) => compareRoutes.has(r)),
          },

          // ── Layer Changes ──
          layers: {
            added: [...compareLayers].filter((l) => !baselineLayers.has(l)),
            removed: [...baselineLayers].filter((l) => !compareLayers.has(l)),
            modified: [...baselineLayers].filter((l) => compareLayers.has(l)),
          },

          // ── Health Score Changes ──
          healthScore: {
            baseline: baselineSession.healthScore,
            compare: compareSession.healthScore,
            diff: compareSession.healthScore - baselineSession.healthScore,
          },

          // ── Total Files Changes ──
          totalFiles: {
            baseline: baselineSession.totalFiles,
            compare: compareSession.totalFiles,
            diff: compareSession.totalFiles - baselineSession.totalFiles,
          },

          // ✅ NEW: Environment Variables Changes
          envVars: {
            added: [...compareEnvVars].filter((e) => !baselineEnvVars.has(e)),
            removed: [...baselineEnvVars].filter((e) => !compareEnvVars.has(e)),
            modified: [],
          },

          // ✅ NEW: Database Changes
          database: {
            added: [...compareEntities].filter((e) => !baselineEntities.has(e)),
            removed: [...baselineEntities].filter(
              (e) => !compareEntities.has(e),
            ),
          },

          // ✅ NEW: Feature Changes
          features: {
            added: [...compareFeatures].filter((f) => !baselineFeatures.has(f)),
            removed: [...baselineFeatures].filter(
              (f) => !compareFeatures.has(f),
            ),
          },

          // ✅ NEW: Static Analysis Changes
          staticAnalysis: {
            baselineHealth,
            compareHealth,
            diff: compareHealth - baselineHealth,
          },
        },
      };

      logger.info(
        `✅ Generated diff report between ${baselineSessionId} and ${compareSessionId}`,
      );
      return diffReport;
    } catch (error) {
      logger.error(error as any, "❌ Failed to compare scans");
      throw error;
    }
  }

  /**
   * Save a comparison report
   */
  static async saveComparison(
    userId: string,
    baselineSessionId: string,
    compareSessionId: string,
    diffReport: DiffReport,
  ): Promise<any> {
    try {
      const { data, error } = await supabase
        .from("scan_comparisons")
        .insert({
          user_id: userId,
          baseline_scan_id: baselineSessionId,
          compare_scan_id: compareSessionId,
          diff_report: diffReport,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error(error as any, "❌ Failed to save comparison");
      throw error;
    }
  }

  /**
   * Delete a scan and its associated data
   */
  static async deleteScan(sessionId: string, userId: string): Promise<void> {
    try {
      // Verify ownership
      const isOwner = await this.verifyOwnership(sessionId, userId);
      if (!isOwner) {
        throw new Error("Unauthorized: You do not own this scan");
      }

      const { error } = await supabase
        .from("scan_sessions")
        .delete()
        .eq("id", sessionId)
        .eq("user_id", userId); // Double-check in delete

      if (error) throw error;
      logger.info(`✅ Deleted scan session ${sessionId} by user ${userId}`);
    } catch (error) {
      logger.error(error as any, `❌ Failed to delete scan ${sessionId}`);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats(userId: string): Promise<UserScanStats> {
    try {
      const history = await this.getScanHistory(userId);

      if (history.length === 0) {
        return {
          totalScans: 0,
          averageHealth: 0,
          totalFiles: 0,
          totalRoutes: 0,
          lastScan: null,
        };
      }

      const totalHealth = history.reduce((sum, s) => sum + s.healthScore, 0);
      const totalFiles = history.reduce((sum, s) => sum + s.totalFiles, 0);
      const totalRoutes = history.reduce((sum, s) => sum + s.totalRoutes, 0);

      return {
        totalScans: history.length,
        averageHealth: Math.round(totalHealth / history.length),
        totalFiles,
        totalRoutes,
        lastScan: history[0] || null,
      };
    } catch (error) {
      logger.error(error as any, "❌ Failed to get user stats");
      throw error;
    }
  }

  // ── ADMIN METHODS ──

  /**
   * Soft delete a scan (admin only)
   */
  static async softDeleteScan(
    scanId: string,
    adminId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // First, get the scan to check status
      const { data: scan, error: findError } = await supabase
        .from("scan_sessions")
        .select("status")
        .eq("id", scanId)
        .single();

      if (findError || !scan) {
        throw new Error("Scan not found");
      }

      // Prevent deleting active scans
      if (scan.status === "queued" || scan.status === "processing") {
        throw new Error("Cannot delete a scan while it is processing");
      }

      // Soft delete the scan
      const { error: updateError } = await supabase
        .from("scan_sessions")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: adminId,
          status: "deleted",
        })
        .eq("id", scanId);

      if (updateError) throw updateError;

      // Clear Redis cache (if redis is available)
      try {
        const { redis } = await import("../../core/redis/index.js");
        await redis.del(`job:${scanId}`);
        await redis.del(`job:${scanId}:result`);
        await redis.del(`job:${scanId}:status`);
      } catch (redisError) {
        // Redis might not be configured, log but continue
        logger.warn(`Redis not available for cache clearing: ${redisError}`);
      }

      logger.info(`Admin ${adminId} soft deleted scan ${scanId}`);

      return {
        success: true,
        message: "Scan and associated analysis data deleted successfully",
      };
    } catch (error) {
      logger.error({ error }, `Failed to delete scan ${scanId}`);
      throw error;
    }
  }

  /**
   * Admin get all scans (including deleted)
   */
  static async adminGetAllScans(
    includeDeleted: boolean = false,
  ): Promise<ScanSession[]> {
    try {
      let query = supabase
        .from("scan_sessions")
        .select("*")
        .order("scanned_at", { ascending: false });

      if (!includeDeleted) {
        query = query.is("deleted_at", null);
      }

      const { data, error } = await query;

      if (error) {
        // Fallback for deployments where the soft-delete columns have not
        // been migrated yet.
        const missingColumn = (error.message || "").includes("deleted_at");
        if (!missingColumn) throw error;

        logger.warn("deleted_at column not found – skipping soft-delete filter for admin scans");
        const fallback = await supabase
          .from("scan_sessions")
          .select("*")
          .order("scanned_at", { ascending: false });

        if (fallback.error) throw fallback.error;
        return (fallback.data || []).map(this.mapScanRow);
      }

      return (data || []).map(this.mapScanRow);
    } catch (error) {
      logger.error({ error }, "Failed to get all scans");
      throw error;
    }
  }

  /**
   * Admin restore a soft-deleted scan
   */
  static async adminRestoreScan(
    scanId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from("scan_sessions")
        .update({
          deleted_at: null,
          deleted_by: null,
          status: "completed",
        })
        .eq("id", scanId);

      if (error) throw error;

      logger.info(`Scan ${scanId} restored by admin`);

      return {
        success: true,
        message: "Scan restored successfully",
      };
    } catch (error) {
      logger.error({ error }, `Failed to restore scan ${scanId}`);
      throw error;
    }
  }

  /**
   * Hard delete (permanent) - use sparingly
   */
  static async permanentDeleteScan(scanId: string): Promise<void> {
    try {
      // Delete snapshots first (if not cascading)
      const { error: snapError } = await supabase
        .from("scan_snapshots")
        .delete()
        .eq("session_id", scanId);

      if (snapError) throw snapError;

      // Delete session
      const { error: sessionError } = await supabase
        .from("scan_sessions")
        .delete()
        .eq("id", scanId);

      if (sessionError) throw sessionError;

      // Clear Redis cache
      try {
        const { redis } = await import("../../core/redis/index.js");
        await redis.del(`job:${scanId}`);
        await redis.del(`job:${scanId}:result`);
        await redis.del(`job:${scanId}:status`);
      } catch (redisError) {
        logger.warn(`Redis not available for cache clearing: ${redisError}`);
      }

      logger.info(`Scan ${scanId} permanently deleted`);
    } catch (error) {
      logger.error({ error }, `Failed to permanently delete scan ${scanId}`);
      throw error;
    }
  }
}
