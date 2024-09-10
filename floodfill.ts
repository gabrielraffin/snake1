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
): floodFillResult {
    const visited = new Set<string>();
    const queue: Coord[] = [];
    const width = gameState.board.width;
    const height = gameState.board.height;
    const snakes = gameState.board.snakes;
    const snakeHeads: Coord[] = snakes.map(snake => snake.body[0]);
    let result: floodFillResult = {
        spaceSize: 0,
        numberOfEnemyHeads: 0,
        numberOfTails: 0
    };

    // Start flood fill in the specified direction
    const initialCoord = { x: start.x + directions[direction].x, y: start.y + directions[direction].y };
    if (isOutOfBounds(initialCoord, width, height) || isObstacle(initialCoord, snakes) || probableObstacle(initialCoord, gameState.board)) {
        return result;
    }

    queue.push(initialCoord);
    visited.add(`${initialCoord.x},${initialCoord.y}`);
    let spaceSize = 0;

    while (queue.length > 0) {
        const current = queue.shift()!;
        const isTail = gameState.board.queues!.find(coord => coord.x == current.x && coord.y == current.y);
        if (isTail) {
            result.numberOfTails += 1;
        }
        result.spaceSize++;

        // Explore neighbors in all four directions
        for (const dir in directions) {
            const next = { x: current.x + directions[dir].x, y: current.y + directions[dir].y };

            const isVisited = visited.has(`${next.x},${next.y}`);
            const isOut = isOutOfBounds(next, width, height);

            if (!isOut && !isVisited) {
                const isHead = snakeHeads.find(coord => coord.x == next.x && coord.y == next.y);
                if (isHead) {
                    result.numberOfEnemyHeads += 1;
                }
            }

            if (
                !isOut &&
                !isVisited &&
                !isObstacle(next, snakes) &&
                !probableObstacle(initialCoord, gameState.board)
            ) {
                queue.push(next);
                visited.add(`${next.x},${next.y}`);
            }
        }
    }
    result.numberOfEnemyHeads--; // Remove my own head
    return result;
}

export function floodFillContribution(gameState: GameState, rule: string,
    isMoveSafe: { [key: string]: number },
    contributions: { [key: string]: { rule: string, contrib: number, absolute: boolean }[] },
    isPrediction: boolean) {
    const possibleDirections = Object.keys(isMoveSafe);
    let maxSpace = 0;
    let directionScores: { [key: string]: number } = {};
    let riskScores: { [key: string]: number } = {};
    let numberOfHeads: { [key: string]: number } = {};
    possibleDirections.forEach(direction => {
        const space = floodFill(gameState.you.body[0], gameState, direction as keyof typeof directions);
        console.log(`floodFill [${direction}] = ${JSON.stringify(space)}`);
        directionScores[direction] = space.spaceSize;
        if (space.spaceSize > maxSpace) {
            maxSpace = space.spaceSize;
        }
        riskScores[direction] = space.numberOfEnemyHeads - space.numberOfTails;
        numberOfHeads[direction] = space.numberOfEnemyHeads;
    });
    possibleDirections.forEach(direction => {
        if (riskScores[direction] > 0) { // More heads, dangerous space
            if (directionScores[direction] < gameState.you.length + 20) {
                addContribution(direction, rule, isPrediction ? -30 : -40, false, isMoveSafe, contributions);
            } else {
                addContribution(direction, rule, isPrediction ? -10 : -15, false, isMoveSafe, contributions);
            }
        } else if (riskScores[direction] == 0) { // Space size will be stable
            let contribscore = isPrediction ? 2 : 0;
            if (directionScores[direction] < gameState.you.length + 2) {
                contribscore += directionScores[direction] == maxSpace ? -10 : -20;
                addContribution(direction, rule, contribscore, false, isMoveSafe, contributions);
            } else {
                contribscore += directionScores[direction] == maxSpace ? -5 : -10;
                addContribution(direction, rule, contribscore, false, isMoveSafe, contributions);
            }
        } else if (riskScores[direction] < 0) { // More tails, his space will grow
            addContribution(direction, rule, isPrediction ? 2 : 4, false, isMoveSafe, contributions);
        }
    });
}