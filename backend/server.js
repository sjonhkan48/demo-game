require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Player = require("./models/player");
const Bet = require("./models/Bet");
const adminRouter = require("./routes/admin");
const { game } = require("./services/game");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// MongoDB 连接
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB Error:", err));

// 首页测试
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "backend running" });
});

// 获取玩家余额
app.get("/api/score/:id", async (req, res) => {
  let player = await Player.findOne({ playerId: req.params.id });
  if (!player) {
    player = await Player.create({ playerId: req.params.id, name: "玩家", score: 10000 });
  }
  res.json(player);
});

// 玩家下注
app.post("/api/bet", async (req, res) => {
  try {
    const { playerId, area, amount } = req.body;
    if (!playerId || !area || !amount) return res.json({ success: false, message: "下注数据错误" });

    const player = await Player.findOne({ playerId });
    if (!player) return res.json({ success: false, message: "玩家不存在" });
    if (!game.bettingOpen) return res.json({ success: false, message: "当前停止下注" });
    if (player.score < amount) return res.json({ success: false, message: "余额不足" });

    player.score -= Number(amount);
    await player.save();

    const bet = await Bet.create({ playerId, area, amount: Number(amount), result: "pending" });
    res.json({ success: true, score: player.score, bet });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 玩家投注记录
app.get("/api/bets/:playerId", async (req, res) => {
  const list = await Bet.find({ playerId: req.params.playerId }).sort({ createdAt: -1 });
  res.json(list);
});

// 游戏状态
app.get("/api/result", (req, res) => {
  res.json({ result: game.result, bettingOpen: game.bettingOpen, time: game.time });
});

// 后台路由
app.use("/admin", adminRouter);

// 启动服务
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`server running port ${PORT}`));
