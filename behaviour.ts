

import { Battlesnake } from "./types";
import { addContribution } from "./utils";


export function rewardForHeadCollition(dir: string,
    me: Battlesnake,
    otherSnake: Battlesnake,
    numberOfOpponents: number,
    isMoveSafe: { [key: string]: number },
    contributions: { [key: string]: { rule: string, contrib: number, absolute: boolean }[] }) {
    if (numberOfOpponents > 1 && (otherSnake.name == "Behemoth" || otherSnake.name == "Killer whale")) {
        addContribution(dir, "snake-heads", -5, false, isMoveSafe, contributions);
        // Killing friend is bad (except when there is just us)
    }
    if (otherSnake.body.length >= me.body.length) {
        addContribution(dir, "snake-heads", 50, true, isMoveSafe, contributions);
    } else {
        addContribution(dir, "snake-heads", +5, false, isMoveSafe, contributions);
    }
}

export function rewardForFood(health: number, distance: number): number {
    const survivalMargin = health - distance;
    if (survivalMargin > 8) {
        return 0;
    } else if (survivalMargin == 0) {
        return 120;
    } else if (survivalMargin == 1) {
        return 100;
    }else if (survivalMargin == 2) {
        return 60;
    } else if (survivalMargin <= 5) {
        return 30;
    }
    return 5; // margin from 6 to 8
}