import { Coord, GameState, Battlesnake } from "./types"
import { directions, isOutOfBounds, isObstacle, addContribution, } from "./utils"

export const MAX_DANGER: number = 5;

export function generateDangerHeatmap(gameState: GameState, opponents: Battlesnake[]): number[][] {
    const { width, height } = gameState.board;
    const snakes = gameState.board.snakes;

    // Initialize a 2D array for the danger heatmap
    const heatmap: number[][] = Array.from({ length: height }, () =>
        Array(width).fill(0)
    );

    // Perform flood fill for each snake to assign danger values
    function floodFillForSnake(snakeHead: Coord) {
        const queue: { cell: Coord; distance: number }[] = [];
        const visited = new Set<string>();

        queue.push({ cell: snakeHead, distance: 0 });
        visited.add(`${snakeHead.x},${snakeHead.y}`);

        while (queue.length > 0) {
            const { cell, distance } = queue.shift()!;

            // Compute the danger value (decrease with distance)
            const dangerValue = Math.max(0, MAX_DANGER - distance);

            // Add the danger value to the heatmap for this cell
            heatmap[cell.y][cell.x] += dangerValue;

            // Explore neighbors
            for (const dir in directions) {
                const next: Coord = { x: cell.x + directions[dir].x, y: cell.y + directions[dir].y };
                const key = `${next.x},${next.y}`;

                // Check if the neighbor is within bounds and not visited
                if (
                    !isOutOfBounds(next, width, height) &&
                    !visited.has(key) &&
                    !isObstacle(next, snakes)
                    ) {
                    visited.add(key);
                    queue.push({ cell: next, distance: distance + 1 });

                }
            }
        }
    }

    // Run the flood fill for each snake
    for (const snake of opponents) {
        if (snake.length >= gameState.you.length) {
            console.log(`Add danger from snake ${snake.id}`);
            floodFillForSnake(snake.head);
            console.log(`heatMap = ${JSON.stringify(heatmap)}`);
        }
    }

    return heatmap;
}
