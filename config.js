/* ═══════════════════════════════════════════════════════════
   WASTELAND SURVIVOR — config.js
   All game data. Add items/enemies/recipes here.
   ═══════════════════════════════════════════════════════════ */

const C = {
w: 60, h: 60,

/* ── Visual Settings ─────────────────────────────────────── */
visuals: {
  // Options: 'emoji' (default) or 'ascii'
  style: 'emoji', 
  // If true, randomized grass punctuation (.,`,') is used in ascii mode
  randomizeTerrain: true,
},

/* ── Custom Image Tiles ───────────────────────────────────── 
   Any tile, interior tile, item, or enemy definition can use
   custom images instead of (or alongside) emoji/ASCII text.
   
   Add to any tile/itile/item/enemy definition:
     img:  'path/to/image.png'       — single custom image
     imgV: ['a.png','b.png','c.png'] — random image variants
   
   Images are rendered at tile size (var(--tile), default 36px).
   Recommended: PNG or SVG, ≤64×64px, transparent backgrounds.
   imgV works like iconV — picks a stable-random variant per tile.
   
   ASCII mode always ignores custom images (uses txt/txtV).
   If img is not set, existing icon/txt behavior is unchanged.
   
   Example usage:
     grass: { txt:',', icon:',', img:'tiles/grass.png',
              imgV:['tiles/grass1.png','tiles/grass2.png'],
              css:'t-grass', pass:true, ... },
     
     zombie: { icon:'🧟', img:'enemies/zombie.png', ... },
   ════════════════════════════════════════════════════════════ */

/* ── World Tiles ─────────────────────────────────────────── */
// txt: ASCII character, icon: Emoji, css: class name
tiles: {
  grass:        {txt:',', icon:',',  css:'t-grass',      pass:true,  cap:2, name:"Wild Grass",      desc:"Overgrown vegetation.", placeable:true,
                 txtV:[',','.','\`','\'',';','⁖','˙','‥'],
                 iconV:[',','.','\`','\'',';','⁖','˙','∴','‥','⸪']},
  forest:       {txt:'T', icon:'🌲', css:'t-forest',     pass:true,  cap:4, name:"Deep Woods",      desc:"Dense trees. Good cover.", placeable:true,
                 txtV:['T','t','Y','♣','↟','T','t','¥'],
                 iconV:['🌲','🌳','🌿','🌲','🌳','↟','♣','🍂','🌲','🌳']},
  water:        {txt:'~', icon:'≈',  css:'t-water',      pass:false, cap:0, name:"Deep Water",      desc:"Impassable.",
                 txtV:['~','~','≈','∽','~','≈','~','∿'],
                 iconV:['≈','~','≋','∽','〰','≈','~','∿','≈','〰']},
  road:         {txt:'.', icon:'·',  css:'t-road',       pass:true,  cap:2, name:"Old Road",        desc:"Cracked asphalt.", placeable:true,
                 txtV:['.','.','·','∙','.','·','.','⋅'],
                 iconV:['·','∙','⋅','·','·','∙','·','⋅']},
  bridge:       {txt:'=', icon:'=',  css:'t-bridge',     pass:true,  cap:0, name:"Bridge",          desc:"Safe crossing."},
  house:        {txt:'H', icon:'🏚️', css:'t-house',      pass:true,  cap:3, name:"Abandoned House",  desc:"Enterable. Search inside.", enter:true, buildName:"House"},
  store:        {txt:'S', icon:'🛒', css:'t-store',      pass:true,  cap:5, name:"Looted Store",     desc:"Rich pickings inside.", enter:true, buildName:"Store"},
  garage:       {txt:'G', icon:'⚙️', css:'t-garage',     pass:true,  cap:3, name:"Auto Garage",      desc:"Might find tools.", enter:true, buildName:"Garage"},
  clinic:       {txt:'+', icon:'➕', css:'t-clinic',     pass:true,  cap:4, name:"Medical Clinic",   desc:"Could have medical supplies.", enter:true, buildName:"Clinic"},
  warehouse:    {txt:'W', icon:'📦', css:'t-warehouse',  pass:true,  cap:6, name:"Warehouse",        desc:"Large storage building.", enter:true, buildName:"Warehouse"},
  bunker_hatch: {txt:'O', icon:'🔒', css:'t-hatch',      pass:true,  cap:0, name:"Bunker Hatch",     desc:"Your underground shelter.", enter:true, buildName:"Bunker"},
  bedroll:      {txt:'b', icon:'🛌', css:'t-bedroll',    pass:true,  cap:0, name:"Bedroll",          desc:"A rough sleeping spot."},
  shelter:      {txt:'^', icon:'🏕️', css:'t-shelter',    pass:true,  cap:0, name:"Lean-To",          desc:"A sturdy shelter."},
  rain_catcher: {txt:'Y', icon:'🪣', css:'t-water',      pass:true,  cap:0, name:"Rain Catcher",     desc:"Collects water slowly."},
},

/* ── Interior Tile Types ─────────────────────────────────── */
// container: true = can store items inside
// searchable: true = can use 'Search' action for RNG loot
itiles: {
  wall:       {txt:'#', icon:'▓', css:'it-wall',      pass:false},
  floor:      {txt:'.', icon:'·', css:'it-floor',     pass:true},
  door:       {txt:'+', icon:'╬', css:'it-door',      pass:true, entry:true, barricadable:true},
  window:     {txt:'o', icon:'▢', css:'it-window',    pass:true, entry:true, barricadable:true},
  shelf:      {txt:'E', icon:'📦',css:'it-shelf',     pass:false, searchable:true, salvageable:true, container:true},
  counter:    {txt:'H', icon:'🔲',css:'it-counter',   pass:false, searchable:true, salvageable:true, container:true},
  locker:     {txt:'L', icon:'🗄️',css:'it-crate',     pass:false, searchable:true, salvageable:true, container:true},
  ladder:     {txt:'H', icon:'🪜',css:'it-ladder',    pass:true, entry:true},
  stairs_up:  {txt:'<', icon:'▲', css:'it-stup',      pass:true, stair:'up'},
  stairs_down:{txt:'>', icon:'▼', css:'it-stdn',      pass:true, stair:'down'},
  pwall:      {txt:'#', icon:'▓', css:'it-pwall',     pass:false, salvageable:true},
  pdoor:      {txt:'+', icon:'╬', css:'it-pdoor',     pass:true, barricadable:true, salvageable:true},
  crate:      {txt:'X', icon:'📦',css:'it-crate',     pass:false, container:true, salvageable:true},
  bwall:      {txt:'#', icon:'█', css:'it-bwall',     pass:false},
  bfloor:     {txt:'.', icon:'░', css:'it-bfloor',    pass:true},
},

/* ── Salvage Yields ─────────────────────────────────────── */
salvageYields: {
  shelf:   [{id:'wood',qty:1},{id:'nails',min:1,max:3}],
  counter: [{id:'scrap',qty:1},{id:'nails',min:0,max:2}],
  locker:  [{id:'scrap',qty:2},{id:'metal_sheet',qty:1}],
  pwall:   [{id:'wood',qty:1},{id:'nails',min:1,max:2}],
  pdoor:   [{id:'wood',qty:1},{id:'nails',qty:1}],
  crate:   [{id:'wood',qty:2},{id:'nails',min:1,max:3},{id:'scrap',qty:1}],
},

/* ── Skills ──────────────────────────────────────────────── */
skills: {
  survival:  {name:"Survival",  start:true,  desc:"scavenging & searching"},
  combat:    {name:"Combat",    start:true,  desc:"damage dealt in fights"},
  carpentry: {name:"Carpentry", start:false, desc:"barricading & building"},
},

/* ── Items ────────────────────────────────────────────────── */
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
  metal_sheet: {name:"Metal Sheet",    type:'mat',   icon:'⬜',wgt:2.0,stack:5},

  // Placeables (Exterior)
  bedroll_kit: {name:"Bedroll Kit",    type:'place', icon:'🛌',placeType:'bedroll',wgt:1.5},
  shelter_kit: {name:"Lean-To Kit",    type:'place', icon:'🏕️',placeType:'shelter',wgt:3.0},
  rain_kit:    {name:"Rain Catcher",   type:'place', icon:'🪣',placeType:'rain_catcher',wgt:2.0},

  // Placeables (Interior)
  wall_frame:  {name:"Wall Frame",     type:'iplace',icon:'🧱',placeType:'pwall',wgt:2.0},
  door_frame:  {name:"Door Frame",     type:'iplace',icon:'🚪',placeType:'pdoor',wgt:1.5},
  crate_kit:   {name:"Storage Crate",  type:'iplace',icon:'📦',placeType:'crate',wgt:3.0},
  locker_kit:  {name:"Steel Locker",   type:'iplace',icon:'🗄️',placeType:'locker',wgt:5.0},
},

/* ── Enemies ─────────────────────────────────────────────── */
enemies: {
  shambler:{name:"Shambler",icon:'🧟',txt:'z',hp:12,atk:4, def:0,xp:15,speed:4},
  runner:  {name:"Runner",  icon:'💀',txt:'s',hp:8, atk:6, def:0,xp:25,speed:2},
  brute:   {name:"Brute",   icon:'👹',txt:'B',hp:30,atk:10,def:3,xp:50,speed:5},
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
  
  // New recipes
  sheet_c:     {name:"Metal Sheet",  cat:'building', reqSkill:['carpentry',1], inputs:{scrap:5},                result:{type:'item',id:'metal_sheet',count:1}},
  locker_c:    {name:"Steel Locker", cat:'building', reqSkill:['carpentry',2], inputs:{metal_sheet:3,nails:4},  result:{type:'item',id:'locker_kit',count:1}},
  rain_c:      {name:"Rain Catcher", cat:'building', reqSkill:['carpentry',1], inputs:{wood:2,cloth:2,scrap:1}, result:{type:'item',id:'rain_kit',count:1}},
},

/* ── Rest Tiers ──────────────────────────────────────────── */
restTiers: {
  rough:   {stm:50,  hp:0,  food:10, water:10, ticks:5, label:"Rough Rest",
            msg:["Slept fitfully on the cold ground.", "Dozed off against a tree. Every sound wakes you.", "Barely slept. Your back aches."]},
  bedroll: {stm:80,  hp:10, food:7,  water:7,  ticks:3, label:"Bedroll",
            msg:["The bedroll keeps the worst of the cold out.", "Managed some real sleep for once.", "Not luxury, but the bedroll helps."]},
  shelter: {stm:100, hp:20, food:5,  water:5,  ticks:3, label:"Lean-To",
            msg:["Sheltered from the wind. Slept well.", "The lean-to kept you hidden and warm.", "Proper rest under cover. Feeling strong."]},
  indoor:  {stm:100, hp:15, food:5,  water:5,  ticks:3, label:"Indoors",
            msg:["Walls around you. Better than nothing.", "Rested inside. The roof helps.", "Slept behind walls. Not bad."]},
  bunker:  {stm:100, hp:25, food:5,  water:5,  ticks:3, label:"Bunker",
            msg:["Underground and safe. Full rest.", "The bunker keeps everything out.", "Slept deep underground. Wounds heal."]},
},

/* ── Loot Pools ──────────────────────────────────────────── */
lootPools: {
  nature:          [{id:'wood',weight:15},{id:'cloth',weight:4},{id:'book_carp',weight:1}],
  road:            [{id:'scrap',weight:10},{id:'water_b',weight:5},{id:'nails',weight:8},{id:'knife',weight:2}],
  house:           [{id:'canned',weight:8},{id:'water_b',weight:8},{id:'bandage',weight:5},{id:'nails',weight:8},{id:'book_carp',weight:2},{id:'knife',weight:3},{id:'cloth',weight:6}],
  store:           [{id:'canned',weight:15},{id:'water_b',weight:12},{id:'bandage',weight:6},{id:'backpack',weight:2},{id:'boots',weight:2},{id:'flashlight',weight:3},{id:'jerky',weight:8}],
  garage:          [{id:'scrap',weight:15},{id:'nails',weight:12},{id:'wood',weight:8},{id:'pipe',weight:3},{id:'hammer',weight:2},{id:'cloth',weight:4},{id:'metal_sheet',weight:2}],
  clinic:          [{id:'bandage',weight:15},{id:'med_kit',weight:4},{id:'cloth',weight:8},{id:'water_b',weight:6}],
  warehouse:       [{id:'wood',weight:12},{id:'nails',weight:12},{id:'scrap',weight:10},{id:'cloth',weight:8},{id:'canned',weight:5},{id:'backpack',weight:2},{id:'metal_sheet',weight:4}],
  
  shelf_house:     [{id:'canned',weight:10},{id:'water_b',weight:10},{id:'bandage',weight:8},{id:'cloth',weight:8},{id:'nails',weight:10},{id:'hammer',weight:3},{id:'knife',weight:4},{id:'jacket',weight:2},{id:'book_carp',weight:3}],
  shelf_store:     [{id:'canned',weight:15},{id:'water_b',weight:15},{id:'bandage',weight:10},{id:'jerky',weight:10},{id:'backpack',weight:3},{id:'flashlight',weight:5},{id:'boots',weight:3},{id:'rifle',weight:1}],
  shelf_garage:    [{id:'scrap',weight:15},{id:'nails',weight:12},{id:'hammer',weight:5},{id:'pipe',weight:4},{id:'wood',weight:8},{id:'flashlight',weight:3},{id:'boots',weight:2},{id:'metal_sheet',weight:3}],
  shelf_clinic:    [{id:'bandage',weight:15},{id:'med_kit',weight:6},{id:'cloth',weight:10},{id:'water_b',weight:8},{id:'book_carp',weight:2}],
  shelf_warehouse: [{id:'wood',weight:12},{id:'nails',weight:15},{id:'scrap',weight:12},{id:'cloth',weight:10},{id:'canned',weight:6},{id:'jerky',weight:4},{id:'backpack',weight:3},{id:'boots',weight:2},{id:'metal_sheet',weight:4}],
  shelf_bunker:    [{id:'canned',weight:10},{id:'water_b',weight:10},{id:'bandage',weight:8},{id:'cloth',weight:5},{id:'nails',weight:5}],
},
tileLoot: {grass:'nature', forest:'nature', road:'road', house:'house', store:'store', garage:'garage', clinic:'clinic', warehouse:'warehouse'},

/* ── Interior Layouts ────────────────────────────────────── */
/* # wall  . floor  D door  W window  S shelf  C counter   */
/* L ladder  U stairs_up  B stairs_down  R bunker wall     */
/* K locker                                                */
layouts: {
  house: [
    ["#######","#S...S#","#.....#","#.....#","#S...S#","#.....#","#W#D#W#"],
    ["#######","#S....#","#.....#","#..####","#S..S.#","#.....#","#W#D#W#"],
    ["#######","#.S.S.#","#.....#","#.....#","#.....#","#S...S#","##WDW##"],
    ["#######","#S...S#","#.....#","###.###","#S...S#","#.....#","##WDW##"],
    ["########","#S....S#","#......#","#..SS..#","#......#","#S....S#","##W#DW##"],
  ],
  house_basement: [
    ["#######","#S...S#","#.....#","#.....#","#.....#","#S...S#","####U##"],
    ["#######","#.....#","#.S.S.#","#.....#","#.....#","#.....#","####U##"],
  ],
  store: [
    ["#########","#.S.S.S.#","#.......#","#.S.S.S.#","#.......#","#.......#","####D####"],
    ["#########","#S.....S#","#.......#","#.S.S.S.#","#.......#","#S.....S#","####D####"],
    ["#########","#S.S.S.S#","#.......#","#.......#","#S.S.S.S#","#.......#","#.......#","####D####"],
  ],
  store_basement: [
    ["#########","#S.....S#","#.......#","#.......#","#S.S.S.S#","#.......#","######U##"],
  ],
  garage: [
    ["#######","#S...S#","#.....#","#.....#","#..S..#","###D###"],
    ["########","#S..S..#","#......#","#......#","#S....S#","###DD###"],
    ["#######","#S...S#","#.....#","###.###","#.....#","#S...S#","###D###"],
  ],
  clinic: [
    ["#######","#S...S#","#.....#","##.#.##","#S...S#","#.....#","##WDW##"],
    ["########","#S....S#","#......#","#.SS...#","#......#","#S....S#","###DW###"],
    ["#######","#S...S#","#.....#","#..#..#","#.....#","#S...S#","###D###"],
  ],
  warehouse: [
    ["##########","#S..KK..S#","#........#","#........#","#S..KK..S#","#........#","####DD####"],
    ["#########","#S.K.S.K#","#.......#","#.......#","#.......#","#S.K.S.K#","#.......#","####D####"],
  ],
  warehouse_upper: [
    ["##########","#S......S#","#........#","#........#","#S......S#","#........#","U#########"],
    ["#########","#S.....S#","#.......#","#.......#","#.......#","#.......#","U########"],
  ],
  bunker: [
    ["RRRRRRRRR","R.......R","R..S.S..R","R.......R","R.......R","R..S.S..R","R.......R","RRRRLRRRR"],
  ],
},

/** Multi-floor config */
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
  /* ── City Placement ──────────────────────────────────────── */
  cityCount:          6,      // Target number of cities
  cityMinEdgeBuffer:  5,      // Min tiles from map edge
  cityMinSpacing:     12,     // Min Manhattan distance between city centers
                              // (prevents overlapping cities)

  /* ── City Layout ─────────────────────────────────────────── */
  cityCoreDist:       2,      // Manhattan radius of dense downtown
  citySuburbDist:     5,      // Manhattan radius of suburbs
  citySuburbChance:   0.45,   // Chance a suburb-range tile becomes a building
  buildingsNeedRoad:  true,   // Buildings ONLY spawn adjacent to a road tile
                              // (creates realistic blocks instead of mid-field houses)

  /* ── City Street Grid ────────────────────────────────────── */
  cityStreets: {
    enabled:    true,         // Generate a street grid inside each city radius
    spacing:    3,            // Grid spacing (road every N tiles)
    reach:      5,            // How far the grid extends from city center
    jitter:     0.15,         // Chance to skip a grid road (adds organic feel)
  },

  /* ── Road Network ────────────────────────────────────────── */
  roadBranching: {
    enabled:    true,         // Dead-end side roads branch off main highways
    chance:     0.06,         // Per road tile, chance to spawn a branch
    minLen:     2,            // Shortest branch
    maxLen:     6,            // Longest branch
  },

  /* ── Roadside POIs (lone buildings on highways) ──────────── */
  roadsidePOIs: {
    enabled:    true,         // Scatter lone structures along roads between cities
    chance:     0.035,        // Per eligible road tile
    minCityDist:6,            // Don't place too close to a city center
    types: [
      {type:'house',    weight:50},
      {type:'garage',   weight:30},
      {type:'store',    weight:12},
      {type:'clinic',   weight:8},
    ],
  },

  /* ── Hamlets (small clusters between cities) ─────────────── */
  hamlets: {
    enabled:    true,
    count:      3,            // How many hamlets to attempt
    minSize:    2,            // Min buildings per hamlet
    maxSize:    4,            // Max buildings per hamlet
    minCityDist:10,           // Must be far from any city center
    minHamletDist:8,          // Must be far from other hamlets
    types: [
      {type:'house',    weight:60},
      {type:'garage',   weight:20},
      {type:'store',    weight:12},
      {type:'clinic',   weight:8},
    ],
  },

  /* ── Wilderness POIs (isolated structures) ───────────────── */
  wildernessPOIs: {
    enabled:    true,
    count:      6,            // How many to attempt placing
    minCityDist:8,            // Must be far from cities
    minPOIDist: 6,            // Must be far from other wilderness POIs
    types: [
      {type:'house',    weight:55},   // Isolated cabin
      {type:'garage',   weight:25},   // Abandoned workshop
      {type:'clinic',   weight:15},   // Field clinic
      {type:'warehouse',weight:5},    // Remote storage
    ],
  },

  /* ── Terrain Enrichment ──────────────────────────────────── */
  terrain: {
    clearings: {
      enabled: true,          // Create grass clearings inside forests
      chance:  0.015,         // Per forest tile, chance to seed a clearing
      radius:  1,             // Clearing size (1 = 3×3 area)
    },
    denseForest: {
      enabled: true,          // Seed thick forest clusters in grassland
      chance:  0.008,
      radius:  2,             // Patch size (2 = 5×5 area)
    },
  },

  /* ── Base Terrain Thresholds ─────────────────────────────── */
  terrainWaterThreshold:  1.8,
  terrainForestThreshold: 1.2,

  /* ── Building Pools ──────────────────────────────────────── */
  coreDist: [
    {type:'house',weight:30},{type:'store',weight:20},{type:'garage',weight:15},
    {type:'clinic',weight:15},{type:'warehouse',weight:12},
  ],
  suburbDist: [
    {type:'house',weight:65},{type:'garage',weight:18},{type:'clinic',weight:12},{type:'warehouse',weight:5},
  ],
},
};