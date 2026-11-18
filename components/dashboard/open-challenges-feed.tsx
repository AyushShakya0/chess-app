"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Swords,
  Zap,
  Clock,
  Crown,
  Plus,
  Loader2,
  Users,
  Radio,
  Flame,
  Check,
} from "lucide-react";
import {
  OpenChallenge,
  filterActiveChallenges,
} from "@/lib/services/challenge-types";
import {
  subscribeToChallenges,
  broadcastOpenChallenge,
  claimOpenChallenge,
} from "@/lib/services/challenge-service";
import { useAuth } from "@/lib/stores/auth-store";

export const OpenChallengesFeed: React.FC = () => {
  const router = useRouter();
  const [auth] = useAuth();
  const [challenges, setChallenges] = useState<OpenChallenge[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTc, setNewTc] = useState("3+0");
  const [newColor, setNewColor] = useState<"white" | "black" | "random">("random");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);
  const [myChallengeId, setMyChallengeId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToChallenges((items) => {
      setChallenges(filterActiveChallenges(items));
    });
    return () => unsubscribe();
  }, []);

  // When my open challenge is claimed by an opponent, automatically redirect to the room
  useEffect(() => {
    if (!myChallengeId) return;
    const myChal = challenges.find((c) => c.id === myChallengeId);
    if (myChal && myChal.status === "claimed" && myChal.roomId) {
      router.push(`/play/${myChal.roomId}`);
    }
  }, [challenges, myChallengeId, router]);

  const handleAccept = async (challenge: OpenChallenge) => {
    setAcceptingId(challenge.id);
    try {
      const playerName =
        auth.profile?.username || auth.user?.email?.split("@")[0] || "AyushShakya";
      const { roomId } = await claimOpenChallenge(challenge.id, playerName);
      router.push(`/play/${roomId}`);
    } catch (err: any) {
      alert(err?.message || "Failed to accept challenge. The room may have been taken.");
      setAcceptingId(null);
    }
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBroadcasting(true);
    try {
      const creatorName =
        auth.profile?.username || auth.user?.email?.split("@")[0] || "AyushShakya";
      const creatorElo = auth.profile?.elo_blitz || 1642;

      const created = await broadcastOpenChallenge({
        creatorName,
        creatorElo,
        timeControl: newTc,
        colorPreference: newColor,
        rated: true,
      });

      setMyChallengeId(created.id);
      setBroadcastSuccess(true);
      setTimeout(() => {
        setBroadcastSuccess(false);
        setIsCreateModalOpen(false);
        setIsBroadcasting(false);
      }, 1200);
    } catch {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="bg-[#14171f] border border-[#252a36] rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header Row */}
      <div className="flex items-center justify-between pb-3 border-b border-[#252a36]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#d4a359]/15 border border-[#d4a359]/30 flex items-center justify-center text-[#d4a359]">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-display flex items-center gap-2">
              <span>Open Match Challenges</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </h2>
            <p className="text-[11px] text-slate-400">Live dashboard matchmaking feed</p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#d4a359] hover:bg-[#e2b768] text-black font-black text-xs rounded-xl shadow-md shadow-[#d4a359]/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Challenge</span>
        </button>
      </div>

      {/* Live My Challenge Pending Banner */}
      {myChallengeId && (
        <div className="p-3 bg-[#d4a359]/10 border border-[#d4a359]/40 rounded-xl flex items-center justify-between text-xs animate-pulse">
          <div className="flex items-center gap-2 text-[#f0cf85]">
            <Radio className="w-4 h-4 text-[#d4a359]" />
            <span className="font-bold">Your challenge is live!</span>
            <span className="text-slate-400">Waiting for an opponent to accept...</span>
          </div>
          <button
            onClick={() => setMyChallengeId(null)}
            className="text-[10px] text-slate-400 hover:text-white underline font-bold"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Challenges List */}
      {challenges.length === 0 ? (
        <div className="py-8 text-center bg-[#0d0f12] rounded-xl border border-[#252a36] space-y-2">
          <Users className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-400">No open challenges active right now.</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="text-xs font-bold text-[#d4a359] hover:underline"
          >
            Create the first challenge →
          </button>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[340px] overflow-y-auto custom-scrollbar pr-1">
          {challenges.map((c) => {
            const isAccepting = acceptingId === c.id;
            const isRapid = c.category === "rapid" || c.category === "classical";

            return (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 bg-[#0d0f12] hover:bg-[#181c26] border border-[#252a36] hover:border-[#384152] rounded-xl transition-all group"
              >
                {/* Challenger Avatar & Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1c202a] to-[#252a36] border border-[#2c3240] text-slate-200 flex items-center justify-center font-black text-xs shrink-0 group-hover:border-[#d4a359]/50 transition-colors">
                    {c.creatorName.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate group-hover:text-[#d4a359] transition-colors">
                        {c.creatorName}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-[#1c202a] px-1.5 py-0.2 rounded border border-[#252a36]">
                        {c.creatorElo}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1 font-semibold text-slate-300">
                        {isRapid ? (
                          <Clock className="w-3 h-3 text-blue-400" />
                        ) : (
                          <Flame className="w-3 h-3 text-amber-400" />
                        )}
                        {c.timeControl}
                      </span>
                      <span>&bull;</span>
                      <span className="capitalize">{c.category}</span>
                      <span>&bull;</span>
                      <span>{c.colorPreference}</span>
                    </div>
                  </div>
                </div>

                {/* Accept Button */}
                <button
                  onClick={() => handleAccept(c)}
                  disabled={isAccepting}
                  className="px-4 py-2 bg-[#d4a359] hover:bg-[#e2b768] text-black font-black text-xs rounded-xl shadow-md shadow-[#d4a359]/20 transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 hover:scale-[1.02]"
                >
                  {isAccepting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Joining...</span>
                    </>
                  ) : (
                    <>
                      <Swords className="w-3.5 h-3.5" />
                      <span>Accept</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Challenge Modal */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            className="bg-[#14171f] border border-[#252a36] rounded-2xl max-w-sm w-full p-5 shadow-2xl relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-base font-bold text-white font-display">Create Match Challenge</h3>
              <p className="text-xs text-slate-400 mt-0.5">Broadcast your match request to all active dashboards.</p>
            </div>

            <form onSubmit={handleCreateChallenge} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Time Control</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "1+0", label: "1 min", type: "Bullet" },
                    { id: "3+0", label: "3 min", type: "Blitz" },
                    { id: "5+0", label: "5 min", type: "Blitz" },
                    { id: "10+0", label: "10 min", type: "Rapid" },
                  ].map((tc) => (
                    <button
                      key={tc.id}
                      type="button"
                      onClick={() => setNewTc(tc.id)}
                      className={`p-2 rounded-xl border text-center text-xs transition-colors ${
                        newTc === tc.id
                          ? "bg-[#d4a359] border-[#d4a359] text-black font-black"
                          : "bg-[#0d0f12] border-[#252a36] text-slate-300 hover:text-white"
                      }`}
                    >
                      <span className="block font-bold">{tc.label}</span>
                      <span className="block text-[9px] opacity-80">{tc.type}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Play As</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["white", "random", "black"] as const).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewColor(color)}
                      className={`py-2 rounded-xl border text-xs font-bold capitalize transition-colors ${
                        newColor === color
                          ? "bg-[#d4a359] border-[#d4a359] text-black font-black"
                          : "bg-[#0d0f12] border-[#252a36] text-slate-300 hover:text-white"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2 bg-[#1c202a] hover:bg-[#252a36] text-slate-300 text-xs font-bold rounded-xl border border-[#252a36]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isBroadcasting}
                  className="flex-1 py-2 bg-[#d4a359] hover:bg-[#e2b768] text-black text-xs font-black rounded-xl shadow-md shadow-[#d4a359]/20 flex items-center justify-center gap-1.5"
                >
                  {broadcastSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Broadcasted!</span>
                    </>
                  ) : isBroadcasting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Post Challenge</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
