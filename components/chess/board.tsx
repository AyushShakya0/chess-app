"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Chess, Square, Move } from "chess.js";
import { ChessPiece, PieceType, PieceColor } from "./pieces";
import { sound } from "@/lib/audio/sound";

export type BoardTheme = "classic" | "wood" | "glass" | "neon";

export interface BoardArrow {
  from: Square;
  to: Square;
  color?: string;
}

export interface BoardHighlight {
  square: Square;
  color: string;
}

interface QueuedPremove {
  from: Square;
  to: Square;
  promotion?: string;
}

interface ChessboardProps {
  game: Chess;
  orientation?: "white" | "black";
  onMove?: (move: { from: Square; to: Square; promotion?: string; san?: string }) => boolean | void;
  interactive?: boolean;
  premoveEnabled?: boolean;
  autoPromoteToQueen?: boolean;
  showLegalMoves?: boolean;
  theme?: BoardTheme;
  isCheck?: boolean;
  lastMove?: { from: Square; to: Square } | null;
  customArrows?: BoardArrow[];
  customHighlights?: BoardHighlight[];
  allowedColor?: "w" | "b";
  boardSizeClass?: string;
  customMoveHandler?: (from: Square, to: Square) => boolean;
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

export const Chessboard: React.FC<ChessboardProps> = ({
  game,
  orientation = "white",
  onMove,
  interactive = true,
  premoveEnabled = true,
  autoPromoteToQueen = true,
  showLegalMoves = true,
  theme = "classic",
  isCheck = false,
  lastMove = null,
  customArrows,
  customHighlights,
  allowedColor,
  boardSizeClass,
  customMoveHandler,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [draggedSquare, setDraggedSquare] = useState<Square | null>(null);
  const [premove, setPremove] = useState<QueuedPremove | null>(null);
  const [arrows, setArrows] = useState<BoardArrow[]>([]);
  const [highlights, setHighlights] = useState<BoardHighlight[]>([]);
  const [rightDragStart, setRightDragStart] = useState<Square | null>(null);
  const [promotionPending, setPromotionPending] = useState<{ from: Square; to: Square } | null>(null);

  const allArrows: BoardArrow[] = [
    ...arrows,
    ...(customArrows || []).map((a) => ({ from: a.from, to: a.to, color: a.color || "#22c55e" })),
  ];
  const allHighlights: BoardHighlight[] = [
    ...highlights,
    ...(customHighlights || []),
  ];

  const boardRef = useRef<HTMLDivElement>(null);

  const isFlipped = orientation === "black";
  const displayFiles = isFlipped ? [...FILES].reverse() : FILES;
  const displayRanks = isFlipped ? [...RANKS].reverse() : RANKS;

  // Board Theme Styles
  const getSquareColor = (isLight: boolean) => {
    switch (theme) {
      case "wood":
        return isLight ? "bg-[#e9cfad]" : "bg-[#ad7d52]";
      case "glass":
        return isLight ? "bg-[#334155]" : "bg-[#1e293b]";
      case "neon":
        return isLight ? "bg-[#1e1b4b]" : "bg-[#311042]";
      case "classic":
      default:
        return isLight ? "bg-[#ebecd0]" : "bg-[#739552]";
    }
  };

  // Helper to convert square to coordinates on 0-7 grid
  const squareToCoords = useCallback((sq: Square) => {
    const file = sq.charCodeAt(0) - 97; // 'a' -> 0
    const rank = parseInt(sq[1], 10) - 1; // '1' -> 0
    const x = isFlipped ? 7 - file : file;
    const y = isFlipped ? rank : 7 - rank;
    return { x, y };
  }, [isFlipped]);

  // Determine modifier key color for arrows & highlights
  const getModifierColor = (e: React.MouseEvent) => {
    if (e.shiftKey) return "#22c55e"; // Green
    if (e.altKey) return "#ef4444"; // Red
    if (e.ctrlKey || e.metaKey) return "#3b82f6"; // Blue
    return "#eab308"; // Yellow / Orange (default)
  };

  // Execute or validate move
  const attemptMove = (from: Square, to: Square, promotionChoice = "q") => {
    const piece = game.get(from);
    if (!piece) return false;

    if (allowedColor && piece.color !== allowedColor) return false;

    const isCurrentTurn = (piece.color === "w" && game.turn() === "w") || (piece.color === "b" && game.turn() === "b");

    // Check if move is pawn promotion
    const isPawnPromotion =
      piece.type === "p" &&
      ((piece.color === "w" && from[1] === "7" && to[1] === "8") ||
        (piece.color === "b" && from[1] === "2" && to[1] === "1"));

    if (isPawnPromotion && !autoPromoteToQueen && isCurrentTurn) {
      setPromotionPending({ from, to });
      return true;
    }

    if (isCurrentTurn) {
      if (customMoveHandler) {
        const handled = customMoveHandler(from, to);
        if (handled) {
          setSelectedSquare(null);
          setLegalMoves([]);
          setArrows([]);
          setHighlights([]);
          return true;
        }
      }

      try {
        const move = game.move({
          from,
          to,
          promotion: isPawnPromotion ? promotionChoice : undefined,
        });

        if (move) {
          // Play sound
          if (move.captured) {
            sound.playCapture();
          } else if (move.flags.includes("k") || move.flags.includes("q")) {
            sound.playCastle();
          } else {
            sound.playMove();
          }

          if (game.inCheck()) {
            setTimeout(() => sound.playCheck(), 100);
          }

          if (onMove) {
            const allowed = onMove({ from, to, promotion: isPawnPromotion ? promotionChoice : undefined, san: move.san });
            if (allowed === false) {
              game.undo();
              setSelectedSquare(null);
              setLegalMoves([]);
              return false;
            }
          }

          // Clear annotations and selections
          setSelectedSquare(null);
          setLegalMoves([]);
          setArrows([]);
          setHighlights([]);
          return true;
        }
      } catch {
        return false;
      }
    } else if (premoveEnabled && !allowedColor) {
      // Queue Premove
      setPremove({ from, to, promotion: isPawnPromotion ? "q" : undefined });
      sound.playPremove();
      setSelectedSquare(null);
      setLegalMoves([]);
      return true;
    }

    return false;
  };

  // Attempt to execute queued premove on turn change
  useEffect(() => {
    if (premove && interactive) {
      const isPlayerTurn = (orientation === "white" && game.turn() === "w") || (orientation === "black" && game.turn() === "b");
      if (isPlayerTurn) {
        const success = attemptMove(premove.from, premove.to, premove.promotion);
        setPremove(null);
        if (!success) {
          sound.playMove(); // Missed premove
        }
      }
    }
  }, [game.fen(), premove, interactive, orientation]);

  // Click on square
  const handleSquareClick = (sq: Square) => {
    if (!interactive) return;

    // Clear right-click annotations on left click
    if (arrows.length > 0 || highlights.length > 0) {
      setArrows([]);
      setHighlights([]);
    }

    if (selectedSquare) {
      if (selectedSquare === sq) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      const moved = attemptMove(selectedSquare, sq);
      if (moved) return;
    }

    // Select piece
    const piece = game.get(sq);
    if (piece) {
      if (allowedColor && piece.color !== allowedColor) return;
      const isTurn = (piece.color === "w" && game.turn() === "w") || (piece.color === "b" && game.turn() === "b");
      if (isTurn || (premoveEnabled && !allowedColor)) {
        setSelectedSquare(sq);
        const moves = game.moves({ square: sq, verbose: true }) as Move[];
        setLegalMoves(moves.map((m) => m.to as Square));
        return;
      }
    }

    setSelectedSquare(null);
    setLegalMoves([]);
  };

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, sq: Square) => {
    if (!interactive) return;
    const piece = game.get(sq);
    if (piece && allowedColor && piece.color !== allowedColor) return;
    setDraggedSquare(sq);
    handleSquareClick(sq);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, sq: Square) => {
    e.preventDefault();
    if (draggedSquare && draggedSquare !== sq) {
      attemptMove(draggedSquare, sq);
    }
    setDraggedSquare(null);
  };

  // Right-click arrows & highlights
  const handleMouseDown = (e: React.MouseEvent, sq: Square) => {
    if (e.button === 2) {
      // Right click
      e.preventDefault();
      setRightDragStart(sq);
    }
  };

  const handleMouseUp = (e: React.MouseEvent, sq: Square) => {
    if (e.button === 2) {
      e.preventDefault();
      const color = getModifierColor(e);

      if (rightDragStart && rightDragStart !== sq) {
        // Toggle arrow
        setArrows((prev) => {
          const exists = prev.some((a) => a.from === rightDragStart && a.to === sq);
          if (exists) {
            return prev.filter((a) => !(a.from === rightDragStart && a.to === sq));
          }
          return [...prev, { from: rightDragStart, to: sq, color }];
        });
      } else if (rightDragStart === sq) {
        // Toggle square highlight
        setHighlights((prev) => {
          const exists = prev.some((h) => h.square === sq);
          if (exists) {
            return prev.filter((h) => h.square !== sq);
          }
          return [...prev, { square: sq, color }];
        });
        // Cancel queued premove if right-clicked
        if (premove) {
          setPremove(null);
        }
      }
      setRightDragStart(null);
    }
  };

  // Find King square for check warning
  const getKingInCheckSquare = (): Square | null => {
    if (!game.inCheck()) return null;
    const board = game.board();
    const turn = game.turn();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === "k" && piece.color === turn) {
          return `${FILES[c]}${8 - r}` as Square;
        }
      }
    }
    return null;
  };

  const kingCheckSquare = isCheck || game.inCheck() ? getKingInCheckSquare() : null;

  return (
    <div className="relative inline-block select-none shadow-2xl rounded-lg overflow-hidden border border-slate-700/50 bg-slate-900">
      <div
        ref={boardRef}
        onContextMenu={(e) => e.preventDefault()}
        className={`grid grid-cols-8 grid-rows-8 relative ${
          boardSizeClass || "w-[320px] h-[320px] sm:w-[460px] sm:h-[460px] md:w-[540px] md:h-[540px] lg:w-[600px] lg:h-[600px]"
        }`}
      >
        {displayRanks.map((rank, rankIndex) =>
          displayFiles.map((file, fileIndex) => {
            const square = `${file}${rank}` as Square;
            const piece = game.get(square);
            const isLight = (file.charCodeAt(0) - 97 + parseInt(rank, 10)) % 2 !== 0;

            const isSelected = selectedSquare === square;
            const isLegalMove = legalMoves.includes(square);
            const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square);
            const isPremove = premove && (premove.from === square || premove.to === square);
            const isKingCheck = kingCheckSquare === square;
            const highlight = allHighlights.find((h) => h.square === square);

            return (
              <div
                key={square}
                onClick={() => handleSquareClick(square)}
                onMouseDown={(e) => handleMouseDown(e, square)}
                onMouseUp={(e) => handleMouseUp(e, square)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, square)}
                className={`relative flex items-center justify-center cursor-pointer transition-colors ${getSquareColor(
                  isLight
                )}`}
              >
                {/* Last move highlight */}
                {isLastMove && <div className="absolute inset-0 bg-yellow-400/35 pointer-events-none" />}

                {/* Selected square highlight */}
                {isSelected && <div className="absolute inset-0 bg-yellow-400/55 ring-2 ring-yellow-400 pointer-events-none" />}

                {/* King in Check pulse */}
                {isKingCheck && (
                  <div className="absolute inset-0 bg-red-600/70 animate-pulse ring-2 ring-red-500 pointer-events-none" />
                )}

                {/* Queued premove highlight */}
                {isPremove && (
                  <div className="absolute inset-0 bg-blue-500/40 ring-1 ring-blue-400 pointer-events-none" />
                )}

                {/* Right click user painted highlight */}
                {highlight && (
                  <div
                    className="absolute inset-0 pointer-events-none opacity-50"
                    style={{ backgroundColor: highlight.color }}
                  />
                )}

                {/* Legal move indicator */}
                {showLegalMoves && isLegalMove && (
                  <div
                    className={`absolute z-10 pointer-events-none rounded-full ${
                      piece
                        ? "w-full h-full border-4 border-slate-900/30 rounded-full"
                        : "w-3 h-3 sm:w-4 sm:h-4 bg-slate-900/30 rounded-full"
                    }`}
                  />
                )}

                {/* Chess piece */}
                {piece && (
                  <div
                    draggable={interactive}
                    onDragStart={(e) => handleDragStart(e, square)}
                    className="w-full h-full flex items-center justify-center z-10 active:scale-105 transition-transform duration-75"
                  >
                    <ChessPiece type={piece.type as PieceType} color={piece.color as PieceColor} size={64} />
                  </div>
                )}

                {/* Rank coordinates (left column) */}
                {fileIndex === 0 && (
                  <span
                    className={`absolute top-0.5 left-1 text-[10px] sm:text-xs font-bold pointer-events-none ${
                      isLight ? "text-slate-700/70" : "text-white/80"
                    }`}
                  >
                    {rank}
                  </span>
                )}

                {/* File coordinates (bottom row) */}
                {rankIndex === 7 && (
                  <span
                    className={`absolute bottom-0.5 right-1 text-[10px] sm:text-xs font-bold pointer-events-none ${
                      isLight ? "text-slate-700/70" : "text-white/80"
                    }`}
                  >
                    {file}
                  </span>
                )}
              </div>
            );
          })
        )}

        {/* SVG Overlay for Right-Click Arrows */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
          <defs>
            <marker
              id="arrowhead-yellow"
              markerWidth="4"
              markerHeight="4"
              refX="2"
              refY="2"
              orient="auto"
            >
              <polygon points="0 0, 4 2, 0 4" fill="#eab308" opacity="0.85" />
            </marker>
            <marker
              id="arrowhead-green"
              markerWidth="4"
              markerHeight="4"
              refX="2"
              refY="2"
              orient="auto"
            >
              <polygon points="0 0, 4 2, 0 4" fill="#22c55e" opacity="0.85" />
            </marker>
            <marker
              id="arrowhead-red"
              markerWidth="4"
              markerHeight="4"
              refX="2"
              refY="2"
              orient="auto"
            >
              <polygon points="0 0, 4 2, 0 4" fill="#ef4444" opacity="0.85" />
            </marker>
            <marker
              id="arrowhead-blue"
              markerWidth="4"
              markerHeight="4"
              refX="2"
              refY="2"
              orient="auto"
            >
              <polygon points="0 0, 4 2, 0 4" fill="#3b82f6" opacity="0.85" />
            </marker>
          </defs>

          {allArrows.map((arr, idx) => {
            const start = squareToCoords(arr.from);
            const end = squareToCoords(arr.to);
            const sqSize = 100 / 8; // in percentage
            const x1 = `${(start.x + 0.5) * sqSize}%`;
            const y1 = `${(start.y + 0.5) * sqSize}%`;
            const x2 = `${(end.x + 0.5) * sqSize}%`;
            const y2 = `${(end.y + 0.5) * sqSize}%`;

            let markerId = "arrowhead-yellow";
            if (arr.color === "#22c55e") markerId = "arrowhead-green";
            if (arr.color === "#ef4444") markerId = "arrowhead-red";
            if (arr.color === "#3b82f6") markerId = "arrowhead-blue";

            return (
              <line
                key={idx}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={arr.color}
                strokeWidth="7"
                strokeLinecap="round"
                opacity="0.8"
                markerEnd={`url(#${markerId})`}
              />
            );
          })}
        </svg>

        {/* Under-promotion selection modal */}
        {promotionPending && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-2xl flex flex-col items-center gap-3">
              <span className="text-sm font-semibold text-white">Promote Pawn To:</span>
              <div className="flex gap-2">
                {(["q", "r", "b", "n"] as PieceType[]).map((pType) => (
                  <button
                    key={pType}
                    onClick={() => {
                      attemptMove(promotionPending.from, promotionPending.to, pType);
                      setPromotionPending(null);
                    }}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors border border-slate-600"
                  >
                    <ChessPiece type={pType} color={game.turn() === "w" ? "w" : "b"} size={44} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

