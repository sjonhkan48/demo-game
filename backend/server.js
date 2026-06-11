require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const Player = require("./models/player");
const Bet = require("./models/bet");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

// MongoDB 连接
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB Error:", err));

// -----------------
// 游戏状态
// -----------------
let currentResult = { result: "等待开奖", time: 20 };
let countdownInterval = null;

// -----------------
// 首页测试
// -----------------
app.get("/", (req, res) => res.json({ status: "ok", message: "backend running" }));

// -----------------
// 获取玩家信息
// -----------------
app.get("/api/player/:id", async (req, res) => {
  let player = await Player.findOne({ playerId: req.params.id });
  if (!player) {
    player = await Player.create({
      playerId: req.params.id,
      name: req.params.id,
      balance: 10000
    });
  }
  res.json(player);
});

// -----------------
// 获取游戏状态
// -----------------
app.get("/api/game", (req, res) => {
  res.json(currentResult);
});

// -----------------
// 玩家下注
// -----------------
app.post("/api/bet", async (req, res) => {
  try {
    const { playerId, area, amount } = req.body;
    if (!playerId || !area || !amount) return res.json({ success: false, message: "下注数据错误" });

    const player = await Player.findOne({ playerId });
    if (!player) return res.json({ success: false, message: "玩家不存在" });
    if (player.balance < amount) return res.json({ success: false, message: "余额不足" });

    player.balance -= Number(amount);
    await player.save();

    const bet = await Bet.create({ playerId, area, amount, result: "pending", settled: false });
    
    io.emit("updatePlayer", player);
    io.emit("newBet", bet);

    res.json({ success: true, balance: player.balance, bet });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------
// 玩家投注记录
// -----------------
app.get("/api/bets/:playerId", async (req, res) => {
  const list = await Bet.find({ playerId: req.params.playerId }).sort({ createdAt: -1 });
  res.json(list);
});

// -----------------
// 后台管理接口
// -----------------
app.post("/admin/open", async (req, res) => {
  try {
    const { result } = req.body;
    currentResult.result = result;

    const bets = await Bet.find({ settled: false });
    for (const bet of bets) {
      const win = bet.area === result;
      bet.result = win ? "win" : "lose";
      bet.settled = true;
      await bet.save();

      if (win) {
        const player = await Player.findOne({ playerId: bet.playerId });
        if (player) {
          let multiplier = 1;
          if (result === "和") multiplier = 8;
          else if (result === "庄") multiplier = 0.95;
          player.balance += Math.floor(bet.amount * multiplier);
          await player.save();
          io.emit("updatePlayer", player);
        }
      }
    }

    io.emit("updateBets", bets);
    io.emit("gameResult", currentResult);

    res.json({ success: true, result: currentResult.result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------
// 增加玩家
// -----------------
app.post("/admin/player", async (req, res) => {
  const { playerId, name, balance } = req.body;
  const player = await Player.create({ playerId, name, balance });
  io.emit("newPlayer", player);
  res.json(player);
});

// -----------------
// 获取所有玩家
// -----------------
app.get("/api/players", async (req, res) => {
  const list = await Player.find();
  res.json(list);
});

// -----------------
// Socket.io 连接
// -----------------
io.on("connection", socket => {
  console.log("客户端连接:", socket.id);
});

// -----------------
// 启动服务
// -----------------
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
