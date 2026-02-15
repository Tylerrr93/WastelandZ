/* game.js - The Core Shell */
let G;

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

    this.p = this._findStart();
    let hatchTile = World.tile('bunker_hatch');
    hatchTile.interior = Interior.generateBunker();
    this.map[this.p.y][this.p.x] = hatchTile;

    C.startItems.forEach(id => this.addItem(id));
    this._spawnZombies(C.tuning.initZombies);

    // Initial State (Bunker)
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

    if (!skipIntro) {
      UI.showIntro(() => { UI.fullRender(this); this._initLogs(); });
    } else {
      UI.fullRender(this); this._initLogs();
    }
    this._initSwipe();
  }

  _initLogs() {
    this.logMsg("Read the Carpentry book to learn building.", "l-imp");
    this.logMsg("Use the ladder to reach the surface.", "l-imp");
  }

  // Common Getters
  get day() { return Math.floor(this.turn / C.tuning.turnsPerDay) + 1; }
  get isNight() { return (this.turn % C.tuning.turnsPerDay) / C.tuning.turnsPerDay >= (1 - C.tuning.nightRatio); }
  get timeOfDay() {
    let p = (this.turn % C.tuning.turnsPerDay) / C.tuning.turnsPerDay;
    return p < .25 ? 'Morning' : p < .5 ? 'Midday' : p < .65 ? 'Afternoon' : p < .75 ? 'Evening' : 'Night';
  }

  // Helpers
  logMsg(text, cls = '') { this.log.unshift({ m: text, c: cls }); UI.renderLog(this); }
  _die(reason) { this.alive = false; this.logMsg(reason, "l-bad"); UI.fullRender(this); UI.showDeath(this); }
  restart() { UI.hideDeath(); G = new Game(true); }
}