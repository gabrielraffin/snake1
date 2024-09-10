// Welcome to
// __________         __    __  .__                               __
// \______   \_____ _/  |__/  |_|  |   ____   ______ ____ _____  |  | __ ____
//  |    |  _/\__  \\   __\   __\  | _/ __ \ /  ___//    \\__  \ |  |/ // __ \
//  |    |   \ / __ \|  |  |  | |  |_\  ___/ \___ \|   |  \/ __ \|    <\  ___/
//  |________/(______/__|  |__| |____/\_____>______>___|__(______/__|__\\_____>
//
// This file can be a nice home for your Battlesnake logic and helper functions.
//
// To get you started we've included code to prevent your Battlesnake from moving backwards.
// For more info see docs.battlesnake.com

import runServer from "./server";
import { GameState, InfoResponse, MoveResponse } from "./types";
import { directions, getDirection, addContribution } from "./utils";
import { floodFill } from "./floodfill";
import { aStarPathfinding } from "./pathfinding";
import { rewardForHeadCollition, rewardForFood } from "./behaviour";

// info is called when you create your Battlesnake on play.battlesnake.com
// and controls your Battlesnake's appearance
// TIP: If you open your Battlesnake URL in a browser you should see this data
function info(): InfoResponse {
  console.log("INFO");

  return {
    apiversion: "1",
    author: "", // TODO: Your Battlesnake Username
    color: "#000000", // TODO: Choose color
    head: "orca", // TODO: Choose head
    tail: "shiny", // TODO: Choose tail
    version: "0.0.1"
  };
}

// start is called when your Battlesnake begins a game
function start(gameState: GameState): void {
  console.log("GAME START");
}

// end is called when your Battlesnake finishes a game
function end(gameState: GameState): void {
  console.log("GAME OVER\n");
}

// move is called on every turn and returns your next move
// Valid moves are "up", "down", "left", or "right"
// See https://docs.battlesnake.com/api/example-move for available data
function move(gameState: GameState): MoveResponse {

  console.log("==== START MOVE ====\n");

  let isMoveSafe: { [key: string]: number } = {
    up: 100,
    down: 100,
    left: 100,
    right: 100,
  };

  let contributions: { [key: string]: { rule: string, contrib: number, absolute: boolean }[] } = {
    up: [],
    down: [],
    left: [],
    right: [],
  };

  // We've included code to prevent your Battlesnake from moving backwards
  const myHead = gameState.you.body[0];
  const myNeck = gameState.you.body[1];

  if (myNeck.x < myHead.x) {
    // Neck is left of head, don't move left
    addContribution("left", "backward", -1000, true, isMoveSafe, contributions);
  } else if (myNeck.x > myHead.x) {
    // Neck is right of head, don't move right
    addContribution("right", "backward", -1000, true, isMoveSafe, contributions);
  } else if (myNeck.y < myHead.y) {
    // Neck is below head, don't move down
    addContribution("down", "backward", -1000, true, isMoveSafe, contributions);
  } else if (myNeck.y > myHead.y) {
    // Neck is above head, don't move up
    addContribution("up", "backward", -1000, true, isMoveSafe, contributions);
  }

  // Step 1 - Prevent your Battlesnake from moving out of bounds
  // boardWidth = gameState.board.width;
  // boardHeight = gameState.board.height;

  if (myHead.x == 0) {
    addContribution("left", "wall", -1000, true, isMoveSafe, contributions);
  } else if (myHead.x + 1 == gameState.board.width) {
    addContribution("right", "wall", -1000, true, isMoveSafe, contributions);
  }
  if (myHead.y == 0) {
    addContribution("down", "wall", -1000, true, isMoveSafe, contributions);
  } else if (myHead.y + 1 == gameState.board.height) {
    addContribution("up", "wall", -1000, true, isMoveSafe, contributions);
  }

  // Step 2 - Prevent your Battlesnake from colliding with itself
  const myBody = gameState.you.body;
  for (let i = 2; i < myBody.length - 1; i++) {
    const element = myBody[i];
    if (element.x == myHead.x) {
      if (element.y == myHead.y + 1) {
        addContribution("up", "own-body", -1000, true, isMoveSafe, contributions);
      } else if (element.y == myHead.y - 1) {
        addContribution("down", "own-body", -1000, true, isMoveSafe, contributions);
      }
    } else if (element.y == myHead.y) {
      if (element.x == myHead.x + 1) {
        addContribution("right", "own-body", -1000, true, isMoveSafe, contributions);
      } else if (element.x == myHead.x - 1) {
        addContribution("left", "own-body", -1000, true, isMoveSafe, contributions);
      }
    }
  }

  // Step 3 - Prevent your Battlesnake from colliding with other Battlesnakes
  const opponents = gameState.board.snakes.filter((snake) => snake.id !== gameState.you.id);
  console.log(`There are ${opponents.length} opponents`);
  opponents.forEach(snake => {
    for (let i = 0; i < snake.body.length - 1; i++) {
      const element = snake.body[i];
      if (element.x == myHead.x) {
        if (element.y == myHead.y + 1) {
          addContribution("up", "snake-body", -1000, true, isMoveSafe, contributions);
        } else if (element.y == myHead.y - 1) {
          addContribution("down", "snake-body", -1000, true, isMoveSafe, contributions);
        }
      } else if (element.y == myHead.y) {
        if (element.x == myHead.x + 1) {
          addContribution("right", "snake-body", -1000, true, isMoveSafe, contributions);
        } else if (element.x == myHead.x - 1) {
          addContribution("left", "snake-body", -1000, true, isMoveSafe, contributions);
        }
      }
    }
  });

  // Step 4 - Prevent getting close to other heads
  opponents.forEach(snake => {
    if (isMoveSafe.left == 100) {
      if ((snake.body[0].x == gameState.you.body[0].x - 1) && (Math.abs(snake.body[0].y - gameState.you.body[0].y) == 1) ||
        (snake.body[0].x == gameState.you.body[0].x - 2) && (snake.body[0].y == gameState.you.body[0].y)) {
        rewardForHeadCollition("left", gameState.you, snake, opponents.length, isMoveSafe, contributions);
      }
    }
    if (isMoveSafe.right == 100) {
      if ((snake.body[0].x == gameState.you.body[0].x + 1) && (Math.abs(snake.body[0].y - gameState.you.body[0].y) == 1) ||
        (snake.body[0].x == gameState.you.body[0].x + 2) && (snake.body[0].y == gameState.you.body[0].y)) {
        rewardForHeadCollition("right", gameState.you, snake, opponents.length, isMoveSafe, contributions);
      }
    }
    if (isMoveSafe.down == 100) {
      if ((snake.body[0].y == gameState.you.body[0].y - 1) && (Math.abs(snake.body[0].x - gameState.you.body[0].x) == 1) ||
        (snake.body[0].y == gameState.you.body[0].y - 2) && (snake.body[0].x == gameState.you.body[0].x)) {
        rewardForHeadCollition("down", gameState.you, snake, opponents.length, isMoveSafe, contributions);
      }
    }
    if (isMoveSafe.up == 100) {
      if ((snake.body[0].y == gameState.you.body[0].y + 1) && (Math.abs(snake.body[0].x - gameState.you.body[0].x) == 1) ||
        (snake.body[0].y == gameState.you.body[0].y + 2) && (snake.body[0].x == gameState.you.body[0].x)) {
        rewardForHeadCollition("up", gameState.you, snake, opponents.length, isMoveSafe, contributions);
      }
    }
  });

  // Step 5 - Prefer food if starving
  if (gameState.you.health <= 20) {
    console.log("Looking for food");
    let closestFoodDistance = 10000;
    gameState.board.food.forEach(food => {
      if (food.x == myHead.x) {
        if (food.y == myHead.y + 1) {
          closestFoodDistance = 1;
          addContribution("up", "food-immediate",
            rewardForFood(gameState.you.health, closestFoodDistance),
            false, isMoveSafe, contributions);
        } else if (food.y == myHead.y - 1) {
          closestFoodDistance = 1;
          addContribution("down", "food-immediate",
            rewardForFood(gameState.you.health, closestFoodDistance),
            false, isMoveSafe, contributions);
        }
      } else if (food.y == myHead.y) {
        if (food.x == myHead.x + 1) {
          closestFoodDistance = 1;
          addContribution("right", "food-immediate",
            rewardForFood(gameState.you.health, closestFoodDistance),
            false, isMoveSafe, contributions);
        } else if (food.x == myHead.x - 1) {
          closestFoodDistance = 1
          addContribution("left", "food-immediate",
            rewardForFood(gameState.you.health, closestFoodDistance),
            false, isMoveSafe, contributions);
        }
      }
    });
    if (closestFoodDistance > 1) { // There was no food next to our head
      let bestDirections: string[] = [];
      gameState.board.food.forEach(food => {
        const path = aStarPathfinding(myHead, food, gameState);
        console.log(`path = ${JSON.stringify(path)}`);
        if (path) {
          if (path.length < closestFoodDistance) {
            closestFoodDistance = path.length;
            bestDirections = [getDirection(myHead, path[0])];
          } else if (path.length == closestFoodDistance) {
            bestDirections.push(getDirection(myHead, path[0]));
          }
        }
      });
      console.log(`bestDirections = ${JSON.stringify(bestDirections)}`);
      bestDirections.forEach(dir => {
        addContribution(dir, "food-distance",
          rewardForFood(gameState.you.health, closestFoodDistance),
          false, isMoveSafe, contributions);
      });
    }
  }

  // Step 5.5 - Hasard
  if (gameState.board.hazards.length > 0) {
    console.log("Looking for hasard");
    gameState.board.hazards.forEach(food => {
      if (food.x == myHead.x) {
        if (food.y == myHead.y + 1) {
          addContribution("up", "hasard", -40, false, isMoveSafe, contributions);
        } else if (food.y == myHead.y - 1) {
          addContribution("down", "hasard", -40, false, isMoveSafe, contributions);
        }
      } else if (food.y == myHead.y) {
        if (food.x == myHead.x + 1) {
          addContribution("right", "hasard", -40, false, isMoveSafe, contributions);
        } else if (food.x == myHead.x - 1) {
          addContribution("left", "hasard", -40, false, isMoveSafe, contributions);
        }
      }
    });
  }


  // Step 6 eliminate death moves
  console.log("isMoveSafe = " + JSON.stringify(isMoveSafe));
  isMoveSafe = Object.fromEntries(
    Object.entries(isMoveSafe).filter(([_, value]) => value > 0)
  );
  if (isMoveSafe.length == 0) {
    return { move: "down" };
  } else if (isMoveSafe.length == 1) {
    return { move: Object.keys(isMoveSafe)[0] };
  }

  // Step 7 - Weight biggest free space area
  const possibleDirections = Object.keys(isMoveSafe);
  let maxSpace = 0;
  let directionScores: { [key: string]: number } = {};
  possibleDirections.forEach(direction => {
    const space = floodFill(myHead, gameState, direction as keyof typeof directions);
    console.log(`floodFill [${direction}] = ${space}`);
    directionScores[direction] = space;
    if (space > maxSpace) {
      maxSpace = space;
    }
  });
  possibleDirections.forEach(direction => {
    if (directionScores[direction] < gameState.you.length - 2) {
      addContribution(direction, "floodFill", -20, false, isMoveSafe, contributions);
    }
    if (directionScores[direction] == maxSpace) {
      addContribution(direction, "floodFill", 1, false, isMoveSafe, contributions);
    }
  });

  // Select randomly a direction among the equal max direction scores
  console.log("isMoveSafe = " + JSON.stringify(isMoveSafe));
  console.log("contributions = " + JSON.stringify(contributions));
  const maxScore = Math.max(...Object.values(isMoveSafe));
  const bestMoves = Object.keys(isMoveSafe).filter((key) => isMoveSafe[key] == maxScore);
  console.log("maxScore = " + maxScore);
  console.log("bestMoves = " + JSON.stringify(bestMoves));

  // Choose a random move from the safe moves
  const nextMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];

  // TODO: Step 4 - Move towards food instead of random, to regain health and survive longer
  // food = gameState.board.food;

  console.log(`MOVE ${gameState.turn}: ${nextMove}`);
  return { move: nextMove };
}

runServer({
  info: info,
  start: start,
  move: move,
  end: end,
});
