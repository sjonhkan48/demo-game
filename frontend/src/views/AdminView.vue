<template>
  <div class="admin-container">
    <h2>玩家管理</h2>
    <table>
      <thead>
        <tr>
          <th>玩家ID</th>
          <th>名字</th>
          <th>余额</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in players" :key="p.playerId">
          <td>{{ p.playerId }}</td>
          <td><input v-model="p.name" /></td>
          <td><input v-model.number="p.balance" /></td>
          <td>
            <button @click="updatePlayer(p)">保存</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="controls">
      <button @click="openGame">开奖</button>
      <button @click="nextRound">下一轮</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const players = ref([]);

async function loadPlayers() {
  const res = await axios.get("/api/players");
  if (Array.isArray(res.data)) players.value = res.data;
}

async function updatePlayer(p) {
  await axios.post("/admin/update-player", {
    playerId: p.playerId,
    name: String(p.name),
    balance: Number(p.balance),
  });
  alert("修改成功");
}

async function openGame() {
  await axios.post("/admin/open", {});
  alert("已开奖");
}

async function nextRound() {
  await axios.post("/admin/next", {});
  alert("下一轮开始");
}

onMounted(() => {
  loadPlayers();
});
</script>

<style scoped>
.admin-container {
  padding: 20px;
  font-family: "Microsoft YaHei";
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}
th, td {
  border: 1px solid #777;
  padding: 8px;
  text-align: center;
}
.controls button {
  margin-right: 10px;
  padding: 5px 15px;
}
</style>
