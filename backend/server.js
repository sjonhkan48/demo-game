require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Player = require("./models/player");
const Bet = require("./models/Bet");

const app = express();

// 允许跨域
app.use(cors({ origin: "*" }));
app.use(express.json());

// ----------------------
// MongoDB 连接
// ----------------------
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB Error:", err));

// ----------------------
// 首页测试
// ----------------------
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "backend running" });
});

// ----------------------
// 获取玩家余额
// ----------------------
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

// ----------------------
// 玩家下注
// ----------------------
app.post("/api/bet", async (req, res) => {
  try {
    const { playerId, area, amount } = req.body;
    if (!playerId || !area || !amount)
      return res.json({ success: false, message: "下注数据错误" });

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

// ----------------------
// 玩家自己的投注记录
// ----------------------
app.get("/api/bets/:playerId", async (req, res) => {
  const list = await Bet.find({ playerId: req.params.playerId }).sort({ createdAt: -1 });
  res.json(list);
});

// ----------------------
// 游戏状态
// ----------------------
let currentResult = "等待开奖";

app.get("/api/result", (req, res) => {
  res.json({ result: currentResult });
});

// ----------------------
// 后台管理接口
// ----------------------

// 获取玩家列表
app.get("/admin/players", async (req, res) => {
  const list = await Player.find().sort({ createdAt: 1 });
  res.json(list);
});

// 修改玩家信息
app.post("/admin/player/:id", async (req, res) => {
  const { name, score } = req.body;
  const player = await Player.findOne({ playerId: req.params.id });
  if (!player) return res.json({ success: false, message: "玩家不存在" });
  if (name) player.name = name;
  if (score !== undefined) player.score = score;
  await player.save();
  res.json({ success: true, player });
});

// 获取全部投注记录
app.get("/admin/records", async (req, res) => {
  const records = await Bet.find().sort({ createdAt: -1 });
  res.json(records);
});

// 后台开奖
app.post("/admin/open", async (req, res) => {
  const { result } = req.body;
  currentResult = result;

  const bets = await Bet.find({ settled: false });

  for (const bet of bets) {
    let win = bet.area === result;

    // 结算结果
    bet.result = win ? "win" : "lose";
    bet.settled = true;
    await bet.save();

    if (win) {
      const player = await Player.findOne({ playerId: bet.playerId });
      if (player) {
        let multiple = 1;
        if (result === "和") multiple = 8;
        else if (result === "庄") multiple = 0.95;
        else multiple = 1;

        player.score += Math.floor(bet.amount * multiple);
        await player.save();
      }
    }
  }

  res.json({ success: true, result: currentResult });
});

// 下一轮
app.post("/admin/next", async (req, res) => {
  currentResult = "等待开奖";
  await Bet.updateMany({}, { settled: false, result: "pending" });
  res.json({ success: true });
});

// 生成玩家邀请
app.post("/admin/invite", async (req, res) => {
  const id = `player_${Math.random().toString(36).substr(2, 8)}`;
  const player = await Player.create({ playerId: id, name: "玩家", score: 10000 });
  res.json({ playerId: id, url: `/?player=${id}` });
});

// ----------------------
// 启动服务
// ----------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at port ${PORT}`));
