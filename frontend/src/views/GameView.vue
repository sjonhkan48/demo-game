<template>
  <div class="game-container">
    <!-- 余额与倒计时 -->
    <div class="balance-timer">
      <span>💰 当前余额：{{ player.balance }}</span>
      <span>下注倒计时 {{ countdown }} 秒</span>
    </div>

    <!-- 开奖结果 -->
    <div class="result-display">
      开奖结果：{{ game.result }}
    </div>

    <!-- 投注选项 -->
    <div class="bet-board">
      <div v-for="option in options" :key="option.name" class="bet-option" :style="{ backgroundColor: option.color }">
        <div class="bet-name">{{ option.name }}</div>
        <div class="bet-odds">赔率 {{ option.odds }}</div>
      </div>
    </div>

    <!-- 筹码 -->
    <div class="chips">
      <button v-for="chip in chips" :key="chip" @click="selectChip(chip)" :class="{ selected: selectedChip === chip }">{{ chip }}</button>
      <input type="number" v-model.number="customBet" placeholder="自定义下注"/>
    </div>

    <!-- 当前下注 -->
    <div class="current-bet">
      当前筹码: {{ selectedChip || customBet || 0 }} 当前下注: {{ currentBetOption || '未选择' }}
      <button @click="placeBet" :disabled="!canBet || (selectedChip===0 && customBet===0)">确认下注</button>
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
        <tr v-for="(record, index) in betRecords" :key="index">
          <td>{{ record.playerId }}</td>
          <td>{{ record.option }}</td>
          <td>{{ record.amount }}</td>
          <td :class="{'win': record.result==='赢','lose': record.result==='输'}">{{ record.result || '等待开奖' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { io } from 'socket.io-client'

// 玩家与游戏状态
const player = reactive({ id: 'player1', name: 'player1', balance: 10000 })
const game = reactive({ result: '等待开奖', countdown: 20 })
const options = [
  { name: '闲', odds: 1, color: '#1c3d91' },
  { name: '和', odds: 8, color: '#228b22' },
  { name: '庄', odds: 0.95, color: '#b22222' }
]
const chips = [10, 50, 100, 500, 1000]
const selectedChip = ref(null)
const customBet = ref(null)
const currentBetOption = ref(null)
const betRecords = ref([])
const countdown = ref(20)
const canBet = ref(true)

let socket

function selectChip(chip) {
  selectedChip.value = chip
  customBet.value = null
}

async function fetchPlayer() {
  try {
    const res = await axios.get(`/api/player/${player.id}`)
    Object.assign(player, res.data)
  } catch (e) { console.error(e) }
}

async function fetchGame() {
  try {
    const res = await axios.get('/api/game')
    game.result = res.data.result
    countdown.value = res.data.time
  } catch (e) { console.error(e) }
}

function startCountdown() {
  const timer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--
    } else {
      clearInterval(timer)
      canBet.value = false
    }
  }, 1000)
}

async function placeBet() {
  if (!currentBetOption.value) return
  const amount = customBet.value || selectedChip.value
  if (amount > player.balance) return alert('筹码不足')
  try {
    const res = await axios.post('/api/bets', {
      playerId: player.id,
      option: currentBetOption.value,
      amount
    })
    if (res.data.success) {
      player.balance -= amount
      betRecords.value.push({
        playerId: player.id,
        option: currentBetOption.value,
        amount,
        result: null
      })
    }
  } catch(e){ console.error(e) }
}

function initSocket() {
  socket = io('/', { path: '/socket.io' })
  socket.on('connect', () => console.log('Socket connected'))
  socket.on('update', data => {
    if (data.player) Object.assign(player, data.player)
    if (data.game) Object.assign(game, data.game)
    if (data.betRecords) betRecords.value = data.betRecords
  })
}

onMounted(async () => {
  await fetchPlayer()
  await fetchGame()
  initSocket()
  startCountdown()
})
</script>

<style scoped>
.game-container {
  padding: 20px;
  color: #fff;
  background-color: #0f2d17;
}
.balance-timer {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}
.result-display {
  font-size: 20px;
  margin-bottom: 10px;
  text-align: center;
}
.bet-board {
  display: flex;
  justify-content: space-around;
  border: 3px solid gold;
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 10px;
}
.bet-option {
  flex: 1;
  text-align: center;
  color: white;
  font-weight: bold;
  padding: 20px;
  border-radius: 5px;
}
.chips button {
  margin: 5px;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  font-weight: bold;
}
.current-bet {
  margin: 10px 0;
}
.bet-records {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}
.bet-records th, .bet-records td {
  border: 1px solid #fff;
  padding: 5px;
  text-align: center;
}
.win { color: green }
.lose { color: red }
</style>
