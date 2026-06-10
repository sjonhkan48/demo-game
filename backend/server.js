require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Player = require("./models/player");
const Bet = require("./models/Bet");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB 连接
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB Error:", err));

// ------------------
// 游戏状态
// ------------------
let currentResult = "等待开奖";
let gameOpen = true;
let round = 1;

// ------------------
// 首页测试
// ------------------
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "backend running" });
});

// ------------------
// 获取玩家余额
// ------------------
app.get("/api/score/:id", async (req, res) => {
  let player = await Player.findOne({ playerId: req.params.id });
  if (!player) {
    player = await Player.create({
      playerId: req.params.id,
      name: "玩家",
      score: 10000,
    });
  }
  res.json(player);
});

// ------------------
// 玩家下注
// ------------------
app.post("/api/bet", async (req, res) => {
  try {
    const { playerId, area, amount } = req.body;
    if (!gameOpen) return res.json({ success: false, message: "停止下注" });

    const player = await Player.findOne({ playerId });
    if (!player) return res.json({ success: false, message: "玩家不存在" });
    if (player.score < amount) return res.json({ success: false, message: "余额不足" });

    player.score -= Number(amount);
    await player.save();

    const bet = await Bet.create({
      playerId,
      area,
      amount: Number(amount),
      result: "pending",
      settled: false,
    });

    res.json({ success: true, score: player.score, bet });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ------------------
// 玩家投注记录
// ------------------
app.get("/api/bets/:playerId", async (req, res) => {
  const list = await Bet.find({ playerId: req.params.playerId }).sort({ createdAt: -1 });
  res.json(list);
});

// ------------------
// 当前游戏状态
// ------------------
app.get("/api/game", (req, res) => {
  res.json({
    result: currentResult,
    open: gameOpen,
    round,
  });
});

// ------------------
// 后台管理接口
// ------------------
app.post("/admin/open", async (req, res) => {
  try {
    const { result } = req.body;
    currentResult = result;
    gameOpen = false;

    const bets = await Bet.find({ settled: false });
    for (const bet of bets) {
      const win = bet.area === result;
      bet.result = win ? "win" : "lose";
      bet.settled = true;
      await bet.save();

      if (win) {
        const player = await Player.findOne({ playerId: bet.playerId });
        if (player) {
          let multiple = 1;
          if (result === "和") multiple = 8;
          else if (result === "庄") multiple = 0.95;
          player.score += Math.floor(bet.amount + bet.amount * multiple);
          await player.save();
        }
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------
// 后台下一轮
// ------------------
app.post("/admin/next", async (req, res) => {
  currentResult = "等待开奖";
  gameOpen = true;
  round++;
  res.json({ success: true, round });
});

// ------------------
// 启动服务
// ------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at port ${PORT}`));
