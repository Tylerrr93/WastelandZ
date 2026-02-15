/* ═══════════════════════════════════════════════════════════
   WASTELAND SURVIVOR — world.js
   Procedural overworld + building interior generation
   ═══════════════════════════════════════════════════════════ */

const World = {
  create() {
    const { w, h, worldGen: wg } = C;
    let map = this._fill(w, h, wg);
    let cities = this._settlements(map, w, h, wg, wg.cityCount, 'city');
    let towns  = this._settlements(map, w, h, wg, wg.townCount, 'town');
    let hamlets = this._settlements(map, w, h, wg, wg.hamletCount, 'hamlet');
    let allSettlements = [...cities, ...towns, ...hamlets];
    let roads = new Set();

    // Connect cities to each other
    for (let i = 0; i < cities.length - 1; i++)
      this._path(map, cities[i], cities[i + 1], roads, wg);
    if (cities.length > 1)
      this._path(map, cities[cities.length - 1], cities[0], roads, wg);

    // Connect each town to nearest city
    for (let t of towns) {
      let nearest = this._nearest(t, cities);
      if (nearest) this._path(map, t, nearest, roads, wg);
    }

    // Connect each hamlet to nearest town or city
    let townOrCity = [...cities, ...towns];
    for (let h of hamlets) {
      let nearest = this._nearest(h, townOrCity);
      if (nearest) this._path(map, h, nearest, roads, wg);
    }

    // Place buildings adjacent to roads for each settlement
    this._placeSettlementBuildings(map, w, h, cities, roads, wg, 'city');
    this._placeSettlementBuildings(map, w, h, towns, roads, wg, 'town');
    this._placeSettlementBuildings(map, w, h, hamlets, roads, wg, 'hamlet');

    return map;
  },

  tile(type) {
    const cap = C.tiles[type] ? C.tiles[type].cap : 0;
    return { type, loot: cap, max: cap };
  },

  _fill(w, h, wg) {
    return Array.from({ length: h }, (_, y) =>
      Array.from({ length: w }, (_, x) => {
        let n = Math.sin(x / 7) + Math.cos(y / 8) + Math.random();
        let t = n > wg.terrainWaterThreshold ? 'water'
              : n > wg.terrainForestThreshold ? 'forest' : 'grass';
        return this.tile(t);
      })
    );
  },

  /** Generate settlement center points with spacing */
  _settlements(map, w, h, wg, count, type) {
    let c = [], b = wg.cityMinEdgeBuffer, a = 0;
    let minDist = type === 'city' ? 20 : type === 'town' ? 10 : 6;
    while (c.length < count && a++ < 2000) {
      let x = Math.floor(Math.random() * (w - b * 2)) + b;
      let y = Math.floor(Math.random() * (h - b * 2)) + b;
      if (map[y][x].type === 'water') continue;
      // Enforce minimum distance between same-type settlements
      let tooClose = c.some(s => Math.abs(s.x - x) + Math.abs(s.y - y) < minDist);
      if (!tooClose) c.push({ x, y, type });
    }
    return c;
  },

  /** Find nearest settlement from a list */
  _nearest(target, list) {
    let best = null, bestD = Infinity;
    for (let s of list) {
      let d = Math.abs(s.x - target.x) + Math.abs(s.y - target.y);
      if (d < bestD) { bestD = d; best = s; }
    }
    return best;
  },

  _path(map, p1, p2, rs, wg) {
    let x = p1.x, y = p1.y;
    const pave = () => {
      if (x < 0 || x >= C.w || y < 0 || y >= C.h) return;
      map[y][x] = this.tile(map[y][x].type === 'water' ? 'bridge' : 'road');
      rs.add(`${x},${y}`);
    };
    // L-shaped path with some randomness
    if (Math.random() < 0.5) {
      while (x !== p2.x) { x += x < p2.x ? 1 : -1; pave(); }
      while (y !== p2.y) { y += y < p2.y ? 1 : -1; pave(); }
    } else {
      while (y !== p2.y) { y += y < p2.y ? 1 : -1; pave(); }
      while (x !== p2.x) { x += x < p2.x ? 1 : -1; pave(); }
    }

    // Side road branches
    if (wg.roadBranchChance && Math.random() < wg.roadBranchChance) {
      let bLen = wg.roadBranchLength;
      let len = bLen.min + Math.floor(Math.random() * (bLen.max - bLen.min));
      let bx = p1.x, by = p1.y;
      let dir = Math.random() < 0.5 ? 1 : -1;
      let horiz = Math.random() < 0.5;
      for (let i = 0; i < len; i++) {
        if (horiz) bx += dir; else by += dir;
        if (bx < 0 || bx >= C.w || by < 0 || by >= C.h) break;
        map[by][bx] = this.tile(map[by][bx].type === 'water' ? 'bridge' : 'road');
        rs.add(`${bx},${by}`);
      }
    }
  },

  _wPick(pool) {
    let t = pool.reduce((s, e) => s + e.weight, 0), r = Math.random() * t;
    for (let e of pool) { r -= e.weight; if (r <= 0) return e.type; }
    return pool[pool.length - 1].type;
  },

  /** Place buildings adjacent to roads near settlement centers */
  _placeSettlementBuildings(map, w, h, settlements, roads, wg, sType) {
    let countCfg, dist;
    if (sType === 'city') {
      countCfg = wg.cityBuildingCount;
      dist = wg.cityBuildingDist;
    } else if (sType === 'town') {
      countCfg = wg.townBuildingCount;
      dist = wg.townBuildingDist;
    } else {
      countCfg = wg.hamletBuildingCount;
      dist = wg.hamletBuildingDist;
    }

    for (let s of settlements) {
      let count = countCfg.min + Math.floor(Math.random() * (countCfg.max - countCfg.min + 1));
      let placed = 0, attempts = 0;
      let searchRadius = sType === 'city' ? 8 : sType === 'town' ? 5 : 3;

      while (placed < count && attempts++ < 300) {
        // Find a road tile near the settlement
        let rx = s.x + Math.floor(Math.random() * searchRadius * 2) - searchRadius;
        let ry = s.y + Math.floor(Math.random() * searchRadius * 2) - searchRadius;
        if (rx < 1 || rx >= w - 1 || ry < 1 || ry >= h - 1) continue;
        if (!roads.has(`${rx},${ry}`)) continue;

        // Find an adjacent non-road, non-water, non-building tile
        let dirs = [[0,-1],[0,1],[-1,0],[1,0]];
        // Shuffle directions for variety
        for (let i = dirs.length - 1; i > 0; i--) {
          let j = Math.floor(Math.random() * (i + 1));
          [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
        }
        for (let [dx, dy] of dirs) {
          let bx = rx + dx, by = ry + dy;
          if (bx < 0 || bx >= w || by < 0 || by >= h) continue;
          let existing = map[by][bx];
          // Only place on grass or forest (not road, water, bridge, or existing building)
          if (existing.type !== 'grass' && existing.type !== 'forest') continue;
          let bType = this._wPick(dist);
          map[by][bx] = this.tile(bType);
          placed++;
          break;
        }
      }
    }
  },
};


/* ═══════════════════════════════════════════════════════════
   Interior Generation — Multi-Floor Support
   ═══════════════════════════════════════════════════════════ */

const Interior = {

  _charMap: {
    '#':'wall','.':'floor','D':'door','W':'window','S':'shelf','C':'counter',
    'L':'ladder','U':'stairs_up','B':'stairs_down','T':'workbench','O':'barrel',
    'K':'locker','E':'table','H':'chair','F':'fridge','Z':'bed','P':'toilet',
    'Q':'bookshelf'
  },
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
          this._addStairs(groundFloor, 'stairs_down');
          building.floors.push(extraFloor);
        } else {
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
        let tileDef = C.itiles[type];
        let cell = { type, loot: 0, barricadeHp: 0 };
        if (tileDef && tileDef.lootAmount) cell.loot = tileDef.lootAmount;
        if (tileDef && tileDef.container) cell.storage = [];
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

  getAdjacentDestructible(floor, px, py) {
    let results = [];
    for (let [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
      let nx = px + dx, ny = py + dy;
      if (nx < 0 || nx >= floor.w || ny < 0 || ny >= floor.h) continue;
      let cell = floor.map[ny][nx], def = C.itiles[cell.type];
      if (def && def.destructible) results.push({ x: nx, y: ny, cell });
    }
    return results;
  },
};
