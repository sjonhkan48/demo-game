const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const Player = require("../models/player");
const Bet = require("../models/Bet");
const game = require("../services/game");

// 玩家列表
router.get("/players", async (req, res) => {
  try {
    const players = await Player.find({}).sort({ createdAt: -1 });
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 修改玩家名称或积分
router.post("/player/:id", async (req, res) => {
  try {
    const { name, score } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (score !== undefined) updateData.score = score;

    const player = await Player.findOneAndUpdate(
      { playerId: req.params.id },
      updateData,
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
    const url = `https://你的vercel域名/?player=${playerId}`;
    res.json({ playerId, url, score: player.score });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 后台手动开奖
router.post("/open", async (req, res) => {
  try {
    const { result } = req.body;
    const finalResult = await game.openGame(result);
    res.json({ success: true, result: finalResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 开启下一轮
router.post("/next", async (req, res) => {
  try {
    game.newRound();
    res.json({ success: true, message: "新一轮开始" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 后台全部开奖记录
router.get("/records", async (req, res) => {
  try {
    const records = await Bet.find({}).sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
