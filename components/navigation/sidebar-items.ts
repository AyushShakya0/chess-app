import React from "react";
import {
  Home,
  Globe,
  Bot,
  Sliders,
  Zap,
  Trophy,
  BarChart2,
  Users,
  Settings,
} from "lucide-react";

export type SidebarNavId =
  | "home"
  | "online"
  | "bots"
  | "custom"
  | "puzzles"
  | "tournaments"
  | "leaderboard"
  | "friends"
  | "settings";

export interface SidebarNavItem {
  id: SidebarNavId;
  label: string;
  href: string;
  icon: React.FC<{ className?: string }>;
  badge?: string;
  hotkey?: string;
}

export const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  { id: "home", label: "Home", href: "/", icon: Home, hotkey: "1" },
  { id: "online", label: "Play Online", href: "/online", icon: Globe, badge: "Live", hotkey: "2" },
  { id: "bots", label: "Play Computer", href: "/bots", icon: Bot, hotkey: "3" },
  { id: "custom", label: "Custom Game", href: "/online#custom", icon: Sliders },
  { id: "puzzles", label: "Puzzles", href: "/puzzles", icon: Zap, badge: "Daily", hotkey: "4" },
  { id: "tournaments", label: "Tournaments", href: "/online", icon: Trophy },
  { id: "leaderboard", label: "Leaderboard", href: "/profile#stats", icon: BarChart2 },
  { id: "friends", label: "Friends", href: "/pass-and-play", icon: Users },
  { id: "settings", label: "Settings", href: "#settings", icon: Settings },
];
