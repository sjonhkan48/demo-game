const game = {
  result: "等待开奖",
  bettingOpen: true,
  time: 20,
};

// 每秒倒计时
setInterval(() => {
  if (game.bettingOpen) {
    game.time--;
    if (game.time <= 0) {
      game.bettingOpen = false;
      game.time = 0;
      game.result = "等待开奖";
    }
  }
}, 1000);

module.exports = { game };
