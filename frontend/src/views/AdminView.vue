<template>
  <div class="admin-container">
    <h2>后台管理系统</h2>

    <!-- 游戏控制 -->
    <div class="game-control">
      <h3>游戏控制</h3>
      <p>当前状态: {{ game.result }}</p>
      <select v-model="selectedResult">
        <option value="闲">闲</option>
        <option value="和">和</option>
        <option value="庄">庄</option>
      </select>
      <button @click="openResult">立即开奖</button>
      <button @click="nextRound">下一轮</button>
    </div>

    <!-- 玩家管理 -->
    <div class="player-management">
      <h3>玩家管理</h3>
      <button @click="addPlayer">添加玩家</button>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>名称</th>
            <th>余额</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="player in players" :key="player.id">
            <td>{{ player.id }}</td>
            <td><input v-model="player.name" /></td>
            <td><input type="number" v-model.number="player.balance" /></td>
            <td>
              <button @click="savePlayer(player)">保存</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 投注记录 -->
    <div class="records">
      <h3>投注记录</h3>
      <table>
        <thead>
          <tr>
            <th>玩家ID</th>
            <th>区域</th>
            <th>金额</th>
            <th>结果</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in betRecords" :key="record.id">
            <td>{{ record.playerId }}</td>
            <td>{{ record.option }}</td>
            <td>{{ record.amount }}</td>
            <td>{{ record.result || '等待开奖' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { io } from 'socket.io-client'

const players = ref([])
const betRecords = ref([])
const game = reactive({ result: '等待开奖', countdown: 20 })
const selectedResult = ref('庄')

let socket

async function fetchPlayers() {
  const res = await axios.get('/api/players')
  players.value = res.data
}

async function fetchRecords() {
  const res = await axios.get('/api/records')
  betRecords.value = res.data
}

async function fetchGame() {
  const res = await axios.get('/api/game')
  Object.assign(game, res.data)
}

// 保存玩家信息
async function savePlayer(player) {
  await axios.post('/api/player', player)
  await fetchPlayers()
}

// 添加玩家
async function addPlayer() {
  await axios.post('/api/player', { name: 'newPlayer', balance: 10000 })
  await fetchPlayers()
}

// 开奖
async function openResult() {
  await axios.post('/api/admin/open', { result: selectedResult.value })
  await fetchGame()
  await fetchRecords()
}

// 下一轮
async function nextRound() {
  await axios.post('/api/admin/next')
  await fetchGame()
  await fetchRecords()
}

function initSocket() {
  socket = io('/', { path: '/socket.io' })
  socket.on('update', data => {
    if (data.players) players.value = data.players
    if (data.game) Object.assign(game, data.game)
    if (data.betRecords) betRecords.value = data.betRecords
  })
}

onMounted(async () => {
  await fetchPlayers()
  await fetchRecords()
  await fetchGame()
  initSocket()
})
</script>

<style scoped>
.admin-container { padding: 20px; font-family: sans-serif; }
.game-control, .player-management, .records { margin-bottom: 20px; }
table { width: 100%; border-collapse: collapse; }
th, td { border: 1px solid #ccc; padding: 5px; text-align: center; }
input { width: 80px; }
button { margin: 2px; }
</style>
