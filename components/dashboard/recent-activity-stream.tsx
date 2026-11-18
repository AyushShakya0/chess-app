"use client";

import React from "react";
import Link from "next/link";
import { Swords, ExternalLink, ChevronRight } from "lucide-react";

interface ActivityMatch {
  id: string;
  opponent: string;
  result: "won" | "lost" | "draw";
  timeControl: string;
  date: string;
  eloDelta: string;
}

const RECENT_MATCHES: ActivityMatch[] = [
  {
    id: "m1",
    opponent: "ChessMaster",
    result: "won",
    timeControl: "10 min Rapid",
    date: "1h ago",
    eloDelta: "+14",
  },
  {
    id: "m2",
    opponent: "Bot_Hikaru",
    result: "won",
    timeControl: "3 min Blitz",
    date: "4h ago",
    eloDelta: "+10",
  },
  {
    id: "m3",
    opponent: "Bot_Magnus",
    result: "draw",
    timeControl: "10 min Rapid",
    date: "Yesterday",
    eloDelta: "+2",
  },
  {
    id: "m4",
    opponent: "ApexGrandmaster",
    result: "lost",
    timeControl: "5 min Blitz",
    date: "2 days ago",
    eloDelta: "-8",
  },
];

export const RecentActivityStream: React.FC = () => {
  return (
    <div className="bg-[#14171f] border border-[#252a36] rounded-2xl p-5 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
          <Swords className="w-4 h-4 text-[#d4a359]" />
          <span>Recent Match Activity</span>
        </h3>

        <Link
          href="/profile"
          className="text-[11px] font-bold text-[#d4a359] hover:underline flex items-center gap-1"
        >
          <span>All Games</span>
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-2">
        {RECENT_MATCHES.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between p-2.5 bg-[#0d0f12] hover:bg-[#181c26] border border-[#252a36] rounded-xl transition-all"
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                  m.result === "won"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : m.result === "lost"
                    ? "bg-rose-500/20 text-rose-400"
                    : "bg-slate-500/20 text-slate-400"
                }`}
              >
                {m.result === "won" ? "+" : m.result === "lost" ? "-" : "="}
              </span>

              <div>
                <span className="text-xs font-bold text-white block">
                  vs {m.opponent}
                </span>
                <span className="text-[10px] text-slate-500">
                  {m.timeControl} &bull; {m.date}
                </span>
              </div>
            </div>

            <span
              className={`text-xs font-mono font-bold ${
                m.eloDelta.startsWith("+") ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {m.eloDelta}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
