/* ═══════════════════════════════════════════════════════════
   WASTELAND SURVIVOR — game.js
   Game engine, player actions, combat, zombies
   ═══════════════════════════════════════════════════════════ */

let G; // global game instance

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
    this.groundItems = {}; // position key → [{id, qty}, ...]

    // Interior state
    this.location = 'world';
    this.worldPos = null;
    this.currentBuilding = null;   // multi-floor building object
    this.currentFloor = 0;         // index into building.floors
    this.currentInterior = null;   // shortcut: currentBuilding.floors[currentFloor]
    this.currentBuildingTile = null;
    this.interiorZombies = [];

    for (let k in C.skills) {
      if (C.skills[k].start) this.skills[k] = { lvl: 1, xp: 0 };
    }

    // Find start, place bunker hatch (no camp)
    this.p = this._findStart();
    let hatchTile = World.tile('bunker_hatch');
    hatchTile.interior = Interior.generateBunker();
    this.map[this.p.y][this.p.x] = hatchTile;

    C.startItems.forEach(id => this.addItem(id));
    this._spawnZombies(C.tuning.initZombies);

    // Start player INSIDE bunker
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

    // Show intro or skip to game
    if (!skipIntro) {
      UI.showIntro(() => {
        UI.fullRender(this);
        this.logMsg("Read the Carpentry book to learn building.", "l-imp");
        this.logMsg("Use the ladder to reach the surface.", "l-imp");
      });
    } else {
      UI.fullRender(this);
      this.logMsg("Read the Carpentry book to learn building.", "l-imp");
      this.logMsg("Use the ladder to reach the surface.", "l-imp");
    }
    this._initSwipe();
  }


  /* ══════════════════════════════════════════════════════════
     COMPUTED PROPERTIES
     ══════════════════════════════════════════════════════════ */

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
    if (this.equip.feet) {
      let d = C.items[this.equip.feet.id];
      if (d.stat === 'mov') c -= d.val;
    }
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

  get defense() {
    let d = 0;
    if (this.equip.body) {
      let i = C.items[this.equip.body.id];
      if (i.stat === 'def') d += i.val;
    }
    return d;
  }

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

  get isNight() {
    return (this.turn % C.tuning.turnsPerDay) / C.tuning.turnsPerDay >= (1 - C.tuning.nightRatio);
  }

  get timeOfDay() {
    let p = (this.turn % C.tuning.turnsPerDay) / C.tuning.turnsPerDay;
    return p < .25 ? 'Morning' : p < .5 ? 'Midday' : p < .65 ? 'Afternoon' : p < .75 ? 'Evening' : 'Night';
  }


  /* ══════════════════════════════════════════════════════════
     ZOMBIE HELPERS
     ══════════════════════════════════════════════════════════ */

  getAdjacentZombies() {
    if (this.location !== 'world') return [];
    return this.zombies.filter(z => {
      let dx = Math.abs(z.x - this.p.x), dy = Math.abs(z.y - this.p.y);
      return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    });
  }

  getAdjacentInteriorZombies() {
    if (this.location !== 'interior') return [];
    return this.interiorZombies.filter(z => {
      let dx = Math.abs(z.x - this.p.x), dy = Math.abs(z.y - this.p.y);
      return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    });
  }

  getNearbyZombieCount() {
    let count = 0;
    for (let z of this.zombies)
      if (Math.abs(z.x - this.p.x) + Math.abs(z.y - this.p.y) <= this.vision) count++;
    return count;
  }


  /* ══════════════════════════════════════════════════════════
     CORE TICK
     ══════════════════════════════════════════════════════════ */

  tick() {
    if (!this.alive) return;
    this.turn++;
    const t = C.tuning;
    this.stats.food = Math.max(0, this.stats.food - t.tickHunger);
    this.stats.h2o = Math.max(0, this.stats.h2o - t.tickThirst);
    if (this.stats.food <= 0 || this.stats.h2o <= 0) {
      this.stats.hp = Math.max(0, this.stats.hp - t.starveDmg);
      if (this.stats.hp <= 0) return this._die("Wasted away in the wasteland.");
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


  /* ══════════════════════════════════════════════════════════
     MOVEMENT
     ══════════════════════════════════════════════════════════ */

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


  /* ══════════════════════════════════════════════════════════
     COMBAT
     ══════════════════════════════════════════════════════════ */

  attackZombie(zx, zy, isInterior) {
    if (!this.alive) return;
    let zombieList = isInterior ? this.interiorZombies : this.zombies;
    let z = zombieList.find(z => z.x === zx && z.y === zy);
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
      this.logMsg(`⚔️ Hit ${ed.icon} ${ed.name} for ${pDmg} — KILLED! (+${ed.xp}xp)`, "l-combat");
      this.tick(); UI.fullRender(this); return;
    }
    let eDmg = Math.max(1, ed.atk - this.defense);
    this.stats.hp -= eDmg;
    this._degradeSlot('body', C.tuning.durArmor);
    this.logMsg(`⚔️ Hit ${ed.icon} ${ed.name} for ${pDmg} (${zombie.hp}/${zombie.maxHp}) — it hits back for ${eDmg}!`, "l-combat");
    if (this.stats.hp <= 0) { this._die(`Killed by a ${ed.name}.`); return; }
    this.tick(); UI.fullRender(this);
  }

  _zombieAmbush(zombie, isInterior) {
    let ed = C.enemies[zombie.type];
    let eDmg = Math.max(1, ed.atk - this.defense);
    this.stats.hp -= eDmg;
    this._degradeSlot('body', C.tuning.durArmor);
    this.logMsg(`${ed.icon} ${ed.name} lunges at you for ${eDmg} damage!`, "l-bad");
    if (this.stats.hp <= 0) { this._die(`Ambushed and killed by a ${ed.name}.`); return; }
    let pDmg = Math.max(1, this.attack - ed.def);
    zombie.hp -= pDmg;
    this._degradeSlot('weapon', C.tuning.durWeapon);
    if (zombie.hp <= 0) {
      if (isInterior) this.interiorZombies = this.interiorZombies.filter(z => z !== zombie);
      else this.zombies = this.zombies.filter(z => z !== zombie);
      this.kills++;
      this.gainXp('combat', ed.xp);
      this.logMsg(`⚔️ You strike back for ${pDmg} — KILLED! (+${ed.xp}xp)`, "l-combat");
    } else {
      this.logMsg(`⚔️ You strike back for ${pDmg} (${zombie.hp}/${zombie.maxHp})`, "l-combat");
    }
  }


  /* ══════════════════════════════════════════════════════════
     ZOMBIE AI
     ══════════════════════════════════════════════════════════ */

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


  /* ══════════════════════════════════════════════════════════
     ACTIONS — enter/exit, search, barricade, salvage, stairs
     ══════════════════════════════════════════════════════════ */

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
      this.logMsg(`Found ${C.items[id].icon} ${C.items[id].name}`, "l-good");
    } else {
      this.logMsg("Searched but found nothing.");
      this.gainXp('survival', 2);
    }
    this.tick(); UI.fullRender(this);
  }

  enterBuilding() {
    if (!this.alive || this.location !== 'world') return;
    let tile = this.map[this.p.y][this.p.x];
    let td = C.tiles[tile.type];
    if (!td.enter) return;

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

    // Spawn interior zombies (bunker never has zombies)
    this.interiorZombies = [];
    if (!building.cleared && building.buildingType !== 'bunker') {
      let openings = 0;
      for (let y = 0; y < floor.h; y++)
        for (let x = 0; x < floor.w; x++) {
          let c = floor.map[y][x], d = C.itiles[c.type];
          if (d && d.barricadable && c.barricadeHp <= 0) openings++;
        }
      let chance = C.tuning.interiorZombieChance * openings;
      if (Math.random() < chance) {
        let count = Math.random() < 0.3 ? 2 : 1;
        for (let i = 0; i < count; i++) {
          let placed = false;
          for (let a = 0; a < 50 && !placed; a++) {
            let rx = Math.floor(Math.random() * floor.w);
            let ry = Math.floor(Math.random() * floor.h);
            if (C.itiles[floor.map[ry][rx].type].pass && !(rx === this.p.x && ry === this.p.y)) {
              let tid = this._wPick(C.zombieSpawns.filter(s => s.id !== 'brute'));
              let ed = C.enemies[tid];
              this.interiorZombies.push({ x: rx, y: ry, type: tid, hp: ed.hp, maxHp: ed.hp });
              placed = true;
            }
          }
        }
        if (this.interiorZombies.length > 0)
          this.logMsg(`⚠️ Something is in here!`, "l-bad");
      }
    }
    let name = td.buildName || tile.type;
    this.logMsg(`Entered ${name.toLowerCase()}.`, "l-imp");
    if (building.floors.length > 1)
      this.logMsg(`This building has multiple floors.`, "l-imp");
    this.tick(); UI.fullRender(this);
  }

  exitBuilding() {
    if (this.location !== 'interior') return;
    let int = this.currentInterior;
    let cell = int.map[this.p.y][this.p.x];
    if (!C.itiles[cell.type].entry)
      return this.logMsg("Move to a door, window, or ladder to exit.", "l-bad");
    if (this.currentFloor !== 0)
      return this.logMsg("Return to the ground floor first.", "l-bad");
    if (this.interiorZombies.length === 0 && this.currentBuilding)
      this.currentBuilding.cleared = true;
    this.location = 'world';
    this.p = { ...this.worldPos };
    this.currentBuilding = null;
    this.currentFloor = 0;
    this.currentInterior = null;
    this.currentBuildingTile = null;
    this.interiorZombies = [];
    this.logMsg("Exited to the surface.", "l-imp");
    this.reveal(); UI.fullRender(this);
  }

  /** Navigate between floors via stairs */
  useStairs() {
    if (this.location !== 'interior' || !this.currentBuilding) return;
    let int = this.currentInterior;
    let cell = int.map[this.p.y][this.p.x];
    let def = C.itiles[cell.type];
    if (!def.stair) return this.logMsg("Not on stairs.", "l-bad");

    let building = this.currentBuilding;
    // Simple toggle: floor 0 → floor 1, floor 1 → floor 0
    let newFloor = this.currentFloor === 0 ? 1 : 0;
    if (newFloor >= building.floors.length) return this.logMsg("Nowhere to go.", "l-bad");

    let floor = building.floors[newFloor];
    // Find any stairs tile on the target floor to land on
    let targetPos = Interior.findStairs(floor, 'stairs_up') || Interior.findStairs(floor, 'stairs_down');
    if (!targetPos) targetPos = floor.entryPos;

    this.currentFloor = newFloor;
    this.currentInterior = floor;
    this.p = { x: targetPos.x, y: targetPos.y };
    this.interiorZombies = []; // each floor clears zombies independently
    this.logMsg(`${def.stair === 'down' ? 'Descended' : 'Ascended'} to ${floor.label}.`, "l-imp");
    this.tick(); UI.fullRender(this);
  }

  searchInterior() {
    if (!this.alive || this.location !== 'interior') return;
    let t = C.tuning;
    if (this.stats.stm < t.searchCost) return this.logMsg("Too tired.", "l-bad");
    let int = this.currentInterior;
    let targets = Interior.getAdjacentSearchable(int, this.p.x, this.p.y);
    if (targets.length === 0) return this.logMsg("Nothing to search nearby.");
    this.stats.stm -= t.searchCost;
    let target = targets[0];
    let sv = this.skills.survival ? this.skills.survival.lvl : 0;
    let ch = 0.6 + (sv * 0.05);
    this._degradeSlot('tool', t.durTool);
    let bType = this.currentBuilding ? this.currentBuilding.buildingType : 'house';
    let poolName = 'shelf_' + bType;
    if (!C.lootPools[poolName]) poolName = 'shelf_house';
    if (Math.random() < ch) {
      let id = this._wPick(C.lootPools[poolName]);
      this.addItem(id);
      target.cell.loot--;
      this.gainXp('survival', 15);
      this.logMsg(`Found ${C.items[id].icon} ${C.items[id].name}`, "l-good");
    } else {
      this.logMsg("Rummaged but found nothing useful.");
      this.gainXp('survival', 3);
    }
    this.tick(); UI.fullRender(this);
  }

  barricade() {
    if (!this.alive || this.location !== 'interior') return;
    if (!this.skills.carpentry) return this.logMsg("Need Carpentry skill.", "l-bad");
    let int = this.currentInterior;
    let targets = Interior.getAdjacentBarricadable(int, this.p.x, this.p.y);
    if (targets.length === 0) return this.logMsg("Nothing to barricade nearby.", "l-bad");
    if (this.countItem('wood') < 1) return this.logMsg("Need 1 Plank.", "l-bad");
    if (this.countItem('nails') < 3) return this.logMsg("Need 3 Nails.", "l-bad");
    this.removeItem('wood', 1);
    this.removeItem('nails', 3);
    targets[0].cell.barricadeHp = C.tuning.barricadeHp;
    this.gainXp('carpentry', 25);
    this._degradeSlot('tool', C.tuning.durTool);
    this.logMsg("Barricaded the opening.", "l-good");
    this.tick(); UI.fullRender(this);
  }

  salvage() {
    if (!this.alive || this.location !== 'interior') return;
    let t = C.tuning;
    if (this.stats.stm < t.salvageCost) return this.logMsg("Too tired.", "l-bad");
    let int = this.currentInterior;
    let targets = Interior.getAdjacentSalvageable(int, this.p.x, this.p.y);
    if (targets.length === 0) return this.logMsg("Nothing to salvage nearby.", "l-bad");
    this.stats.stm -= t.salvageCost;
    let target = targets[0];
    let yields = C.salvageYields[target.cell.type];
    if (yields) {
      for (let y of yields) {
        let qty = y.qty != null ? y.qty : (y.min + Math.floor(Math.random() * (y.max - y.min + 1)));
        if (qty > 0) this.addItem(y.id, qty);
      }
    }
    let oldName = target.cell.type.charAt(0).toUpperCase() + target.cell.type.slice(1);
    let floorType = (this.currentBuilding && this.currentBuilding.buildingType === 'bunker') ? 'bfloor' : 'floor';
    target.cell.type = floorType;
    target.cell.loot = 0;
    target.cell.barricadeHp = 0;
    this.gainXp('survival', 10);
    this._degradeSlot('tool', C.tuning.durTool);
    this.logMsg(`Salvaged ${oldName} for materials.`, "l-good");
    this.tick(); UI.fullRender(this);
  }

  /** Get adjacent container cells */
  getAdjacentContainers() {
    if (this.location !== 'interior') return [];
    let int = this.currentInterior;
    let results = [];
    for (let [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
      let nx = this.p.x + dx, ny = this.p.y + dy;
      if (nx < 0 || nx >= int.w || ny < 0 || ny >= int.h) continue;
      let cell = int.map[ny][nx], def = C.itiles[cell.type];
      if (def && def.container) results.push({ x: nx, y: ny, cell });
    }
    return results;
  }

  /** Store an item from inventory into adjacent container */
  storeInContainer(uid) {
    let containers = this.getAdjacentContainers();
    if (containers.length === 0) return;
    let container = containers[0].cell;
    if (!container.storage) container.storage = [];
    let idx = this.inv.findIndex(i => i.uid === uid);
    if (idx === -1) return;
    let item = this.inv[idx], d = C.items[item.id];
    container.storage.push({ id: item.id, qty: 1 });
    item.qty--;
    if (item.qty <= 0) this.inv.splice(idx, 1);
    this.logMsg(`Stored ${d.icon} ${d.name} in crate.`, "l-good");
    UI.fullRender(this);
  }

  /** Retrieve an item from adjacent container */
  retrieveFromContainer(storageIdx) {
    let containers = this.getAdjacentContainers();
    if (containers.length === 0) return;
    let container = containers[0].cell;
    if (!container.storage || storageIdx >= container.storage.length) return;
    let si = container.storage[storageIdx];
    this.addItem(si.id, si.qty);
    container.storage.splice(storageIdx, 1);
    this.logMsg(`Retrieved ${C.items[si.id].icon} ${C.items[si.id].name} from crate.`, "l-good");
    UI.fullRender(this);
  }


  /* ══════════════════════════════════════════════════════════
     REST SYSTEM
     ══════════════════════════════════════════════════════════ */

  getRestTier() {
    if (this.location === 'interior') {
      if (this.currentBuilding && this.currentBuilding.buildingType === 'bunker') return 'bunker';
      return 'indoor';
    }
    let tile = this.map[this.p.y][this.p.x];
    if (tile.type === 'shelter') return 'shelter';
    if (tile.type === 'bedroll') return 'bedroll';
    if (C.tiles[tile.type].pass) return 'rough';
    return null;
  }

  rest() {
    if (!this.alive) return;
    let tier = this.getRestTier();
    if (!tier) return this.logMsg("Can't rest here.", "l-bad");
    let r = C.restTiers[tier];
    if (!r) return;
    if (this.stats.food < r.food) return this.logMsg(`Need at least ${r.food} food to rest.`, "l-bad");
    if (this.stats.h2o < r.water) return this.logMsg(`Need at least ${r.water} water to rest.`, "l-bad");
    if (tier === 'rough' && this.getAdjacentZombies().length > 0)
      return this.logMsg("Too dangerous! Zombies are right next to you.", "l-bad");
    this.stats.food -= r.food;
    this.stats.h2o -= r.water;
    this.stats.stm = Math.min(100, r.stm);
    this.stats.hp = Math.min(100, this.stats.hp + r.hp);
    let msg = r.msg[Math.floor(Math.random() * r.msg.length)];
    this.logMsg(msg, "l-good");
    if (tier === 'rough') this.logMsg("Craft a Bedroll for better rest anywhere.", "l-imp");
    for (let i = 0; i < r.ticks; i++) this.tick();
    UI.fullRender(this);
  }

  wait() {
    if (!this.alive) return;
    this.logMsg("Waiting...");
    this.tick(); UI.fullRender(this);
  }


  /* ══════════════════════════════════════════════════════════
     STRUCTURE PLACEMENT
     ══════════════════════════════════════════════════════════ */

  placeStructure(itemId) {
    if (!this.alive || this.location !== 'world') return;
    let d = C.items[itemId];
    if (!d || d.type !== 'place') return;
    let idx = this.inv.findIndex(i => i.id === itemId);
    if (idx === -1) return this.logMsg(`You don't have a ${d.name}.`, "l-bad");
    let tile = this.map[this.p.y][this.p.x], td = C.tiles[tile.type];
    if (!td.placeable) return this.logMsg("Can't place that here.", "l-bad");
    if (['bedroll','shelter','bunker_hatch'].includes(tile.type))
      return this.logMsg("Already a structure here.", "l-bad");
    this.map[this.p.y][this.p.x] = World.tile(d.placeType);
    let item = this.inv[idx];
    item.qty--; if (item.qty <= 0) this.inv.splice(idx, 1);
    let tileDef = C.tiles[d.placeType];
    this.logMsg(`Placed ${tileDef.name}. ${tileDef.desc}`, "l-imp");
    this.gainXp('survival', 20);
    this.tick(); UI.fullRender(this);
  }

  placeInterior(itemId) {
    if (!this.alive || this.location !== 'interior') return;
    let d = C.items[itemId];
    if (!d || d.type !== 'iplace') return;
    let idx = this.inv.findIndex(i => i.id === itemId);
    if (idx === -1) return this.logMsg(`You don't have a ${d.name}.`, "l-bad");
    let int = this.currentInterior;
    let cell = int.map[this.p.y][this.p.x];
    if (cell.type !== 'floor' && cell.type !== 'bfloor')
      return this.logMsg("Can only place on open floor.", "l-bad");
    cell.type = d.placeType;
    cell.barricadeHp = 0; cell.loot = 0;
    if (d.placeType === 'crate') cell.storage = [];
    let item = this.inv[idx];
    item.qty--; if (item.qty <= 0) this.inv.splice(idx, 1);
    this.logMsg(`Placed ${d.name}.`, "l-good");
    this.gainXp('carpentry', 15);
    if (!C.itiles[d.placeType].pass) {
      for (let [ddx, ddy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
        let nx = this.p.x + ddx, ny = this.p.y + ddy;
        if (nx >= 0 && nx < int.w && ny >= 0 && ny < int.h && C.itiles[int.map[ny][nx].type].pass) {
          this.p.x = nx; this.p.y = ny; break;
        }
      }
    }
    this.tick(); UI.fullRender(this);
  }


  /* ══════════════════════════════════════════════════════════
     CRAFTING
     ══════════════════════════════════════════════════════════ */

  build(key) {
    if (!this.alive) return;
    const r = C.recipes[key];
    if (!r) return;
    if (r.reqSkill) {
      const [sk, lv] = r.reqSkill;
      if (!this.skills[sk]) return this.logMsg(`Don't know ${C.skills[sk].name}.`, "l-bad");
      if (this.skills[sk].lvl < lv) return this.logMsg(`Need ${sk} level ${lv}.`, "l-bad");
    }
    if (r.tool) {
      if (!this.equip.tool || this.equip.tool.id !== r.tool)
        return this.logMsg(`Need ${C.items[r.tool].name} equipped.`, "l-bad");
    }
    for (let m in r.inputs) {
      if (this.countItem(m) < r.inputs[m])
        return this.logMsg(`Need ${r.inputs[m]} ${C.items[m].name}.`, "l-bad");
    }
    for (let m in r.inputs) this.removeItem(m, r.inputs[m]);
    this.addItem(r.result.id, r.result.count || 1);
    let ri = C.items[r.result.id];
    this.logMsg(`Crafted ${ri.icon} ${r.name}.`, "l-good");
    this._lastCraftKey = key;
    this._degradeSlot('tool', C.tuning.durTool);
    this.tick(); UI.fullRender(this);
  }


  /* ══════════════════════════════════════════════════════════
     INVENTORY
     ══════════════════════════════════════════════════════════ */

  addItem(id, qty = 1) {
    let d = C.items[id];
    if (d.stack) {
      let ex = this.inv.find(i => i.id === id && i.qty < d.stack);
      if (ex) {
        let t = Math.min(qty, d.stack - ex.qty);
        ex.qty += t; qty -= t;
        if (qty <= 0) { UI.renderInventory(this); UI.flashTab('inv'); return; }
      }
    }
    while (qty > 0) {
      let a = d.stack ? Math.min(qty, d.stack) : 1;
      this.inv.push({ id, uid: Math.random().toString(36).substr(2, 9), qty: a, hp: d.dur || null, maxHp: d.dur || null });
      qty -= a;
    }
    UI.renderInventory(this); UI.flashTab('inv');
  }

  countItem(id) { return this.inv.reduce((s, i) => s + (i.id === id ? i.qty : 0), 0); }

  removeItem(id, qty) {
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
    if (!this.alive) return;
    let idx = this.inv.findIndex(i => i.uid === uid);
    if (idx === -1) return;
    let item = this.inv[idx], d = C.items[item.id];
    if (d.type === 'use') {
      if (d.effect === 'food')  this.stats.food = Math.min(100, this.stats.food + d.val);
      if (d.effect === 'water') this.stats.h2o  = Math.min(100, this.stats.h2o + d.val);
      if (d.effect === 'heal')  this.stats.hp   = Math.min(100, this.stats.hp + d.val);
      this.logMsg(`Used ${d.icon} ${d.name}.`, "l-good");
      item.qty--;
      if (item.qty <= 0) this.inv.splice(idx, 1);
    } else if (d.type === 'read') {
      if (!this.skills[d.skill]) {
        this.skills[d.skill] = { lvl: 1, xp: 0 };
        this.logMsg(`LEARNED: ${C.skills[d.skill].name}!`, "l-imp");
        this.logMsg("You can now build walls, doors & barricades.", "l-good");
      } else {
        this.gainXp(d.skill, d.xp);
        this.logMsg(`Studied ${d.name}.`, "l-imp");
      }
      this.inv.splice(idx, 1);
    }
    this.tick(); UI.fullRender(this);
  }

  equipItem(uid) {
    if (!this.alive) return;
    let idx = this.inv.findIndex(i => i.uid === uid);
    if (idx === -1) return;
    let item = this.inv[idx], slot = C.items[item.id].type;
    if (this.equip[slot]) this.inv.push(this.equip[slot]);
    this.equip[slot] = item;
    this.inv.splice(idx, 1);
    this.logMsg(`Equipped ${C.items[item.id].icon} ${C.items[item.id].name}.`);
    this.reveal(); UI.fullRender(this);
  }

  unequip(slot) {
    if (!this.equip[slot]) return;
    this.inv.push(this.equip[slot]);
    this.equip[slot] = null;
    this.reveal(); UI.fullRender(this);
  }

  dropItem(uid) {
    let idx = this.inv.findIndex(i => i.uid === uid);
    if (idx === -1) return;
    let item = this.inv[idx], d = C.items[item.id];
    // Build a ground item (1 qty)
    let posKey = this._groundKey();
    if (!this.groundItems[posKey]) this.groundItems[posKey] = [];
    this.groundItems[posKey].push({ id: item.id, qty: 1 });
    // Reduce inventory
    item.qty--;
    if (item.qty <= 0) this.inv.splice(idx, 1);
    this.logMsg(`Dropped ${d.icon} ${d.name}.`);
    UI.flashTab('ground');
    UI.fullRender(this);
  }

  pickupItem(groundIdx) {
    let posKey = this._groundKey();
    let pile = this.groundItems[posKey];
    if (!pile || groundIdx >= pile.length) return;
    let gi = pile[groundIdx];
    this.addItem(gi.id, gi.qty);
    pile.splice(groundIdx, 1);
    if (pile.length === 0) delete this.groundItems[posKey];
    this.logMsg(`Picked up ${C.items[gi.id].icon} ${C.items[gi.id].name}.`, "l-good");
    UI.fullRender(this);
  }

  getGroundItems() {
    let posKey = this._groundKey();
    return this.groundItems[posKey] || [];
  }

  _groundKey() {
    if (this.location === 'interior') {
      let wp = this.worldPos;
      return `i:${wp.x},${wp.y}:f${this.currentFloor}:${this.p.x},${this.p.y}`;
    }
    return `w:${this.p.x},${this.p.y}`;
  }


  /* ══════════════════════════════════════════════════════════
     HELPERS
     ══════════════════════════════════════════════════════════ */

  setTab(name) {
    document.querySelectorAll('.tc').forEach(e => e.classList.remove('on'));
    document.querySelectorAll('.tb').forEach(e => e.classList.remove('on'));
    document.getElementById('tab-' + name).classList.add('on');
    document.querySelectorAll('.tb').forEach(b => { if (b.dataset.tab === name) b.classList.add('on'); });
  }

  gainXp(sk, amt) {
    if (!this.skills[sk]) return;
    let s = this.skills[sk];
    s.xp += amt;
    let req = s.lvl * 100;
    if (s.xp >= req) { s.lvl++; s.xp -= req; this.logMsg(`LEVEL UP! ${C.skills[sk].name} → ${s.lvl}`, "l-imp"); }
  }

  _degradeSlot(slot, amt) {
    let it = this.equip[slot];
    if (!it || !it.maxHp) return;
    it.hp -= amt;
    if (it.hp <= 0) {
      this.logMsg(`${C.items[it.id].icon} ${C.items[it.id].name} broke!`, "l-bad");
      this.equip[slot] = null;
    }
  }

  _die(reason) { this.alive = false; this.logMsg(reason, "l-bad"); UI.fullRender(this); UI.showDeath(this); }
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
          if (x < 0 || x >= C.w || y < 0 || y >= C.h) continue;
          if (C.tiles[this.map[y][x].type].pass) return { x, y };
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

  _initSwipe() {
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
