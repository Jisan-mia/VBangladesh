// পাটি 1 and 2 teach by glowing the button you need next. The goal is the best resting place for the strip (rows woven first,
// then a low, even stack with no holes), worked out once when the strip enters. Not per frame, so it may allocate.
import { deepest, fits } from "./step.hot";
import { COLS, ROWS, SUI, TURNS } from "./pieces";
import type { Game } from "./game";

export type Target = { turn: number; x: number };

export function bestSpot(game: Game): Target | null {
  if (!game.live) return null;
  const kind = game.kind, turns = kind === SUI || game.wet ? 1 : 4;
  let best: Target | null = null, bestValue = -Infinity;
  for (let step = 0; step < turns; step++) {
    const turn = kind === SUI || game.wet ? game.turn : (game.turn + step) % 4;
    for (let x = -3; x < COLS; x++) {
      if (!fits(game.board, kind, turn, x, game.y)) continue;
      const board = game.board.slice();
      if (kind === SUI) board[deepest(board, x) * COLS + x] = 1;
      else {
        let y = game.y;
        while (fits(game.board, kind, turn, x, y + 1)) y++;
        const cells = TURNS[kind][turn];
        for (let i = 0; i < cells.length; i += 2) board[(y + cells[i + 1]) * COLS + x + cells[i]] = 1;
      }
      let lines = 0, holes = 0, total = 0, bump = 0, last = -1;
      for (let row = 0; row < ROWS; row++) if (board.subarray(row * COLS, row * COLS + COLS).every(Boolean)) lines++;
      for (let col = 0; col < COLS; col++) {
        let top = ROWS;
        for (let row = 0; row < ROWS; row++) if (board[row * COLS + col]) { top = row; break; }
        for (let row = top + 1; row < ROWS; row++) if (!board[row * COLS + col]) holes++;
        total += ROWS - top;
        if (last >= 0) bump += Math.abs(ROWS - top - last);
        last = ROWS - top;
      }
      // Fewer turns and steps break ties, so the glow never asks for a needless move.
      const value = lines * 0.76 - total * 0.51 - holes * 0.36 - bump * 0.18 - step * 0.001 - Math.abs(x - game.x) * 0.0005;
      if (value > bestValue) { bestValue = value; best = { turn, x }; }
    }
  }
  return best;
}

/** The button that brings the strip closer to `target`: 1 ◀, 2 ঘোরাও, 3 ▶, 4 নামাও. */
export function nextButton(game: Game, target: Target | null) {
  if (!target || !game.live) return 0;
  if (game.turn !== target.turn) return 2;
  if (game.x > target.x) return 1;
  if (game.x < target.x) return 3;
  return 4;
}
