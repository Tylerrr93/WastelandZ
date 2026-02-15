/* ═══════════════════════════════════════════════════════════
   WASTELAND SURVIVOR — combat.js
   Combat Stats, Actions & Zombie AI
   ═══════════════════════════════════════════════════════════ */

/* Computed Properties */
Object.defineProperties(Game.prototype, {
  attack: {
    get: function() {
      let a = C.tuning.baseDmg;
      if (this.equip.weapon) a += C.items[this.equip.weapon.id].val;
      let cl = this.skills.combat ? this.skills.combat.lvl : 0;
      a += Math.floor(cl * C.tuning.combatSkillBonus);
      return a;
    }
  },
  defense: {
    get: function() {
      let d = 0;
      if (this.equip.body) {
        let i = C.items[this.equip.body.id];
        if (i.stat === 'def') d += i.val;
      }
      return d;
    }
  }
});

/* Methods */
Object.assign(Game.prototype, {
  getAdjacentZombies() {
    if (this.location !== 'world') return [];
    return this.zombies.filter(z => {
      let dx = Math.abs(z.x - this.p.x), dy = Math.abs(z.y - this.p.y);
      return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    });
  },

  getAdjacentInteriorZombies() {
    if (this.location !== 'interior') return [];
    return this.interiorZombies.filter(z => {
      let dx = Math.abs(z.x - this.p.x), dy = Math.abs(z.y - this.p.y);
      return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    });
  },

  getNearbyZombieCount() {
    let count = 0;
    for (let z of this.zombies)
      if (Math.abs(z.x - this.p.x) + Math.abs(z.y - this.p.y) <= this.vision) count++;
    return count;
  },

  attackZombie(zx, zy, isInterior) {
    if (!this.alive) return;
    let zombieList = isInterior ? this.interiorZombies : this.zombies;
    let z = zombieList.find(z => z.x === zx && z.y === zy);
    if (!z) return;
    this._playerAttack(z, isInterior);
  },

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
  },

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
  },

  /* Zombie AI */
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
  },

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
});