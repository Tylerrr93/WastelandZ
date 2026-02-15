/* player_system.js - Stats and Movement */
Object.assign(Game.prototype, {
  get vision() {
    let v = C.tuning.baseVision;
    if (this.equip.tool) {
      let d = C.items[this.equip.tool.id];
      if (d.stat === 'vis') v += d.val;
    }
    if (this.isNight && this.location === 'world') v = Math.max(1, v - C.tuning.nightVisPen);
    return v;
  },

  get moveCost() {
    let c = C.tuning.moveCost;
    if (this.equip.feet) {
      let d = C.items[this.equip.feet.id];
      if (d.stat === 'mov') c -= d.val;
    }
    if (this.isEncumbered) c += C.tuning.encumberedStamPen;
    return Math.max(1, c);
  },

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
});