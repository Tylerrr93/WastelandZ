/* ═══════════════════════════════════════════════════════════
   WASTELAND SURVIVOR — game.js
   Game engine, player actions, combat, zombies
   ═══════════════════════════════════════════════════════════ */

let G; 

class Game {
  constructor(skipIntro) {
    this.map = World.create();
    this.log = [];
    this.inv = [];
    this.equip = { weapon: null, tool: null, body: null, feet: null, back: null };
    this.stats = { ...C.player };
    this.prevStats = { ...C.player };
    this.skills = {};
    this.visited = new Set();
    this.alive = true;
    this.turn = 0;
    this.kills = 0;
    this.zombies = [];
    this._lastNight = -1;
    this.groundItems = {}; 

    this.location = 'world';
    this.worldPos = null;
    this.currentBuilding = null;
    this.currentFloor = 0;
    this.currentInterior = null;
    this.currentBuildingTile = null;
    this.interiorZombies = [];

    for (let k in C.skills) {
      if (C.skills[k].start) this.skills[k] = { lvl: 1, xp: 0 };
    }

    this.p = this._findStart();
    let hatchTile = World.tile('bunker_hatch');
    hatchTile.interior = Interior.generateBunker();
    this.map[this.p.y][this.p.x] = hatchTile;

    C.startItems.forEach(id => this.addItem(id));
    this._spawnZombies(C.tuning.initZombies);

    let bunkerBuilding = hatchTile.interior;
    let floor0 = bunkerBuilding.floors[0];
    this.worldPos = { x: this.p.x, y: this.p.y };
    this.currentBuilding = bunkerBuilding;
    this.currentFloor = 0;
    this.currentInterior = floor0;
    this.currentBuildingTile = hatchTile;
    this.location = 'interior';
    this.p = { x: floor0.entryPos.x, y: floor0.entryPos.y };

    this.reveal();

    if (!skipIntro) {
      UI.showIntro(() => { UI.fullRender(this); });
    } else {
      UI.fullRender(this);
    }
    this._initSwipe();
  }

  // ... (Getters for vision, moveCost, etc. remain unchanged) ...
  get vision() {
    let v = C.tuning.baseVision;
    if (this.equip.tool) {
      let d = C.items[this.equip.tool.id];
      if (d.stat === 'vis') v += d.val;
    }
    if (this.isNight && this.location === 'world') v = Math.max(1, v - C.tuning.nightVisPen);
    return v;
  }
  get moveCost() {
    let c = C.tuning.moveCost;
    if (this.equip.feet && C.items[this.equip.feet.id].stat === 'mov') c -= C.items[this.equip.feet.id].val;
    if (this.isEncumbered) c += C.tuning.encumberedStamPen;
    return Math.max(1, c);
  }
  get attack() {
    let a = C.tuning.baseDmg;
    if (this.equip.weapon) a += C.items[this.equip.weapon.id].val;
    let cl = this.skills.combat ? this.skills.combat.lvl : 0;
    a += Math.floor(cl * C.tuning.combatSkillBonus);
    return a;
  }
  get defense() { return this.equip.body && C.items[this.equip.body.id].stat === 'def' ? C.items[this.equip.body.id].val : 0; }
  get weight() {
    let w = 0;
    this.inv.forEach(i => { w += (C.items[i.id].wgt || 0) * i.qty; });
    for (let k in this.equip) if (this.equip[k]) w += C.items[this.equip[k].id].wgt || 0;
    return parseFloat(w.toFixed(1));
  }
  get maxWeight() {
    let b = C.player.maxWeight;
    if (this.equip.back) b += C.items[this.equip.back.id].val;
    return b;
  }
  get isEncumbered() { return this.weight > this.maxWeight; }
  get day() { return Math.floor(this.turn / C.tuning.turnsPerDay) + 1; }
  get isNight() { return (this.turn % C.tuning.turnsPerDay) / C.tuning.turnsPerDay >= (1 - C.tuning.nightRatio); }
  get timeOfDay() {
    let p = (this.turn % C.tuning.turnsPerDay) / C.tuning.turnsPerDay;
    return p < .25 ? 'Morning' : p < .5 ? 'Midday' : p < .65 ? 'Afternoon' : p < .75 ? 'Evening' : 'Night';
  }

  // ... (Zombie helpers remain unchanged) ...
  getAdjacentZombies() {
    if (this.location !== 'world') return [];
    return this.zombies.filter(z => (Math.abs(z.x - this.p.x) + Math.abs(z.y - this.p.y)) === 1);
  }
  getAdjacentInteriorZombies() {
    if (this.location !== 'interior') return [];
    return this.interiorZombies.filter(z => (Math.abs(z.x - this.p.x) + Math.abs(z.y - this.p.y)) === 1);
  }
  getNearbyZombieCount() {
    let count = 0;
    for (let z of this.zombies) if (Math.abs(z.x - this.p.x) + Math.abs(z.y - this.p.y) <= this.vision) count++;
    return count;
  }

  tick() {
    if (!this.alive) return;
    this.turn++;
    const t = C.tuning;
    this.stats.food = Math.max(0, this.stats.food - t.tickHunger);
    this.stats.h2o = Math.max(0, this.stats.h2o - t.tickThirst);
    if (this.stats.food <= 0 || this.stats.h2o <= 0) {
      this.stats.hp = Math.max(0, this.stats.hp - t.starveDmg);
      if (this.stats.hp <= 0) return this._die("Wasted away.");
    }
    if (this.location === 'world') this._moveZombies();
    let cd = this.day;
    if (this.isNight && this._lastNight < cd) {
      this._lastNight = cd;
      let n = Math.floor(t.zombiesPerNight + (cd - 1) * t.zombieEsc);
      this._spawnZombies(n);
      this.logMsg("Night falls... something stirs.", "l-bad");
    }
  }

  move(dx, dy) {
    if (!this.alive) return;
    if (this.location === 'interior') return this._moveInterior(dx, dy);
    let cost = this.moveCost;
    if (this.stats.stm < cost) return this.logMsg("Too exhausted.", "l-bad");
    let nx = this.p.x + dx, ny = this.p.y + dy;
    if (nx < 0 || nx >= C.w || ny < 0 || ny >= C.h) return;
    let tile = this.map[ny][nx], td = C.tiles[tile.type];
    if (!td.pass) return this.logMsg("Blocked.", "l-bad");
    let targetZ = this.zombies.find(z => z.x === nx && z.y === ny);
    if (targetZ) { this._playerAttack(targetZ, false); return; }
    this.p.x = nx; this.p.y = ny;
    this.stats.stm -= cost;
    this._degradeSlot('feet', 0.2);
    this.tick(); this.reveal(); UI.fullRender(this);
  }

  _moveInterior(dx, dy) {
    let cost = 1;
    if (this.stats.stm < cost) return this.logMsg("Too exhausted.", "l-bad");
    let int = this.currentInterior;
    let nx = this.p.x + dx, ny = this.p.y + dy;
    if (nx < 0 || nx >= int.w || ny < 0 || ny >= int.h) return;
    let cell = int.map[ny][nx], def = C.itiles[cell.type];
    if (!def.pass) return;
    let targetZ = this.interiorZombies.find(z => z.x === nx && z.y === ny);
    if (targetZ) { this._playerAttack(targetZ, true); return; }
    this.p.x = nx; this.p.y = ny;
    this.stats.stm -= cost;
    this.tick(); UI.fullRender(this);
  }

  attackZombie(zx, zy, isInterior) {
    if (!this.alive) return;
    let list = isInterior ? this.interiorZombies : this.zombies;
    let z = list.find(z => z.x === zx && z.y === zy);
    if (!z) return;
    this._playerAttack(z, isInterior);
  }

  _playerAttack(zombie, isInterior) {
    let ed = C.enemies[zombie.type];
    let pDmg = Math.max(1, this.attack - ed.def);
    zombie.hp -= pDmg;
    this._degradeSlot('weapon', C.tuning.durWeapon);
    if (zombie.hp <= 0) {
      if (isInterior) this.interiorZombies = this.interiorZombies.filter(z => z !== zombie);
      else this.zombies = this.zombies.filter(z => z !== zombie);
      this.kills++;
      this.gainXp('combat', ed.xp);
      this.logMsg(`Hit ${ed.name} for ${pDmg} — KILLED!`, "l-combat");
      this.tick(); UI.fullRender(this); return;
    }
    let eDmg = Math.max(1, ed.atk - this.defense);
    this.stats.hp -= eDmg;
    this._degradeSlot('body', C.tuning.durArmor);
    this.logMsg(`Hit ${ed.name} for ${pDmg} — it hits back for ${eDmg}!`, "l-combat");
    if (this.stats.hp <= 0) { this._die(`Killed by a ${ed.name}.`); return; }
    this.tick(); UI.fullRender(this);
  }

  // ... (Zombie spawning/movement logic remains similar, omitted for brevity but part of original game.js) ...
  _spawnZombies(count) {
     const t = C.tuning;
     let spawned = 0, attempts = 0;
     let refPos = this.worldPos || this.p;
     while (spawned < count && this.zombies.length < t.maxZombies && attempts++ < 200) {
       let x = Math.floor(Math.random() * C.w), y = Math.floor(Math.random() * C.h);
       if (Math.abs(x - refPos.x) + Math.abs(y - refPos.y) < t.zombieSpawnBuf) continue;
       if (!C.tiles[this.map[y][x].type].pass) continue;
       if (this.zombies.some(z => z.x === x && z.y === y)) continue;
       let tid = this._wPick(C.zombieSpawns);
       let ed = C.enemies[tid];
       this.zombies.push({ x, y, type: tid, hp: ed.hp, maxHp: ed.hp });
       spawned++;
     }
  }
  _moveZombies() {
     // Standard zombie AI (copy from previous game.js)
     const t = C.tuning;
     let list = [...this.zombies];
     for (let z of list) {
       if (!this.zombies.includes(z)) continue;
       let ed = C.enemies[z.type];
       if (this.turn % ed.speed !== 0) continue;
       let dist = Math.abs(z.x - this.p.x) + Math.abs(z.y - this.p.y);
       let dx = 0, dy = 0;
       if (dist <= t.zombieAggro && this.location === 'world') {
         dx = Math.sign(this.p.x - z.x); dy = Math.sign(this.p.y - z.y);
         if (dx !== 0 && dy !== 0) { if (Math.random() < .5) dx = 0; else dy = 0; }
       } else {
         let dirs = [[0,1],[0,-1],[1,0],[-1,0]];
         let pick = dirs[Math.floor(Math.random() * dirs.length)];
         dx = pick[0]; dy = pick[1];
       }
       let nx = z.x + dx, ny = z.y + dy;
       if (nx < 0 || nx >= C.w || ny < 0 || ny >= C.h) continue;
       if (!C.tiles[this.map[ny][nx].type].pass) continue;
       if (this.zombies.some(o => o !== z && o.x === nx && o.y === ny)) continue;
       if (nx === this.p.x && ny === this.p.y && this.location === 'world') {
         z.x = nx; z.y = ny;
         this._zombieAmbush(z, false);
         if (!this.alive) return;
         if (this.zombies.includes(z)) { z.x -= dx; z.y -= dy; }
         continue;
       }
       z.x = nx; z.y = ny;
     }
  }
  _zombieAmbush(zombie, isInterior) {
    let ed = C.enemies[zombie.type];
    let eDmg = Math.max(1, ed.atk - this.defense);
    this.stats.hp -= eDmg;
    this.logMsg(`${ed.name} attacks you for ${eDmg}!`, "l-bad");
    if (this.stats.hp <= 0) this._die(`Killed by ${ed.name}.`);
  }

  scavenge() {
    if (!this.alive || this.location !== 'world') return;
    const t = C.tuning;
    if (this.stats.stm < t.scavengeCost) return this.logMsg("Too tired.", "l-bad");
    this.stats.stm -= t.scavengeCost;
    let tile = this.map[this.p.y][this.p.x], pool = C.tileLoot[tile.type];
    if (!pool || tile.loot <= 0) { this.tick(); UI.fullRender(this); return this.logMsg("Nothing left here."); }
    let sv = this.skills.survival ? this.skills.survival.lvl : 0;
    let ch = t.scavengeChance + (sv * 0.05);
    this._degradeSlot('tool', t.durTool);
    if (Math.random() < ch) {
      let id = this._wPick(C.lootPools[pool]);
      this.addItem(id);
      tile.loot--;
      this.gainXp('survival', 10);
      this.logMsg(`Found ${C.items[id].name}`, "l-good");
    } else {
      this.logMsg("Searched but found nothing.");
      this.gainXp('survival', 2);
    }
    this.tick(); UI.fullRender(this);
  }

  enterBuilding() {
    if (!this.alive || this.location !== 'world') return;
    let tile = this.map[this.p.y][this.p.x];
    if (!C.tiles[tile.type].enter) return;

    if (!tile.interior) tile.interior = Interior.generate(tile.type);
    let building = tile.interior;
    let floor = building.floors[0];

    this.worldPos = { x: this.p.x, y: this.p.y };
    this.currentBuilding = building;
    this.currentFloor = 0;
    this.currentInterior = floor;
    this.currentBuildingTile = tile;
    this.location = 'interior';
    this.p = { x: floor.entryPos.x, y: floor.entryPos.y };

    // Interior Zombies
    this.interiorZombies = [];
    if (!building.cleared && building.buildingType !== 'bunker') {
       // ... (Same zombie spawn logic) ...
       let openings = 0;
       for (let y = 0; y < floor.h; y++)
         for (let x = 0; x < floor.w; x++) {
           let d = C.itiles[floor.map[y][x].type];
           if (d && d.barricadable && floor.map[y][x].barricadeHp <= 0) openings++;
         }
       if (Math.random() < C.tuning.interiorZombieChance * openings) {
         let count = Math.random() < 0.3 ? 2 : 1;
         for (let i = 0; i < count; i++) {
            let rx = Math.floor(Math.random() * floor.w);
            let ry = Math.floor(Math.random() * floor.h);
            if (C.itiles[floor.map[ry][rx].type].pass && !(rx === this.p.x && ry === this.p.y)) {
              let tid = this._wPick(C.zombieSpawns.filter(s => s.id !== 'brute'));
              let ed = C.enemies[tid];
              this.interiorZombies.push({ x: rx, y: ry, type: tid, hp: ed.hp, maxHp: ed.hp });
            }
         }
         if (this.interiorZombies.length > 0) this.logMsg("Something is inside!", "l-bad");
       }
    }
    this.logMsg(`Entered ${C.tiles[tile.type].buildName}.`, "l-imp");
    this.tick(); UI.fullRender(this);
  }

  exitBuilding() {
    if (this.location !== 'interior') return;
    let int = this.currentInterior;
    let cell = int.map[this.p.y][this.p.x];
    if (!C.itiles[cell.type].entry) return this.logMsg("Not an exit.", "l-bad");
    if (this.currentFloor !== 0) return this.logMsg("Go to ground floor first.", "l-bad");
    if (this.interiorZombies.length === 0 && this.currentBuilding) this.currentBuilding.cleared = true;
    this.location = 'world';
    this.p = { ...this.worldPos };
    this.currentBuilding = null;
    this.currentFloor = 0;
    this.currentInterior = null;
    this.currentBuildingTile = null;
    this.interiorZombies = [];
    this.logMsg("Exited.", "l-imp");
    this.reveal(); UI.fullRender(this);
  }

  useStairs() {
    if (this.location !== 'interior' || !this.currentBuilding) return;
    let int = this.currentInterior;
    let cell = int.map[this.p.y][this.p.x];
    let def = C.itiles[cell.type];
    if (!def.stair) return this.logMsg("Not on stairs.", "l-bad");

    let newFloor = this.currentFloor === 0 ? 1 : 0;
    if (newFloor >= this.currentBuilding.floors.length) return this.logMsg("Nowhere to go.", "l-bad");
    let floor = this.currentBuilding.floors[newFloor];
    let targetPos = Interior.findStairs(floor, 'stairs_up') || Interior.findStairs(floor, 'stairs_down') || floor.entryPos;

    this.currentFloor = newFloor;
    this.currentInterior = floor;
    this.p = { x: targetPos.x, y: targetPos.y };
    this.interiorZombies = []; 
    this.logMsg(`${def.stair === 'down' ? 'Descended' : 'Ascended'} to ${floor.label}.`, "l-imp");
    this.tick(); UI.fullRender(this);
  }

  searchInterior() {
    if (!this.alive || this.location !== 'interior') return;
    let t = C.tuning;
    if (this.stats.stm < t.searchCost) return this.logMsg("Too tired.", "l-bad");
    
    // Updated Logic: Find adjacent searchable tile (shelf/counter)
    let int = this.currentInterior;
    let targets = Interior.getAdjacentSearchable(int, this.p.x, this.p.y);
    if (targets.length === 0) return this.logMsg("Nothing searchable nearby.");
    
    this.stats.stm -= t.searchCost;
    let target = targets[0]; // Take first available
    let cell = target.cell;
    
    let sv = this.skills.survival ? this.skills.survival.lvl : 0;
    let ch = 0.6 + (sv * 0.05);
    this._degradeSlot('tool', t.durTool);
    
    // Loot generation logic
    let found = false;
    let bType = this.currentBuilding ? this.currentBuilding.buildingType : 'house';
    let poolName = 'shelf_' + bType;
    if (!C.lootPools[poolName]) poolName = 'shelf_house';

    if (Math.random() < ch) {
      let id = this._wPick(C.lootPools[poolName]);
      // NEW: Instead of adding to inventory, add to the shelf's STORAGE
      if (!cell.storage) cell.storage = [];
      cell.storage.push({ id, qty: 1 });
      found = true;
      this.logMsg(`You rummage through the ${C.itiles[cell.type].name}...`, "l-good");
    } else {
      this.logMsg("Rummaged but found nothing.", "l-bad");
    }
    
    // Important: Mark loot as taken so we can't search it again for *new* loot
    cell.loot = 0; 
    
    this.gainXp('survival', found ? 15 : 3);
    
    // If we found something, or if there was already something there, open the container UI
    if (cell.storage && cell.storage.length > 0) {
      UI.flashTab('crate');
      G.setTab('crate');
    }
    
    this.tick(); UI.fullRender(this);
  }

  barricade() {
    if (!this.alive || this.location !== 'interior') return;
    if (!this.skills.carpentry) return this.logMsg("Need Carpentry skill.", "l-bad");
    let targets = Interior.getAdjacentBarricadable(this.currentInterior, this.p.x, this.p.y);
    if (targets.length === 0) return this.logMsg("Nothing to barricade.", "l-bad");
    if (this.countItem('wood') < 1 || this.countItem('nails') < 3) return this.logMsg("Need 1 plank & 3 nails.", "l-bad");
    this.removeItem('wood', 1); this.removeItem('nails', 3);
    targets[0].cell.barricadeHp = C.tuning.barricadeHp;
    this.gainXp('carpentry', 25);
    this.logMsg("Barricaded.", "l-good");
    this.tick(); UI.fullRender(this);
  }

  salvage() {
    if (!this.alive || this.location !== 'interior') return;
    if (this.stats.stm < C.tuning.salvageCost) return this.logMsg("Too tired.", "l-bad");
    let targets = Interior.getAdjacentSalvageable(this.currentInterior, this.p.x, this.p.y);
    if (targets.length === 0) return this.logMsg("Nothing to salvage.", "l-bad");
    this.stats.stm -= C.tuning.salvageCost;
    let target = targets[0];
    let yields = C.salvageYields[target.cell.type];
    if (yields) {
      for (let y of yields) {
        let qty = y.qty != null ? y.qty : (y.min + Math.floor(Math.random() * (y.max - y.min + 1)));
        if (qty > 0) this.addItem(y.id, qty);
      }
    }
    // If salvaging a container, dump items to ground
    if (target.cell.storage && target.cell.storage.length > 0) {
      let groundKey = this._groundKey();
      if (!this.groundItems[groundKey]) this.groundItems[groundKey] = [];
      this.groundItems[groundKey].push(...target.cell.storage);
      this.logMsg("Contents fell to the ground.");
    }

    target.cell.type = (this.currentBuilding && this.currentBuilding.buildingType === 'bunker') ? 'bfloor' : 'floor';
    target.cell.loot = 0; target.cell.barricadeHp = 0; target.cell.storage = null;
    this.gainXp('survival', 10);
    this.logMsg("Salvaged for parts.", "l-good");
    this.tick(); UI.fullRender(this);
  }

  // --- Container System ---
  getAdjacentContainers() {
    if (this.location !== 'interior') return [];
    // Use the helper from World that checks for container property
    return Interior.getAdjacentContainers(this.currentInterior, this.p.x, this.p.y);
  }

  storeInContainer(uid) {
    let containers = this.getAdjacentContainers();
    if (containers.length === 0) return;
    let container = containers[0].cell;
    if (!container.storage) container.storage = [];
    let idx = this.inv.findIndex(i => i.uid === uid);
    if (idx === -1) return;
    let item = this.inv[idx];
    container.storage.push({ id: item.id, qty: 1 });
    item.qty--;
    if (item.qty <= 0) this.inv.splice(idx, 1);
    this.logMsg(`Stored ${C.items[item.id].name}.`, "l-good");
    UI.fullRender(this);
  }

  retrieveFromContainer(storageIdx) {
    let containers = this.getAdjacentContainers();
    if (containers.length === 0) return;
    let container = containers[0].cell;
    if (!container.storage || storageIdx >= container.storage.length) return;
    let si = container.storage[storageIdx];
    this.addItem(si.id, si.qty);
    container.storage.splice(storageIdx, 1);
    this.logMsg(`Retrieved ${C.items[si.id].name}.`, "l-good");
    UI.fullRender(this);
  }

  // ... (Rest, Place, Crafting, Inventory logic remain largely the same, just standard getters) ...
  
  placeStructure(itemId) {
    if (!this.alive || this.location !== 'world') return;
    let d = C.items[itemId];
    if (d.type !== 'place') return;
    let tile = this.map[this.p.y][this.p.x];
    if (!C.tiles[tile.type].placeable || ['bedroll','shelter','bunker_hatch'].includes(tile.type)) return this.logMsg("Can't place here.", "l-bad");
    this.map[this.p.y][this.p.x] = World.tile(d.placeType);
    this.removeItem(itemId, 1);
    this.logMsg(`Placed ${d.name}.`, "l-imp");
    this.tick(); UI.fullRender(this);
  }

  placeInterior(itemId) {
    if (!this.alive || this.location !== 'interior') return;
    let d = C.items[itemId];
    if (d.type !== 'iplace') return;
    let int = this.currentInterior;
    let cell = int.map[this.p.y][this.p.x];
    if (cell.type !== 'floor' && cell.type !== 'bfloor') return this.logMsg("Needs empty floor.", "l-bad");
    
    cell.type = d.placeType;
    cell.barricadeHp = 0; cell.loot = 0;
    
    // Initialize storage if it's a container
    if (C.itiles[d.placeType].container) cell.storage = [];
    
    this.removeItem(itemId, 1);
    this.logMsg(`Placed ${d.name}.`, "l-good");
    this.tick(); UI.fullRender(this);
  }

  build(key) {
    const r = C.recipes[key];
    if (!r) return;
    if (r.reqSkill && (!this.skills[r.reqSkill[0]] || this.skills[r.reqSkill[0]].lvl < r.reqSkill[1])) return this.logMsg("Skill too low.", "l-bad");
    for (let m in r.inputs) if (this.countItem(m) < r.inputs[m]) return this.logMsg("Missing materials.", "l-bad");
    for (let m in r.inputs) this.removeItem(m, r.inputs[m]);
    this.addItem(r.result.id, r.result.count || 1);
    this.logMsg(`Crafted ${r.name}.`, "l-good");
    this._lastCraftKey = key;
    this.tick(); UI.fullRender(this);
  }

  // Inventory helpers
  addItem(id, qty = 1) {
    let d = C.items[id];
    if (d.stack) {
      let ex = this.inv.find(i => i.id === id && i.qty < d.stack);
      if (ex) { let t = Math.min(qty, d.stack - ex.qty); ex.qty += t; qty -= t; }
    }
    while (qty > 0) {
      let a = d.stack ? Math.min(qty, d.stack) : 1;
      this.inv.push({ id, uid: Math.random().toString(36).substr(2, 9), qty: a, hp: d.dur || null, maxHp: d.dur || null });
      qty -= a;
    }
    UI.renderInventory(this); UI.flashTab('inv');
  }
  countItem(id) { return this.inv.reduce((s, i) => s + (i.id === id ? i.qty : 0), 0); }
  removeItem(id, qty) { /* ... same as before ... */ 
    for (let i = this.inv.length - 1; i >= 0; i--) {
      if (this.inv[i].id === id) {
        let t = Math.min(qty, this.inv[i].qty);
        this.inv[i].qty -= t; qty -= t;
        if (this.inv[i].qty <= 0) this.inv.splice(i, 1);
        if (qty <= 0) break;
      }
    }
    UI.renderInventory(this);
  }
  useItem(uid) {
    let idx = this.inv.findIndex(i => i.uid === uid);
    if (idx === -1) return;
    let item = this.inv[idx], d = C.items[item.id];
    if (d.type === 'use') {
       if (d.effect === 'food') this.stats.food = Math.min(100, this.stats.food + d.val);
       if (d.effect === 'water') this.stats.h2o = Math.min(100, this.stats.h2o + d.val);
       if (d.effect === 'heal') this.stats.hp = Math.min(100, this.stats.hp + d.val);
       this.logMsg(`Used ${d.name}.`);
       item.qty--; if(item.qty<=0) this.inv.splice(idx,1);
    } else if (d.type === 'read') {
       if (!this.skills[d.skill]) { this.skills[d.skill] = {lvl:1,xp:0}; this.logMsg("Skill Learned!", "l-imp"); }
       else { this.gainXp(d.skill, d.xp); this.logMsg("Studied.", "l-imp"); }
       this.inv.splice(idx,1);
    }
    this.tick(); UI.fullRender(this);
  }
  equipItem(uid) {
    let idx = this.inv.findIndex(i => i.uid === uid);
    if (idx === -1) return;
    let item = this.inv[idx], slot = C.items[item.id].type;
    if (this.equip[slot]) this.inv.push(this.equip[slot]);
    this.equip[slot] = item;
    this.inv.splice(idx, 1);
    this.reveal(); UI.fullRender(this);
  }
  unequip(slot) { if (this.equip[slot]) { this.inv.push(this.equip[slot]); this.equip[slot] = null; this.reveal(); UI.fullRender(this); } }
  dropItem(uid) {
    let idx = this.inv.findIndex(i => i.uid === uid);
    if (idx === -1) return;
    let item = this.inv[idx];
    let posKey = this._groundKey();
    if (!this.groundItems[posKey]) this.groundItems[posKey] = [];
    this.groundItems[posKey].push({ id: item.id, qty: 1 });
    item.qty--; if (item.qty <= 0) this.inv.splice(idx, 1);
    this.logMsg("Dropped item.");
    UI.flashTab('ground'); UI.fullRender(this);
  }
  pickupItem(groundIdx) {
    let posKey = this._groundKey();
    let pile = this.groundItems[posKey];
    if (!pile || groundIdx >= pile.length) return;
    let gi = pile[groundIdx];
    this.addItem(gi.id, gi.qty);
    pile.splice(groundIdx, 1);
    if (pile.length === 0) delete this.groundItems[posKey];
    this.logMsg("Picked up item."); UI.fullRender(this);
  }
  getGroundItems() { return this.groundItems[this._groundKey()] || []; }
  _groundKey() {
    if (this.location === 'interior') return `i:${this.worldPos.x},${this.worldPos.y}:f${this.currentFloor}:${this.p.x},${this.p.y}`;
    return `w:${this.p.x},${this.p.y}`;
  }
  
  // Rest and helpers
  getRestTier() {
    if (this.location === 'interior') return (this.currentBuilding && this.currentBuilding.buildingType === 'bunker') ? 'bunker' : 'indoor';
    let tile = this.map[this.p.y][this.p.x];
    if (tile.type === 'shelter') return 'shelter';
    if (tile.type === 'bedroll') return 'bedroll';
    if (C.tiles[tile.type].pass) return 'rough';
    return null;
  }
  rest() {
    let tier = this.getRestTier();
    if (!tier) return this.logMsg("Can't rest here.");
    let r = C.restTiers[tier];
    if (this.stats.food < r.food || this.stats.h2o < r.water) return this.logMsg("Need food/water.");
    if (tier === 'rough' && this.getAdjacentZombies().length > 0) return this.logMsg("Zombies nearby!", "l-bad");
    this.stats.food -= r.food; this.stats.h2o -= r.water;
    this.stats.stm = Math.min(100, r.stm);
    this.stats.hp = Math.min(100, this.stats.hp + r.hp);
    this.logMsg(r.msg[Math.floor(Math.random() * r.msg.length)], "l-good");
    for (let i=0; i<r.ticks; i++) this.tick();
    UI.fullRender(this);
  }
  wait() { this.logMsg("Waiting..."); this.tick(); UI.fullRender(this); }
  
  // Utils
  setTab(n) { UI.setTab(n); }
  gainXp(sk, amt) {
    if (!this.skills[sk]) return;
    this.skills[sk].xp += amt;
    if (this.skills[sk].xp >= this.skills[sk].lvl * 100) { this.skills[sk].lvl++; this.skills[sk].xp = 0; this.logMsg(`Level Up: ${sk}!`, "l-imp"); }
  }
  _degradeSlot(slot, amt) {
    let it = this.equip[slot];
    if (!it || !it.maxHp) return;
    it.hp -= amt;
    if (it.hp <= 0) { this.logMsg(`${C.items[it.id].name} broke!`, "l-bad"); this.equip[slot] = null; }
  }
  _die(reason) { this.alive = false; this.logMsg(reason, "l-bad"); UI.showDeath(this); }
  restart() { UI.hideDeath(); G = new Game(true); }
  _wPick(pool) {
    let t = pool.reduce((s, e) => s + e.weight, 0), r = Math.random() * t;
    for (let e of pool) { r -= e.weight; if (r <= 0) return e.id; }
    return pool[pool.length - 1].id;
  }
  _findStart() {
    let cx = Math.floor(C.w / 2), cy = Math.floor(C.h / 2);
    for (let r = 0; r < 15; r++)
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          let x = cx + dx, y = cy + dy;
          if (x >= 0 && x < C.w && y >= 0 && y < C.h && C.tiles[this.map[y][x].type].pass) return { x, y };
        }
    return { x: cx, y: cy };
  }
  reveal() {
    let r = this.vision, px = this.worldPos ? this.worldPos.x : this.p.x, py = this.worldPos ? this.worldPos.y : this.p.y;
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        let nx = px + dx, ny = py + dy;
        if (nx >= 0 && nx < C.w && ny >= 0 && ny < C.h) this.visited.add(`${nx},${ny}`);
      }
  }
  logMsg(text, cls = '') { this.log.unshift({ m: text, c: cls }); UI.renderLog(this); }
  _initSwipe() { /* ... touch logic same as before ... */ 
    let sx, sy; const min = 30;
    const vp = document.getElementById('viewport');
    if (!vp) return;
    vp.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    vp.addEventListener('touchend', e => {
      if (sx == null) return;
      let dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) < min && Math.abs(dy) < min) return;
      if (Math.abs(dx) > Math.abs(dy)) this.move(dx > 0 ? 1 : -1, 0);
      else this.move(0, dy > 0 ? 1 : -1);
      sx = null;
    }, { passive: true });
  }
}