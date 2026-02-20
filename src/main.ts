/* ═══════════════════════════════════════════════════════════
   WASTELAND SURVIVOR — main.ts
   Entry point — boots the game
   ═══════════════════════════════════════════════════════════ */

import { Game } from './game';

// Expose Game class globally for HTML onclick handlers (G.move, G.rest, etc.)
declare global {
  // eslint-disable-next-line no-var
  var G: Game;
}

window.onload = function() {
  try {
    window.G = new Game();
  } catch(e: unknown) {
    const log = document.getElementById('gameLog');
    const msg = e instanceof Error ? e.message : String(e);
    if (log) log.innerHTML = '<div class="le l-bad">Error: ' + msg + '</div>';
    console.error(e);
  }
};
