const Player = require("../models/player");
const Bet = require("../models/Bet");

let gameResult = "等待开奖";
let bettingOpen = true;

const odds = {
  "闲": 1,
  "和": 8,
  "庄": 0.95
};

async function openGame(result) {
  bettingOpen = false;

  if (["闲", "和", "庄"].includes(result)) {
    gameResult = result;
  } else {
    const arr = ["闲", "和", "庄"];
    gameResult = arr[Math.floor(Math.random() * 3)];
  }

  const bets = await Bet.find({ result: "pending" });

  for (const bet of bets) {
    const player = await Player.findOne({ playerId: bet.playerId });
    if (!player) continue;

    if (bet.area === gameResult) {
      const reward = bet.amount * (1 + odds[bet.area]);
      player.score += reward;
      bet.result = "win";
      bet.settlement = reward;
    } else {
      bet.result = "lose";
      bet.settlement = 0;
    }

    await player.save();
    await bet.save();
  }

  return gameResult;
}

function newRound() {
  bettingOpen = true;
  gameResult = "等待开奖";
}

module.exports = {
  openGame,
  newRound,
  get gameResult() { return gameResult; },
  get bettingOpen() { return bettingOpen; }
};
