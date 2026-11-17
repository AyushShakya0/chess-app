import { Chess } from "chess.js";
import { ChessEvaluator } from "./evaluator";

self.onmessage = (e: MessageEvent) => {
  const { id, type, fen, elo, blunderRate, depth } = e.data;

  try {
    const game = new Chess(fen);

    if (type === "search") {
      const chosenMove = ChessEvaluator.getBotMoveForElo(game, elo, blunderRate, depth);
      self.postMessage({ id, type: "searchResult", bestMove: chosenMove });
    } else if (type === "eval") {
      if (game.isCheckmate()) {
        const isBlackMated = game.turn() === "b";
        self.postMessage({
          id,
          type: "evalResult",
          score: isBlackMated ? 10000 : -10000,
          isMate: true,
          mateIn: isBlackMated ? 1 : -1,
        });
      } else if (game.isDraw()) {
        self.postMessage({
          id,
          type: "evalResult",
          score: 0,
          isMate: false,
          mateIn: null,
        });
      } else {
        const { score } = ChessEvaluator.getBestMoveAndEval(game, depth || 2);
        self.postMessage({
          id,
          type: "evalResult",
          score,
          isMate: false,
          mateIn: null,
        });
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    self.postMessage({ id, error: msg });
  }
};

