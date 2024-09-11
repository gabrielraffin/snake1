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
import { GameState, InfoResponse, MoveResponse, Coord } from "./types";
import { directions, getDirection, addContribution, isObstacle, isOutOfBounds } from "./utils";
import { floodFillContribution } from "./floodfill";
import { aStarPathfinding } from "./pathfinding";
import { rewardForHeadCollition, rewardForFood } from "./behaviour";
import { generateDangerHeatmap, MAX_DANGER } from "./dangerHeatMap";

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

  let possibleLongEnemyHead: Coord[] = [];

  let contributions: { [key: string]: { rule: string, contrib: number, absolute: boolean }[] } = {
    up: [],
    down: [],
    left: [],
    right: [],
  };

  // remove snakes queues
  gameState.board.queues = [];
  gameState.board.queues.push(gameState.you.body.pop() as Coord);
  gameState.board.snakes.forEach(snake => gameState.board.queues!.push(snake.body.pop() as Coord));

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
  for (let i = 2; i < myBody.length; i++) {
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
    for (let i = 0; i < snake.body.length; i++) {
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
        rewardForHeadCollition("left", gameState.you, snake, opponents.length, isMoveSafe, contributions, possibleLongEnemyHead,
          {
            x: snake.body[0].x + directions["left"].x,
            y: snake.body[0].y
          });
      }
    }
    if (isMoveSafe.right == 100) {
      if ((snake.body[0].x == gameState.you.body[0].x + 1) && (Math.abs(snake.body[0].y - gameState.you.body[0].y) == 1) ||
        (snake.body[0].x == gameState.you.body[0].x + 2) && (snake.body[0].y == gameState.you.body[0].y)) {
        rewardForHeadCollition("right", gameState.you, snake, opponents.length, isMoveSafe, contributions, possibleLongEnemyHead,
          {
            x: snake.body[0].x + directions["right"].x,
            y: snake.body[0].y
          });
      }
    }
    if (isMoveSafe.down == 100) {
      if ((snake.body[0].y == gameState.you.body[0].y - 1) && (Math.abs(snake.body[0].x - gameState.you.body[0].x) == 1) ||
        (snake.body[0].y == gameState.you.body[0].y - 2) && (snake.body[0].x == gameState.you.body[0].x)) {
        rewardForHeadCollition("down", gameState.you, snake, opponents.length, isMoveSafe, contributions, possibleLongEnemyHead,
          {
            x: snake.body[0].x,
            y: snake.body[0].y + directions["down"].y
          });
      }
    }
    if (isMoveSafe.up == 100) {
      if ((snake.body[0].y == gameState.you.body[0].y + 1) && (Math.abs(snake.body[0].x - gameState.you.body[0].x) == 1) ||
        (snake.body[0].y == gameState.you.body[0].y + 2) && (snake.body[0].x == gameState.you.body[0].x)) {
        rewardForHeadCollition("up", gameState.you, snake, opponents.length, isMoveSafe, contributions, possibleLongEnemyHead,
          {
            x: snake.body[0].x,
            y: snake.body[0].y + directions["down"].y
          });
      }
    }
  });

  // Step 5 - Prefer food if starving
  if (gameState.you.health <= 30 || 
    (gameState.you.health <= 60 && gameState.board.food.length < 4)) { // The threshold logic could be adjusted to number of snake
    console.log("Looking for food");
    let directionFoodMargins: { [key: string]: number } = {
      up: -1,
      down: -1,
      left: -1,
      right: -1
    };
    let bestMargin: number = -1;
    gameState.board.food.forEach(food => {
      const path = aStarPathfinding(myHead, food, gameState);
      console.log(`path = ${JSON.stringify(path)}`);
      if (path) {
        const pathStartDirection = getDirection(myHead, path[0]);
        const pathMargin = gameState.you.health - path.length;
        if (directionFoodMargins[pathStartDirection] < pathMargin) {
          directionFoodMargins[pathStartDirection] = pathMargin;
          if (bestMargin < pathMargin) {
            bestMargin = pathMargin;
          }
        }
      }
    });
    console.log(`directionFoodMargins = ${JSON.stringify(directionFoodMargins)}`);
    Object.keys(directionFoodMargins).forEach(dir => {
      if (directionFoodMargins[dir] >= 0) {
        addContribution(dir, "food-distance",
          rewardForFood(directionFoodMargins[dir], bestMargin),
          false, isMoveSafe, contributions);
      }
    });
  }


  // Step 6 - Hasard
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

  // Step 7 - avoid proximity to borders and corners
  if (myHead.x == 0) {
    addContribution("right", "wall-borders", 25, false, isMoveSafe, contributions);
  } else if (myHead.x == 1) {
    addContribution("left", "wall-borders", -25, false, isMoveSafe, contributions);
    addContribution("right", "wall-borders", 10, false, isMoveSafe, contributions);
  } else if (myHead.x == 2) {
    addContribution("left", "wall-borders", -10, false, isMoveSafe, contributions);

  } else if (myHead.x == gameState.board.width - 1) {
    addContribution("left", "wall-borders", 25, false, isMoveSafe, contributions);
  } else if (myHead.x == gameState.board.width - 2) {
    addContribution("left", "wall-borders", 10, false, isMoveSafe, contributions);
    addContribution("right", "wall-borders", -25, false, isMoveSafe, contributions);
  } else if (myHead.x == gameState.board.width - 3) {
    addContribution("right", "wall-borders", -10, false, isMoveSafe, contributions);
  }
  if (myHead.y == 0) {
    addContribution("up", "wall-borders", 25, false, isMoveSafe, contributions);
  } else if (myHead.y == 1) {
    addContribution("down", "wall-borders", -25, false, isMoveSafe, contributions);
    addContribution("up", "wall-borders", 10, false, isMoveSafe, contributions);
  } else if (myHead.y == 2) {
    addContribution("down", "wall-borders", -10, false, isMoveSafe, contributions);

  } else if (myHead.y == gameState.board.width - 1) {
    addContribution("down", "wall-borders", 25, false, isMoveSafe, contributions);
  } else if (myHead.y == gameState.board.width - 2) {
    addContribution("down", "wall-borders", 10, false, isMoveSafe, contributions);
    addContribution("up", "wall-borders", -25, false, isMoveSafe, contributions);
  } else if (myHead.y == gameState.board.width - 3) {
    addContribution("up", "wall-borders", -10, false, isMoveSafe, contributions);
  }

  if (isMoveSafe.up > -200) {
    const newHead = { x: myHead.x + directions.up.x, y: myHead.y + directions.up.y };
    let numberOfMove = 3;
    if (isOutOfBounds(newHead, gameState.board.width, gameState.board.height) || isObstacle({ x: newHead.x + directions.up.x, y: newHead.y + directions.up.y }, gameState.board.snakes)) {
      //console.log(`up is touching ${JSON.stringify({ x: newHead.x + directions.up.x, y: newHead.y + directions.up.y })}`);
      numberOfMove--;
    }
    if (isOutOfBounds(newHead, gameState.board.width, gameState.board.height) || isObstacle({ x: newHead.x + directions.left.x, y: newHead.y + directions.left.y }, gameState.board.snakes)) {
      //console.log(`left is touching ${JSON.stringify({ x: newHead.x + directions.left.x, y: newHead.y + directions.left.y })}`);
      numberOfMove--;
    }
    if (isOutOfBounds(newHead, gameState.board.width, gameState.board.height) || isObstacle({ x: newHead.x + directions.right.x, y: newHead.y + directions.right.y }, gameState.board.snakes)) {
      //console.log(`right is touching ${JSON.stringify({ x: newHead.x + directions.right.x, y: newHead.y + directions.right.y })}`);
      numberOfMove--;
    }
    console.log(`number of free moves up: ${numberOfMove} - newHead ${JSON.stringify(newHead)}`);
    if (numberOfMove <= 1) { // Should not be 0
      addContribution("up", "snake-proximity", -30, false, isMoveSafe, contributions);
    } else if (numberOfMove == 2) {
      addContribution("up", "snake-proximity", -12, false, isMoveSafe, contributions);
    }
  }

  if (isMoveSafe.down > -200) {
    const newHead = { x: myHead.x + directions.down.x, y: myHead.y + directions.down.y };
    let numberOfMove = 3;
    if (isOutOfBounds(newHead, gameState.board.width, gameState.board.height) || isObstacle({ x: newHead.x + directions.down.x, y: newHead.y + directions.down.y }, gameState.board.snakes)) {
      numberOfMove--;
    }
    if (isOutOfBounds(newHead, gameState.board.width, gameState.board.height) || isObstacle({ x: newHead.x + directions.left.x, y: newHead.y + directions.left.y }, gameState.board.snakes)) {
      numberOfMove--;
    }
    if (isOutOfBounds(newHead, gameState.board.width, gameState.board.height) || isObstacle({ x: newHead.x + directions.right.x, y: newHead.y + directions.right.y }, gameState.board.snakes)) {
      numberOfMove--;
    }
    console.log(`number of free moves down: ${numberOfMove}`);
    if (numberOfMove <= 1) { // Should not be 0
      addContribution("down", "snake-proximity", -30, false, isMoveSafe, contributions);
    } else if (numberOfMove == 2) {
      addContribution("down", "snake-proximity", -12, false, isMoveSafe, contributions);
    }
  }

  if (isMoveSafe.left > -200) {
    const newHead = { x: myHead.x + directions.left.x, y: myHead.y + directions.left.y };
    let numberOfMove = 3;
    if (isOutOfBounds(newHead, gameState.board.width, gameState.board.height) || isObstacle({ x: newHead.x + directions.left.x, y: newHead.y + directions.left.y }, gameState.board.snakes)) {
      numberOfMove--;
    }
    if (isOutOfBounds(newHead, gameState.board.width, gameState.board.height) || isObstacle({ x: newHead.x + directions.down.x, y: newHead.y + directions.down.y }, gameState.board.snakes)) {
      numberOfMove--;
    }
    if (isOutOfBounds(newHead, gameState.board.width, gameState.board.height) || isObstacle({ x: newHead.x + directions.up.x, y: newHead.y + directions.up.y }, gameState.board.snakes)) {
      numberOfMove--;
    }
    console.log(`number of free moves left: ${numberOfMove}`);
    if (numberOfMove <= 1) { // Should not be 0
      addContribution("left", "snake-proximity", -30, false, isMoveSafe, contributions);
    } else if (numberOfMove == 2) {
      addContribution("left", "snake-proximity", -12, false, isMoveSafe, contributions);
    }
  }

  if (isMoveSafe.right > -200) {
    const newHead = { x: myHead.x + directions.right.x, y: myHead.y + directions.right.y };
    let numberOfMove = 3;
    if (isOutOfBounds(newHead, gameState.board.width, gameState.board.height) || isObstacle({ x: newHead.x + directions.up.x, y: newHead.y + directions.up.y }, gameState.board.snakes)) {
      numberOfMove--;
    }
    if (isOutOfBounds(newHead, gameState.board.width, gameState.board.height) || isObstacle({ x: newHead.x + directions.down.x, y: newHead.y + directions.down.y }, gameState.board.snakes)) {
      numberOfMove--;
    }
    if (isOutOfBounds(newHead, gameState.board.width, gameState.board.height) || isObstacle({ x: newHead.x + directions.right.x, y: newHead.y + directions.right.y }, gameState.board.snakes)) {
      numberOfMove--;
    }
    console.log(`number of free moves right: ${numberOfMove}`);
    if (numberOfMove <= 1) { // Should not be 0
      addContribution("right", "snake-proximity", -30, false, isMoveSafe, contributions);
    } else if (numberOfMove == 2) {
      addContribution("right", "snake-proximity", -12, false, isMoveSafe, contributions);
    }
  }

  // Step 8 eliminate death moves
  console.log("isMoveSafe = " + JSON.stringify(isMoveSafe));
  isMoveSafe = Object.fromEntries(
    Object.entries(isMoveSafe).filter(([_, value]) => value > 0)
  );
  if (isMoveSafe.length == 0) {
    return { move: "down" };
  } else if (isMoveSafe.length == 1) {
    return { move: Object.keys(isMoveSafe)[0] };
  }

  // Step 9 - Weight biggest free space area
  floodFillContribution(gameState, "floodfill", isMoveSafe, contributions, false);
  // With extra heads
  gameState.board.futureHeads = [];
  opponents.forEach(snake => {
    for (const dir in directions) {
      const cellCoord: Coord = {
        x: snake.body[0].x + directions[dir].x,
        y: snake.body[0].y + directions[dir].y
      };
      if (cellCoord.x >= 0 && cellCoord.x < gameState.board.width && cellCoord.y >= 0 && cellCoord.y < gameState.board.height) {
        const isPossibleContactHead = possibleLongEnemyHead.find(head => head.x == cellCoord.x && head.y == cellCoord.y);
        if (!isPossibleContactHead) {
          console.log(`add futureHead for ${dir} in ${JSON.stringify(cellCoord)}`);
          gameState.board.futureHeads?.push(cellCoord);
        }
      }
    }
  });
  console.log(`possibleLongEnemyHead = ${JSON.stringify(possibleLongEnemyHead)}`);
  console.log(`futureHeads = ${JSON.stringify(gameState.board.futureHeads)}`);
  floodFillContribution(gameState, "predicted-floodfill", isMoveSafe, contributions, true);

  // Step 10 - Avoid coming closer to danger
  const heatMap = generateDangerHeatmap(gameState, opponents);
  Object.keys(isMoveSafe).forEach(dir => {
    const next: Coord = { x: myHead.x + directions[dir].x, y: myHead.y + directions[dir].y };
    const directionDangerLevel = heatMap[next.y][next.x];
    // console.log(`Danger in (${dir} - ${next.x},${next.y}) = ${heatMap[next.y][next.x]}`);
    addContribution(dir, "danger-gradient", 2 * (MAX_DANGER - directionDangerLevel), false, isMoveSafe, contributions);
  });
  // console.log(`heatMap = ${JSON.stringify(heatMap)}`);

  // Select randomly a direction among the equal max direction scores
  console.log("isMoveSafe = " + JSON.stringify(isMoveSafe));
  console.log("contributions = " + JSON.stringify(contributions));
  const maxScore = Math.max(...Object.values(isMoveSafe));
  const bestMoves = Object.keys(isMoveSafe).filter((key) => isMoveSafe[key] == maxScore);
  console.log("maxScore = " + maxScore);
  console.log("bestMoves = " + JSON.stringify(bestMoves));

  // Choose a random move from the safe moves
  const nextMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];

  console.log(`MOVE ${gameState.turn}: ${nextMove}`);
  return { move: nextMove };
}

runServer({
  info: info,
  start: start,
  move: move,
  end: end,
});
