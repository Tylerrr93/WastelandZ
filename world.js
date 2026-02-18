/* ═══════════════════════════════════════════════════════════
   WASTELAND SURVIVOR — world.js
   Procedural overworld + building interior generation
   ═══════════════════════════════════════════════════════════ */

const World = {

  create() {
    const { w, h, worldGen: wg } = C;
    
    // 0. Initialize Noise (Simple pseudo-random seed)
    this._seedNoise();

    // 1. Organic Terrain (Noise-based)
    let map = this._fill(w, h, wg);

    // 2. Rivers (NEW: Hydrology layer)
    this._rivers(map, w, h, wg);

    // 3. Terrain enrichment
    this._enrichTerrain(map, w, h, wg);

    // 4. City centers
    let cities = this._cities(map, w, h, wg);

    // 5. Organic Roads (Better pathfinding)
    let roads = new Set();
    // Connect cities in a loop
    if (cities.length > 0) {
        for (let i = 0; i < cities.length - 1; i++)
          this._path(map, cities[i], cities[i + 1], roads);
        if (cities.length > 2)
          this._path(map, cities[cities.length - 1], cities[0], roads);
    }

    this._branchRoads(map, w, h, roads, wg);
    this._cityStreets(map, w, h, cities, roads, wg);
    this._hamlets(map, w, h, cities, roads, wg);
    this._zone(map, w, h, cities, roads, wg);
    this._roadsidePOIs(map, w, h, cities, roads, wg);
    this._wildernessPOIs(map, w, h, cities, wg);

    return map;
  },

  tile(type) {
    const cap = C.tiles[type] ? C.tiles[type].cap : 0;
    return { type, loot: cap, max: cap };
  },

  /* ── 0. Simple Noise Implementation ───────────────────────── */
  _seed: Math.random(),
  _seedNoise() { this._seed = Math.random(); },
  // A simple 2D noise function (fractal brownian motion equivalent)
  _noise(x, y) {
      let val = Math.sin(x * 12.9898 + y * 78.233 + this._seed) * 43758.5453;
      return val - Math.floor(val);
  },
  _smoothNoise(x, y, scale) {
      // Bilinear interpolation would be better, but this "Value Noise" 
      // is significantly better than simple Math.sin
      let X = Math.floor(x / scale), Y = Math.floor(y / scale);
      let xf = (x / scale) - X, yf = (y / scale) - Y;
      // Smoothstep fade
      let u = xf * xf * (3 - 2 * xf);
      let v = yf * yf * (3 - 2 * yf);
      
      let n00 = this._noise(X, Y);
      let n01 = this._noise(X, Y + 1);
      let n10 = this._noise(X + 1, Y);
      let n11 = this._noise(X + 1, Y + 1);

      let x1 = n00 + (n10 - n00) * u;
      let x2 = n01 + (n11 - n01) * u;
      return x1 + (x2 - x1) * v;
  },

  /* ── 1. Base Terrain Fill (Upgraded) ──────────────────────── */
  _fill(w, h, wg) {
    const scale = wg.noise ? wg.noise.scale : 15;
    return Array.from({ length: h }, (_, y) =>
      Array.from({ length: w }, (_, x) => {
        // Multi-octave noise for detail
        let n = this._smoothNoise(x, y, scale) * 1 
              + this._smoothNoise(x, y, scale / 2) * 0.5;
        n = n / 1.5; // Normalize roughly to 0-1

        let t = 'grass';
        if (n < (wg.noise.waterLevel || 0.35)) t = 'water';
        else if (n > (wg.noise.forestLevel || 0.65)) t = 'forest';
        
        return this.tile(t);
      })
    );
  },

  /* ── 2. Rivers (NEW) ──────────────────────────────────────── */
  _rivers(map, w, h, wg) {
    if (!wg.rivers || !wg.rivers.enabled) return;
    let count = 0, max = wg.rivers.count || 10;
    
    // Attempt to spawn rivers from high ground (forests)
    for(let i=0; i<100 && count < max; i++) {
        let rx = Math.floor(Math.random() * w);
        let ry = Math.floor(Math.random() * h);
        
        // Rivers start in forests (highlands) and must not start in water
        if (map[ry][rx].type !== 'forest') continue;

        let path = [];
        let cx = rx, cy = ry;
        let flowParams = { reachedWater: false };
        
        // "Walk" downhill (or random walk if flat) until water
        while (path.length < 100) {
            path.push({x:cx, y:cy});
            
            // Look for neighbor that brings us closer to existing water
            // or just random wander
            let moves = [[0,1],[0,-1],[1,0],[-1,0]];
            // Filter bounds
            moves = moves.filter(m => cx+m[0] > 0 && cx+m[0] < w-1 && cy+m[1] > 0 && cy+m[1] < h-1);
            
            // Check if any neighbor is existing water
            let waterNeig = moves.find(m => map[cy+m[1]][cx+m[0]].type === 'water');
            if (waterNeig) {
                flowParams.reachedWater = true;
                break;
            }

            // Move randomly but biased away from start (simulate flow)
            let move = moves[Math.floor(Math.random() * moves.length)];
            cx += move[0];
            cy += move[1];
        }

        if (path.length > (wg.rivers.minLength || 10) && flowParams.reachedWater) {
            path.forEach(p => map[p.y][p.x] = this.tile('water'));
            count++;
        }
    }
  },

  /* ── 3. Terrain Enrichment (Keep Existing) ────────────────── */
  _enrichTerrain(map, w, h, wg) {
    /* ... (Use existing code from your file here) ... */
    // For brevity, paste your existing _enrichTerrain function here
    // Just ensure it references `this` correctly.
    let tc = wg.terrain;
    if (!tc) return;
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

  /* ── 4. Cities (Keep Existing) ────────────────────────────── */
  _cities(map, w, h, wg) {
      /* ... (Paste your existing _cities code) ... */
      let c = [], b = wg.cityMinEdgeBuffer, minDist = wg.cityMinSpacing || 0, a = 0;
      while (c.length < wg.cityCount && a++ < 2000) {
        let x = Math.floor(Math.random() * (w - b * 2)) + b;
        let y = Math.floor(Math.random() * (h - b * 2)) + b;
        if (map[y][x].type === 'water') continue;
        let tooClose = false;
        for (let ex of c) {
          if (Math.abs(ex.x - x) + Math.abs(ex.y - y) < minDist) { tooClose = true; break; }
        }
        if (!tooClose) c.push({ x, y });
      }
      return c;
  },

  /* ── 5. Organic Roads (Upgraded) ──────────────────────────── */
  _path(map, p1, p2, rs) {
    let x = p1.x, y = p1.y;
    // Organic "Drunken Walk" towards target
    // Instead of forcing X then Y, we pick neighbors based on distance
    
    let maxIter = (Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y)) * 2;
    let i = 0;

    while ((x !== p2.x || y !== p2.y) && i++ < maxIter) {
        // Determine direction to target
        let dx = Math.sign(p2.x - x);
        let dy = Math.sign(p2.y - y);

        // 70% chance to move towards target, 30% random jitter (organic look)
        let moveX = 0, moveY = 0;
        if (Math.random() < 0.7) {
            // Move strictly closer
            if (dx !== 0 && (dy === 0 || Math.random() < 0.5)) moveX = dx;
            else moveY = dy;
        } else {
            // Jitter (move sideways or backwards slightly)
            if (Math.random() < 0.5) moveX = (Math.random() < 0.5 ? 1 : -1);
            else moveY = (Math.random() < 0.5 ? 1 : -1);
        }

        // Apply bounds check
        let nx = x + moveX, ny = y + moveY;
        if (nx < 0 || nx >= C.w || ny < 0 || ny >= C.h) continue;

        x = nx; y = ny;
        
        // Pave logic
        let tile = map[y][x];
        // If we hit water, build bridge
        let newType = tile.type === 'water' || tile.type === 'bridge' ? 'bridge' : 'road';
        // Don't overwrite buildings, only natural terrain
        if (['grass','forest','water','bridge','road'].includes(tile.type)) {
             map[y][x] = this.tile(newType);
             rs.add(`${x},${y}`);
        }
    }
  },

  /* ... Paste _branchRoads, _cityStreets, _hamlets, _zone, 
         _roadsidePOIs, _wildernessPOIs, and utilities 
         EXACTLY as they were in your original file below ... */
  
  _branchRoads(map, w, h, roads, wg) {
    let rb = wg.roadBranching;
    if (!rb || !rb.enabled) return;
    let existing = [...roads];
    for (let key of existing) {
      if (Math.random() > rb.chance) continue;
      let [rx, ry] = key.split(',').map(Number);
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
  _cityStreets(map, w, h, cities, roads, wg) {
    let cs = wg.cityStreets;
    if (!cs || !cs.enabled) return;
    let spacing = cs.spacing || 3;
    let reach = cs.reach || wg.citySuburbDist || 5;
    let jitter = cs.jitter || 0;
    for (let city of cities) {
      for (let dy = -reach; dy <= reach; dy++) {
        for (let dx = -reach; dx <= reach; dx++) {
          let x = city.x + dx, y = city.y + dy;
          if (x < 0 || x >= w || y < 0 || y >= h) continue;
          if (map[y][x].type === 'water') continue;
          let onGridX = (Math.abs(dx) % spacing === 0);
          let onGridY = (Math.abs(dy) % spacing === 0);
          if ((onGridX || onGridY) && Math.random() > jitter) {
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
  _hamlets(map, w, h, cities, roads, wg) {
    let hc = wg.hamlets;
    if (!hc || !hc.enabled) return [];
    let placed = [], attempts = 0;
    while (placed.length < (hc.count || 3) && attempts++ < 500) {
      let x = 3 + Math.floor(Math.random() * (w - 6));
      let y = 3 + Math.floor(Math.random() * (h - 6));
      if (map[y][x].type === 'water') continue;
      let dCity = cities.reduce((m, c) => Math.min(m, Math.abs(c.x - x) + Math.abs(c.y - y)), Infinity);
      if (dCity < (hc.minCityDist || 10)) continue;
      let dHam = placed.reduce((m, p) => Math.min(m, Math.abs(p.x - x) + Math.abs(p.y - y)), Infinity);
      if (dHam < (hc.minHamletDist || 8)) continue;
      let nearRoad = this._findNearestRoad(x, y, roads, 20);
      if (nearRoad) this._path(map, {x, y}, nearRoad, roads);
      map[y][x] = this.tile('road');
      roads.add(`${x},${y}`);
      for (let d = -1; d <= 1; d++) {
        if (x+d >= 0 && x+d < w) { map[y][x+d] = this.tile('road'); roads.add(`${x+d},${y}`); }
        if (y+d >= 0 && y+d < h) { map[y+d][x] = this.tile('road'); roads.add(`${x},${y+d}`); }
      }
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
  _zone(map, w, h, cities, roads, wg) {
    let needRoad = wg.buildingsNeedRoad !== false;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (map[y][x].type === 'water' || roads.has(`${x},${y}`)) continue;
        let cur = map[y][x].type;
        if (cur !== 'grass' && cur !== 'forest') continue;
        let d = cities.reduce((m, c) => Math.min(m, Math.abs(c.x - x) + Math.abs(c.y - y)), Infinity);
        let isCore = d <= wg.cityCoreDist;
        let isSuburb = d <= wg.citySuburbDist && Math.random() < wg.citySuburbChance;
        if (isCore || isSuburb) {
          if (needRoad && !this._adjacentToRoad(x, y, roads)) continue;
          let pool = isCore ? wg.coreDist : wg.suburbDist;
          map[y][x] = this.tile(this._wPick(pool));
        }
      }
  },
  _roadsidePOIs(map, w, h, cities, roads, wg) {
    let rp = wg.roadsidePOIs;
    if (!rp || !rp.enabled) return;
    let minCD = rp.minCityDist || 6;
    for (let key of roads) {
      if (Math.random() > rp.chance) continue;
      let [rx, ry] = key.split(',').map(Number);
      let dCity = cities.reduce((m, c) => Math.min(m, Math.abs(c.x - rx) + Math.abs(c.y - ry)), Infinity);
      if (dCity < minCD) continue;
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
  _wPick(pool) {
    let t = pool.reduce((s, e) => s + e.weight, 0), r = Math.random() * t;
    for (let e of pool) { r -= e.weight; if (r <= 0) return e.type; }
    return pool[pool.length - 1].type;
  },
  _adjacentToRoad(x, y, roads) {
    return roads.has(`${x-1},${y}`) || roads.has(`${x+1},${y}`) ||
           roads.has(`${x},${y-1}`) || roads.has(`${x},${y+1}`);
  },
  _findNearestRoad(x, y, roads, maxDist) {
    let best = null, bestD = maxDist + 1;
    for (let key of roads) {
      let [rx, ry] = key.split(',').map(Number);
      let d = Math.abs(rx - x) + Math.abs(ry - y);
      if (d < bestD) { bestD = d; best = { x: rx, y: ry }; }
    }
    return bestD <= maxDist ? best : null;
  },
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
    for (let i = spots.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [spots[i], spots[j]] = [spots[j], spots[i]];
    }
    return spots;
  }
};