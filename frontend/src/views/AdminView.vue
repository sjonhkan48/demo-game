<template>
  <div class="admin-container">
    <h2>后台管理系统</h2>

    <section class="game-control">
      <h3>游戏控制</h3>
      <p>当前状态：{{ game.result }}</p>
      <div>
        <button @click="openGame('庄')">庄</button>
        <button @click="openGame('和')">和</button>
        <button @click="openGame('闲')">闲</button>
      </div>
      <button @click="nextRound">下一轮</button>
    </section>

    <section class="player-management">
      <h3>玩家管理</h3>
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
            <td><input v-model="player.name"/></td>
            <td><input type="number" v-model.number="player.balance"/></td>
            <td>
              <button @click="updatePlayer(player)">保存</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { io } from 'socket.io-client'

const players = ref([])
const game = reactive({ result: '等待开奖' })
let socket

async function fetchPlayers() {
  const res = await axios.get('/api/players')
  players.value = res.data
}

function initSocket() {
  socket = io('/', { path: '/socket.io' })
  socket.on('update', data => {
    if (data.players) players.value = data.players
    if (data.game) Object.assign(game, data.game)
  })
}

async function updatePlayer(player) {
  await axios.post('/admin/update-player', player)
}

async function openGame(result) {
  await axios.post('/admin/open', { result })
}

async function nextRound() {
  await axios.post('/admin/next')
}

onMounted(() => {
  fetchPlayers()
  initSocket()
})
</script>

<style scoped>
.admin-container {
  padding: 20px;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  border: 1px solid #000;
  padding: 5px;
  text-align: center;
}
button {
  margin: 5px;
}
</style>
