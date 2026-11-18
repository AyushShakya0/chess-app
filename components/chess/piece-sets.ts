export type PieceSetId = "classic" | "gold" | "wood" | "modern" | "pixel";

export interface PieceSetMetadata {
  id: PieceSetId;
  name: string;
  desc: string;
  previewEmoji: string;
  badge?: string;
  whiteColor: string;
  blackColor: string;
}

export const SUPPORTED_PIECE_SETS: PieceSetMetadata[] = [
  {
    id: "classic",
    name: "Staunton Vector",
    desc: "Official tournament standard vector silhouettes with high-contrast outlines",
    previewEmoji: "♟️",
    badge: "Tournament",
    whiteColor: "#ffffff",
    blackColor: "#1a1a1a",
  },
  {
    id: "gold",
    name: "Sovereign Gold",
    desc: "Imperial metallic gold & obsidian glass luxury chessmen",
    previewEmoji: "👑",
    badge: "Sovereign VIP",
    whiteColor: "#E5BE6E",
    blackColor: "#14171f",
  },
  {
    id: "wood",
    name: "Carved Walnut",
    desc: "Warm organic mahogany and golden birch hardwood grain carving",
    previewEmoji: "🪵",
    whiteColor: "#faedcd",
    blackColor: "#4a2810",
  },
  {
    id: "modern",
    name: "Bauhaus Minimal",
    desc: "Sleek geometric architectural silhouettes with cyan & azure highlights",
    previewEmoji: "📐",
    whiteColor: "#f1f5f9",
    blackColor: "#020617",
  },
  {
    id: "pixel",
    name: "8-Bit Arcade",
    desc: "Retro pixel art geometry with crisp pixel-grid rendering",
    previewEmoji: "👾",
    badge: "Retro",
    whiteColor: "#f8fafc",
    blackColor: "#0f172a",
  },
];

export function getPieceSetMetadata(id: PieceSetId): PieceSetMetadata {
  const match = SUPPORTED_PIECE_SETS.find((p) => p.id === id);
  if (match) return match;
  return SUPPORTED_PIECE_SETS[0];
}
