require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const Player = require("./models/player");
const Bet = require("./models/Bet");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// 允许跨域
app.use(cors());
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

    io.emit("gameUpdate"); // 推送前端

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
  res.json({ result: currentResult });
});

// =====================
// 后台接口
// =====================

// 获取所有玩家
app.get("/admin/players", async (req, res) => {
  const players = await Player.find();
  res.json(players);
});

// 新增玩家
app.post("/admin/player/add", async (req, res) => {
  const { playerId, name, score } = req.body;
  const exist = await Player.findOne({ playerId });
  if (exist) return res.json({ success: false, message: "玩家已存在" });

  const player = await Player.create({ playerId, name: name || "玩家", score: Number(score) || 10000 });
  io.emit("playersUpdate"); // 推送前端更新
  res.json({ success: true, player });
});

// 修改玩家积分
app.post("/admin/player/update", async (req, res) => {
  const { playerId, score, name } = req.body;
  const player = await Player.findOne({ playerId });
  if (!player) return res.json({ success: false, message: "玩家不存在" });

  player.score = Number(score);
  if (name) player.name = name;
  await player.save();
  io.emit("playersUpdate"); // 推送前端
  res.json({ success: true, player });
});

// 开奖
app.post("/admin/open", async (req, res) => {
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
        let rate = 1;
        if (result === "和") rate = 8;
        if (result === "庄") rate = 0.95;

        player.score += Math.floor(bet.amount * rate);
        await player.save();
      }
    }
  }

  io.emit("gameUpdate"); // 前端同步
  res.json({ success: true });
});

// 下一轮
app.post("/admin/next", async (req, res) => {
  currentResult = "等待开奖";
  await Bet.updateMany({}, { settled: false, result: "pending" });
  io.emit("gameUpdate"); // 前端同步
  res.json({ success: true });
});

// ----------------------
// WebSocket
// ----------------------
io.on("connection", socket => {
  console.log("客户端已连接");
});

// ----------------------
// 启动服务
// ----------------------
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running at port ${PORT}`));
