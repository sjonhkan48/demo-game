const express = require("express")
const cors = require("cors")
const path = require("path")

const app = express()
app.use(cors())
app.use(express.json())

// 前端静态文件
app.use(express.static(path.join(__dirname, '../frontend/dist')))
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'))
})

// 玩家积分
const players = { player1: { score: 10000 } }

// 查询积分
app.get("/api/score/:id", (req, res) => {
  const id = req.params.id
  if(!players[id]) players[id] = { score:10000 }
  res.json(players[id])
})

// 修改积分
app.post("/api/score/:id", (req, res) => {
  const id = req.params.id
  const delta = Number(req.body.delta)
  if(!players[id]) players[id] = { score:10000 }
  players[id].score += delta
  res.json(players[id])
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`server start at port ${PORT}`)
})
