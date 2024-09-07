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
    isMoveSafe.left = 0;
  } else if (myNeck.x > myHead.x) {
    // Neck is right of head, don't move right
    isMoveSafe.right = 0;
  } else if (myNeck.y < myHead.y) {
    // Neck is below head, don't move down
    isMoveSafe.down = 0;
  } else if (myNeck.y > myHead.y) {
    // Neck is above head, don't move up
    isMoveSafe.up = 0;
  }

  // Step 1 - Prevent your Battlesnake from moving out of bounds
  // boardWidth = gameState.board.width;
  // boardHeight = gameState.board.height;

  if (myHead.x == 0) {
    isMoveSafe.left = 0;
  } else if (myHead.x + 1 == gameState.board.width) {
    isMoveSafe.right = 0;
  }
  if (myHead.y == 0) {
    isMoveSafe.down = 0;
  } else if (myHead.y + 1 == gameState.board.width) {
    isMoveSafe.up = 0;
  }

  // Step 2 - Prevent your Battlesnake from colliding with itself
  gameState.you.body.forEach(element => {
    if (element.x == myHead.x) {
      if (element.y == myHead.y + 1) {
        isMoveSafe.up = 0;
      } else if (element.y == myHead.y - 1) {
        isMoveSafe.down = 0;
      }
    } else if (element.y == myHead.y) {
      if (element.x == myHead.x + 1) {
        isMoveSafe.right = 0;
      } else if (element.x == myHead.x - 1) {
        isMoveSafe.left = 0;
      }
    }
  });

  // Step 3 - Prevent your Battlesnake from colliding with other Battlesnakes
  gameState.board.snakes.forEach(snake => {
    snake.body.forEach(element => {
      if (element.x == myHead.x) {
        if (element.y == myHead.y + 1) {
          isMoveSafe.up = 0;
        } else if (element.y == myHead.y - 1) {
          isMoveSafe.down = 0;
        }
      } else if (element.y == myHead.y) {
        if (element.x == myHead.x + 1) {
          isMoveSafe.right = 0;
        } else if (element.x == myHead.x - 1) {
          isMoveSafe.left = 0;
        }
      }
    });
  });

  // Step 4 - Prevent getting close to other heads
  gameState.board.snakes.forEach(snake => {
    if (snake.body.length >= gameState.you.body.length) {
      if (isMoveSafe.left == 100) {
        if ((snake.body[0].x == gameState.you.body[0].x - 1) && (Math.abs(snake.body[0].y - gameState.you.body[0].y) == 1) ||
          (snake.body[0].x == gameState.you.body[0].x - 2) && (snake.body[0].y == gameState.you.body[0].y)) {
          isMoveSafe.left = 50;
        }
      }
      if (isMoveSafe.right == 100) {
        if ((snake.body[0].x == gameState.you.body[0].x + 1) && (Math.abs(snake.body[0].y - gameState.you.body[0].y) == 1) ||
          (snake.body[0].x == gameState.you.body[0].x + 2) && (snake.body[0].y == gameState.you.body[0].y)) {
          isMoveSafe.right = 50;
        }
      }
      if (isMoveSafe.down == 100) {
        if ((snake.body[0].y == gameState.you.body[0].y - 1) && (Math.abs(snake.body[0].x - gameState.you.body[0].x) == 1) ||
          (snake.body[0].y == gameState.you.body[0].y - 2) && (snake.body[0].x == gameState.you.body[0].x)) {
          isMoveSafe.down = 50;
        }
      }
      if (isMoveSafe.up == 100) {
        if ((snake.body[0].y == gameState.you.body[0].y + 1) && (Math.abs(snake.body[0].x - gameState.you.body[0].x) == 1) ||
          (snake.body[0].y == gameState.you.body[0].y + 2) && (snake.body[0].x == gameState.you.body[0].x)) {
          isMoveSafe.up = 50;
        }
      }
    }
  });

  // Are there any safe moves left?
  const safeMoves = Object.keys(isMoveSafe).filter((key) => isMoveSafe[key] > 0);
  if (safeMoves.length == 0) {
    console.log(`MOVE ${gameState.turn}: No safe moves detected! Moving down`);
    return { move: "down" };
  }

  const maxScore = Math.max(...Object.values(isMoveSafe));
  const bestMoves = Object.keys(isMoveSafe).filter((key) => isMoveSafe[key] == maxScore);

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
