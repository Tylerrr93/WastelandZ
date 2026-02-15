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

  /** Weighted random pick from [{type,weight},...] */
  _wPick(pool) {
    let t = pool.reduce((s, e) => s + e.weight, 0), r = Math.random() * t;
    for (let e of pool) { r -= e.weight; if (r <= 0) return e.type; }
    return pool[pool.length - 1].type;
  },

  _zone(map, w, h, cities, roads, wg) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (map[y][x].type === 'water' || roads.has(`${x},${y}`)) continue;
        let d = cities.reduce((m, c) => Math.min(m, Math.abs(c.x - x) + Math.abs(c.y - y)), Infinity);
        if (d <= wg.cityCoreDist) {
          map[y][x] = this.tile(this._wPick(wg.coreDist));
        } else if (d <= wg.citySuburbDist && Math.random() < wg.citySuburbChance) {
          map[y][x] = this.tile(this._wPick(wg.suburbDist));
        }
      }
    }
  },
};


/* ═══════════════════════════════════════════════════════════
   Interior Generation
   ═══════════════════════════════════════════════════════════ */

const Interior = {

  /** Map of layout chars to interior tile types */
  _charMap: {'#':'wall','.':'floor','D':'door','W':'window','S':'shelf','C':'counter','L':'ladder'},

  /** Generate an interior map for a building type */
  generate(buildingType) {
    let layoutKey = buildingType;
    if (!C.layouts[layoutKey]) layoutKey = 'house'; // fallback
    let templates = C.layouts[layoutKey];
    let tmpl = templates[Math.floor(Math.random() * templates.length)];
    return this._buildInterior(tmpl, buildingType);
  },

  /** Generate the starting bunker (pre-cleared, pre-claimed) */
  generateBunker() {
    let tmpl = C.layouts.bunker[0];
    let int = this._buildInterior(tmpl, 'bunker');
    int.claimed = true;
    int.cleared = true;
    return int;
  },

  /** Build interior data from a template string array */
  _buildInterior(tmpl, buildingType) {
    let h = tmpl.length, w = tmpl[0].length;
    let map = [], doorPos = null;

    for (let y = 0; y < h; y++) {
      let row = [];
      for (let x = 0; x < w; x++) {
        let ch = tmpl[y][x];
        let type = this._charMap[ch] || 'wall';
        let cell = { type, loot: 0, barricadeHp: 0 };
        if (type === 'shelf') cell.loot = 3;
        if (type === 'door' || type === 'ladder') doorPos = { x, y };
        row.push(cell);
      }
      map.push(row);
    }

    // Safety: fallback entry
    if (!doorPos) {
      for (let y = 0; y < h && !doorPos; y++)
        for (let x = 0; x < w && !doorPos; x++)
          if (map[y][x].type === 'window' || map[y][x].type === 'floor')
            doorPos = { x, y };
    }

    return { map, w, h, doorPos, claimed: false, cleared: false, buildingType };
  },

  /** Find searchable tiles adjacent to player position */
  getAdjacentSearchable(interior, px, py) {
    let results = [];
    for (let [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
      let nx = px + dx, ny = py + dy;
      if (nx < 0 || nx >= interior.w || ny < 0 || ny >= interior.h) continue;
      let cell = interior.map[ny][nx], def = C.itiles[cell.type];
      if (def && def.searchable && cell.loot > 0) results.push({ x: nx, y: ny, cell });
    }
    return results;
  },

  /** Find barricadable tiles adjacent to player position */
  getAdjacentBarricadable(interior, px, py) {
    let results = [];
    for (let [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
      let nx = px + dx, ny = py + dy;
      if (nx < 0 || nx >= interior.w || ny < 0 || ny >= interior.h) continue;
      let cell = interior.map[ny][nx], def = C.itiles[cell.type];
      if (def && def.barricadable && cell.barricadeHp <= 0) results.push({ x: nx, y: ny, cell });
    }
    return results;
  },

  /** Find salvageable tiles adjacent to player position */
  getAdjacentSalvageable(interior, px, py) {
    let results = [];
    for (let [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
      let nx = px + dx, ny = py + dy;
      if (nx < 0 || nx >= interior.w || ny < 0 || ny >= interior.h) continue;
      let cell = interior.map[ny][nx], def = C.itiles[cell.type];
      if (def && def.salvageable) results.push({ x: nx, y: ny, cell });
    }
    return results;
  },
};
