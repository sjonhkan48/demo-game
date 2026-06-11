<template>
  <div class="admin-container">
    <h1>后台管理系统</h1>

    <!-- 游戏控制 -->
    <div class="game-control">
      <p>当前状态：{{ game.status || '等待开奖' }}</p>
      <p>开奖结果：{{ game.result }}</p>
      <select v-model="selectedOption">
        <option v-for="option in options" :key="option">{{ option }}</option>
      </select>
      <button @click="openGame">立即开奖</button>
      <button @click="nextRound">下一轮</button>
    </div>

    <!-- 玩家管理 -->
    <div class="player-control">
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
          <tr v-for="p in players" :key="p.id">
            <td>{{ p.id }}</td>
            <td>
              <input
                :value="p.name"
                @input="p.name = $event.target.value"
              />
            </td>
            <td>
              <input
                type="number"
                :value="p.balance"
                @input="p.balance = Number($event.target.value)"
              />
            </td>
            <td><button @click="updatePlayer(p)">保存</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 投注记录 -->
    <div class="records">
      <h2>投注记录</h2>
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
          <tr v-for="r in records" :key="r.id">
            <td>{{ r.playerId }}</td>
            <td>{{ r.option }}</td>
            <td>{{ r.amount }}</td>
            <td>{{ r.result }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'

const players = ref([])
const records = ref([])
const game = reactive({ result: '等待开奖', status: '下注中' })
const options = ['闲','和','庄']
const selectedOption = ref('闲')

// 获取玩家和投注记录
async function loadData() {
  const p = await axios.get('/api/players')
  players.value = p.data
  const r = await axios.get('/api/records')
  records.value = r.data
}

// 添加玩家
async function addPlayer() {
  const newPlayer = { id: `player${Date.now()}`, name: 'player', balance: 10000 }
  players.value.push(newPlayer)
}

// 更新玩家
async function updatePlayer(p) {
  await axios.post('/admin/update-player', {
    id: p.id,
    name: p.name,
    balance: p.balance
  })
  await loadData()
}

// 开奖
async function openGame() {
  const res = await axios.post('/admin/open', { option: selectedOption.value })
  game.result = res.data.result
  game.status = '开奖'
  await loadData()
}

// 下一轮
async function nextRound() {
  await axios.post('/admin/next')
  game.result = '等待开奖'
  game.status = '下注中'
  await loadData()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.admin-container {
  padding: 20px;
}
.game-control, .player-control, .records {
  margin-bottom: 20px;
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
</style>
