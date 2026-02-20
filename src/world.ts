/* ═══════════════════════════════════════════════════════════
   WASTELAND SURVIVOR — world.ts
   Procedural overworld + building interior generation
   ═══════════════════════════════════════════════════════════ */

import { C } from './config';
import type {
  WorldCell, WorldTileType, InteriorCell, InteriorTileType,
  Building, Floor, Position, WeightedTypeEntry, WorldGenConfig,
  BuildingType, LayoutKey,
} from './types';

// ═══════════════════════════════════════════════════════════
//  World Generation
// ═══════════════════════════════════════════════════════════

export const World = {

  create(): WorldCell[][] {
    const { w, h, worldGen: wg } = C;
    const map = this._fill(w, h, wg);
    this._enrichTerrain(map, w, h, wg);
    const cities = this._cities(map, w, h, wg);
    const roads = new Set<string>();
    for (let i = 0; i < cities.length - 1; i++)
      this._path(map, cities[i], cities[i + 1], roads);
    if (cities.length > 2)
      this._path(map, cities[cities.length - 1], cities[0], roads);
    this._branchRoads(map, w, h, roads, wg);
    this._cityStreets(map, w, h, cities, roads, wg);
    this._hamlets(map, w, h, cities, roads, wg);
    this._zone(map, w, h, cities, roads, wg);
    this._roadsidePOIs(map, w, h, cities, roads, wg);
    this._wildernessPOIs(map, w, h, cities, wg);
    return map;
  },

  tile(type: WorldTileType): WorldCell {
    const cap = C.tiles[type] ? C.tiles[type].cap : 0;
    return { type, loot: cap, max: cap };
  },

  /* ── 1. Base Terrain Fill ─────────────────────────────────── */
  _fill(w: number, h: number, wg: WorldGenConfig): WorldCell[][] {
    return Array.from({ length: h }, (_, y) =>
      Array.from({ length: w }, (_, x) => {
        const n = Math.sin(x / 5) + Math.cos(y / 6) + Math.random();
        const t: WorldTileType = n > wg.terrainWaterThreshold ? 'water'
          : n > wg.terrainForestThreshold ? 'forest' : 'grass';
        return this.tile(t);
      })
    );
  },

  /* ── 2. Terrain Enrichment ──────────────────────────────── */
  _enrichTerrain(map: WorldCell[][], w: number, h: number, wg: WorldGenConfig): void {
    const tc = wg.terrain;
    if (!tc) return;
    if (tc.clearings && tc.clearings.enabled) {
      const cl = tc.clearings;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          if (map[y][x].type === 'forest' && Math.random() < cl.chance) {
            const r = cl.radius || 1;
            for (let dy = -r; dy <= r; dy++)
              for (let dx = -r; dx <= r; dx++) {
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < w && ny >= 0 && ny < h && map[ny][nx].type === 'forest')
                  map[ny][nx] = this.tile('grass');
              }
          }
        }
    }
    if (tc.denseForest && tc.denseForest.enabled) {
      const df = tc.denseForest;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          if (map[y][x].type === 'grass' && Math.random() < df.chance) {
            const r = df.radius || 2;
            for (let dy = -r; dy <= r; dy++)
              for (let dx = -r; dx <= r; dx++) {
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < w && ny >= 0 && ny < h && map[ny][nx].type === 'grass')
                  map[ny][nx] = this.tile('forest');
              }
          }
        }
    }
  },

  /* ── 3. City Placement ─────────────────────────────────── */
  _cities(map: WorldCell[][], w: number, h: number, wg: WorldGenConfig): Position[] {
    const c: Position[] = [];
    const b = wg.cityMinEdgeBuffer;
    const minDist = wg.cityMinSpacing || 0;
    let a = 0;
    while (c.length < wg.cityCount && a++ < 2000) {
      const x = Math.floor(Math.random() * (w - b * 2)) + b;
      const y = Math.floor(Math.random() * (h - b * 2)) + b;
      if (map[y][x].type === 'water') continue;
      let tooClose = false;
      for (const ex of c) {
        if (Math.abs(ex.x - x) + Math.abs(ex.y - y) < minDist) { tooClose = true; break; }
      }
      if (!tooClose) c.push({ x, y });
    }
    return c;
  },

  /* ── 4. Road Pathing ───────────────────────────────────── */
  _path(map: WorldCell[][], p1: Position, p2: Position, rs: Set<string>): void {
    let x = p1.x, y = p1.y;
    const pave = () => {
      if (x < 0 || x >= C.w || y < 0 || y >= C.h) return;
      map[y][x] = this.tile(map[y][x].type === 'water' ? 'bridge' : 'road');
      rs.add(`${x},${y}`);
    };
    while (x !== p2.x) { x += x < p2.x ? 1 : -1; pave(); }
    while (y !== p2.y) { y += y < p2.y ? 1 : -1; pave(); }
  },

  /* ── 5. Road Branching ─────────────────────────────────── */
  _branchRoads(map: WorldCell[][], w: number, h: number, roads: Set<string>, wg: WorldGenConfig): void {
    const rb = wg.roadBranching;
    if (!rb || !rb.enabled) return;
    const existing = [...roads];
    for (const key of existing) {
      if (Math.random() > rb.chance) continue;
      const [rx, ry] = key.split(',').map(Number);
      const dirs: [number, number][] = [[1,0],[-1,0],[0,1],[0,-1]];
      const dir = dirs[Math.floor(Math.random() * dirs.length)];
      const len = rb.minLen + Math.floor(Math.random() * (rb.maxLen - rb.minLen + 1));
      let bx = rx, by = ry;
      for (let i = 0; i < len; i++) {
        bx += dir[0]; by += dir[1];
        if (bx < 1 || bx >= w - 1 || by < 1 || by >= h - 1) break;
        if (map[by][bx].type === 'water') break;
        map[by][bx] = this.tile('road');
        roads.add(`${bx},${by}`);
      }
    }
  },

  /* ── 6. City Street Grid ───────────────────────────────── */
  _cityStreets(map: WorldCell[][], w: number, h: number, cities: Position[], roads: Set<string>, wg: WorldGenConfig): void {
    const cs = wg.cityStreets;
    if (!cs || !cs.enabled) return;
    const spacing = cs.spacing || 3;
    const reach = cs.reach || wg.citySuburbDist || 5;
    const jitter = cs.jitter || 0;
    for (const city of cities) {
      for (let dy = -reach; dy <= reach; dy++) {
        for (let dx = -reach; dx <= reach; dx++) {
          const x = city.x + dx, y = city.y + dy;
          if (x < 0 || x >= w || y < 0 || y >= h) continue;
          if (map[y][x].type === 'water') continue;
          const onGridX = (Math.abs(dx) % spacing === 0);
          const onGridY = (Math.abs(dy) % spacing === 0);
          if ((onGridX || onGridY) && Math.random() > jitter) {
            const t = map[y][x].type;
            if (t === 'grass' || t === 'forest') {
              map[y][x] = this.tile('road');
              roads.add(`${x},${y}`);
            }
          }
        }
      }
    }
  },

  /* ── 7. Hamlets ────────────────────────────────────────── */
  _hamlets(map: WorldCell[][], w: number, h: number, cities: Position[], roads: Set<string>, wg: WorldGenConfig): Position[] {
    const hc = wg.hamlets;
    if (!hc || !hc.enabled) return [];
    const placed: Position[] = [];
    let attempts = 0;
    while (placed.length < (hc.count || 3) && attempts++ < 500) {
      const x = 3 + Math.floor(Math.random() * (w - 6));
      const y = 3 + Math.floor(Math.random() * (h - 6));
      if (map[y][x].type === 'water') continue;
      const dCity = cities.reduce((m, c) => Math.min(m, Math.abs(c.x - x) + Math.abs(c.y - y)), Infinity);
      if (dCity < (hc.minCityDist || 10)) continue;
      const dHam = placed.reduce((m, p) => Math.min(m, Math.abs(p.x - x) + Math.abs(p.y - y)), Infinity);
      if (dHam < (hc.minHamletDist || 8)) continue;
      const nearRoad = this._findNearestRoad(x, y, roads, 20);
      if (nearRoad) this._path(map, {x, y}, nearRoad, roads);
      map[y][x] = this.tile('road');
      roads.add(`${x},${y}`);
      for (let d = -1; d <= 1; d++) {
        if (x+d >= 0 && x+d < w) { map[y][x+d] = this.tile('road'); roads.add(`${x+d},${y}`); }
        if (y+d >= 0 && y+d < h) { map[y+d][x] = this.tile('road'); roads.add(`${x},${y+d}`); }
      }
      const size = (hc.minSize || 2) + Math.floor(Math.random() * ((hc.maxSize || 4) - (hc.minSize || 2) + 1));
      const spots = this._findBuildSpots(map, w, h, x, y, 3, roads);
      for (let i = 0; i < Math.min(size, spots.length); i++) {
        const s = spots[i];
        const bType = this._wPick(hc.types || wg.suburbDist) as WorldTileType;
        map[s.y][s.x] = this.tile(bType);
      }
      placed.push({x, y});
    }
    return placed;
  },

  /* ── 8. Zone Buildings ─────────────────────────────────── */
  _zone(map: WorldCell[][], w: number, h: number, cities: Position[], roads: Set<string>, wg: WorldGenConfig): void {
    const needRoad = wg.buildingsNeedRoad !== false;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (map[y][x].type === 'water' || roads.has(`${x},${y}`)) continue;
        const cur = map[y][x].type;
        if (cur !== 'grass' && cur !== 'forest') continue;
        const d = cities.reduce((m, c) => Math.min(m, Math.abs(c.x - x) + Math.abs(c.y - y)), Infinity);
        const isCore = d <= wg.cityCoreDist;
        const isSuburb = d <= wg.citySuburbDist && Math.random() < wg.citySuburbChance;
        if (isCore || isSuburb) {
          if (needRoad && !this._adjacentToRoad(x, y, roads)) continue;
          const pool = isCore ? wg.coreDist : wg.suburbDist;
          map[y][x] = this.tile(this._wPick(pool) as WorldTileType);
        }
      }
  },

  /* ── 9. Roadside POIs ──────────────────────────────────── */
  _roadsidePOIs(map: WorldCell[][], w: number, h: number, cities: Position[], roads: Set<string>, wg: WorldGenConfig): void {
    const rp = wg.roadsidePOIs;
    if (!rp || !rp.enabled) return;
    const minCD = rp.minCityDist || 6;
    for (const key of roads) {
      if (Math.random() > rp.chance) continue;
      const [rx, ry] = key.split(',').map(Number);
      const dCity = cities.reduce((m, c) => Math.min(m, Math.abs(c.x - rx) + Math.abs(c.y - ry)), Infinity);
      if (dCity < minCD) continue;
      let spots: [number, number][] = [[rx+1,ry],[rx-1,ry],[rx,ry+1],[rx,ry-1]];
      spots = spots.filter(([sx,sy]) =>
        sx >= 0 && sx < w && sy >= 0 && sy < h &&
        (map[sy][sx].type === 'grass' || map[sy][sx].type === 'forest')
      );
      if (spots.length === 0) continue;
      const [bx, by] = spots[Math.floor(Math.random() * spots.length)];
      map[by][bx] = this.tile(this._wPick(rp.types) as WorldTileType);
    }
  },

  /* ── 10. Wilderness POIs ───────────────────────────────── */
  _wildernessPOIs(map: WorldCell[][], w: number, h: number, cities: Position[], wg: WorldGenConfig): void {
    const wp = wg.wildernessPOIs;
    if (!wp || !wp.enabled) return;
    const placed: Position[] = [];
    let attempts = 0;
    while (placed.length < (wp.count || 6) && attempts++ < 500) {
      const x = 2 + Math.floor(Math.random() * (w - 4));
      const y = 2 + Math.floor(Math.random() * (h - 4));
      const t = map[y][x].type;
      if (t !== 'grass' && t !== 'forest') continue;
      const dCity = cities.reduce((m, c) => Math.min(m, Math.abs(c.x - x) + Math.abs(c.y - y)), Infinity);
      if (dCity < (wp.minCityDist || 8)) continue;
      const dPOI = placed.reduce((m, p) => Math.min(m, Math.abs(p.x - x) + Math.abs(p.y - y)), Infinity);
      if (dPOI < (wp.minPOIDist || 6)) continue;
      map[y][x] = this.tile(this._wPick(wp.types) as WorldTileType);
      placed.push({x, y});
    }
  },

  /* ── Utility: Weighted Pick ────────────────────────────── */
  _wPick(pool: WeightedTypeEntry[]): string {
    let t = pool.reduce((s, e) => s + e.weight, 0), r = Math.random() * t;
    for (const e of pool) { r -= e.weight; if (r <= 0) return e.type; }
    return pool[pool.length - 1].type;
  },

  _adjacentToRoad(x: number, y: number, roads: Set<string>): boolean {
    return roads.has(`${x-1},${y}`) || roads.has(`${x+1},${y}`) ||
           roads.has(`${x},${y-1}`) || roads.has(`${x},${y+1}`);
  },

  _findNearestRoad(x: number, y: number, roads: Set<string>, maxDist: number): Position | null {
    let best: Position | null = null, bestD = maxDist + 1;
    for (const key of roads) {
      const [rx, ry] = key.split(',').map(Number);
      const d = Math.abs(rx - x) + Math.abs(ry - y);
      if (d < bestD) { bestD = d; best = { x: rx, y: ry }; }
    }
    return bestD <= maxDist ? best : null;
  },

  _findBuildSpots(map: WorldCell[][], w: number, h: number, cx: number, cy: number, radius: number, roads: Set<string>): Position[] {
    const spots: Position[] = [];
    for (let dy = -radius; dy <= radius; dy++)
      for (let dx = -radius; dx <= radius; dx++) {
        const x = cx + dx, y = cy + dy;
        if (x < 0 || x >= w || y < 0 || y >= h) continue;
        const t = map[y][x].type;
        if ((t === 'grass' || t === 'forest') && this._adjacentToRoad(x, y, roads))
          spots.push({x, y});
      }
    for (let i = spots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [spots[i], spots[j]] = [spots[j], spots[i]];
    }
    return spots;
  },
};


// ═══════════════════════════════════════════════════════════
//  Interior Generation — Multi-Floor Support
// ═══════════════════════════════════════════════════════════

export const Interior = {

  _charMap: {'#':'wall','.':'floor','D':'door','W':'window','S':'shelf','C':'counter','L':'ladder','U':'stairs_up','B':'stairs_down','K':'locker'} as Record<string, InteriorTileType>,
  _bunkerCharMap: {'R':'bwall','.':'bfloor','S':'shelf','L':'ladder','U':'stairs_up','B':'stairs_down'} as Record<string, InteriorTileType>,

  /** Generate a multi-floor building interior */
  generate(buildingType: string): Building {
    let layoutKey: LayoutKey = buildingType as LayoutKey;
    if (!C.layouts[layoutKey]) layoutKey = 'house';
    const templates = C.layouts[layoutKey];
    const tmpl = templates[Math.floor(Math.random() * templates.length)];
    const groundFloor = this._buildFloor(tmpl, buildingType, 'Ground Floor');

    const building: Building = {
      floors: [groundFloor],
      buildingType: buildingType as BuildingType,
      cleared: false,
    };

    const mf = C.multiFloor[buildingType as BuildingType];
    if (mf && Math.random() < mf.chance) {
      const extraTemplates = C.layouts[mf.extra];
      if (extraTemplates && extraTemplates.length > 0) {
        const extraTmpl = extraTemplates[Math.floor(Math.random() * extraTemplates.length)];
        const extraFloor = this._buildFloor(extraTmpl, buildingType, mf.label);
        if (mf.dir === 'down') {
          this._addStairs(groundFloor, 'stairs_down');
        } else {
          this._addStairs(groundFloor, 'stairs_up');
        }
        building.floors.push(extraFloor);
      }
    }
    return building;
  },

  /** Generate the starting bunker */
  generateBunker(): Building {
    const tmpl = C.layouts.bunker[0];
    const floor = this._buildFloor(tmpl, 'bunker', 'Bunker');
    return { floors: [floor], buildingType: 'bunker', cleared: true };
  },

  /** Add stairs to a random floor spot */
  _addStairs(floor: Floor, stairType: InteriorTileType): void {
    const candidates: Position[] = [];
    for (let y = 1; y < floor.h - 1; y++)
      for (let x = 1; x < floor.w - 1; x++) {
        if (floor.map[y][x].type !== 'floor') continue;
        const dx = Math.abs(x - floor.entryPos.x), dy = Math.abs(y - floor.entryPos.y);
        if (dx + dy > 2) candidates.push({ x, y });
      }
    if (candidates.length === 0) return;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    floor.map[pick.y][pick.x].type = stairType;
  },

  /** Build a single floor from template */
  _buildFloor(tmpl: string[], buildingType: string, label: string): Floor {
    const isBunker = (buildingType === 'bunker');
    const charMap = isBunker ? this._bunkerCharMap : this._charMap;
    const h = tmpl.length, w = tmpl[0].length;
    const map: InteriorCell[][] = [];
    let entryPos: Position | null = null;

    for (let y = 0; y < h; y++) {
      const row: InteriorCell[] = [];
      for (let x = 0; x < w; x++) {
        const ch = tmpl[y][x];
        const type: InteriorTileType = charMap[ch] || (isBunker ? 'bwall' : 'wall');
        const cell: InteriorCell = { type, loot: 0, barricadeHp: 0 };

        if (type === 'shelf') cell.loot = 3;
        else if (type === 'locker') cell.loot = 4;

        if (C.itiles[type] && C.itiles[type].container) {
          cell.storage = [];
        }
        if (type === 'door' || type === 'ladder') entryPos = { x, y };
        if (type === 'stairs_up') entryPos = entryPos || { x, y };
        row.push(cell);
      }
      map.push(row);
    }

    // Fallback entry
    if (!entryPos) {
      for (let y = 0; y < h && !entryPos; y++)
        for (let x = 0; x < w && !entryPos; x++)
          if (C.itiles[map[y][x].type] && C.itiles[map[y][x].type].pass)
            entryPos = { x, y };
    }

    return { map, w, h, entryPos: entryPos || { x: 0, y: 0 }, label };
  },

  getFloor(building: Building, floorIdx: number): Floor {
    return building.floors[floorIdx] || building.floors[0];
  },

  findStairs(floor: Floor, stairType: InteriorTileType): Position | null {
    for (let y = 0; y < floor.h; y++)
      for (let x = 0; x < floor.w; x++)
        if (floor.map[y][x].type === stairType) return { x, y };
    return null;
  },

  getAdjacentSearchable(floor: Floor, px: number, py: number): { x: number; y: number; cell: InteriorCell }[] {
    const results: { x: number; y: number; cell: InteriorCell }[] = [];
    for (const [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]] as [number, number][]) {
      const nx = px + dx, ny = py + dy;
      if (nx < 0 || nx >= floor.w || ny < 0 || ny >= floor.h) continue;
      const cell = floor.map[ny][nx], def = C.itiles[cell.type];
      if (def && def.searchable && cell.loot > 0) results.push({ x: nx, y: ny, cell });
    }
    return results;
  },

  getAdjacentBarricadable(floor: Floor, px: number, py: number): { x: number; y: number; cell: InteriorCell }[] {
    const results: { x: number; y: number; cell: InteriorCell }[] = [];
    for (const [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]] as [number, number][]) {
      const nx = px + dx, ny = py + dy;
      if (nx < 0 || nx >= floor.w || ny < 0 || ny >= floor.h) continue;
      const cell = floor.map[ny][nx], def = C.itiles[cell.type];
      if (def && def.barricadable && cell.barricadeHp <= 0) results.push({ x: nx, y: ny, cell });
    }
    return results;
  },

  getAdjacentSalvageable(floor: Floor, px: number, py: number): { x: number; y: number; cell: InteriorCell }[] {
    const results: { x: number; y: number; cell: InteriorCell }[] = [];
    for (const [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]] as [number, number][]) {
      const nx = px + dx, ny = py + dy;
      if (nx < 0 || nx >= floor.w || ny < 0 || ny >= floor.h) continue;
      const cell = floor.map[ny][nx], def = C.itiles[cell.type];
      if (def && def.salvageable) results.push({ x: nx, y: ny, cell });
    }
    return results;
  },
};
