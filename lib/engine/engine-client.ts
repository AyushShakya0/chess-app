import { Chess, Move } from "chess.js";
import { ChessEvaluator, type FullGameAnalysis } from "./evaluator";

export interface EvalResult {
  score: number;
  isMate: boolean;
  mateIn: number | null;
}

class EngineClient {
  private worker: Worker | null = null;
  private pendingCallbacks = new Map<string, (data: any) => void>();
  private nextId = 1;

  private initWorker(): Worker | null {
    if (typeof window === "undefined" || typeof Worker === "undefined") {
      return null;
    }

    if (!this.worker) {
      try {
        this.worker = new Worker(new URL("./engine.worker.ts", import.meta.url), {
          type: "module",
        });

        this.worker.onmessage = (e: MessageEvent) => {
          const { id, error } = e.data;
          const callback = this.pendingCallbacks.get(id);
          if (callback) {
            this.pendingCallbacks.delete(id);
            if (error) {
              callback(null);
            } else {
              callback(e.data);
            }
          }
        };

        this.worker.onerror = () => {
          // If worker encounters fatal error, terminate and fallback
          this.worker?.terminate();
          this.worker = null;
        };
      } catch {
        this.worker = null;
      }
    }

    return this.worker;
  }

  public async getBotMove(
    game: Chess,
    elo: number,
    blunderRate: number,
    depth: number
  ): Promise<Move | null> {
    const worker = this.initWorker();

    if (worker) {
      const id = String(this.nextId++);
      const fen = game.fen();

      return new Promise<Move | null>((resolve) => {
        const timeout = setTimeout(() => {
          this.pendingCallbacks.delete(id);
          // Fallback to sync evaluation if worker takes too long
          resolve(ChessEvaluator.getBotMoveForElo(game, elo, blunderRate, depth));
        }, 4000);

        this.pendingCallbacks.set(id, (data) => {
          clearTimeout(timeout);
          if (data && data.bestMove) {
            resolve(data.bestMove as Move);
          } else {
            resolve(ChessEvaluator.getBotMoveForElo(game, elo, blunderRate, depth));
          }
        });

        worker.postMessage({ id, type: "search", fen, elo, blunderRate, depth });
      });
    }

    // Direct synchronous fallback
    return ChessEvaluator.getBotMoveForElo(game, elo, blunderRate, depth);
  }

  public async getEvaluation(game: Chess, depth = 2): Promise<EvalResult> {
    const worker = this.initWorker();

    if (worker) {
      const id = String(this.nextId++);
      const fen = game.fen();

      return new Promise<EvalResult>((resolve) => {
        const timeout = setTimeout(() => {
          this.pendingCallbacks.delete(id);
          resolve(this.getSyncEvaluation(game, depth));
        }, 3000);

        this.pendingCallbacks.set(id, (data) => {
          clearTimeout(timeout);
          if (data) {
            resolve({
              score: data.score,
              isMate: data.isMate,
              mateIn: data.mateIn,
            });
          } else {
            resolve(this.getSyncEvaluation(game, depth));
          }
        });

        worker.postMessage({ id, type: "eval", fen, depth });
      });
    }

    return this.getSyncEvaluation(game, depth);
  }

  public async analyzeFullGame(history: string[]): Promise<FullGameAnalysis> {
    const worker = this.initWorker();

    if (worker) {
      const id = String(this.nextId++);

      return new Promise<FullGameAnalysis>((resolve) => {
        const timeout = setTimeout(() => {
          this.pendingCallbacks.delete(id);
          resolve(ChessEvaluator.analyzeFullGame(history));
        }, 10000);

        this.pendingCallbacks.set(id, (data) => {
          clearTimeout(timeout);
          if (data && data.analysis) {
            resolve(data.analysis as FullGameAnalysis);
          } else {
            resolve(ChessEvaluator.analyzeFullGame(history));
          }
        });

        worker.postMessage({ id, type: "analyzeFullGame", history });
      });
    }

    return ChessEvaluator.analyzeFullGame(history);
  }

  private getSyncEvaluation(game: Chess, depth = 2): EvalResult {
    if (game.isCheckmate()) {
      const isBlackMated = game.turn() === "b";
      return {
        score: isBlackMated ? 10000 : -10000,
        isMate: true,
        mateIn: isBlackMated ? 1 : -1,
      };
    }
    if (game.isDraw()) {
      return {
        score: 0,
        isMate: false,
        mateIn: null,
      };
    }

    const { score } = ChessEvaluator.getBestMoveAndEval(game, depth);
    return {
      score,
      isMate: false,
      mateIn: null,
    };
  }
}

export const engineClient = new EngineClient();

