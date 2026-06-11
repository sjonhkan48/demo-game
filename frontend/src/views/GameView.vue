<template>
  <div class="game-container">
    <!-- 余额和倒计时 -->
    <div class="balance-timer">
      <span class="balance">💰 当前余额：{{ player.balance }}</span>
      <span class="countdown">下注倒计时 {{ countdown }} 秒</span>
    </div>

    <!-- 游戏结果显示 -->
    <div class="result-display">
      开奖结果：<span :class="resultClass">{{ game.result }}</span>
    </div>

    <!-- 投注区域 -->
    <div class="bet-board">
      <div
        class="bet-option"
        v-for="option in options"
        :key="option.name"
        :style="{ backgroundColor: option.color }"
        @click="choose(option.name)"
      >
        <div class="bet-name">{{ option.name }}</div>
        <div class="bet-odds">赔率 {{ option.odds }}</div>
      </div>
    </div>

    <!-- 筹码选择 -->
    <div class="chips">
      <button
        v-for="chip in chips"
        :key="chip"
        :class="'chip'+chip"
        @click="selectChip(chip)"
      >
        {{ chip }}
      </button>
      <input type="number" v-model.number="customBet" placeholder="自定义下注"/>
    </div>

    <!-- 当前下注显示 -->
    <div class="current-bet">
      当前筹码: {{ selectedChip || customBet }} 当前下注: {{ currentOption || '未选择' }}
      <button @click="placeBet" :disabled="!canBet || !currentOption">
        {{ canBet ? '确认下注' : '停止下注' }}
      </button>
    </div>

    <!-- 投注记录表格 -->
    <table class="bet-records">
      <thead>
        <tr>
          <th>玩家ID</th>
          <th>区域</th>
          <th>金额</th>
          <th>结果</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="record in records" :key="record.id">
          <td>{{ record.playerId }}</td>
          <td>{{ record.option }}</td>
          <td>{{ record.amount }}</td>
          <td :class="recordClass(record.result)">{{ record.result }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { io } from 'socket.io-client'
import axios from 'axios'

const player = reactive({ id: 'player1', balance: 10000 })
const game = reactive({ result: '等待开奖' })
const countdown = ref(20)
const canBet = ref(true)

const options = [
  { name: '闲', color: '#1745a0', odds: 1 },
  { name: '和', color: '#14853d', odds: 8 },
  { name: '庄', color: '#b31319', odds: 0.95 }
]
const chips = [10, 50, 100, 500, 1000]
const selectedChip = ref(0)
const customBet = ref(0)
const currentOption = ref('')
const records = ref([])

function selectChip(chip) {
  selectedChip.value = chip
  customBet.value = 0
}

function choose(option) {
  if (!canBet.value) return
  currentOption.value = option
}

async function placeBet() {
  if (!currentOption.value) return alert('请选择投注区域')
  const amount = customBet.value || selectedChip.value
  if (amount > player.balance) return alert('余额不足')

  const r = await axios.post('/api/bets', {
    playerId: player.id,
    option: currentOption.value,
    amount
  })
  if (r.data.success) {
    player.balance -= amount
    records.value.push({
      id: Date.now(),
      playerId: player.id,
      option: currentOption.value,
      amount,
      result: '等待开奖'
    })
  }
}

function startCountdown() {
  const interval = setInterval(() => {
    if (countdown.value > 0) countdown.value--
    else {
      canBet.value = false
      clearInterval(interval)
    }
  }, 1000)
}

function resultClass() {
  if (game.result === '等待开奖') return 'waiting'
  return game.result === '庄' || game.result === '闲' ? 'win' : 'lose'
}

function recordClass(result) {
  if (result === '等待开奖') return 'waiting'
  if (result === '输') return 'lose'
  return 'win'
}

function initSocket() {
  const socket = io('/', { path: '/socket.io' })
  socket.on('update', data => {
    if (data.player) Object.assign(player, data.player)
    if (data.game) Object.assign(game, data.game)
    if (data.bets) records.value = data.bets
  })
}

onMounted(() => {
  startCountdown()
  initSocket()
})
</script>

<style scoped>
.game-container {
  background-color: #0f2d17;
  color: #fff;
  padding: 20px;
}
.balance-timer {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}
.balance { color: #FFD700; }
.countdown { color: red; }
.result-display {
  font-size: 22px;
  margin-bottom: 10px;
  text-align: center;
}
.result-display .waiting { color: yellow; }
.result-display .win { color: green; }
.result-display .lose { color: red; }

.bet-board {
  display: flex;
  border: 3px solid gold;
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 10px;
}
.bet-option {
  flex: 1;
  text-align: center;
  font-weight: bold;
  padding: 20px;
  margin: 0 5px;
  cursor: pointer;
  border-radius: 8px;
  color: #fff;
}
.chips {
  margin: 10px 0;
}
.chips button {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin: 5px;
  font-weight: bold;
  cursor: pointer;
  border: none;
  color: #fff;
}
.chip10 { background:red; }
.chip50 { background:blue; }
.chip100 { background:green; }
.chip500 { background:purple; }
.chip1000 { background:black; color:white; }
.current-bet {
  margin: 10px 0;
}
.current-bet button {
  margin-left: 10px;
  padding: 5px 10px;
  font-weight: bold;
  cursor: pointer;
}
.bet-records {
  width: 100%;
  border-collapse: collapse;
}
.bet-records th, .bet-records td {
  border: 1px solid #fff;
  padding: 5px;
  text-align: center;
}
.bet-records td.waiting { color: yellow; }
.bet-records td.win { color: green; }
.bet-records td.lose { color: red; }
</style>
