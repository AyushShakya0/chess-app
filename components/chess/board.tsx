"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Chess, Square, Move } from "chess.js";
import { ChessPiece, PieceType, PieceColor } from "./pieces";
import { sound } from "@/lib/audio/sound";
import { useSettings, type BoardTheme, type PieceSetStyle } from "@/lib/stores/settings-store";
import {
  QueuedPremove,
  enqueuePremove,
  clearPremoveQueue,
  getPremoveLegalMoves,
} from "@/lib/chess/premove-queue";

export type { BoardTheme };

export interface BoardArrow {
  from: Square;
  to: Square;
  color?: string;
}

export interface BoardHighlight {
  square: Square;
  color: string;
}

interface PointerDragState {
  square: Square;
  piece: { type: PieceType; color: PieceColor };
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  active: boolean;
}

interface ChessboardProps {
  game: Chess;
  orientation?: "white" | "black";
  onMove?: (move: { from: Square; to: Square; promotion?: string; san?: string }) => boolean | void;
  interactive?: boolean;
  premoveEnabled?: boolean;
  autoPromoteToQueen?: boolean;
  showLegalMoves?: boolean;
  showCoordinates?: boolean;
  theme?: BoardTheme;
  pieceSet?: PieceSetStyle;
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
  showCoordinates: propShowCoordinates,
  theme = "classic",
  pieceSet: propPieceSet,
  isCheck = false,
  lastMove = null,
  customArrows,
  customHighlights,
  allowedColor,
  boardSizeClass,
  customMoveHandler,
}) => {
  const [globalSettings] = useSettings();
  const showCoordinates = typeof propShowCoordinates === "boolean" ? propShowCoordinates : globalSettings.showCoordinates;
  const activePieceSet = propPieceSet || globalSettings.pieceSet || "classic";

  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [draggedSquare, setDraggedSquare] = useState<Square | null>(null);
  const [pointerDrag, setPointerDrag] = useState<PointerDragState | null>(null);
  const [focusedSquare, setFocusedSquare] = useState<Square>(orientation === "black" ? "e7" : "e2");
  const [premoveQueue, setPremoveQueue] = useState<QueuedPremove[]>([]);
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
      case "emerald":
        return isLight ? "bg-[#eeeed2]" : "bg-[#769656]";
      case "obsidian":
        return isLight ? "bg-[#334155]" : "bg-[#0f172a]";
      case "tournament":
        return isLight ? "bg-[#eae9d2]" : "bg-[#4b7399]";
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
  const attemptMove = useCallback((from: Square, to: Square, promotionChoice?: string): boolean => {
    const piece = game.get(from);
    if (!piece) return false;

    if (allowedColor && piece.color !== allowedColor) return false;

    const isCurrentTurn = (piece.color === "w" && game.turn() === "w") || (piece.color === "b" && game.turn() === "b");

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

      // Check legality first with chess.js
      const availableLegalMoves = game.moves({ square: from, verbose: true }) as Move[];
      const legalTargetMoves = availableLegalMoves.filter((m) => m.to === to);
      if (legalTargetMoves.length === 0) {
        return false;
      }

      // Check if move is a pawn promotion
      const isLegalPromotion = legalTargetMoves.some((m) => !!m.promotion);

      if (isLegalPromotion && !autoPromoteToQueen && !promotionChoice) {
        setPromotionPending({ from, to });
        return true;
      }

      const finalPromotion = isLegalPromotion ? (promotionChoice || "q") : undefined;

      try {
        const move = game.move({
          from,
          to,
          promotion: finalPromotion,
        });

        if (move) {
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
            const allowed = onMove({ from, to, promotion: finalPromotion, san: move.san });
            if (allowed === false) {
              game.undo();
              setSelectedSquare(null);
              setLegalMoves([]);
              return false;
            }
          }

          setSelectedSquare(null);
          setLegalMoves([]);
          setArrows([]);
          setHighlights([]);
          return true;
        }
      } catch {
        return false;
      }
    } else if (premoveEnabled) {
      const playerSide = allowedColor || (orientation === "white" ? "w" : "b");
      if (piece.color === playerSide) {
        // Queue Premove
        const isPawn = piece.type === "p";
        const isPromotionRank = (piece.color === "w" && to[1] === "8") || (piece.color === "b" && to[1] === "1");
        const nextMove: QueuedPremove = {
          from,
          to,
          promotion: isPawn && isPromotionRank ? (promotionChoice || "q") : undefined,
        };
        setPremoveQueue((prev) => enqueuePremove(prev, nextMove));
        sound.playPremove();
        setSelectedSquare(null);
        setLegalMoves([]);
        return true;
      }
    }

    return false;
  }, [game, allowedColor, customMoveHandler, autoPromoteToQueen, onMove, premoveEnabled, orientation]);

  // Attempt to execute queued premove on turn change
  useEffect(() => {
    if (premoveQueue.length > 0 && interactive) {
      const isPlayerTurn =
        (orientation === "white" && game.turn() === "w") ||
        (orientation === "black" && game.turn() === "b");
      if (isPlayerTurn) {
        const [head, ...rest] = premoveQueue;
        const success = attemptMove(head.from, head.to, head.promotion);
        if (success) {
          setPremoveQueue(rest);
        } else {
          setPremoveQueue([]);
          sound.playMove(); // Missed premove
        }
      }
    }
  }, [game, premoveQueue, interactive, orientation, attemptMove]);

  // Click on square
  const handleSquareClick = (sq: Square) => {
    if (!interactive) return;

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
      const playerSide = allowedColor || (orientation === "white" ? "w" : "b");
      const isTurn = (piece.color === "w" && game.turn() === "w") || (piece.color === "b" && game.turn() === "b");
      const isPlayerPiece = piece.color === playerSide;

      if (isTurn) {
        setSelectedSquare(sq);
        const moves = game.moves({ square: sq, verbose: true }) as Move[];
        setLegalMoves(moves.map((m) => m.to as Square));
        return;
      } else if (premoveEnabled && isPlayerPiece) {
        setSelectedSquare(sq);
        const premoveDots = getPremoveLegalMoves(game.fen(), premoveQueue, sq, piece.color);
        setLegalMoves(premoveDots);
        return;
      }
    }

    setSelectedSquare(null);
    setLegalMoves([]);
  };

  // Keyboard navigation & movement
  const handleSquareKeyDown = (e: React.KeyboardEvent, square: Square) => {
    const fileChar = square[0];
    const rankNum = parseInt(square[1], 10);
    const fileIdx = FILES.indexOf(fileChar);

    let nextSquare: Square | null = null;
    const isUp = isFlipped ? -1 : 1;
    const isRight = isFlipped ? -1 : 1;

    if (e.key === "ArrowUp") {
      e.preventDefault();
      const newRank = rankNum + isUp;
      if (newRank >= 1 && newRank <= 8) nextSquare = `${fileChar}${newRank}` as Square;
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const newRank = rankNum - isUp;
      if (newRank >= 1 && newRank <= 8) nextSquare = `${fileChar}${newRank}` as Square;
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const newFileIdx = fileIdx - isRight;
      if (newFileIdx >= 0 && newFileIdx < 8) nextSquare = `${FILES[newFileIdx]}${rankNum}` as Square;
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      const newFileIdx = fileIdx + isRight;
      if (newFileIdx >= 0 && newFileIdx < 8) nextSquare = `${FILES[newFileIdx]}${rankNum}` as Square;
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSquareClick(square);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setSelectedSquare(null);
      setLegalMoves([]);
      setArrows([]);
      setHighlights([]);
    }

    if (nextSquare) {
      setFocusedSquare(nextSquare);
      const el = boardRef.current?.querySelector(`[data-square="${nextSquare}"]`) as HTMLElement;
      el?.focus();
    }
  };

  // Pointer Drag events for Touch Screens & Tablets
  const handleSquarePointerDown = (e: React.PointerEvent, square: Square) => {
    if (e.button !== 0 || !interactive) return;
    const piece = game.get(square);
    if (!piece) return;

    const playerSide = allowedColor || (orientation === "white" ? "w" : "b");
    const isPlayerPiece = piece.color === playerSide;
    const isTurn = (piece.color === "w" && game.turn() === "w") || (piece.color === "b" && game.turn() === "b");

    if (!isTurn && (!premoveEnabled || !isPlayerPiece)) return;
    if (allowedColor && piece.color !== allowedColor) return;

    setPointerDrag({
      square,
      piece: { type: piece.type as PieceType, color: piece.color as PieceColor },
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      active: false,
    });

    setSelectedSquare(square);
    if (isTurn) {
      const moves = game.moves({ square, verbose: true }) as Move[];
      setLegalMoves(moves.map((m) => m.to as Square));
    } else {
      const premoveDots = getPremoveLegalMoves(game.fen(), premoveQueue, square, piece.color);
      setLegalMoves(premoveDots);
    }
  };

  const handleBoardPointerMove = (e: React.PointerEvent) => {
    if (!pointerDrag) return;
    const dist = Math.hypot(e.clientX - pointerDrag.startX, e.clientY - pointerDrag.startY);
    setPointerDrag((prev) =>
      prev
        ? {
            ...prev,
            currentX: e.clientX,
            currentY: e.clientY,
            active: prev.active || dist > 6,
          }
        : null
    );
  };

  const handleBoardPointerUp = (e: React.PointerEvent) => {
    if (!pointerDrag) return;
    const wasDragging = pointerDrag.active;
    const fromSquare = pointerDrag.square;
    setPointerDrag(null);

    if (wasDragging) {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const targetEl = el?.closest("[data-square]");
      const toSquare = targetEl?.getAttribute("data-square") as Square | null;

      if (toSquare && toSquare !== fromSquare) {
        attemptMove(fromSquare, toSquare);
      }
    }
  };

  // HTML5 Drag Handlers (Desktop backup)
  const handleDragStart = (e: React.DragEvent, sq: Square) => {
    if (!interactive) return;
    const piece = game.get(sq);
    if (!piece) return;

    const playerSide = allowedColor || (orientation === "white" ? "w" : "b");
    const isPlayerPiece = piece.color === playerSide;
    const isCurrentTurn = (piece.color === "w" && game.turn() === "w") || (piece.color === "b" && game.turn() === "b");

    if (!isCurrentTurn && (!premoveEnabled || !isPlayerPiece)) return;
    if (allowedColor && piece.color !== allowedColor) return;

    setDraggedSquare(sq);
    setSelectedSquare(sq);
    if (isCurrentTurn) {
      const moves = game.moves({ square: sq, verbose: true }) as Move[];
      setLegalMoves(moves.map((m) => m.to as Square));
    } else {
      const premoveDots = getPremoveLegalMoves(game.fen(), premoveQueue, sq, piece.color);
      setLegalMoves(premoveDots);
    }

    e.dataTransfer.setData("text/plain", sq);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, toSq: Square) => {
    e.preventDefault();
    if (!interactive) return;
    const fromSq = (e.dataTransfer.getData("text/plain") || draggedSquare) as Square;
    if (fromSq && fromSq !== toSq) {
      attemptMove(fromSq, toSq);
    }
    setDraggedSquare(null);
  };

  // Right-click annotations
  const handleMouseDown = (e: React.MouseEvent, sq: Square) => {
    if (e.button === 2) {
      if (premoveQueue.length > 0) {
        setPremoveQueue([]);
        sound.playMove();
        return;
      }
      setRightDragStart(sq);
    }
  };

  const handleMouseUp = (e: React.MouseEvent, sq: Square) => {
    if (e.button === 2 && rightDragStart) {
      const color = getModifierColor(e);
      if (rightDragStart === sq) {
        setHighlights((prev) => {
          const exists = prev.some((h) => h.square === sq && h.color === color);
          if (exists) {
            return prev.filter((h) => h.square !== sq);
          } else {
            return [...prev.filter((h) => h.square !== sq), { square: sq, color }];
          }
        });
      } else {
        const from = rightDragStart;
        const to = sq;
        setArrows((prev) => {
          const exists = prev.some((a) => a.from === from && a.to === to && a.color === color);
          if (exists) {
            return prev.filter((a) => !(a.from === from && a.to === to));
          } else {
            return [...prev.filter((a) => !(a.from === from && a.to === to)), { from, to, color }];
          }
        });
      }
      setRightDragStart(null);
    }
  };

  const getKingInCheckSquare = (): Square | null => {
    const turn = game.turn();
    const board = game.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === "k" && p.color === turn) {
          const file = String.fromCharCode(97 + c);
          const rank = String(8 - r);
          return `${file}${rank}` as Square;
        }
      }
    }
    return null;
  };

  const kingCheckSquare = isCheck || game.inCheck() ? getKingInCheckSquare() : null;

  return (
    <div
      className="relative inline-block select-none shadow-2xl rounded-lg overflow-hidden border border-slate-700/50 bg-slate-900 touch-none"
      onPointerMove={handleBoardPointerMove}
      onPointerUp={handleBoardPointerUp}
      onPointerCancel={() => setPointerDrag(null)}
    >
      <div
        ref={boardRef}
        role="grid"
        aria-label={`Interactive chessboard, ${orientation} perspective`}
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
            const premoveIndex = premoveQueue.findIndex((pm) => pm.from === square || pm.to === square);
            const isPremove = premoveIndex !== -1;
            const isKingCheck = kingCheckSquare === square;
            const highlight = allHighlights.find((h) => h.square === square);
            const isFocused = focusedSquare === square;

            const pieceDescription = piece
              ? `${piece.color === "w" ? "white" : "black"} ${piece.type}`
              : "empty";

            const squareAria = `${square}, ${pieceDescription}${isKingCheck ? ", in check" : ""}${
              isLegalMove ? ", legal move" : ""
            }${isPremove ? `, queued premove ${premoveIndex + 1}` : ""}`;

            return (
              <div
                key={square}
                data-square={square}
                role="gridcell"
                tabIndex={isFocused ? 0 : -1}
                aria-label={squareAria}
                aria-selected={isSelected}
                onClick={() => handleSquareClick(square)}
                onKeyDown={(e) => handleSquareKeyDown(e, square)}
                onPointerDown={(e) => handleSquarePointerDown(e, square)}
                onMouseDown={(e) => handleMouseDown(e, square)}
                onMouseUp={(e) => handleMouseUp(e, square)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, square)}
                className={`relative flex items-center justify-center cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${getSquareColor(
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

                {/* Queued multi-premove highlight and badge */}
                {isPremove && (
                  <div className="absolute inset-0 bg-red-500/35 border-2 border-red-500/70 pointer-events-none flex items-start justify-end p-0.5 z-10">
                    <span className="text-[9px] font-black leading-none bg-red-600 text-white rounded px-1 py-0.5 shadow-sm">
                      {premoveIndex + 1}
                    </span>
                  </div>
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
                    <ChessPiece type={piece.type as PieceType} color={piece.color as PieceColor} size={64} style={activePieceSet} />
                  </div>
                )}

                {/* Rank coordinates (left column) */}
                {showCoordinates && fileIndex === 0 && (
                  <span
                    className={`absolute top-0.5 left-1 text-[10px] sm:text-xs font-bold pointer-events-none ${
                      isLight ? "text-slate-700/70" : "text-white/80"
                    }`}
                  >
                    {rank}
                  </span>
                )}

                {/* File coordinates (bottom row) */}
                {showCoordinates && rankIndex === 7 && (
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
            <marker
              id="arrowhead-premove"
              markerWidth="4"
              markerHeight="4"
              refX="2"
              refY="2"
              orient="auto"
            >
              <polygon points="0 0, 4 2, 0 4" fill="#ef4444" opacity="0.9" />
            </marker>
          </defs>

          {/* Queued Premove Path Arrows */}
          {premoveQueue.map((pm, idx) => {
            const start = squareToCoords(pm.from);
            const end = squareToCoords(pm.to);
            const sqSize = 100 / 8;
            return (
              <line
                key={`premove-${idx}`}
                x1={`${(start.x + 0.5) * sqSize}%`}
                y1={`${(start.y + 0.5) * sqSize}%`}
                x2={`${(end.x + 0.5) * sqSize}%`}
                y2={`${(end.y + 0.5) * sqSize}%`}
                stroke="#ef4444"
                strokeWidth="6"
                strokeDasharray="6 3"
                strokeLinecap="round"
                opacity="0.85"
                markerEnd="url(#arrowhead-premove)"
              />
            );
          })}

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

        {/* Floating Follower Piece for Touch Pointer Drag */}
        {pointerDrag?.active && (
          <div
            className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: pointerDrag.currentX, top: pointerDrag.currentY }}
          >
            <div className="w-16 h-16 drop-shadow-2xl scale-110">
              <ChessPiece type={pointerDrag.piece.type} color={pointerDrag.piece.color} size={64} style={activePieceSet} />
            </div>
          </div>
        )}

        {/* Under-promotion selection modal with ARIA dialog semantics */}
        {promotionPending && (
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center p-4 animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-label="Pawn promotion selection"
          >
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-2xl flex flex-col items-center gap-3">
              <span className="text-sm font-semibold text-white">Promote Pawn To:</span>
              <div className="flex gap-2">
                {(["q", "r", "b", "n"] as PieceType[]).map((pType) => (
                  <button
                    key={pType}
                    onClick={() => {
                      const { from, to } = promotionPending;
                      setPromotionPending(null);
                      attemptMove(from, to, pType);
                    }}
                    aria-label={`Promote to ${pType === "q" ? "Queen" : pType === "r" ? "Rook" : pType === "b" ? "Bishop" : "Knight"}`}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors border border-slate-600 focus:ring-2 focus:ring-blue-400"
                  >
                    <ChessPiece type={pType} color={game.turn() === "w" ? "w" : "b"} size={44} style={activePieceSet} />
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
