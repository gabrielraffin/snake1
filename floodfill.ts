import { Coord, GameState } from "./types"
import { directions, isOutOfBounds, isObstacle, addContribution, probableObstacle } from "./utils"

export type floodFillResult = {
    spaceSize: number;
    numberOfEnemyHeads: number;
    numberOfProbableHead: number;
    numberOfTails: number;
}

// TODO return struct from floodFill

export function floodFill(
    start: Coord,
    gameState: GameState,
    direction: keyof typeof directions
): floodFillResult {
    const visited = new Set<string>();
    const countedHeadOrObstacle = new Set<string>();
    const queue: Coord[] = [];
    const width = gameState.board.width;
    const height = gameState.board.height;
    const snakes = gameState.board.snakes;
    const snakeHeads: Coord[] = snakes.map(snake => snake.body[0]);
    let result: floodFillResult = {
        spaceSize: 0,
        numberOfEnemyHeads: 0,
        numberOfTails: 0,
        numberOfProbableHead: 0
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
            const nextString = `${next.x},${next.y}`;

            const isVisited = visited.has(nextString);
            const isOut = isOutOfBounds(next, width, height);
            const isProbableObstacle = probableObstacle(next, gameState.board);
            const isSureObstacle = isObstacle(next, snakes);

            if (!isOut && !isVisited) {
                const isHead = snakeHeads.find(coord => coord.x == next.x && coord.y == next.y);
                if (isHead && !countedHeadOrObstacle.has(nextString)) {
                    result.numberOfEnemyHeads += 1;
                    countedHeadOrObstacle.add(nextString);
                } else if (!isSureObstacle && isProbableObstacle && !countedHeadOrObstacle.has(nextString)) {
                    console.log(`add probable obstacle next = ${JSON.stringify(next)}`);
                    result.numberOfProbableHead += 1;
                    countedHeadOrObstacle.add(nextString);
                }
            }

            if (
                !isOut &&
                !isVisited &&
                !isSureObstacle &&
                !isProbableObstacle
            ) {
                //console.log(`add next = ${JSON.stringify(next)}`);
                queue.push(next);
                visited.add(nextString);
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
        console.log(`probableObstacle [5, 10] = ${probableObstacle({ x: 5, y: 10 }, gameState.board)}`);
        directionScores[direction] = space.spaceSize;
        if (space.spaceSize > maxSpace) {
            maxSpace = space.spaceSize;
        }
        numberOfHeads[direction] = Math.max(space.numberOfEnemyHeads, Math.ceil(space.numberOfProbableHead / 2)); // May not be 100% accurate
        riskScores[direction] = numberOfHeads[direction] - space.numberOfTails;
    });
    possibleDirections.forEach(direction => {
        console.log(`direction ${direction} - score: ${directionScores[direction]}, maxSpace: ${maxSpace}, riskScore: ${riskScores[direction]}`);
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