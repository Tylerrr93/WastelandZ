/* ═══════════════════════════════════════════════════════════
   WASTELAND SURVIVOR — types.ts
   All interfaces and type definitions
   ═══════════════════════════════════════════════════════════ */

// ── Tile Types ────────────────────────────────────────────

export type WorldTileType =
  | 'grass' | 'forest' | 'water' | 'road' | 'bridge'
  | 'house' | 'store' | 'garage' | 'clinic' | 'warehouse'
  | 'bunker_hatch' | 'bedroll' | 'shelter' | 'rain_catcher'
  // ── Extensible: add new placeable world tiles here ──────
  | 'campfire' | 'watch_tower' | 'garden_plot' | 'barricade_wall';

export type InteriorTileType =
  | 'wall' | 'floor' | 'door' | 'window' | 'shelf' | 'counter'
  | 'locker' | 'ladder' | 'stairs_up' | 'stairs_down'
  | 'pwall' | 'pdoor' | 'crate' | 'bwall' | 'bfloor'
  // ── Extensible: add new interior placeable tiles here ───
  | 'workbench' | 'forge' | 'med_station' | 'barricade_window';

export type BuildingType = 'house' | 'store' | 'garage' | 'clinic' | 'warehouse' | 'bunker';

export type LayoutKey =
  | 'house' | 'house_basement' | 'store' | 'store_basement'
  | 'garage' | 'clinic' | 'warehouse' | 'warehouse_upper' | 'bunker';

// ── Item & Equipment Types ────────────────────────────────

export type ItemType = 'weapon' | 'tool' | 'body' | 'feet' | 'back' | 'use' | 'read' | 'mat' | 'place' | 'iplace';
export type EquipSlot = 'weapon' | 'tool' | 'body' | 'feet' | 'back';
export type StatType = 'atk' | 'vis' | 'def' | 'mov' | 'cap';
export type EffectType = 'food' | 'water' | 'heal';

export type ItemId =
  | 'knife' | 'pipe' | 'bat' | 'rifle'
  | 'torch' | 'flashlight' | 'hammer'
  | 'boots' | 'jacket' | 'backpack'
  | 'canned' | 'jerky' | 'water_b' | 'bandage' | 'med_kit'
  | 'book_carp'
  | 'scrap' | 'wood' | 'nails' | 'cloth' | 'metal_sheet'
  | 'bedroll_kit' | 'shelter_kit' | 'rain_kit'
  | 'wall_frame' | 'door_frame' | 'crate_kit' | 'locker_kit'
  // ── Extensible: add new item ids here ───────────────────
  | 'workbench_kit' | 'forge_kit' | 'med_station_kit'
  | 'campfire_kit' | 'watch_tower_kit' | 'garden_kit'
  | 'bwall_kit' | 'rope' | 'charcoal' | 'herbs';

export type EnemyId = 'shambler' | 'runner' | 'brute';

export type SkillId = 'survival' | 'combat' | 'carpentry';

export type RecipeId =
  | 'bandage_c' | 'torch_c' | 'med_kit_c' | 'bedroll_c'
  | 'pipe_c' | 'nail_bat'
  | 'wall_frame' | 'door_frame' | 'shelter_c' | 'crate_c'
  | 'sheet_c' | 'locker_c' | 'rain_c'
  // ── Extensible: add new recipe ids here ─────────────────
  | 'workbench_c' | 'forge_c' | 'med_station_c'
  | 'campfire_c' | 'watch_tower_c' | 'garden_c' | 'bwall_c';

export type RecipeCategory = 'survival' | 'combat' | 'building';

export type RestTier = 'rough' | 'bedroll' | 'shelter' | 'indoor' | 'bunker';

export type LootPoolId =
  | 'nature' | 'road' | 'house' | 'store' | 'garage' | 'clinic' | 'warehouse'
  | 'shelf_house' | 'shelf_store' | 'shelf_garage' | 'shelf_clinic'
  | 'shelf_warehouse' | 'shelf_bunker';

export type LocationState = 'world' | 'interior';

// ── Visual Settings ───────────────────────────────────────

export type VisualStyle = 'emoji' | 'ascii';

export interface VisualSettings {
  style: VisualStyle;
  randomizeTerrain: boolean;
}

// ── Tile Definitions ──────────────────────────────────────

export interface WorldTileDef {
  txt: string;
  icon?: string;
  img?: string;
  imgV?: string[];
  css: string;
  pass: boolean;
  cap: number;
  name: string;
  desc: string;
  placeable?: boolean;
  enter?: boolean;
  buildName?: string;
  txtV?: string[];
  iconV?: string[];
}

export interface InteriorTileDef {
  txt: string;
  icon?: string;
  img?: string;
  imgV?: string[];
  css: string;
  pass: boolean;
  entry?: boolean;
  barricadable?: boolean;
  searchable?: boolean;
  salvageable?: boolean;
  container?: boolean;
  stair?: 'up' | 'down';
  /** If set, this tile is a crafting station. Actions in STRUCTURE_DEFS[craftingStation] are available when adjacent. */
  craftingStation?: StructureId;
}

// ── Map Cell Data ─────────────────────────────────────────

export interface WorldCell {
  type: WorldTileType;
  loot: number;
  max: number;
  interior?: Building;
  /** Runtime metadata set by structure placement — e.g. hp, fuel, growth stage */
  meta?: Record<string, number | string>;
}

export interface InteriorCell {
  type: InteriorTileType;
  loot: number;
  barricadeHp: number;
  storage?: StorageEntry[];
  /** Runtime metadata set by structure placement — e.g. hp, fuel, growth stage */
  meta?: Record<string, number | string>;
}

// ── Items ─────────────────────────────────────────────────

export interface ItemDef {
  name: string;
  type: ItemType;
  icon: string;
  stat?: StatType;
  val?: number;
  wgt: number;
  dur?: number;
  stack?: number;
  effect?: EffectType;
  skill?: SkillId;
  xp?: number;
  placeType?: WorldTileType | InteriorTileType;
}

export interface InventoryItem {
  id: ItemId;
  uid: string;
  qty: number;
  hp: number | null;
  maxHp: number | null;
}

export interface StorageEntry {
  id: ItemId;
  qty: number;
}

export interface GroundItem {
  id: ItemId;
  qty: number;
}

// ── Enemies ───────────────────────────────────────────────

export interface EnemyDef {
  name: string;
  icon: string;
  txt: string;
  img?: string;
  hp: number;
  atk: number;
  def: number;
  xp: number;
  speed: number;
}

export interface Zombie {
  x: number;
  y: number;
  type: EnemyId;
  hp: number;
  maxHp: number;
}

// ── Skills ────────────────────────────────────────────────

export interface SkillDef {
  name: string;
  start: boolean;
  desc: string;
}

export interface SkillState {
  lvl: number;
  xp: number;
}

// ── Recipes ───────────────────────────────────────────────

export interface RecipeDef {
  name: string;
  cat: RecipeCategory;
  reqSkill: [SkillId, number] | null;
  tool?: ItemId;
  inputs: Partial<Record<ItemId, number>>;
  result: { type: string; id: ItemId; count?: number };
  /** If set, player must be adjacent to this interior tile type to craft */
  requiresStation?: InteriorTileType;
}

// ── Rest ──────────────────────────────────────────────────

export interface RestTierDef {
  stm: number;
  hp: number;
  food: number;
  water: number;
  ticks: number;
  label: string;
  msg: string[];
}

// ── Loot ──────────────────────────────────────────────────

export interface WeightedEntry<T extends string = string> {
  id: T;
  weight: number;
}

export interface WeightedTypeEntry {
  type: string;
  weight: number;
}

export interface SalvageYield {
  id: ItemId;
  qty?: number;
  min?: number;
  max?: number;
}

// ── Interiors ─────────────────────────────────────────────

export interface Floor {
  map: InteriorCell[][];
  w: number;
  h: number;
  entryPos: Position;
  label: string;
}

export interface Building {
  floors: Floor[];
  buildingType: BuildingType;
  cleared: boolean;
}

export interface AdjacentResult {
  x: number;
  y: number;
  cell: InteriorCell;
}

export interface ContainerResult {
  x: number;
  y: number;
  cell: InteriorCell;
}

// ── Positions ─────────────────────────────────────────────

export interface Position {
  x: number;
  y: number;
}

// ── Player Stats ──────────────────────────────────────────

export interface PlayerStats {
  hp: number;
  stm: number;
  food: number;
  h2o: number;
  maxWeight: number;
}

// ── Log Entry ─────────────────────────────────────────────

export interface LogEntry {
  m: string;
  c: string;
}

// ── Tuning Config ─────────────────────────────────────────

export interface TuningConfig {
  baseVision: number;
  nightVisPen: number;
  moveCost: number;
  encumberedStamPen: number;
  scavengeCost: number;
  searchCost: number;
  salvageCost: number;
  scavengeChance: number;
  tickHunger: number;
  tickThirst: number;
  starveDmg: number;
  baseDmg: number;
  combatSkillBonus: number;
  durWeapon: number;
  durArmor: number;
  durTool: number;
  turnsPerDay: number;
  nightRatio: number;
  initZombies: number;
  zombiesPerNight: number;
  zombieEsc: number;
  maxZombies: number;
  zombieAggro: number;
  zombieSpawnBuf: number;
  interiorZombieChance: number;
  barricadeHp: number;
}

// ── World Generation Config ───────────────────────────────

export interface WorldGenConfig {
  cityCount: number;
  cityMinEdgeBuffer: number;
  cityMinSpacing: number;
  cityCoreDist: number;
  citySuburbDist: number;
  citySuburbChance: number;
  buildingsNeedRoad: boolean;
  cityStreets: {
    enabled: boolean;
    spacing: number;
    reach: number;
    jitter: number;
  };
  roadBranching: {
    enabled: boolean;
    chance: number;
    minLen: number;
    maxLen: number;
  };
  roadsidePOIs: {
    enabled: boolean;
    chance: number;
    minCityDist: number;
    types: WeightedTypeEntry[];
  };
  hamlets: {
    enabled: boolean;
    count: number;
    minSize: number;
    maxSize: number;
    minCityDist: number;
    minHamletDist: number;
    types: WeightedTypeEntry[];
  };
  wildernessPOIs: {
    enabled: boolean;
    count: number;
    minCityDist: number;
    minPOIDist: number;
    types: WeightedTypeEntry[];
  };
  terrain: {
    clearings: { enabled: boolean; chance: number; radius: number };
    denseForest: { enabled: boolean; chance: number; radius: number };
  };
  terrainWaterThreshold: number;
  terrainForestThreshold: number;
  coreDist: WeightedTypeEntry[];
  suburbDist: WeightedTypeEntry[];
}

// ── Multi-Floor Config ────────────────────────────────────

export interface MultiFloorDef {
  extra: LayoutKey;
  chance: number;
  dir: 'up' | 'down';
  label: string;
}

// ── Master Config ─────────────────────────────────────────

export interface GameConfig {
  w: number;
  h: number;
  visuals: VisualSettings;
  tiles: Record<WorldTileType, WorldTileDef>;
  itiles: Record<InteriorTileType, InteriorTileDef>;
  salvageYields: Partial<Record<InteriorTileType, SalvageYield[]>>;
  skills: Record<SkillId, SkillDef>;
  items: Record<ItemId, ItemDef>;
  enemies: Record<EnemyId, EnemyDef>;
  zombieSpawns: WeightedEntry<EnemyId>[];
  recipes: Record<RecipeId, RecipeDef>;
  restTiers: Record<RestTier, RestTierDef>;
  lootPools: Record<LootPoolId, WeightedEntry<ItemId>[]>;
  tileLoot: Partial<Record<WorldTileType, LootPoolId>>;
  layouts: Record<LayoutKey, string[][]>;
  multiFloor: Partial<Record<BuildingType, MultiFloorDef>>;
  startItems: ItemId[];
  player: PlayerStats;
  tuning: TuningConfig;
  worldGen: WorldGenConfig;
}

// ═══════════════════════════════════════════════════════════
//  STRUCTURE & ACTION SYSTEM
//  Add new buildables/interactions without touching game.ts
// ═══════════════════════════════════════════════════════════

/**
 * Every unique structure/station/placeable has a StructureId.
 * To add a new one: add its string here, define it in structures.ts.
 */
export type StructureId =
  // World structures (type:'place' items place these)
  | 'campfire' | 'watch_tower' | 'garden_plot' | 'barricade_wall'
  // Interior structures (type:'iplace' items place these)
  | 'workbench' | 'forge' | 'med_station' | 'barricade_window'
  // Built-in interior tiles that also act as stations
  | 'crate' | 'locker' | 'shelf';

/**
 * ActionId — every contextual action button in the game.
 * Built-in engine actions use reserved ids; world action ids are arbitrary.
 * To add a new action: add its id here, define it in structures.ts WORLD_ACTIONS.
 */
export type ActionId =
  // Engine reserved
  | 'scavenge' | 'search' | 'barricade' | 'salvage'
  | 'enter' | 'exit' | 'stairs' | 'rest' | 'wait'
  | 'attack' | 'store' | 'pickup' | 'place'
  // Structure-driven actions (defined in structures.ts)
  | 'campfire_cook' | 'campfire_extinguish'
  | 'garden_water' | 'garden_harvest'
  | 'watch_tower_climb' | 'workbench_craft' | 'forge_smelt'
  | 'med_station_treat';

/**
 * ActionContext — everything an action handler needs.
 * Passed to WorldActionDef.handler and StructureDef.interactions[].handler.
 */
export interface ActionContext {
  game: import('./game').Game;
  structureX?: number;
  structureY?: number;
  tileType?: WorldTileType | InteriorTileType;
}

/**
 * StructureInteraction — one button/action available when adjacent to a structure.
 * Define these inside StructureDef.interactions[].
 */
export interface StructureInteraction {
  id: ActionId;
  label: string;
  icon: string;
  /** Returns false if the action is currently unavailable (button shown disabled w/ reason) */
  canDo?: (ctx: ActionContext) => { ok: boolean; reason?: string };
  handler: (ctx: ActionContext) => void;
}

/**
 * StructureDef — full definition of a placeable structure.
 *
 * HOW TO ADD A NEW STRUCTURE:
 *  1. Add its StructureId above
 *  2. Add a WorldTileType or InteriorTileType for its tile (in types.ts + config.ts)
 *  3. Add a placeable item (ItemId, ItemDef in config.ts) with placeType set
 *  4. Add a recipe for that item in config.ts
 *  5. Add the StructureDef here in structures.ts
 *  Done — UI and game.ts pick it up automatically.
 */
export interface StructureDef {
  id: StructureId;
  /** Matches the WorldTileType or InteriorTileType this structure occupies */
  tileType: WorldTileType | InteriorTileType;
  /** Whether this is a world-map tile or an interior tile */
  location: 'world' | 'interior';
  name: string;
  icon: string;
  /** Actions available when player is on (world) or adjacent (interior) to this structure */
  interactions: StructureInteraction[];
  /** Materials yielded when dismantled/salvaged (overrides config.ts salvageYields for this type) */
  salvageYields?: SalvageYield[];
  /** Max HP for destructible structures; undefined = indestructible */
  maxHp?: number;
  /** XP awarded to carpentry on placement */
  placeXp?: number;
}
