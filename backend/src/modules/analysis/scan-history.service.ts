import { supabase } from "../../core/supabase/index.js";
import { logger } from "../../core/logger/index.js";
import { 
  ScanSession, 
  ScanSnapshot, 
  DiffReport, 
  UserScanStats 
} from "@shared/types";

export class ScanHistoryService {
  /**
   * Save a completed scan to the database
   */
  static async saveScan(
    userId: string, 
    jobId: string, 
    analysisResult: any
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
        .from('scan_sessions')
        .insert({
          user_id: userId,
          job_id: jobId,
          repo_name: analysisResult.metadata?.repoName || 'Unknown Repository',
          repo_path: analysisResult.metadata?.repoPath || '',
          total_files: overview.totalFiles || files.length,
          total_routes: overview.totalRoutes || routes.length,
          health_score: overview.healthScore || staticAnalysis.healthScore || 0,
          status: 'completed',
          metadata: analysisResult.metadata || {},
        })
        .select()
        .single();

      if (sessionError) {
        logger.error(sessionError, 'Session insert error');
        throw sessionError;
      }

      // 2. Insert snapshot with full analysis data
      const { error: snapshotError } = await supabase
        .from('scan_snapshots')
        .insert({
          session_id: session.id,
          architecture: architecture,
          graph: graph,
          static_analysis: staticAnalysis,
          files: files,
          routes: routes,
          dependencies: analysisResult.dependencies || [],
        });

      if (snapshotError) {
        logger.error(snapshotError, 'Snapshot insert error');
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
      logger.error(error as any, '❌ Failed to save scan');
      throw error;
    }
  }

  /**
   * Get all scans for a user
   */
  static async getScanHistory(userId: string): Promise<ScanSession[]> {
    try {
      const { data, error } = await supabase
        .from('scan_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('scanned_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((row: any) => ({
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
      }));
    } catch (error) {
      logger.error(error as any, '❌ Failed to get scan history');
      throw error;
    }
  }

  /**
   * Get a scan session by job ID
   */
  static async getScanSessionByJobId(jobId: string): Promise<ScanSession | null> {
    try {
      const { data, error } = await supabase
        .from('scan_sessions')
        .select('*')
        .eq('job_id', jobId)
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
      logger.error(error as any, `❌ Failed to get scan session for job ${jobId}`);
      return null;
    }
  }

  /**
   * Get a scan session by session ID (UUID)
   */
  static async getScanSessionById(sessionId: string): Promise<ScanSession | null> {
    try {
      const { data, error } = await supabase
        .from('scan_sessions')
        .select('*')
        .eq('id', sessionId)
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
  static async getScanSnapshot(sessionId: string): Promise<ScanSnapshot | null> {
    try {
      const { data, error } = await supabase
        .from('scan_snapshots')
        .select('*')
        .eq('session_id', sessionId)
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
        createdAt: data.created_at,
      };
    } catch (error) {
      logger.error(error as any, `❌ Failed to get scan snapshot for session ${sessionId}`);
      return null;
    }
  }

  /**
   * Get full analysis result by job ID (for reloading dashboards)
   */
  static async getFullAnalysisResult(jobId: string): Promise<any | null> {
    try {
      // First get the session
      const session = await this.getScanSessionByJobId(jobId);
      if (!session) return null;

      // Then get the snapshot
      const snapshot = await this.getScanSnapshot(session.id);
      if (!snapshot) return null;

      // Reconstruct the full analysis result
      return {
        files: snapshot.files || [],
        routes: snapshot.routes || [],
        architecture: snapshot.architecture || {},
        graph: snapshot.graph || {},
        staticAnalysis: snapshot.staticAnalysis || {},
        dependencies: snapshot.dependencies || [],
        overview: {
          totalFiles: session.totalFiles,
          totalRoutes: session.totalRoutes,
          healthScore: session.healthScore,
        },
        metadata: session.metadata || {},
        jobId: session.jobId,
        scannedAt: session.scannedAt,
      };
    } catch (error) {
      logger.error(error as any, `❌ Failed to get full analysis for job ${jobId}`);
      return null;
    }
  }

  /**
   * Compare two scans and generate a diff report
   */
  static async compareScans(
    baselineSessionId: string,
    compareSessionId: string
  ): Promise<DiffReport> {
    try {
      // Get both sessions
      const baselineSession = await this.getScanSessionById(baselineSessionId);
      const compareSession = await this.getScanSessionById(compareSessionId);

      if (!baselineSession || !compareSession) {
        throw new Error('One or both scan sessions not found');
      }

      // Get both snapshots
      const baselineSnapshot = await this.getScanSnapshot(baselineSessionId);
      const compareSnapshot = await this.getScanSnapshot(compareSessionId);

      if (!baselineSnapshot || !compareSnapshot) {
        throw new Error('One or both scan snapshots not found');
      }

      // Extract file paths
      const baselineFiles = new Set(
        (baselineSnapshot.files || []).map((f: any) => f.path || f)
      );
      const compareFiles = new Set(
        (compareSnapshot.files || []).map((f: any) => f.path || f)
      );

      // Extract route paths
      const baselineRoutes = new Set(
        (baselineSnapshot.routes || []).map((r: any) => r.path || r)
      );
      const compareRoutes = new Set(
        (compareSnapshot.routes || []).map((r: any) => r.path || r)
      );

      // Extract layer names
      const baselineLayers = new Set(
        Object.keys(baselineSnapshot.architecture?.layers || {})
      );
      const compareLayers = new Set(
        Object.keys(compareSnapshot.architecture?.layers || {})
      );

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
          files: {
            added: [...compareFiles].filter(f => !baselineFiles.has(f)),
            removed: [...baselineFiles].filter(f => !compareFiles.has(f)),
            modified: [...baselineFiles].filter(f => compareFiles.has(f)),
          },
          routes: {
            added: [...compareRoutes].filter(r => !baselineRoutes.has(r)),
            removed: [...baselineRoutes].filter(r => !compareRoutes.has(r)),
            modified: [...baselineRoutes].filter(r => compareRoutes.has(r)),
          },
          layers: {
            added: [...compareLayers].filter(l => !baselineLayers.has(l)),
            removed: [...baselineLayers].filter(l => !compareLayers.has(l)),
            modified: [...baselineLayers].filter(l => compareLayers.has(l)),
          },
          healthScore: {
            baseline: baselineSession.healthScore,
            compare: compareSession.healthScore,
            diff: compareSession.healthScore - baselineSession.healthScore,
          },
          totalFiles: {
            baseline: baselineSession.totalFiles,
            compare: compareSession.totalFiles,
            diff: compareSession.totalFiles - baselineSession.totalFiles,
          },
        },
      };

      logger.info(`✅ Generated diff report between ${baselineSessionId} and ${compareSessionId}`);
      return diffReport;
    } catch (error) {
      logger.error(error as any, '❌ Failed to compare scans');
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
    diffReport: DiffReport
  ): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('scan_comparisons')
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
      logger.error(error as any, '❌ Failed to save comparison');
      throw error;
    }
  }

  /**
   * Delete a scan and its associated data
   */
  static async deleteScan(sessionId: string): Promise<void> {
    try {
      // This will cascade delete snapshots due to foreign key
      const { error } = await supabase
        .from('scan_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      logger.info(`✅ Deleted scan session ${sessionId}`);
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
      logger.error(error as any, '❌ Failed to get user stats');
      throw error;
    }
  }
}
