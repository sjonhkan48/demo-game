<template>
  <div class="admin-container">
    <h2>后台管理</h2>

    <div class="player-section">
      <h3>玩家管理</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>姓名</th>
            <th>余额</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in players" :key="p.id">
            <td>{{ p.id }}</td>
            <td><input v-model="p.name" /></td>
            <td><input v-model.number="p.balance" /></td>
            <td>
              <button @click="updatePlayer(p)">保存</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="add-player">
        <input v-model="newPlayerId" placeholder="玩家ID" />
        <input v-model="newPlayerName" placeholder="玩家姓名" />
        <input v-model.number="newPlayerBalance" placeholder="余额" />
        <button @click="addPlayer">添加玩家</button>
      </div>
    </div>

    <div class="game-section">
      <h3>游戏操作</h3>
      <div class="game-actions">
        <input v-model="openResult" placeholder="开奖结果" />
        <button @click="openGame">开奖</button>
        <button @click="nextRound">下一轮</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const players = ref([]);
const newPlayerId = ref('');
const newPlayerName = ref('');
const newPlayerBalance = ref(0);

const openResult = ref('');

async function fetchPlayers() {
  const res = await axios.get('http://localhost:3000/api/players');
  players.value = res.data;
}

async function updatePlayer(p) {
  await axios.post('http://localhost:3000/admin/update-player', {
    id: p.id,
    name: p.name,
    balance: p.balance
  });
  await fetchPlayers();
}

async function addPlayer() {
  if (!newPlayerId.value) return;
  await axios.post('http://localhost:3000/admin/update-player', {
    id: newPlayerId.value,
    name: newPlayerName.value,
    balance: newPlayerBalance.value
  });
  newPlayerId.value = '';
  newPlayerName.value = '';
  newPlayerBalance.value = 0;
  await fetchPlayers();
}

async function openGame() {
  if (!openResult.value) return;
  await axios.post('http://localhost:3000/admin/open', {
    result: openResult.value
  });
  openResult.value = '';
}

async function nextRound() {
  await axios.post('http://localhost:3000/admin/next');
}

onMounted(() => {
  fetchPlayers();
});
</script>

<style scoped>
.admin-container {
  padding: 20px;
  background-color: #0f2d17;
  color: #fff;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 10px;
}
th, td {
  border: 1px solid #fff;
  padding: 5px;
  text-align: center;
}
input {
  width: 80px;
}
button {
  margin: 2px;
  padding: 5px 10px;
}
.add-player input {
  margin-right: 5px;
}
.game-actions input {
  width: 120px;
  margin-right: 5px;
}
</style>
