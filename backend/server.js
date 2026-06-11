require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// ----------------------
// 中间件
// ----------------------
app.use(cors({ origin: "*" }));
app.use(express.json());

// ----------------------
// MongoDB 连接
// ----------------------
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB Error:", err));

// ----------------------
// 模型
// ----------------------
const playerSchema = new mongoose.Schema({
  playerId: String,
  name: String,
  balance: Number
});
const Player = mongoose.model("Player", playerSchema);

const betSchema = new mongoose.Schema({
  playerId: String,
  option: String,
  amount: Number,
  result: String,
  settled: Boolean
});
const Bet = mongoose.model("Bet", betSchema);

// ----------------------
// 游戏状态
// ----------------------
let game = { result: "等待开奖", status: "下注中", countdown: 20 };
let bets = [];
let records = [];

// ----------------------
// API: 获取玩家
// ----------------------
app.get("/api/players", async (req, res) => {
  const players = await Player.find({});
  res.json(players);
});

// ----------------------
// API: 修改玩家
// ----------------------
app.post("/admin/update-player", async (req, res) => {
  try {
    const { playerId, name, balance } = req.body;
    let player = await Player.findOne({ playerId });
    if (!player) return res.status(404).json({ success: false, msg: "玩家不存在" });

    player.name = name;
    player.balance = Number(balance);
    await player.save();

    io.emit("update", { players: await Player.find({}) });
    res.json({ success: true, player });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
});

// ----------------------
// API: 开奖
// ----------------------
app.post("/admin/open", async (req, res) => {
  try {
    const { result } = req.body;
    game.result = result || ["闲", "和", "庄"][Math.floor(Math.random() * 3)];
    game.status = "开奖";

    const currentBets = await Bet.find({ settled: false });
    for (const bet of currentBets) {
      let win = bet.option === game.result;
      bet.result = win ? "win" : "lose";
      bet.settled = true;

      if (win) {
        let player = await Player.findOne({ playerId: bet.playerId });
        if (player) {
          let odds = game.result === "和" ? 8 : game.result === "庄" ? 0.95 : 1;
          player.balance += Math.floor(bet.amount * odds);
          await player.save();
        }
      }
      await bet.save();
    }

    records.push(...currentBets);

    io.emit("update", { game, bets: currentBets, records, players: await Player.find({}) });
    res.json({ success: true, result: game.result });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
});

// ----------------------
// API: 下一轮
// ----------------------
app.post("/admin/next", async (req, res) => {
  bets = [];
  game = { result: "等待开奖", status: "下注中", countdown: 20 };
  io.emit("update", { game, bets });
  res.json({ success: true });
});

// ----------------------
// API: 玩家投注记录
// ----------------------
app.get("/api/records", async (req, res) => {
  res.json(records);
});

// ----------------------
// Socket.io 实时同步
// ----------------------
io.on("connection", socket => {
  console.log("socket connected");
  socket.emit("update", { game, bets, records });
});

// ----------------------
// 启动
// ----------------------
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
