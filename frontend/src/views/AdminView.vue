<template>
  <div class="admin-view">
    <h2>后台管理系统</h2>

    <section>
      <h3>游戏控制</h3>
      <div>当前状态：{{ currentResult === "等待开奖" ? "等待开奖" : "开奖完成" }}</div>
      <div>开奖结果：{{ currentResult }}</div>
      <select v-model="selectedResult">
        <option value="闲">闲</option>
        <option value="和">和</option>
        <option value="庄">庄</option>
      </select>
      <button @click="openGame">立即开奖</button>
      <button @click="nextRound">下一轮</button>
    </section>

    <section>
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
          <tr v-for="p in players" :key="p.playerId">
            <td>{{ p.playerId }}</td>
            <td><input v-model="p.name" /></td>
            <td><input type="number" v-model.number="p.score" /></td>
            <td>
              <button @click="updatePlayer(p)">保存</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div>
        <h4>新增玩家</h4>
        <input placeholder="玩家ID" v-model="newPlayerId" />
        <input placeholder="名称" v-model="newPlayerName" />
        <input type="number" placeholder="积分" v-model.number="newPlayerScore" />
        <button @click="addPlayer">新增玩家</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { getPlayers, addPlayerAPI, updatePlayerAPI, adminOpenAPI, adminNextAPI } from "../services/api";

const players = ref([]);
const newPlayerId = ref("");
const newPlayerName = ref("");
const newPlayerScore = ref(10000);
const selectedResult = ref("闲");
const currentResult = ref("等待开奖");

async function loadPlayers() {
  const res = await getPlayers();
  players.value = res;
}

async function addPlayer() {
  if (!newPlayerId.value) return alert("请输入玩家ID");
  await addPlayerAPI({ playerId: newPlayerId.value, name: newPlayerName.value, score: newPlayerScore.value });
  newPlayerId.value = "";
  newPlayerName.value = "";
  newPlayerScore.value = 10000;
  await loadPlayers();
}

async function updatePlayer(p) {
  await updatePlayerAPI({ playerId: p.playerId, name: p.name, score: p.score });
  await loadPlayers();
}

async function openGame() {
  await adminOpenAPI(selectedResult.value);
  currentResult.value = selectedResult.value;
}

async function nextRound() {
  await adminNextAPI();
  currentResult.value = "等待开奖";
  await loadPlayers();
}

onMounted(() => {
  loadPlayers();
});
</script>

<style scoped>
.admin-view { padding: 20px; font-family: "Microsoft YaHei"; }
table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
td, th { border: 1px solid #ccc; padding: 8px; text-align: center; }
input { width: 100px; }
button { margin: 5px; padding: 5px 10px; }
section { margin-bottom: 25px; }
</style>
