"use client";

import React, { useState, useEffect, useRef } from "react";
import { Skull, Swords, Flame, Volume2, VolumeX, Mail, Send, CheckCircle2, Copy } from "lucide-react";
import { sound } from "@/lib/audio/sound";

export const BossMode: React.FC = () => {
  const [challengerName, setChallengerName] = useState("");
  const [challengerElo, setChallengerElo] = useState("1500");
  const [warCry, setWarCry] = useState("I have come to dethrone the Final Boss.");
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [challengeSent, setChallengeSent] = useState<boolean>(false);
  const [inviteLink, setInviteLink] = useState("");
  const [mailtoLink, setMailtoLink] = useState("");
  const [emailDelivered, setEmailDelivered] = useState(false);
  const [copied, setCopied] = useState(false);

  // Web Audio Procedural Boss Theme Synthesizer
  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startBossMusic = () => {
    if (typeof window === "undefined") return;
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") ctx.resume();

    setIsPlayingMusic(true);

    // Ominous low drone
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = "sawtooth";
    bassOsc.frequency.setValueAtTime(55, ctx.currentTime); // A1 note
    bassGain.gain.setValueAtTime(0.18, ctx.currentTime);
    bassOsc.connect(bassGain);
    bassGain.connect(ctx.destination);
    bassOsc.start();

    // Epic brass stabs pattern
    const chords = [
      [110, 130.81, 164.81], // A minor
      [103.83, 123.47, 155.56], // G# diminished
      [116.54, 146.83, 174.61], // Bb major
      [98.0, 123.47, 146.83], // G minor
    ];

    let chordIdx = 0;
    musicIntervalRef.current = setInterval(() => {
      const activeChord = chords[chordIdx % chords.length];
      chordIdx++;

      activeChord.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq * 1.5, ctx.currentTime);

        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 1.25);
      });
    }, 1400);
  };

  const stopBossMusic = () => {
    if (musicIntervalRef.current) clearInterval(musicIntervalRef.current);
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsPlayingMusic(false);
  };

  useEffect(() => {
    return () => {
      if (musicIntervalRef.current) clearInterval(musicIntervalRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  const handleChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengerName.trim()) return;

    setIsSubmitting(true);
    const roomId = `boss-${Math.random().toString(36).substring(2, 8)}`;

    try {
      const res = await fetch("/api/boss/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengerName,
          challengerElo,
          roomId,
          message: warCry,
        }),
      });

      const data = await res.json();
      setInviteLink(data.inviteLink);
      setMailtoLink(data.mailtoLink || "");
      setEmailDelivered(data.emailDelivered || false);
      setChallengeSent(true);
      sound.playCheck();
    } catch {
      alert("Failed to send boss challenge. Please try again.");
    }

    setIsSubmitting(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative min-h-[640px] flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-red-950/40 via-slate-950 to-slate-950 rounded-3xl border border-red-900/60 shadow-[0_0_60px_rgba(220,38,38,0.2)] pointer-events-none" />

      {/* Music Toggle */}
      <button
        onClick={isPlayingMusic ? stopBossMusic : startBossMusic}
        className="absolute top-6 right-6 z-20 flex items-center gap-2 bg-red-950/80 hover:bg-red-900/80 border border-red-700/80 text-red-300 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-lg backdrop-blur-md"
      >
        {isPlayingMusic ? (
          <>
            <Volume2 className="w-4 h-4 text-red-400 animate-pulse" />
            Boss Music: ON
          </>
        ) : (
          <>
            <VolumeX className="w-4 h-4" />
            Play Boss Music
          </>
        )}
      </button>

      {/* Arena Content */}
      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/20 border border-red-500/50 rounded-full text-red-400 text-xs font-black uppercase tracking-widest mb-3 animate-pulse">
          <Flame className="w-4 h-4" />
          Final Boss Arena
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-amber-400 drop-shadow-md mb-2">
          CHALLENGE BOSS AYUSH
        </h1>

        <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-8">
          The ultimate supreme test. Issue an immediate grandmaster challenge directly to{" "}
          <span className="text-red-400 font-bold">shakyaayush82@gmail.com</span>.
        </p>

        {challengeSent ? (
          <div className="w-full bg-slate-900/95 border border-red-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
            <div className="w-14 h-14 bg-red-600/20 border border-red-500/60 rounded-full flex items-center justify-center text-red-400 mx-auto mb-3">
              <Skull className="w-7 h-7 animate-bounce" />
            </div>

            <h3 className="text-lg font-bold text-white mb-1">Challenge Issued to Boss Ayush!</h3>
            
            {emailDelivered ? (
              <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 p-3 rounded-xl text-xs font-semibold mb-4 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Live notification email successfully dispatched to <strong>shakyaayush82@gmail.com</strong>!</span>
              </div>
            ) : (
              <div className="bg-amber-500/20 text-amber-300 border border-amber-500/40 p-3.5 rounded-xl text-xs mb-4 text-left">
                <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-300">
                  <Mail className="w-4 h-4 text-amber-400" />
                  <span>Direct Email Dispatch Ready:</span>
                </div>
                <p className="text-[11px] text-amber-200/90 mb-2.5">
                  Click below to open your email client and send this challenge alert directly to Ayush Shakya:
                </p>
                {mailtoLink && (
                  <a
                    href={mailtoLink}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold rounded-lg text-xs transition-all shadow"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Open Email App to Send to Ayush
                  </a>
                )}
              </div>
            )}

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-2 mb-4">
              <span className="text-xs font-mono text-slate-300 truncate">{inviteLink}</span>
              <button
                onClick={copyToClipboard}
                className="shrink-0 flex items-center gap-1 bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <a
              href={inviteLink}
              className="w-full block py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl shadow-lg transition-all text-sm"
            >
              Enter Boss Waiting Lounge
            </a>
          </div>
        ) : (
          <form
            onSubmit={handleChallenge}
            className="w-full bg-slate-900/90 border border-red-900/70 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md text-left space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-red-400 uppercase tracking-wider mb-1.5">
                Challenger Name
              </label>
              <input
                type="text"
                required
                value={challengerName}
                onChange={(e) => setChallengerName(e.target.value)}
                placeholder="Enter your handle (e.g. Grandmaster Joe)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Your Chess ELO
                </label>
                <input
                  type="number"
                  value={challengerElo}
                  onChange={(e) => setChallengerElo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Notification Target
                </label>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-red-300 font-mono text-xs">
                  <Mail className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="truncate">shakyaayush82@gmail.com</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Challenger War Cry (Message)
              </label>
              <input
                type="text"
                value={warCry}
                onChange={(e) => setWarCry(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black rounded-xl shadow-lg transition-all transform active:scale-98 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                "Summoning Boss..."
              ) : (
                <>
                  <Swords className="w-4 h-4" />
                  Summon Boss Ayush
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

