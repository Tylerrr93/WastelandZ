/* ═══════════════════════════════════════════════════════════
   WASTELAND SURVIVOR — world.js
   Procedural overworld + building interior generation
   ═══════════════════════════════════════════════════════════ */

const World = {
  create() {
    const { w, h, worldGen: wg } = C;
    let map = this._fill(w, h, wg);
    let cities = this._cities(map, w, h, wg);
    let roads = new Set();
    for (let i = 0; i < cities.length - 1; i++)
      this._path(map, cities[i], cities[i + 1], roads);
    this._path(map, cities[cities.length - 1], cities[0], roads);
    this._zone(map, w, h, cities, roads, wg);
    return map;
  },

  tile(type) {
    const cap = C.tiles[type] ? C.tiles[type].cap : 0;
    return { type, loot: cap, max: cap };
  },

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

  _cities(map, w, h, wg) {
    let c = [], b = wg.cityMinEdgeBuffer, a = 0;
    while (c.length < wg.cityCount && a++ < 1000) {
      let x = Math.floor(Math.random() * (w - b * 2)) + b;
      let y = Math.floor(Math.random() * (h - b * 2)) + b;
      if (map[y][x].type !== 'water') c.push({ x, y });
    }
    return c;
  },

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

  _wPick(pool) {
    let t = pool.reduce((s, e) => s + e.weight, 0), r = Math.random() * t;
    for (let e of pool) { r -= e.weight; if (r <= 0) return e.type; }
    return pool[pool.length - 1].type;
  },

  _zone(map, w, h, cities, roads, wg) {
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (map[y][x].type === 'water' || roads.has(`${x},${y}`)) continue;
        let d = cities.reduce((m, c) => Math.min(m, Math.abs(c.x - x) + Math.abs(c.y - y)), Infinity);
        if (d <= wg.cityCoreDist) map[y][x] = this.tile(this._wPick(wg.coreDist));
        else if (d <= wg.citySuburbDist && Math.random() < wg.citySuburbChance)
          map[y][x] = this.tile(this._wPick(wg.suburbDist));
      }
  },
};

/* ═══════════════════════════════════════════════════════════
   Interior Generation
   ═══════════════════════════════════════════════════════════ */
const Interior = {
  _charMap:       {'#':'wall','.':'floor','D':'door','W':'window','S':'shelf','C':'counter','L':'ladder','U':'stairs_up','B':'stairs_down'},
  _bunkerCharMap: {'R':'bwall','.':'bfloor','S':'shelf','L':'ladder','U':'stairs_up','B':'stairs_down'},

  generate(buildingType) {
    let layoutKey = buildingType;
    if (!C.layouts[layoutKey]) layoutKey = 'house';
    let templates = C.layouts[layoutKey];
    let tmpl = templates[Math.floor(Math.random() * templates.length)];
    let groundFloor = this._buildFloor(tmpl, buildingType, 'Ground Floor');

    let building = { floors: [groundFloor], buildingType, cleared: false };

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

  generateBunker() {
    let tmpl = C.layouts.bunker[0];
    let floor = this._buildFloor(tmpl, 'bunker', 'Bunker');
    return { floors: [floor], buildingType: 'bunker', cleared: true };
  },

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
        
        let def = C.itiles[type];
        if (def) {
          if (def.searchable) cell.loot = 1; // Flag as having loot to generate
          if (def.container) cell.storage = []; // Initialize storage array
        }
        
        if (type === 'door' || type === 'ladder') entryPos = { x, y };
        if (type === 'stairs_up') entryPos = entryPos || { x, y };
        row.push(cell);
      }
      map.push(row);
    }
    if (!entryPos) {
      for (let y = 0; y < h && !entryPos; y++)
        for (let x = 0; x < w && !entryPos; x++)
          if (C.itiles[map[y][x].type] && C.itiles[map[y][x].type].pass)
            entryPos = { x, y };
    }
    return { map, w, h, entryPos, label };
  },

  findStairs(floor, stairType) {
    for (let y = 0; y < floor.h; y++)
      for (let x = 0; x < floor.w; x++)
        if (floor.map[y][x].type === stairType) return { x, y };
    return null;
  },

  // Generic adjacency helpers
  _getAdj(floor, px, py, predicate) {
    let results = [];
    for (let [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
      let nx = px + dx, ny = py + dy;
      if (nx < 0 || nx >= floor.w || ny < 0 || ny >= floor.h) continue;
      let cell = floor.map[ny][nx], def = C.itiles[cell.type];
      if (def && predicate(cell, def)) results.push({ x: nx, y: ny, cell });
    }
    return results;
  },

  getAdjacentSearchable(floor, px, py) {
    return this._getAdj(floor, px, py, (c, d) => d.searchable && c.loot > 0);
  },
  getAdjacentBarricadable(floor, px, py) {
    return this._getAdj(floor, px, py, (c, d) => d.barricadable && c.barricadeHp <= 0);
  },
  getAdjacentSalvageable(floor, px, py) {
    return this._getAdj(floor, px, py, (c, d) => d.salvageable);
  },
  getAdjacentContainers(floor, px, py) {
    // Return any tile that is a container AND has storage initialized
    return this._getAdj(floor, px, py, (c, d) => d.container && c.storage);
  }
};