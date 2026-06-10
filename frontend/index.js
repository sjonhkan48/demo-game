const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

app.use(cors())
app.use(express.json())

let currentResult = null

io.on('connection', (socket) => {
  console.log('客户端已连接:', socket.id)

  // 发送当前结果和倒计时初始值
  socket.emit('init', { result: currentResult })

  // 模拟后台开奖
  socket.on('draw', () => {
    const outcomes = ['player', 'tie', 'banker']
    const winner = outcomes[Math.floor(Math.random() * 3)]
    currentResult = winner
    io.emit('result', { winner })
  })
})

server.listen(3000, () => {
  console.log('后端启动成功 http://localhost:3000')
})
