"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Crown, Sparkles, X } from "lucide-react";
import { SovereignLogo } from "@/components/brand/sovereign-logo";
import { SIDEBAR_NAV_ITEMS, SidebarNavId } from "./sidebar-items";
import { useAuth } from "@/lib/stores/auth-store";
import { SettingsModal } from "@/components/chess/settings-modal";

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onMobileClose }) => {
  const pathname = usePathname();
  const [auth] = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const getActiveNavId = (): SidebarNavId => {
    if (pathname === "/") return "home";
    if (pathname.startsWith("/online")) return "online";
    if (pathname.startsWith("/bots")) return "bots";
    if (pathname.startsWith("/puzzles")) return "puzzles";
    if (pathname.startsWith("/pass-and-play")) return "friends";
    if (pathname.startsWith("/profile")) return "leaderboard";
    return "home";
  };

  const activeId = getActiveNavId();

  const userInitials = auth.profile?.username
    ? auth.profile.username.slice(0, 2).toUpperCase()
    : auth.user?.email
    ? auth.user.email.slice(0, 2).toUpperCase()
    : "AS";

  const username =
    auth.profile?.username || auth.user?.email?.split("@")[0] || "AyushShakya";

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onMobileClose}
        />
      )}

      {/* Persistent Left Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#0d0f12] border-r border-[#252a36] transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-20" : "w-64"
        } ${
          isMobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#252a36]/80 shrink-0">
          <SovereignLogo href="/" size={isCollapsed ? "sm" : "md"} showText={!isCollapsed} />
          {/* Mobile Close Button */}
          <button
            onClick={onMobileClose}
            aria-label="Close sidebar"
            className="lg:hidden p-1.5 rounded-xl bg-[#14171f] text-slate-400 hover:text-white border border-[#252a36]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
          {SIDEBAR_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeId === item.id;
            const isSettings = item.id === "settings";

            const buttonContent = (
              <div
                className={`group flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all relative ${
                  isActive
                    ? "bg-[#d4a359] text-black shadow-lg shadow-[#d4a359]/20 font-black"
                    : "text-slate-300 hover:text-white hover:bg-[#14171f] border border-transparent hover:border-[#252a36]"
                } ${isCollapsed ? "justify-center px-0" : ""}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? "text-black" : "text-slate-400 group-hover:text-[#d4a359]"
                  }`}
                />

                {!isCollapsed && (
                  <>
                    <span className="truncate flex-1 tracking-tight">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isActive
                            ? "bg-black/20 text-black font-extrabold"
                            : "bg-[#d4a359]/20 text-[#d4a359] border border-[#d4a359]/40"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </div>
            );

            if (isSettings) {
              return (
                <button
                  key={item.id}
                  onClick={() => setIsSettingsOpen(true)}
                  className="w-full text-left"
                  type="button"
                >
                  {buttonContent}
                </button>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onMobileClose}
                className="block"
              >
                {buttonContent}
              </Link>
            );
          })}
        </nav>

        {/* Footer Area: User Mini-Profile & Collapse Toggle */}
        <div className="p-3 border-t border-[#252a36] bg-[#0d0f12] shrink-0 space-y-2">
          {/* User Profile Card */}
          <Link
            href="/profile"
            onClick={onMobileClose}
            className={`flex items-center gap-3 p-2 rounded-2xl hover:bg-[#14171f] border border-transparent hover:border-[#252a36] transition-colors group ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#d4a359] to-[#f0cf85] text-black flex items-center justify-center font-black text-sm shrink-0 shadow-md shadow-[#d4a359]/20 border border-white/20">
              {userInitials}
            </div>

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white truncate group-hover:text-[#d4a359] transition-colors">
                    {username}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                </div>
                <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <Crown className="w-3 h-3 text-[#d4a359]" />
                  <span>1642 ELO</span>
                </div>
              </div>
            )}
          </Link>

          {/* Collapse/Expand Toggle on Desktop */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden lg:flex items-center justify-center w-full py-2 rounded-xl text-slate-500 hover:text-white hover:bg-[#14171f] text-xs font-bold transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <div className="flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" />
                <span className="text-[11px] text-slate-400">Collapse</span>
              </div>
            )}
          </button>
        </div>
      </aside>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};
