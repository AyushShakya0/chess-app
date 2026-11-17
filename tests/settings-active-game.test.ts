import test from "node:test";
import assert from "node:assert";
import { getGlobalSettings, updateGlobalSettings } from "../lib/stores/settings-store.ts";
import { getActiveGameState, setActiveGamePosition, toggle3DView } from "../lib/stores/active-game-store.ts";

test("Global Settings Store - update and read settings", () => {
  const initial = getGlobalSettings();
  assert.strictEqual(typeof initial.soundEnabled, "boolean");
  assert.strictEqual(typeof initial.volume, "number");

  updateGlobalSettings({ theme: "emerald", pieceSet: "pixel", soundEnabled: false, volume: 0.8 });
  const updated = getGlobalSettings();
  assert.strictEqual(updated.theme, "emerald");
  assert.strictEqual(updated.pieceSet, "pixel");
  assert.strictEqual(updated.soundEnabled, false);
  assert.strictEqual(updated.volume, 0.8);

  // Restore defaults
  updateGlobalSettings({ theme: "classic", pieceSet: "classic", soundEnabled: true, volume: 0.6 });
});

test("Active Game Store - register FEN and toggle 3D View", () => {
  const initialState = getActiveGameState();
  assert.strictEqual(initialState.is3DOpen, false);

  toggle3DView(true);
  assert.strictEqual(getActiveGameState().is3DOpen, true);

  toggle3DView(false);
  assert.strictEqual(getActiveGameState().is3DOpen, false);

  const customFen = "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2";
  setActiveGamePosition(customFen, "1. e4 c5", "bots");
  const registered = getActiveGameState();
  assert.strictEqual(registered.fen, customFen);
  assert.strictEqual(registered.pgn, "1. e4 c5");
  assert.strictEqual(registered.source, "bots");
});
