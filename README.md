# WastelandZ — TypeScript Edition

Post-apocalyptic browser survival gamme inspired by ProjectZomboid

## Project Structure

```
src/
├── types.ts    — All interfaces & type definitions 
├── config.ts   — Game data: tiles, items, enemies, recipes, tuning
├── world.ts    — Procedural world gen + interior/building generation
├── ui.ts       — All DOM rendering & display logic
├── game.ts     — Consolidated Game class (core + player + actions + combat + inventory)
└── main.ts     — Entry point, boots the game
dist/
├── index.html  — Game HTML (loads single bundle)
└── bundle.js   — Compiled & bundled output
```

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

## Adding New Contnt

- **New item**: Add to `ItemId` union in `types.ts`, then add definition in `config.ts`
- **New enemy**: Add to `EnemyId` union, define in `config.ts`, add to `zombieSpawns`
- **New tile**: Add to `WorldTileType` or `InteriorTileType`, define in `config.ts`
- **New recipe**: Add to `RecipeId` union, define in `config.ts`
