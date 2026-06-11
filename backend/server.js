// server.js
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import bodyParser from 'body-parser';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(bodyParser.json());

// 模拟数据存储
let players = {};
let betRecords = [];
let gameState = {
  status: '等待开奖',
  result: null,
  countdown: 20
};

// 创建玩家
app.post('/api/player', (req, res) => {
  const id = uuidv4();
  const { name, balance } = req.body;
  players[id] = { id, name, balance: balance || 10000 };
  res.json(players[id]);
});

// 获取单个玩家
app.get('/api/player/:id', (req, res) => {
  const player = players[req.params.id];
  if (!player) return res.status(404).json({ error: 'Player not found' });
  res.json(player);
});

// 获取所有玩家
app.get('/api/players', (req, res) => {
  res.json(Object.values(players));
});

// 获取游戏状态
app.get('/api/game', (req, res) => {
  res.json({
    result: gameState.result || '等待开奖',
    countdown: gameState.countdown
  });
});

// 玩家下注
app.post('/api/bets', (req, res) => {
  const { playerId, option, amount } = req.body;
  const player = players[playerId];
  if (!player) return res.status(404).json({ error: 'Player not found' });
  if (player.balance < amount) return res.status(400).json({ error: '余额不足' });

  player.balance -= amount;
  const record = {
    id: uuidv4(),
    playerId,
    option,
    amount,
    result: null
  };
  betRecords.push(record);

  io.emit('update', { players: Object.values(players), betRecords, game: gameState });
  res.json({ success: true });
});

// 获取投注记录
app.get('/api/records', (req, res) => {
  res.json(betRecords);
});

// 管理后台 API
app.post('/admin/update-player', (req, res) => {
  const { id, name, balance } = req.body;
  if (!players[id]) return res.status(404).json({ error: 'Player not found' });
  players[id].name = name;
  players[id].balance = balance;
  io.emit('update', { players: Object.values(players), betRecords, game: gameState });
  res.json({ success: true });
});

// 开奖
app.post('/admin/open', (req, res) => {
  const { result } = req.body;
  gameState.result = result;
  gameState.status = '开奖结束';
  
  // 更新投注结果
  betRecords.forEach(record => {
    if (!record.result) {
      if (record.option === result) record.result = '赢';
      else record.result = '输';
    }
  });

  io.emit('update', { players: Object.values(players), betRecords, game: gameState });
  res.json({ success: true });
});

// 下一轮
app.post('/admin/next', (req, res) => {
  gameState.result = null;
  gameState.status = '下轮开始';
  gameState.countdown = 20;
  betRecords = []; // 清空投注
  io.emit('update', { players: Object.values(players), betRecords, game: gameState });
  res.json({ success: true });
});

// Socket.io
io.on('connection', (socket) => {
  console.log('客户端连接:', socket.id);
  socket.emit('update', { players: Object.values(players), betRecords, game: gameState });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
