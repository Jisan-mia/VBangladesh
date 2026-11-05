// Sizes shared by the CSS and the canvas: one formula, so the board, the picture it turns into and the buttons agree.
// The stage is the player's play area in CSS px (0 × 0 before it is measured: a phone-sized fallback).

/** The rows around the board: the top row, the controls row (96 px buttons) and the gaps and padding between. */
export const CHROME = 214;
export const BUTTON = 96;
export const PICTURE_MIN = 180;

export function boardSize(stageWidth: number, stageHeight: number) {
  const width = stageWidth || 360, height = stageHeight || 640;
  return Math.round(Math.max(236, Math.min(width - 24, 440, height - CHROME)));
}

/** The picture a finished letter turns into: most of the board, never under 180 px. */
export function pictureSize(board: number) {
  return Math.round(Math.max(PICTURE_MIN, Math.min(300, board * 0.68)));
}
