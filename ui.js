/* ═══════════════════════════════════════════════════════════
   WASTELAND SURVIVOR — ui.js
   All rendering & DOM manipulation
   ═══════════════════════════════════════════════════════════ */

const UI = {

  _prev: null, // previous stats for drain flash detection

  fullRender(g) {
    this.renderStats(g);
    this.renderMap(g);
    this.renderInspector(g);
    this.renderActions(g);
    this.renderInventory(g);
    this.renderCrafting(g);
    this.renderChar(g);
    this.renderMoodles(g);
    this.renderNight(g);
  },

  /* ── Header Stats with drain flash ─────────────────────── */
  renderStats(g) {
    const prev = this._prev || g.stats;
    const stat = (id, barId, v, pv, mx) => {
      let el = document.getElementById(id);
      if (!el) return;
      el.innerText = Math.floor(v);
      el.style.color = v < mx * 0.25 ? '#da3633' : '';
      // Flash on change
      let wrap = el.closest('.stat-g');
      if (wrap) {
        wrap.classList.remove('stat-down', 'stat-up');
        if (v < pv - 0.01) { void wrap.offsetWidth; wrap.classList.add('stat-down'); }
        else if (v > pv + 0.01) { void wrap.offsetWidth; wrap.classList.add('stat-up'); }
      }
      // Bar
      let bar = document.getElementById(barId);
      if (bar) bar.style.width = Math.max(0, Math.min(100, Math.floor(v))) + '%';
    };
    stat('vHp', 'bHp', g.stats.hp, prev.hp, 100);
    stat('vStm', 'bStm', g.stats.stm, prev.stm, 100);
    stat('vH2o', 'bH2o', g.stats.h2o, prev.h2o, 100);
    stat('vFood', 'bFood', g.stats.food, prev.food, 100);

    let d = document.getElementById('vDay');
    if (d) { d.innerText = `Day ${g.day}`; d.className = g.isNight ? 't-night' : 't-day'; }
    let t = document.getElementById('vTime');
    if (t) t.innerText = g.timeOfDay;

    // Store for next comparison
    this._prev = { hp: g.stats.hp, stm: g.stats.stm, h2o: g.stats.h2o, food: g.stats.food };
  },

  /* ── Map Rendering ─────────────────────────────────────── */
  renderMap(g) {
    if (g.location === 'interior') return this._renderInterior(g);
    const c = document.getElementById('mapC');
    if (!c) return;
    c.innerHTML = '';
    let rad = 4, size = rad * 2 + 1;
    document.documentElement.style.setProperty('--tile', '36px');
    c.className = 'mg';
    c.style.gridTemplateColumns = `repeat(${size},1fr)`;
    let zm = {};
    for (let z of g.zombies) zm[`${z.x},${z.y}`] = z;
    for (let y = g.p.y - rad; y <= g.p.y + rad; y++)
      for (let x = g.p.x - rad; x <= g.p.x + rad; x++)
        c.appendChild(this._wtile(g, x, y, zm));
    let loc = document.getElementById('locOv');
    if (loc) loc.innerText = `${g.p.x}, ${g.p.y}`;
  },

  _wtile(g, x, y, zm) {
    let e = document.createElement('div');
    e.className = 'tl';
    if (x < 0 || x >= C.w || y < 0 || y >= C.h) { e.style.background = '#000'; return e; }
    let td = g.map[y][x], def = C.tiles[td.type];
    let dist = Math.max(Math.abs(x - g.p.x), Math.abs(y - g.p.y));
    let known = g.visited.has(`${x},${y}`), vis = dist <= g.vision;
    if (vis) {
      e.classList.add(def.css);
      if (def.enter && td.interior && td.interior.claimed) e.classList.add('t-claimed');
      e.innerText = this._tch(td, x, y);
      if (td.loot <= 0 && def.cap > 0) e.classList.add('t-dep');
      let k = `${x},${y}`;
      if (zm[k] && !(x === g.p.x && y === g.p.y)) {
        let z = zm[k];
        e.innerHTML = `<span class="zi">${C.enemies[z.type].icon}</span>`;
        e.classList.add('t-zomb');
      }
    } else if (known) {
      e.classList.add(def.css, 't-mem');
      e.innerText = def.ch;
    } else {
      e.classList.add('t-fog');
    }
    if (x === g.p.x && y === g.p.y) {
      let ic = g.isEncumbered ? '😓' : '👤';
      e.innerHTML += `<span class="pi">${ic}</span>`;
    }
    return e;
  },

  _tch(td, x, y) {
    if (td.type === 'grass') return [',', '.', '`', '⁖'][(x + y) % 4];
    if (td.type === 'forest') return ['🌲', '🌳', '↟'][(x * y) % 3];
    return C.tiles[td.type].ch;
  },

  /* ── Interior Rendering ────────────────────────────────── */
  _renderInterior(g) {
    let int = g.currentInterior;
    if (!int) return;
    const c = document.getElementById('mapC');
    if (!c) return;
    c.innerHTML = '';
    let ts = int.w > 7 ? 34 : int.w > 8 ? 30 : 40;
    document.documentElement.style.setProperty('--tile', ts + 'px');
    c.className = 'mg';
    c.style.gridTemplateColumns = `repeat(${int.w},1fr)`;
    let zm = {};
    for (let z of g.interiorZombies) zm[`${z.x},${z.y}`] = z;
    for (let y = 0; y < int.h; y++) {
      for (let x = 0; x < int.w; x++) {
        let cell = int.map[y][x], def = C.itiles[cell.type];
        let e = document.createElement('div');
        e.className = 'tl ' + def.css;
        e.innerText = def.ch;
        if (cell.loot <= 0 && def.searchable) e.style.opacity = '.4';
        if (cell.barricadeHp > 0) e.innerHTML += `<div class="it-barr"></div>`;
        let k = `${x},${y}`;
        if (zm[k] && !(x === g.p.x && y === g.p.y)) {
          let z = zm[k];
          e.innerHTML = `<span class="zi">${C.enemies[z.type].icon}</span>`;
          e.classList.add('t-zomb');
        }
        if (x === g.p.x && y === g.p.y) e.innerHTML += `<span class="pi">👤</span>`;
        c.appendChild(e);
      }
    }
    let loc = document.getElementById('locOv');
    if (loc) {
      let btype = int.buildingType;
      let name = (C.tiles[btype] && C.tiles[btype].buildName) ? C.tiles[btype].buildName : btype;
      loc.innerText = 'INSIDE ' + name.toUpperCase();
    }
  },

  /* ── Inspector ─────────────────────────────────────────── */
  renderInspector(g) {
    if (g.location === 'interior') {
      let int = g.currentInterior, cell = int.map[g.p.y][g.p.x], def = C.itiles[cell.type];
      document.getElementById('iIcon').innerText = def.ch;
      let name = cell.type.charAt(0).toUpperCase() + cell.type.slice(1);
      if (cell.type === 'door' || cell.type === 'pdoor') name = 'Doorway';
      if (cell.type === 'window') name = 'Window';
      if (cell.type === 'ladder') name = 'Ladder';
      if (cell.type === 'pwall') name = 'Built Wall';
      document.getElementById('iName').innerText = name;
      let desc = '';
      if (cell.barricadeHp > 0) desc = `Barricaded (${cell.barricadeHp} HP)`;
      else if (def.entry) desc = cell.type === 'ladder' ? 'Climb to exit' : 'Entry/exit point';
      document.getElementById('iDesc').innerText = desc;
      let tags = '';
      let adj = Interior.getAdjacentSearchable(int, g.p.x, g.p.y);
      if (adj.length > 0) tags += `<span class="tag tag-l">LOOT NEARBY</span>`;
      let salv = Interior.getAdjacentSalvageable(int, g.p.x, g.p.y);
      if (salv.length > 0) tags += `<span class="tag tag-salv">SALVAGEABLE</span>`;
      let nz = g.interiorZombies.length;
      if (nz > 0) tags += `<span class="tag tag-d">${nz} INSIDE</span>`;
      if (int.claimed) tags += `<span class="tag tag-in">HOME</span>`;
      document.getElementById('iTags').innerHTML = tags;
      return;
    }
    let cur = g.map[g.p.y][g.p.x], def = C.tiles[cur.type];
    document.getElementById('iIcon').innerText = def.ch;
    document.getElementById('iName').innerText = def.name;
    document.getElementById('iDesc').innerText = def.desc;
    let tags = '';
    if (cur.loot > 0) tags += `<span class="tag tag-l">LOOT ×${cur.loot}</span>`;
    if (cur.type === 'bedroll') tags += `<span class="tag tag-camp">BEDROLL</span>`;
    if (cur.type === 'shelter') tags += `<span class="tag tag-camp">SHELTER</span>`;
    if (cur.type === 'camp') tags += `<span class="tag tag-camp">CAMP</span>`;
    let adjZ = g.getAdjacentZombies(), nearZ = g.getNearbyZombieCount();
    if (adjZ.length > 0) tags += `<span class="tag tag-d">⚔️ ${adjZ.length} ADJACENT</span>`;
    else if (nearZ > 0) tags += `<span class="tag tag-c">👁 ${nearZ} NEARBY</span>`;
    document.getElementById('iTags').innerHTML = tags;
  },

  /* ── Dynamic Actions ───────────────────────────────────── */
  renderActions(g) {
    let el = document.getElementById('actList');
    if (!el) return;
    let html = '';

    if (g.location === 'interior') {
      let int = g.currentInterior;
      let adj = Interior.getAdjacentSearchable(int, g.p.x, g.p.y);
      let barr = Interior.getAdjacentBarricadable(int, g.p.x, g.p.y);
      let salv = Interior.getAdjacentSalvageable(int, g.p.x, g.p.y);
      let cell = int.map[g.p.y][g.p.x];
      let onEntry = C.itiles[cell.type].entry;
      let onFloor = cell.type === 'floor';
      let adjIZ = g.getAdjacentInteriorZombies();

      // Combat
      for (let z of adjIZ) {
        let ed = C.enemies[z.type];
        let dir = this._dirLabel(z.x - g.p.x, z.y - g.p.y);
        html += `<button class="btn btn-a btn-fight" onclick="G.attackZombie(${z.x},${z.y},true)">⚔️ ATTACK ${ed.name} (${dir}) — ${z.hp}/${z.maxHp} HP</button>`;
      }
      if (adj.length > 0) html += `<button class="btn btn-a" onclick="G.searchInterior()">🔍 SEARCH SHELVES</button>`;
      if (salv.length > 0) html += `<button class="btn btn-a btn-salv" onclick="G.salvage()">🔨 SALVAGE FURNITURE</button>`;
      if (barr.length > 0 && g.skills.carpentry) html += `<button class="btn btn-a" onclick="G.barricade()">🪵 BARRICADE OPENING</button>`;

      // Interior placement buttons
      if (onFloor) html += this._interiorPlaceButtons(g);

      if (!int.claimed && int.buildingType !== 'bunker') html += `<button class="btn btn-a" onclick="G.claimBuilding()">🏠 CLAIM AS HOME</button>`;
      if (int.claimed) html += this._restButton(g);
      if (onEntry) {
        let exitLabel = cell.type === 'ladder' ? '🪜 CLIMB OUT' : '🚪 EXIT BUILDING';
        html += `<button class="btn btn-a" onclick="G.exitBuilding()">${exitLabel}</button>`;
      }
      html += `<button class="btn btn-s" onclick="G.wait()">⏳ Wait</button>`;
    } else {
      let tile = g.map[g.p.y][g.p.x], td = C.tiles[tile.type];
      let adjZ = g.getAdjacentZombies();

      for (let z of adjZ) {
        let ed = C.enemies[z.type];
        let dir = this._dirLabel(z.x - g.p.x, z.y - g.p.y);
        html += `<button class="btn btn-a btn-fight" onclick="G.attackZombie(${z.x},${z.y},false)">⚔️ ATTACK ${ed.name} (${dir}) — ${z.hp}/${z.maxHp} HP</button>`;
      }
      html += `<button class="btn btn-a" onclick="G.scavenge()">🔍 SCAVENGE AREA</button>`;
      if (td.enter) {
        let name = td.buildName || 'Building';
        html += `<button class="btn btn-a" onclick="G.enterBuilding()">🚪 ENTER ${name.toUpperCase()}</button>`;
      }

      // World placement
      html += this._worldPlaceButtons(g);

      // Rest (always available, quality varies)
      html += this._restButton(g);
      html += `<button class="btn btn-s" onclick="G.wait()">⏳ Wait</button>`;
    }
    el.innerHTML = html;
  },

  _restButton(g) {
    let tier = g.getRestTier();
    if (!tier) return '';
    let r = C.restTiers[tier];
    let quality = tier === 'rough' ? 1 : tier === 'bedroll' ? 2 : tier === 'shelter' ? 3 : tier === 'camp' ? 3 : 4;
    let dots = '';
    for (let i = 0; i < 4; i++) dots += `<span class="rest-dot ${i < quality ? 'rest-dot-on' : ''}"></span>`;
    let cost = `(${r.food}🍖 ${r.water}💧)`;
    return `<button class="btn btn-a btn-rest-${tier}" onclick="G.rest()">💤 REST — ${r.label} <span class="rest-qual">${dots}</span> <small class="rest-cost">${cost}</small></button>`;
  },

  _worldPlaceButtons(g) {
    let html = '';
    let tile = g.map[g.p.y][g.p.x], td = C.tiles[tile.type];
    let canPlace = td.placeable && !['bedroll','shelter','camp'].includes(tile.type);
    let seen = new Set();
    for (let item of g.inv) {
      let d = C.items[item.id];
      if (d.type === 'place' && !seen.has(item.id)) {
        seen.add(item.id);
        let dis = !canPlace;
        let note = dis ? (tile.type === 'bedroll' || tile.type === 'shelter' || tile.type === 'camp' ? ' (structure here)' : ' (bad terrain)') : '';
        html += `<button class="btn btn-a btn-place" ${dis ? 'disabled' : ''} onclick="G.placeStructure('${item.id}')">${d.icon} PLACE ${d.name.toUpperCase()}${note}</button>`;
      }
    }
    return html;
  },

  _interiorPlaceButtons(g) {
    let html = '';
    let seen = new Set();
    for (let item of g.inv) {
      let d = C.items[item.id];
      if (d.type === 'iplace' && !seen.has(item.id)) {
        seen.add(item.id);
        html += `<button class="btn btn-a btn-place" onclick="G.placeInterior('${item.id}')">${d.icon} PLACE ${d.name.toUpperCase()}</button>`;
      }
    }
    return html;
  },

  _dirLabel(dx, dy) {
    if (dy < 0) return '▲ North';
    if (dy > 0) return '▼ South';
    if (dx < 0) return '◄ West';
    if (dx > 0) return '► East';
    return 'Here';
  },

  /* ── Inventory ─────────────────────────────────────────── */
  renderInventory(g) {
    const el = document.getElementById('invList');
    if (!el) return;
    let h = `<div class="inv-w ${g.isEncumbered ? 'w-h' : ''}">Weight: ${g.weight} / ${g.maxWeight} kg</div>`;
    if (g.inv.length === 0) {
      el.innerHTML = h + '<div style="padding:15px;color:#555;text-align:center">Empty</div>';
      return;
    }
    h += g.inv.map(item => {
      let d = C.items[item.id];
      let sb = item.qty > 1 ? `<span class="bs">×${item.qty}</span>` : '';
      let db = '';
      if (item.maxHp) {
        let p = (item.hp / item.maxHp) * 100;
        let cl = p > 50 ? '#2ea043' : p > 20 ? '#d29922' : '#da3633';
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

  /* ── Crafting (categorized) ────────────────────────────── */
  renderCrafting(g) {
    let el = document.getElementById('craftList');
    if (!el) return;
    let cats = { survival: 'SURVIVAL', combat: 'COMBAT', building: 'BUILDING' };
    let h = '';
    let lastCraft = g._lastCraftKey || null;
    g._lastCraftKey = null; // consume

    for (let catKey in cats) {
      let recipes = Object.keys(C.recipes).filter(k => C.recipes[k].cat === catKey);
      if (recipes.length === 0) continue;
      h += `<div class="sl">${cats[catKey]}</div>`;
      h += recipes.map(k => {
        let r = C.recipes[k];
        let hs = true;
        if (r.reqSkill && !g.skills[r.reqSkill[0]]) hs = false;
        if (!hs) return `<button class="btn" disabled style="opacity:.3"><span>${r.name} <small>(Unknown Skill)</small></span></button>`;

        let ri = C.items[r.result.id];
        let cc = true, mr = [];
        for (let m in r.inputs) {
          let req = r.inputs[m], has = g.countItem(m);
          if (has < req) cc = false;
          let cl = has >= req ? '#666' : '#da3633';
          mr.push(`<span style="color:${cl}">${has}/${req} ${C.items[m].name}</span>`);
        }
        let flash = (lastCraft === k) ? ' craft-flash' : '';
        return `<button class="btn${flash}" style="${cc ? '' : 'color:#777;border-color:#333'}" onclick="G.build('${k}')"><div style="width:100%"><div style="font-weight:bold">${ri.icon} ${r.name}</div><div style="font-size:10px;margin-top:3px">${mr.join(' · ')}</div></div></button>`;
      }).join('');
    }
    el.innerHTML = h;
  },

  /* ── Character Panel ───────────────────────────────────── */
  renderChar(g) {
    document.getElementById('sVis').innerText = g.vision;
    document.getElementById('sAtk').innerText = g.attack;
    document.getElementById('sDef').innerText = g.defense;
    document.getElementById('sMov').innerText = g.moveCost;
    document.getElementById('sKills').innerText = g.kills;
    let h = `<div class="sl">SKILLS</div>`;
    for (let k in g.skills) {
      let sk = g.skills[k], p = Math.floor((sk.xp / (sk.lvl * 100)) * 100);
      h += `<div class="sr"><span>${C.skills[k].name}</span><span>Lvl ${sk.lvl} <small style="color:#555">${p}%</small></span></div>`;
    }
    h += `<div class="sl" style="margin-top:8px">EQUIPMENT</div>`;
    h += ['weapon', 'tool', 'body', 'feet', 'back'].map(sl => {
      let it = g.equip[sl], di = '';
      if (it && it.maxHp) {
        let p = Math.floor((it.hp / it.maxHp) * 100);
        let cl = p > 50 ? '#2ea043' : p > 20 ? '#d29922' : '#da3633';
        di = `<span style="color:${cl};font-size:10px;margin-left:4px">${p}%</span>`;
      }
      return `<div class="eq"><span class="sln">${sl}</span><span style="flex:1">${it ? C.items[it.id].icon + ' ' + C.items[it.id].name + di : '--'}</span>${it ? `<button class="ib ib-d" onclick="G.unequip('${sl}')">✕</button>` : ''}</div>`;
    }).join('');
    document.getElementById('equipList').innerHTML = h;
  },

  /* ── Moodles ───────────────────────────────────────────── */
  renderMoodles(g) {
    let el = document.getElementById('moodles');
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
    let adjCount = g.location === 'interior' ? g.getAdjacentInteriorZombies().length : g.getAdjacentZombies().length;
    if (adjCount > 0) h += `<div class="mo m-c">⚔️ DANGER!</div>`;
    el.innerHTML = h;
  },

  renderNight(g) {
    let e = document.getElementById('nightOv');
    if (e) e.classList.toggle('on', g.isNight && g.location === 'world');
  },

  renderLog(g) {
    let e = document.getElementById('gameLog');
    if (e) e.innerHTML = g.log.slice(0, 50).map(l => `<div class="le ${l.c}">${l.m}</div>`).join('');
  },

  /** Flash a tab briefly to indicate new content */
  flashTab(tabName) {
    let btn = document.querySelector(`.tb[data-tab="${tabName}"]`);
    if (!btn) return;
    btn.classList.remove('tab-flash');
    void btn.offsetWidth;
    btn.classList.add('tab-flash');
  },

  showDeath(g) {
    let e = document.getElementById('deathScr');
    if (!e) return;
    e.classList.add('on');
    document.getElementById('dDays').innerText = g.day;
    document.getElementById('dKills').innerText = g.kills;
    document.getElementById('dTurns').innerText = g.turn;
  },

  hideDeath() {
    let e = document.getElementById('deathScr');
    if (e) e.classList.remove('on');
  },
};
