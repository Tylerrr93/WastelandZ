/* ═══════════════════════════════════════════════════════════
   WASTELAND SURVIVOR — world.js
   Procedural overworld + building interior generation
   ═══════════════════════════════════════════════════════════ */

const World = {

  /* ── Main Generation Pipeline ─────────────────────────────
     Each step reads from C.worldGen. If a config section is
     missing or disabled, that step is simply skipped and the
     prior behavior is preserved.
     ────────────────────────────────────────────────────────── */
  create() {
    const { w, h, worldGen: wg } = C;

    // 1. Base terrain
    let map = this._fill(w, h, wg);

    // 2. Terrain enrichment (clearings & dense patches)
    this._enrichTerrain(map, w, h, wg);

    // 3. City centers (with minimum spacing)
    let cities = this._cities(map, w, h, wg);

    // 4. Main roads connecting cities in a loop
    let roads = new Set();
    for (let i = 0; i < cities.length - 1; i++)
      this._path(map, cities[i], cities[i + 1], roads);
    if (cities.length > 2)
      this._path(map, cities[cities.length - 1], cities[0], roads);

    // 5. Road branching (short dead-end side roads)
    this._branchRoads(map, w, h, roads, wg);

    // 6. City street grids (internal road networks)
    this._cityStreets(map, w, h, cities, roads, wg);

    // 7. Hamlet road connections
    let hamletCenters = this._hamlets(map, w, h, cities, roads, wg);

    // 8. Zone buildings around cities (with road-adjacency rule)
    this._zone(map, w, h, cities, roads, wg);

    // 9. Roadside POIs (lone buildings along highways)
    this._roadsidePOIs(map, w, h, cities, roads, wg);

    // 10. Wilderness POIs (isolated structures far from everything)
    this._wildernessPOIs(map, w, h, cities, wg);

    return map;
  },

  tile(type) {
    const cap = C.tiles[type] ? C.tiles[type].cap : 0;
    return { type, loot: cap, max: cap };
  },


  /* ── 1. Base Terrain Fill ─────────────────────────────────── */
  _fill(w, h, wg) {
    return Array.from({ length: h }, (_, y) =>
      Array.from({ length: w }, (_, x) => {
        let n = Math.sin(x / 5) + Math.cos(y / 6) + Math.random();
        let t = n > wg.terrainWaterThreshold ? 'water'
              : n > wg.terrainForestThreshold ? 'forest' : 'grass';
        return this.tile(t);
      })
    );
  },


  /* ── 2. Terrain Enrichment ────────────────────────────────── */
  _enrichTerrain(map, w, h, wg) {
    let tc = wg.terrain;
    if (!tc) return;

    // Clearings — grass patches inside forests
    if (tc.clearings && tc.clearings.enabled) {
      let cl = tc.clearings;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          if (map[y][x].type === 'forest' && Math.random() < cl.chance) {
            let r = cl.radius || 1;
            for (let dy = -r; dy <= r; dy++)
              for (let dx = -r; dx <= r; dx++) {
                let nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < w && ny >= 0 && ny < h && map[ny][nx].type === 'forest')
                  map[ny][nx] = this.tile('grass');
              }
          }
        }
    }

    // Dense forest — forest patches in grassland
    if (tc.denseForest && tc.denseForest.enabled) {
      let df = tc.denseForest;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          if (map[y][x].type === 'grass' && Math.random() < df.chance) {
            let r = df.radius || 2;
            for (let dy = -r; dy <= r; dy++)
              for (let dx = -r; dx <= r; dx++) {
                let nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < w && ny >= 0 && ny < h && map[ny][nx].type === 'grass')
                  map[ny][nx] = this.tile('forest');
              }
          }
        }
    }
  },


  /* ── 3. City Placement (with spacing) ─────────────────────── */
  _cities(map, w, h, wg) {
    let c = [], b = wg.cityMinEdgeBuffer, minDist = wg.cityMinSpacing || 0, a = 0;
    while (c.length < wg.cityCount && a++ < 2000) {
      let x = Math.floor(Math.random() * (w - b * 2)) + b;
      let y = Math.floor(Math.random() * (h - b * 2)) + b;
      if (map[y][x].type === 'water') continue;
      // Enforce minimum spacing
      let tooClose = false;
      for (let ex of c) {
        if (Math.abs(ex.x - x) + Math.abs(ex.y - y) < minDist) { tooClose = true; break; }
      }
      if (!tooClose) c.push({ x, y });
    }
    return c;
  },


  /* ── 4. Road Pathing ──────────────────────────────────────── */
  _path(map, p1, p2, rs) {
    let x = p1.x, y = p1.y;
    const pave = () => {
      if (x < 0 || x >= C.w || y < 0 || y >= C.h) return;
      map[y][x] = this.tile(map[y][x].type === 'water' ? 'bridge' : 'road');
      rs.add(`${x},${y}`);
    };
    while (x !== p2.x) { x += x < p2.x ? 1 : -1; pave(); }
    while (y !== p2.y) { y += y < p2.y ? 1 : -1; pave(); }
  },


  /* ── 5. Road Branching ────────────────────────────────────── */
  _branchRoads(map, w, h, roads, wg) {
    let rb = wg.roadBranching;
    if (!rb || !rb.enabled) return;
    let existing = [...roads];                     // snapshot to avoid infinite growth
    for (let key of existing) {
      if (Math.random() > rb.chance) continue;
      let [rx, ry] = key.split(',').map(Number);
      // Pick a random perpendicular-ish direction
      let dirs = [[1,0],[-1,0],[0,1],[0,-1]];
      let dir = dirs[Math.floor(Math.random() * dirs.length)];
      let len = rb.minLen + Math.floor(Math.random() * (rb.maxLen - rb.minLen + 1));
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


  /* ── 6. City Street Grid ──────────────────────────────────── */
  _cityStreets(map, w, h, cities, roads, wg) {
    let cs = wg.cityStreets;
    if (!cs || !cs.enabled) return;
    let spacing = cs.spacing || 3;
    let reach = cs.reach || wg.citySuburbDist || 5;
    let jitter = cs.jitter || 0;

    for (let city of cities) {
      // Lay down a grid of roads around the city center
      for (let dy = -reach; dy <= reach; dy++) {
        for (let dx = -reach; dx <= reach; dx++) {
          let x = city.x + dx, y = city.y + dy;
          if (x < 0 || x >= w || y < 0 || y >= h) continue;
          if (map[y][x].type === 'water') continue;
          // Place road if on a grid line
          let onGridX = (Math.abs(dx) % spacing === 0);
          let onGridY = (Math.abs(dy) % spacing === 0);
          if ((onGridX || onGridY) && Math.random() > jitter) {
            // Only pave natural terrain — don't overwrite buildings already placed
            let t = map[y][x].type;
            if (t === 'grass' || t === 'forest') {
              map[y][x] = this.tile('road');
              roads.add(`${x},${y}`);
            }
          }
        }
      }
    }
  },


  /* ── 7. Hamlets ───────────────────────────────────────────── */
  _hamlets(map, w, h, cities, roads, wg) {
    let hc = wg.hamlets;
    if (!hc || !hc.enabled) return [];
    let placed = [], attempts = 0;

    while (placed.length < (hc.count || 3) && attempts++ < 500) {
      let x = 3 + Math.floor(Math.random() * (w - 6));
      let y = 3 + Math.floor(Math.random() * (h - 6));
      if (map[y][x].type === 'water') continue;

      // Distance checks
      let dCity = cities.reduce((m, c) => Math.min(m, Math.abs(c.x - x) + Math.abs(c.y - y)), Infinity);
      if (dCity < (hc.minCityDist || 10)) continue;
      let dHam = placed.reduce((m, p) => Math.min(m, Math.abs(p.x - x) + Math.abs(p.y - y)), Infinity);
      if (dHam < (hc.minHamletDist || 8)) continue;

      // Connect hamlet to nearest road with a short path
      let nearRoad = this._findNearestRoad(x, y, roads, 20);
      if (nearRoad) this._path(map, {x, y}, nearRoad, roads);

      // Place a crossroads at center
      map[y][x] = this.tile('road');
      roads.add(`${x},${y}`);
      // Small cross street
      for (let d = -1; d <= 1; d++) {
        if (x+d >= 0 && x+d < w) { map[y][x+d] = this.tile('road'); roads.add(`${x+d},${y}`); }
        if (y+d >= 0 && y+d < h) { map[y+d][x] = this.tile('road'); roads.add(`${x},${y+d}`); }
      }

      // Place buildings adjacent to roads
      let size = (hc.minSize || 2) + Math.floor(Math.random() * ((hc.maxSize || 4) - (hc.minSize || 2) + 1));
      let spots = this._findBuildSpots(map, w, h, x, y, 3, roads);
      for (let i = 0; i < Math.min(size, spots.length); i++) {
        let s = spots[i];
        let bType = this._wPick(hc.types || wg.suburbDist);
        map[s.y][s.x] = this.tile(bType);
      }
      placed.push({x, y});
    }
    return placed;
  },


  /* ── 8. Zone Buildings (with road adjacency) ──────────────── */
  _zone(map, w, h, cities, roads, wg) {
    let needRoad = wg.buildingsNeedRoad !== false;   // default true

    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (map[y][x].type === 'water' || roads.has(`${x},${y}`)) continue;
        // Don't overwrite buildings placed by hamlets/POIs
        let cur = map[y][x].type;
        if (cur !== 'grass' && cur !== 'forest') continue;

        let d = cities.reduce((m, c) => Math.min(m, Math.abs(c.x - x) + Math.abs(c.y - y)), Infinity);
        let isCore = d <= wg.cityCoreDist;
        let isSuburb = d <= wg.citySuburbDist && Math.random() < wg.citySuburbChance;

        if (isCore || isSuburb) {
          // Road adjacency check
          if (needRoad && !this._adjacentToRoad(x, y, roads)) continue;
          let pool = isCore ? wg.coreDist : wg.suburbDist;
          map[y][x] = this.tile(this._wPick(pool));
        }
      }
  },


  /* ── 9. Roadside POIs ─────────────────────────────────────── */
  _roadsidePOIs(map, w, h, cities, roads, wg) {
    let rp = wg.roadsidePOIs;
    if (!rp || !rp.enabled) return;
    let minCD = rp.minCityDist || 6;

    for (let key of roads) {
      if (Math.random() > rp.chance) continue;
      let [rx, ry] = key.split(',').map(Number);

      // Must be far enough from cities (it's between cities, not in them)
      let dCity = cities.reduce((m, c) => Math.min(m, Math.abs(c.x - rx) + Math.abs(c.y - ry)), Infinity);
      if (dCity < minCD) continue;

      // Find a buildable spot adjacent to this road tile
      let spots = [[rx+1,ry],[rx-1,ry],[rx,ry+1],[rx,ry-1]];
      spots = spots.filter(([sx,sy]) =>
        sx >= 0 && sx < w && sy >= 0 && sy < h &&
        (map[sy][sx].type === 'grass' || map[sy][sx].type === 'forest')
      );
      if (spots.length === 0) continue;
      let [bx, by] = spots[Math.floor(Math.random() * spots.length)];
      map[by][bx] = this.tile(this._wPick(rp.types));
    }
  },


  /* ── 10. Wilderness POIs ──────────────────────────────────── */
  _wildernessPOIs(map, w, h, cities, wg) {
    let wp = wg.wildernessPOIs;
    if (!wp || !wp.enabled) return;
    let placed = [], attempts = 0;

    while (placed.length < (wp.count || 6) && attempts++ < 500) {
      let x = 2 + Math.floor(Math.random() * (w - 4));
      let y = 2 + Math.floor(Math.random() * (h - 4));
      let t = map[y][x].type;
      if (t !== 'grass' && t !== 'forest') continue;

      let dCity = cities.reduce((m, c) => Math.min(m, Math.abs(c.x - x) + Math.abs(c.y - y)), Infinity);
      if (dCity < (wp.minCityDist || 8)) continue;
      let dPOI = placed.reduce((m, p) => Math.min(m, Math.abs(p.x - x) + Math.abs(p.y - y)), Infinity);
      if (dPOI < (wp.minPOIDist || 6)) continue;

      map[y][x] = this.tile(this._wPick(wp.types));
      placed.push({x, y});
    }
  },


  /* ── Utility: Weighted Pick ───────────────────────────────── */
  _wPick(pool) {
    let t = pool.reduce((s, e) => s + e.weight, 0), r = Math.random() * t;
    for (let e of pool) { r -= e.weight; if (r <= 0) return e.type; }
    return pool[pool.length - 1].type;
  },

  /* ── Utility: Is tile adjacent to any road? ───────────────── */
  _adjacentToRoad(x, y, roads) {
    return roads.has(`${x-1},${y}`) || roads.has(`${x+1},${y}`) ||
           roads.has(`${x},${y-1}`) || roads.has(`${x},${y+1}`);
  },

  /* ── Utility: Find nearest road tile within maxDist ───────── */
  _findNearestRoad(x, y, roads, maxDist) {
    let best = null, bestD = maxDist + 1;
    for (let key of roads) {
      let [rx, ry] = key.split(',').map(Number);
      let d = Math.abs(rx - x) + Math.abs(ry - y);
      if (d < bestD) { bestD = d; best = { x: rx, y: ry }; }
    }
    return bestD <= maxDist ? best : null;
  },

  /* ── Utility: Find buildable spots near a point ───────────── */
  _findBuildSpots(map, w, h, cx, cy, radius, roads) {
    let spots = [];
    for (let dy = -radius; dy <= radius; dy++)
      for (let dx = -radius; dx <= radius; dx++) {
        let x = cx + dx, y = cy + dy;
        if (x < 0 || x >= w || y < 0 || y >= h) continue;
        let t = map[y][x].type;
        if ((t === 'grass' || t === 'forest') && this._adjacentToRoad(x, y, roads))
          spots.push({x, y});
      }
    // Shuffle
    for (let i = spots.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [spots[i], spots[j]] = [spots[j], spots[i]];
    }
    return spots;
  },
};


/* ═══════════════════════════════════════════════════════════
   Interior Generation — Multi-Floor Support
   ═══════════════════════════════════════════════════════════ */

const Interior = {

  _charMap:       {'#':'wall','.':'floor','D':'door','W':'window','S':'shelf','C':'counter','L':'ladder','U':'stairs_up','B':'stairs_down','K':'locker'},
  _bunkerCharMap: {'R':'bwall','.':'bfloor','S':'shelf','L':'ladder','U':'stairs_up','B':'stairs_down'},

  /** Generate a multi-floor building interior */
  generate(buildingType) {
    let layoutKey = buildingType;
    if (!C.layouts[layoutKey]) layoutKey = 'house';
    let templates = C.layouts[layoutKey];
    let tmpl = templates[Math.floor(Math.random() * templates.length)];
    let groundFloor = this._buildFloor(tmpl, buildingType, 'Ground Floor');

    let building = {
      floors: [groundFloor],
      buildingType,
      cleared: false,
    };

    // Check for multi-floor
    let mf = C.multiFloor[buildingType];
    if (mf && Math.random() < mf.chance) {
      let extraTemplates = C.layouts[mf.extra];
      if (extraTemplates && extraTemplates.length > 0) {
        let extraTmpl = extraTemplates[Math.floor(Math.random() * extraTemplates.length)];
        let extraFloor = this._buildFloor(extraTmpl, buildingType, mf.label);

        if (mf.dir === 'down') {
          // Ground floor gets stairs_down, extra floor is below
          this._addStairs(groundFloor, 'stairs_down');
          building.floors.push(extraFloor);
        } else {
          // Ground floor gets stairs_up, extra floor is above
          this._addStairs(groundFloor, 'stairs_up');
          building.floors.push(extraFloor);
        }
      }
    }

    return building;
  },

  /** Generate the starting bunker */
  generateBunker() {
    let tmpl = C.layouts.bunker[0];
    let floor = this._buildFloor(tmpl, 'bunker', 'Bunker');
    return {
      floors: [floor],
      buildingType: 'bunker',
      cleared: true,
    };
  },

  /** Add a stairs tile to a random floor spot */
  _addStairs(floor, stairType) {
    // Find an open floor tile not adjacent to the entry
    let candidates = [];
    for (let y = 1; y < floor.h - 1; y++)
      for (let x = 1; x < floor.w - 1; x++) {
        if (floor.map[y][x].type !== 'floor') continue;
        let dx = Math.abs(x - floor.entryPos.x), dy = Math.abs(y - floor.entryPos.y);
        if (dx + dy > 2) candidates.push({ x, y });
      }
    if (candidates.length === 0) return;
    let pick = candidates[Math.floor(Math.random() * candidates.length)];
    floor.map[pick.y][pick.x].type = stairType;
  },

  /** Build a single floor from template */
  _buildFloor(tmpl, buildingType, label) {
    let isBunker = (buildingType === 'bunker');
    let charMap = isBunker ? this._bunkerCharMap : this._charMap;
    let h = tmpl.length, w = tmpl[0].length;
    let map = [], entryPos = null;

    for (let y = 0; y < h; y++) {
      let row = [];
      for (let x = 0; x < w; x++) {
        let ch = tmpl[y][x];
        let type = charMap[ch] || (isBunker ? 'bwall' : 'wall');
        
        let cell = { type, loot: 0, barricadeHp: 0 };
        
        // Initialize loot
        if (type === 'shelf') cell.loot = 3;
        else if (type === 'locker') cell.loot = 4;
        
        // Initialize storage for any container type
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

    return { map, w, h, entryPos, label };
  },

  /** Get the current floor data from a building */
  getFloor(building, floorIdx) {
    return building.floors[floorIdx] || building.floors[0];
  },

  /** Find stairs position on a floor */
  findStairs(floor, stairType) {
    for (let y = 0; y < floor.h; y++)
      for (let x = 0; x < floor.w; x++)
        if (floor.map[y][x].type === stairType) return { x, y };
    return null;
  },

  getAdjacentSearchable(floor, px, py) {
    let results = [];
    for (let [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
      let nx = px + dx, ny = py + dy;
      if (nx < 0 || nx >= floor.w || ny < 0 || ny >= floor.h) continue;
      let cell = floor.map[ny][nx], def = C.itiles[cell.type];
      if (def && def.searchable && cell.loot > 0) results.push({ x: nx, y: ny, cell });
    }
    return results;
  },

  getAdjacentBarricadable(floor, px, py) {
    let results = [];
    for (let [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
      let nx = px + dx, ny = py + dy;
      if (nx < 0 || nx >= floor.w || ny < 0 || ny >= floor.h) continue;
      let cell = floor.map[ny][nx], def = C.itiles[cell.type];
      if (def && def.barricadable && cell.barricadeHp <= 0) results.push({ x: nx, y: ny, cell });
    }
    return results;
  },

  getAdjacentSalvageable(floor, px, py) {
    let results = [];
    for (let [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
      let nx = px + dx, ny = py + dy;
      if (nx < 0 || nx >= floor.w || ny < 0 || ny >= floor.h) continue;
      let cell = floor.map[ny][nx], def = C.itiles[cell.type];
      if (def && def.salvageable) results.push({ x: nx, y: ny, cell });
    }
    return results;
  },
};