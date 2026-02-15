/* inventory_system.js - Item Management */
Object.assign(Game.prototype, {
  get weight() {
    let w = 0;
    this.inv.forEach(i => { w += (C.items[i.id].wgt || 0) * i.qty; });
    for (let k in this.equip) if (this.equip[k]) w += C.items[this.equip[k].id].wgt || 0;
    return parseFloat(w.toFixed(1));
  },

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
  }
});