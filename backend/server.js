// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const server = http.createServer(app);

// =====================
// MongoDB 连接
// =====================
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB Error:', err));

// =====================
// 定义 schema
// =====================
const playerSchema = new mongoose.Schema({
  id: String,
  name: String,
  balance: Number
});

const recordSchema = new mongoose.Schema({
  playerId: String,
  option: String,
  amount: Number,
  result: String
});

const gameSchema = new mongoose.Schema({
  result: String,
  countdown: Number,
  betting: Boolean
});

const Player = mongoose.model('Player', playerSchema);
const Record = mongoose.model('Record', recordSchema);
const Game = mongoose.model('Game', gameSchema);

// =====================
// 初始化游戏状态
// =====================
let gameState = {
  result: '等待开奖',
  countdown: 20,
  betting: true
};

// =====================
// Socket.io
// =====================
const io = new Server(server, {
  cors: { origin: '*' }
});

function broadcast() {
  Promise.all([
    Player.find(),
    Record.find()
  ]).then(([players, records]) => {
    io.emit('update', { players, game: gameState, records });
  });
}

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  broadcast();
});

// =====================
// 前端 API
// =====================

// 获取所有玩家
app.get('/api/players', async (req, res) => {
  const players = await Player.find();
  res.json(players);
});

// 获取单个玩家
app.get('/api/player/:id', async (req, res) => {
  let p = await Player.findOne({ id: req.params.id });
  if (!p) {
    return res.json({ id: req.params.id, name: req.params.id, balance: 0 });
  }
  res.json(p);
});

// 投注
app.post('/api/bets', async (req, res) => {
  const { playerId, option, amount } = req.body;
  let player = await Player.findOne({ id: playerId });
  if (!player) return res.json({ success: false, msg: '玩家不存在' });
  if (player.balance < amount) return res.json({ success: false, msg: '余额不足' });

  player.balance -= amount;
  await player.save();

  const record = new Record({
    playerId,
    option,
    amount,
    result: '等待开奖'
  });
  await record.save();

  broadcast();
  res.json({ success: true, record });
});

// 获取下注记录
app.get('/api/records', async (req, res) => {
  const records = await Record.find();
  res.json(records);
});

// =====================
// 后台接口
// =====================

// 修改玩家积分/信息
app.post('/admin/update-player', async (req, res) => {
  const { id, name, balance } = req.body;
  let player = await Player.findOne({ id });
  if (!player) {
    player = new Player({ id, name, balance });
    await player.save();
  } else {
    player.name = name;
    player.balance = Number(balance);
    await player.save();
  }
  broadcast();
  res.json({ success: true, player });
});

// 开奖
app.post('/admin/open', async (req, res) => {
  const { result } = req.body;
  gameState.result = result;

  const records = await Record.find();
  for (const r of records) {
    if (r.option === result) {
      r.result = '中奖';
      const player = await Player.findOne({ id: r.playerId });
      if (player) {
        player.balance += r.amount * 1; // 根据赔率可修改
        await player.save();
      }
    } else {
      r.result = '未中奖';
    }
    await r.save();
  }

  broadcast();
  res.json({ success: true, game: gameState });
});

// 下一轮
app.post('/admin/next', async (req, res) => {
  gameState.countdown = 20;
  gameState.result = '等待开奖';
  gameState.betting = true;
  await Record.deleteMany({});
  broadcast();
  res.json({ success: true, game: gameState });
});

// =====================
// 启动服务
// =====================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running at port ${PORT}`));
