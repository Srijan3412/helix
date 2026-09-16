"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Copy,
  Check,
  Star,
  Play,
  RotateCcw,
  Layers,
  Zap,
  Clock,
  Database,
  BarChart3,
  Shield,
  Lock,
  Globe,
  FileCode,
  Tag,
  SlidersHorizontal,
  Folder,
  Code2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  GitBranch,
  MapPin,
  Flame,
  ArrowRight,
  Info,
  Server,
  Settings,
  Bell,
  User,
  Radio,
  Share2,
  CheckSquare,
  Square,
  Filter,
  Eye,
  Key,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface RouteItem {
  id: string;
  path: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  module: string;
  description: string;
  detailedDescription?: string;
  isPublic: boolean;
  version: string;
  tag: string;
  file: string;
  lines: string;
  controller: string;
  service: string;
  metrics: {
    successRate: string;
    avgResponseTime: string;
    dbActivity: string;
    usage: string;
  };
  dependencies: { name: string; version: string; type: "package" | "internal" }[];
  request: {
    contentType: string;
    body: Record<string, any>;
    headers: { key: string; value: string }[];
    queryParams: { key: string; value: string }[];
  };
  response: {
    statusCode: number;
    statusText: string;
    body: Record<string, any>;
    headers: { key: string; value: string }[];
  };
  relatedRoutes?: string[];
}

const DEFAULT_ROUTES: RouteItem[] = [
  // ── Authentication ──
  {
    id: "auth-signin",
    path: "/api/auth/signin",
    method: "POST",
    module: "Authentication",
    description: "Handle login for existing users",
    detailedDescription:
      "Authenticates an existing user with email and password. Returns a JWT token and user details on successful login.",
    isPublic: true,
    version: "v1",
    tag: "@auth",
    file: "backend/src/routes/auth.routes.ts",
    lines: "12 - 28",
    controller: "AuthController.signin",
    service: "AuthService",
    metrics: {
      successRate: "100%",
      avgResponseTime: "248 ms",
      dbActivity: "No queries",
      usage: "1.2K",
    },
    dependencies: [
      { name: "bcrypt", version: "^5.1.0", type: "package" },
      { name: "jsonwebtoken", version: "^9.0.0", type: "package" },
      { name: "UserService", version: "Internal", type: "internal" },
      { name: "Database", version: "Internal", type: "internal" },
    ],
    request: {
      contentType: "application/json",
      body: {
        email: "user@example.com",
        password: "********",
      },
      headers: [
        { key: "Content-Type", value: "application/json" },
        { key: "Accept", value: "application/json" },
      ],
      queryParams: [],
    },
    response: {
      statusCode: 200,
      statusText: "OK",
      body: {
        success: true,
        user: {
          id: "user_123",
          email: "user@example.com",
          name: "John Doe",
        },
        token: "eyJhbGciOi...",
      },
      headers: [
        { key: "Content-Type", value: "application/json" },
        { key: "Cache-Control", value: "no-cache" },
        { key: "X-RateLimit-Limit", value: "100" },
        { key: "X-RateLimit-Remaining", value: "98" },
      ],
    },
    relatedRoutes: [
      "/api/auth/signup",
      "/api/auth/verify-otp",
      "/api/auth/resend-otp",
      "/api/auth/session",
    ],
  },
  {
    id: "auth-signup",
    path: "/api/auth/signup",
    method: "POST",
    module: "Authentication",
    description: "Create new account",
    detailedDescription:
      "Registers a new account, validates email format and password strength, and sends a verification email.",
    isPublic: true,
    version: "v1",
    tag: "@auth",
    file: "backend/src/routes/auth.routes.ts",
    lines: "30 - 52",
    controller: "AuthController.signup",
    service: "AuthService",
    metrics: {
      successRate: "99.2%",
      avgResponseTime: "310 ms",
      dbActivity: "1 write",
      usage: "850",
    },
    dependencies: [
      { name: "bcrypt", version: "^5.1.0", type: "package" },
      { name: "nodemailer", version: "^6.9.1", type: "package" },
      { name: "UserRepository", version: "Internal", type: "internal" },
    ],
    request: {
      contentType: "application/json",
      body: {
        name: "Jane Doe",
        email: "jane@example.com",
        password: "********",
      },
      headers: [{ key: "Content-Type", value: "application/json" }],
      queryParams: [],
    },
    response: {
      statusCode: 201,
      statusText: "Created",
      body: {
        success: true,
        message: "Verification email sent",
        userId: "user_456",
      },
      headers: [{ key: "Content-Type", value: "application/json" }],
    },
    relatedRoutes: ["/api/auth/signin", "/api/auth/verify-otp"],
  },
  {
    id: "auth-verify-otp",
    path: "/api/auth/verify-otp",
    method: "POST",
    module: "Authentication",
    description: "Verify OTP code",
    detailedDescription:
      "Validates one-time numeric passcode for two-factor authentication or account email activation.",
    isPublic: true,
    version: "v1",
    tag: "@auth",
    file: "backend/src/routes/auth.routes.ts",
    lines: "54 - 76",
    controller: "AuthController.verifyOtp",
    service: "AuthService",
    metrics: {
      successRate: "98.7%",
      avgResponseTime: "120 ms",
      dbActivity: "Redis check",
      usage: "620",
    },
    dependencies: [
      { name: "ioredis", version: "^5.3.2", type: "package" },
      { name: "AuthService", version: "Internal", type: "internal" },
    ],
    request: {
      contentType: "application/json",
      body: {
        userId: "user_123",
        code: "492019",
      },
      headers: [{ key: "Content-Type", value: "application/json" }],
      queryParams: [],
    },
    response: {
      statusCode: 200,
      statusText: "OK",
      body: {
        verified: true,
        token: "eyJhbGciOi...",
      },
      headers: [{ key: "Content-Type", value: "application/json" }],
    },
    relatedRoutes: ["/api/auth/signin", "/api/auth/resend-otp"],
  },
  {
    id: "auth-resend-otp",
    path: "/api/auth/resend-otp",
    method: "POST",
    module: "Authentication",
    description: "Resend OTP code",
    detailedDescription:
      "Generates and dispatches a fresh 6-digit verification code to the registered email address with rate limiting.",
    isPublic: true,
    version: "v1",
    tag: "@auth",
    file: "backend/src/routes/auth.routes.ts",
    lines: "78 - 94",
    controller: "AuthController.resendOtp",
    service: "AuthService",
    metrics: {
      successRate: "99.8%",
      avgResponseTime: "185 ms",
      dbActivity: "Redis write",
      usage: "140",
    },
    dependencies: [
      { name: "ioredis", version: "^5.3.2", type: "package" },
      { name: "MailService", version: "Internal", type: "internal" },
    ],
    request: {
      contentType: "application/json",
      body: {
        userId: "user_123",
      },
      headers: [{ key: "Content-Type", value: "application/json" }],
      queryParams: [],
    },
    response: {
      statusCode: 200,
      statusText: "OK",
      body: {
        status: "sent",
        expiresIn: 300,
      },
      headers: [{ key: "Content-Type", value: "application/json" }],
    },
    relatedRoutes: ["/api/auth/verify-otp", "/api/auth/signin"],
  },
  {
    id: "auth-check-verification",
    path: "/api/auth/check-verification/:userId",
    method: "GET",
    module: "Authentication",
    description: "Check verification status",
    detailedDescription:
      "Inspects if the specified user account has completed email or multi-factor verification.",
    isPublic: true,
    version: "v1",
    tag: "@auth",
    file: "backend/src/routes/auth.routes.ts",
    lines: "96 - 110",
    controller: "AuthController.checkStatus",
    service: "AuthService",
    metrics: {
      successRate: "100%",
      avgResponseTime: "95 ms",
      dbActivity: "1 read",
      usage: "2.4K",
    },
    dependencies: [
      { name: "UserRepository", version: "Internal", type: "internal" },
    ],
    request: {
      contentType: "application/json",
      body: {},
      headers: [{ key: "Accept", value: "application/json" }],
      queryParams: [{ key: "userId", value: "user_123" }],
    },
    response: {
      statusCode: 200,
      statusText: "OK",
      body: {
        isVerified: true,
        verifiedAt: "2026-09-12T14:20:00Z",
      },
      headers: [{ key: "Content-Type", value: "application/json" }],
    },
    relatedRoutes: ["/api/auth/signin", "/api/auth/signup"],
  },
  {
    id: "auth-logout",
    path: "/api/auth/logout",
    method: "POST",
    module: "Authentication",
    description: "Handle logout",
    detailedDescription:
      "Invalidates the current session token, cleans up Redis session store, and clears client cookies.",
    isPublic: false,
    version: "v1",
    tag: "@auth",
    file: "backend/src/routes/auth.routes.ts",
    lines: "112 - 128",
    controller: "AuthController.logout",
    service: "AuthService",
    metrics: {
      successRate: "100%",
      avgResponseTime: "85 ms",
      dbActivity: "Redis del",
      usage: "950",
    },
    dependencies: [
      { name: "ioredis", version: "^5.3.2", type: "package" },
    ],
    request: {
      contentType: "application/json",
      body: {},
      headers: [
        { key: "Authorization", value: "Bearer eyJhbGciOi..." },
      ],
      queryParams: [],
    },
    response: {
      statusCode: 200,
      statusText: "OK",
      body: { success: true, message: "Logged out successfully" },
      headers: [{ key: "Content-Type", value: "application/json" }],
    },
    relatedRoutes: ["/api/auth/signin", "/api/auth/refresh"],
  },
  {
    id: "auth-refresh",
    path: "/api/auth/refresh",
    method: "POST",
    module: "Authentication",
    description: "Refresh access token",
    detailedDescription:
      "Validates refresh token and issues a new short-lived access JWT without requiring re-authentication.",
    isPublic: true,
    version: "v1",
    tag: "@auth",
    file: "backend/src/routes/auth.routes.ts",
    lines: "130 - 148",
    controller: "AuthController.refresh",
    service: "AuthService",
    metrics: {
      successRate: "99.9%",
      avgResponseTime: "110 ms",
      dbActivity: "Redis read",
      usage: "4.1K",
    },
    dependencies: [
      { name: "jsonwebtoken", version: "^9.0.0", type: "package" },
    ],
    request: {
      contentType: "application/json",
      body: { refreshToken: "d8f92j90..." },
      headers: [{ key: "Content-Type", value: "application/json" }],
      queryParams: [],
    },
    response: {
      statusCode: 200,
      statusText: "OK",
      body: { token: "eyJhbGciOi...", expiresIn: 3600 },
      headers: [{ key: "Content-Type", value: "application/json" }],
    },
    relatedRoutes: ["/api/auth/signin", "/api/auth/logout"],
  },

  // ── User Management ──
  {
    id: "users-list",
    path: "/api/users",
    method: "GET",
    module: "User Management",
    description: "List all users with pagination",
    detailedDescription:
      "Fetches paginated list of active users, supporting query filters for role, team, and account status.",
    isPublic: false,
    version: "v1",
    tag: "@users",
    file: "backend/src/routes/user.routes.ts",
    lines: "10 - 32",
    controller: "UserController.listUsers",
    service: "UserService",
    metrics: {
      successRate: "99.5%",
      avgResponseTime: "165 ms",
      dbActivity: "1 read (indexed)",
      usage: "3.8K",
    },
    dependencies: [
      { name: "prisma", version: "^5.14.0", type: "package" },
      { name: "UserService", version: "Internal", type: "internal" },
    ],
    request: {
      contentType: "application/json",
      body: {},
      headers: [{ key: "Authorization", value: "Bearer eyJhbGciOi..." }],
      queryParams: [
        { key: "page", value: "1" },
        { key: "limit", value: "20" },
      ],
    },
    response: {
      statusCode: 200,
      statusText: "OK",
      body: {
        users: [
          { id: "usr_1", name: "Alice", email: "alice@test.com", role: "admin" },
          { id: "usr_2", name: "Bob", email: "bob@test.com", role: "developer" },
        ],
        total: 148,
        page: 1,
      },
      headers: [{ key: "Content-Type", value: "application/json" }],
    },
    relatedRoutes: ["/api/users/:id", "/api/users/profile"],
  },
  {
    id: "users-detail",
    path: "/api/users/:id",
    method: "GET",
    module: "User Management",
    description: "Get user details by ID",
    detailedDescription:
      "Retrieves single user profile with workspace permissions and metadata.",
    isPublic: false,
    version: "v1",
    tag: "@users",
    file: "backend/src/routes/user.routes.ts",
    lines: "34 - 55",
    controller: "UserController.getUser",
    service: "UserService",
    metrics: {
      successRate: "100%",
      avgResponseTime: "90 ms",
      dbActivity: "1 read",
      usage: "5.2K",
    },
    dependencies: [
      { name: "UserRepository", version: "Internal", type: "internal" },
    ],
    request: {
      contentType: "application/json",
      body: {},
      headers: [{ key: "Authorization", value: "Bearer eyJhbGciOi..." }],
      queryParams: [{ key: "id", value: "usr_1" }],
    },
    response: {
      statusCode: 200,
      statusText: "OK",
      body: {
        id: "usr_1",
        name: "Alice Smith",
        email: "alice@test.com",
        role: "admin",
        createdAt: "2026-01-10",
      },
      headers: [{ key: "Content-Type", value: "application/json" }],
    },
    relatedRoutes: ["/api/users", "/api/users/:id/update"],
  },

  // ── Admin ──
  {
    id: "admin-scans",
    path: "/api/admin/scans",
    method: "GET",
    module: "Admin",
    description: "List all repository scans",
    detailedDescription:
      "Admin endpoint to audit all system AST parses, vulnerability checks, and architecture analyses across tenants.",
    isPublic: false,
    version: "v1",
    tag: "@admin",
    file: "backend/src/routes/admin.routes.ts",
    lines: "15 - 40",
    controller: "AdminController.listScans",
    service: "ScanService",
    metrics: {
      successRate: "99.8%",
      avgResponseTime: "290 ms",
      dbActivity: "2 reads",
      usage: "450",
    },
    dependencies: [
      { name: "bullmq", version: "^5.8.0", type: "package" },
      { name: "ScanRepository", version: "Internal", type: "internal" },
    ],
    request: {
      contentType: "application/json",
      body: {},
      headers: [{ key: "Authorization", value: "Bearer eyJhbGciOi..." }],
      queryParams: [{ key: "limit", value: "50" }],
    },
    response: {
      statusCode: 200,
      statusText: "OK",
      body: {
        scans: [
          { id: "scan_01", repo: "helix.git", status: "completed", score: 92 },
          { id: "scan_02", repo: "api-hub.git", status: "completed", score: 88 },
        ],
      },
      headers: [{ key: "Content-Type", value: "application/json" }],
    },
    relatedRoutes: ["/api/admin/users", "/api/admin/system-health"],
  },
  {
    id: "admin-delete-user",
    path: "/api/admin/users/:id",
    method: "DELETE",
    module: "Admin",
    description: "Delete user account and revoke access",
    detailedDescription:
      "Permanently deletes user account, clears API keys, and invalidates active JWT sessions.",
    isPublic: false,
    version: "v1",
    tag: "@admin",
    file: "backend/src/routes/admin.routes.ts",
    lines: "45 - 68",
    controller: "AdminController.deleteUser",
    service: "UserService",
    metrics: {
      successRate: "100%",
      avgResponseTime: "175 ms",
      dbActivity: "Cascade delete",
      usage: "35",
    },
    dependencies: [
      { name: "UserService", version: "Internal", type: "internal" },
      { name: "AuditLogger", version: "Internal", type: "internal" },
    ],
    request: {
      contentType: "application/json",
      body: {},
      headers: [{ key: "Authorization", value: "Bearer eyJhbGciOi..." }],
      queryParams: [{ key: "id", value: "usr_99" }],
    },
    response: {
      statusCode: 200,
      statusText: "OK",
      body: { deleted: true, userId: "usr_99" },
      headers: [{ key: "Content-Type", value: "application/json" }],
    },
    relatedRoutes: ["/api/admin/scans", "/api/users"],
  },

  // ── Analytics ──
  {
    id: "analytics-summary",
    path: "/api/analysis/summary",
    method: "GET",
    module: "Analytics",
    description: "Get repository metrics & score breakdown",
    detailedDescription:
      "Calculates code health, architectural modularity, circular import risk, and security confidence scores.",
    isPublic: false,
    version: "v1",
    tag: "@analytics",
    file: "backend/src/routes/analysis.routes.ts",
    lines: "12 - 45",
    controller: "AnalysisController.getSummary",
    service: "MetricsEngine",
    metrics: {
      successRate: "100%",
      avgResponseTime: "340 ms",
      dbActivity: "Cache read",
      usage: "2.8K",
    },
    dependencies: [
      { name: "redis", version: "^4.6.13", type: "package" },
      { name: "MetricsEngine", version: "Internal", type: "internal" },
    ],
    request: {
      contentType: "application/json",
      body: {},
      headers: [{ key: "Authorization", value: "Bearer eyJhbGciOi..." }],
      queryParams: [],
    },
    response: {
      statusCode: 200,
      statusText: "OK",
      body: {
        score: 85,
        totalFiles: 326,
        linesOfCode: 39120,
        layersDetected: 6,
      },
      headers: [{ key: "Content-Type", value: "application/json" }],
    },
    relatedRoutes: ["/api/analysis/trends", "/api/analysis/export"],
  },

  // ── Notifications ──
  {
    id: "notifications-webhook",
    path: "/api/notifications/webhook",
    method: "POST",
    module: "Notifications",
    description: "Receive external alert webhooks",
    detailedDescription:
      "Webhook receiver for CI/CD pipelines, GitHub Actions dispatch, and automated architectural drift alerts.",
    isPublic: true,
    version: "v1",
    tag: "@notifications",
    file: "backend/src/routes/notification.routes.ts",
    lines: "18 - 42",
    controller: "NotificationController.handleWebhook",
    service: "NotificationService",
    metrics: {
      successRate: "99.9%",
      avgResponseTime: "75 ms",
      dbActivity: "Queue push",
      usage: "9.4K",
    },
    dependencies: [
      { name: "bullmq", version: "^5.8.0", type: "package" },
    ],
    request: {
      contentType: "application/json",
      body: {
        event: "scan.completed",
        scanId: "scn_99",
        score: 89,
      },
      headers: [
        { key: "X-Helix-Signature", value: "sha256=abc..." },
      ],
      queryParams: [],
    },
    response: {
      statusCode: 200,
      statusText: "OK",
      body: { received: true, queuedAt: "2026-09-12T20:30:00Z" },
      headers: [{ key: "Content-Type", value: "application/json" }],
    },
    relatedRoutes: ["/api/analysis/summary"],
  },

  // ── Core System ──
  {
    id: "core-health",
    path: "/health",
    method: "GET",
    module: "Core System",
    description: "Liveness and readiness health check",
    detailedDescription:
      "Health probing endpoint for Kubernetes / Docker container orchestrators reporting memory, redis, and DB connectivity.",
    isPublic: true,
    version: "v1",
    tag: "@core",
    file: "backend/src/routes/health.routes.ts",
    lines: "5 - 20",
    controller: "HealthController.check",
    service: "HealthService",
    metrics: {
      successRate: "100%",
      avgResponseTime: "12 ms",
      dbActivity: "Ping",
      usage: "45K",
    },
    dependencies: [
      { name: "pg", version: "^8.11.5", type: "package" },
      { name: "ioredis", version: "^5.3.2", type: "package" },
    ],
    request: {
      contentType: "application/json",
      body: {},
      headers: [{ key: "Accept", value: "application/json" }],
      queryParams: [],
    },
    response: {
      statusCode: 200,
      statusText: "OK",
      body: {
        status: "healthy",
        uptime: 89402,
        db: "connected",
        redis: "connected",
      },
      headers: [{ key: "Content-Type", value: "application/json" }],
    },
    relatedRoutes: ["/api/auth/signin", "/api/analysis/summary"],
  },
];

const METHOD_THEMES: Record<
  string,
  { badge: string; text: string; bg: string; border: string }
> = {
  GET: {
    badge: "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30",
    text: "text-[#10B981]",
    bg: "bg-[#10B981]/10",
    border: "border-[#10B981]/30",
  },
  POST: {
    badge: "bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30",
    text: "text-[#3B82F6]",
    bg: "bg-[#3B82F6]/10",
    border: "border-[#3B82F6]/30",
  },
  PUT: {
    badge: "bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/30",
    text: "text-[#8B5CF6]",
    bg: "bg-[#8B5CF6]/10",
    border: "border-[#8B5CF6]/30",
  },
  PATCH: {
    badge: "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30",
    text: "text-[#F59E0B]",
    bg: "bg-[#F59E0B]/10",
    border: "border-[#F59E0B]/30",
  },
  DELETE: {
    badge: "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30",
    text: "text-[#EF4444]",
    bg: "bg-[#EF4444]/10",
    border: "border-[#EF4444]/30",
  },
};

const MODULE_ICONS: Record<string, any> = {
  Authentication: Key,
  "User Management": User,
  Admin: Shield,
  Analytics: BarChart3,
  Notifications: Bell,
  "Core System": Server,
};

interface RouteAnalysisWorkspaceProps {
  result?: any;
  onSwitchTab?: (tab: string) => void;
  onSelectTraceRouteId?: (routeId: string) => void;
  initialSelectedRouteId?: string;
}

export default function RouteAnalysisWorkspace({
  result,
  onSwitchTab,
  onSelectTraceRouteId,
  initialSelectedRouteId,
}: RouteAnalysisWorkspaceProps) {
  // Global & Local Search State
  const [globalSearch, setGlobalSearch] = useState("");
  const [browserSearch, setBrowserSearch] = useState("");
  const [activeMethodFilter, setActiveMethodFilter] = useState<string | null>(null);

  // Selected Route State
  const [selectedRouteId, setSelectedRouteId] = useState<string>(
    initialSelectedRouteId || "auth-signin"
  );
  const [starredRoutes, setStarredRoutes] = useState<Set<string>>(new Set());
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<
    "overview" | "request" | "response" | "dependencies" | "traces" | "tests"
  >("overview");

  // Accordion Toggles
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({
    Authentication: true,
    "User Management": true,
    Admin: true,
    Analytics: true,
    Notifications: true,
    "Core System": true,
  });
  const [isRequestOpen, setIsRequestOpen] = useState(true);
  const [isResponseOpen, setIsResponseOpen] = useState(true);
  const [isDependenciesOpen, setIsDependenciesOpen] = useState(true);

  // Subtabs within Request & Response
  const [requestSubTab, setRequestSubTab] = useState<"body" | "headers" | "params">("body");
  const [responseSubTab, setResponseSubTab] = useState<"body" | "headers" | "schema">("body");

  // Interactive Run simulator
  const [isRunning, setIsRunning] = useState(false);
  const [runCompleted, setRunCompleted] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleStar = (id: string) => {
    setStarredRoutes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleModule = (module: string) => {
    setOpenModules((prev) => ({ ...prev, [module]: !prev[module] }));
  };

  // Convert and generate rich route items from scan results
  const allRoutes: RouteItem[] = useMemo(() => {
    const depsMap: Record<string, string> = {
      ...(result?.metadata?.frameworkMetadata?.dependencies || {}),
      ...(result?.metadata?.frameworkMetadata?.devDependencies || {}),
    };
    const dbType = result?.metadata?.databaseInfo?.type || "Database";
    const dbFlows = result?.metadata?.databaseInfo?.flows || [];

    if (!result?.routes || result.routes.length === 0) {
      return DEFAULT_ROUTES;
    }

    const items: RouteItem[] = [];
    const seenIds = new Set<string>();

    result.routes.forEach((r: any, idx: number) => {
      let rawPath = String(r.path || "").trim();
      if (rawPath.startsWith("ROUTE:")) {
        const parts = rawPath.split(":");
        rawPath = parts.slice(2).join(":") || parts[1] || rawPath;
      }
      if (!rawPath.startsWith("/")) rawPath = "/" + rawPath;

      const rawMethod = (r.method || "GET").toUpperCase();
      const method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" =
        ["GET", "POST", "PUT", "PATCH", "DELETE"].includes(rawMethod) ? (rawMethod as any) : "GET";

      const routeId = `route-${idx}-${method.toLowerCase()}-${rawPath.replace(/[^a-zA-Z0-9]/g, "-")}`;
      if (seenIds.has(routeId)) return;
      seenIds.add(routeId);

      // Derive Module Name
      let moduleName = "Core System";
      const pathSegs = rawPath.split("/").filter(Boolean);
      const fileBase = r.file ? r.file.split(/[\\/]/).pop()?.replace(/\.(routes|router|controller|service|ts|js|py)$/i, "") : "";
      
      if (rawPath.includes("/auth") || rawPath.includes("/login") || rawPath.includes("/token")) {
        moduleName = "Authentication";
      } else if (rawPath.includes("/user") || rawPath.includes("/member") || rawPath.includes("/profile") || rawPath.includes("/account")) {
        moduleName = "User Management";
      } else if (rawPath.includes("/admin") || rawPath.includes("/tenant") || rawPath.includes("/organization")) {
        moduleName = "Admin";
      } else if (rawPath.includes("/analysis") || rawPath.includes("/metric") || rawPath.includes("/scan") || rawPath.includes("/report")) {
        moduleName = "Analytics";
      } else if (rawPath.includes("/notification") || rawPath.includes("/webhook") || rawPath.includes("/email") || rawPath.includes("/alert")) {
        moduleName = "Notifications";
      } else if (rawPath.includes("/billing") || rawPath.includes("/payment") || rawPath.includes("/invoice") || rawPath.includes("/checkout")) {
        moduleName = "Billing & Payments";
      } else if (pathSegs.length > 1 && pathSegs[0] === "api") {
        moduleName = pathSegs[1].charAt(0).toUpperCase() + pathSegs[1].slice(1);
      } else if (fileBase && fileBase.length > 2) {
        moduleName = fileBase.charAt(0).toUpperCase() + fileBase.slice(1);
      }

      // Check if public or protected
      const hasAuthMiddleware = (r.middleware || []).some((m: string) =>
        /auth|jwt|guard|protect|verify|session|token/i.test(m)
      );
      const isPublic = !hasAuthMiddleware && !rawPath.includes("/admin") && !rawPath.includes("/private");

      // Controller & Service
      const controller = r.handler || (r.controller ? `${r.controller}.${method.toLowerCase()}` : `${moduleName.replace(/\s+/g, "")}Controller`);
      const service = (r.chain || []).find((c: string) => /service|manager|engine/i.test(c)) || `${moduleName.replace(/\s+/g, "")}Service`;

      // Associated dependencies
      const routeFileObj = (result?.files || []).find((f: any) => f.path === r.file || (r.file && f.path.endsWith(r.file)));
      const fileExternalImports = routeFileObj?.externalImports || [];
      const fileInternalImports = routeFileObj?.internalImports || [];

      const dependencies: { name: string; version: string; type: "package" | "internal" }[] = [];
      fileExternalImports.slice(0, 4).forEach((pkg: string) => {
        dependencies.push({
          name: pkg,
          version: depsMap[pkg] || "^1.0.0",
          type: "package",
        });
      });
      if (fileInternalImports.length > 0) {
        dependencies.push({
          name: fileInternalImports[0].split(/[\\/]/).pop()?.replace(/\.[^.]+$/, "") || "InternalService",
          version: "Internal",
          type: "internal",
        });
      }
      // Check database flow
      const matchedDbFlow = dbFlows.find((f: any) => f.route === rawPath || rawPath.includes(f.route || ""));
      if (matchedDbFlow && matchedDbFlow.entities?.length > 0) {
        dependencies.push({
          name: `${dbType} (${matchedDbFlow.entities.slice(0, 2).join(", ")})`,
          version: dbType,
          type: "internal",
        });
      }

      // Parameters
      const pathParams = (rawPath.match(/:([a-zA-Z0-9_]+)/g) || []).map((p: string) => p.replace(":", ""));
      const queryParams = (r.params || pathParams).map((p: string) => ({ key: p, value: `sample_${p}` }));

      // Request Body
      let requestBody: Record<string, any> = {};
      if (method === "POST" || method === "PUT" || method === "PATCH") {
        if (rawPath.includes("auth") || rawPath.includes("login")) {
          requestBody = { email: "user@example.com", password: "••••••••" };
        } else if (rawPath.includes("scan") || rawPath.includes("analyze")) {
          requestBody = { repoUrl: "https://github.com/organization/repo", branch: "main" };
        } else if (pathParams.length > 0) {
          pathParams.forEach((param: string) => {
            requestBody[param] = `val_${param}`;
          });
        } else {
          requestBody = { name: "Sample Item", active: true };
        }
      }

      const headers = [
        { key: "Content-Type", value: "application/json" },
        ...(hasAuthMiddleware || !isPublic ? [{ key: "Authorization", value: "Bearer eyJhbGciOi..." }] : []),
      ];

      // Detailed Description
      const middlewareList = (r.middleware || []).join(", ");
      const chainList = (r.chain || []).join(" → ");
      let detailedDescription = `Handles HTTP ${method} requests for ${rawPath}.`;
      if (middlewareList) detailedDescription += ` Dispatches through middleware pipeline [${middlewareList}].`;
      if (chainList) detailedDescription += ` Execution call graph: ${chainList}.`;

      items.push({
        id: routeId,
        path: rawPath,
        method,
        module: moduleName,
        description: r.description || `${method} handler for ${rawPath}`,
        detailedDescription,
        isPublic,
        version: "v1",
        tag: `@${moduleName.toLowerCase().replace(/\s+/g, "-")}`,
        file: r.file || "backend/src/routes/api.routes.ts",
        lines: r.lines || `${r.lineStart || 1} - ${r.lineEnd || 35}`,
        controller,
        service,
        metrics: {
          successRate: "100%",
          avgResponseTime: `${Math.max(45, (routeFileObj?.lineCount || 30) * 3)} ms`,
          dbActivity: matchedDbFlow ? `${matchedDbFlow.entities.length} tables` : "AST Flow",
          usage: `${Math.max(120, (idx + 1) * 380)}`,
        },
        dependencies,
        request: {
          contentType: "application/json",
          body: requestBody,
          headers,
          queryParams,
        },
        response: {
          statusCode: method === "POST" ? 201 : 200,
          statusText: method === "POST" ? "Created" : "OK",
          body: {
            success: true,
            path: rawPath,
            timestamp: new Date().toISOString(),
            ...(matchedDbFlow?.entities?.length ? { entities: matchedDbFlow.entities } : {}),
          },
          headers: [{ key: "Content-Type", value: "application/json" }],
        },
        relatedRoutes: [],
      });
    });

    // Populate related routes by matching module
    items.forEach((item) => {
      item.relatedRoutes = items
        .filter((other) => other.id !== item.id && other.module === item.module)
        .slice(0, 3)
        .map((other) => other.path);
    });

    return items;
  }, [result]);

  // Method Counts for Header Badges
  const methodCounts = useMemo(() => {
    const counts = { GET: 0, POST: 0, DELETE: 0, PATCH: 0, PUT: 0, total: allRoutes.length };
    allRoutes.forEach((r) => {
      if (counts[r.method] !== undefined) counts[r.method]++;
    });
    return counts;
  }, [allRoutes]);

  // Filtered Routes
  const filteredRoutes = useMemo(() => {
    const searchFilter = (globalSearch || browserSearch).toLowerCase().trim();
    return allRoutes.filter((route) => {
      if (activeMethodFilter && route.method !== activeMethodFilter) return false;
      if (!searchFilter) return true;

      return (
        route.path.toLowerCase().includes(searchFilter) ||
        route.method.toLowerCase().includes(searchFilter) ||
        route.description.toLowerCase().includes(searchFilter) ||
        route.module.toLowerCase().includes(searchFilter) ||
        route.file.toLowerCase().includes(searchFilter) ||
        route.controller.toLowerCase().includes(searchFilter) ||
        route.tag.toLowerCase().includes(searchFilter)
      );
    });
  }, [allRoutes, globalSearch, browserSearch, activeMethodFilter]);

  // Group filtered routes by module
  const groupedRoutes = useMemo(() => {
    const groups: Record<string, RouteItem[]> = {};
    filteredRoutes.forEach((r) => {
      if (!groups[r.module]) groups[r.module] = [];
      groups[r.module].push(r);
    });
    return groups;
  }, [filteredRoutes]);

  // Active Selected Route Data
  const selectedRoute = useMemo(() => {
    return (
      allRoutes.find((r) => r.id === selectedRouteId || r.path === selectedRouteId) ||
      allRoutes[0]
    );
  }, [allRoutes, selectedRouteId]);

  const handleRunEndpoint = () => {
    setIsRunning(true);
    setRunCompleted(false);
    setTimeout(() => {
      setIsRunning(false);
      setRunCompleted(true);
      setTimeout(() => setRunCompleted(false), 3000);
    }, 650);
  };

  const handleViewInMetroMap = () => {
    onSelectTraceRouteId?.(selectedRoute.path);
    onSwitchTab?.("arch");
  };

  return (
    <div className="w-full h-full min-h-0 bg-[#06181D] text-[#F2F7F7] font-sans flex flex-col gap-3 text-left select-none overflow-hidden p-3 sm:p-3.5 rounded-2xl border border-[rgba(50,190,190,0.12)]">
      
      {/* ── 1. GLOBAL ROUTE ANALYSIS HEADER ───────────────────────────────── */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2.5 border-b border-[rgba(50,190,190,0.16)] shrink-0">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[2px] text-[#20D6D8]">
            ROUTE ANALYSIS
          </p>
          <h1 className="text-2xl sm:text-[32px] font-extrabold text-[#F2F7F7] tracking-tight leading-tight mt-0.5">
            API Endpoints
          </h1>
          <p className="text-xs sm:text-sm text-[#9BC9CE] mt-0.5">
            Browse and explore all API endpoints
          </p>
        </div>

        {/* Search Bar + Method Filter Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-[380px] lg:w-[420px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94ADB2]" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                setBrowserSearch(e.target.value);
              }}
              placeholder="Search routes by path, method, or file..."
              className="w-full h-10 pl-9 pr-9 rounded-xl bg-[#0A2025] border border-[rgba(50,190,190,0.2)] text-xs text-[#F2F7F7] placeholder-[#94ADB2]/70 focus:outline-none focus:border-[#13D7C1] transition shadow-sm"
            />
            {globalSearch && (
              <button
                onClick={() => {
                  setGlobalSearch("");
                  setBrowserSearch("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94ADB2] hover:text-[#F2F7F7]"
              >
                ×
              </button>
            )}
          </div>

          {/* Clickable Method Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(["GET", "POST", "DELETE", "PATCH"] as const).map((method) => {
              const count = methodCounts[method] || 0;
              const isActive = activeMethodFilter === method;
              const theme = METHOD_THEMES[method];

              return (
                <button
                  key={method}
                  onClick={() =>
                    setActiveMethodFilter((prev) => (prev === method ? null : method))
                  }
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? `${theme.bg} ${theme.text} ${theme.border} ring-1 ring-[#13D7C1] shadow-sm`
                      : "bg-[#0A2025] border-[rgba(50,190,190,0.18)] text-[#94ADB2] hover:text-[#F2F7F7] hover:border-[rgba(50,190,190,0.4)]"
                  }`}
                >
                  <span className={isActive ? theme.text : "text-[#F2F7F7]"}>{method}:</span>
                  <span>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── 2. THREE-COLUMN WORKSPACE ──────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch min-h-0 overflow-hidden">
        
        {/* ── COLUMN 1: ENDPOINT BROWSER (3 cols) ────────────────── */}
        <aside className="lg:col-span-3 xl:col-span-3 bg-[#0A2025] border border-[rgba(50,190,190,0.16)] rounded-2xl p-3 flex flex-col gap-2.5 overflow-hidden h-full min-h-0 select-none">
          {/* Top Search & Filter Bar */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94ADB2]" />
              <input
                type="text"
                value={browserSearch}
                onChange={(e) => setBrowserSearch(e.target.value)}
                placeholder="Search endpoints, tags, or files..."
                className="w-full h-8 pl-8 pr-3 rounded-lg bg-[#06181D] border border-[rgba(50,190,190,0.18)] text-[11px] text-[#F2F7F7] placeholder-[#94ADB2]/60 focus:outline-none focus:border-[#13D7C1] transition"
              />
            </div>
            <button
              onClick={() => setActiveMethodFilter(null)}
              className="w-8 h-8 rounded-lg bg-[#06181D] border border-[rgba(50,190,190,0.18)] text-[#94ADB2] hover:text-[#F2F7F7] flex items-center justify-center transition cursor-pointer"
              title="Reset Method Filters"
            >
              <SlidersHorizontal size={13} />
            </button>
          </div>

          {/* Quick Method Buttons */}
          <div className="flex items-center gap-1 shrink-0 overflow-x-auto pb-1 custom-scrollbar">
            <button
              onClick={() => setActiveMethodFilter(null)}
              className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold transition cursor-pointer shrink-0 ${
                activeMethodFilter === null
                  ? "bg-[#13D7C1]/20 text-[#13D7C1] border border-[#13D7C1]/40"
                  : "bg-[#06181D] text-[#94ADB2] hover:text-white"
              }`}
            >
              All {allRoutes.length}
            </button>
            {(["GET", "POST", "PUT", "DELETE"] as const).map((m) => {
              const count = methodCounts[m] || 0;
              const isActive = activeMethodFilter === m;
              return (
                <button
                  key={m}
                  onClick={() => setActiveMethodFilter(isActive ? null : m)}
                  className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold transition cursor-pointer shrink-0 ${
                    isActive
                      ? "bg-[#13D7C1]/20 text-[#13D7C1] border border-[#13D7C1]/40"
                      : "bg-[#06181D] text-[#94ADB2] hover:text-white"
                  }`}
                >
                  {m} {count}
                </button>
              );
            })}
          </div>

          {/* Accordion Grouped Module List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-0">
            {Object.entries(groupedRoutes).map(([moduleName, routes]) => {
              const isOpen = openModules[moduleName] ?? true;
              const ModuleIcon = MODULE_ICONS[moduleName] || Folder;

              return (
                <div key={moduleName} className="space-y-1">
                  {/* Module Group Header */}
                  <button
                    onClick={() => toggleModule(moduleName)}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-[#06181D]/80 hover:bg-[#0D272C] border border-[rgba(50,190,190,0.1)] transition text-xs font-bold text-[#F2F7F7] cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <ModuleIcon size={14} className="text-[#13D7C1]" />
                      <span className="truncate">{moduleName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold text-[#94ADB2] bg-[#0A2025] px-1.5 py-0.5 rounded">
                        {routes.length}
                      </span>
                      <ChevronDown
                        size={12}
                        className={`text-[#94ADB2] transition-transform duration-200 ${
                          isOpen ? "rotate-0" : "-rotate-90"
                        }`}
                      />
                    </div>
                  </button>

                  {/* Route Items List */}
                  {isOpen && (
                    <div className="space-y-1 pl-1">
                      {routes.map((route) => {
                        const isSelected = selectedRoute.id === route.id;
                        const theme = METHOD_THEMES[route.method] || METHOD_THEMES.GET;

                        return (
                          <div
                            key={route.id}
                            onClick={() => setSelectedRouteId(route.id)}
                            className={`p-2.5 rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-between gap-2.5 ${
                              isSelected
                                ? "bg-[#0A252B] border-[#13D7C1] shadow-[0_0_12px_rgba(19,215,193,0.15)] ring-1 ring-[#13D7C1]/30"
                                : "bg-[#06181D]/60 border-[rgba(50,190,190,0.08)] hover:border-[rgba(50,190,190,0.25)] hover:bg-[#0D272C]"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black font-mono tracking-wider border shrink-0 ${theme.badge}`}
                              >
                                {route.method}
                              </span>
                              <div className="min-w-0">
                                <span className="text-xs font-mono font-bold text-[#F2F7F7] truncate block leading-tight">
                                  {route.path}
                                </span>
                                <span className="text-[10px] text-[#94ADB2] truncate block mt-0.5">
                                  {route.description}
                                </span>
                              </div>
                            </div>

                            {/* Active Dot indicator */}
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-[#13D7C1] shadow-[0_0_6px_#13D7C1] shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── COLUMN 2: SELECTED ENDPOINT WORKSPACE (Center / 6 cols) ───────── */}
        <main className="lg:col-span-6 xl:col-span-6 bg-[#0A2025] border border-[rgba(50,190,190,0.16)] rounded-2xl p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto h-full min-h-0 custom-scrollbar text-left">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#94ADB2] shrink-0">
            <span className="text-[#13D7C1]">◇</span>
            <span>Endpoints</span>
            <span>&gt;</span>
            <span>{selectedRoute.module}</span>
            <span>&gt;</span>
            <span className="text-[#13D7C1] font-bold">{selectedRoute.path}</span>
          </div>

          {/* Hero Section */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-3 border-b border-[rgba(50,190,190,0.14)] shrink-0">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#13D7C1]/15 border border-[#13D7C1]/30 flex items-center justify-center text-[#13D7C1] shrink-0 mt-0.5">
                <span className="text-base font-bold">◇</span>
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-black font-mono tracking-wider border shrink-0 ${
                      METHOD_THEMES[selectedRoute.method]?.badge || "bg-[#3B82F6]/15 text-[#3B82F6]"
                    }`}
                  >
                    {selectedRoute.method}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold font-mono text-[#F2F7F7] tracking-tight">
                    {selectedRoute.path}
                  </h2>
                </div>
                <p className="text-xs text-[#94ADB2] mt-1">
                  {selectedRoute.description}
                </p>
              </div>
            </div>

            {/* Top-Right Action Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toggleStar(selectedRoute.id)}
                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition cursor-pointer ${
                  starredRoutes.has(selectedRoute.id)
                    ? "bg-amber-400/20 border-amber-400/40 text-amber-400"
                    : "bg-[#06181D] border-[rgba(50,190,190,0.18)] text-[#94ADB2] hover:text-[#F2F7F7]"
                }`}
                title="Star Endpoint"
              >
                <Star
                  size={14}
                  className={starredRoutes.has(selectedRoute.id) ? "fill-amber-400" : ""}
                />
              </button>

              <button
                onClick={() => handleCopy(selectedRoute.path, "path")}
                className="w-8 h-8 rounded-lg bg-[#06181D] border border-[rgba(50,190,190,0.18)] text-[#94ADB2] hover:text-[#F2F7F7] flex items-center justify-center transition cursor-pointer"
                title="Copy Path"
              >
                {copiedKey === "path" ? (
                  <Check size={14} className="text-[#13D7C1]" />
                ) : (
                  <Copy size={14} />
                )}
              </button>

              <button
                onClick={() => handleCopy(`curl -X ${selectedRoute.method} http://localhost:3000${selectedRoute.path}`, "curl")}
                className="w-8 h-8 rounded-lg bg-[#06181D] border border-[rgba(50,190,190,0.18)] text-[#94ADB2] hover:text-[#F2F7F7] flex items-center justify-center transition cursor-pointer"
                title="Copy cURL"
              >
                <ExternalLink size={14} />
              </button>

              <button
                onClick={handleRunEndpoint}
                disabled={isRunning}
                className={`px-3.5 h-8 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                  runCompleted
                    ? "bg-emerald-500 text-[#06181D]"
                    : "bg-[#13D7C1] hover:bg-[#13D7C1]/90 text-[#06181D] shadow-[#13D7C1]/20"
                }`}
              >
                <Play size={12} className={isRunning ? "animate-spin" : "fill-current"} />
                <span>{isRunning ? "Running..." : runCompleted ? "200 OK" : "Run"}</span>
              </button>
            </div>
          </div>

          {/* Metadata Chips Row */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Active
            </span>

            <span className="px-2.5 py-1 rounded-md bg-[#06181D] border border-[rgba(50,190,190,0.16)] text-[#94ADB2] text-[11px] font-semibold flex items-center gap-1.5">
              {selectedRoute.isPublic ? <Globe size={11} /> : <Lock size={11} />}
              {selectedRoute.isPublic ? "Public" : "Protected"}
            </span>

            <span className="px-2 py-1 rounded-md bg-[#06181D] border border-[rgba(50,190,190,0.16)] text-[#94ADB2] text-[11px] font-mono">
              {selectedRoute.version}
            </span>

            <span className="px-2.5 py-1 rounded-md bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[#60A5FA] text-[11px] font-semibold">
              {selectedRoute.module}
            </span>

            <span className="px-2.5 py-1 rounded-md bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#C084FC] text-[11px] font-mono">
              {selectedRoute.tag}
            </span>

            <span className="px-2.5 py-1 rounded-md bg-[#06181D] border border-[rgba(50,190,190,0.16)] text-[#94ADB2] text-[11px] font-mono truncate max-w-xs flex items-center gap-1.5">
              <FileCode size={11} className="text-[#13D7C1]" />
              {selectedRoute.file}
            </span>
          </div>

          {/* Workspace Tabs Navigation */}
          <div className="flex items-center gap-2 border-b border-[rgba(50,190,190,0.16)] shrink-0 overflow-x-auto custom-scrollbar">
            {(
              [
                { id: "overview", label: "Overview", icon: Layers },
                { id: "request", label: "Request", icon: ArrowRight },
                { id: "response", label: "Response", icon: Server },
                { id: "dependencies", label: "Dependencies", icon: GitBranch },
                { id: "traces", label: "Traces", icon: Zap },
                { id: "tests", label: "Tests", icon: CheckCircle2 },
              ] as const
            ).map((tab) => {
              const isActive = activeWorkspaceTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveWorkspaceTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-all cursor-pointer relative shrink-0 ${
                    isActive ? "text-[#13D7C1]" : "text-[#94ADB2] hover:text-[#F2F7F7]"
                  }`}
                >
                  <Icon size={13} />
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="routeTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#13D7C1]"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content: OVERVIEW */}
          {activeWorkspaceTab === "overview" && (
            <div className="space-y-4">
              {/* Detailed Description */}
              <p className="text-xs text-[#94ADB2] leading-relaxed bg-[#06181D] p-3 rounded-xl border border-[rgba(50,190,190,0.1)]">
                {selectedRoute.detailedDescription}
              </p>

              {/* 4 Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-[#06181D] border border-[rgba(50,190,190,0.14)] rounded-xl p-2.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[#94ADB2] mb-1">
                    <span className="text-[10px] font-medium">Success Rate</span>
                    <Zap size={13} className="text-amber-400" />
                  </div>
                  <span className="text-lg font-bold font-mono text-[#F2F7F7]">
                    {selectedRoute.metrics.successRate}
                  </span>
                  <span className="text-[9.5px] text-[#94ADB2] mt-0.5">Last 7 days</span>
                </div>

                <div className="bg-[#06181D] border border-[rgba(50,190,190,0.14)] rounded-xl p-2.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[#94ADB2] mb-1">
                    <span className="text-[10px] font-medium">Avg. Response Time</span>
                    <Clock size={13} className="text-[#3B82F6]" />
                  </div>
                  <span className="text-lg font-bold font-mono text-[#F2F7F7]">
                    {selectedRoute.metrics.avgResponseTime}
                  </span>
                  <span className="text-[9.5px] text-[#13D7C1] mt-0.5">↓ 32% vs last run</span>
                </div>

                <div className="bg-[#06181D] border border-[rgba(50,190,190,0.14)] rounded-xl p-2.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[#94ADB2] mb-1">
                    <span className="text-[10px] font-medium">Database Activity</span>
                    <Database size={13} className="text-[#8B5CF6]" />
                  </div>
                  <span className="text-base font-bold font-mono text-[#F2F7F7]">
                    {selectedRoute.metrics.dbActivity}
                  </span>
                  <span className="text-[9.5px] text-[#94ADB2] mt-0.5">0 queries</span>
                </div>

                <div className="bg-[#06181D] border border-[rgba(50,190,190,0.14)] rounded-xl p-2.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[#94ADB2] mb-1">
                    <span className="text-[10px] font-medium">Usage</span>
                    <BarChart3 size={13} className="text-[#10B981]" />
                  </div>
                  <span className="text-lg font-bold font-mono text-[#F2F7F7]">
                    {selectedRoute.metrics.usage}
                  </span>
                  <span className="text-[9.5px] text-[#94ADB2] mt-0.5">Last 30 days</span>
                </div>
              </div>

              {/* REQUEST ACCORDION PANEL */}
              <div className="bg-[#06181D] border border-[rgba(50,190,190,0.14)] rounded-xl overflow-hidden">
                <div
                  onClick={() => setIsRequestOpen(!isRequestOpen)}
                  className="p-3 bg-[#0D272C] flex items-center justify-between cursor-pointer border-b border-[rgba(50,190,190,0.1)]"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[#13D7C1] font-bold">◇</span>
                    <span className="text-xs font-bold text-[#F2F7F7] uppercase tracking-wider">
                      Request
                    </span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-[#94ADB2] transition-transform ${
                      isRequestOpen ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </div>

                {isRequestOpen && (
                  <div className="p-3 space-y-3">
                    {/* Meta pills */}
                    <div className="flex items-center gap-3 text-[11px] font-mono text-[#94ADB2] flex-wrap pb-2 border-b border-[rgba(50,190,190,0.08)]">
                      <div className="flex items-center gap-1.5">
                        <span>HTTP Method</span>
                        <span className="px-2 py-0.5 rounded bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[#60A5FA] font-bold">
                          {selectedRoute.method}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>Endpoint</span>
                        <span className="font-bold text-[#F2F7F7]">{selectedRoute.path}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>Content Type</span>
                        <span className="text-[#13D7C1]">{selectedRoute.request.contentType}</span>
                      </div>
                    </div>

                    {/* Sub-tabs + Copy/Schema Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setRequestSubTab("body")}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                            requestSubTab === "body"
                              ? "bg-[#0A2025] text-[#13D7C1] border border-[#13D7C1]/30"
                              : "text-[#94ADB2] hover:text-white"
                          }`}
                        >
                          Body (JSON)
                        </button>
                        <button
                          onClick={() => setRequestSubTab("headers")}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                            requestSubTab === "headers"
                              ? "bg-[#0A2025] text-[#13D7C1] border border-[#13D7C1]/30"
                              : "text-[#94ADB2] hover:text-white"
                          }`}
                        >
                          Headers ({selectedRoute.request.headers.length})
                        </button>
                        <button
                          onClick={() => setRequestSubTab("params")}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                            requestSubTab === "params"
                              ? "bg-[#0A2025] text-[#13D7C1] border border-[#13D7C1]/30"
                              : "text-[#94ADB2] hover:text-white"
                          }`}
                        >
                          Query Params ({selectedRoute.request.queryParams.length})
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() =>
                            handleCopy(
                              JSON.stringify(selectedRoute.request.body, null, 2),
                              "req-body"
                            )
                          }
                          className="px-2 py-1 rounded bg-[#0A2025] hover:bg-[#0D272C] border border-[rgba(50,190,190,0.15)] text-[10px] text-[#94ADB2] hover:text-white flex items-center gap-1"
                        >
                          <Copy size={11} />
                          <span>{copiedKey === "req-body" ? "Copied" : "Copy"}</span>
                        </button>
                        <button className="px-2 py-1 rounded bg-[#0A2025] hover:bg-[#0D272C] border border-[rgba(50,190,190,0.15)] text-[10px] text-[#94ADB2] hover:text-white flex items-center gap-1">
                          <Code2 size={11} />
                          <span>Schema</span>
                        </button>
                      </div>
                    </div>

                    {/* JSON Code Block */}
                    <div className="bg-[#051317] border border-[rgba(50,190,190,0.12)] rounded-lg p-3 font-mono text-xs">
                      {requestSubTab === "body" && (
                        <div className="space-y-1">
                          {Object.entries(selectedRoute.request.body).length > 0 ? (
                            Object.entries(selectedRoute.request.body).map(([k, v], idx) => (
                              <div key={k} className="flex items-center gap-3">
                                <span className="text-[#94ADB2]/40 select-none w-3 text-right">
                                  {idx + 1}
                                </span>
                                <div>
                                  <span className="text-[#9BE8E0]">"{k}"</span>
                                  <span className="text-[#F2F7F7]">: </span>
                                  <span className="text-amber-300">"{String(v)}"</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <span className="text-[#94ADB2] italic">No request body required</span>
                          )}
                        </div>
                      )}

                      {requestSubTab === "headers" && (
                        <div className="space-y-1">
                          {selectedRoute.request.headers.map((h, idx) => (
                            <div key={h.key} className="flex items-center gap-3">
                              <span className="text-[#94ADB2]/40 select-none w-3 text-right">
                                {idx + 1}
                              </span>
                              <div>
                                <span className="text-[#9BE8E0]">{h.key}</span>
                                <span className="text-[#F2F7F7]">: </span>
                                <span className="text-[#C084FC]">{h.value}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {requestSubTab === "params" && (
                        <div className="space-y-1">
                          {selectedRoute.request.queryParams.length > 0 ? (
                            selectedRoute.request.queryParams.map((p, idx) => (
                              <div key={p.key} className="flex items-center gap-3">
                                <span className="text-[#94ADB2]/40 select-none w-3 text-right">
                                  {idx + 1}
                                </span>
                                <div>
                                  <span className="text-[#9BE8E0]">{p.key}</span>
                                  <span className="text-[#F2F7F7]">: </span>
                                  <span className="text-amber-300">{p.value}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <span className="text-[#94ADB2] italic">No query params required</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* RESPONSE ACCORDION PANEL */}
              <div className="bg-[#06181D] border border-[rgba(50,190,190,0.14)] rounded-xl overflow-hidden">
                <div
                  onClick={() => setIsResponseOpen(!isResponseOpen)}
                  className="p-3 bg-[#0D272C] flex items-center justify-between cursor-pointer border-b border-[rgba(50,190,190,0.1)]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-[#F2F7F7] uppercase tracking-wider">
                      Response
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                      {selectedRoute.response.statusCode} {selectedRoute.response.statusText}
                    </span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-[#94ADB2] transition-transform ${
                      isResponseOpen ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </div>

                {isResponseOpen && (
                  <div className="p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setResponseSubTab("body")}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                            responseSubTab === "body"
                              ? "bg-[#0A2025] text-[#13D7C1] border border-[#13D7C1]/30"
                              : "text-[#94ADB2] hover:text-white"
                          }`}
                        >
                          Body (JSON)
                        </button>
                        <button
                          onClick={() => setResponseSubTab("headers")}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                            responseSubTab === "headers"
                              ? "bg-[#0A2025] text-[#13D7C1] border border-[#13D7C1]/30"
                              : "text-[#94ADB2] hover:text-white"
                          }`}
                        >
                          Headers ({selectedRoute.response.headers.length})
                        </button>
                        <button
                          onClick={() => setResponseSubTab("schema")}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                            responseSubTab === "schema"
                              ? "bg-[#0A2025] text-[#13D7C1] border border-[#13D7C1]/30"
                              : "text-[#94ADB2] hover:text-white"
                          }`}
                        >
                          Schema
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() =>
                            handleCopy(
                              JSON.stringify(selectedRoute.response.body, null, 2),
                              "res-body"
                            )
                          }
                          className="px-2 py-1 rounded bg-[#0A2025] hover:bg-[#0D272C] border border-[rgba(50,190,190,0.15)] text-[10px] text-[#94ADB2] hover:text-white flex items-center gap-1"
                        >
                          <Copy size={11} />
                          <span>{copiedKey === "res-body" ? "Copied" : "Copy"}</span>
                        </button>
                        <button className="px-2 py-1 rounded bg-[#0A2025] hover:bg-[#0D272C] border border-[rgba(50,190,190,0.15)] text-[10px] text-[#94ADB2] hover:text-white flex items-center gap-1">
                          <Code2 size={11} />
                          <span>Schema</span>
                        </button>
                      </div>
                    </div>

                    {/* JSON Code View */}
                    <div className="bg-[#051317] border border-[rgba(50,190,190,0.12)] rounded-lg p-3 font-mono text-xs overflow-x-auto">
                      <pre className="text-[#9BE8E0] leading-relaxed">
                        {JSON.stringify(selectedRoute.response.body, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab Content: TRACES */}
          {activeWorkspaceTab === "traces" && (
            <div className="space-y-4">
              <div className="bg-[#06181D] border border-[rgba(50,190,190,0.14)] rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F2F7F7]">Execution Pipeline</span>
                  <button
                    onClick={handleViewInMetroMap}
                    className="text-xs font-bold text-[#13D7C1] hover:underline flex items-center gap-1"
                  >
                    <span>View in Metro Map</span>
                    <ExternalLink size={12} />
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="p-3 rounded-lg bg-[#0D272C] border border-[#13D7C1]/30 flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#13D7C1]">
                      1. HTTP Route Endpoint
                    </span>
                    <span className="text-[11px] text-[#94ADB2] font-mono">{selectedRoute.path}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0D272C] border border-[rgba(50,190,190,0.1)] flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#3B82F6]">
                      2. Controller Handler
                    </span>
                    <span className="text-[11px] text-[#94ADB2] font-mono">{selectedRoute.controller}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0D272C] border border-[rgba(50,190,190,0.1)] flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#F59E0B]">
                      3. Business Service
                    </span>
                    <span className="text-[11px] text-[#94ADB2] font-mono">{selectedRoute.service}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0D272C] border border-[rgba(50,190,190,0.1)] flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#8B5CF6]">
                      4. Data Repository & DB
                    </span>
                    <span className="text-[11px] text-[#94ADB2] font-mono">Database Execution</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: DEPENDENCIES */}
          {activeWorkspaceTab === "dependencies" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedRoute.dependencies.map((dep) => (
                  <div
                    key={dep.name}
                    className="p-3 rounded-xl bg-[#06181D] border border-[rgba(50,190,190,0.14)] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <Shield size={14} className="text-[#13D7C1]" />
                      <div>
                        <span className="text-xs font-bold text-[#F2F7F7] block">{dep.name}</span>
                        <span className="text-[10px] text-[#94ADB2]">{dep.type}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-[#9BE8E0] bg-[#0A2025] px-2 py-0.5 rounded border border-[rgba(50,190,190,0.1)]">
                      {dep.version}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab Content: TESTS & REQUEST / RESPONSE FALLBACKS */}
          {(activeWorkspaceTab === "request" || activeWorkspaceTab === "response" || activeWorkspaceTab === "tests") && (
            <div className="p-4 rounded-xl bg-[#06181D] border border-[rgba(50,190,190,0.14)] text-xs text-[#94ADB2] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#F2F7F7]">Automated Tests</span>
                <span className="text-emerald-400 font-mono text-[11px]">✓ 4 passing tests</span>
              </div>
              <p>
                Unit and integration tests configured for <code className="text-[#13D7C1] font-mono">{selectedRoute.path}</code> verifying payload structure and status codes.
              </p>
            </div>
          )}
        </main>

        {/* ── COLUMN 3: ROUTE INFORMATION INSPECTOR (Right / 3 cols) ─────────── */}
        <aside className="lg:col-span-3 xl:col-span-3 bg-[#0A2025] border border-[rgba(50,190,190,0.16)] rounded-2xl p-3.5 flex flex-col gap-3.5 overflow-y-auto h-full min-h-0 custom-scrollbar text-left select-none">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[rgba(50,190,190,0.14)] shrink-0">
            <h3 className="text-xs font-bold text-[#F2F7F7] uppercase font-mono tracking-wider">
              Route Information
            </h3>
            <button className="px-2 py-1 rounded bg-[#06181D] border border-[rgba(50,190,190,0.18)] text-[10px] font-semibold text-[#94ADB2] hover:text-[#F2F7F7] flex items-center gap-1 cursor-pointer">
              <Settings size={10} />
              <span>Edit</span>
            </button>
          </div>

          {/* Metadata Cards */}
          <div className="space-y-2">
            {/* Controller */}
            <div className="p-2.5 rounded-xl bg-[#06181D] border border-[rgba(50,190,190,0.1)] flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] shrink-0">
                  <Code2 size={13} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-[#94ADB2] block">Controller</span>
                  <span className="text-xs font-mono font-bold text-[#F2F7F7] truncate block">
                    {selectedRoute.controller}
                  </span>
                </div>
              </div>
              <ExternalLink size={12} className="text-[#94ADB2] shrink-0" />
            </div>

            {/* Service */}
            <div className="p-2.5 rounded-xl bg-[#06181D] border border-[rgba(50,190,190,0.1)] flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Settings size={13} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-[#94ADB2] block">Service</span>
                  <span className="text-xs font-mono font-bold text-[#F2F7F7] truncate block">
                    {selectedRoute.service}
                  </span>
                </div>
              </div>
              <ExternalLink size={12} className="text-[#94ADB2] shrink-0" />
            </div>

            {/* File & Directory */}
            <div className="p-2.5 rounded-xl bg-[#06181D] border border-[rgba(50,190,190,0.1)] flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#3B82F6]/15 border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6] shrink-0">
                  <FileCode size={13} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-[#94ADB2] block">File</span>
                  <span className="text-xs font-mono font-bold text-[#F2F7F7] truncate block">
                    {selectedRoute.file.split(/[\\/]/).pop()}
                  </span>
                  <span className="text-[9px] font-mono text-[#94ADB2] truncate block">
                    {selectedRoute.file}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleCopy(selectedRoute.file, "file-path")}
                className="text-[#94ADB2] hover:text-white"
              >
                {copiedKey === "file-path" ? (
                  <Check size={12} className="text-[#13D7C1]" />
                ) : (
                  <Copy size={12} />
                )}
              </button>
            </div>

            {/* Lines */}
            <div className="p-2.5 rounded-xl bg-[#06181D] border border-[rgba(50,190,190,0.1)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#EC4899]/15 border border-[#EC4899]/30 flex items-center justify-center text-[#EC4899] shrink-0">
                  <Layers size={13} />
                </div>
                <div>
                  <span className="text-[10px] text-[#94ADB2] block">Lines</span>
                  <span className="text-xs font-mono font-bold text-[#F2F7F7]">{selectedRoute.lines}</span>
                </div>
              </div>
            </div>

            {/* Module */}
            <div className="p-2.5 rounded-xl bg-[#06181D] border border-[rgba(50,190,190,0.1)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6] shrink-0">
                  <Folder size={13} />
                </div>
                <div>
                  <span className="text-[10px] text-[#94ADB2] block">Module</span>
                  <span className="text-xs font-bold text-[#F2F7F7]">{selectedRoute.module}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dependencies (Collapsible) */}
          <div className="bg-[#06181D] border border-[rgba(50,190,190,0.12)] rounded-xl overflow-hidden">
            <div
              onClick={() => setIsDependenciesOpen(!isDependenciesOpen)}
              className="p-2.5 bg-[#0D272C] flex items-center justify-between cursor-pointer border-b border-[rgba(50,190,190,0.1)]"
            >
              <span className="text-xs font-bold text-[#F2F7F7]">
                Dependencies ({selectedRoute.dependencies.length})
              </span>
              <ChevronDown
                size={12}
                className={`text-[#94ADB2] transition-transform ${
                  isDependenciesOpen ? "rotate-0" : "-rotate-90"
                }`}
              />
            </div>

            {isDependenciesOpen && (
              <div className="p-2 space-y-1.5">
                {selectedRoute.dependencies.map((dep) => (
                  <div
                    key={dep.name}
                    className="flex items-center justify-between text-xs p-1.5 rounded bg-[#0A2025]"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Shield size={11} className="text-[#13D7C1] shrink-0" />
                      <span className="font-mono text-[#F2F7F7] truncate">{dep.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#94ADB2] shrink-0">
                      {dep.version}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Related Endpoints */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#F2F7F7] block">Related Endpoints</span>
            <div className="space-y-1.5">
              {(selectedRoute.relatedRoutes || ["/api/auth/signup", "/api/auth/verify-otp"])
                .map((relPath) => {
                  const relRoute = allRoutes.find((r) => r.path === relPath);
                  const method = relRoute?.method || "POST";
                  const desc = relRoute?.description || "Related handler";
                  const theme = METHOD_THEMES[method] || METHOD_THEMES.POST;

                  return (
                    <div
                      key={relPath}
                      onClick={() => {
                        if (relRoute) setSelectedRouteId(relRoute.id);
                      }}
                      className="p-2 rounded-xl bg-[#06181D] hover:bg-[#0D272C] border border-[rgba(50,190,190,0.1)] transition flex items-center justify-between gap-2 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border shrink-0 ${theme.badge}`}
                        >
                          {method}
                        </span>
                        <div className="min-w-0">
                          <span className="text-[11px] font-mono font-bold text-[#F2F7F7] truncate block group-hover:text-[#13D7C1] transition-colors">
                            {relPath}
                          </span>
                          <span className="text-[9.5px] text-[#94ADB2] truncate block">
                            {desc}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={13} className="text-[#94ADB2] shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  );
                })}
            </div>
          </div>

          {/* View in Metro Map Button */}
          <button
            onClick={handleViewInMetroMap}
            className="w-full mt-auto py-2.5 rounded-xl border border-[#13D7C1]/50 bg-[#13D7C1]/10 hover:bg-[#13D7C1]/20 text-[#13D7C1] font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
          >
            <GitBranch size={13} />
            <span>View in Metro Map ↗</span>
          </button>
        </aside>

      </div>
    </div>
  );
}
