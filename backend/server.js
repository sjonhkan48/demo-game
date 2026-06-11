const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid"); // 生成唯一ID

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// =====================
// 数据
// =====================
let players = [
  { id: "player1", name: "玩家1", balance: 10000 }
];

let game = {
  result: "等待开奖",
  countdown: 20,
  betting: true
};

let records = [];

// =====================
// 广播同步
// =====================
function broadcast() {
  io.emit("update", { players, game, records });
}

// =====================
// 玩家接口
// =====================
app.get("/api/players", (req, res) => {
  res.json(players);
});

app.get("/api/player/:id", (req, res) => {
  const p = players.find(x => x.id === req.params.id);
  if (!p) {
    return res.json({ id: req.params.id, name: req.params.id, balance: 0 });
  }
  res.json(p);
});

// =====================
// 投注接口
// =====================
app.post("/api/bets", (req, res) => {
  const { playerId, option, amount } = req.body;
  const player = players.find(x => x.id === playerId);
  if (!player) return res.json({ success: false, msg: "玩家不存在" });
  if (player.balance < amount) return res.json({ success: false, msg: "余额不足" });

  player.balance -= Number(amount);

  const record = {
    id: uuidv4(),
    playerId,
    option,
    amount: Number(amount),
    result: "等待开奖"
  };

  records.push(record);
  broadcast();
  res.json({ success: true, record });
});

app.get("/api/records", (req, res) => {
  res.json(records);
});

// =====================
// 后台接口
// =====================
app.post("/admin/update-player", (req, res) => {
  const { id, name, balance } = req.body;
  let player = players.find(x => x.id === id);
  if (!player) {
    player = { id, name, balance: Number(balance) };
    players.push(player);
  } else {
    player.name = name;
    player.balance = Number(balance);
  }
  broadcast();
  res.json({ success: true, player });
});

app.post("/admin/open", (req, res) => {
  const { result } = req.body;
  game.result = result;

  // 结算记录
  records.forEach(r => {
    if (r.option === result) {
      r.result = "中奖";
      const p = players.find(x => x.id === r.playerId);
      if (p) {
        let multiple = 1;
        if (result === "和") multiple = 8;
        else if (result === "庄") multiple = 0.95;
        else multiple = 1;
        p.balance += Math.floor(r.amount * multiple);
      }
    } else {
      r.result = "未中奖";
    }
  });

  game.betting = false;
  broadcast();
  res.json({ success: true, game, records });
});

app.post("/admin/next", (req, res) => {
  game.result = "等待开奖";
  game.countdown = 20;
  game.betting = true;
  records = [];
  broadcast();
  res.json({ success: true, game, records });
});

// =====================
// Socket.io
// =====================
io.on("connection", socket => {
  console.log("新客户端连接");
  socket.emit("update", { players, game, records });
});

// =====================
// 启动服务
// =====================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
