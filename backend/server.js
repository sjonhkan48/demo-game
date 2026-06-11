const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

// ========== 配置 ==========

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// =====================
// MongoDB 连接
// =====================
mongoose.connect("mongodb://localhost:27017/demo-game", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => console.log("MongoDB connected"));

// =====================
// 数据模型
// =====================
const playerSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4 },
  name: String,
  balance: Number,
  status: { type: String, default: "在线" }
});

const recordSchema = new mongoose.Schema({
  playerId: String,
  option: String,
  amount: Number,
  result: { type: String, default: "等待开奖" },
  createdAt: { type: Date, default: Date.now }
});

const gameSchema = new mongoose.Schema({
  result: { type: String, default: "等待开奖" },
  countdown: { type: Number, default: 20 },
  betting: { type: Boolean, default: true }
});

const Player = mongoose.model("Player", playerSchema);
const Record = mongoose.model("Record", recordSchema);
const Game = mongoose.model("Game", gameSchema);

// =====================
// 初始化游戏状态
// =====================
let gameState;

(async () => {
  gameState = await Game.findOne();
  if (!gameState) {
    gameState = await Game.create({});
  }
})();

// =====================
// Socket 同步
// =====================
async function broadcast() {
  const players = await Player.find();
  const records = await Record.find();
  io.emit("update", { players, game: gameState, records });
}

io.on("connection", (socket) => {
  broadcast();
});

// =====================
// API - 玩家管理
// =====================
app.get("/api/players", async (req, res) => {
  const players = await Player.find();
  res.json(players);
});

app.get("/api/player/:id", async (req, res) => {
  const p = await Player.findOne({ id: req.params.id });
  if (!p) return res.json({ id: req.params.id, name: "", balance: 0 });
  res.json(p);
});

// =====================
// API - 投注
// =====================
app.post("/api/bets", async (req, res) => {
  const { playerId, option, amount } = req.body;
  const player = await Player.findOne({ id: playerId });
  if (!player) return res.json({ success: false, msg: "玩家不存在" });
  if (player.balance < amount) return res.json({ success: false, msg: "余额不足" });

  player.balance -= Number(amount);
  await player.save();

  const record = await Record.create({ playerId, option, amount });
  await broadcast();
  res.json({ success: true, record });
});

// =====================
// API - 记录
// =====================
app.get("/api/records", async (req, res) => {
  const records = await Record.find();
  res.json(records);
});

// =====================
// 后台 - 更新玩家
// =====================
app.post("/admin/update-player", async (req, res) => {
  const { id, name, balance } = req.body;
  let player = await Player.findOne({ id });
  if (!player) {
    player = await Player.create({ id, name, balance });
  } else {
    player.name = name;
    player.balance = Number(balance);
    await player.save();
  }
  await broadcast();
  res.json({ success: true, player });
});

// =====================
// 后台 - 开奖
// =====================
app.post("/admin/open", async (req, res) => {
  const { result } = req.body;
  gameState.result = result;
  gameState.betting = false;
  await gameState.save();

  const records = await Record.find({ result: "等待开奖" });
  for (const r of records) {
    const player = await Player.findOne({ id: r.playerId });
    if (!player) continue;
    if (r.option === result) {
      r.result = "中奖";
      player.balance += r.amount * 2; // 奖金
      await player.save();
    } else {
      r.result = "未中奖";
    }
    await r.save();
  }

  await broadcast();
  res.json({ success: true });
});

// =====================
// 后台 - 下一轮
// =====================
app.post("/admin/next", async (req, res) => {
  gameState.result = "等待开奖";
  gameState.countdown = 20;
  gameState.betting = true;
  await gameState.save();
  await broadcast();
  res.json({ success: true });
});

// =====================
// 启动
// =====================
server.listen(3000, () => console.log("Server running on port 3000"));
