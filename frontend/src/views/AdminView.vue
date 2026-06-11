<template>
  <div class="admin-container">
    <h2>后台管理系统</h2>

    <div class="player-list">
      <h3>玩家管理</h3>
      <table>
        <thead>
          <tr>
            <th>玩家ID</th>
            <th>玩家名</th>
            <th>余额</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="player in players" :key="player.id">
            <td>{{ player.id }}</td>
            <td><input v-model="player.name" /></td>
            <td><input v-model.number="player.balance" type="number" /></td>
            <td><button @click="updatePlayer(player)">保存</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="game-control">
      <h3>开奖控制</h3>
      <div>
        <label>开奖结果:</label>
        <select v-model="selectedResult">
          <option>闲</option>
          <option>和</option>
          <option>庄</option>
        </select>
        <button @click="openResult">开奖</button>
        <button @click="nextRound">下一轮</button>
      </div>
    </div>

    <div class="records">
      <h3>下注记录</h3>
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
import { ref, onMounted } from "vue";
import axios from "axios";
import { io } from "socket.io-client";

const players = ref([]);
const records = ref([]);
const selectedResult = ref("闲");

let socket;

async function fetchPlayers() {
  const res = await axios.get("/api/players");
  players.value = res.data;
}

async function fetchRecords() {
  const res = await axios.get("/api/records");
  records.value = res.data;
}

async function updatePlayer(player) {
  await axios.post("/admin/update-player", {
    id: player.id,
    name: player.name,
    balance: player.balance
  });
}

async function openResult() {
  await axios.post("/admin/open", { result: selectedResult.value });
}

async function nextRound() {
  await axios.post("/admin/next");
}

function initSocket() {
  socket = io("/", { path: "/socket.io" });
  socket.on("connect", () => console.log("Socket connected"));
  socket.on("update", data => {
    if (data.players) players.value = data.players;
    if (data.records) records.value = data.records;
  });
}

onMounted(() => {
  fetchPlayers();
  fetchRecords();
  initSocket();
});
</script>

<style scoped>
.admin-container {
  padding: 20px;
  background: #0f2d17;
  color: #fff;
  font-family: "Microsoft YaHei";
}

h2, h3 { color: #ffd700; }

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}
table th, table td {
  border: 1px solid #fff;
  padding: 8px;
  text-align: center;
}
input[type="text"], input[type="number"], select {
  width: 80px;
  padding: 5px;
}
button {
  margin-left: 5px;
  padding: 5px 10px;
  cursor: pointer;
}
</style>
