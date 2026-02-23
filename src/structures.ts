/* ═══════════════════════════════════════════════════════════
   WASTELAND SURVIVOR — structures.ts
   Data-driven registry: all structures, their interactions,
   salvage yields, and world/interior actions.

   HOW TO ADD A NEW STRUCTURE (no engine changes needed):
   ────────────────────────────────────────────────────────
   1.  Add its StructureId to types.ts
   2.  Add the WorldTileType or InteriorTileType to types.ts
   3.  Add tile def to config.ts  (tiles: or itiles:)
   4.  Add a placeable ItemId + ItemDef to config.ts  (type:'place' or 'iplace')
   5.  Add a recipe RecipeId + RecipeDef to config.ts
   6.  Add the StructureDef below in STRUCTURE_DEFS
   That's it. UI and game.ts pick it up automatically.
   ═══════════════════════════════════════════════════════════ */

import { C } from './config';
import type { StructureDef, StructureId, ActionContext } from './types';

// ── Helpers ───────────────────────────────────────────────

function hasItem(ctx: ActionContext, id: string, qty = 1): boolean {
  return ctx.game.countItem(id as any) >= qty;
}

function msg(ctx: ActionContext, text: string, cls = ''): void {
  ctx.game.logMsg(text, cls);
}

// ═══════════════════════════════════════════════════════════
//  STRUCTURE DEFINITIONS
// ═══════════════════════════════════════════════════════════

export const STRUCTURE_DEFS: Partial<Record<StructureId, StructureDef>> = {

  // ── Campfire (world) ─────────────────────────────────────
  campfire: {
    id: 'campfire',
    tileType: 'campfire',
    location: 'world',
    name: 'Campfire',
    icon: '🔥',
    placeXp: 10,
    maxHp: 20,
    salvageYields: [
      { id: 'wood', qty: 1 },
      { id: 'scrap', min: 0, max: 1 },
    ],
    interactions: [
      {
        id: 'campfire_cook',
        label: 'COOK FOOD',
        icon: '🍖',
        canDo: (ctx) => {
          if (!hasItem(ctx, 'canned') && !hasItem(ctx, 'jerky'))
            return { ok: false, reason: 'No food to cook' };
          return { ok: true };
        },
        handler: (ctx) => {
          const g = ctx.game;
          // Cooking canned food restores more food value — it's warm
          if (hasItem(ctx, 'canned')) {
            g.removeItem('canned', 1);
            g.stats.food = Math.min(100, g.stats.food + 35); // +10 over normal use
            msg(ctx, '🍖 Cooked and ate canned food. Warm meal!', 'l-good');
          } else if (hasItem(ctx, 'jerky')) {
            g.removeItem('jerky', 1);
            g.stats.food = Math.min(100, g.stats.food + 22);
            msg(ctx, '🍖 Warmed up some jerky.', 'l-good');
          }
          g.gainXp('survival', 5);
          g.tick();
          (window as any).UI?.fullRender(g);
        },
      },
      {
        id: 'campfire_extinguish',
        label: 'EXTINGUISH',
        icon: '💧',
        canDo: () => ({ ok: true }),
        handler: (ctx) => {
          const g = ctx.game;
          // Replace campfire tile with grass
          g.map[g.p.y][g.p.x] = (window as any).World?.tile('grass') ??
            { type: 'grass', loot: 0, max: 0 };
          g.addItem('wood', 1);
          msg(ctx, 'Extinguished the campfire. Recovered some wood.', 'l-imp');
          g.tick();
          (window as any).UI?.fullRender(g);
        },
      },
    ],
  },

  // ── Watch Tower (world) ──────────────────────────────────
  watch_tower: {
    id: 'watch_tower',
    tileType: 'watch_tower',
    location: 'world',
    name: 'Watch Tower',
    icon: '🗼',
    placeXp: 30,
    maxHp: 150,
    salvageYields: [
      { id: 'wood', min: 3, max: 5 },
      { id: 'nails', min: 4, max: 8 },
    ],
    interactions: [
      {
        id: 'watch_tower_climb',
        label: 'CLIMB TOWER (+2 Vision)',
        icon: '👁',
        canDo: () => ({ ok: true }),
        handler: (ctx) => {
          const g = ctx.game;
          // Temporarily boost vision for this turn by storing in meta
          const tile = g.map[g.p.y][g.p.x];
          tile.meta = tile.meta || {};
          tile.meta['vision_boost'] = 2;
          tile.meta['vision_until'] = g.turn + 4;
          msg(ctx, '👁 Climbed the watch tower. Visibility improved!', 'l-good');
          g.gainXp('survival', 5);
          g.tick();
          (window as any).UI?.fullRender(g);
        },
      },
    ],
  },

  // ── Garden Plot (world) ──────────────────────────────────
  garden_plot: {
    id: 'garden_plot',
    tileType: 'garden_plot',
    location: 'world',
    name: 'Garden Plot',
    icon: '🌱',
    placeXp: 15,
    salvageYields: [{ id: 'wood', qty: 1 }, { id: 'cloth', qty: 1 }],
    interactions: [
      {
        id: 'garden_water',
        label: 'WATER GARDEN',
        icon: '💧',
        canDo: (ctx) => {
          if (!hasItem(ctx, 'water_b'))
            return { ok: false, reason: 'Need Water Bottle' };
          const tile = ctx.game.map[ctx.game.p.y][ctx.game.p.x];
          const stage = (tile.meta?.['stage'] as number) ?? 0;
          if (stage >= 3) return { ok: false, reason: 'Garden is fully grown' };
          return { ok: true };
        },
        handler: (ctx) => {
          const g = ctx.game;
          g.removeItem('water_b', 1);
          const tile = g.map[g.p.y][g.p.x];
          tile.meta = tile.meta || {};
          const stage = (tile.meta['stage'] as number) ?? 0;
          tile.meta['stage'] = stage + 1;
          const stageLabels = ['🌱 Seedling', '🌿 Growing', '🥬 Mature', '🥕 Ready to harvest'];
          msg(ctx, `Watered garden. Stage: ${stageLabels[stage + 1] ?? 'Harvested'}`, 'l-good');
          g.gainXp('survival', 8);
          g.tick();
          (window as any).UI?.fullRender(g);
        },
      },
      {
        id: 'garden_harvest',
        label: 'HARVEST GARDEN',
        icon: '🥕',
        canDo: (ctx) => {
          const tile = ctx.game.map[ctx.game.p.y][ctx.game.p.x];
          const stage = (tile.meta?.['stage'] as number) ?? 0;
          if (stage < 3) return { ok: false, reason: `Not ready (stage ${stage}/3)` };
          return { ok: true };
        },
        handler: (ctx) => {
          const g = ctx.game;
          const tile = g.map[g.p.y][g.p.x];
          tile.meta = tile.meta || {};
          tile.meta['stage'] = 0;
          // Yield 2-4 food items
          const qty = 2 + Math.floor(Math.random() * 3);
          for (let i = 0; i < qty; i++) g.addItem('canned'); // represents produce
          msg(ctx, `🥕 Harvested garden! Got ×${qty} food supplies.`, 'l-good');
          g.gainXp('survival', 20);
          g.tick();
          (window as any).UI?.fullRender(g);
        },
      },
    ],
  },

  // ── Workbench (interior) ─────────────────────────────────
  workbench: {
    id: 'workbench',
    tileType: 'workbench',
    location: 'interior',
    name: 'Workbench',
    icon: '🛠️',
    placeXp: 25,
    maxHp: 80,
    salvageYields: [
      { id: 'wood', min: 2, max: 4 },
      { id: 'scrap', min: 1, max: 3 },
      { id: 'nails', min: 2, max: 5 },
    ],
    interactions: [
      {
        id: 'workbench_craft',
        label: 'USE WORKBENCH (+Crafting)',
        icon: '🔨',
        canDo: () => ({ ok: true }),
        handler: (ctx) => {
          // Workbench grants a temporary crafting bonus — open craft tab
          msg(ctx, '🛠️ Workbench active. Carpentry recipes require 1 less wood.', 'l-imp');
          const g = ctx.game;
          (g as any)._workbenchActive = true;
          (window as any).G?.setTab('craft');
        },
      },
    ],
  },

  // ── Forge (interior) ────────────────────────────────────
  forge: {
    id: 'forge',
    tileType: 'forge',
    location: 'interior',
    name: 'Forge',
    icon: '⚒️',
    placeXp: 40,
    maxHp: 200,
    salvageYields: [
      { id: 'scrap', min: 3, max: 6 },
      { id: 'metal_sheet', min: 1, max: 2 },
    ],
    interactions: [
      {
        id: 'forge_smelt',
        label: 'SMELT SCRAP → Metal Sheet',
        icon: '⚒️',
        canDo: (ctx) => {
          if (!hasItem(ctx, 'scrap', 5))
            return { ok: false, reason: 'Need 5x Scrap Metal' };
          return { ok: true };
        },
        handler: (ctx) => {
          const g = ctx.game;
          g.removeItem('scrap', 5);
          g.addItem('metal_sheet', 1);
          msg(ctx, '⚒️ Smelted 5 Scrap into a Metal Sheet.', 'l-good');
          g.gainXp('carpentry', 15);
          g.tick();
          (window as any).UI?.fullRender(g);
        },
      },
    ],
  },

  // ── Medical Station (interior) ───────────────────────────
  med_station: {
    id: 'med_station',
    tileType: 'med_station',
    location: 'interior',
    name: 'Medical Station',
    icon: '🏥',
    placeXp: 20,
    maxHp: 60,
    salvageYields: [
      { id: 'cloth', min: 2, max: 4 },
      { id: 'scrap', min: 1, max: 2 },
    ],
    interactions: [
      {
        id: 'med_station_treat',
        label: 'TREAT WOUNDS (Full Heal)',
        icon: '🩺',
        canDo: (ctx) => {
          if (!hasItem(ctx, 'bandage', 2))
            return { ok: false, reason: 'Need 2x Bandage' };
          if (ctx.game.stats.hp >= 100)
            return { ok: false, reason: 'Already at full health' };
          return { ok: true };
        },
        handler: (ctx) => {
          const g = ctx.game;
          g.removeItem('bandage', 2);
          const healed = 100 - g.stats.hp;
          g.stats.hp = 100;
          msg(ctx, `🩺 Treated wounds at medical station. Healed ${healed} HP.`, 'l-good');
          g.gainXp('survival', 15);
          g.tick();
          (window as any).UI?.fullRender(g);
        },
      },
    ],
  },

  // ── Barricade Window (interior) ──────────────────────────
  barricade_window: {
    id: 'barricade_window',
    tileType: 'barricade_window',
    location: 'interior',
    name: 'Barricaded Window',
    icon: '🪵',
    placeXp: 10,
    maxHp: 80,
    salvageYields: [
      { id: 'wood', min: 1, max: 2 },
      { id: 'nails', min: 1, max: 3 },
    ],
    interactions: [],
  },

};

// ═══════════════════════════════════════════════════════════
//  STRUCTURE REGISTRY HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Returns the StructureDef for a given tile type, or null.
 * Used by the action renderer to find interactions for the current tile.
 */
export function getStructureByTile(
  tileType: string,
  location: 'world' | 'interior'
): StructureDef | null {
  for (const def of Object.values(STRUCTURE_DEFS)) {
    if (def && def.tileType === tileType && def.location === location) return def;
  }
  return null;
}

/**
 * Returns all StructureDefs for a given location context.
 */
export function getStructuresForLocation(location: 'world' | 'interior'): StructureDef[] {
  return Object.values(STRUCTURE_DEFS).filter(
    (d): d is StructureDef => !!d && d.location === location
  );
}

/**
 * Returns the StructureDef for adjacent interior tiles (for station detection).
 * Checks all 4 cardinal neighbors of (px, py) in the interior grid.
 */
export function getAdjacentStructures(
  g: import('./game').Game,
  px: number, py: number
): Array<{ def: StructureDef; x: number; y: number }> {
  if (!g.currentInterior) return [];
  const results: Array<{ def: StructureDef; x: number; y: number }> = [];
  for (const [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]] as [number,number][]) {
    const nx = px + dx, ny = py + dy;
    const int = g.currentInterior;
    if (nx < 0 || nx >= int.w || ny < 0 || ny >= int.h) continue;
    const cell = int.map[ny][nx];
    const def = getStructureByTile(cell.type, 'interior');
    if (def) results.push({ def, x: nx, y: ny });
  }
  return results;
}
