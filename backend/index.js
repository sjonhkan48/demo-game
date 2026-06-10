const express = require('express')
const cors = require('cors')
const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// 模拟数据库
let players = {
  'player1': { score: 10000 },
  'player2': { score: 10000 }
}

// 获取玩家积分
app.get('/api/score/:player', (req, res) => {
  const player = req.params.player
  if(players[player]) res.json({ score: players[player].score })
  else res.status(404).json({ error: '玩家不存在' })
})

// 后台调整积分
app.post('/api/score/:player', (req, res) => {
  const player = req.params.player
  const { delta } = req.body
  if(players[player]){
    players[player].score += delta
    res.json({ score: players[player].score })
  } else {
    res.status(404).json({ error: '玩家不存在' })
  }
})

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})