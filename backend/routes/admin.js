const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const Player = require("../models/player");
const Bet = require("../models/Bet");
const { game } = require("../services/game");

// 获取玩家列表
router.get("/players", async (req, res) => {
  try {
    const players = await Player.find({}).sort({ createdAt: -1 });
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 修改玩家信息
router.post("/player/:id", async (req, res) => {
  try {
    const { name, score } = req.body;
    const player = await Player.findOneAndUpdate(
      { playerId: req.params.id },
      { name, score },
      { new: true }
    );
    res.json(player);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 生成邀请链接
router.post("/invite", async (req, res) => {
  try {
    const playerId = "player_" + crypto.randomBytes(6).toString("hex");
    const player = await Player.create({ playerId, name: "新玩家", score: 10000 });
    // 指向前端静态站点 URL
    const url = `https://demo-game-2.onrender.com/?player=${playerId}`;
    res.json({ playerId, url, score: player.score });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 后台手动开奖
router.post("/open", async (req, res) => {
  try {
    const { result } = req.body;
    game.result = result;
    game.bettingOpen = false;
    game.time = 0;
    res.json({ success: true, result: game.result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 开启下一轮
router.post("/next", async (req, res) => {
  try {
    game.result = "等待开奖";
    game.bettingOpen = true;
    game.time = 20;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 后台获取全部开奖记录
router.get("/records", async (req, res) => {
  try {
    const records = await Bet.find({}).sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
