/* ═══════════════════════════════════════════════════════════
   WASTELAND SURVIVOR — config.js
   All game data. Add items/enemies/recipes here.
   ═══════════════════════════════════════════════════════════ */

const C = {
w: 60, h: 60,

/* ── World Tiles ─────────────────────────────────────────── */
tiles: {
  grass:   {ch:',', css:'t-grass',  pass:true,  cap:2, name:"Wild Grass",    desc:"Overgrown vegetation.", placeable:true},
  forest:  {ch:'🌲',css:'t-forest', pass:true,  cap:4, name:"Deep Woods",    desc:"Dense trees. Good cover.", placeable:true},
  water:   {ch:'≈', css:'t-water',  pass:false, cap:0, name:"Deep Water",    desc:"Impassable."},
  road:    {ch:'·', css:'t-road',   pass:true,  cap:2, name:"Old Road",      desc:"Cracked asphalt.", placeable:true},
  bridge:  {ch:'=', css:'t-bridge', pass:true,  cap:0, name:"Bridge",        desc:"Safe crossing."},
  house:   {ch:'🏠',css:'t-house',  pass:true,  cap:3, name:"Ruined House",  desc:"Enterable. Search inside."},
  store:   {ch:'🏪',css:'t-store',  pass:true,  cap:5, name:"Grocery Store", desc:"Rich pickings inside."},
  camp:    {ch:'⛺',css:'t-camp',   pass:true,  cap:0, name:"Base Camp",     desc:"Your starting camp."},
  bedroll: {ch:'🛌',css:'t-bedroll',pass:true,  cap:0, name:"Bedroll",       desc:"A rough sleeping spot. Better than bare ground."},
  shelter: {ch:'🏕️',css:'t-shelter',pass:true,  cap:0, name:"Lean-To",       desc:"A sturdy shelter. Almost feels like home."},
},

/* ── Interior Tile Types ─────────────────────────────────── */
itiles: {
  wall:   {ch:'▓', css:'it-wall',   pass:false},
  floor:  {ch:'·', css:'it-floor',  pass:true},
  door:   {ch:'╬', css:'it-door',   pass:true, entry:true, barricadable:true},
  window: {ch:'▢', css:'it-window', pass:true, entry:true, barricadable:true},
  shelf:  {ch:'📦',css:'it-shelf',  pass:false, searchable:true},
  counter:{ch:'🔲',css:'it-counter',pass:false, searchable:true},
},

/* ── Skills ──────────────────────────────────────────────── */
skills: {
  survival:  {name:"Survival",  start:true,  desc:"scavenging & searching"},
  combat:    {name:"Combat",    start:true,  desc:"damage dealt in fights"},
  carpentry: {name:"Carpentry", start:false, desc:"barricading & crafting"},
},

/* ── Items ────────────────────────────────────────────────── */
items: {
  knife:       {name:"Shiv",           type:'weapon',icon:'🔪',stat:'atk',val:3, wgt:0.5,dur:40},
  bat:         {name:"Nail Bat",       type:'weapon',icon:'🏏',stat:'atk',val:5, wgt:2.0,dur:60},
  rifle:       {name:"Old Rifle",      type:'weapon',icon:'🔫',stat:'atk',val:10,wgt:4.0,dur:25},
  flashlight:  {name:"Flashlight",     type:'tool',  icon:'🔦',stat:'vis',val:2, wgt:0.5,dur:80},
  hammer:      {name:"Hammer",         type:'tool',  icon:'🔨',stat:'vis',val:0, wgt:1.0,dur:100},
  boots:       {name:"Work Boots",     type:'feet',  icon:'🥾',stat:'mov',val:1, wgt:1.0,dur:200},
  jacket:      {name:"Leather Jacket", type:'body',  icon:'🧥',stat:'def',val:5, wgt:2.0,dur:80},
  backpack:    {name:"Hiking Pack",    type:'back',  icon:'🎒',stat:'cap',val:20,wgt:1.0},
  canned:      {name:"Canned Beans",   type:'use',   icon:'🥫',effect:'food', val:25,wgt:0.5,stack:10},
  jerky:       {name:"Dried Jerky",    type:'use',   icon:'🥩',effect:'food', val:15,wgt:0.2,stack:10},
  water_b:     {name:"Water Bottle",   type:'use',   icon:'💧',effect:'water',val:25,wgt:0.5,stack:10},
  bandage:     {name:"Bandage",        type:'use',   icon:'🩹',effect:'heal', val:20,wgt:0.1,stack:5},
  book_carp:   {name:"Carpentry Vol.1",type:'read',  icon:'📘',skill:'carpentry',xp:50,wgt:0.5},
  scrap:       {name:"Scrap Metal",    type:'mat',   icon:'⚙️',wgt:0.2,stack:50},
  wood:        {name:"Plank",          type:'mat',   icon:'🪵',wgt:1.0,stack:10},
  nails:       {name:"Box of Nails",   type:'mat',   icon:'🔩',wgt:0.1,stack:100},
  cloth:       {name:"Cloth Strip",    type:'mat',   icon:'🧵',wgt:0.1,stack:20},
  bedroll_kit: {name:"Bedroll Kit",    type:'place', icon:'🛌',placeType:'bedroll',wgt:1.5},
  shelter_kit: {name:"Lean-To Kit",    type:'place', icon:'🏕️',placeType:'shelter',wgt:3.0},
},

/* ── Enemies — add new types here + in zombieSpawns ──────── */
enemies: {
  shambler:{name:"Shambler",icon:'🧟',hp:12,atk:4, def:0,xp:15,speed:4},
  runner:  {name:"Runner",  icon:'💀',hp:8, atk:6, def:0,xp:25,speed:2},
  brute:   {name:"Brute",   icon:'👹',hp:30,atk:10,def:3,xp:50,speed:5},
},
zombieSpawns: [
  {id:'shambler',weight:10},
  {id:'runner',  weight:2},
  {id:'brute',   weight:1},
],

/* ── Recipes ─────────────────────────────────────────────── */
recipes: {
  nail_bat:    {name:"Nail Bat",    reqSkill:null,            inputs:{wood:1,nails:6},         result:{type:'item',id:'bat',count:1}},
  bandage_c:   {name:"Bandage",     reqSkill:null,            inputs:{cloth:2},                result:{type:'item',id:'bandage',count:1}},
  bedroll_c:   {name:"Bedroll Kit", reqSkill:null,            inputs:{cloth:5},                result:{type:'item',id:'bedroll_kit',count:1}},
  shelter_c:   {name:"Lean-To Kit", reqSkill:['carpentry',1], inputs:{wood:3,cloth:3,nails:4}, result:{type:'item',id:'shelter_kit',count:1}},
  barricade:   {name:"Barricade",   reqSkill:['carpentry',1], inputs:{wood:1,nails:3},         result:{type:'barricade'}},
},

/* ── Rest Tiers (progression: rough → bedroll → shelter → camp/home) ─ */
restTiers: {
  rough:   {stm:50,  hp:0,  food:10, water:10, ticks:5, label:"Rough Rest",
            msg:["Slept fitfully on the cold ground.", "Dozed off against a tree. Every sound jolts you awake.", "Barely slept. Your back aches something fierce."]},
  bedroll: {stm:80,  hp:10, food:7,  water:7,  ticks:3, label:"Bedroll",
            msg:["The bedroll keeps the worst of the cold out.", "Managed some real sleep for once.", "Not luxury, but the bedroll helps."]},
  shelter: {stm:100, hp:20, food:5,  water:5,  ticks:3, label:"Lean-To",
            msg:["Sheltered from the wind. Slept well.", "The lean-to kept you hidden and warm.", "Proper rest under cover. Feeling strong."]},
  camp:    {stm:100, hp:15, food:5,  water:5,  ticks:3, label:"Camp",
            msg:["Rested at camp. Familiar ground.", "Home base. You sleep soundly.", "Camp rest. Ready to move."]},
  home:    {stm:100, hp:25, food:5,  water:5,  ticks:3, label:"Home",
            msg:["Slept behind barricaded walls. Wounds healing.", "The closest thing to safety out here.", "A full rest in your claimed home. Refreshed."]},
},

/* ── Loot Pools ──────────────────────────────────────────── */
lootPools: {
  nature:     [{id:'wood',weight:15},{id:'cloth',weight:4},{id:'book_carp',weight:1}],
  road:       [{id:'scrap',weight:10},{id:'water_b',weight:5},{id:'nails',weight:8},{id:'knife',weight:2}],
  house:      [{id:'canned',weight:8},{id:'water_b',weight:8},{id:'bandage',weight:5},{id:'nails',weight:8},{id:'book_carp',weight:2},{id:'knife',weight:3},{id:'cloth',weight:6}],
  store:      [{id:'canned',weight:15},{id:'water_b',weight:12},{id:'bandage',weight:6},{id:'backpack',weight:2},{id:'boots',weight:2},{id:'flashlight',weight:3},{id:'jerky',weight:8}],
  shelf_house:[{id:'canned',weight:10},{id:'water_b',weight:10},{id:'bandage',weight:8},{id:'cloth',weight:8},{id:'nails',weight:10},{id:'hammer',weight:3},{id:'knife',weight:4},{id:'jacket',weight:2},{id:'book_carp',weight:3}],
  shelf_store:[{id:'canned',weight:15},{id:'water_b',weight:15},{id:'bandage',weight:10},{id:'jerky',weight:10},{id:'backpack',weight:3},{id:'flashlight',weight:5},{id:'boots',weight:3},{id:'rifle',weight:1}],
},
tileLoot: {grass:'nature', forest:'nature', road:'road', house:'house', store:'store'},

/* ── Interior Layouts (# wall, . floor, D door, W window, S shelf) ── */
layouts: {
  house: [
    ["#######","#S...S#","#.....#","##.D.##","#S...S#","#.....#","#W#.#W#"],
    ["#######","#S....#","#.....#","#..####","#S..S.#","#.....#","#W#D#W#"],
    ["#######","#.S.S.#","#.....#","#.....#","#.....#","#S...S#","##WDW##"],
  ],
  store: [
    ["#########","#.S.S.S.#","#.......#","#.S.S.S.#","#.......#","#.......#","####D####"],
    ["#########","#S.....S#","#.......#","#.S.S.S.#","#.......#","#S.....S#","####D####"],
  ],
},

startItems: ['canned','canned','water_b','water_b','knife','bandage','bandage','hammer','nails','wood','wood','book_carp'],

player: {hp:100, stm:100, food:80, h2o:80, maxWeight:15},

/* ── Tuning Constants ────────────────────────────────────── */
tuning: {
  // Vision & Movement
  baseVision:     3,
  nightVisPen:    1,
  moveCost:       2,
  encumberedStamPen: 2,

  // Resource Costs
  scavengeCost:   8,
  searchCost:     5,
  scavengeChance: 0.45,

  // Survival Drain
  tickHunger:     0.25,
  tickThirst:     0.4,
  starveDmg:      1,

  // Combat
  baseDmg:        1,
  combatSkillBonus: 0.5,
  durWeapon:      1,
  durArmor:       1,
  durTool:        1,

  // Day/Night Cycle
  turnsPerDay:    24,
  nightRatio:     0.35,

  // Zombie Spawning & AI
  initZombies:    4,
  zombiesPerNight:2,
  zombieEsc:      0.3,     // extra zombies per day
  maxZombies:     20,
  zombieAggro:    5,       // tiles before zombie chases
  zombieSpawnBuf: 10,      // min distance from player to spawn

  // Building Interiors
  interiorZombieChance: 0.25,
  barricadeHp:    50,
},

worldGen: {
  cityCount:6, cityMinEdgeBuffer:5, cityCoreDist:2,
  citySuburbDist:5, citySuburbChance:0.4, storeChance:0.3,
  terrainWaterThreshold:1.8, terrainForestThreshold:1.2,
},
};
