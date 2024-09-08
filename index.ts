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
import { directions } from "./utils";
import { floodFill } from "./floodfill";
import { rewardForHeadCollition } from "./behaviour";

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

  // We've included code to prevent your Battlesnake from moving backwards
  const myHead = gameState.you.body[0];
  const myNeck = gameState.you.body[1];

  if (myNeck.x < myHead.x) {
    // Neck is left of head, don't move left
    isMoveSafe.left = -100;
  } else if (myNeck.x > myHead.x) {
    // Neck is right of head, don't move right
    isMoveSafe.right = -100;
  } else if (myNeck.y < myHead.y) {
    // Neck is below head, don't move down
    isMoveSafe.down = -100;
  } else if (myNeck.y > myHead.y) {
    // Neck is above head, don't move up
    isMoveSafe.up = -100;
  }

  // Step 1 - Prevent your Battlesnake from moving out of bounds
  // boardWidth = gameState.board.width;
  // boardHeight = gameState.board.height;

  if (myHead.x == 0) {
    isMoveSafe.left = -100;
  } else if (myHead.x + 1 == gameState.board.width) {
    isMoveSafe.right = -100;
  }
  if (myHead.y == 0) {
    isMoveSafe.down = -100;
  } else if (myHead.y + 1 == gameState.board.height) {
    isMoveSafe.up = -100;
  }

  // Step 2 - Prevent your Battlesnake from colliding with itself
  const myBody = gameState.you.body;
  for (let i = 1; i < myBody.length - 1; i++) {
    const element = myBody[i];
    if (element.x == myHead.x) {
      if (element.y == myHead.y + 1) {
        isMoveSafe.up = -100;
      } else if (element.y == myHead.y - 1) {
        isMoveSafe.down = -100;
      }
    } else if (element.y == myHead.y) {
      if (element.x == myHead.x + 1) {
        isMoveSafe.right = -100;
      } else if (element.x == myHead.x - 1) {
        isMoveSafe.left = -100;
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
          isMoveSafe.up = -100;
        } else if (element.y == myHead.y - 1) {
          isMoveSafe.down = -100;
        }
      } else if (element.y == myHead.y) {
        if (element.x == myHead.x + 1) {
          isMoveSafe.right = -100;
        } else if (element.x == myHead.x - 1) {
          isMoveSafe.left = -100;
        }
      }
    }
  });

  // Step 4 - Prevent getting close to other heads
  opponents.forEach(snake => {
    if (isMoveSafe.left == 100) {
      if ((snake.body[0].x == gameState.you.body[0].x - 1) && (Math.abs(snake.body[0].y - gameState.you.body[0].y) == 1) ||
        (snake.body[0].x == gameState.you.body[0].x - 2) && (snake.body[0].y == gameState.you.body[0].y)) {
          isMoveSafe.left = rewardForHeadCollition(isMoveSafe.left, gameState.you, snake);
      }
    }
    if (isMoveSafe.right == 100) {
      if ((snake.body[0].x == gameState.you.body[0].x + 1) && (Math.abs(snake.body[0].y - gameState.you.body[0].y) == 1) ||
        (snake.body[0].x == gameState.you.body[0].x + 2) && (snake.body[0].y == gameState.you.body[0].y)) {
          isMoveSafe.right = rewardForHeadCollition(isMoveSafe.right, gameState.you, snake);
      }
    }
    if (isMoveSafe.down == 100) {
      if ((snake.body[0].y == gameState.you.body[0].y - 1) && (Math.abs(snake.body[0].x - gameState.you.body[0].x) == 1) ||
        (snake.body[0].y == gameState.you.body[0].y - 2) && (snake.body[0].x == gameState.you.body[0].x)) {
          isMoveSafe.down = rewardForHeadCollition(isMoveSafe.down, gameState.you, snake);
      }
    }
    if (isMoveSafe.up == 100) {
      if ((snake.body[0].y == gameState.you.body[0].y + 1) && (Math.abs(snake.body[0].x - gameState.you.body[0].x) == 1) ||
        (snake.body[0].y == gameState.you.body[0].y + 2) && (snake.body[0].x == gameState.you.body[0].x)) {
          isMoveSafe.up = rewardForHeadCollition(isMoveSafe.up, gameState.you, snake);
      }
    }
  });

  // Step 5 - Prefer food if starving
  if (gameState.you.health <= 8) {
    console.log("Looking for food");
    gameState.board.food.forEach(food => {
      if (food.x == myHead.x) {
        if (food.y == myHead.y + 1) {
          isMoveSafe.up += 10;
        } else if (food.y == myHead.y - 1) {
          isMoveSafe.down += 10;
        }
      } else if (food.y == myHead.y) {
        if (food.x == myHead.x + 1) {
          isMoveSafe.right += 10;
        } else if (food.x == myHead.x - 1) {
          isMoveSafe.left += 10;
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
      isMoveSafe[direction] -= 20;
    }
    if (directionScores[direction] == maxSpace) {
      isMoveSafe[direction] += 1;
    }
  });

  // Select randomly a direction among the equal max direction scores
  console.log("isMoveSafe = " + JSON.stringify(isMoveSafe));
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
