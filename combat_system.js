/* combat_system.js - Combat and Enemy AI */
Object.assign(Game.prototype, {
  get attack() {
    let a = C.tuning.baseDmg;
    if (this.equip.weapon) a += C.items[this.equip.weapon.id].val;
    let cl = this.skills.combat ? this.skills.combat.lvl : 0;
    a += Math.floor(cl * C.tuning.combatSkillBonus);
    return a;
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
  }
});