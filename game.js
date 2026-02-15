/* ═══════════════════════════════════════════════════════════
   WASTELAND SURVIVOR — game.js
   Game engine, player actions, combat, zombies
   ═══════════════════════════════════════════════════════════ */

let G; // global game instance

class Game {
  constructor() {
    this.map = World.create();
    this.log = [];
    this.inv = [];
    this.equip = { weapon: null, tool: null, body: null, feet: null, back: null };
    this.stats = { ...C.player };
    this.skills = {};
    this.visited = new Set();
    this.alive = true;
    this.turn = 0;
    this.kills = 0;
    this.zombies = [];
    this._lastNight = -1;

    // Interior state
    this.location = 'world';         // 'world' or 'interior'
    this.worldPos = null;            // saved world position when inside
    this.currentInterior = null;     // interior data reference
    this.currentBuildingTile = null;  // world tile reference
    this.interiorZombies = [];       // zombies inside current building

    // Bedroll tracking — only one placed at a time
    this.bedrollPos = null;          // {x, y} or null

    // Init starting skills
    for (let k in C.skills) {
      if (C.skills[k].start) this.skills[k] = { lvl: 1, xp: 0 };
    }

    this.p = this._findStart();
    this.map[this.p.y][this.p.x] = World.tile('camp');
    C.startItems.forEach(id => this.addItem(id));
    this._spawnZombies(C.tuning.initZombies);
    this.reveal();
    UI.fullRender(this);
    this.logMsg("Camp established. Search buildings for supplies.", "l-imp");
    this.logMsg("Read the Carpentry book to learn barricading.", "l-imp");
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
     REST TIER — determine what quality of rest is available
     ══════════════════════════════════════════════════════════ */

  /**
   * Returns the best rest tier available at the player's current position.
   * 'home'    = camp tile, claimed interior, or standing on claimed building in world
   * 'bedroll' = on a bedroll tile in the world
   * 'rough'   = anywhere passable on the world map
   * null      = cannot rest (e.g. inside un-claimed building, or on water)
   */
  getRestTier() {
    if (this.location === 'interior') {
      if (this.currentInterior && this.currentInterior.claimed) return 'home';
      return null; // can't rough-rest indoors
    }
    // World map
    let tile = this.map[this.p.y][this.p.x];
    if (tile.type === 'camp') return 'home';
    if ((tile.type === 'house' || tile.type === 'store') && tile.interior && tile.interior.claimed) return 'home';
    if (tile.type === 'bedroll') return 'bedroll';
    // Can rough-rest on any passable outdoor tile
    if (C.tiles[tile.type] && C.tiles[tile.type].pass) return 'rough';
    return null;
  }


  /* ══════════════════════════════════════════════════════════
     ZOMBIE HELPERS — used by UI for action buttons & moodles
     ══════════════════════════════════════════════════════════ */

  /** Get zombies adjacent to player on world map (4-directional) */
  getAdjacentZombies() {
    if (this.location !== 'world') return [];
    let adj = [];
    for (let z of this.zombies) {
      let dx = Math.abs(z.x - this.p.x), dy = Math.abs(z.y - this.p.y);
      if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) adj.push(z);
    }
    return adj;
  }

  /** Get zombies adjacent to player inside building */
  getAdjacentInteriorZombies() {
    if (this.location !== 'interior') return [];
    let adj = [];
    for (let z of this.interiorZombies) {
      let dx = Math.abs(z.x - this.p.x), dy = Math.abs(z.y - this.p.y);
      if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) adj.push(z);
    }
    return adj;
  }

  /** Count zombies within vision range */
  getNearbyZombieCount() {
    let count = 0;
    for (let z of this.zombies) {
      if (Math.abs(z.x - this.p.x) + Math.abs(z.y - this.p.y) <= this.vision) count++;
    }
    return count;
  }


  /* ══════════════════════════════════════════════════════════
     CORE TICK — hunger, thirst, starvation, zombie AI
     ══════════════════════════════════════════════════════════ */

  tick() {
    if (!this.alive) return;
    this.turn++;
    const t = C.tuning;

    // Drain
    this.stats.food = Math.max(0, this.stats.food - t.tickHunger);
    this.stats.h2o = Math.max(0, this.stats.h2o - t.tickThirst);

    // Starvation/dehydration damage
    if (this.stats.food <= 0 || this.stats.h2o <= 0) {
      this.stats.hp = Math.max(0, this.stats.hp - t.starveDmg);
      if (this.stats.hp <= 0) return this._die("Wasted away in the wasteland.");
    }

    // Zombie movement — each zombie moves on its own speed schedule
    if (this.location === 'world') this._moveZombies();

    // Night spawns
    let cd = this.day;
    if (this.isNight && this._lastNight < cd) {
      this._lastNight = cd;
      let n = Math.floor(t.zombiesPerNight + (cd - 1) * t.zombieEsc);
      this._spawnZombies(n);
      this.logMsg("Night falls... something stirs.", "l-bad");
    }
  }


  /* ══════════════════════════════════════════════════════════
     MOVEMENT — world & interior
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

    // ── COMBAT: Moving into a zombie = ATTACK (stay in place) ──
    let targetZ = this.zombies.find(z => z.x === nx && z.y === ny);
    if (targetZ) {
      this._playerAttack(targetZ, false);
      return;
    }

    // Normal movement
    this.p.x = nx;
    this.p.y = ny;
    this.stats.stm -= cost;
    this._degradeSlot('feet', 0.2);
    this.tick();
    this.reveal();
    UI.fullRender(this);
  }

  _moveInterior(dx, dy) {
    let cost = 1;
    if (this.stats.stm < cost) return this.logMsg("Too exhausted.", "l-bad");

    let int = this.currentInterior;
    let nx = this.p.x + dx, ny = this.p.y + dy;
    if (nx < 0 || nx >= int.w || ny < 0 || ny >= int.h) return;

    let cell = int.map[ny][nx], def = C.itiles[cell.type];
    if (!def.pass) return;

    // ── COMBAT: Moving into interior zombie = ATTACK (stay in place) ──
    let targetZ = this.interiorZombies.find(z => z.x === nx && z.y === ny);
    if (targetZ) {
      this._playerAttack(targetZ, true);
      return;
    }

    this.p.x = nx;
    this.p.y = ny;
    this.stats.stm -= cost;
    this.tick();
    UI.fullRender(this);
  }


  /* ══════════════════════════════════════════════════════════
     COMBAT — clear attack-in-place system
     ══════════════════════════════════════════════════════════ */

  /**
   * Explicit attack action (called from ATTACK buttons or from movement)
   * @param {number} zx - zombie x position
   * @param {number} zy - zombie y position
   * @param {boolean} isInterior - whether combat is inside a building
   */
  attackZombie(zx, zy, isInterior) {
    if (!this.alive) return;
    let zombieList = isInterior ? this.interiorZombies : this.zombies;
    let z = zombieList.find(z => z.x === zx && z.y === zy);
    if (!z) return;
    this._playerAttack(z, isInterior);
  }

  /**
   * Player attacks a zombie (stays in place). Zombie retaliates if alive.
   */
  _playerAttack(zombie, isInterior) {
    let ed = C.enemies[zombie.type];

    // Player strikes
    let pDmg = Math.max(1, this.attack - ed.def);
    zombie.hp -= pDmg;
    this._degradeSlot('weapon', C.tuning.durWeapon);

    if (zombie.hp <= 0) {
      // Zombie killed
      if (isInterior) this.interiorZombies = this.interiorZombies.filter(z => z !== zombie);
      else this.zombies = this.zombies.filter(z => z !== zombie);
      this.kills++;
      this.gainXp('combat', ed.xp);
      this.logMsg(`⚔️ Hit ${ed.icon} ${ed.name} for ${pDmg} — KILLED! (+${ed.xp}xp)`, "l-combat");
      this.tick();
      UI.fullRender(this);
      return;
    }

    // Zombie retaliates
    let eDmg = Math.max(1, ed.atk - this.defense);
    this.stats.hp -= eDmg;
    this._degradeSlot('body', C.tuning.durArmor);
    this.logMsg(`⚔️ Hit ${ed.icon} ${ed.name} for ${pDmg} (${zombie.hp}/${zombie.maxHp}) — it hits back for ${eDmg}!`, "l-combat");

    if (this.stats.hp <= 0) {
      this._die(`Killed by a ${ed.name}.`);
      return;
    }

    this.tick();
    UI.fullRender(this);
  }

  /**
   * Zombie attacks player (zombie initiated — ambush, gets first strike)
   */
  _zombieAmbush(zombie, isInterior) {
    let ed = C.enemies[zombie.type];
    let eDmg = Math.max(1, ed.atk - this.defense);
    this.stats.hp -= eDmg;
    this._degradeSlot('body', C.tuning.durArmor);
    this.logMsg(`${ed.icon} ${ed.name} lunges at you for ${eDmg} damage!`, "l-bad");

    if (this.stats.hp <= 0) {
      this._die(`Ambushed and killed by a ${ed.name}.`);
      return;
    }

    // Player retaliates
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
     ZOMBIE AI — spawning & movement
     ══════════════════════════════════════════════════════════ */

  _spawnZombies(count) {
    const t = C.tuning;
    let spawned = 0, attempts = 0;
    while (spawned < count && this.zombies.length < t.maxZombies && attempts++ < 200) {
      let x = Math.floor(Math.random() * C.w);
      let y = Math.floor(Math.random() * C.h);
      if (Math.abs(x - this.p.x) + Math.abs(y - this.p.y) < t.zombieSpawnBuf) continue;
      let tile = this.map[y][x];
      if (!C.tiles[tile.type].pass) continue;
      if (this.zombies.some(z => z.x === x && z.y === y)) continue;
      let tid = this._wPick(C.zombieSpawns);
      let ed = C.enemies[tid];
      this.zombies.push({ x, y, type: tid, hp: ed.hp, maxHp: ed.hp });
      spawned++;
    }
  }

  /**
   * Move zombies — each moves on its own speed timer.
   */
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
        dx = Math.sign(this.p.x - z.x);
        dy = Math.sign(this.p.y - z.y);
        if (dx !== 0 && dy !== 0) {
          if (Math.random() < .5) dx = 0; else dy = 0;
        }
      } else {
        let dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
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

      z.x = nx;
      z.y = ny;
    }
  }


  /* ══════════════════════════════════════════════════════════
     ACTIONS — scavenge, enter/exit, search, barricade, rest
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
    this.tick();
    UI.fullRender(this);
  }

  enterBuilding() {
    if (!this.alive || this.location !== 'world') return;
    let tile = this.map[this.p.y][this.p.x];
    if (tile.type !== 'house' && tile.type !== 'store') return;

    // Generate interior on first visit
    if (!tile.interior) tile.interior = Interior.generate(tile.type);
    let int = tile.interior;

    // Save world state
    this.worldPos = { x: this.p.x, y: this.p.y };
    this.currentInterior = int;
    this.currentBuildingTile = tile;
    this.location = 'interior';
    this.p = { x: int.doorPos.x, y: int.doorPos.y };

    // Spawn interior zombies (if not already cleared)
    this.interiorZombies = [];
    if (!int.cleared) {
      let openings = 0;
      for (let y = 0; y < int.h; y++)
        for (let x = 0; x < int.w; x++) {
          let c = int.map[y][x], d = C.itiles[c.type];
          if (d && d.barricadable && c.barricadeHp <= 0) openings++;
        }
      let chance = C.tuning.interiorZombieChance * openings;
      if (Math.random() < chance) {
        let count = Math.random() < 0.3 ? 2 : 1;
        for (let i = 0; i < count; i++) {
          let placed = false;
          for (let a = 0; a < 50 && !placed; a++) {
            let rx = Math.floor(Math.random() * int.w);
            let ry = Math.floor(Math.random() * int.h);
            if (C.itiles[int.map[ry][rx].type].pass && !(rx === this.p.x && ry === this.p.y)) {
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
    this.logMsg(`Entered ${tile.type === 'store' ? 'store' : 'house'}.`, "l-imp");
    this.tick();
    UI.fullRender(this);
  }

  exitBuilding() {
    if (this.location !== 'interior') return;
    let int = this.currentInterior;
    let cell = int.map[this.p.y][this.p.x];
    if (!C.itiles[cell.type].entry)
      return this.logMsg("Move to a door or window to exit.", "l-bad");
    if (this.interiorZombies.length === 0) int.cleared = true;
    this.location = 'world';
    this.p = { ...this.worldPos };
    this.currentInterior = null;
    this.currentBuildingTile = null;
    this.interiorZombies = [];
    this.logMsg("Exited building.", "l-imp");
    this.reveal();
    UI.fullRender(this);
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
    let poolName = int.buildingType === 'store' ? 'shelf_store' : 'shelf_house';
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
    this.tick();
    UI.fullRender(this);
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
    let target = targets[0];
    target.cell.barricadeHp = C.tuning.barricadeHp;
    this.gainXp('carpentry', 25);
    this._degradeSlot('tool', C.tuning.durTool);
    this.logMsg("Barricaded the opening.", "l-good");
    this.tick();
    UI.fullRender(this);
  }

  claimBuilding() {
    if (this.location !== 'interior') return;
    let int = this.currentInterior;
    if (int.claimed) return this.logMsg("Already claimed!", "l-bad");
    int.claimed = true;
    this.logMsg("Claimed this building as your home!", "l-imp");
    this.logMsg("You can now rest safely here.", "l-good");
    UI.fullRender(this);
  }


  /* ══════════════════════════════════════════════════════════
     REST — Tiered system (rough → bedroll → home)
     ══════════════════════════════════════════════════════════ */

  rest() {
    if (!this.alive) return;
    const t = C.tuning;
    let tier = this.getRestTier();

    if (!tier) {
      return this.logMsg("Can't rest here. Try outside or find shelter.", "l-bad");
    }

    // Check adjacent zombies — can't rest with zombies right next to you
    let adjZ = this.location === 'interior'
      ? this.getAdjacentInteriorZombies()
      : this.getAdjacentZombies();
    if (adjZ.length > 0) {
      return this.logMsg("Can't rest — zombies too close!", "l-bad");
    }

    let foodCost, waterCost, stmRestore, hpRestore, ticks, ambushChance;

    if (tier === 'home') {
      foodCost = t.restFoodCost;
      waterCost = t.restWaterCost;
      stmRestore = t.restStmRestore;
      hpRestore = t.restHpRestore;
      ticks = t.restTicks;
      ambushChance = 0;
    } else if (tier === 'bedroll') {
      foodCost = t.bedrollFoodCost;
      waterCost = t.bedrollWaterCost;
      stmRestore = t.bedrollStmRestore;
      hpRestore = t.bedrollHpRestore;
      ticks = t.bedrollTicks;
      ambushChance = t.bedrollAmbushChance;
    } else {
      // rough
      foodCost = t.roughFoodCost;
      waterCost = t.roughWaterCost;
      stmRestore = t.roughStmRestore;
      hpRestore = t.roughHpRestore;
      ticks = t.roughTicks;
      ambushChance = t.roughAmbushChance;
    }

    if (this.stats.food < foodCost || this.stats.h2o < waterCost) {
      return this.logMsg(`Need ${foodCost} food & ${waterCost} water to rest.`, "l-bad");
    }

    this.stats.food -= foodCost;
    this.stats.h2o -= waterCost;

    // Check for ambush interruption (rough & bedroll only)
    if (ambushChance > 0 && Math.random() < ambushChance) {
      // Interrupted! Partial rest only
      this.stats.stm = Math.min(100, this.stats.stm + Math.floor(stmRestore * 0.3));
      this.logMsg("⚠️ Woken by sounds in the dark!", "l-bad");

      // Spawn a zombie nearby
      let spawned = false;
      for (let a = 0; a < 50 && !spawned; a++) {
        let dirs = [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];
        let dir = dirs[Math.floor(Math.random() * dirs.length)];
        let sx = this.p.x + dir[0], sy = this.p.y + dir[1];
        if (sx >= 0 && sx < C.w && sy >= 0 && sy < C.h) {
          let st = this.map[sy][sx];
          if (C.tiles[st.type].pass && !this.zombies.some(z => z.x === sx && z.y === sy)) {
            let tid = this._wPick(C.zombieSpawns.filter(s => s.id !== 'brute'));
            let ed = C.enemies[tid];
            this.zombies.push({ x: sx, y: sy, type: tid, hp: ed.hp, maxHp: ed.hp });
            this.logMsg(`${ed.icon} ${ed.name} appeared nearby!`, "l-bad");
            spawned = true;
          }
        }
      }

      for (let i = 0; i < 2; i++) this.tick();
      UI.fullRender(this);
      return;
    }

    // Successful rest
    this.stats.stm = Math.min(100, this.stats.stm + stmRestore);
    this.stats.hp = Math.min(100, this.stats.hp + hpRestore);

    if (tier === 'home') {
      this.logMsg("Rested well. Stamina restored, wounds healing.", "l-good");
    } else if (tier === 'bedroll') {
      this.logMsg("Slept in your bedroll. Decent rest.", "l-good");
    } else {
      this.logMsg("Slept rough on the ground. Stiff but rested.", "l-imp");
    }

    for (let i = 0; i < ticks; i++) this.tick();
    UI.fullRender(this);
  }


  /* ══════════════════════════════════════════════════════════
     BEDROLL PLACEMENT — open-world camp system
     ══════════════════════════════════════════════════════════ */

  /**
   * Check if the player has a placeable bedroll in inventory
   */
  hasBedrollItem() {
    return this.inv.some(i => C.items[i.id].type === 'place' && C.items[i.id].placeTile === 'bedroll');
  }

  /**
   * Check if the current world tile allows bedroll placement
   */
  canPlaceBedroll() {
    if (this.location !== 'world') return false;
    let tile = this.map[this.p.y][this.p.x];
    // Can place on grass, forest, road — not on buildings, water, camp, or existing bedroll
    let allowed = ['grass', 'forest', 'road'];
    return allowed.includes(tile.type) && this.hasBedrollItem();
  }

  /**
   * Place bedroll at current position. Removes old bedroll if one exists.
   */
  placeBedroll() {
    if (!this.alive || !this.canPlaceBedroll()) return;

    // Remove old bedroll from map if one exists
    if (this.bedrollPos) {
      let old = this.map[this.bedrollPos.y][this.bedrollPos.x];
      if (old.type === 'bedroll') {
        // Restore original terrain type (default to grass)
        this.map[this.bedrollPos.y][this.bedrollPos.x] = World.tile(old._originalType || 'grass');
      }
      this.logMsg("Picked up your old bedroll.", "l-imp");
    }

    // Remember original terrain type before converting
    let currentTile = this.map[this.p.y][this.p.x];
    let origType = currentTile.type;

    // Remove bedroll kit from inventory
    let bIdx = this.inv.findIndex(i => C.items[i.id].type === 'place' && C.items[i.id].placeTile === 'bedroll');
    if (bIdx === -1) return;
    let bItem = this.inv[bIdx];
    bItem.qty--;
    if (bItem.qty <= 0) this.inv.splice(bIdx, 1);

    // Place bedroll tile
    let newTile = World.tile('bedroll');
    newTile._originalType = origType;
    this.map[this.p.y][this.p.x] = newTile;
    this.bedrollPos = { x: this.p.x, y: this.p.y };

    this.gainXp('survival', 5);
    this.logMsg("Laid out your bedroll. You can rest here now.", "l-good");
    this.tick();
    UI.fullRender(this);
  }

  /**
   * Pick up bedroll from current position, returning it to inventory.
   */
  pickupBedroll() {
    if (!this.alive || this.location !== 'world') return;
    let tile = this.map[this.p.y][this.p.x];
    if (tile.type !== 'bedroll') return;

    // Restore original terrain
    this.map[this.p.y][this.p.x] = World.tile(tile._originalType || 'grass');
    this.bedrollPos = null;

    // Return bedroll to inventory
    this.addItem('bedroll_k', 1);
    this.logMsg("Packed up your bedroll.", "l-imp");
    UI.fullRender(this);
  }


  wait() {
    if (!this.alive) return;
    this.logMsg("Waiting...");
    this.tick();
    UI.fullRender(this);
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
    if (r.result.type === 'item') {
      this.addItem(r.result.id, r.result.count || 1);
      this.logMsg(`Crafted ${r.name}.`, "l-good");
    } else if (r.result.type === 'barricade') {
      this.logMsg(`Prepared barricade materials.`, "l-good");
    }
    this._degradeSlot('tool', C.tuning.durTool);
    this.tick();
    UI.fullRender(this);
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
        if (qty <= 0) { UI.renderInventory(this); return; }
      }
    }
    while (qty > 0) {
      let a = d.stack ? Math.min(qty, d.stack) : 1;
      this.inv.push({
        id, uid: Math.random().toString(36).substr(2, 9),
        qty: a, hp: d.dur || null, maxHp: d.dur || null
      });
      qty -= a;
    }
    UI.renderInventory(this);
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
        this.logMsg("You can now barricade doors & windows.", "l-good");
      } else {
        this.gainXp(d.skill, d.xp);
        this.logMsg(`Studied ${d.name}.`, "l-imp");
      }
      this.inv.splice(idx, 1);
    }
    this.tick();
    UI.fullRender(this);
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
    this.reveal();
    UI.fullRender(this);
  }

  unequip(slot) {
    if (!this.equip[slot]) return;
    this.inv.push(this.equip[slot]);
    this.equip[slot] = null;
    this.reveal();
    UI.fullRender(this);
  }

  dropItem(uid) {
    let idx = this.inv.findIndex(i => i.uid === uid);
    if (idx === -1) return;
    this.inv.splice(idx, 1);
    UI.renderInventory(this);
  }


  /* ══════════════════════════════════════════════════════════
     UI & RPG HELPERS
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
    if (s.xp >= req) {
      s.lvl++; s.xp -= req;
      this.logMsg(`LEVEL UP! ${C.skills[sk].name} → ${s.lvl}`, "l-imp");
    }
  }

  _degradeSlot(slot, amt) {
    let it = this.equip[slot];
    if (!it || !it.maxHp) return;
    it.hp -= amt;
    if (it.hp <= 0) {
      let d = C.items[it.id];
      this.logMsg(`${d.icon} ${d.name} broke!`, "l-bad");
      this.equip[slot] = null;
    }
  }

  _die(reason) {
    this.alive = false;
    this.logMsg(reason, "l-bad");
    UI.fullRender(this);
    UI.showDeath(this);
  }

  restart() {
    UI.hideDeath();
    G = new Game();
  }


  /* ══════════════════════════════════════════════════════════
     INTERNAL HELPERS
     ══════════════════════════════════════════════════════════ */

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
    let r = this.vision;
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        let nx = this.p.x + dx, ny = this.p.y + dy;
        if (nx >= 0 && nx < C.w && ny >= 0 && ny < C.h) this.visited.add(`${nx},${ny}`);
      }
  }

  logMsg(text, cls = '') {
    this.log.unshift({ m: text, c: cls });
    UI.renderLog(this);
  }

  _initSwipe() {
    let sx, sy;
    const min = 30;
    const vp = document.getElementById('viewport');
    if (!vp) return;
    vp.addEventListener('touchstart', e => {
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    }, { passive: true });
    vp.addEventListener('touchend', e => {
      if (sx == null) return;
      let dx = e.changedTouches[0].clientX - sx;
      let dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) < min && Math.abs(dy) < min) return;
      if (Math.abs(dx) > Math.abs(dy)) this.move(dx > 0 ? 1 : -1, 0);
      else this.move(0, dy > 0 ? 1 : -1);
      sx = null;
    }, { passive: true });
  }
}


/* Init handled by inline script in index.html */
