import { Coord, GameState } from "./types"
import { directions, isOutOfBounds, isObstacle } from "./utils"

export function floodFill(
    start: Coord,
    gameState: GameState,
    direction: keyof typeof directions
  ): number {
    const visited = new Set<string>();
    const queue: Coord[] = [];
    const width = gameState.board.width;
    const height = gameState.board.height;
    const snakes = gameState.board.snakes;
  
    // Start flood fill in the specified direction
    const initialCoord = { x: start.x + directions[direction].x, y: start.y + directions[direction].y };
    if (isOutOfBounds(initialCoord, width, height) || isObstacle(initialCoord, snakes)) {
      return 0;
    }
  
    queue.push(initialCoord);
    visited.add(`${initialCoord.x},${initialCoord.y}`);
    let spaceSize = 0;
  
    while (queue.length > 0) {
      const current = queue.shift()!;
      spaceSize++;
  
      // Explore neighbors in all four directions
      for (const dir in directions) {
        const next = { x: current.x + directions[dir].x, y: current.y + directions[dir].y };
  
        if (
          !isOutOfBounds(next, width, height) &&
          !visited.has(`${next.x},${next.y}`) &&
          !isObstacle(next, snakes)
        ) {
          queue.push(next);
          visited.add(`${next.x},${next.y}`);
        }
      }
    }
  
    return spaceSize;
  }
  
  export function bestDirection(start: Coord, gameState: GameState): keyof typeof directions | null {
    let maxSpace = 0;
    let bestDir: keyof typeof directions | null = null;
  
    for (const dir in directions) {
      const space = floodFill(start, gameState, dir as keyof typeof directions);
      if (space > maxSpace) {
        maxSpace = space;
        bestDir = dir as keyof typeof directions;
      }
    }
  
    return bestDir;
  }