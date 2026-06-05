const express = require("express")
const cors = require("cors")

const app = express()

// 允许跨域
app.use(cors())
// 解析 JSON 请求
app.use(express.json())

// 模拟数据库
const players = {
  player1: {
    score: 10000
  }
}

// 查询积分
app.get("/api/score/:id", (req, res) => {
  const id = req.params.id

  // 如果玩家不存在，初始化
  if (!players[id]) {
    players[id] = { score: 10000 }
  }

  res.json({ score: players[id].score })
})

// 修改积分（增减都行）
app.post("/api/score/:id", (req, res) => {
  const id = req.params.id
  const delta = Number(req.body.delta) || 0

  if (!players[id]) {
    players[id] = { score: 10000 }
  }

  players[id].score += delta

  // 防止负分
  if (players[id].score < 0) players[id].score = 0

  res.json({ score: players[id].score })
})

// 端口使用 Render 的环境变量 PORT
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server start on port ${PORT}`)
})
