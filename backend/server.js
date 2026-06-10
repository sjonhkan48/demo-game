require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Player = require("./models/player");
const Bet = require("./models/Bet");

const app = express();
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
    if (!playerId || !area || !amount) return res.json({ success: false, message: "下注数据错误" });

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
// 玩家投注记录
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
  res.json({
    result: currentResult,
  });
});

// ----------------------
// 后台管理接口
// ----------------------
const adminRouter = express.Router();

// 玩家列表
adminRouter.get("/players", async (req, res) => {
  const players = await Player.find({}).sort({ createdAt: -1 });
  res.json(players);
});

// 修改玩家积分和名称
adminRouter.post("/player/:id", async (req, res) => {
  const { name, score } = req.body;
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (score !== undefined) updateData.score = score;

  const player = await Player.findOneAndUpdate({ playerId: req.params.id }, updateData, { new: true });
  res.json(player);
});

// 新增玩家
adminRouter.post("/invite", async (req, res) => {
  const playerId = "player_" + Math.random().toString(36).substring(2, 10);
  const player = await Player.create({ playerId, name: "新玩家", score: 10000 });
  res.json({ playerId, url: `/?player=${playerId}`, score: player.score });
});

// 手动开奖
adminRouter.post("/open", async (req, res) => {
  const { result } = req.body;
  currentResult = result;

  const bets = await Bet.find({ settled: false });
  for (const bet of bets) {
    const win = bet.area === result;
    bet.result = win ? "win" : "lose";
    bet.settled = true;
    await bet.save();

    if (win) {
      const player = await Player.findOne({ playerId: bet.playerId });
      if (player) {
        let multiple = result === "和" ? 8 : result === "庄" ? 0.95 : 1;
        player.score += Math.floor(bet.amount * multiple);
        await player.save();
      }
    }
  }

  res.json({ success: true, result: currentResult });
});

// 下一轮
adminRouter.post("/next", async (req, res) => {
  currentResult = "等待开奖";
  res.json({ success: true });
});

// 开奖记录
adminRouter.get("/records", async (req, res) => {
  const records = await Bet.find({}).sort({ createdAt: -1 });
  res.json(records);
});

// 挂载 admin
app.use("/admin", adminRouter);

// ----------------------
// 启动服务
// ----------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at port ${PORT}`));
