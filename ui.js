/* ═══════════════════════════════════════════════════════════
   WASTELAND SURVIVOR — ui.js
   All rendering & DOM manipulation
   ═══════════════════════════════════════════════════════════ */

const UI = {

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

  /* ── Header Stats ──────────────────────────────────────── */
  renderStats(g) {
    const s = (id, v, mx, barId) => {
      let e = document.getElementById(id);
      if (!e) return;
      e.innerText = Math.floor(v);
      e.style.color = v < mx * 0.25 ? '#da3633' : '';
      // Update micro-bar
      let bar = document.getElementById(barId);
      if (bar) {
        let pct = Math.max(0, Math.min(100, (v / mx) * 100));
        bar.style.width = pct + '%';
        bar.style.background = pct < 25 ? '#da3633' : pct < 50 ? '#d29922' : '';
      }
    };
    s('vHp', g.stats.hp, 100, 'barHp');
    s('vStm', g.stats.stm, 100, 'barStm');
    s('vH2o', g.stats.h2o, 100, 'barH2o');
    s('vFood', g.stats.food, 100, 'barFood');
    let d = document.getElementById('vDay');
    if (d) { d.innerText = `Day ${g.day}`; d.className = g.isNight ? 't-night' : 't-day'; }
    let t = document.getElementById('vTime');
    if (t) t.innerText = g.timeOfDay;
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
    // Build zombie lookup
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
      if ((td.type === 'house' || td.type === 'store') && td.interior && td.interior.claimed)
        e.classList.add('t-claimed');
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
    let ts = int.w > 7 ? 34 : 40;
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
    if (loc) loc.innerText = 'INSIDE';
  },

  /* ── Inspector ─────────────────────────────────────────── */
  renderInspector(g) {
    if (g.location === 'interior') {
      let int = g.currentInterior, cell = int.map[g.p.y][g.p.x], def = C.itiles[cell.type];
      document.getElementById('iIcon').innerText = def.ch;
      let name = cell.type.charAt(0).toUpperCase() + cell.type.slice(1);
      if (cell.type === 'door') name = 'Doorway';
      if (cell.type === 'window') name = 'Window';
      document.getElementById('iName').innerText = name;
      let desc = '';
      if (cell.barricadeHp > 0) desc = `Barricaded (${cell.barricadeHp} HP)`;
      else if (def.entry) desc = 'Entry/exit point';
      document.getElementById('iDesc').innerText = desc;
      let tags = '';
      let adj = Interior.getAdjacentSearchable(int, g.p.x, g.p.y);
      if (adj.length > 0) tags += `<span class="tag tag-l">SEARCHABLE</span>`;
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

    // Rest tier indicator
    let tier = g.getRestTier();
    if (tier === 'home') tags += `<span class="tag tag-in">SAFE REST</span>`;
    else if (tier === 'bedroll') tags += `<span class="tag tag-bed">BEDROLL</span>`;

    let adjZ = g.getAdjacentZombies();
    let nearZ = g.getNearbyZombieCount();
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
      let onEntry = C.itiles[int.map[g.p.y][g.p.x].type].entry;
      let adjIZ = g.getAdjacentInteriorZombies();

      // Combat buttons for adjacent interior zombies
      if (adjIZ.length > 0) {
        for (let z of adjIZ) {
          let ed = C.enemies[z.type];
          let dir = this._dirLabel(z.x - g.p.x, z.y - g.p.y);
          html += `<button class="btn btn-a btn-fight" onclick="G.attackZombie(${z.x},${z.y},true)">⚔️ ATTACK ${ed.name} (${dir}) — ${z.hp}/${z.maxHp} HP</button>`;
        }
      }
      if (adj.length > 0) html += `<button class="btn btn-a" onclick="G.searchInterior()">🔍 SEARCH SHELVES</button>`;
      if (barr.length > 0 && g.skills.carpentry) html += `<button class="btn btn-a" onclick="G.barricade()">🪵 BARRICADE OPENING</button>`;
      if (!int.claimed) html += `<button class="btn btn-a" onclick="G.claimBuilding()">🏠 CLAIM AS HOME</button>`;
      if (int.claimed) html += `<button class="btn btn-a btn-rest" onclick="G.rest()">💤 REST & HEAL <small class="rest-tag rest-home">Safe</small></button>`;
      if (onEntry) html += `<button class="btn btn-a" onclick="G.exitBuilding()">🚪 EXIT BUILDING</button>`;
      html += `<button class="btn btn-s" onclick="G.wait()">⏳ Wait</button>`;
    } else {
      let tile = g.map[g.p.y][g.p.x];
      let canEnter = (tile.type === 'house' || tile.type === 'store');
      let adjZ = g.getAdjacentZombies();
      let restTier = g.getRestTier();

      // Combat buttons for adjacent world zombies
      if (adjZ.length > 0) {
        for (let z of adjZ) {
          let ed = C.enemies[z.type];
          let dir = this._dirLabel(z.x - g.p.x, z.y - g.p.y);
          html += `<button class="btn btn-a btn-fight" onclick="G.attackZombie(${z.x},${z.y},false)">⚔️ ATTACK ${ed.name} (${dir}) — ${z.hp}/${z.maxHp} HP</button>`;
        }
      }
      html += `<button class="btn btn-a" onclick="G.scavenge()">🔍 SCAVENGE AREA</button>`;
      if (canEnter) html += `<button class="btn btn-a" onclick="G.enterBuilding()">🚪 ENTER BUILDING</button>`;

      // Bedroll placement / pickup
      if (g.canPlaceBedroll()) {
        html += `<button class="btn btn-a btn-camp" onclick="G.placeBedroll()">🛏️ LAY DOWN BEDROLL</button>`;
      }
      if (tile.type === 'bedroll') {
        html += `<button class="btn btn-a" onclick="G.pickupBedroll()">📦 PACK UP BEDROLL</button>`;
      }

      // Rest button with tier indicator
      if (restTier) {
        let tierLabel, tierClass;
        if (restTier === 'home') { tierLabel = 'Safe'; tierClass = 'rest-home'; }
        else if (restTier === 'bedroll') { tierLabel = 'Bedroll'; tierClass = 'rest-bed'; }
        else { tierLabel = 'Rough'; tierClass = 'rest-rough'; }
        html += `<button class="btn btn-a btn-rest" onclick="G.rest()">💤 REST <small class="rest-tag ${tierClass}">${tierLabel}</small></button>`;
      }

      html += `<button class="btn btn-s" onclick="G.wait()">⏳ Wait</button>`;
    }
    el.innerHTML = html;
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
      el.innerHTML = h + '<div class="inv-empty">Empty</div>';
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
      let typeTag = '';
      if (d.type === 'mat') typeTag = '<span class="item-type type-mat">MAT</span>';
      else if (d.type === 'use') typeTag = '<span class="item-type type-use">USE</span>';
      else if (d.type === 'read') typeTag = '<span class="item-type type-read">READ</span>';
      else if (d.type === 'place') typeTag = '<span class="item-type type-place">PLACE</span>';
      let b = '';
      if (d.type === 'use' || d.type === 'read')
        b += `<button class="ib ib-u" onclick="G.useItem('${item.uid}')">USE</button>`;
      else if (d.type === 'place')
        b += ''; // placed via actions tab
      else if (d.type !== 'mat')
        b += `<button class="ib" onclick="G.equipItem('${item.uid}')">EQP</button>`;
      b += `<button class="ib ib-d" onclick="G.dropItem('${item.uid}')">DROP</button>`;
      return `<div class="ii"><div style="flex:1;min-width:0"><div class="ii-name">${d.icon} ${d.name} ${sb} ${typeTag}</div>${db}</div><div class="ii-btns">${b}</div></div>`;
    }).join('');
    el.innerHTML = h;
  },

  /* ── Crafting ──────────────────────────────────────────── */
  renderCrafting(g) {
    let el = document.getElementById('craftList');
    if (!el) return;
    let h = `<div class="sl">RECIPES</div>`;
    h += Object.keys(C.recipes).map(k => {
      let r = C.recipes[k];
      if (r.result.type === 'barricade' && g.location !== 'interior') return '';
      let hs = true;
      if (r.reqSkill && !g.skills[r.reqSkill[0]]) hs = false;
      if (!hs) return `<button class="btn btn-craft" disabled style="opacity:.3"><span>${r.name} <small>(Unknown Skill)</small></span></button>`;
      let cc = true, mr = [];
      for (let m in r.inputs) {
        let req = r.inputs[m], has = g.countItem(m);
        if (has < req) cc = false;
        let cl = has >= req ? '#666' : '#da3633';
        mr.push(`<span style="color:${cl}">${has}/${req} ${C.items[m].name}</span>`);
      }
      // Show result info
      let resultInfo = '';
      if (r.result.type === 'item') {
        let rd = C.items[r.result.id];
        resultInfo = `→ ${rd.icon} ${rd.name}`;
      } else if (r.result.type === 'barricade') {
        resultInfo = '→ Boards up opening';
      }
      return `<button class="btn btn-craft" style="${cc ? '' : 'color:#777;border-color:#333'}" onclick="G.build('${k}')"><div style="width:100%"><div class="craft-name">${r.name} <span class="craft-result">${resultInfo}</span></div><div class="craft-mats">${mr.join(' · ')}</div></div></button>`;
    }).join('');
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
      return `<div class="eq"><span class="sln">${sl}</span><span style="flex:1">${it ? C.items[it.id].icon + ' ' + C.items[it.id].name + di : '<span style="color:#333">--</span>'}</span>${it ? `<button class="ib ib-d" onclick="G.unequip('${sl}')">✕</button>` : ''}</div>`;
    }).join('');

    // Camp status section
    h += `<div class="sl" style="margin-top:8px">CAMP STATUS</div>`;
    if (g.bedrollPos) {
      h += `<div class="sr"><span>🛏️ Bedroll</span><span style="color:#6e8844">${g.bedrollPos.x}, ${g.bedrollPos.y}</span></div>`;
    } else {
      h += `<div class="sr"><span>🛏️ Bedroll</span><span style="color:#333">Not placed</span></div>`;
    }
    h += `<div class="sr"><span>⛺ Base Camp</span><span style="color:#6e8844">Start</span></div>`;

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
    // Combat warning
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
    if (e) e.innerHTML = g.log.slice(0, 50).map((l, i) =>
      `<div class="le ${l.c}" style="animation-delay:${i === 0 ? '0s' : 'none'}">${l.m}</div>`
    ).join('');
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
