

import { Battlesnake } from "./types";

export function rewardForHeadCollition(directionValue: number, me: Battlesnake, otherSnake: Battlesnake): number {
    if (otherSnake.body.length >= me.body.length) {
        return 50;
    } else {
        return directionValue + 5; // It is a kill
    }
}