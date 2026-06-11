// server.js
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const http = require('http')
const { Server } = require('socket.io')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(bodyParser.json())

// ------------------------
// 数据存储 (内存)
// ------------------------
let players = [
  { id: 'player1', name: 'player1', balance: 10000 }
]

let records = []

let game = {
  result: '等待开奖',
  time: 20
}

// ------------------------
// API 接口
// ------------------------

// 获取玩家信息
app.get('/api/player/:id', (req, res) => {
  const player = players.find(p => p.id === req.params.id)
  if (!player) return res.status(404).json({ error: 'Player not found' })
  res.json(player)
})

// 获取全部玩家
app.get('/api/players', (req, res) => {
  res.json(players)
})

// 创建新玩家
app.post('/api/player', (req, res) => {
  const { name, balance } = req.body
  const newPlayer = {
    id: 'player' + Date.now(),
    name: name || 'player' + Date.now(),
    balance: balance || 10000
  }
  players.push(newPlayer)
  res.json(newPlayer)
})

// 获取游戏状态
app.get('/api/game', (req, res) => {
  res.json(game)
})

// 获取玩家投注记录
app.get('/api/bets/:id', (req, res) => {
  const playerBets = records.filter(r => r.playerId === req.params.id)
  res.json(playerBets)
})

// 获取全部投注记录
app.get('/api/records', (req, res) => {
  res.json(records)
})

// 玩家下注
app.post('/api/bets', (req, res) => {
  const { playerId, option, amount } = req.body
  const player = players.find(p => p.id === playerId)
  if (!player) return res.status(404).json({ success: false, error: 'Player not found' })
  if (player.balance < amount) return res.status(400).json({ success: false, error: 'Not enough balance' })

  player.balance -= amount

  const record = {
    id: records.length + 1,
    playerId,
    option,
    amount,
    result: null
  }
  records.push(record)

  // 广播给所有客户端
  io.emit('update', { player, game, betRecords: records })

  res.json({ success: true, record })
})

// ------------------------
// Socket.IO 实时更新
// ------------------------
const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: '*' }
})

io.on('connection', socket => {
  console.log('Socket connected:', socket.id)
  // 初始化发送数据
  socket.emit('update', { player: players[0], game, betRecords: records })
})

// ------------------------
// 启动服务
// ------------------------
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
