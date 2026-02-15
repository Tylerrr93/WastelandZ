/* ═══════════════════════════════════════════════════════════
   WASTELAND SURVIVOR — inventory.js
   Items, Crafting & Containers
   ═══════════════════════════════════════════════════════════ */

/* Computed Properties */
Object.defineProperties(Game.prototype, {
  weight: {
    get: function() {
      let w = 0;
      this.inv.forEach(i => { w += (C.items[i.id].wgt || 0) * i.qty; });
      for (let k in this.equip) if (this.equip[k]) w += C.items[this.equip[k].id].wgt || 0;
      return parseFloat(w.toFixed(1));
    }
  },
  maxWeight: {
    get: function() {
      let b = C.player.maxWeight;
      if (this.equip.back) b += C.items[this.equip.back.id].val;
      return b;
    }
  },
  isEncumbered: {
    get: function() { return this.weight > this.maxWeight; }
  }
});

/* Methods */
Object.assign(Game.prototype, {
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
  },

  countItem(id) { return this.inv.reduce((s, i) => s + (i.id === id ? i.qty : 0), 0); },

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
  },

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
  },

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
  },

  unequip(slot) {
    if (!this.equip[slot]) return;
    this.inv.push(this.equip[slot]);
    this.equip[slot] = null;
    this.reveal(); UI.fullRender(this);
  },

  dropItem(uid) {
    let idx = this.inv.findIndex(i => i.uid === uid);
    if (idx === -1) return;
    let item = this.inv[idx], d = C.items[item.id];
    let posKey = this._groundKey();
    if (!this.groundItems[posKey]) this.groundItems[posKey] = [];
    this.groundItems[posKey].push({ id: item.id, qty: 1 });
    item.qty--;
    if (item.qty <= 0) this.inv.splice(idx, 1);
    this.logMsg(`Dropped ${d.icon} ${d.name}.`);
    UI.flashTab('ground');
    UI.fullRender(this);
  },

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
  },

  getGroundItems() {
    let posKey = this._groundKey();
    return this.groundItems[posKey] || [];
  },

  _groundKey() {
    if (this.location === 'interior') {
      let wp = this.worldPos;
      return `i:${wp.x},${wp.y}:f${this.currentFloor}:${this.p.x},${this.p.y}`;
    }
    return `w:${this.p.x},${this.p.y}`;
  },

  _degradeSlot(slot, amt) {
    let it = this.equip[slot];
    if (!it || !it.maxHp) return;
    it.hp -= amt;
    if (it.hp <= 0) {
      this.logMsg(`${C.items[it.id].icon} ${C.items[it.id].name} broke!`, "l-bad");
      this.equip[slot] = null;
    }
  },

  /* Containers */
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
  },

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
    this.logMsg(`Stored ${d.icon} ${d.name}.`, "l-good");
    UI.fullRender(this);
  },

  retrieveFromContainer(storageIdx) {
    let containers = this.getAdjacentContainers();
    if (containers.length === 0) return;
    let container = containers[0].cell;
    if (!container.storage || storageIdx >= container.storage.length) return;
    let si = container.storage[storageIdx];
    this.addItem(si.id, si.qty);
    container.storage.splice(storageIdx, 1);
    this.logMsg(`Retrieved ${C.items[si.id].icon} ${C.items[si.id].name}.`, "l-good");
    UI.fullRender(this);
  },

  /* Crafting */
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
});