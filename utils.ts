import { Coord } from "./types"

export const directions: { [key: string]: Coord } = {
    up: { x: 0, y: 1 },
    down: { x: 0, y: -1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
};

export function isOutOfBounds(Coord: Coord, width: number, height: number): boolean {
    return Coord.x < 0 || Coord.y < 0 || Coord.x >= width || Coord.y >= height;
}

export function isObstacle(Coord: Coord, snakes: { id: string; body: Coord[] }[]): boolean {
    return snakes.some(snake => snake.body.some(snakePart => snakePart.x === Coord.x && snakePart.y === Coord.y));
}