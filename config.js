/* ═══════════════════════════════════════════════════════════
   WASTELAND SURVIVOR — config.js
   All game data, balancing, and visual configuration.
   ═══════════════════════════════════════════════════════════ */

const C = {
  w: 60, h: 60,

  /* ── Visual Configuration ────────────────────────────────── */
  visuals: {
    // Options: 'emoji', 'ascii', 'hybrid' (uses emoji if avail, else ascii)
    mode: 'hybrid',
    // If true, selects a random character from the array for static tiles (trees, grass)
    randomize: true, 
  },

  /* ── World Tiles ─────────────────────────────────────────── */
  // 'visual' can be a string or an array of strings (for randomization)
  tiles: {
    grass:        {visual:['.','`',',','⁖'], color:'#4a7a4a', bg:'#1b261b', pass:true, cap:2, name:"Wild Grass", desc:"Overgrown vegetation."},
    forest:       {visual:['🌲','🌳','↟'],   color:'#1b381b', bg:'#0a140a', pass:true, cap:4, name:"Deep Woods", desc:"Dense trees. Good cover."},
    water:        {visual:['≈','~'],         color:'#81cdf0', bg:'#2b6cb0', pass:false,cap:0, name:"Deep Water", desc:"Impassable."},
    road:         {visual:'·',               color:'#444',    bg:'#262626', pass:true, cap:2, name:"Old Road",   desc:"Cracked asphalt.", placeable:true},
    bridge:       {visual:'=',               color:'#555',    bg:'#1a1a1a', pass:true, cap:0, name:"Bridge",     desc:"Safe crossing."},
    house:        {visual:'🏚️',              color:'#a89f91', bg:'#3d342b', pass:true, cap:3, name:"Abandoned House", desc:"Enterable.", enter:true, buildName:"House"},
    store:        {visual:'🛒',              color:'#90a4ae', bg:'#263238', pass:true, cap:5, name:"Looted Store",    desc:"Rich pickings.", enter:true, buildName:"Store"},
    garage:       {visual:'⚙️',              color:'#a0887a', bg:'#302a28', pass:true, cap:3, name:"Auto Garage",     desc:"Industrial.",    enter:true, buildName:"Garage"},
    clinic:       {visual:'➕',              color:'#80b0c0', bg:'#1a2830', pass:true, cap:4, name:"Medical Clinic",  desc:"Sterile.",       enter:true, buildName:"Clinic"},
    warehouse:    {visual:'📦',              color:'#909098', bg:'#2a2a30', pass:true, cap:6, name:"Warehouse",       desc:"Storage.",       enter:true, buildName:"Warehouse"},
    bunker_hatch: {visual:'🔒',              color:'#d29922', bg:'#2e221b', pass:true, cap:0, name:"Bunker Hatch",    desc:"Home.",          enter:true, buildName:"Bunker"},
    bedroll:      {visual:'🛌',              color:'#a89070', bg:'#2a2520', pass:true, cap:0, name:"Bedroll",         desc:"Rest spot."},
    shelter:      {visual:'🏕️',              color:'#8aaa60', bg:'#2a2e1b', pass:true, cap:0, name:"Lean-To",         desc:"Shelter."},
  },

  /* ── Interior Tile Types ─────────────────────────────────── */
  // container: true => can store items. 
  // searchable: true => has initial loot that generates into storage when searched.
  itiles: {
    wall:       {visual:'▓', bg:'#2a2520', color:'#4a4540', pass:false},
    floor:      {visual:'·', bg:'#1a1815', color:'#333',    pass:true},
    door:       {visual:'╬', bg:'#3a3020', color:'#d29922', pass:true, entry:true, barricadable:true},
    window:     {visual:'▢', bg:'#1a2530', color:'#5588aa', pass:true, entry:true, barricadable:true},
    
    // Containers
    shelf:      {visual:'📦',bg:'#3d342b', color:'#cba86a', pass:false, container:true, searchable:true, salvageable:true, name:"Shelf"},
    counter:    {visual:'🔲',bg:'#2a2828', color:'#888',    pass:false, container:true, searchable:true, salvageable:true, name:"Counter"},
    crate:      {visual:'📦',bg:'#3a3020', color:'#e8b830', pass:false, container:true, salvageable:true, name:"Crate"},
    chest:      {visual:'🔒',bg:'#4a3b2a', color:'#c8a050', pass:false, container:true, salvageable:true, name:"Chest"},

    ladder:     {visual:'🪜',bg:'#2a2210', color:'#e8b830', pass:true, entry:true},
    stairs_up:  {visual:'▲', bg:'#1a2a20', color:'#50c878', pass:true, stair:'up'},
    stairs_down:{visual:'▼', bg:'#2a1a1a', color:'#c87850', pass:true, stair:'down'},
    
    // Player built / special
    pwall:      {visual:'▓', bg:'#3a3530', color:'#6a6560', pass:false, salvageable:true},
    pdoor:      {visual:'╬', bg:'#3a3020', color:'#c8a040', pass:true, barricadable:true, salvageable:true},
    bwall:      {visual:'█', bg:'#1a1520', color:'#3a3040', pass:false},
    bfloor:     {visual:'░', bg:'#12101a', color:'#2a2838', pass:true},
  },

  /* ── Salvage Yields ─────────────────────────────────────── */
  salvageYields: {
    shelf:   [{id:'wood',qty:1},{id:'nails',min:1,max:3}],
    counter: [{id:'scrap',qty:1},{id:'nails',min:0,max:2}],
    pwall:   [{id:'wood',qty:1},{id:'nails',min:1,max:2}],
    pdoor:   [{id:'wood',qty:1},{id:'nails',qty:1}],
    crate:   [{id:'wood',qty:2},{id:'nails',min:1,max:3},{id:'scrap',qty:1}],
    chest:   [{id:'wood',qty:3},{id:'nails',qty:2}],
  },

  /* ── Skills ──────────────────────────────────────────────── */
  skills: {
    survival:  {name:"Survival",  start:true,  desc:"scavenging & searching"},
    combat:    {name:"Combat",    start:true,  desc:"damage dealt in fights"},
    carpentry: {name:"Carpentry", start:false, desc:"barricading & building"},
  },

  /* ── Items ────────────────────────────────────────────────── */
  // type: 'iplace' means it places an INTERIOR tile.
  items: {
    knife:       {name:"Shiv",           type:'weapon',icon:'🔪',stat:'atk',val:3, wgt:0.5,dur:40},
    pipe:        {name:"Lead Pipe",      type:'weapon',icon:'🔧',stat:'atk',val:4, wgt:1.5,dur:50},
    bat:         {name:"Nail Bat",       type:'weapon',icon:'🏏',stat:'atk',val:5, wgt:2.0,dur:60},
    rifle:       {name:"Old Rifle",      type:'weapon',icon:'🔫',stat:'atk',val:10,wgt:4.0,dur:25},
    torch:       {name:"Torch",          type:'tool',  icon:'🔥',stat:'vis',val:1, wgt:0.5,dur:30},
    flashlight:  {name:"Flashlight",     type:'tool',  icon:'🔦',stat:'vis',val:2, wgt:0.5,dur:80},
    hammer:      {name:"Hammer",         type:'tool',  icon:'🔨',stat:'vis',val:0, wgt:1.0,dur:100},
    boots:       {name:"Work Boots",     type:'feet',  icon:'🥾',stat:'mov',val:1, wgt:1.0,dur:200},
    jacket:      {name:"Leather Jacket", type:'body',  icon:'🧥',stat:'def',val:5, wgt:2.0,dur:80},
    backpack:    {name:"Hiking Pack",    type:'back',  icon:'🎒',stat:'cap',val:20,wgt:1.0},
    canned:      {name:"Canned Beans",   type:'use',   icon:'🥫',effect:'food', val:25,wgt:0.5,stack:10},
    jerky:       {name:"Dried Jerky",    type:'use',   icon:'🥩',effect:'food', val:15,wgt:0.2,stack:10},
    water_b:     {name:"Water Bottle",   type:'use',   icon:'💧',effect:'water',val:25,wgt:0.5,stack:10},
    bandage:     {name:"Bandage",        type:'use',   icon:'🩹',effect:'heal', val:20,wgt:0.1,stack:5},
    med_kit:     {name:"First Aid Kit",  type:'use',   icon:'🏥',effect:'heal', val:40,wgt:0.5,stack:3},
    book_carp:   {name:"Carpentry Vol.1",type:'read',  icon:'📘',skill:'carpentry',xp:50,wgt:0.5},
    scrap:       {name:"Scrap Metal",    type:'mat',   icon:'⚙️',wgt:0.2,stack:50},
    wood:        {name:"Plank",          type:'mat',   icon:'🪵',wgt:1.0,stack:10},
    nails:       {name:"Box of Nails",   type:'mat',   icon:'🔩',wgt:0.1,stack:100},
    cloth:       {name:"Cloth Strip",    type:'mat',   icon:'🧵',wgt:0.1,stack:20},
    bedroll_kit: {name:"Bedroll Kit",    type:'place', icon:'🛌',placeType:'bedroll',wgt:1.5},
    shelter_kit: {name:"Lean-To Kit",    type:'place', icon:'🏕️',placeType:'shelter',wgt:3.0},
    wall_frame:  {name:"Wall Frame",     type:'iplace',icon:'🧱',placeType:'pwall',wgt:2.0},
    door_frame:  {name:"Door Frame",     type:'iplace',icon:'🚪',placeType:'pdoor',wgt:1.5},
    crate_kit:   {name:"Storage Crate",  type:'iplace',icon:'📦',placeType:'crate',wgt:3.0},
    chest_kit:   {name:"Wooden Chest",   type:'iplace',icon:'🔒',placeType:'chest',wgt:3.0}, // New Item
  },

  /* ── Enemies ─────────────────────────────────────────────── */
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
    bandage_c:   {name:"Bandage",      cat:'survival', reqSkill:null,            inputs:{cloth:2},                result:{type:'item',id:'bandage',count:1}},
    torch_c:     {name:"Torch",        cat:'survival', reqSkill:null,            inputs:{wood:1,cloth:2},         result:{type:'item',id:'torch',count:1}},
    med_kit_c:   {name:"First Aid Kit",cat:'survival', reqSkill:null,            inputs:{bandage:2,cloth:1},      result:{type:'item',id:'med_kit',count:1}},
    bedroll_c:   {name:"Bedroll Kit",   cat:'survival', reqSkill:null,            inputs:{cloth:5},                result:{type:'item',id:'bedroll_kit',count:1}},
    pipe_c:      {name:"Lead Pipe",    cat:'combat',   reqSkill:null,            inputs:{scrap:2},                result:{type:'item',id:'pipe',count:1}},
    nail_bat:    {name:"Nail Bat",     cat:'combat',   reqSkill:null,            inputs:{wood:1,nails:6},         result:{type:'item',id:'bat',count:1}},
    wall_frame:  {name:"Wall Frame",   cat:'building', reqSkill:['carpentry',1], inputs:{wood:2,nails:4},         result:{type:'item',id:'wall_frame',count:1}},
    door_frame:  {name:"Door Frame",   cat:'building', reqSkill:['carpentry',1], inputs:{wood:2,nails:2},         result:{type:'item',id:'door_frame',count:1}},
    shelter_c:   {name:"Lean-To Kit",  cat:'building', reqSkill:['carpentry',1], inputs:{wood:3,cloth:3,nails:4}, result:{type:'item',id:'shelter_kit',count:1}},
    crate_c:     {name:"Storage Crate",cat:'building', reqSkill:['carpentry',1], inputs:{wood:3,nails:4,scrap:1}, result:{type:'item',id:'crate_kit',count:1}},
    chest_c:     {name:"Wooden Chest", cat:'building', reqSkill:['carpentry',2], inputs:{wood:5,nails:4},         result:{type:'item',id:'chest_kit',count:1}}, // New Recipe
  },

  /* ── Rest Tiers ──────────────────────────────────────────── */
  restTiers: {
    rough:   {stm:50,  hp:0,  food:10, water:10, ticks:5, label:"Rough Rest",
              msg:["Slept fitfully on the cold ground.", "Dozed off against a tree.", "Barely slept."]},
    bedroll: {stm:80,  hp:10, food:7,  water:7,  ticks:3, label:"Bedroll",
              msg:["The bedroll keeps the cold out.", "Managed some real sleep.", "Not luxury, but it works."]},
    shelter: {stm:100, hp:20, food:5,  water:5,  ticks:3, label:"Lean-To",
              msg:["Sheltered from the wind.", "Hidden and warm.", "Proper rest under cover."]},
    indoor:  {stm:100, hp:15, food:5,  water:5,  ticks:3, label:"Indoors",
              msg:["Walls around you. Safe.", "Rested inside.", "Slept behind walls."]},
    bunker:  {stm:100, hp:25, food:5,  water:5,  ticks:3, label:"Bunker",
              msg:["Underground and safe.", "Deep sleep.", "Slept deep underground."]},
  },

  /* ── Loot Pools ──────────────────────────────────────────── */
  lootPools: {
    nature:          [{id:'wood',weight:15},{id:'cloth',weight:4},{id:'book_carp',weight:1}],
    road:            [{id:'scrap',weight:10},{id:'water_b',weight:5},{id:'nails',weight:8},{id:'knife',weight:2}],
    house:           [{id:'canned',weight:8},{id:'water_b',weight:8},{id:'bandage',weight:5},{id:'nails',weight:8},{id:'book_carp',weight:2},{id:'knife',weight:3},{id:'cloth',weight:6}],
    store:           [{id:'canned',weight:15},{id:'water_b',weight:12},{id:'bandage',weight:6},{id:'backpack',weight:2},{id:'boots',weight:2},{id:'flashlight',weight:3},{id:'jerky',weight:8}],
    garage:          [{id:'scrap',weight:15},{id:'nails',weight:12},{id:'wood',weight:8},{id:'pipe',weight:3},{id:'hammer',weight:2},{id:'cloth',weight:4}],
    clinic:          [{id:'bandage',weight:15},{id:'med_kit',weight:4},{id:'cloth',weight:8},{id:'water_b',weight:6}],
    warehouse:       [{id:'wood',weight:12},{id:'nails',weight:12},{id:'scrap',weight:10},{id:'cloth',weight:8},{id:'canned',weight:5},{id:'backpack',weight:2}],
    shelf_house:     [{id:'canned',weight:10},{id:'water_b',weight:10},{id:'bandage',weight:8},{id:'cloth',weight:8},{id:'nails',weight:10},{id:'hammer',weight:3},{id:'knife',weight:4},{id:'jacket',weight:2},{id:'book_carp',weight:3}],
    shelf_store:     [{id:'canned',weight:15},{id:'water_b',weight:15},{id:'bandage',weight:10},{id:'jerky',weight:10},{id:'backpack',weight:3},{id:'flashlight',weight:5},{id:'boots',weight:3},{id:'rifle',weight:1}],
    shelf_garage:    [{id:'scrap',weight:15},{id:'nails',weight:12},{id:'hammer',weight:5},{id:'pipe',weight:4},{id:'wood',weight:8},{id:'flashlight',weight:3},{id:'boots',weight:2}],
    shelf_clinic:    [{id:'bandage',weight:15},{id:'med_kit',weight:6},{id:'cloth',weight:10},{id:'water_b',weight:8},{id:'book_carp',weight:2}],
    shelf_warehouse: [{id:'wood',weight:12},{id:'nails',weight:15},{id:'scrap',weight:12},{id:'cloth',weight:10},{id:'canned',weight:6},{id:'jerky',weight:4},{id:'backpack',weight:3},{id:'boots',weight:2}],
    shelf_bunker:    [{id:'canned',weight:10},{id:'water_b',weight:10},{id:'bandage',weight:8},{id:'cloth',weight:5},{id:'nails',weight:5}],
  },
  tileLoot: {grass:'nature', forest:'nature', road:'road', house:'house', store:'store', garage:'garage', clinic:'clinic', warehouse:'warehouse'},

  /* ── Interior Layouts ────────────────────────────────────── */
  layouts: {
    house: [
      ["#######","#S...S#","#.....#","#.....#","#S...S#","#.....#","#W#D#W#"],
      ["#######","#S....#","#.....#","#..####","#S..S.#","#.....#","#W#D#W#"],
    ],
    house_basement: [["#######","#S...S#","#.....#","#.....#","#.....#","#S...S#","####U##"]],
    store: [["#########","#.S.S.S.#","#.......#","#.S.S.S.#","#.......#","#.......#","####D####"]],
    store_basement: [["#########","#S.....S#","#.......#","#.......#","#S.S.S.S#","#.......#","######U##"]],
    garage: [["#######","#S...S#","#.....#","#.....#","#..S..#","###D###"]],
    clinic: [["#######","#S...S#","#.....#","##.#.##","#S...S#","#.....#","##WDW##"]],
    warehouse: [["##########","#S..SS..S#","#........#","#........#","#S..SS..S#","#........#","####DD####"]],
    warehouse_upper: [["##########","#S......S#","#........#","#........#","#S......S#","#........#","U#########"]],
    bunker: [["RRRRRRRRR","R.......R","R..S.S..R","R.......R","R.......R","R..S.S..R","R.......R","RRRRLRRRR"]],
  },
  multiFloor: {
    house:     {extra:'house_basement',   chance:0.30, dir:'down', label:'Basement'},
    store:     {extra:'store_basement',   chance:0.20, dir:'down', label:'Storage Cellar'},
    warehouse: {extra:'warehouse_upper',  chance:0.35, dir:'up',   label:'Upper Floor'},
  },

  startItems: ['canned','canned','water_b','water_b','knife','bandage','bandage','hammer','nails','wood','wood','book_carp'],
  player: {hp:100, stm:100, food:80, h2o:80, maxWeight:15},
  tuning: {
    baseVision:3, nightVisPen:1, moveCost:2, encumberedStamPen:2,
    scavengeCost:8, searchCost:5, salvageCost:5, scavengeChance:0.45,
    tickHunger:0.25, tickThirst:0.4, starveDmg:1,
    baseDmg:1, combatSkillBonus:0.5, durWeapon:1, durArmor:1, durTool:1,
    turnsPerDay:24, nightRatio:0.35,
    initZombies:4, zombiesPerNight:2, zombieEsc:0.3, maxZombies:20,
    zombieAggro:5, zombieSpawnBuf:10,
    interiorZombieChance:0.25, barricadeHp:50,
  },
  worldGen: {
    cityCount:6, cityMinEdgeBuffer:5, cityCoreDist:2,
    citySuburbDist:5, citySuburbChance:0.4,
    terrainWaterThreshold:1.8, terrainForestThreshold:1.2,
    coreDist: [{type:'house',weight:30},{type:'store',weight:20},{type:'garage',weight:15},{type:'clinic',weight:15},{type:'warehouse',weight:12}],
    suburbDist: [{type:'house',weight:65},{type:'garage',weight:18},{type:'clinic',weight:12},{type:'warehouse',weight:5}],
  },
};