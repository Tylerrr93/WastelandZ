/* world_system.js - World Logic & Spawning */
Object.assign(Game.prototype, {
  _findStart() {
    for (let i = 0; i < 500; i++) {
      let x = Math.floor(Math.random() * C.w), y = Math.floor(Math.random() * C.h);
      if (C.tiles[this.map[y][x].type].pass) return { x, y };
    }
    return { x: Math.floor(C.w / 2), y: Math.floor(C.h / 2) };
  },

  reveal() {
    let r = this.vision;
    if (this.location === 'interior') return;
    for (let y = this.p.y - r; y <= this.p.y + r; y++) {
      for (let x = this.p.x - r; x <= this.p.x + r; x++) {
        if (x >= 0 && x < C.w && y >= 0 && y < C.h) this.visited.add(`${x},${y}`);
      }
    }
  },

  _spawnZombies(n) {
    for (let i = 0; i < n; i++) {
      let p = this._findZombieSpawn();
      if (p) {
        let type = World._wPick(C.zombieSpawns);
        this.zombies.push({ ...p, type, hp: C.enemies[type].hp, maxHp: C.enemies[type].hp });
      }
    }
  },

  _findZombieSpawn() {
    const b = C.tuning.zombieSpawnBuf;
    for (let i = 0; i < 100; i++) {
      let x = Math.floor(Math.random() * C.w), y = Math.floor(Math.random() * C.h);
      let d = Math.max(Math.abs(x - this.p.x), Math.abs(y - this.p.y));
      if (d >= b && C.tiles[this.map[y][x].type].pass) return { x, y };
    }
    return null;
  },

  _initSwipe() {
    let ts;
    document.addEventListener('touchstart', e => { ts = { x: e.touches[0].clientX, y: e.touches[0].clientY }; });
    document.addEventListener('touchend', e => {
      if (!ts) return;
      let dx = e.changedTouches[0].clientX - ts.x, dy = e.changedTouches[0].clientY - ts.y;
      if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
        if (Math.abs(dx) > Math.abs(dy)) this.move(dx > 0 ? 1 : -1, 0);
        else this.move(0, dy > 0 ? 1 : -1);
      }
      ts = null;
    });
  }
});