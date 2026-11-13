"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Chess, Square } from "chess.js";
import { Chessboard, BoardTheme, BoardArrow, BoardHighlight } from "../chess/board";
import { sound } from "@/lib/audio/sound";
import confetti from "canvas-confetti";
import { CHESS_COURSES, type ChessCourse, type CourseLesson } from "@/lib/data/courses";
import { getMoveCoordsFromSan } from "@/lib/data/puzzles";
import {
  GraduationCap,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Award,
  ChevronRight,
  Layers,
  Lightbulb,
  Filter,
  Check,
  Copy,
} from "lucide-react";

export type CourseCategory = "All" | "Middlegame" | "Endgames" | "Tactics" | "Checkmates" | "Strategy" | "Masterpieces";

export const CoursesHub: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<CourseCategory>("All");
  const [selectedCourse, setSelectedCourse] = useState<ChessCourse>(CHESS_COURSES[0]);
  const [selectedLessonIdx, setSelectedLessonIdx] = useState<number>(0);
  const activeLesson: CourseLesson = selectedCourse.lessons[selectedLessonIdx] || selectedCourse.lessons[0];

  // Interactive Board State
  const [game, setGame] = useState<Chess>(new Chess(activeLesson.fen));
  const [stepIndex, setStepIndex] = useState(0);
  const [isBotReplying, setIsBotReplying] = useState(false);
  const [lessonFinished, setLessonFinished] = useState(false);
  const [feedback, setFeedback] = useState<string>(activeLesson.instruction);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [showHint, setShowHint] = useState(true);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [theme] = useState<BoardTheme>("classic");
  const [copiedFen, setCopiedFen] = useState(false);

  // Load completed lessons from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("prin_chess_completed_lessons");
      if (saved) setCompletedLessonIds(JSON.parse(saved));
    } catch {}
  }, []);

  // Filter courses by category
  const filteredCourses = useMemo(() => {
    if (selectedCategory === "All") return CHESS_COURSES;
    return CHESS_COURSES.filter((c) => c.category === selectedCategory);
  }, [selectedCategory]);

  // Load a new lesson
  const handleSelectLesson = (course: ChessCourse, lessonIdx: number) => {
    setSelectedCourse(course);
    setSelectedLessonIdx(lessonIdx);
    const newLesson = course.lessons[lessonIdx] || course.lessons[0];
    setGame(new Chess(newLesson.fen));
    setStepIndex(0);
    setLessonFinished(false);
    setIsBotReplying(false);
    setLastMove(null);
    setFeedback(newLesson.instruction);
    sound.playMove();
  };

  const resetLesson = () => {
    setGame(new Chess(activeLesson.fen));
    setStepIndex(0);
    setLessonFinished(false);
    setIsBotReplying(false);
    setLastMove(null);
    setFeedback(activeLesson.instruction);
    sound.playMove();
  };

  // Student makes interactive move
  const handlePlayerMove = (m: { from: Square; to: Square; promotion?: string; san?: string }): boolean => {
    if (lessonFinished || isBotReplying) return false;

    const expected = activeLesson.moves[stepIndex];
    if (!expected) return false;

    const playedSan = m.san || "";

    if (playedSan === expected.san) {
      // Valid lesson step!
      setLastMove({ from: m.from, to: m.to });
      const nextStep = stepIndex + 1;
      setStepIndex(nextStep);
      setFeedback(`✓ Brilliant! ${expected.explanation}`);

      // Check if finished entire lesson sequence
      if (nextStep >= activeLesson.moves.length) {
        setLessonFinished(true);
        sound.playVictory();
        confetti({ particleCount: 160, spread: 80, origin: { y: 0.6 } });
        if (!completedLessonIds.includes(activeLesson.id)) {
          const updated = [...completedLessonIds, activeLesson.id];
          setCompletedLessonIds(updated);
          try {
            localStorage.setItem("prin_chess_completed_lessons", JSON.stringify(updated));
          } catch {}
        }
        return true;
      }

      // Check if next move is opponent reply
      const isPlayerWhite = activeLesson.playerSide === "white";
      const nextTurnIsBot = (isPlayerWhite && game.turn() === "b") || (!isPlayerWhite && game.turn() === "w");

      if (nextTurnIsBot) {
        setIsBotReplying(true);
        setTimeout(() => {
          const botMoveObj = activeLesson.moves[nextStep];
          try {
            const exec = game.move(botMoveObj.san);
            if (exec) {
              setGame(new Chess(game.fen()));
              setLastMove({ from: exec.from as Square, to: exec.to as Square });
              const stepAfterBot = nextStep + 1;
              setStepIndex(stepAfterBot);

              if (exec.captured) sound.playCapture();
              else sound.playMove();

              if (game.inCheck()) {
                setTimeout(() => sound.playCheck(), 100);
              }

              setIsBotReplying(false);
              setFeedback(`Opponent played ${botMoveObj.san}. ${botMoveObj.explanation}`);

              if (stepAfterBot >= activeLesson.moves.length) {
                setLessonFinished(true);
                sound.playVictory();
                confetti({ particleCount: 160, spread: 80, origin: { y: 0.6 } });
                if (!completedLessonIds.includes(activeLesson.id)) {
                  const updated = [...completedLessonIds, activeLesson.id];
                  setCompletedLessonIds(updated);
                  try {
                    localStorage.setItem("prin_chess_completed_lessons", JSON.stringify(updated));
                  } catch {}
                }
              }
            }
          } catch {
            setIsBotReplying(false);
          }
        }, 500);
      }
      return true;
    }

    // Move is outside lesson solution
    sound.playDefeat();
    setFeedback(`❌ Not quite right. The expected continuation is ${expected.san}. Try again!`);
    return false;
  };

  // Next lesson in course
  const handleNextLesson = () => {
    if (selectedLessonIdx + 1 < selectedCourse.lessons.length) {
      handleSelectLesson(selectedCourse, selectedLessonIdx + 1);
    } else {
      // Find next course
      const currentCourseIdx = filteredCourses.findIndex((c) => c.id === selectedCourse.id);
      const nextCourse = filteredCourses[(currentCourseIdx + 1) % filteredCourses.length];
      handleSelectLesson(nextCourse, 0);
    }
  };

  const handleCopyFen = () => {
    navigator.clipboard.writeText(game.fen());
    setCopiedFen(true);
    setTimeout(() => setCopiedFen(false), 2000);
  };

  // Step through lesson moves manually
  const handleStepBack = () => {
    if (stepIndex <= 0) return;
    const targetPly = stepIndex - 1;
    const replay = new Chess(activeLesson.fen);
    for (let i = 0; i < targetPly; i++) {
      replay.move(activeLesson.moves[i].san);
    }
    setGame(replay);
    setStepIndex(targetPly);
    setLessonFinished(false);
    setLastMove(null);
    setFeedback(targetPly > 0 ? activeLesson.moves[targetPly - 1].explanation : activeLesson.instruction);
    sound.playMove();
  };

  const handleStepForward = () => {
    if (stepIndex >= activeLesson.moves.length) return;
    const moveObj = activeLesson.moves[stepIndex];
    const exec = game.move(moveObj.san);
    if (exec) {
      setGame(new Chess(game.fen()));
      setLastMove({ from: exec.from as Square, to: exec.to as Square });
      const nextStep = stepIndex + 1;
      setStepIndex(nextStep);
      setFeedback(moveObj.explanation);
      if (exec.captured) sound.playCapture();
      else sound.playMove();

      if (nextStep >= activeLesson.moves.length) {
        setLessonFinished(true);
        sound.playVictory();
        confetti({ particleCount: 160, spread: 80, origin: { y: 0.6 } });
        if (!completedLessonIds.includes(activeLesson.id)) {
          const updated = [...completedLessonIds, activeLesson.id];
          setCompletedLessonIds(updated);
          try {
            localStorage.setItem("prin_chess_completed_lessons", JSON.stringify(updated));
          } catch {}
        }
      }
    }
  };

  // Target move for green arrow hints
  const currentExpected = activeLesson.moves[stepIndex];
  const targetCoords =
    currentExpected && showHint && !lessonFinished
      ? getMoveCoordsFromSan(game.fen(), currentExpected.san)
      : null;

  const customArrows: BoardArrow[] = targetCoords
    ? [{ from: targetCoords.from, to: targetCoords.to, color: "#22c55e" }]
    : [];
  const customHighlights: BoardHighlight[] = targetCoords
    ? [
        { square: targetCoords.from, color: "rgba(34, 197, 94, 0.4)" },
        { square: targetCoords.to, color: "rgba(34, 197, 94, 0.55)" },
      ]
    : [];

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Category Pills Navigation */}
      <div className="flex flex-wrap items-center justify-between bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-3 gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            Curriculum:
          </span>
          {(
            [
              { id: "All", label: "All Topics" },
              { id: "Middlegame", label: "⚡ Middlegame" },
              { id: "Endgames", label: "🏰 Endgames" },
              { id: "Tactics", label: "⚔️ Tactics" },
              { id: "Checkmates", label: "👑 Checkmates" },
              { id: "Strategy", label: "🧠 Strategy" },
              { id: "Masterpieces", label: "💎 Masterpieces" },
            ] as const
          ).map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count =
              cat.id === "All"
                ? CHESS_COURSES.length
                : CHESS_COURSES.filter((c) => c.category === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  if (cat.id !== "All") {
                    const match = CHESS_COURSES.find((c) => c.category === cat.id);
                    if (match && match.id !== selectedCourse.id) {
                      handleSelectLesson(match, 0);
                    }
                  }
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isSelected ? "bg-blue-700/80 text-blue-100" : "bg-slate-900 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-xl">
          <Award className="w-4 h-4 text-emerald-400" />
          <span>
            {completedLessonIds.length} /{" "}
            {CHESS_COURSES.reduce((sum, c) => sum + c.lessons.length, 0)} Lessons Mastered
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
        {/* Left Column: Interactive Chessboard */}
        <div className="lg:col-span-8 flex flex-col items-center">
          {/* Lesson Breadcrumb & Side Badge Bar */}
          <div className="flex flex-wrap items-center justify-between w-full max-w-[600px] mb-2 px-1 gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl p-1.5 bg-slate-800/80 rounded-xl border border-slate-700">
                {selectedCourse.icon}
              </span>
              <div>
                <span className="text-[11px] font-mono font-bold text-blue-400 block -mb-0.5">
                  {selectedCourse.title} • Lesson {selectedLessonIdx + 1}/{selectedCourse.lessons.length}
                </span>
                <h3 className="text-base font-bold text-white leading-tight">{activeLesson.title}</h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                {activeLesson.playerSide === "white" ? "⚪ You: White" : "⚫ You: Black"}
              </span>
              <button
                onClick={() => setShowHint(!showHint)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                  showHint
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                }`}
                title="Toggle on-board move hints"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                {showHint ? "Hints On" : "Hints Off"}
              </button>
              <button
                onClick={resetLesson}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
                title="Reset Lesson"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Board */}
          <Chessboard
            game={game}
            orientation={activeLesson.playerSide}
            onMove={handlePlayerMove}
            interactive={!isBotReplying && !lessonFinished}
            allowedColor={activeLesson.playerSide === "white" ? "w" : "b"}
            theme={theme}
            lastMove={lastMove}
            customArrows={customArrows}
            customHighlights={customHighlights}
          />

          {/* Move Stepper Toolbar */}
          <div className="flex items-center justify-between w-full max-w-[600px] mt-3 px-1 gap-2">
            <button
              onClick={handleStepBack}
              disabled={stepIndex <= 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold border border-slate-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Previous Move
            </button>

            <span className="text-xs font-mono text-slate-400 font-bold bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
              Move {stepIndex} / {activeLesson.moves.length}
            </span>

            <button
              onClick={handleStepForward}
              disabled={stepIndex >= activeLesson.moves.length}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:pointer-events-none text-xs font-bold transition-colors shadow-md"
            >
              Next Move
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Live Feedback Banner */}
          <div className="w-full max-w-[600px] mt-3 p-4 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Instruction & Concept
              </span>
              <p className="text-sm font-medium text-slate-100 leading-relaxed">{feedback}</p>
            </div>
          </div>

          {/* Completion Modal / Card */}
          {lessonFinished && (
            <div className="w-full max-w-[600px] mt-4 p-5 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl shadow-2xl flex flex-col gap-3 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">Lesson Completed! 🎓</h4>
                  <p className="text-xs text-emerald-300">Great job mastering this tactical theme.</p>
                </div>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-300">
                <strong className="text-white block mb-0.5">Grandmaster Key Takeaway:</strong>
                {activeLesson.keyTakeaway}
              </div>

              <button
                onClick={handleNextLesson}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2"
              >
                Next Lesson <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* FEN Toolbar */}
          <div className="w-full max-w-[600px] mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono text-[11px] truncate max-w-[280px] text-slate-500">
              FEN: {game.fen().split(" ")[0]}...
            </span>
            <button
              onClick={handleCopyFen}
              className="flex items-center gap-1 text-[11px] font-bold text-slate-300 hover:text-white px-2 py-1 rounded bg-slate-900 border border-slate-700 hover:border-slate-600 transition-colors"
              title="Copy position FEN"
            >
              {copiedFen ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied FEN</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-slate-400" />
                  <span>Copy FEN</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Course Catalog & Curriculum Explorer */}
        <div className="lg:col-span-4 flex flex-col gap-4 w-full">
          {/* Active Course Card */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {selectedCourse.level} • {selectedCourse.category}
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {completedLessonIds.filter((id) => selectedCourse.lessons.some((l) => l.id === id)).length}/
                {selectedCourse.lessons.length} Done
              </span>
            </div>

            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <span>{selectedCourse.icon}</span> {selectedCourse.title}
            </h3>
            <p className="text-xs text-slate-400 line-clamp-2 mb-3">{selectedCourse.description}</p>

            {/* Lessons List in Active Course */}
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {selectedCourse.lessons.map((lesson, idx) => {
                const isSelected = selectedLessonIdx === idx;
                const isDone = completedLessonIds.includes(lesson.id);

                return (
                  <button
                    key={lesson.id}
                    onClick={() => handleSelectLesson(selectedCourse, idx)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-blue-600/25 border-blue-500 text-white shadow-md"
                        : "bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-mono flex items-center justify-center shrink-0 border border-slate-700">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-medium truncate">{lesson.title}</span>
                    </div>
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* All Courses Shelf */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-400" />
                Courses Catalog ({filteredCourses.length})
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {selectedCategory === "All" ? "Showing All" : selectedCategory}
              </span>
            </div>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {filteredCourses.map((course) => {
                const isCurrent = selectedCourse.id === course.id;
                const completedCount = completedLessonIds.filter((id) =>
                  course.lessons.some((l) => l.id === id)
                ).length;

                return (
                  <button
                    key={course.id}
                    onClick={() => handleSelectLesson(course, 0)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isCurrent
                        ? "bg-blue-600/20 border-blue-500 shadow-md ring-1 ring-blue-500/50"
                        : "bg-slate-900/60 border-slate-800 hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="text-2xl shrink-0">{course.icon}</span>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">{course.title}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono text-slate-400 bg-slate-800 border border-slate-700">
                            {course.level}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 truncate block mt-0.5">
                          {course.subtitle}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-bold text-slate-400 shrink-0 ml-2">
                      {completedCount}/{course.lessons.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
