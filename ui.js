/* ═══════════════════════════════════════════════════════════
   WASTELAND SURVIVOR — ui.js
   All rendering & DOM manipulation
   ═══════════════════════════════════════════════════════════ */

const UI = {
  _prev: null,

  /* ── Icon Helper ────────────────────────────────────────── */
  // Handles 'hybrid', 'ascii', 'emoji' and randomization
  getIcon(def, x, y) {
    if (!def) return '?';
    let v = def.visual;
    
    // Handle randomization (array of visuals)
    if (Array.isArray(v)) {
      if (C.visuals.randomize) {
        // Deterministic random based on coordinates
        let idx = Math.abs((x * 13 + y * 29) % v.length);
        v = v[idx];
      } else {
        v = v[0];
      }
    }

    // If mode is ASCII, we might want to fallback or map, 
    // but for now we assume config provides the correct chars for the mode,
    // or 'hybrid' just uses what is there.
    return v;
  },

  fullRender(g) {
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

  // ... (showIntro, renderStats remain unchanged) ...
  showIntro(onDone) {
    let scr = document.getElementById('introScr');
    if (!scr) { onDone(); return; }
    scr.classList.add('on');
    let txt = document.getElementById('introTxt');
    if (txt) txt.classList.add('fade-in');
    let btn = document.getElementById('introBtn');
    if (btn) {
      setTimeout(() => btn.classList.add('fade-in'), 3500);
      btn.onclick = () => {
        scr.classList.add('fade-out');
        setTimeout(() => { scr.classList.remove('on','fade-out'); onDone(); }, 1200);
      };
    }
  },
  renderStats(g) {
    const prev = this._prev || g.stats;
    const stat = (id, barId, v, pv, mx) => {
      let el = document.getElementById(id);
      if (!el) return;
      el.innerText = Math.floor(v);
      el.style.color = v < mx * 0.25 ? '#da3633' : '';
      let wrap = el.closest('.stat-g');
      if (wrap) {
        wrap.classList.remove('stat-down', 'stat-up');
        if (v < pv - 0.01) { void wrap.offsetWidth; wrap.classList.add('stat-down'); }
        else if (v > pv + 0.01) { void wrap.offsetWidth; wrap.classList.add('stat-up'); }
      }
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

    if (vis || known) {
      e.style.backgroundColor = def.bg;
      e.style.color = def.color;
      
      // Determine Character/Icon
      e.innerText = this.getIcon(def, x, y);
      
      if (!vis) e.classList.add('t-mem'); // Just dimness, no grey filter
      
      // Zombies
      let k = `${x},${y}`;
      if (vis && zm[k] && !(x === g.p.x && y === g.p.y)) {
        let z = zm[k];
        e.innerHTML = `<span class="zi">${C.enemies[z.type].icon}</span>`;
        e.classList.add('t-zomb');
      }
    } else {
      e.classList.add('t-fog');
    }
    
    if (x === g.p.x && y === g.p.y) {
      let ic = g.isEncumbered ? '😓' : '👤';
      e.innerHTML += `<span class="pi">${ic}</span>`;
    }
    return e;
  },

  _renderInterior(g) {
    let int = g.currentInterior;
    if (!int) return;
    const c = document.getElementById('mapC');
    if (!c) return;
    c.innerHTML = '';
    let ts = int.w > 8 ? 30 : int.w > 7 ? 34 : 40;
    document.documentElement.style.setProperty('--tile', ts + 'px');
    c.className = 'mg';
    c.style.gridTemplateColumns = `repeat(${int.w},1fr)`;
    
    let zm = {};
    for (let z of g.interiorZombies) zm[`${z.x},${z.y}`] = z;
    
    for (let y = 0; y < int.h; y++) {
      for (let x = 0; x < int.w; x++) {
        let cell = int.map[y][x], def = C.itiles[cell.type];
        let e = document.createElement('div');
        e.className = 'tl';
        e.style.backgroundColor = def.bg;
        e.style.color = def.color;
        
        e.innerText = this.getIcon(def, x, y);
        
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
      let bType = g.currentBuilding ? g.currentBuilding.buildingType : 'unknown';
      let name = (C.tiles[bType] && C.tiles[bType].buildName) ? C.tiles[bType].buildName : bType;
      let extra = g.currentBuilding && g.currentBuilding.floors.length > 1 ? ` — ${int.label}` : '';
      loc.innerText = 'INSIDE ' + name.toUpperCase() + extra;
    }
  },

  renderInspector(g) {
    let icon, name, desc, tags = '';
    
    if (g.location === 'interior') {
      let int = g.currentInterior, cell = int.map[g.p.y][g.p.x], def = C.itiles[cell.type];
      icon = this.getIcon(def, g.p.x, g.p.y);
      name = def.name || cell.type;
      desc = '';
      if (cell.barricadeHp > 0) desc = `Barricaded (${cell.barricadeHp} HP)`;
      else if (def.entry) desc = cell.type === 'ladder' ? 'Climb' : 'Exit';
      
      let adj = Interior.getAdjacentSearchable(int, g.p.x, g.p.y);
      if (adj.length > 0) tags += `<span class="tag tag-l">LOOT NEARBY</span>`;
      let cont = Interior.getAdjacentContainers(int, g.p.x, g.p.y);
      if (cont.length > 0) tags += `<span class="tag tag-crate">CONTAINER</span>`;
    } else {
      let cur = g.map[g.p.y][g.p.x], def = C.tiles[cur.type];
      icon = this.getIcon(def, g.p.x, g.p.y);
      name = def.name;
      desc = def.desc;
      if (cur.loot > 0) tags += `<span class="tag tag-l">LOOTABLE</span>`;
      let adjZ = g.getAdjacentZombies();
      if (adjZ.length > 0) tags += `<span class="tag tag-d">${adjZ.length} ZOMBIES</span>`;
    }
    
    document.getElementById('iIcon').innerText = icon;
    document.getElementById('iName').innerText = name;
    document.getElementById('iDesc').innerText = desc;
    document.getElementById('iTags').innerHTML = tags;
  },

  renderActions(g) {
    let el = document.getElementById('actList');
    if (!el) return;
    let html = '';

    if (g.location === 'interior') {
      let int = g.currentInterior;
      let adjIZ = g.getAdjacentInteriorZombies();
      
      for (let z of adjIZ) html += `<button class="btn btn-a btn-fight" onclick="G.attackZombie(${z.x},${z.y},true)">⚔️ ATTACK ${C.enemies[z.type].name}</button>`;

      let searchTargets = Interior.getAdjacentSearchable(int, g.p.x, g.p.y);
      if (searchTargets.length > 0) {
        let tName = C.itiles[searchTargets[0].cell.type].name || "Shelf";
        html += `<button class="btn btn-a" onclick="G.searchInterior()">🔍 SEARCH ${tName.toUpperCase()}</button>`;
      }
      
      let containers = Interior.getAdjacentContainers(int, g.p.x, g.p.y);
      if (containers.length > 0) {
        let cName = C.itiles[containers[0].cell.type].name || "Container";
        html += `<button class="btn btn-a btn-crate" onclick="G.setTab('crate')">📦 OPEN ${cName.toUpperCase()}</button>`;
      }

      let salv = Interior.getAdjacentSalvageable(int, g.p.x, g.p.y);
      if (salv.length > 0) html += `<button class="btn btn-a btn-salv" onclick="G.salvage()">🔨 SALVAGE FURNITURE</button>`;
      
      let barr = Interior.getAdjacentBarricadable(int, g.p.x, g.p.y);
      if (barr.length > 0 && g.skills.carpentry) html += `<button class="btn btn-a" onclick="G.barricade()">🪵 BARRICADE</button>`;

      let cell = int.map[g.p.y][g.p.x], def = C.itiles[cell.type];
      if (def.stair) html += `<button class="btn btn-a btn-stair" onclick="G.useStairs()">${def.stair==='up'?'▲ UP':'▼ DOWN'}</button>`;
      if (cell.type === 'floor' || cell.type === 'bfloor') html += this._interiorPlaceButtons(g);
      
      html += this._restButton(g);

      if (def.entry) {
         if (g.currentFloor === 0) html += `<button class="btn btn-a" onclick="G.exitBuilding()">🚪 EXIT</button>`;
         else html += `<button class="btn btn-s" disabled>Ground Floor to Exit</button>`;
      }
    } else {
      let adjZ = g.getAdjacentZombies();
      for (let z of adjZ) html += `<button class="btn btn-a btn-fight" onclick="G.attackZombie(${z.x},${z.y},false)">⚔️ ATTACK ${C.enemies[z.type].name}</button>`;
      
      html += `<button class="btn btn-a" onclick="G.scavenge()">🔍 SCAVENGE</button>`;
      let tile = g.map[g.p.y][g.p.x], td = C.tiles[tile.type];
      if (td.enter) html += `<button class="btn btn-a" onclick="G.enterBuilding()">🚪 ENTER ${td.buildName.toUpperCase()}</button>`;
      
      html += this._worldPlaceButtons(g);
      html += this._restButton(g);
    }
    
    let gItems = g.getGroundItems();
    if (gItems.length > 0) html += `<button class="btn btn-a btn-ground" onclick="G.setTab('ground')">📋 GROUND ITEMS (${gItems.length})</button>`;
    
    html += `<button class="btn btn-s" onclick="G.wait()">⏳ Wait</button>`;
    el.innerHTML = html;
  },

  _restButton(g) {
    let tier = g.getRestTier();
    if (!tier) return '';
    let r = C.restTiers[tier];
    return `<button class="btn btn-a btn-rest-${tier}" onclick="G.rest()">💤 REST (${r.label})</button>`;
  },

  _worldPlaceButtons(g) {
    let html = '';
    let tile = g.map[g.p.y][g.p.x], td = C.tiles[tile.type];
    let canPlace = td.placeable && !['bedroll','shelter','bunker_hatch'].includes(tile.type);
    let seen = new Set();
    for (let item of g.inv) {
      if (C.items[item.id].type === 'place' && !seen.has(item.id)) {
        seen.add(item.id);
        html += `<button class="btn btn-a btn-place" ${!canPlace?'disabled':''} onclick="G.placeStructure('${item.id}')">PLACE ${C.items[item.id].name.toUpperCase()}</button>`;
      }
    }
    return html;
  },
  _interiorPlaceButtons(g) {
    let html = '';
    let seen = new Set();
    for (let item of g.inv) {
      if (C.items[item.id].type === 'iplace' && !seen.has(item.id)) {
        seen.add(item.id);
        html += `<button class="btn btn-a btn-place" onclick="G.placeInterior('${item.id}')">PLACE ${C.items[item.id].name.toUpperCase()}</button>`;
      }
    }
    return html;
  },

  renderContainer(g) {
    let el = document.getElementById('crateList');
    if (!el) return;
    let containers = g.getAdjacentContainers();
    if (containers.length === 0) {
      el.innerHTML = '<div style="padding:15px;color:#555;text-align:center">No container nearby.</div>';
      return;
    }
    let cell = containers[0].cell;
    let storage = cell.storage || [];
    let name = C.itiles[cell.type].name || "Container";
    
    let h = `<div style="padding:6px 10px;font-weight:bold;font-size:11px;border-bottom:1px solid #222;color:#888">${name} Contents: ${storage.length}</div>`;
    
    if (g.inv.length > 0) {
      h += `<div class="sl">STORE ITEM</div>`;
      let seen = new Set();
      for (let item of g.inv) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          let d = C.items[item.id], total = g.countItem(item.id);
          h += `<div class="ii"><div style="flex:1"><div style="color:#aaa">${d.icon} ${d.name} <span class="bs">×${total}</span></div></div><div><button class="ib ib-p" onclick="G.storeInContainer('${item.uid}')">STORE</button></div></div>`;
        }
      }
    }
    if (storage.length > 0) {
      h += `<div class="sl">RETRIEVE ITEM</div>`;
      h += storage.map((si, idx) => {
        let d = C.items[si.id];
        return `<div class="ii"><div style="flex:1"><div style="color:#ccc">${d.icon} ${d.name} ${si.qty > 1 ? '×'+si.qty : ''}</div></div><div><button class="ib ib-u" onclick="G.retrieveFromContainer(${idx})">TAKE</button></div></div>`;
      }).join('');
    } else if (g.inv.length === 0) {
      h += '<div style="padding:10px;color:#555;text-align:center">Empty.</div>';
    }
    el.innerHTML = h;
  },
  
  renderInventory(g) {
    const el = document.getElementById('invList');
    if (!el) return;
    if (g.inv.length === 0) { el.innerHTML = `<div style="padding:15px;color:#555;text-align:center">Empty (Weight: ${g.weight}/${g.maxWeight})</div>`; return; }
    el.innerHTML = `<div class="inv-w ${g.isEncumbered?'w-h':''}">Weight: ${g.weight} / ${g.maxWeight} kg</div>` + g.inv.map(item => {
      let d = C.items[item.id], sb = item.qty>1 ? `<span class="bs">×${item.qty}</span>` : '';
      let b = '';
      if(d.type==='use'||d.type==='read') b+=`<button class="ib ib-u" onclick="G.useItem('${item.uid}')">USE</button>`;
      else if(d.type==='place'||d.type==='iplace') b+=`<button class="ib ib-p" onclick="G.placeStructure('${item.id}')">PLACE</button>`; // Note: simplified click handler, real one handles routing
      else if(d.type!=='mat') b+=`<button class="ib" onclick="G.equipItem('${item.uid}')">EQP</button>`;
      b+=`<button class="ib ib-d" onclick="G.dropItem('${item.uid}')">DROP</button>`;
      return `<div class="ii"><div style="flex:1;font-weight:bold;color:#ccc">${d.icon} ${d.name} ${sb}</div><div style="margin-left:8px;display:flex">${b}</div></div>`;
    }).join('');
  },

  renderCrafting(g) {
    let el = document.getElementById('craftList');
    if (!el) return;
    let cats = { survival: 'SURVIVAL', combat: 'COMBAT', building: 'BUILDING' };
    let h = '';
    for (let catKey in cats) {
      let recipes = Object.keys(C.recipes).filter(k => C.recipes[k].cat === catKey);
      if (recipes.length === 0) continue;
      h += `<div class="sl">${cats[catKey]}</div>`;
      h += recipes.map(k => {
        let r = C.recipes[k], hs = (!r.reqSkill || (g.skills[r.reqSkill[0]] && g.skills[r.reqSkill[0]].lvl >= r.reqSkill[1]));
        if (!hs) return `<button class="btn" disabled style="opacity:.3">${r.name} ???</button>`;
        let can = true, inputs = Object.entries(r.inputs).map(([m,q]) => {
          let has = g.countItem(m); if(has<q) can=false;
          return `<span style="color:${has>=q?'#666':'#da3633'}">${has}/${q} ${C.items[m].name}</span>`;
        });
        return `<button class="btn" style="${can?'':'color:#777'}" onclick="G.build('${k}')"><div><b>${C.items[r.result.id].icon} ${r.name}</b><div style="font-size:10px">${inputs.join(' ')}</div></div></button>`;
      }).join('');
    }
    el.innerHTML = h;
  },

  renderGround(g) {
    let el = document.getElementById('groundList');
    if (!el) return;
    let items = g.getGroundItems();
    if (items.length === 0) { el.innerHTML = '<div style="padding:15px;color:#555;text-align:center">Nothing here.</div>'; return; }
    el.innerHTML = items.map((gi, idx) => {
      let d = C.items[gi.id];
      return `<div class="ii"><div style="flex:1;font-weight:bold;color:#ccc">${d.icon} ${d.name} ${gi.qty>1?'×'+gi.qty:''}</div><div><button class="ib ib-u" onclick="G.pickupItem(${idx})">TAKE</button></div></div>`;
    }).join('');
  },
  
  renderChar(g) { /* ... same ... */
    document.getElementById('sVis').innerText = g.vision; document.getElementById('sAtk').innerText = g.attack;
    document.getElementById('sDef').innerText = g.defense; document.getElementById('sMov').innerText = g.moveCost; document.getElementById('sKills').innerText = g.kills;
    let h = `<div class="sl">SKILLS</div>`;
    for (let k in g.skills) h += `<div class="sr"><span>${C.skills[k].name}</span><span>Lvl ${g.skills[k].lvl}</span></div>`;
    h += `<div class="sl" style="margin-top:8px">EQUIPMENT</div>`;
    h += ['weapon', 'tool', 'body', 'feet', 'back'].map(sl => `<div class="eq"><span class="sln">${sl}</span><span style="flex:1">${g.equip[sl] ? C.items[g.equip[sl].id].name : '--'}</span>${g.equip[sl] ? `<button class="ib ib-d" onclick="G.unequip('${sl}')">✕</button>` : ''}</div>`).join('');
    document.getElementById('equipList').innerHTML = h;
  },
  
  renderMoodles(g) { /* ... same ... */ 
    let el = document.getElementById('moodles'), h = '';
    const s = g.stats;
    if (s.food < 15) h += `<div class="mo m-c">🍽️ Starving</div>`; else if (s.food < 40) h += `<div class="mo m-w">🍽️ Hungry</div>`;
    if (s.h2o < 15) h += `<div class="mo m-c">💧 Dehydrated</div>`; else if (s.h2o < 40) h += `<div class="mo m-w">💧 Thirsty</div>`;
    if (g.isEncumbered) h += `<div class="mo m-b">🏋️ Heavy</div>`;
    if (s.hp < 40) h += `<div class="mo m-c">💔 Critical</div>`;
    if (g.isNight && g.location === 'world') h += `<div class="mo m-w">🌙 Night</div>`;
    el.innerHTML = h;
  },
  renderNight(g) { document.getElementById('nightOv').classList.toggle('on', g.isNight && g.location === 'world'); },
  renderLog(g) { document.getElementById('gameLog').innerHTML = g.log.slice(0, 50).map(l => `<div class="le ${l.c}">${l.m}</div>`).join(''); },
  setTab(name) {
    document.querySelectorAll('.tc').forEach(e => e.classList.remove('on'));
    document.querySelectorAll('.tb').forEach(e => e.classList.remove('on'));
    document.getElementById('tab-' + name).classList.add('on');
    document.querySelector(`.tb[data-tab="${name}"]`).classList.add('on');
  },
  flashTab(n) { /* ... */ },
  showDeath(g) { document.getElementById('deathScr').classList.add('on'); },
  hideDeath() { document.getElementById('deathScr').classList.remove('on'); }
};