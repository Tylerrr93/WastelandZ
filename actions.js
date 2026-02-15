/* ═══════════════════════════════════════════════════════════
   WASTELAND SURVIVOR — actions.js
   Movement & Interactions
   ═══════════════════════════════════════════════════════════ */

Object.assign(Game.prototype, {
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
  },

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
  },

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
  },

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
  },

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
  },

  useStairs() {
    if (this.location !== 'interior' || !this.currentBuilding) return;
    let int = this.currentInterior;
    let cell = int.map[this.p.y][this.p.x];
    let def = C.itiles[cell.type];
    if (!def.stair) return this.logMsg("Not on stairs.", "l-bad");

    let building = this.currentBuilding;
    let newFloor = this.currentFloor === 0 ? 1 : 0;
    if (newFloor >= building.floors.length) return this.logMsg("Nowhere to go.", "l-bad");

    let floor = building.floors[newFloor];
    let targetPos = Interior.findStairs(floor, 'stairs_up') || Interior.findStairs(floor, 'stairs_down');
    if (!targetPos) targetPos = floor.entryPos;

    this.currentFloor = newFloor;
    this.currentInterior = floor;
    this.p = { x: targetPos.x, y: targetPos.y };
    this.interiorZombies = [];
    this.logMsg(`${def.stair === 'down' ? 'Descended' : 'Ascended'} to ${floor.label}.`, "l-imp");
    this.tick(); UI.fullRender(this);
  },

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
  },

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
  },

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
  },

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
  },

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
    
    // Initialize storage if it's a container type
    if (C.itiles[d.placeType].container) {
       cell.storage = [];
    }
    
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
});