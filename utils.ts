import { Coord, Board } from "./types"

export const directions: { [key: string]: Coord } = {
    up: { x: 0, y: 1 },
    down: { x: 0, y: -1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
};


export function getDirection(start: Coord, end: Coord): string {
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    // Horizontal movement
    if (dx > 0) {
        return 'right'; // Moving right
    } else if (dx < 0) {
        return 'left';  // Moving left
    }

    // Vertical movement
    if (dy > 0) {
        return 'up';    // Moving up
    } else if (dy < 0) {
        return 'down';  // Moving down
    }

    // If there's no movement
    return 'none';
}

export function isOutOfBounds(Coord: Coord, width: number, height: number): boolean {
    return Coord.x < 0 || Coord.y < 0 || Coord.x >= width || Coord.y >= height;
}

export function isObstacle(Coord: Coord, snakes: { id: string; body: Coord[] }[]): boolean {
    return snakes.some(snake => snake.body.some(snakePart => snakePart.x === Coord.x && snakePart.y === Coord.y));
}
export function probableObstacle(Coord: Coord, board: Board): boolean {
    if(board.futureHeads)
    {
        return board.futureHeads.some(futureHead => futureHead.x === Coord.x && futureHead.y === Coord.y)
    } else {
        return false;
    }
}

export function addContribution(dir: string,
    rule: string,
    contrib: number,
    absolute: boolean,
    isMoveSafe: { [key: string]: number },
    contributions: { [key: string]: { rule: string, contrib: number, absolute: boolean }[] }) {
    if (absolute) {
        isMoveSafe[dir] = contrib;
    } else {
        isMoveSafe[dir] += contrib;
    }
    contributions[dir].push({ rule, contrib, absolute });
}
