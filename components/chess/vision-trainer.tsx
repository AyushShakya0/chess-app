"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { type Square } from "chess.js";
import { sound } from "@/lib/audio/sound";
import confetti from "canvas-confetti";
import {
  Eye,
  EyeOff,
  Trophy,
  Flame,
  RotateCcw,
  Volume2,
  VolumeX,
  Play,
  Square as SquareIcon,
  HelpCircle,
  Zap,
} from "lucide-react";
import {
  FILES,
  RANKS,
  type BoardOrientation,
  type VisionTrainingMode,
  type VisionHighScore,
  getRandomSquare,
  getSquareColor,
  generateCoordinateChoices,
  loadVisionHighScores,
  saveVisionHighScores,
} from "@/lib/chess/vision-engine";

export const VisionTrainer: React.FC = () => {
  const [orientation, setOrientation] = useState<BoardOrientation>("white");
  const [trainingMode, setTrainingMode] = useState<VisionTrainingMode>("find-square");
  const [duration, setDuration] = useState<30 | 60 | 0>(30); // 0 = endless

  // Options
  const [hideLabels, setHideLabels] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [showColorHint, setShowColorHint] = useState(true);

  // Challenge Session State
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [targetSquare, setTargetSquare] = useState<Square>("e4");
  const [nameChoices, setNameChoices] = useState<Square[]>([]);

  // Feedback State
  const [feedbackSquare, setFeedbackSquare] = useState<{
    square: Square;
    status: "correct" | "wrong";
  } | null>(null);

  // High Scores
  const [highScores, setHighScores] = useState<VisionHighScore>(loadVisionHighScores);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Audio Speech Pronunciation
  const speakSquare = useCallback(
    (sq: Square) => {
      if (!speechEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
      try {
        window.speechSynthesis.cancel();
        const file = sq[0].toUpperCase();
        const rank = sq[1];
        const utterance = new SpeechSynthesisUtterance(`${file} ${rank}`);
        utterance.rate = 1.25;
        window.speechSynthesis.speak(utterance);
      } catch {}
    },
    [speechEnabled]
  );

  // Advance to next square
  const advanceToNextSquare = useCallback(
    (prevSq: Square) => {
      const next = getRandomSquare(prevSq);
      setTargetSquare(next);
      if (trainingMode === "name-square") {
        setNameChoices(generateCoordinateChoices(next));
      }
      speakSquare(next);
    },
    [trainingMode, speakSquare]
  );

  // End Session
  const finishSession = useCallback(() => {
    setIsPlaying(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    sound.playVictory();

    // Check High Score
    const currentBest = orientation === "white" ? highScores.whiteBest : highScores.blackBest;
    if (score > currentBest) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
      const updated: VisionHighScore = {
        ...highScores,
        whiteBest: orientation === "white" ? score : highScores.whiteBest,
        blackBest: orientation === "black" ? score : highScores.blackBest,
        totalPracticed: highScores.totalPracticed + score,
      };
      setHighScores(updated);
      saveVisionHighScores(updated);
    } else {
      const updated: VisionHighScore = {
        ...highScores,
        totalPracticed: highScores.totalPracticed + score,
      };
      setHighScores(updated);
      saveVisionHighScores(updated);
    }
  }, [orientation, score, highScores]);

  // Start Session
  const startSession = () => {
    setIsPlaying(true);
    setScore(0);
    setMistakes(0);
    setStreak(0);
    setTimeLeft(duration === 0 ? 9999 : duration);
    setFeedbackSquare(null);
    startTimeRef.current = Date.now();

    const initial = getRandomSquare();
    setTargetSquare(initial);
    if (trainingMode === "name-square") {
      setNameChoices(generateCoordinateChoices(initial));
    }
    speakSquare(initial);
  };

  // Timer Countdown
  useEffect(() => {
    if (isPlaying && duration > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            finishSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, duration, finishSession]);

  // Handle Square Selection in "Find Square" Mode
  const handleSquareClick = (sq: Square) => {
    if (!isPlaying) return;

    if (sq === targetSquare) {
      // Correct!
      sound.playMove();
      setScore((s) => s + 1);
      setStreak((st) => st + 1);
      setFeedbackSquare({ square: sq, status: "correct" });
      setTimeout(() => setFeedbackSquare(null), 250);
      advanceToNextSquare(targetSquare);
    } else {
      // Wrong!
      sound.playDefeat();
      setMistakes((m) => m + 1);
      setStreak(0);
      setFeedbackSquare({ square: sq, status: "wrong" });
      setTimeout(() => setFeedbackSquare(null), 400);
    }
  };

  // Handle Choice in "Name Square" Mode
  const handleChoiceClick = (choice: Square) => {
    if (!isPlaying) return;

    if (choice === targetSquare) {
      sound.playMove();
      setScore((s) => s + 1);
      setStreak((st) => st + 1);
      setFeedbackSquare({ square: targetSquare, status: "correct" });
      setTimeout(() => setFeedbackSquare(null), 250);
      advanceToNextSquare(targetSquare);
    } else {
      sound.playDefeat();
      setMistakes((m) => m + 1);
      setStreak(0);
      setFeedbackSquare({ square: targetSquare, status: "wrong" });
      setTimeout(() => setFeedbackSquare(null), 400);
    }
  };

  // Compute rendered order of files & ranks based on orientation
  const renderRanks = orientation === "white" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const renderFiles = orientation === "white" ? FILES : [...FILES].reverse();

  const totalAttempts = score + mistakes;
  const accuracy = totalAttempts > 0 ? Math.round((score / totalAttempts) * 100) : 100;
  const bestRecord = orientation === "white" ? highScores.whiteBest : highScores.blackBest;

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-5xl mx-auto w-full">
      {/* Header Hub */}
      <div className="w-full bg-slate-800/90 border border-slate-700 rounded-3xl p-5 mb-6 shadow-2xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  Board Vision &amp; Notation Trainer
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Master algebraic coordinates to read chess books, calculate blindfold, and visualize moves instantly
                </p>
              </div>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-700">
            <button
              onClick={() => {
                setTrainingMode("find-square");
                if (isPlaying) startSession();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                trainingMode === "find-square"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Find Square (Notation → Board)
            </button>
            <button
              onClick={() => {
                setTrainingMode("name-square");
                if (isPlaying) startSession();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                trainingMode === "name-square"
                  ? "bg-amber-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Name Square (Board → Notation)
            </button>
          </div>
        </div>

        {/* Toolbar & Config */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Perspective Selector */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700 text-xs font-bold">
              <button
                onClick={() => setOrientation("white")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  orientation === "white" ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                White Side
              </button>
              <button
                onClick={() => setOrientation("black")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  orientation === "black" ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                Black Side
              </button>
            </div>

            {/* Time Sprint Options */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700 text-xs font-bold">
              {([30, 60, 0] as const).map((t) => (
                <button
                  key={t}
                  disabled={isPlaying}
                  onClick={() => setDuration(t)}
                  className={`px-2.5 py-1 rounded-lg transition-all disabled:opacity-50 ${
                    duration === t ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t === 0 ? "Infinite" : `${t}s`}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Speech Pronunciation Toggle */}
            <button
              onClick={() => setSpeechEnabled(!speechEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors font-semibold ${
                speechEnabled
                  ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                  : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
              }`}
              title="Speak square coordinate aloud"
            >
              {speechEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>Voice</span>
            </button>

            {/* Blindfold Labels Toggle */}
            <button
              onClick={() => setHideLabels(!hideLabels)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors font-semibold ${
                hideLabels
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                  : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
              }`}
              title="Hide coordinate letters and numbers on the board for blindfold calculation"
            >
              {hideLabels ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>Blindfold</span>
            </button>

            {/* Color Hint Toggle */}
            <button
              onClick={() => setShowColorHint(!showColorHint)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors font-semibold ${
                showColorHint
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                  : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
              }`}
              title="Show light/dark square hint badge"
            >
              <SquareIcon className="w-3.5 h-3.5" />
              <span>Color Badge</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
        {/* Left: 8x8 Board */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div className="relative p-2 bg-slate-900 border-2 border-slate-700/80 rounded-2xl shadow-2xl select-none">
            <div
              className="grid grid-cols-8 gap-0 border border-slate-700/50 rounded-xl overflow-hidden"
              style={{
                width: "min(88vw, 540px)",
                height: "min(88vw, 540px)",
              }}
            >
              {renderRanks.map((r) =>
                renderFiles.map((f) => {
                  const sq = `${f}${r}` as Square;
                  const isLight = getSquareColor(sq) === "light";
                  const isTarget = isPlaying && trainingMode === "name-square" && targetSquare === sq;
                  const isFeedback = feedbackSquare && feedbackSquare.square === sq;

                  return (
                    <div
                      key={sq}
                      onClick={() => handleSquareClick(sq)}
                      className={`relative flex items-center justify-center cursor-pointer transition-all duration-100 ${
                        isFeedback && feedbackSquare.status === "correct"
                          ? "bg-emerald-500 ring-4 ring-emerald-300 z-10 scale-95"
                          : isFeedback && feedbackSquare.status === "wrong"
                          ? "bg-red-600 ring-4 ring-red-400 z-10 animate-shake"
                          : isTarget
                          ? "bg-amber-400/90 ring-4 ring-amber-300 animate-pulse z-10"
                          : isLight
                          ? "bg-[#ebecd0] hover:bg-[#d8d9b8]"
                          : "bg-[#739552] hover:bg-[#638244]"
                      }`}
                    >
                      {/* Optional Coordinate Labels */}
                      {!hideLabels && (
                        <>
                          {/* Rank on right-most or left-most edge */}
                          {f === (orientation === "white" ? "a" : "h") && (
                            <span
                              className={`absolute top-0.5 left-1 text-[10px] font-black select-none pointer-events-none ${
                                isLight ? "text-[#739552]" : "text-[#ebecd0]"
                              }`}
                            >
                              {r}
                            </span>
                          )}
                          {/* File along bottom edge */}
                          {r === (orientation === "white" ? 1 : 8) && (
                            <span
                              className={`absolute bottom-0.5 right-1 text-[10px] font-black select-none pointer-events-none uppercase ${
                                isLight ? "text-[#739552]" : "text-[#ebecd0]"
                              }`}
                            >
                              {f}
                            </span>
                          )}
                        </>
                      )}

                      {/* Name-Square pulsating pin marker */}
                      {isTarget && (
                        <div className="w-5 h-5 rounded-full bg-slate-950 border-2 border-white shadow-lg animate-ping" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right: Challenge Panel & Prompts */}
        <div className="lg:col-span-4 flex flex-col gap-4 w-full">
          {/* Active Target Banner */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 shadow-xl text-center relative overflow-hidden">
            {isPlaying ? (
              <>
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block mb-1">
                  {trainingMode === "find-square" ? "Click This Square on the Board" : "What Square is Highlighted?"}
                </span>

                {trainingMode === "find-square" ? (
                  <div className="py-2">
                    <span className="text-6xl sm:text-7xl font-mono font-black text-amber-400 tracking-tight block">
                      {targetSquare.toUpperCase()}
                    </span>
                    {showColorHint && (
                      <span className="inline-block mt-2 text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                        {getSquareColor(targetSquare) === "light" ? "⚪ Light Square" : "⚫ Dark Square"}
                      </span>
                    )}
                  </div>
                ) : (
                  /* Name-Square Multiple Choice Choices */
                  <div className="py-2">
                    <p className="text-xs text-slate-400 mb-3">Select the correct algebraic notation:</p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {nameChoices.map((choice) => (
                        <button
                          key={choice}
                          onClick={() => handleChoiceClick(choice)}
                          className="py-3.5 px-4 bg-slate-900 hover:bg-blue-600 border border-slate-700 hover:border-blue-500 rounded-xl font-mono font-black text-xl text-white shadow-md transition-all active:scale-95"
                        >
                          {choice.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 mb-3">
                  <Play className="w-7 h-7 ml-1" />
                </div>
                <h3 className="text-lg font-black text-white mb-1">Ready for the Sprint?</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mb-5">
                  {trainingMode === "find-square"
                    ? "Coordinates will be called out. Tap the correct square as fast as you can!"
                    : "Squares will light up on the board. Identify their algebraic coordinate!"}
                </p>
                <button
                  onClick={startSession}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-xl text-sm shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Start {duration > 0 ? `${duration}-Second Sprint` : "Practice"}
                </button>
              </div>
            )}
          </div>

          {/* Stats Bar */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-[11px] font-bold text-slate-400 block mb-0.5">Score</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">{score}</span>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-[11px] font-bold text-slate-400 block mb-0.5">Time</span>
                <span className="text-2xl font-black text-blue-400 font-mono">
                  {duration === 0 ? "∞" : `${timeLeft}s`}
                </span>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-[11px] font-bold text-slate-400 block mb-0.5">Streak</span>
                <div className="flex items-center justify-center gap-1">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span className="text-2xl font-black text-amber-400 font-mono">{streak}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>
                  Best ({orientation}): <strong className="text-amber-400 font-mono">{bestRecord}</strong>
                </span>
              </div>
              <div>
                Accuracy: <strong className="text-white font-mono">{accuracy}%</strong>
              </div>
            </div>

            {isPlaying && (
              <button
                onClick={finishSession}
                className="w-full py-2 bg-slate-900 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                End Sprint
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
