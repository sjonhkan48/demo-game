// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(bodyParser.json());

/* ===== 数据存储 ===== */
let players = [
  { id: 'player1', name: 'player1', balance: 10000 },
  { id: 'player2', name: 'player2', balance: 5000 }
];

let game = {
  result: '等待开奖',
  countdown: 20
};

let betRecords = [];

/* ===== API 路由 ===== */

// 获取玩家列表
app.get('/api/players', (req, res) => {
  res.json(players);
});

// 获取单个玩家
app.get('/api/player/:id', (req, res) => {
  const player = players.find(p => p.id === req.params.id);
  if (!player) return res.status(404).json({ error: '玩家不存在' });
  res.json(player);
});

// 获取游戏信息
app.get('/api/game', (req, res) => {
  res.json(game);
});

// 获取下注记录
app.get('/api/records', (req, res) => {
  res.json(betRecords);
});

// 玩家下注
app.post('/api/bets', (req, res) => {
  const { playerId, option, amount } = req.body;
  const player = players.find(p => p.id === playerId);
  if (!player) return res.status(404).json({ error: '玩家不存在' });
  if (amount > player.balance) return res.status(400).json({ error: '余额不足' });

  player.balance -= amount;
  const record = { playerId, option, amount, result: null };
  betRecords.push(record);

  io.emit('update', { player, betRecords });
  res.json({ success: true });
});

/* ===== 后台管理接口 ===== */

// 更新玩家信息
app.post('/admin/update-player', (req, res) => {
  const { id, name, balance } = req.body;
  const player = players.find(p => p.id === id);
  if (!player) return res.status(404).json({ error: '玩家不存在' });
  player.name = name;
  player.balance = balance;
  io.emit('update', { players });
  res.json({ success: true });
});

// 开奖
app.post('/admin/open', (req, res) => {
  const { result } = req.body;
  game.result = result;
  betRecords.forEach(record => {
    if (record.option === result) {
      record.result = '赢';
      const p = players.find(p => p.id === record.playerId);
      p.balance += record.amount * (result === '和' ? 8 : result === '庄' ? 0.95 : 1);
    } else {
      record.result = '输';
    }
  });
  io.emit('update', { game, players, betRecords });
  res.json({ success: true });
});

// 下一轮
app.post('/admin/next', (req, res) => {
  game.result = '等待开奖';
  game.countdown = 20;
  betRecords = [];
  io.emit('update', { game, betRecords });
  res.json({ success: true });
});

/* ===== Socket.io ===== */
io.on('connection', socket => {
  console.log('Socket connected', socket.id);
  socket.emit('update', { players, game, betRecords });
});

/* ===== 启动服务 ===== */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
