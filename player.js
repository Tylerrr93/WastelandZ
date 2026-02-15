/* ═══════════════════════════════════════════════════════════
   WASTELAND SURVIVOR — player.js
   Stats, Skills, and Resting
   ═══════════════════════════════════════════════════════════ */

/* Computed Properties */
Object.defineProperties(Game.prototype, {
  vision: {
    get: function() {
      let v = C.tuning.baseVision;
      if (this.equip.tool) {
        let d = C.items[this.equip.tool.id];
        if (d.stat === 'vis') v += d.val;
      }
      if (this.isNight && this.location === 'world') v = Math.max(1, v - C.tuning.nightVisPen);
      return v;
    }
  },
  moveCost: {
    get: function() {
      let c = C.tuning.moveCost;
      if (this.equip.feet) {
        let d = C.items[this.equip.feet.id];
        if (d.stat === 'mov') c -= d.val;
      }
      if (this.isEncumbered) c += C.tuning.encumberedStamPen;
      return Math.max(1, c);
    }
  }
});

/* Methods */
Object.assign(Game.prototype, {
  gainXp(sk, amt) {
    if (!this.skills[sk]) return;
    let s = this.skills[sk];
    s.xp += amt;
    let req = s.lvl * 100;
    if (s.xp >= req) { s.lvl++; s.xp -= req; this.logMsg(`LEVEL UP! ${C.skills[sk].name} → ${s.lvl}`, "l-imp"); }
  },

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
  },

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
  },

  wait() {
    if (!this.alive) return;
    this.logMsg("Waiting...");
    this.tick(); UI.fullRender(this);
  }
});