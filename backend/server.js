const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: '*' }
})

app.use(cors())
app.use(express.json())

// ==== 模拟数据 ====
let players = [
  { id: 'player1', name: 'player1', balance: 10000 },
  { id: 'player2', name: 'player2', balance: 5000 }
]

let game = { result: '等待开奖', countdown: 20, status: '下注中' }
let betRecords = []

// ==== API ====
app.get('/api/player/:id', (req, res) => {
  const player = players.find(p => p.id === req.params.id)
  if (player) return res.json(player)
  return res.status(404).json({ error: 'Player not found' })
})

app.get('/api/game', (req, res) => res.json(game))

app.get('/api/bets', (req, res) => res.json(betRecords))

app.post('/api/bets', (req, res) => {
  const { playerId, option, amount } = req.body
  const player = players.find(p => p.id === playerId)
  if (!player) return res.status(404).json({ success: false, message: 'Player not found' })
  if (amount > player.balance) return res.status(400).json({ success: false, message: '余额不足' })

  player.balance -= amount
  const record = { id: Date.now().toString(), playerId, option, amount, result: null }
  betRecords.push(record)

  io.emit('update', { players, game, betRecords })
  return res.json({ success: true })
})

// ==== Admin 控制 ====
app.post('/admin/open', (req, res) => {
  game.status = '下注中'
  game.countdown = 20
  game.result = '等待开奖'
  betRecords.forEach(r => r.result = null)
  io.emit('update', { players, game, betRecords })
  res.json({ success: true })
})

app.post('/admin/next', (req, res) => {
  // 随机开奖
  const results = ['闲', '和', '庄']
  const winning = results[Math.floor(Math.random() * results.length)]
  game.result = winning
  game.status = '开奖中'

  // 计算结果
  betRecords.forEach(r => {
    if (r.option === winning) r.result = '赢'
    else r.result = '输'
    const player = players.find(p => p.id === r.playerId)
    if (r.result === '赢') {
      if (r.option === '和') player.balance += r.amount * 8
      else if (r.option === '庄') player.balance += r.amount * 0.95
      else player.balance += r.amount
    }
  })

  game.status = '等待下注'
  io.emit('update', { players, game, betRecords })
  res.json({ success: true })
})

app.post('/admin/update-player', (req, res) => {
  const { id, name, balance } = req.body
  const player = players.find(p => p.id === id)
  if (!player) return res.status(404).json({ success: false, message: 'Player not found' })
  player.name = name
  player.balance = balance
  io.emit('update', { players, game, betRecords })
  res.json({ success: true })
})

// ==== Socket.io ====
io.on('connection', socket => {
  socket.emit('update', { players, game, betRecords })
})

const PORT = process.env.PORT || 10000
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))
