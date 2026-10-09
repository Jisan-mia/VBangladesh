import { boundPosition, type Position } from './scene';

export function dragPosition(origin: Position, start: Position, current: Position): Position {
  return boundPosition({ x: origin.x + current.x - start.x, y: origin.y + current.y - start.y });
}

export function passedDragThreshold(start: Position, current: Position): boolean {
  return Math.hypot(current.x - start.x, current.y - start.y) >= 4;
}
