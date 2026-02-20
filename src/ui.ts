/* ═══════════════════════════════════════════════════════════
   WASTELAND SURVIVOR — ui.ts
   All rendering & DOM manipulation
   ═══════════════════════════════════════════════════════════ */

import { C } from './config';
import { Interior } from './world';
import type { Game } from './game';
import type { WorldTileDef, InteriorTileDef, Zombie } from './types';

interface PrevStats {
  hp: number;
  stm: number;
  h2o: number;
  food: number;
}

interface TileDisplay {
  text?: string;
  img?: string;
}

export const UI = {

  _prev: null as PrevStats | null,

  fullRender(g: Game): void {
    this.renderStats(g);
    this.renderMap(g);
    this.renderInspector(g);
    this.renderActions(g);
    this.renderInventory(g);
    this.renderCrafting(g);
    this.renderGround(g);
    this.renderContainer(g);
    this.renderChar(g);
    this.renderMoodles(g);
    this.renderNight(g);
  },

  /* ── Intro Screen ──────────────────────────────────────── */
  showIntro(onDone: () => void): void {
    const scr = document.getElementById('introScr');
    if (!scr) { onDone(); return; }
    scr.classList.add('on');
    const txt = document.getElementById('introTxt');
    if (txt) txt.classList.add('fade-in');
    const btn = document.getElementById('introBtn');
    if (btn) {
      setTimeout(() => btn.classList.add('fade-in'), 3500);
      btn.onclick = () => {
        scr.classList.add('fade-out');
        setTimeout(() => { scr.classList.remove('on','fade-out'); onDone(); }, 1200);
      };
    }
  },

  /* ── Header Stats with drain flash ─────────────────────── */
  renderStats(g: Game): void {
    const prev = this._prev || g.stats;
    const stat = (id: string, barId: string, v: number, pv: number, mx: number) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.innerText = String(Math.floor(v));
      el.style.color = v < mx * 0.25 ? '#da3633' : '';
      const wrap = el.closest('.stat-g');
      if (wrap) {
        wrap.classList.remove('stat-down', 'stat-up');
        if (v < pv - 0.01) { void (wrap as HTMLElement).offsetWidth; wrap.classList.add('stat-down'); }
        else if (v > pv + 0.01) { void (wrap as HTMLElement).offsetWidth; wrap.classList.add('stat-up'); }
      }
      const bar = document.getElementById(barId);
      if (bar) bar.style.width = Math.max(0, Math.min(100, Math.floor(v))) + '%';
    };
    stat('vHp', 'bHp', g.stats.hp, prev.hp, 100);
    stat('vStm', 'bStm', g.stats.stm, prev.stm, 100);
    stat('vH2o', 'bH2o', g.stats.h2o, prev.h2o, 100);
    stat('vFood', 'bFood', g.stats.food, prev.food, 100);
    const d = document.getElementById('vDay');
    if (d) { d.innerText = `Day ${g.day}`; d.className = g.isNight ? 't-night' : 't-day'; }
    const t = document.getElementById('vTime');
    if (t) t.innerText = g.timeOfDay;
    this._prev = { hp: g.stats.hp, stm: g.stats.stm, h2o: g.stats.h2o, food: g.stats.food };
  },

  /* ── Map Rendering ──────────────────────────────────────── */
  renderMap(g: Game): void {
    if (g.location === 'interior') return this._renderInterior(g);
    const c = document.getElementById('mapC');
    if (!c) return;
    c.innerHTML = '';
    const rad = 4, size = rad * 2 + 1;
    document.documentElement.style.setProperty('--tile', '36px');
    c.className = 'mg';
    c.style.gridTemplateColumns = `repeat(${size},1fr)`;
    const zm: Record<string, Zombie> = {};
    for (const z of g.zombies) zm[`${z.x},${z.y}`] = z;
    for (let y = g.p.y - rad; y <= g.p.y + rad; y++)
      for (let x = g.p.x - rad; x <= g.p.x + rad; x++)
        c.appendChild(this._wtile(g, x, y, zm));
    const loc = document.getElementById('locOv');
    if (loc) loc.innerText = `${g.p.x}, ${g.p.y}`;
  },

  _tileHash(x: number, y: number): number {
    let h = x * 374761393 + y * 668265263;
    h = (h ^ (h >> 13)) * 1274126177;
    return (h ^ (h >> 16)) >>> 0;
  },

  _getIcon(def: WorldTileDef | InteriorTileDef, x?: number, y?: number): string {
    const hasCoords = (x !== undefined && y !== undefined);
    const isAscii = C.visuals && C.visuals.style === 'ascii';
    if (hasCoords && C.visuals && C.visuals.randomizeTerrain) {
      const variants = isAscii ? (def as any).txtV : (def as any).iconV;
      if (variants && variants.length > 0) {
        return variants[this._tileHash(x!, y!) % variants.length];
      }
    }
    if (isAscii && def.txt) return def.txt;
    return def.icon || def.txt;
  },

  _getTileDisplay(def: WorldTileDef | InteriorTileDef, x?: number, y?: number): TileDisplay {
    const hasCoords = (x !== undefined && y !== undefined);
    const isAscii = C.visuals && C.visuals.style === 'ascii';
    if (!isAscii) {
      if (hasCoords && C.visuals && C.visuals.randomizeTerrain && def.imgV && def.imgV.length > 0) {
        return { img: def.imgV[this._tileHash(x!, y!) % def.imgV.length] };
      }
      if (def.img) {
        return { img: def.img };
      }
    }
    return { text: this._getIcon(def, x, y) };
  },

  _applyTileDisplay(el: HTMLElement, display: TileDisplay): void {
    if (display.img) {
      el.classList.add('has-img');
      const img = document.createElement('img');
      img.className = 'tile-img';
      img.src = display.img;
      img.alt = '';
      img.draggable = false;
      img.onerror = function() { this.style.display = 'none'; };
      el.appendChild(img);
    } else {
      el.innerText = display.text || '';
    }
  },

  _groundOverlay(el: HTMLElement, g: Game, x: number, y: number, isInterior: boolean): void {
    let key: string;
    if (isInterior) {
      const wp = g.worldPos!;
      key = `i:${wp.x},${wp.y}:f${g.currentFloor}:${x},${y}`;
    } else {
      key = `w:${x},${y}`;
    }
    if (g.groundItems[key] && g.groundItems[key].length > 0) {
      const dot = document.createElement('div');
      dot.className = 'gi-ov';
      el.appendChild(dot);
    }
  },

  preloadImages(): void {
    const urls = new Set<string>();
    const collect = (def: any) => {
      if (def.img) urls.add(def.img);
      if (def.imgV) def.imgV.forEach((u: string) => urls.add(u));
    };
    for (const k in C.tiles) collect(C.tiles[k as keyof typeof C.tiles]);
    for (const k in C.itiles) collect(C.itiles[k as keyof typeof C.itiles]);
    for (const k in C.items) { if ((C.items as any)[k].img) urls.add((C.items as any)[k].img); }
    if (C.enemies) for (const k in C.enemies) { if ((C.enemies as any)[k].img) urls.add((C.enemies as any)[k].img); }
    urls.forEach(u => { const i = new Image(); i.src = u; });
  },

  _wtile(g: Game, x: number, y: number, zm: Record<string, Zombie>): HTMLElement {
    const e = document.createElement('div');
    e.className = 'tl';
    if (x < 0 || x >= C.w || y < 0 || y >= C.h) { e.style.background = '#000'; return e; }
    const td = g.map[y][x], def = C.tiles[td.type];
    const dist = Math.max(Math.abs(x - g.p.x), Math.abs(y - g.p.y));
    const known = g.visited.has(`${x},${y}`), vis = dist <= g.vision;

    if (vis) {
      e.classList.add(def.css);
      const display = this._getTileDisplay(def, x, y);
      this._applyTileDisplay(e, display);
      const k = `${x},${y}`;
      if (zm[k] && !(x === g.p.x && y === g.p.y)) {
        const z = zm[k];
        const zDef = C.enemies[z.type];
        let zIcon: string;
        if (!(C.visuals && C.visuals.style === 'ascii') && zDef.img) {
          zIcon = `<img class="tile-img" src="${zDef.img}" alt="" draggable="false" onerror="this.style.display='none'">`;
        } else {
          zIcon = (C.visuals && C.visuals.style === 'ascii' && zDef.txt) ? zDef.txt : zDef.icon;
        }
        e.innerHTML = `<span class="zi">${zIcon}</span>`;
        e.classList.add('t-zomb');
      }
      this._groundOverlay(e, g, x, y, false);
    } else if (known) {
      e.classList.add(def.css, 't-mem');
      const display = this._getTileDisplay(def, x, y);
      this._applyTileDisplay(e, display);
    } else {
      e.classList.add('t-fog');
    }
    if (x === g.p.x && y === g.p.y) {
      let ic = g.isEncumbered ? '😓' : '👤';
      if (C.visuals && C.visuals.style === 'ascii') ic = '@';
      e.innerHTML += `<span class="pi">${ic}</span>`;
    }
    return e;
  },

  /* ── Interior Rendering ────────────────────────────────── */
  _renderInterior(g: Game): void {
    const int = g.currentInterior;
    if (!int) return;
    const c = document.getElementById('mapC');
    if (!c) return;
    c.innerHTML = '';
    const ts = int.w > 8 ? 30 : int.w > 7 ? 34 : 40;
    document.documentElement.style.setProperty('--tile', ts + 'px');
    c.className = 'mg';
    c.style.gridTemplateColumns = `repeat(${int.w},1fr)`;
    const zm: Record<string, Zombie> = {};
    for (const z of g.interiorZombies) zm[`${z.x},${z.y}`] = z;
    for (let y = 0; y < int.h; y++) {
      for (let x = 0; x < int.w; x++) {
        const cell = int.map[y][x], def = C.itiles[cell.type];
        const e = document.createElement('div');
        e.className = 'tl ' + def.css;
        const display = this._getTileDisplay(def, x, y);
        this._applyTileDisplay(e, display);
        if (cell.barricadeHp > 0) e.innerHTML += `<div class="it-barr"></div>`;
        const k = `${x},${y}`;
        if (zm[k] && !(x === g.p.x && y === g.p.y)) {
          const z = zm[k];
          const zDef = C.enemies[z.type];
          let zIcon: string;
          if (!(C.visuals && C.visuals.style === 'ascii') && zDef.img) {
            zIcon = `<img class="tile-img" src="${zDef.img}" alt="" draggable="false" onerror="this.style.display='none'">`;
          } else {
            zIcon = (C.visuals && C.visuals.style === 'ascii' && zDef.txt) ? zDef.txt : zDef.icon;
          }
          e.innerHTML = `<span class="zi">${zIcon}</span>`;
          e.classList.add('t-zomb');
        }
        if (x === g.p.x && y === g.p.y) {
          let ic = '👤';
          if (C.visuals && C.visuals.style === 'ascii') ic = '@';
          e.innerHTML += `<span class="pi">${ic}</span>`;
        }
        this._groundOverlay(e, g, x, y, true);
        c.appendChild(e);
      }
    }
    const loc = document.getElementById('locOv');
    if (loc) {
      const bType = g.currentBuilding ? g.currentBuilding.buildingType : 'unknown';
      const name = (C.tiles[bType as keyof typeof C.tiles] && C.tiles[bType as keyof typeof C.tiles].buildName) ? C.tiles[bType as keyof typeof C.tiles].buildName! : bType;
      const floorLabel = int.label || 'Ground Floor';
      const floorCount = g.currentBuilding ? g.currentBuilding.floors.length : 1;
      const extra = floorCount > 1 ? ` — ${floorLabel}` : '';
      loc.innerText = 'INSIDE ' + name.toUpperCase() + extra;
    }
  },

  /* ── Inspector ──────────────────────────────────────────── */
  renderInspector(g: Game): void {
    if (g.location === 'interior') {
      const int = g.currentInterior!, cell = int.map[g.p.y][g.p.x], def = C.itiles[cell.type];
      document.getElementById('iIcon')!.innerText = this._getIcon(def);
      let name = cell.type.charAt(0).toUpperCase() + cell.type.slice(1);
      if (def.container) name += ' (Container)';
      if (cell.type === 'door' || cell.type === 'pdoor') name = 'Doorway';
      if (cell.type === 'window') name = 'Window';
      if (cell.type === 'stairs_up') name = 'Stairs Up';
      if (cell.type === 'stairs_down') name = 'Stairs Down';
      document.getElementById('iName')!.innerText = name;
      let desc = '';
      if (cell.barricadeHp > 0) desc = `Barricaded (${cell.barricadeHp} HP)`;
      else if (def.entry) desc = cell.type === 'ladder' ? 'Climb to exit' : 'Entry/exit point';
      else if (def.stair) desc = def.stair === 'up' ? 'Go to the floor above' : 'Go to the floor below';
      else if (def.container) desc = "Can store items inside.";
      document.getElementById('iDesc')!.innerText = desc;
      let tags = '';
      const adj = Interior.getAdjacentSearchable(int, g.p.x, g.p.y);
      if (adj.length > 0) tags += `<span class="tag tag-l">LOOT NEARBY</span>`;
      const containers = g.getAdjacentContainers();
      if (containers.length > 0) tags += `<span class="tag tag-crate">STORAGE</span>`;
      const salv = Interior.getAdjacentSalvageable(int, g.p.x, g.p.y);
      if (salv.length > 0) tags += `<span class="tag tag-salv">SALVAGEABLE</span>`;
      const nz = g.interiorZombies.length;
      if (nz > 0) tags += `<span class="tag tag-d">${nz} INSIDE</span>`;
      if (g.currentBuilding && g.currentBuilding.floors.length > 1)
        tags += `<span class="tag tag-floor">F${g.currentFloor + 1}/${g.currentBuilding.floors.length}</span>`;
      document.getElementById('iTags')!.innerHTML = tags;
      return;
    }
    const cur = g.map[g.p.y][g.p.x], def = C.tiles[cur.type];
    document.getElementById('iIcon')!.innerText = this._getIcon(def);
    document.getElementById('iName')!.innerText = def.name;
    document.getElementById('iDesc')!.innerText = def.desc;
    let tags = '';
    if (cur.loot > 0) tags += `<span class="tag tag-l">LOOT ×${cur.loot}</span>`;
    if (cur.type === 'bedroll') tags += `<span class="tag tag-camp">BEDROLL</span>`;
    if (cur.type === 'shelter') tags += `<span class="tag tag-camp">SHELTER</span>`;
    if (cur.type === 'bunker_hatch') tags += `<span class="tag tag-camp">BUNKER</span>`;
    const adjZ = g.getAdjacentZombies(), nearZ = g.getNearbyZombieCount();
    if (adjZ.length > 0) tags += `<span class="tag tag-d">⚔️ ${adjZ.length} ADJACENT</span>`;
    else if (nearZ > 0) tags += `<span class="tag tag-c">👁 ${nearZ} NEARBY</span>`;
    document.getElementById('iTags')!.innerHTML = tags;
  },

  /* ── Dynamic Actions ────────────────────────────────────── */
  renderActions(g: Game): void {
    const el = document.getElementById('actList');
    if (!el) return;
    let html = '';
    if (g.location === 'interior') {
      const int = g.currentInterior!;
      const adj = Interior.getAdjacentSearchable(int, g.p.x, g.p.y);
      const barr = Interior.getAdjacentBarricadable(int, g.p.x, g.p.y);
      const salv = Interior.getAdjacentSalvageable(int, g.p.x, g.p.y);
      const cell = int.map[g.p.y][g.p.x];
      const cellDef = C.itiles[cell.type];
      const onEntry = cellDef.entry;
      const onFloor = (cell.type === 'floor' || cell.type === 'bfloor');
      const onStairs = cellDef.stair;
      const adjIZ = g.getAdjacentInteriorZombies();
      for (const z of adjIZ) {
        const ed = C.enemies[z.type];
        const dir = this._dirLabel(z.x - g.p.x, z.y - g.p.y);
        html += `<button class="btn btn-a btn-fight" onclick="G.attackZombie(${z.x},${z.y},true)">⚔️ ATTACK ${ed.name} (${dir}) — ${z.hp}/${z.maxHp} HP</button>`;
      }
      if (adj.length > 0) html += `<button class="btn btn-a" onclick="G.searchInterior()">🔍 SEARCH SURROUNDINGS</button>`;
      if (salv.length > 0) html += `<button class="btn btn-a btn-salv" onclick="G.salvage()">🔨 SALVAGE FURNITURE</button>`;
      if (barr.length > 0 && g.skills.carpentry) html += `<button class="btn btn-a" onclick="G.barricade()">🪵 BARRICADE OPENING</button>`;
      if (onFloor) html += this._interiorPlaceButtons(g);
      if (onStairs) {
        const stLabel = cellDef.stair === 'down' ? '▼ GO DOWNSTAIRS' : '▲ GO UPSTAIRS';
        html += `<button class="btn btn-a btn-stair" onclick="G.useStairs()">${stLabel}</button>`;
      }
      html += this._restButton(g);
      const gItems = g.getGroundItems();
      if (gItems.length > 0) html += `<button class="btn btn-a btn-ground" onclick="G.setTab('ground')">📋 ${gItems.length} ITEM${gItems.length > 1 ? 'S' : ''} ON GROUND</button>`;
      const containers = g.getAdjacentContainers();
      if (containers.length > 0) {
        let label = "CONTAINER";
        if (containers.length === 1) {
          if (containers[0].cell.type === 'shelf') label = "SHELF";
          else if (containers[0].cell.type === 'locker') label = "LOCKER";
          else if (containers[0].cell.type === 'crate') label = "CRATE";
          else if (containers[0].cell.type === 'counter') label = "COUNTER";
        }
        html += `<button class="btn btn-a btn-crate" onclick="G.setTab('crate')">📦 OPEN ${label}</button>`;
      }
      if (onEntry) {
        const exitLabel = cell.type === 'ladder' ? '🪜 CLIMB OUT' : '🚪 EXIT BUILDING';
        if (g.currentFloor !== 0)
          html += `<button class="btn btn-s" disabled>Return to ground floor to exit</button>`;
        else
          html += `<button class="btn btn-a" onclick="G.exitBuilding()">${exitLabel}</button>`;
      }
      html += `<button class="btn btn-s" onclick="G.wait()">⏳ Wait</button>`;
    } else {
      const tile = g.map[g.p.y][g.p.x], td = C.tiles[tile.type];
      const adjZ = g.getAdjacentZombies();
      for (const z of adjZ) {
        const ed = C.enemies[z.type];
        const dir = this._dirLabel(z.x - g.p.x, z.y - g.p.y);
        html += `<button class="btn btn-a btn-fight" onclick="G.attackZombie(${z.x},${z.y},false)">⚔️ ATTACK ${ed.name} (${dir}) — ${z.hp}/${z.maxHp} HP</button>`;
      }
      html += `<button class="btn btn-a" onclick="G.scavenge()">🔍 SCAVENGE AREA</button>`;
      if (td.enter) {
        const name = td.buildName || 'Building';
        const icon = tile.type === 'bunker_hatch' ? '🪜' : '🚪';
        html += `<button class="btn btn-a" onclick="G.enterBuilding()">${icon} ENTER ${name.toUpperCase()}</button>`;
      }
      html += this._worldPlaceButtons(g);
      const gItems = g.getGroundItems();
      if (gItems.length > 0) html += `<button class="btn btn-a btn-ground" onclick="G.setTab('ground')">📋 ${gItems.length} ITEM${gItems.length > 1 ? 'S' : ''} ON GROUND</button>`;
      html += this._restButton(g);
      html += `<button class="btn btn-s" onclick="G.wait()">⏳ Wait</button>`;
    }
    el.innerHTML = html;
  },

  _restButton(g: Game): string {
    const tier = g.getRestTier();
    if (!tier) return '';
    const r = C.restTiers[tier];
    const quality = tier === 'rough' ? 1 : tier === 'bedroll' ? 2 : tier === 'shelter' ? 3 : tier === 'indoor' ? 3 : 4;
    let dots = '';
    for (let i = 0; i < 4; i++) dots += `<span class="rest-dot ${i < quality ? 'rest-dot-on' : ''}"></span>`;
    const cost = `(${r.food}🍖 ${r.water}💧)`;
    return `<button class="btn btn-a btn-rest-${tier}" onclick="G.rest()">💤 REST — ${r.label} <span class="rest-qual">${dots}</span> <small class="rest-cost">${cost}</small></button>`;
  },

  _worldPlaceButtons(g: Game): string {
    let html = '';
    const tile = g.map[g.p.y][g.p.x], td = C.tiles[tile.type];
    const canPlace = td.placeable && !['bedroll','shelter','bunker_hatch'].includes(tile.type);
    const seen = new Set<string>();
    for (const item of g.inv) {
      const d = C.items[item.id];
      if (d.type === 'place' && !seen.has(item.id)) {
        seen.add(item.id);
        const dis = !canPlace;
        const note = dis ? ' (bad spot)' : '';
        html += `<button class="btn btn-a btn-place" ${dis ? 'disabled' : ''} onclick="G.placeStructure('${item.id}')">${d.icon} PLACE ${d.name.toUpperCase()}${note}</button>`;
      }
    }
    return html;
  },

  _interiorPlaceButtons(g: Game): string {
    let html = '';
    const seen = new Set<string>();
    for (const item of g.inv) {
      const d = C.items[item.id];
      if (d.type === 'iplace' && !seen.has(item.id)) {
        seen.add(item.id);
        html += `<button class="btn btn-a btn-place" onclick="G.placeInterior('${item.id}')">${d.icon} PLACE ${d.name.toUpperCase()}</button>`;
      }
    }
    return html;
  },

  _dirLabel(dx: number, dy: number): string {
    if (dy < 0) return '▲ North';
    if (dy > 0) return '▼ South';
    if (dx < 0) return '◄ West';
    if (dx > 0) return '► East';
    return 'Here';
  },

  /* ── Inventory ──────────────────────────────────────────── */
  renderInventory(g: Game): void {
    const el = document.getElementById('invList');
    if (!el) return;
    let h = `<div class="inv-w ${g.isEncumbered ? 'w-h' : ''}">Weight: ${g.weight} / ${g.maxWeight} kg</div>`;
    if (g.inv.length === 0) {
      el.innerHTML = h + '<div style="padding:15px;color:#555;text-align:center">Empty</div>';
      return;
    }
    h += g.inv.map(item => {
      const d = C.items[item.id];
      const sb = item.qty > 1 ? `<span class="bs">×${item.qty}</span>` : '';
      let db = '';
      if (item.maxHp) {
        const p = (item.hp! / item.maxHp) * 100;
        const cl = p > 50 ? '#2ea043' : p > 20 ? '#d29922' : '#da3633';
        db = `<div class="dt"><div class="df" style="width:${p}%;background:${cl}"></div></div>`;
      }
      let b = '';
      if (d.type === 'use' || d.type === 'read')
        b += `<button class="ib ib-u" onclick="G.useItem('${item.uid}')">USE</button>`;
      else if (d.type === 'place')
        b += `<button class="ib ib-p" onclick="G.placeStructure('${item.id}')">PLACE</button>`;
      else if (d.type === 'iplace')
        b += `<button class="ib ib-p" onclick="G.placeInterior('${item.id}')">PLACE</button>`;
      else if (d.type !== 'mat')
        b += `<button class="ib" onclick="G.equipItem('${item.uid}')">EQP</button>`;
      b += `<button class="ib ib-d" onclick="G.dropItem('${item.uid}')">DROP</button>`;
      return `<div class="ii"><div style="flex:1;min-width:0"><div style="font-weight:bold;color:#ccc">${d.icon} ${d.name} ${sb}</div>${db}</div><div style="margin-left:8px;display:flex">${b}</div></div>`;
    }).join('');
    el.innerHTML = h;
  },

  /* ── Crafting (categorized) ─────────────────────────────── */
  renderCrafting(g: Game): void {
    const el = document.getElementById('craftList');
    if (!el) return;
    const cats: Record<string, string> = { survival: 'SURVIVAL', combat: 'COMBAT', building: 'BUILDING' };
    let h = '';
    const lastCraft = g._lastCraftKey || null;
    g._lastCraftKey = null;
    for (const catKey in cats) {
      const recipes = Object.keys(C.recipes).filter(k => C.recipes[k as keyof typeof C.recipes].cat === catKey);
      if (recipes.length === 0) continue;
      h += `<div class="sl">${cats[catKey]}</div>`;
      h += recipes.map(k => {
        const r = C.recipes[k as keyof typeof C.recipes];
        let hs = true;
        if (r.reqSkill && !g.skills[r.reqSkill[0]]) hs = false;
        if (!hs) return `<button class="btn" disabled style="opacity:.3"><span>${r.name} <small>(Unknown Skill)</small></span></button>`;
        const ri = C.items[r.result.id];
        let cc = true;
        const mr: string[] = [];
        for (const m in r.inputs) {
          const mid = m as keyof typeof C.items;
          const req = (r.inputs as any)[m], has = g.countItem(mid);
          if (has < req) cc = false;
          const cl = has >= req ? '#666' : '#da3633';
          mr.push(`<span style="color:${cl}">${has}/${req} ${C.items[mid].name}</span>`);
        }
        const flash = (lastCraft === k) ? ' craft-flash' : '';
        return `<button class="btn${flash}" style="${cc ? '' : 'color:#777;border-color:#333'}" onclick="G.build('${k}')"><div style="width:100%"><div style="font-weight:bold">${ri.icon} ${r.name}</div><div style="font-size:10px;margin-top:3px">${mr.join(' · ')}</div></div></button>`;
      }).join('');
    }
    el.innerHTML = h;
  },

  /* ── Ground Items ───────────────────────────────────────── */
  renderGround(g: Game): void {
    const el = document.getElementById('groundList');
    if (!el) return;
    const items = g.getGroundItems();
    if (items.length === 0) {
      el.innerHTML = '<div style="padding:15px;color:#555;text-align:center">Nothing on the ground here.</div>';
      return;
    }
    let h = `<div style="padding:6px 10px;font-weight:bold;font-size:11px;border-bottom:1px solid #222;color:#888">Items on ground: ${items.length}</div>`;
    h += items.map((gi, idx) => {
      const d = C.items[gi.id];
      const qStr = gi.qty > 1 ? ` <span class="bs">×${gi.qty}</span>` : '';
      return `<div class="ii"><div style="flex:1"><div style="font-weight:bold;color:#ccc">${d.icon} ${d.name}${qStr}</div></div><div><button class="ib ib-u" onclick="G.pickupItem(${idx})">TAKE</button></div></div>`;
    }).join('');
    el.innerHTML = h;
  },

  /* ── Container Panel ────────────────────────────────────── */
  renderContainer(g: Game): void {
    const el = document.getElementById('crateList');
    if (!el) return;
    const containers = g.getAdjacentContainers();
    if (containers.length === 0) {
      el.innerHTML = '<div style="padding:15px;color:#555;text-align:center">No storage container nearby.</div>';
      return;
    }
    const storage = containers[0].cell.storage || [];
    const name = containers[0].cell.type.toUpperCase();
    let h = `<div style="padding:6px 10px;font-weight:bold;font-size:11px;border-bottom:1px solid #222;color:#888">${name} CONTENTS: ${storage.length}</div>`;
    if (g.inv.length > 0) {
      h += `<div class="sl">STORE FROM INVENTORY</div>`;
      const seen = new Set<string>();
      for (const item of g.inv) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        const d = C.items[item.id];
        const total = g.countItem(item.id);
        h += `<div class="ii"><div style="flex:1"><div style="color:#aaa">${d.icon} ${d.name} <span class="bs">×${total}</span></div></div><div><button class="ib ib-p" onclick="G.storeInContainer('${item.uid}')">STORE</button></div></div>`;
      }
    }
    if (storage.length > 0) {
      h += `<div class="sl">RETRIEVE FROM ${name}</div>`;
      h += storage.map((si, idx) => {
        const d = C.items[si.id];
        const qStr = si.qty > 1 ? ` <span class="bs">×${si.qty}</span>` : '';
        return `<div class="ii"><div style="flex:1"><div style="color:#ccc">${d.icon} ${d.name}${qStr}</div></div><div><button class="ib ib-u" onclick="G.retrieveFromContainer(${idx})">TAKE</button></div></div>`;
      }).join('');
    } else if (g.inv.length === 0) {
      h += '<div style="padding:10px;color:#555;text-align:center">Container is empty.</div>';
    }
    el.innerHTML = h;
  },

  renderChar(g: Game): void {
    document.getElementById('sVis')!.innerText = String(g.vision);
    document.getElementById('sAtk')!.innerText = String(g.attack);
    document.getElementById('sDef')!.innerText = String(g.defense);
    document.getElementById('sMov')!.innerText = String(g.moveCost);
    document.getElementById('sKills')!.innerText = String(g.kills);
    let h = `<div class="sl">SKILLS</div>`;
    for (const k in g.skills) {
      const sk = g.skills[k as keyof typeof g.skills]!;
      const p = Math.floor((sk.xp / (sk.lvl * 100)) * 100);
      h += `<div class="sr"><span>${C.skills[k as keyof typeof C.skills].name}</span><span>Lvl ${sk.lvl} <small style="color:#555">${p}%</small></span></div>`;
    }
    h += `<div class="sl" style="margin-top:8px">EQUIPMENT</div>`;
    h += (['weapon', 'tool', 'body', 'feet', 'back'] as const).map(sl => {
      const it = g.equip[sl];
      let di = '';
      if (it && it.maxHp) {
        const p = Math.floor((it.hp! / it.maxHp) * 100);
        const cl = p > 50 ? '#2ea043' : p > 20 ? '#d29922' : '#da3633';
        di = `<span style="color:${cl};font-size:10px;margin-left:4px">${p}%</span>`;
      }
      return `<div class="eq"><span class="sln">${sl}</span><span style="flex:1">${it ? C.items[it.id].icon + ' ' + C.items[it.id].name + di : '--'}</span>${it ? `<button class="ib ib-d" onclick="G.unequip('${sl}')">✕</button>` : ''}</div>`;
    }).join('');
    document.getElementById('equipList')!.innerHTML = h;
  },

  /* ── Moodles ────────────────────────────────────────────── */
  renderMoodles(g: Game): void {
    const el = document.getElementById('moodles');
    if (!el) return;
    let h = '';
    const s = g.stats;
    if (s.food < 15)      h += `<div class="mo m-c">🍽️ Starving!</div>`;
    else if (s.food < 30) h += `<div class="mo m-b">🍽️ V.Hungry</div>`;
    else if (s.food < 50) h += `<div class="mo m-w">🍽️ Hungry</div>`;
    if (s.h2o < 15)       h += `<div class="mo m-c">💧 Dehydrated!</div>`;
    else if (s.h2o < 30)  h += `<div class="mo m-b">💧 V.Thirsty</div>`;
    else if (s.h2o < 50)  h += `<div class="mo m-w">💧 Thirsty</div>`;
    if (g.isEncumbered)   h += `<div class="mo m-b">🏋️ Heavy</div>`;
    if (s.hp < 30)        h += `<div class="mo m-c">💔 Critical</div>`;
    else if (s.hp < 60)   h += `<div class="mo m-w">🩸 Wounded</div>`;
    if (s.stm < 15)       h += `<div class="mo m-b">😫 Exhausted</div>`;
    if (g.isNight && g.location === 'world') h += `<div class="mo m-w">🌙 Night</div>`;
    const adjCount = g.location === 'interior' ? g.getAdjacentInteriorZombies().length : g.getAdjacentZombies().length;
    if (adjCount > 0) h += `<div class="mo m-c">⚔️ DANGER!</div>`;
    el.innerHTML = h;
  },

  renderNight(g: Game): void {
    const e = document.getElementById('nightOv');
    if (e) e.classList.toggle('on', g.isNight && g.location === 'world');
  },

  renderLog(g: Game): void {
    const e = document.getElementById('gameLog');
    if (e) e.innerHTML = g.log.slice(0, 50).map(l => `<div class="le ${l.c}">${l.m}</div>`).join('');
  },

  flashTab(tabName: string): void {
    const btn = document.querySelector(`.tb[data-tab="${tabName}"]`) as HTMLElement | null;
    if (!btn) return;
    btn.classList.remove('tab-flash');
    void btn.offsetWidth;
    btn.classList.add('tab-flash');
  },

  showDeath(g: Game): void {
    const e = document.getElementById('deathScr');
    if (!e) return;
    e.classList.add('on');
    document.getElementById('dDays')!.innerText = String(g.day);
    document.getElementById('dKills')!.innerText = String(g.kills);
    document.getElementById('dTurns')!.innerText = String(g.turn);
  },

  hideDeath(): void {
    const e = document.getElementById('deathScr');
    if (e) e.classList.remove('on');
  },
};
