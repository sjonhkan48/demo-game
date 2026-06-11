require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const Player = require("./models/player");
const Bet = require("./models/Bet");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// ----------------------
// MongoDB 连接
// ----------------------
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB Error:", err));

let currentResult = "等待开奖";

// ----------------------
// WebSocket 连接
// ----------------------
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // 给新连接的客户端推送当前状态
  sendGameState(socket);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

async function sendGameState(socket) {
  const bets = await Bet.find().sort({ createdAt: -1 });
  const players = await Player.find();
  const data = {
    result: currentResult,
    bets,
    players,
  };
  if (socket) socket.emit("gameState", data);
  else io.emit("gameState", data);
}

// ----------------------
// 玩家下注
// ----------------------
app.post("/api/bet", async (req, res) => {
  try {
    const { playerId, area, amount } = req.body;
    const player = await Player.findOne({ playerId });
    if (!player || player.score < amount) return res.json({ success: false });

    player.score -= Number(amount);
    await player.save();

    const bet = await Bet.create({ playerId, area, amount, result: "pending", settled: false });

    sendGameState(); // 推送更新到所有客户端
    res.json({ success: true, score: player.score, bet });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ----------------------
// 后台开奖
// ----------------------
app.post("/admin/open", async (req, res) => {
  try {
    const { result } = req.body;
    currentResult = result;

    const bets = await Bet.find({ settled: false });

    for (const bet of bets) {
      let win = bet.area === result;
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

    sendGameState(); // 实时推送
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------
// 后台下一轮
// ----------------------
app.post("/admin/next", async (req, res) => {
  currentResult = "等待开奖";
  await Bet.updateMany({}, { settled: false, result: "pending" });
  sendGameState();
  res.json({ success: true });
});

// ----------------------
// 启动服务
// ----------------------
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
