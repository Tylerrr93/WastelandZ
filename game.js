/* ═══════════════════════════════════════════════════════════
   WASTELAND SURVIVOR — game.js
   Core Shell & World Logic
   ═══════════════════════════════════════════════════════════ */

let G; // global game instance

class Game {
  constructor(skipIntro) {
    this.map = World.create();
    this.log = [];
    this.inv = [];
    this.equip = { weapon: null, tool: null, body: null, feet: null, back: null };
    this.stats = { ...C.player };
    this.prevStats = { ...C.player };
    this.skills = {};
    this.visited = new Set();
    this.alive = true;
    this.turn = 0;
    this.kills = 0;
    this.zombies = [];
    this._lastNight = -1;
    this.groundItems = {}; 

    // Interior state
    this.location = 'world';
    this.worldPos = null;
    this.currentBuilding = null;
    this.currentFloor = 0;
    this.currentInterior = null;
    this.currentBuildingTile = null;
    this.interiorZombies = [];

    for (let k in C.skills) {
      if (C.skills[k].start) this.skills[k] = { lvl: 1, xp: 0 };
    }

    // Find start, place bunker hatch
    this.p = this._findStart();
    let hatchTile = World.tile('bunker_hatch');
    hatchTile.interior = Interior.generateBunker();
    this.map[this.p.y][this.p.x] = hatchTile;

    C.startItems.forEach(id => this.addItem(id));
    this._spawnZombies(C.tuning.initZombies);

    // Start player INSIDE bunker
    let bunkerBuilding = hatchTile.interior;
    let floor0 = bunkerBuilding.floors[0];
    this.worldPos = { x: this.p.x, y: this.p.y };
    this.currentBuilding = bunkerBuilding;
    this.currentFloor = 0;
    this.currentInterior = floor0;
    this.currentBuildingTile = hatchTile;
    this.location = 'interior';
    this.p = { x: floor0.entryPos.x, y: floor0.entryPos.y };

    this.reveal();

    // Show intro or skip to game
    if (!skipIntro) {
      UI.showIntro(() => {
        UI.fullRender(this);
        this.logMsg("Read the Carpentry book to learn building.", "l-imp");
        this.logMsg("Use the ladder to reach the surface.", "l-imp");
      });
    } else {
      UI.fullRender(this);
      this.logMsg("Read the Carpentry book to learn building.", "l-imp");
      this.logMsg("Use the ladder to reach the surface.", "l-imp");
    }
    this._initSwipe();
  }

  /* ── Core Loop ── */
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

  /* ── Computed Properties (Time) ── */
  get day() { return Math.floor(this.turn / C.tuning.turnsPerDay) + 1; }
  get isNight() { return (this.turn % C.tuning.turnsPerDay) / C.tuning.turnsPerDay >= (1 - C.tuning.nightRatio); }
  get timeOfDay() {
    let p = (this.turn % C.tuning.turnsPerDay) / C.tuning.turnsPerDay;
    return p < .25 ? 'Morning' : p < .5 ? 'Midday' : p < .65 ? 'Afternoon' : p < .75 ? 'Evening' : 'Night';
  }

  /* ── Helpers ── */
  setTab(name) {
    document.querySelectorAll('.tc').forEach(e => e.classList.remove('on'));
    document.querySelectorAll('.tb').forEach(e => e.classList.remove('on'));
    document.getElementById('tab-' + name).classList.add('on');
    document.querySelectorAll('.tb').forEach(b => { if (b.dataset.tab === name) b.classList.add('on'); });
  }

  logMsg(text, cls = '') { this.log.unshift({ m: text, c: cls }); UI.renderLog(this); }
  
  _die(reason) { this.alive = false; this.logMsg(reason, "l-bad"); UI.fullRender(this); UI.showDeath(this); }
  
  restart() { UI.hideDeath(); G = new Game(true); }

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
    let r = this.vision, px = this.worldPos ? this.worldPos.x : this.p.x, py = this.worldPos ? this.worldPos.y : this.p.y;
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        let nx = px + dx, ny = py + dy;
        if (nx >= 0 && nx < C.w && ny >= 0 && ny < C.h) this.visited.add(`${nx},${ny}`);
      }
  }

  _initSwipe() {
    let sx, sy; const min = 30;
    const vp = document.getElementById('viewport');
    if (!vp) return;
    vp.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    vp.addEventListener('touchend', e => {
      if (sx == null) return;
      let dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) < min && Math.abs(dy) < min) return;
      if (Math.abs(dx) > Math.abs(dy)) this.move(dx > 0 ? 1 : -1, 0);
      else this.move(0, dy > 0 ? 1 : -1);
      sx = null;
    }, { passive: true });
  }
}