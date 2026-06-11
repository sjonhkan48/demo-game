<template>
  <div>
    <h2>后台管理系统</h2>

    <div class="game-control">
      <p>当前状态：{{ game.status }}</p>
      <p>开奖结果：{{ game.result }}</p>
      <select v-model="selectedOption">
        <option>闲</option>
        <option>和</option>
        <option>庄</option>
      </select>
      <button @click="openGame">立即开奖</button>
      <button @click="nextRound">下一轮</button>
    </div>

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
          <td><input v-model="player.name" /></td>
          <td><input type="number" v-model.number="player.balance" /></td>
          <td>
            <button @click="updatePlayer(player)">保存</button>
          </td>
        </tr>
      </tbody>
    </table>

    <h3>开奖记录</h3>
    <table>
      <thead>
        <tr>
          <th>玩家</th>
          <th>下注</th>
          <th>金额</th>
          <th>结果</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in betRecords" :key="r.id">
          <td>{{ r.playerId }}</td>
          <td>{{ r.option }}</td>
          <td>{{ r.amount }}</td>
          <td>{{ r.result || '等待开奖' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { io } from 'socket.io-client'

const players = ref([])
const betRecords = ref([])
const game = reactive({ status: '等待开奖', result: '等待开奖' })
const selectedOption = ref('闲')
let socket

function fetchPlayers() {
  players.value = [] // 数据由 socket 推送
}

function updatePlayer(player) {
  axios.post('/admin/update-player', player)
    .then(res => alert('更新成功'))
    .catch(err => console.error(err))
}

function openGame() {
  axios.post('/admin/open').catch(err => console.error(err))
}

function nextRound() {
  axios.post('/admin/next').catch(err => console.error(err))
}

onMounted(() => {
  socket = io('/')
  socket.on('update', data => {
    players.value = data.players
    betRecords.value = data.betRecords
    Object.assign(game, data.game)
  })
})
</script>

<style scoped>
table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
th, td { border: 1px solid #000; padding: 5px; text-align: center; }
input { width: 80px; }
button { margin-right: 5px; }
</style>
