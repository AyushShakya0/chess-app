import { Chess } from "chess.js";
import { ChessEvaluator } from "./evaluator.ts";

export interface StockfishEvaluation {
  depth: number;
  scoreCp: number;
  isMate: boolean;
  mateIn: number | null;
  bestMove: string;
  pv: string[];
  nodes?: number;
}

export type UciMessageListener = (line: string) => void;

/**
 * Universal Chess Interface (UCI) Engine Controller
 * Manages Stockfish WASM / UCI web workers with fallback to the built-in minimax evaluator.
 */
export class StockfishService {
  private worker: Worker | null = null;
  private isReady = false;
  private isSearching = false;
  private listeners: Set<UciMessageListener> = new Set();
  private currentResolve: ((evalResult: StockfishEvaluation) => void) | null = null;
  private currentReject: ((err: Error) => void) | null = null;
  private currentTimeout: NodeJS.Timeout | null = null;

  private latestEval: StockfishEvaluation = {
    depth: 0,
    scoreCp: 0,
    isMate: false,
    mateIn: null,
    bestMove: "",
    pv: [],
  };

  /**
   * Initializes UCI communication with the Stockfish WebAssembly worker or sets up fallback.
   */
  public async init(workerScriptPath?: string): Promise<boolean> {
    if (typeof window === "undefined") {
      this.isReady = true;
      return true;
    }

    if (this.worker) return this.isReady;

    if (workerScriptPath && typeof Worker !== "undefined") {
      try {
        this.worker = new Worker(workerScriptPath);
        this.worker.onmessage = (e: MessageEvent) => {
          const line = typeof e.data === "string" ? e.data : String(e.data);
          this.handleUciLine(line);
        };
        this.worker.onerror = () => {
          this.worker?.terminate();
          this.worker = null;
          this.isReady = true; // Fallback ready
        };

        this.send("uci");
        this.send("isready");
        this.isReady = true;
        return true;
      } catch {
        this.worker = null;
      }
    }

    this.isReady = true;
    return true;
  }

  /**
   * Subscribes to raw UCI output lines from the engine.
   */
  public onUciMessage(listener: UciMessageListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Sends a raw UCI command to the active engine.
   */
  public send(command: string): void {
    if (this.worker) {
      this.worker.postMessage(command);
    }
  }

  /**
   * Evaluates a chess position by FEN up to the specified search depth.
   */
  public async evaluate(
    fen: string,
    depth = 4,
    timeoutMs = 5000
  ): Promise<StockfishEvaluation> {
    // If running in Node or worker is unavailable, use high-speed evaluator
    if (!this.worker || typeof window === "undefined") {
      return this.evaluateSyncFallback(fen, depth);
    }

    if (this.isSearching) {
      this.stop();
    }

    return new Promise<StockfishEvaluation>((resolve, reject) => {
      this.isSearching = true;
      this.currentResolve = resolve;
      this.currentReject = reject;

      this.latestEval = {
        depth: 0,
        scoreCp: 0,
        isMate: false,
        mateIn: null,
        bestMove: "",
        pv: [],
      };

      this.currentTimeout = setTimeout(() => {
        if (this.isSearching) {
          this.stop();
          resolve(this.latestEval.bestMove ? this.latestEval : this.evaluateSyncFallback(fen, depth));
        }
      }, timeoutMs);

      this.send(`position fen ${fen}`);
      this.send(`go depth ${depth}`);
    });
  }

  /**
   * Finds the best move for a given position.
   */
  public async getBestMove(
    fen: string,
    depth = 4,
    timeoutMs = 4000
  ): Promise<string> {
    const result = await this.evaluate(fen, depth, timeoutMs);
    return result.bestMove;
  }

  /**
   * Aborts any ongoing UCI search.
   */
  public stop(): void {
    if (this.worker && this.isSearching) {
      this.send("stop");
    }
    this.isSearching = false;
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
  }

  /**
   * Shuts down the engine worker.
   */
  public terminate(): void {
    this.stop();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.isReady = false;
  }

  /**
   * Internal parser for UCI engine stdout lines.
   */
  private handleUciLine(line: string): void {
    for (const listener of this.listeners) {
      listener(line);
    }

    if (line.startsWith("info ")) {
      this.parseInfoLine(line);
    } else if (line.startsWith("bestmove ")) {
      this.handleBestMoveLine(line);
    }
  }

  private parseInfoLine(line: string): void {
    const parts = line.split(" ");
    const depthIdx = parts.indexOf("depth");
    if (depthIdx !== -1 && parts[depthIdx + 1]) {
      this.latestEval.depth = parseInt(parts[depthIdx + 1], 10) || this.latestEval.depth;
    }

    const scoreIdx = parts.indexOf("score");
    if (scoreIdx !== -1) {
      const type = parts[scoreIdx + 1];
      const val = parseInt(parts[scoreIdx + 2], 10);
      if (type === "cp" && !isNaN(val)) {
        this.latestEval.scoreCp = val;
        this.latestEval.isMate = false;
        this.latestEval.mateIn = null;
      } else if (type === "mate" && !isNaN(val)) {
        this.latestEval.isMate = true;
        this.latestEval.mateIn = val;
        this.latestEval.scoreCp = val > 0 ? 10000 : -10000;
      }
    }

    const pvIdx = parts.indexOf("pv");
    if (pvIdx !== -1) {
      this.latestEval.pv = parts.slice(pvIdx + 1);
      if (this.latestEval.pv.length > 0) {
        this.latestEval.bestMove = this.latestEval.pv[0];
      }
    }
  }

  private handleBestMoveLine(line: string): void {
    this.isSearching = false;
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }

    const parts = line.split(" ");
    const move = parts[1];
    if (move && move !== "(none)") {
      this.latestEval.bestMove = move;
    }

    if (this.currentResolve) {
      const resolve = this.currentResolve;
      this.currentResolve = null;
      this.currentReject = null;
      resolve({ ...this.latestEval });
    }
  }

  /**
   * High-accuracy fallback using ChessEvaluator minimax search.
   */
  private evaluateSyncFallback(fen: string, depth = 3): StockfishEvaluation {
    const game = new Chess(fen);

    if (game.isCheckmate()) {
      const isBlackMated = game.turn() === "b";
      return {
        depth,
        scoreCp: isBlackMated ? 10000 : -10000,
        isMate: true,
        mateIn: isBlackMated ? 1 : -1,
        bestMove: "",
        pv: [],
      };
    }

    if (game.isDraw()) {
      return {
        depth,
        scoreCp: 0,
        isMate: false,
        mateIn: null,
        bestMove: "",
        pv: [],
      };
    }

    const { bestMove, score } = ChessEvaluator.getBestMoveAndEval(game, depth);
    const uciMove = bestMove ? `${bestMove.from}${bestMove.to}${bestMove.promotion || ""}` : "";

    return {
      depth,
      scoreCp: score,
      isMate: Math.abs(score) >= 9000,
      mateIn: Math.abs(score) >= 9000 ? (score > 0 ? 1 : -1) : null,
      bestMove: uciMove,
      pv: uciMove ? [uciMove] : [],
    };
  }
}

// Global singleton instance
export const stockfish = new StockfishService();
