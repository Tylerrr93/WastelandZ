/* ═══════════════════════════════════════════════════════════
   WASTELAND SURVIVOR — config.js
   All game data. Add items/enemies/recipes/buildings here.
   ═══════════════════════════════════════════════════════════ */

const C = {
w: 100, h: 100,

/* ═══════════════════════════════════════════════════════════
   ICON SYSTEM — Controls how icons are displayed everywhere
   ═══════════════════════════════════════════════════════════
   Modes:
     'emoji'   — pure emoji icons (default)
     'ascii'   — pure ascii/box-drawing characters
     'combo'   — mix of emoji + ascii (per-tile choice)
     'random'  — randomly pick from a pool of variants each render

   Each tile/item/enemy supports multiple icon sets.
   Set iconMode to switch globally. Individual entries
   can override with their own `icons` object.
   ═══════════════════════════════════════════════════════════ */
iconMode: 'emoji',  // 'emoji' | 'ascii' | 'combo' | 'random'

/* Per-type icon sets. Used by getIcon() helper below.
   Structure: { emoji: '...', ascii: '...', combo: '...',
                random: ['variant1','variant2',...] }
   If a mode is missing, falls back: combo→emoji→ascii     */
icons: {
  // ── World tiles ──
  grass:        { emoji: ',',  ascii: ',',  random: [',', '.', '`', '\u2056'] },
  forest:       { emoji: '\uD83C\uDF32', ascii: '\u2191', random: ['\uD83C\uDF32', '\uD83C\uDF33', '\u21DF'] },
  water:        { emoji: '\u2248', ascii: '~' },
  road:         { emoji: '\u00B7', ascii: '.' },
  bridge:       { emoji: '=',  ascii: '=' },
  // ── Building icons (unique emoji/unicode per type) ──
  house:        { emoji: '\uD83C\uDFE0', ascii: 'H', combo: '\uD83C\uDFE0' },
  store:        { emoji: '\uD83C\uDFEA', ascii: '$', combo: '\uD83C\uDFEA' },
  garage:       { emoji: '\u2699\uFE0F', ascii: 'G', combo: '\u2699\uFE0F' },
  clinic:       { emoji: '\uD83C\uDFE5', ascii: '+', combo: '\uD83C\uDFE5' },
  warehouse:    { emoji: '\uD83C\uDFED', ascii: 'W', combo: '\uD83C\uDFED' },
  bunker_hatch: { emoji: '\uD83D\uDD12', ascii: '%', combo: '\uD83D\uDD12' },
  school:       { emoji: '\uD83C\uDFEB', ascii: 'S', combo: '\uD83C\uDFEB' },
  church:       { emoji: '\u26EA',       ascii: 'C', combo: '\u26EA' },
  police:       { emoji: '\uD83D\uDE94', ascii: 'P', combo: '\uD83D\uDE94' },
  fire_station: { emoji: '\uD83D\uDE92', ascii: 'F', combo: '\uD83D\uDE92' },
  bar:          { emoji: '\uD83C\uDF7A', ascii: 'B', combo: '\uD83C\uDF7A' },
  gas_station:  { emoji: '\u26FD',       ascii: 'g', combo: '\u26FD' },
  apartment:    { emoji: '\uD83C\uDFE2', ascii: 'A', combo: '\uD83C\uDFE2' },
  library:      { emoji: '\uD83D\uDCDA', ascii: 'L', combo: '\uD83D\uDCDA' },
  bedroll:      { emoji: '\uD83D\uDECC', ascii: 'z', combo: '\uD83D\uDECC' },
  shelter:      { emoji: '\uD83C\uDFD5\uFE0F', ascii: '^', combo: '\uD83C\uDFD5\uFE0F' },
  // ── Interior tiles ──
  wall:         { emoji: '\u2593', ascii: '#' },
  floor:        { emoji: '\u00B7', ascii: '.' },
  door:         { emoji: '\u256C', ascii: '+' },
  window:       { emoji: '\u25A2', ascii: '=' },
  shelf:        { emoji: '\uD83D\uDCE6', ascii: '[', combo: '\uD83D\uDCE6' },
  counter:      { emoji: '\uD83D\uDD32', ascii: '_', combo: '\uD83D\uDD32' },
  ladder:       { emoji: '\uD83E\uDE9C', ascii: 'H', combo: '\uD83E\uDE9C' },
  stairs_up:    { emoji: '\u25B2', ascii: '<' },
  stairs_down:  { emoji: '\u25BC', ascii: '>' },
  pwall:        { emoji: '\u2593', ascii: '#' },
  pdoor:        { emoji: '\u256C', ascii: '+' },
  crate:        { emoji: '\uD83D\uDCE6', ascii: 'C', combo: '\uD83D\uDCE6' },
  bwall:        { emoji: '\u2588', ascii: '#' },
  bfloor:       { emoji: '\u2591', ascii: '.' },
  workbench:    { emoji: '\uD83D\uDD28', ascii: 'T', combo: '\uD83D\uDD28' },
  barrel:       { emoji: '\uD83E\uDEE7', ascii: 'O', combo: '\uD83E\uDEE7' },
  locker:       { emoji: '\uD83D\uDD10', ascii: 'L', combo: '\uD83D\uDD10' },
  table:        { emoji: '\u2637',       ascii: 'T', combo: '\u2637' },
  chair:        { emoji: '\u2441',       ascii: 'h', combo: '\u2441' },
  fridge:       { emoji: '\u2395',       ascii: 'F', combo: '\u2395' },
  bed:          { emoji: '\uD83D\uDECF\uFE0F', ascii: 'b', combo: '\uD83D\uDECF\uFE0F' },
  toilet:       { emoji: '\uD83D\uDEBD', ascii: 'o', combo: '\uD83D\uDEBD' },
  bookshelf:    { emoji: '\uD83D\uDCDA', ascii: 'B', combo: '\uD83D\uDCDA' },
  // ── Items ──
  i_knife:      { emoji: '\uD83D\uDD2A', ascii: '/', combo: '\uD83D\uDD2A' },
  i_pipe:       { emoji: '\uD83D\uDD27', ascii: '|', combo: '\uD83D\uDD27' },
  i_bat:        { emoji: '\uD83C\uDFCF', ascii: '!', combo: '\uD83C\uDFCF' },
  i_rifle:      { emoji: '\uD83D\uDD2B', ascii: '}', combo: '\uD83D\uDD2B' },
  i_torch:      { emoji: '\uD83D\uDD25', ascii: '*', combo: '\uD83D\uDD25' },
  i_flashlight: { emoji: '\uD83D\uDD26', ascii: '?', combo: '\uD83D\uDD26' },
  i_hammer:     { emoji: '\uD83D\uDD28', ascii: 'T', combo: '\uD83D\uDD28' },
  i_boots:      { emoji: '\uD83E\uDD7E', ascii: 'b', combo: '\uD83E\uDD7E' },
  i_jacket:     { emoji: '\uD83E\uDDE5', ascii: 'J', combo: '\uD83E\uDDE5' },
  i_backpack:   { emoji: '\uD83C\uDF92', ascii: 'B', combo: '\uD83C\uDF92' },
  i_canned:     { emoji: '\uD83E\uDD6B', ascii: 'c', combo: '\uD83E\uDD6B' },
  i_jerky:      { emoji: '\uD83E\uDD69', ascii: 'j', combo: '\uD83E\uDD69' },
  i_water_b:    { emoji: '\uD83D\uDCA7', ascii: 'w', combo: '\uD83D\uDCA7' },
  i_bandage:    { emoji: '\uD83E\uDE79', ascii: '+', combo: '\uD83E\uDE79' },
  i_med_kit:    { emoji: '\uD83C\uDFE5', ascii: 'M', combo: '\uD83C\uDFE5' },
  i_book_carp:  { emoji: '\uD83D\uDCD8', ascii: 'b', combo: '\uD83D\uDCD8' },
  i_scrap:      { emoji: '\u2699\uFE0F', ascii: '*', combo: '\u2699\uFE0F' },
  i_wood:       { emoji: '\uD83E\uDEB5', ascii: '=', combo: '\uD83E\uDEB5' },
  i_nails:      { emoji: '\uD83D\uDD29', ascii: 'n', combo: '\uD83D\uDD29' },
  i_cloth:      { emoji: '\uD83E\uDDF5', ascii: '~', combo: '\uD83E\uDDF5' },
  i_bedroll_kit:{ emoji: '\uD83D\uDECC', ascii: 'z', combo: '\uD83D\uDECC' },
  i_shelter_kit:{ emoji: '\uD83C\uDFD5\uFE0F', ascii: '^', combo: '\uD83C\uDFD5\uFE0F' },
  i_wall_frame: { emoji: '\uD83E\uDDF1', ascii: '#', combo: '\uD83E\uDDF1' },
  i_door_frame: { emoji: '\uD83D\uDEAA', ascii: '+', combo: '\uD83D\uDEAA' },
  i_crate_kit:  { emoji: '\uD83D\uDCE6', ascii: 'C', combo: '\uD83D\uDCE6' },
  // ── Enemies ──
  e_shambler:   { emoji: '\uD83E\uDDDF', ascii: 'Z', random: ['\uD83E\uDDDF', '\uD83E\uDDDF\u200D\u2642\uFE0F'] },
  e_runner:     { emoji: '\uD83D\uDC80', ascii: 'R', combo: '\uD83D\uDC80' },
  e_brute:      { emoji: '\uD83D\uDC79', ascii: 'B', combo: '\uD83D\uDC79' },
  // ── Player ──
  player:       { emoji: '\uD83D\uDC64', ascii: '@', combo: '\uD83D\uDC64' },
  player_tired: { emoji: '\uD83D\uDE13', ascii: '@', combo: '\uD83D\uDE13' },
},

/* ── Icon helper — call C.getIcon(key) anywhere ─────────── */
getIcon(key, x, y) {
  let entry = this.icons[key];
  if (!entry) return '?';
  let mode = this.iconMode;
  if (mode === 'random' && entry.random) {
    if (x != null && y != null) return entry.random[(x + y) % entry.random.length];
    return entry.random[Math.floor(Math.random() * entry.random.length)];
  }
  return entry[mode] || entry.emoji || entry.ascii || '?';
},

/* ═══════════════════════════════════════════════════════════
   WORLD TILES
   To add a new building: add entry here + layout + loot pool
   ═══════════════════════════════════════════════════════════ */
tiles: {
  grass:        {ch:',', css:'t-grass',      pass:true,  cap:2, name:"Wild Grass",      desc:"Overgrown vegetation.", placeable:true},
  forest:       {ch:'\uD83C\uDF32',css:'t-forest',     pass:true,  cap:4, name:"Deep Woods",      desc:"Dense trees. Good cover.", placeable:true},
  water:        {ch:'\u2248', css:'t-water',      pass:false, cap:0, name:"Deep Water",      desc:"Impassable."},
  road:         {ch:'\u00B7', css:'t-road',       pass:true,  cap:2, name:"Old Road",        desc:"Cracked asphalt.", placeable:true},
  bridge:       {ch:'=', css:'t-bridge',     pass:true,  cap:0, name:"Bridge",          desc:"Safe crossing."},
  house:        {ch:'\uD83C\uDFE0',css:'t-house',      pass:true,  cap:3, name:"Abandoned House",  desc:"Enterable. Search inside.", enter:true, buildName:"House"},
  store:        {ch:'\uD83C\uDFEA',css:'t-store',      pass:true,  cap:5, name:"Looted Store",     desc:"Rich pickings inside.", enter:true, buildName:"Store"},
  garage:       {ch:'\u2699\uFE0F',css:'t-garage',     pass:true,  cap:3, name:"Auto Garage",      desc:"Might find tools.", enter:true, buildName:"Garage"},
  clinic:       {ch:'\uD83C\uDFE5',css:'t-clinic',     pass:true,  cap:4, name:"Medical Clinic",   desc:"Could have medical supplies.", enter:true, buildName:"Clinic"},
  warehouse:    {ch:'\uD83C\uDFED',css:'t-warehouse',  pass:true,  cap:6, name:"Warehouse",        desc:"Large storage building.", enter:true, buildName:"Warehouse"},
  bunker_hatch: {ch:'\uD83D\uDD12',css:'t-hatch',      pass:true,  cap:0, name:"Bunker Hatch",     desc:"Your underground shelter.", enter:true, buildName:"Bunker"},
  school:       {ch:'\uD83C\uDFEB',css:'t-school',     pass:true,  cap:4, name:"Old School",       desc:"Books and supplies inside.", enter:true, buildName:"School"},
  church:       {ch:'\u26EA',      css:'t-church',     pass:true,  cap:3, name:"Abandoned Church",  desc:"A place of refuge.", enter:true, buildName:"Church"},
  police:       {ch:'\uD83D\uDE94',css:'t-police',     pass:true,  cap:5, name:"Police Station",   desc:"Weapons and gear inside.", enter:true, buildName:"Police Station"},
  fire_station: {ch:'\uD83D\uDE92',css:'t-fire',       pass:true,  cap:4, name:"Fire Station",     desc:"Tools and first aid.", enter:true, buildName:"Fire Station"},
  bar:          {ch:'\uD83C\uDF7A',css:'t-bar',        pass:true,  cap:3, name:"Old Bar",          desc:"Might find supplies.", enter:true, buildName:"Bar"},
  gas_station:  {ch:'\u26FD',      css:'t-gas',        pass:true,  cap:3, name:"Gas Station",      desc:"Small supply stop.", enter:true, buildName:"Gas Station"},
  apartment:    {ch:'\uD83C\uDFE2',css:'t-apartment',  pass:true,  cap:4, name:"Apartment Block",  desc:"Multi-room dwelling.", enter:true, buildName:"Apartment"},
  library:      {ch:'\uD83D\uDCDA',css:'t-library',    pass:true,  cap:4, name:"Public Library",   desc:"Knowledge and supplies.", enter:true, buildName:"Library"},
  bedroll:      {ch:'\uD83D\uDECC',css:'t-bedroll',    pass:true,  cap:0, name:"Bedroll",          desc:"A rough sleeping spot."},
  shelter:      {ch:'\uD83C\uDFD5\uFE0F',css:'t-shelter',    pass:true,  cap:0, name:"Lean-To",          desc:"A sturdy shelter."},
},

/* ═══════════════════════════════════════════════════════════
   INTERIOR TILES
   Properties:
     pass        — can the player walk on this?
     searchable  — can it be searched for loot?
     salvageable — can it be broken down for materials?
     container   — can items be stored/retrieved from it?
     entry       — is this an exit/entry point?
     barricadable— can it be barricaded with wood & nails?
     stair       — 'up' or 'down' stair connection
     lootAmount  — starting loot count (default 0)
     destructible— can be destroyed by player (turns to floor)
   ═══════════════════════════════════════════════════════════ */
itiles: {
  wall:       {ch:'\u2593', css:'it-wall',      pass:false},
  floor:      {ch:'\u00B7', css:'it-floor',     pass:true},
  door:       {ch:'\u256C', css:'it-door',      pass:true, entry:true, barricadable:true},
  window:     {ch:'\u25A2', css:'it-window',    pass:true, entry:true, barricadable:true},
  shelf:      {ch:'\uD83D\uDCE6',css:'it-shelf',     pass:false, searchable:true, salvageable:true, container:true, lootAmount:3},
  counter:    {ch:'\uD83D\uDD32',css:'it-counter',   pass:false, searchable:true, salvageable:true, container:true, lootAmount:2, destructible:true},
  ladder:     {ch:'\uD83E\uDE9C',css:'it-ladder',    pass:true, entry:true},
  stairs_up:  {ch:'\u25B2', css:'it-stup',      pass:true, stair:'up'},
  stairs_down:{ch:'\u25BC', css:'it-stdn',      pass:true, stair:'down'},
  pwall:      {ch:'\u2593', css:'it-pwall',     pass:false, salvageable:true},
  pdoor:      {ch:'\u256C', css:'it-pdoor',     pass:true, barricadable:true, salvageable:true},
  crate:      {ch:'\uD83D\uDCE6',css:'it-crate',     pass:false, container:true, salvageable:true},
  bwall:      {ch:'\u2588', css:'it-bwall',     pass:false},
  bfloor:     {ch:'\u2591', css:'it-bfloor',    pass:true},
  workbench:  {ch:'\uD83D\uDD28', css:'it-workbench', pass:false, searchable:true, salvageable:true, container:true, lootAmount:2, destructible:true},
  barrel:     {ch:'\uD83E\uDEE7', css:'it-barrel',    pass:false, searchable:true, salvageable:true, container:true, lootAmount:1, destructible:true},
  locker:     {ch:'\uD83D\uDD10', css:'it-locker',    pass:false, searchable:true, salvageable:true, container:true, lootAmount:2},
  table:      {ch:'\u2637',       css:'it-table',     pass:false, salvageable:true, destructible:true},
  chair:      {ch:'\u2441',       css:'it-chair',     pass:false, salvageable:true, destructible:true},
  fridge:     {ch:'\u2395',       css:'it-fridge',    pass:false, searchable:true, salvageable:true, container:true, lootAmount:2, destructible:true},
  bed:        {ch:'\uD83D\uDECF\uFE0F', css:'it-bed', pass:false, salvageable:true},
  toilet:     {ch:'\uD83D\uDEBD', css:'it-toilet',    pass:false, salvageable:true, destructible:true},
  bookshelf:  {ch:'\uD83D\uDCDA', css:'it-bookshelf', pass:false, searchable:true, salvageable:true, lootAmount:3},
},

/* ═══════════════════════════════════════════════════════════
   SALVAGE YIELDS — materials gained when salvaging furniture
   Add new entries for any salvageable interior tile.
   ═══════════════════════════════════════════════════════════ */
salvageYields: {
  shelf:     [{id:'wood',qty:1},{id:'nails',min:1,max:3}],
  counter:   [{id:'scrap',qty:1},{id:'nails',min:0,max:2}],
  pwall:     [{id:'wood',qty:1},{id:'nails',min:1,max:2}],
  pdoor:     [{id:'wood',qty:1},{id:'nails',qty:1}],
  crate:     [{id:'wood',qty:2},{id:'nails',min:1,max:3},{id:'scrap',qty:1}],
  workbench: [{id:'wood',qty:2},{id:'scrap',qty:2},{id:'nails',min:2,max:4}],
  barrel:    [{id:'scrap',qty:1},{id:'wood',qty:1}],
  locker:    [{id:'scrap',qty:2},{id:'nails',min:1,max:2}],
  table:     [{id:'wood',qty:1},{id:'nails',min:0,max:2}],
  chair:     [{id:'wood',qty:1}],
  fridge:    [{id:'scrap',qty:2},{id:'nails',min:1,max:2}],
  bed:       [{id:'cloth',qty:2},{id:'wood',qty:1}],
  toilet:    [{id:'scrap',qty:1}],
  bookshelf: [{id:'wood',qty:2},{id:'nails',min:1,max:3}],
},

/* ── Skills ──────────────────────────────────────────────── */
skills: {
  survival:  {name:"Survival",  start:true,  desc:"scavenging & searching"},
  combat:    {name:"Combat",    start:true,  desc:"damage dealt in fights"},
  carpentry: {name:"Carpentry", start:false, desc:"barricading & building"},
},

/* ═══════════════════════════════════════════════════════════
   SKILL REQUIREMENTS — configurable skill checks for actions
   ═══════════════════════════════════════════════════════════
   Format: [skillName, minLevel] or null for no requirement.
   Chance formulas: base + (skillLevel * perLevel)
   ═══════════════════════════════════════════════════════════ */
skillReqs: {
  barricade:       ['carpentry', 1],   // skill + min level needed
  searchChanceBase: 0.6,               // base search chance (interior)
  searchChancePerLvl: 0.05,            // bonus per survival level
  scavengeChanceBase: 0.45,            // base scavenge chance (world)
  scavengeChancePerLvl: 0.05,          // bonus per survival level
  salvageReq:       null,              // skill req for salvaging (null = none)
  craftBuilding:   ['carpentry', 1],   // skill for building recipes
  combatSkillBonus: 0.5,               // attack bonus per combat level
},

/* ═══════════════════════════════════════════════════════════
   ITEMS — Add new items here.
   Types: weapon, tool, body, feet, back, use, read, mat,
          place (world placement), iplace (interior placement)
   ═══════════════════════════════════════════════════════════ */
items: {
  knife:       {name:"Shiv",           type:'weapon',icon:'\uD83D\uDD2A',stat:'atk',val:3, wgt:0.5,dur:40},
  pipe:        {name:"Lead Pipe",      type:'weapon',icon:'\uD83D\uDD27',stat:'atk',val:4, wgt:1.5,dur:50},
  bat:         {name:"Nail Bat",       type:'weapon',icon:'\uD83C\uDFCF',stat:'atk',val:5, wgt:2.0,dur:60},
  rifle:       {name:"Old Rifle",      type:'weapon',icon:'\uD83D\uDD2B',stat:'atk',val:10,wgt:4.0,dur:25},
  torch:       {name:"Torch",          type:'tool',  icon:'\uD83D\uDD25',stat:'vis',val:1, wgt:0.5,dur:30},
  flashlight:  {name:"Flashlight",     type:'tool',  icon:'\uD83D\uDD26',stat:'vis',val:2, wgt:0.5,dur:80},
  hammer:      {name:"Hammer",         type:'tool',  icon:'\uD83D\uDD28',stat:'vis',val:0, wgt:1.0,dur:100},
  boots:       {name:"Work Boots",     type:'feet',  icon:'\uD83E\uDD7E',stat:'mov',val:1, wgt:1.0,dur:200},
  jacket:      {name:"Leather Jacket", type:'body',  icon:'\uD83E\uDDE5',stat:'def',val:5, wgt:2.0,dur:80},
  backpack:    {name:"Hiking Pack",    type:'back',  icon:'\uD83C\uDF92',stat:'cap',val:20,wgt:1.0},
  canned:      {name:"Canned Beans",   type:'use',   icon:'\uD83E\uDD6B',effect:'food', val:25,wgt:0.5,stack:10},
  jerky:       {name:"Dried Jerky",    type:'use',   icon:'\uD83E\uDD69',effect:'food', val:15,wgt:0.2,stack:10},
  water_b:     {name:"Water Bottle",   type:'use',   icon:'\uD83D\uDCA7',effect:'water',val:25,wgt:0.5,stack:10},
  bandage:     {name:"Bandage",        type:'use',   icon:'\uD83E\uDE79',effect:'heal', val:20,wgt:0.1,stack:5},
  med_kit:     {name:"First Aid Kit",  type:'use',   icon:'\uD83C\uDFE5',effect:'heal', val:40,wgt:0.5,stack:3},
  book_carp:   {name:"Carpentry Vol.1",type:'read',  icon:'\uD83D\uDCD8',skill:'carpentry',xp:50,wgt:0.5},
  scrap:       {name:"Scrap Metal",    type:'mat',   icon:'\u2699\uFE0F',wgt:0.2,stack:50},
  wood:        {name:"Plank",          type:'mat',   icon:'\uD83E\uDEB5',wgt:1.0,stack:10},
  nails:       {name:"Box of Nails",   type:'mat',   icon:'\uD83D\uDD29',wgt:0.1,stack:100},
  cloth:       {name:"Cloth Strip",    type:'mat',   icon:'\uD83E\uDDF5',wgt:0.1,stack:20},
  bedroll_kit: {name:"Bedroll Kit",    type:'place', icon:'\uD83D\uDECC',placeType:'bedroll',wgt:1.5},
  shelter_kit: {name:"Lean-To Kit",    type:'place', icon:'\uD83C\uDFD5\uFE0F',placeType:'shelter',wgt:3.0},
  wall_frame:  {name:"Wall Frame",     type:'iplace',icon:'\uD83E\uDDF1',placeType:'pwall',wgt:2.0},
  door_frame:  {name:"Door Frame",     type:'iplace',icon:'\uD83D\uDEAA',placeType:'pdoor',wgt:1.5},
  crate_kit:   {name:"Storage Crate",  type:'iplace',icon:'\uD83D\uDCE6',placeType:'crate',wgt:3.0},
},

/* ═══════════════════════════════════════════════════════════
   ENEMIES
   ═══════════════════════════════════════════════════════════ */
enemies: {
  shambler:{name:"Shambler",icon:'\uD83E\uDDDF',hp:12,atk:4, def:0,xp:15,speed:4},
  runner:  {name:"Runner",  icon:'\uD83D\uDC80',hp:8, atk:6, def:0,xp:25,speed:2},
  brute:   {name:"Brute",   icon:'\uD83D\uDC79',hp:30,atk:10,def:3,xp:50,speed:5},
},
zombieSpawns: [
  {id:'shambler',weight:10},
  {id:'runner',  weight:2},
  {id:'brute',   weight:1},
],

/* ═══════════════════════════════════════════════════════════
   RECIPES — Crafting
   cat: 'survival' | 'combat' | 'building'
   reqSkill: null or ['skillName', minLevel]
   ═══════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════
   LOOT POOLS — weighted item tables
   ═══════════════════════════════════════════════════════════ */
lootPools: {
  nature:          [{id:'wood',weight:15},{id:'cloth',weight:4},{id:'book_carp',weight:1}],
  road:            [{id:'scrap',weight:10},{id:'water_b',weight:5},{id:'nails',weight:8},{id:'knife',weight:2}],
  house:           [{id:'canned',weight:8},{id:'water_b',weight:8},{id:'bandage',weight:5},{id:'nails',weight:8},{id:'book_carp',weight:2},{id:'knife',weight:3},{id:'cloth',weight:6}],
  store:           [{id:'canned',weight:15},{id:'water_b',weight:12},{id:'bandage',weight:6},{id:'backpack',weight:2},{id:'boots',weight:2},{id:'flashlight',weight:3},{id:'jerky',weight:8}],
  garage:          [{id:'scrap',weight:15},{id:'nails',weight:12},{id:'wood',weight:8},{id:'pipe',weight:3},{id:'hammer',weight:2},{id:'cloth',weight:4}],
  clinic:          [{id:'bandage',weight:15},{id:'med_kit',weight:4},{id:'cloth',weight:8},{id:'water_b',weight:6}],
  warehouse:       [{id:'wood',weight:12},{id:'nails',weight:12},{id:'scrap',weight:10},{id:'cloth',weight:8},{id:'canned',weight:5},{id:'backpack',weight:2}],
  school:          [{id:'book_carp',weight:5},{id:'cloth',weight:8},{id:'bandage',weight:3},{id:'water_b',weight:5},{id:'wood',weight:4}],
  church:          [{id:'cloth',weight:10},{id:'bandage',weight:6},{id:'water_b',weight:6},{id:'canned',weight:4},{id:'candle',weight:3}],
  police:          [{id:'rifle',weight:3},{id:'knife',weight:5},{id:'bandage',weight:6},{id:'flashlight',weight:4},{id:'scrap',weight:8}],
  fire_station:    [{id:'hammer',weight:4},{id:'bandage',weight:8},{id:'med_kit',weight:3},{id:'boots',weight:3},{id:'nails',weight:6},{id:'scrap',weight:8}],
  bar:             [{id:'water_b',weight:8},{id:'canned',weight:5},{id:'cloth',weight:6},{id:'knife',weight:3},{id:'scrap',weight:5}],
  gas_station:     [{id:'scrap',weight:10},{id:'nails',weight:6},{id:'water_b',weight:8},{id:'jerky',weight:6},{id:'flashlight',weight:2}],
  apartment:       [{id:'canned',weight:8},{id:'water_b',weight:8},{id:'cloth',weight:6},{id:'bandage',weight:4},{id:'knife',weight:2},{id:'nails',weight:5}],
  library:         [{id:'book_carp',weight:6},{id:'cloth',weight:5},{id:'bandage',weight:3},{id:'water_b',weight:4}],
  shelf_house:     [{id:'canned',weight:10},{id:'water_b',weight:10},{id:'bandage',weight:8},{id:'cloth',weight:8},{id:'nails',weight:10},{id:'hammer',weight:3},{id:'knife',weight:4},{id:'jacket',weight:2},{id:'book_carp',weight:3}],
  shelf_store:     [{id:'canned',weight:15},{id:'water_b',weight:15},{id:'bandage',weight:10},{id:'jerky',weight:10},{id:'backpack',weight:3},{id:'flashlight',weight:5},{id:'boots',weight:3},{id:'rifle',weight:1}],
  shelf_garage:    [{id:'scrap',weight:15},{id:'nails',weight:12},{id:'hammer',weight:5},{id:'pipe',weight:4},{id:'wood',weight:8},{id:'flashlight',weight:3},{id:'boots',weight:2}],
  shelf_clinic:    [{id:'bandage',weight:15},{id:'med_kit',weight:6},{id:'cloth',weight:10},{id:'water_b',weight:8},{id:'book_carp',weight:2}],
  shelf_warehouse: [{id:'wood',weight:12},{id:'nails',weight:15},{id:'scrap',weight:12},{id:'cloth',weight:10},{id:'canned',weight:6},{id:'jerky',weight:4},{id:'backpack',weight:3},{id:'boots',weight:2}],
  shelf_bunker:    [{id:'canned',weight:10},{id:'water_b',weight:10},{id:'bandage',weight:8},{id:'cloth',weight:5},{id:'nails',weight:5}],
  shelf_school:    [{id:'book_carp',weight:8},{id:'cloth',weight:6},{id:'bandage',weight:4},{id:'water_b',weight:5},{id:'nails',weight:3}],
  shelf_church:    [{id:'cloth',weight:10},{id:'bandage',weight:8},{id:'water_b',weight:6},{id:'canned',weight:5}],
  shelf_police:    [{id:'rifle',weight:4},{id:'knife',weight:6},{id:'bandage',weight:8},{id:'flashlight',weight:5},{id:'scrap',weight:6},{id:'pipe',weight:3}],
  shelf_fire_station:[{id:'hammer',weight:5},{id:'bandage',weight:10},{id:'med_kit',weight:4},{id:'boots',weight:4},{id:'nails',weight:8},{id:'scrap',weight:6},{id:'jacket',weight:2}],
  shelf_bar:       [{id:'water_b',weight:10},{id:'canned',weight:6},{id:'cloth',weight:5},{id:'knife',weight:3},{id:'scrap',weight:4}],
  shelf_gas_station:[{id:'scrap',weight:12},{id:'nails',weight:8},{id:'water_b',weight:10},{id:'jerky',weight:8},{id:'flashlight',weight:3},{id:'pipe',weight:2}],
  shelf_apartment: [{id:'canned',weight:10},{id:'water_b',weight:10},{id:'cloth',weight:8},{id:'bandage',weight:6},{id:'knife',weight:3},{id:'nails',weight:6},{id:'jacket',weight:2}],
  shelf_library:   [{id:'book_carp',weight:10},{id:'cloth',weight:4},{id:'bandage',weight:3},{id:'water_b',weight:4}],
},
tileLoot: {grass:'nature', forest:'nature', road:'road', house:'house', store:'store', garage:'garage', clinic:'clinic', warehouse:'warehouse',
           school:'school', church:'church', police:'police', fire_station:'fire_station', bar:'bar', gas_station:'gas_station', apartment:'apartment', library:'library'},

/* ═══════════════════════════════════════════════════════════
   INTERIOR LAYOUTS
   Legend:  # wall   . floor   D door   W window   S shelf
            C counter   L ladder   U stairs_up   B stairs_down
            R bunker wall   T workbench   O barrel   K locker
            E table   H chair   F fridge   Z bed   P toilet
            Q bookshelf
   RULE: all entrances (D/W/L) on EDGE of grid
   ═══════════════════════════════════════════════════════════ */
layouts: {
  house: [
    ["#W#####","#S...S#","#.....#","#.....#","#S...S#","#.....#","#W#D#W#"],
    ["#W#####","#S....#","#.....#","#..####","#S..S.#","#.....#","#W#D#W#"],
    ["#####W#","#.S.S.#","#.....#","#.....#","#.....#","#S...S#","##WDW##"],
    ["#W#####","#S...S#","#.....#","###.###","#S...S#","#.....#","##WDW##"],
    ["###W####","#S....S#","#......#","#..SS..#","#......#","#S....S#","##W#DW##"],
    ["#W###W#","#Z...F#","#.....#","#.HEH.#","#.....#","#S...C#","##WDW##"],
    ["###W####","#Z..Z..#","#......#","###.####","#F..C..#","#......#","###DD###"],
    ["#W#####","#.Z.S.#","#.....#","#.E.H.#","#.....#","#F...C#","##WDW##"],
  ],
  house_basement: [
    ["#######","#S...S#","#.....#","#.....#","#.....#","#S...S#","####U##"],
    ["#######","#.....#","#.S.S.#","#.....#","#.....#","#.....#","####U##"],
    ["########","#O...S.#","#......#","#.T....#","#......#","#S...O.#","#####U##"],
  ],
  store: [
    ["###D#####","#.......#","#.S.S.S.#","#.......#","#.S.S.S.#","#.......#","#....C..#","####W####"],
    ["####D####","#.......#","#S.....S#","#.......#","#.S.S.S.#","#.......#","#S.....S#","####W####"],
    ["####D####","#.......#","#S.S.S.S#","#.......#","#.......#","#S.S.S.S#","#.......#","#..CC...#","####W####"],
    ["###DD####","#.......#","#.S.S.S.#","#.......#","#.S.S.S.#","#.......#","#...CC..#","####W####"],
    ["####D####","#.......#","#S..S..S#","#.......#","#.......#","#C.....C#","####W####"],
  ],
  store_basement: [
    ["#########","#S.....S#","#.......#","#.......#","#S.S.S.S#","#.......#","######U##"],
    ["########","#O..O..#","#......#","#S....S#","#......#","#####U##"],
  ],
  garage: [
    ["###D###","#S...S#","#.....#","#.....#","#..S..#","###W###"],
    ["###DD###","#S..S..#","#......#","#......#","#S....S#","###WW###"],
    ["###D###","#S...S#","#.....#","###.###","#.....#","#S...S#","###W###"],
    ["###D###","#T...O#","#.....#","#.....#","#S...S#","###W###"],
    ["####D###","#T.....#","#......#","#O...O.#","#......#","#S....S#","####W###"],
  ],
  clinic: [
    ["##WDW##","#.....#","#S...S#","##.#.##","#S...S#","#.....#","##WWW##"],
    ["###DW###","#......#","#S....S#","#.SS...#","#......#","#S....S#","###WW###"],
    ["###D###","#S...S#","#.....#","#..#..#","#.....#","#S...S#","###W###"],
    ["###D###","#K...K#","#.....#","#S...S#","#.....#","#.....#","###W###"],
    ["##WDW##","#.....#","#S.S.S#","#.....#","#K...K#","#.....#","##WWW##"],
  ],
  warehouse: [
    ["####DD####","#S..SS..S#","#........#","#........#","#S..SS..S#","#........#","####WW####"],
    ["####D####","#S.S.S.S#","#.......#","#.......#","#.......#","#S.S.S.S#","#.......#","####W####"],
    ["####DD####","#O..OO..O#","#........#","#S......S#","#........#","#O..OO..O#","####WW####"],
    ["#####D####","#S.......#","#.O...O..#","#........#","#.O...O..#","#S.......#","#####W####"],
  ],
  warehouse_upper: [
    ["##########","#S......S#","#........#","#........#","#S......S#","#........#","U#########"],
    ["#########","#S.....S#","#.......#","#.......#","#.......#","#.......#","U########"],
    ["#########","#O.O.O.O#","#.......#","#S.....S#","#.......#","#.......#","U########"],
  ],
  school: [
    ["####D####","#.......#","#.EH.EH.#","#.......#","#.EH.EH.#","#.......#","#Q.....Q#","####W####"],
    ["###D####","#......#","#Q....Q#","#......#","#.EHEH.#","#......#","#Q....Q#","###W####"],
    ["####D####","#.......#","#Q..Q..Q#","#.......#","#.......#","#Q..Q..Q#","#.......#","####W####"],
    ["####DD####","#........#","#.EH..EH.#","#........#","#.EH..EH.#","#........#","#QQ....QQ#","#####W####"],
  ],
  school_upper: [
    ["####U####","#.......#","#Q..Q..Q#","#.......#","#.EH.EH.#","#.......#","#########"],
    ["###U####","#......#","#.EHEH.#","#......#","#Q....Q#","#......#","########"],
  ],
  church: [
    ["###D###","#.....#","#H...H#","#H...H#","#H...H#","#.....#","#..E..#","###W###"],
    ["####D####","#.......#","#.H...H.#","#.H...H.#","#.H...H.#","#.......#","#...E...#","#.......#","####W####"],
    ["###D###","#.....#","#.H.H.#","#.....#","#.H.H.#","#.....#","#..S..#","###W###"],
  ],
  police: [
    ["###D####","#......#","#K..K..#","#......#","#.C..C.#","#......#","#K..K..#","###W####"],
    ["####D####","#.......#","#K.K.K.K#","#.......#","#...CC..#","#.......#","####W####"],
    ["####DD####","#........#","#K..CC..K#","#........#","#K......K#","#........#","#####W####"],
    ["###D###","#.....#","#K...K#","#..C..#","#K...K#","#.....#","###W###"],
  ],
  police_armory: [
    ["########","#K.K.K.#","#......#","#K.K.K.#","#......#","#####U##"],
    ["#######","#K...K#","#.....#","#S...S#","#.....#","####U##"],
  ],
  fire_station: [
    ["####DD####","#........#","#.T....T.#","#........#","#K......K#","#........#","####WW####"],
    ["###DD###","#......#","#T....T#","#......#","#K..K..#","#......#","###WW###"],
    ["####DD####","#........#","#O..OO..O#","#........#","#T......T#","#........#","####WW####"],
  ],
  fire_upper: [
    ["#########","#Z..Z..Z#","#.......#","#K.....K#","#.......#","######U##"],
    ["########","#Z....Z#","#......#","#......#","#K....K#","#####U##"],
  ],
  bar: [
    ["###D###","#.....#","#H.E.H#","#.....#","#CCCCC#","#.....#","###W###"],
    ["####D####","#.......#","#H.E.E.H#","#.......#","#.CCCCC.#","#.......#","####W####"],
    ["###D###","#.....#","#.HEH.#","#.....#","#.CCC.#","#S...O#","###W###"],
    ["####D###","#......#","#HE..EH#","#......#","#CCCCCC#","#......#","####W###"],
  ],
  bar_cellar: [
    ["#######","#O.O.O#","#.....#","#O.O.O#","#.....#","####U##"],
    ["########","#O..O..#","#......#","#O..O..#","#......#","#####U##"],
  ],
  gas_station: [
    ["###D###","#.....#","#S...S#","#.....#","#.C.C.#","###W###"],
    ["####D###","#S....S#","#......#","#..CC..#","#......#","####W###"],
    ["###D###","#.....#","#S.S.S#","#.....#","#..C..#","###W###"],
  ],
  apartment: [
    ["###D####","#......#","#Z...F.#","#......#","###.####","#Z...F.#","#......#","###W####"],
    ["####D####","#.......#","#Z..#..Z#","#...#...#","#F..#..F#","#.......#","####W####"],
    ["####DD####","#........#","#Z.#..#.Z#","#..#..#..#","#F.#..#.F#","#........#","#####W####"],
    ["###D###","#.....#","#Z..F.#","#.HE..#","#.....#","###W###"],
  ],
  apartment_upper: [
    ["########","#Z...F.#","#......#","###.####","#Z...F.#","#......#","#####U##"],
    ["########","#Z..#.Z#","#...#..#","#F..#.F#","#......#","#####U##"],
  ],
  library: [
    ["####D####","#.......#","#Q.Q.Q.Q#","#.......#","#Q.Q.Q.Q#","#.......#","#.......#","####W####"],
    ["###D####","#......#","#Q..Q..#","#......#","#Q..Q..#","#......#","#.EH...#","###W####"],
    ["####D####","#.......#","#Q.Q.Q.Q#","#.......#","#.......#","#Q.Q.Q.Q#","#.......#","####W####"],
    ["####DD####","#........#","#QQ....QQ#","#........#","#QQ....QQ#","#........#","#..EHEH..#","#####W####"],
  ],
  library_upper: [
    ["#########","#Q.Q.Q.Q#","#.......#","#Q.Q.Q.Q#","#.......#","######U##"],
    ["########","#Q..Q..#","#......#","#Q..Q..#","#......#","#####U##"],
  ],
  bunker: [
    ["RRRRRRRRR","R.......R","R..S.S..R","R.......R","R.......R","R..S.S..R","R.......R","RRRRLRRRR"],
  ],
},

/* ═══════════════════════════════════════════════════════════
   MULTI-FLOOR CONFIG — Extra floors for buildings
   ═══════════════════════════════════════════════════════════ */
multiFloor: {
  house:        {extra:'house_basement',   chance:0.30, dir:'down', label:'Basement'},
  store:        {extra:'store_basement',   chance:0.20, dir:'down', label:'Storage Cellar'},
  warehouse:    {extra:'warehouse_upper',  chance:0.35, dir:'up',   label:'Upper Floor'},
  school:       {extra:'school_upper',     chance:0.40, dir:'up',   label:'Second Floor'},
  police:       {extra:'police_armory',    chance:0.35, dir:'down', label:'Armory'},
  fire_station: {extra:'fire_upper',       chance:0.30, dir:'up',   label:'Dormitory'},
  bar:          {extra:'bar_cellar',       chance:0.40, dir:'down', label:'Wine Cellar'},
  apartment:    {extra:'apartment_upper',  chance:0.50, dir:'up',   label:'Upper Floor'},
  library:      {extra:'library_upper',    chance:0.35, dir:'up',   label:'Upper Stacks'},
},

/* ═══════════════════════════════════════════════════════════
   BUILDABLES CONFIG — Example section for new buildable items
   ═══════════════════════════════════════════════════════════
   HOW TO ADD A NEW BUILDABLE:
   1. Add the item to `items` above (type: 'iplace' for interior)
   2. Add the interior tile to `itiles` above
   3. Add an icon entry to `icons` above
   4. Add CSS class in index.html (.it-yourtype)
   5. Add salvage yields to `salvageYields` (optional)
   6. Add a recipe to `recipes` (optional)
   7. If it's a container, set container:true in itiles
   8. If it's searchable, set searchable:true + lootAmount
   9. Add a layout char mapping to world.js _charMap

   EXAMPLE: Adding a "Rain Barrel" that stores water items
   - itiles.barrel has container:true ← already done above
   - items would need a barrel_kit with type:'iplace'
   - recipes would need a barrel_c crafting recipe
   ═══════════════════════════════════════════════════════════ */
buildables: {
  workbench: { tileKey: 'workbench', isContainer: true, isSearchable: true, isSalvageable: true, layoutChar: 'T',
    notes: "A crafting station. Could be used as a future crafting requirement." },
  barrel: { tileKey: 'barrel', isContainer: true, isSearchable: true, isSalvageable: true, layoutChar: 'O',
    notes: "Small storage container, found in garages and warehouses." },
  locker: { tileKey: 'locker', isContainer: true, isSearchable: true, isSalvageable: true, layoutChar: 'K',
    notes: "Metal storage locker, found in clinics and warehouses." },
  crate: { tileKey: 'crate', isContainer: true, isSearchable: false, isSalvageable: true, layoutChar: null,
    notes: "Player-craftable storage. Not found in building layouts." },
},

/* ═══════════════════════════════════════════════════════════
   DISPLAY OPTIONS — Tweak rendering behavior
   ═══════════════════════════════════════════════════════════ */
display: {
  showFogOfWar: true,           // show unexplored tiles as fog
  showZombieGlow: true,         // red glow on zombie tiles
  mapViewRadius: 4,             // tiles visible around player on world map
  tileSize: 36,                 // base tile size in pixels (world map)
  enableTileVariants: true,     // randomize grass/forest tile chars
},

startItems: ['canned','canned','water_b','water_b','knife','bandage','bandage','hammer','nails','wood','wood','book_carp'],

player: {hp:100, stm:100, food:80, h2o:80, maxWeight:15},

tuning: {
  baseVision:3, nightVisPen:1, moveCost:2, encumberedStamPen:2,
  scavengeCost:8, searchCost:5, salvageCost:5,
  tickHunger:0.25, tickThirst:0.4, starveDmg:1,
  baseDmg:1, durWeapon:1, durArmor:1, durTool:1,
  turnsPerDay:24, nightRatio:0.35,
  initZombies:6, zombiesPerNight:3, zombieEsc:0.3, maxZombies:30,
  zombieAggro:5, zombieSpawnBuf:10,
  interiorZombieChance:0.25, barricadeHp:50,
},

/* ═══════════════════════════════════════════════════════════
   WORLD GENERATION — Controls map layout, towns, cities
   ═══════════════════════════════════════════════════════════
   Settlement types:
     - hamlet:  1-2 buildings off a road
     - town:    small cluster along road (3-6 buildings)
     - city:    larger cluster, more variety (7+ buildings)
   Buildings always spawn adjacent to roads.
   ═══════════════════════════════════════════════════════════ */
worldGen: {
  cityCount: 4,                  // number of city centers
  townCount: 6,                  // number of smaller towns
  hamletCount: 10,               // number of tiny hamlets
  cityMinEdgeBuffer: 8,          // min distance from map edge
  terrainWaterThreshold: 1.8,
  terrainForestThreshold: 1.2,
  // City core: tight cluster of diverse buildings along roads
  cityBuildingCount: {min:8, max:14},
  cityBuildingDist: [
    {type:'house',weight:20},{type:'store',weight:15},{type:'garage',weight:10},
    {type:'clinic',weight:10},{type:'warehouse',weight:8},{type:'school',weight:6},
    {type:'church',weight:4},{type:'police',weight:5},{type:'fire_station',weight:4},
    {type:'bar',weight:6},{type:'gas_station',weight:5},{type:'apartment',weight:10},
    {type:'library',weight:5},
  ],
  // Town: moderate cluster along road
  townBuildingCount: {min:3, max:6},
  townBuildingDist: [
    {type:'house',weight:35},{type:'store',weight:15},{type:'garage',weight:12},
    {type:'clinic',weight:8},{type:'bar',weight:8},{type:'gas_station',weight:10},
    {type:'church',weight:6},{type:'warehouse',weight:6},
  ],
  // Hamlet: 1-2 buildings at a road bend
  hamletBuildingCount: {min:1, max:2},
  hamletBuildingDist: [
    {type:'house',weight:50},{type:'gas_station',weight:15},{type:'garage',weight:15},
    {type:'church',weight:10},{type:'bar',weight:10},
  ],
  // Road gen settings
  roadBranchChance: 0.25,         // chance of a side road from a city
  roadBranchLength: {min:5, max:15},
},
};
