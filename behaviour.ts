

import { Battlesnake, Coord } from "./types";
import { addContribution } from "./utils";


export function rewardForHeadCollition(dir: string,
    me: Battlesnake,
    otherSnake: Battlesnake,
    numberOfOpponents: number,
    isMoveSafe: { [key: string]: number },
    contributions: { [key: string]: { rule: string, contrib: number, absolute: boolean }[] },
    possibleLongEnemyHead: Coord[], 
    enemyFutureHead: Coord) {
    if (numberOfOpponents > 1 && (otherSnake.name == "Behemoth" || otherSnake.name == "Killer whale")) {
        addContribution(dir, "snake-heads", -5, false, isMoveSafe, contributions);
        // Killing friend is bad (except when there is just us)
    }
    if (otherSnake.body.length >= me.body.length) {
        addContribution(dir, "snake-heads", 50, true, isMoveSafe, contributions);
        possibleLongEnemyHead .push(enemyFutureHead);
    } else {
        addContribution(dir, "snake-heads", +5, false, isMoveSafe, contributions);
    }
}

export function rewardForFood(survivalMargin: number, bestMargin: number): number {
    if (survivalMargin == bestMargin) {
        if (survivalMargin > 10) {
            return 0;
        } else if (survivalMargin == 0) {
            return 120;
        } else if (survivalMargin == 1) {
            return 100;
        } else if (survivalMargin == 2) {
            return 60;
        } else if (survivalMargin <= 5) {
            return 30;
        }
        return 10; // margin from 6 to 8
    } else {
        const rewardForBest = rewardForFood(bestMargin, bestMargin);
        if (bestMargin - survivalMargin > 5) {
            return Math.max(rewardForBest - 8, 0); // bestMargin should be 10 or 0
        } else if (bestMargin - survivalMargin == 1) {
            if (bestMargin <= 1) {
                return Math.max(rewardForBest - 80, 0); // bestMargin is 100 (if that was 0 there will be no 2nd best)
            } else if (bestMargin <= 2) {
                return Math.max(rewardForBest - 20, 0); // best margin is 60
            } else if (bestMargin <= 5) {
                return Math.max(rewardForBest - 10, 0); // best margin is 30
            } else {
                return Math.max(rewardForBest - 1, 0); // best margin is 10 or 0
            }
        } else if (bestMargin - survivalMargin == 2) {
            if (bestMargin <= 2) {
                return Math.max(rewardForBest - 80, 0); // bestMargin is 60
            } else if (bestMargin <= 5) {
                return Math.max(rewardForBest - 15, 0); // bestMargin is 30
            } else {
                return Math.max(rewardForBest - 3, 0); // bestMargin is 10 or 0
            }
        } else if (bestMargin - survivalMargin == 3) {
            if (bestMargin <= 5) {
                return Math.max(rewardForBest - 20, 0); // bestMargin is 30
            } else {
                return Math.max(rewardForBest - 5, 0); // best margin is 10 or 0
            }
        }
        return Math.max(rewardForBest - 15, 0); // bestMargin is 60 or 30 or 10 or 0
    }
}