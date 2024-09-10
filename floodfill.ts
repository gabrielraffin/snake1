import { Coord, GameState } from "./types"
import { directions, isOutOfBounds, isObstacle, addContribution, probableObstacle } from "./utils"

export type floodFillResult = {
    spaceSize: number;
    numberOfEnemyHeads: number;
    numberOfTails: number;
}

// TODO return struct from floodFill

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
    if (isOutOfBounds(initialCoord, width, height) || isObstacle(initialCoord, snakes) || probableObstacle(initialCoord, gameState.board)) {
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
                !isObstacle(next, snakes) &&
                !probableObstacle(initialCoord, gameState.board)
            ) {
                queue.push(next);
                visited.add(`${next.x},${next.y}`);
            }
        }
    }

    return spaceSize;
}

export function floodFillContribution(gameState: GameState, rule: string,
    isMoveSafe: { [key: string]: number },
    contributions: { [key: string]: { rule: string, contrib: number, absolute: boolean }[] }) {
    const possibleDirections = Object.keys(isMoveSafe);
    let maxSpace = 0;
    let directionScores: { [key: string]: number } = {};
    possibleDirections.forEach(direction => {
        const space = floodFill(gameState.you.body[0], gameState, direction as keyof typeof directions);
        console.log(`floodFill [${direction}] = ${space}`);
        directionScores[direction] = space;
        if (space > maxSpace) {
            maxSpace = space;
        }
    });
    possibleDirections.forEach(direction => {
        if (directionScores[direction] < gameState.you.length - 2) {
            addContribution(direction, rule, -20, false, isMoveSafe, contributions);
        }
        if (directionScores[direction] == maxSpace) {
            addContribution(direction, rule, 1, false, isMoveSafe, contributions);
        }
    });
}