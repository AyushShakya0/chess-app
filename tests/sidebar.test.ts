import test from "node:test";
import assert from "node:assert/strict";
import { SIDEBAR_NAV_ITEMS, type SidebarNavId } from "../components/navigation/sidebar-items.ts";

test("Sidebar Navigation - contains all 9 core Chess.com sections", () => {
  const expectedIds: SidebarNavId[] = [
    "home",
    "online",
    "bots",
    "custom",
    "puzzles",
    "tournaments",
    "leaderboard",
    "friends",
    "settings",
  ];
  const actualIds = SIDEBAR_NAV_ITEMS.map((item) => item.id);
  for (const id of expectedIds) {
    assert.ok(actualIds.includes(id), `Missing sidebar nav item: ${id}`);
  }
});

test("Sidebar Navigation - every item has label, href, and icon component", () => {
  for (const item of SIDEBAR_NAV_ITEMS) {
    assert.ok(item.label && item.label.length > 0, `Item ${item.id} must have a label`);
    assert.ok(item.href && item.href.length > 0, `Item ${item.id} must have an href`);
    assert.ok(
      typeof item.icon === "function" || (typeof item.icon === "object" && item.icon !== null),
      `Item ${item.id} must have a valid React component icon`
    );
  }
});
