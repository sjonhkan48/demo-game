const express = require('express');
const mongoose = require('mongoose');
const Bet = require('./models/Bet');
const Player = require('./models/Player'); // 假设已有玩家模型
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Atlas 连接
mongoose.connect('你的MongoDB链接', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// 获取玩家积分
app.get('/api/score/:playerId', async (req, res) => {
  const player = await Player.findOne({ id: req.params.playerId });
  if (!player) return res.status(404).json({ error: '玩家不存在' });
  res.json({ balance: player.balance });
});

// 修改玩家积分（后台）
app.post('/admin/player/:id', async (req, res) => {
  const { balance } = req.body;
  const player = await Player.findOneAndUpdate({ id: req.params.id }, { balance }, { new: true });
  res.json(player);
});

// 下单
app.post('/api/bet', async (req, res) => {
  const { playerId, area, amount } = req.body;
  const player = await Player.findOne({ id: playerId });
  if (!player) return res.status(404).json({ error: '玩家不存在' });
  if (amount <= 0 || amount > player.balance) return res.status(400).json({ error: '投注金额不合法' });

  // 下注时不扣余额
  const oddsMap = { '闲': 2, '和': 8, '庄': 1.95 }; // 示例赔率
  const bet = new Bet({ playerId, area, amount, odds: oddsMap[area] });
  await bet.save();
  res.json(bet);
});

// 获取所有下注记录
app.get('/api/bets', async (req, res) => {
  const bets = await Bet.find();
  res.json(bets);
});

// 新增开奖接口
app.get('/api/result', async (req, res) => {
  // 随机生成结果
  const areas = ['闲', '和', '庄'];
  const resultArea = areas[Math.floor(Math.random() * areas.length)];

  // 获取所有待开奖下注
  const bets = await Bet.find({ status: 'pending' });

  for (let bet of bets) {
    const player = await Player.findOne({ id: bet.playerId });
    if (!player) continue;

    if (bet.area === resultArea) {
      // 赢
      bet.status = 'win';
      bet.payout = Math.round(bet.amount * bet.odds); // 结算金额
      player.balance += bet.payout; // 发放奖金
    } else if (resultArea === '和') {
      // 和局处理
      bet.status = 'draw';
      bet.payout = bet.amount; // 返还本金
      player.balance += bet.amount;
    } else {
      // 输
      bet.status = 'lose';
      bet.payout = 0;
      player.balance -= bet.amount; // 扣除本金
    }

    await bet.save();
    await player.save();
  }

  res.json({
    result: resultArea,
    bets: await Bet.find()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
