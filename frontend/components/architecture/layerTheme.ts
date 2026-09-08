import React from "react";
import {
  Network,
  Terminal,
  Layers,
  Shield,
  Box,
  Database,
  Settings,
  CheckCircle,
  Wrench,
} from "lucide-react";

export interface LayerThemeToken {
  primary: string;
  soft: string;
  bright: string;
  label: string;
  badge: string;
  iconBg: string;
  iconColor: string;
  borderColor: string;
  category: string;
}

export const LAYER_THEME: Record<string, LayerThemeToken> = {
  routes: {
    primary: "#2F80ED",
    soft: "#163E73",
    bright: "#60A5FA",
    label: "Routes",
    badge: "API",
    iconBg: "#163E73",
    iconColor: "#60A5FA",
    borderColor: "#2F80ED",
    category: "Entrypoint",
  },
  controllers: {
    primary: "#9B5CFF",
    soft: "#44206F",
    bright: "#C19AFF",
    label: "Controllers",
    badge: "CONTROLLER",
    iconBg: "#44206F",
    iconColor: "#C19AFF",
    borderColor: "#9B5CFF",
    category: "Orchestration",
  },
  services: {
    primary: "#F5B800",
    soft: "#5E4700",
    bright: "#FFD84D",
    label: "Services",
    badge: "BUSINESS",
    iconBg: "#5E4700",
    iconColor: "#FFD84D",
    borderColor: "#F5B800",
    category: "Business Logic",
  },
  repositories: {
    primary: "#00B8D9",
    soft: "#064858",
    bright: "#5CE7F5",
    label: "Repositories",
    badge: "REPOSITORY",
    iconBg: "#064858",
    iconColor: "#5CE7F5",
    borderColor: "#00B8D9",
    category: "Data Access",
  },
  models: {
    primary: "#FF4D5E",
    soft: "#661F29",
    bright: "#FF8B95",
    label: "Models",
    badge: "SCHEMA",
    iconBg: "#661F29",
    iconColor: "#FF8B95",
    borderColor: "#FF4D5E",
    category: "Domain Shape",
  },
  database: {
    primary: "#16C7A1",
    soft: "#075443",
    bright: "#67E8D2",
    label: "Database",
    badge: "DATA",
    iconBg: "#075443",
    iconColor: "#67E8D2",
    borderColor: "#16C7A1",
    category: "Persistence",
  },
  middleware: {
    primary: "#EC4899",
    soft: "#4A152E",
    bright: "#F472B6",
    label: "Middleware",
    badge: "GUARD",
    iconBg: "#4A152E",
    iconColor: "#F472B6",
    borderColor: "#EC4899",
    category: "Security",
  },
  config: {
    primary: "#8B5CF6",
    soft: "#2E1A47",
    bright: "#A78BFA",
    label: "Config",
    badge: "CONFIG",
    iconBg: "#2E1A47",
    iconColor: "#A78BFA",
    borderColor: "#8B5CF6",
    category: "Environment",
  },
  tests: {
    primary: "#34D399",
    soft: "#0E3E2C",
    bright: "#6EE7B7",
    label: "Tests",
    badge: "TEST",
    iconBg: "#0E3E2C",
    iconColor: "#6EE7B7",
    borderColor: "#34D399",
    category: "Verification",
  },
  utils: {
    primary: "#F97316",
    soft: "#4E2108",
    bright: "#FB923C",
    label: "Utils",
    badge: "UTIL",
    iconBg: "#4E2108",
    iconColor: "#FB923C",
    borderColor: "#F97316",
    category: "Helper",
  },
};

export const FEATURE_TRACK_THEME: Record<string, { label: string; color: string; border: string; bg: string }> = {
  "user management": {
    label: "User Management",
    color: "#2F80ED",
    border: "border-[#2F80ED]/40",
    bg: "bg-[#2F80ED]/15",
  },
  authentication: {
    label: "Authentication",
    color: "#16C7A1",
    border: "border-[#16C7A1]/40",
    bg: "bg-[#16C7A1]/15",
  },
  notifications: {
    label: "Notifications",
    color: "#F5B800",
    border: "border-[#F5B800]/40",
    bg: "bg-[#F5B800]/15",
  },
  "analytics & logging": {
    label: "Analytics & Logging",
    color: "#9B5CFF",
    border: "border-[#9B5CFF]/40",
    bg: "bg-[#9B5CFF]/15",
  },
  "admin control panel": {
    label: "Admin Control Panel",
    color: "#FF4D5E",
    border: "border-[#FF4D5E]/40",
    bg: "bg-[#FF4D5E]/15",
  },
};

export function getLayerTheme(layerKeyOrName: string): LayerThemeToken {
  if (!layerKeyOrName) return LAYER_THEME.services;
  const key = layerKeyOrName.toLowerCase().trim();
  return LAYER_THEME[key] || LAYER_THEME.services;
}

export function getLayerIcon(layerKeyOrName: string, className = "w-5 h-5") {
  const key = (layerKeyOrName || "").toLowerCase().trim();
  switch (key) {
    case "routes":
      return React.createElement(Network, { className });
    case "controllers":
      return React.createElement(Terminal, { className });
    case "services":
      return React.createElement(Layers, { className });
    case "repositories":
      return React.createElement(Shield, { className });
    case "models":
      return React.createElement(Box, { className });
    case "database":
      return React.createElement(Database, { className });
    case "middleware":
      return React.createElement(Shield, { className });
    case "config":
      return React.createElement(Settings, { className });
    case "tests":
      return React.createElement(CheckCircle, { className });
    case "utils":
      return React.createElement(Wrench, { className });
    default:
      return React.createElement(Layers, { className });
  }
}
