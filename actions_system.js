/* actions_system.js - Player Interactions */
Object.assign(Game.prototype, {
  move(dx, dy) {
    if (!this.alive) return;
    let nx = this.p.x + dx, ny = this.p.y + dy;

    if (this.location === 'world') {
      if (nx < 0 || nx >= C.w || ny < 0 || ny >= C.h) return;
      if (!C.tiles[this.map[ny][nx].type].pass) return;
      
      // Check for zombies in the target tile
      let z = this.zombies.find(z => z.x === nx && z.y === ny);
      if (z) return this._playerAttack(z, false);
    } else {
      if (nx < 0 || nx >= this.currentInterior.w || ny < 0 || ny >= this.currentInterior.h) return;
      if (!C.itiles[this.currentInterior.map[ny][nx].type].pass) return;
      
      let z = this.interiorZombies.find(z => z.x === nx && z.y === ny);
      if (z) return this._playerAttack(z, true);
    }

    this.p.x = nx; this.p.y = ny;
    this.stats.stm = Math.max(0, this.stats.stm - this.moveCost);
    this.reveal();
    this.tick();
    UI.fullRender(this);
  },

  scavenge() {
    if (this.location !== 'world') return;
    let tile = this.map[this.p.y][this.p.x];
    if (tile.loot <= 0) return this.logMsg("Nothing left here.", "l-bad");
    
    this.stats.stm -= C.tuning.scavengeCost;
    if (Math.random() < C.tuning.scavengeChance) {
      let pool = C.tileLoot[tile.type];
      let id = World._wPick(C.lootPools[pool]);
      this.addItem(id);
      tile.loot--;
      this.logMsg(`Found ${C.items[id].icon} ${C.items[id].name}!`, "l-good");
    } else {
      this.logMsg("Found nothing of use.");
    }
    this.tick();
    UI.fullRender(this);
  },

  enterBuilding() {
    let tile = this.map[this.p.y][this.p.x];
    if (!C.tiles[tile.type].enter) return;
    
    if (!tile.interior) tile.interior = Interior.generate(tile.type);
    
    this.worldPos = { x: this.p.x, y: this.p.y };
    this.currentBuilding = tile.interior;
    this.currentFloor = 0;
    this.currentInterior = tile.interior.floors[0];
    this.location = 'interior';
    this.p = { ...this.currentInterior.entryPos };
    
    this.logMsg(`Entered ${C.tiles[tile.type].name}.`, "l-imp");
    this.tick();
    UI.fullRender(this);
  },

  exitBuilding() {
    if (this.location !== 'interior' || this.currentFloor !== 0) return;
    this.location = 'world';
    this.p = { ...this.worldPos };
    this.currentBuilding = null;
    this.currentInterior = null;
    this.logMsg("Back outside.");
    this.tick();
    UI.fullRender(this);
  },

  wait() {
    this.logMsg("You wait a moment...");
    this.stats.stm = Math.min(C.player.stm, this.stats.stm + 5);
    this.tick();
    UI.fullRender(this);
  }
});