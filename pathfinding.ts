import { Coord, GameState } from "./types"
import { directions, isOutOfBounds, isObstacle } from "./utils"


function manhattanDistance(CoordA: Coord, CoordB: Coord): number {
    return Math.abs(CoordA.x - CoordB.x) + Math.abs(CoordA.y - CoordB.y);
}

export function aStarPathfinding(start: Coord, goal: Coord, gameState: GameState): Coord[] | null {
    const width = gameState.board.width;
    const height = gameState.board.height;
    const snakes = gameState.board.snakes;

    const openSet: Set<string> = new Set();
    const cameFrom: { [key: string]: Coord | null } = {};

    // Initialize gScore (cost from start to each node) and fScore (gScore + heuristic)
    const gScore: { [key: string]: number } = {};
    const fScore: { [key: string]: number } = {};

    function key(Coord: Coord): string {
        return `${Coord.x},${Coord.y}`;
    }

    // Priority queue for A* (min-heap simulation with an array)
    const priorityQueue: { Coord: Coord, fScore: number }[] = [];

    // Utility to add a Coord to the priority queue
    function addToQueue(Coord: Coord, fScore: number) {
        priorityQueue.push({ Coord, fScore });
        priorityQueue.sort((a, b) => a.fScore - b.fScore); // Sort by fScore (min heap)
    }

    gScore[key(start)] = 0;
    fScore[key(start)] = manhattanDistance(start, goal);
    openSet.add(key(start));
    addToQueue(start, fScore[key(start)]);
    cameFrom[key(start)] = null;

    while (priorityQueue.length > 0) {
        let current = priorityQueue.shift()!.Coord;

        if (current.x === goal.x && current.y === goal.y) {
            // Reconstruct path
            const path: Coord[] = [];
            let currKey = key(current);
            while (cameFrom[currKey]) {
                path.unshift(current);
                current = cameFrom[currKey]!;
                currKey = key(current);
            }
            return path;
        }

        openSet.delete(key(current));

        for (const dir in directions) {
            const neighbor: Coord = { x: current.x + directions[dir].x, y: current.y + directions[dir].y };
            const neighborKey = key(neighbor);

            if (isOutOfBounds(neighbor, width, height) || isObstacle(neighbor, snakes)) {
                continue; // Skip out of bounds or obstacle Coords
            }

            const tentativeGScore = gScore[key(current)] + 1;

            if (tentativeGScore < (gScore[neighborKey] || Infinity)) {
                // This path is the best until now. Record it.
                cameFrom[neighborKey] = current;
                gScore[neighborKey] = tentativeGScore;
                fScore[neighborKey] = gScore[neighborKey] + manhattanDistance(neighbor, goal);

                if (!openSet.has(neighborKey)) {
                    openSet.add(neighborKey);
                    addToQueue(neighbor, fScore[neighborKey]);
                }
            }
        }
    }

    // If we exhaust the priority queue without finding a path
    return null;
}
