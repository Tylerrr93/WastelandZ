# WastelandZ — TypeScript Edition

Post-apocalyptic browser survival game, converted from vanilla JS to TypeScript.

## Project Structure

```
src/
├── types.ts    — All interfaces & type definitions (402 lines)
├── config.ts   — Game data: tiles, items, enemies, recipes, tuning
├── world.ts    — Procedural world gen + interior/building generation
├── ui.ts       — All DOM rendering & display logic
├── game.ts     — Consolidated Game class (core + player + actions + combat + inventory)
└── main.ts     — Entry point, boots the game
dist/
├── index.html  — Game HTML (loads single bundle)
└── bundle.js   — Compiled & bundled output
```

## Key Changes from JS Version

- **Type safety**: 400+ lines of interfaces covering every data structure
- **Single Game class**: The 5 prototype-extension files (`game.js`, `player.js`, `actions.js`, `combat.js`, `inventory.js`) are consolidated into one properly typed class with clear section markers
- **ES modules**: `import`/`export` instead of global `const` objects
- **Bundled output**: esbuild compiles TS → single `bundle.js` (106KB, 22KB gzipped)
- **Source maps**: Full debugging support back to `.ts` files

## Commands

```bash
npm install              # Install TypeScript + esbuild
npm run build            # Compile + bundle → dist/bundle.js
npm run build:min        # Minified production build
npm run watch            # Auto-rebuild on file changes
npm run typecheck        # Run tsc type checker (no emit)
npm run dev              # Typecheck + build
```

## Development Workflow

1. Edit `.ts` files in `src/`
2. Run `npm run watch` for auto-rebuild
3. Open `dist/index.html` in browser
4. Source maps let you debug original `.ts` in dev tools

## Adding New Content

- **New item**: Add to `ItemId` union in `types.ts`, then add definition in `config.ts`
- **New enemy**: Add to `EnemyId` union, define in `config.ts`, add to `zombieSpawns`
- **New tile**: Add to `WorldTileType` or `InteriorTileType`, define in `config.ts`
- **New recipe**: Add to `RecipeId` union, define in `config.ts`

TypeScript will catch any missing fields or typos at compile time.
