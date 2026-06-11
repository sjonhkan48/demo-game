<template>
  <div class="admin-container">
    <h2>后台管理系统</h2>

    <div class="game-control">
      <h3>游戏控制</h3>
      <p>当前状态: {{ game.status }}</p>
      <p>开奖结果: {{ game.result }}</p>
      <select v-model="selectedOption">
        <option value="闲">闲</option>
        <option value="和">和</option>
        <option value="庄">庄</option>
      </select>
      <button @click="openGame">立即开奖</button>
      <button @click="nextRound">下一轮</button>
    </div>

    <div class="player-management">
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
    </div>

    <div class="bet-records">
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
          <tr v-for="record in records" :key="record.id">
            <td>{{ record.playerId }}</td>
            <td>{{ record.option }}</td>
            <td>{{ record.amount }}</td>
            <td>{{ record.result }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import axios from "axios";
import { io } from "socket.io-client";

const players = ref([]);
const records = ref([]);
const game = reactive({ status: "", result: "" });
const selectedOption = ref("闲");

let socket;

function fetchPlayers() {
  axios.get("/api/players").then((res) => (players.value = res.data));
}

function fetchRecords() {
  axios.get("/api/records").then((res) => (records.value = res.data));
}

function fetchGame() {
  axios.get("/api/game").then((res) => Object.assign(game, res.data));
}

function updatePlayer(player) {
  axios.post("/admin/update-player", player).then(() => fetchPlayers());
}

function openGame() {
  axios
    .post("/admin/open", { result: selectedOption.value })
    .then(() => fetchRecords());
}

function nextRound() {
  axios.post("/admin/next").then(() => {
    fetchGame();
    fetchRecords();
  });
}

function initSocket() {
  socket = io("/", { path: "/socket.io" });
  socket.on("update", (data) => {
    players.value = data.players;
    records.value = data.records;
    Object.assign(game, data.game);
  });
}

onMounted(() => {
  fetchPlayers();
  fetchRecords();
  fetchGame();
  initSocket();
});
</script>

<style scoped>
.admin-container {
  padding: 20px;
  font-family: Arial, sans-serif;
}
table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 20px;
}
th, td {
  border: 1px solid #000;
  padding: 5px 10px;
  text-align: center;
}
button {
  margin: 0 5px;
}
.game-control, .player-management, .bet-records {
  margin-bottom: 20px;
}
</style>
