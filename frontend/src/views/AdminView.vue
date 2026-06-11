<template>
  <div class="admin-container">
    <h1>后台管理系统</h1>

    <!-- 游戏控制 -->
    <div class="game-control">
      <p>当前状态: {{ game.status }}</p>
      <p>开奖结果: {{ game.result || '等待开奖' }}</p>
      <select v-model="selectedOption">
        <option>庄</option>
        <option>闲</option>
        <option>和</option>
      </select>
      <button @click="openGame">立即开奖</button>
      <button @click="nextRound">下一轮</button>
    </div>

    <!-- 玩家管理 -->
    <h2>玩家管理</h2>
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
            <button @click="savePlayer(player)">保存</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 投注记录 -->
    <h2>开奖记录</h2>
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
        <tr v-for="record in betRecords" :key="record.id">
          <td>{{ record.playerId }}</td>
          <td>{{ record.option }}</td>
          <td>{{ record.amount }}</td>
          <td>{{ record.result }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'

const players = ref([])
const betRecords = ref([])
const game = reactive({ status: '', result: null })
const selectedOption = ref('庄')

async function fetchData() {
  try {
    const [playersRes, recordsRes, gameRes] = await Promise.all([
      axios.get('/api/players'),
      axios.get('/api/records'),
      axios.get('/api/game')
    ])
    players.value = playersRes.data
    betRecords.value = recordsRes.data
    Object.assign(game, gameRes.data)
  } catch (err) {
    console.error(err)
  }
}

async function savePlayer(player) {
  try {
    await axios.post('/admin/update-player', {
      id: player.id,
      name: player.name,
      balance: player.balance
    })
    fetchData()
  } catch (err) {
    console.error(err)
  }
}

async function openGame() {
  try {
    await axios.post('/admin/open', { result: selectedOption.value })
    fetchData()
  } catch (err) {
    console.error(err)
  }
}

async function nextRound() {
  try {
    await axios.post('/admin/next')
    fetchData()
  } catch (err) {
    console.error(err)
  }
}

onMounted(fetchData)
</script>

<style scoped>
.admin-container {
  padding: 20px;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}
table th, table td {
  border: 1px solid #000;
  padding: 5px;
  text-align: center;
}
.game-control {
  padding: 10px;
  margin-bottom: 20px;
  background-color: #eee;
}
</style>
