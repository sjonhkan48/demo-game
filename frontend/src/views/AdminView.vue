<template>
  <div class="admin">
    <h1>后台管理系统</h1>

    <!-- 游戏控制 -->
    <div class="game-box">
      <h2>游戏控制</h2>
      <p>当前状态：{{ status }}</p>
      <p>开奖结果：{{ result }}</p>
      <select v-model="openResult">
        <option value="闲">闲</option>
        <option value="和">和</option>
        <option value="庄">庄</option>
      </select>
      <button @click="openGame">立即开奖</button>
      <button @click="nextRound">下一轮</button>
    </div>

    <!-- 邀请玩家 -->
    <div class="invite">
      <button @click="invite">生成玩家邀请链接</button>
      <div v-if="inviteUrl">
        <p>玩家ID: {{ inviteId }}</p>
        <input :value="inviteUrl" readonly />
      </div>
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
        <tr v-for="p in players" :key="p._id">
          <td>{{ p.playerId }}</td>
          <td><input v-model="p.name" /></td>
          <td><input type="number" v-model.number="p.score" /></td>
          <td>
            <button @click="savePlayer(p)">保存</button>
            <button @click="openLink(p)">玩家链接</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 开奖记录 -->
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
        <tr v-for="r in records" :key="r._id">
          <td>{{ r.playerId }}</td>
          <td>{{ r.area }}</td>
          <td>{{ r.amount }}</td>
          <td>{{ r.result }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const API = "https://demo-game-3.onrender.com";

const players = ref([]);
const records = ref([]);

const openResult = ref("庄");
const result = ref("等待开奖");
const status = ref("下注中");

const inviteUrl = ref("");
const inviteId = ref("");

async function loadPlayers() {
  const res = await axios.get(`${API}/admin/players`);
  players.value = res.data;
}

async function savePlayer(p) {
  await axios.post(`${API}/admin/player/${p.playerId}`, {
    name: p.name,
    score: p.score,
  });
  alert("保存成功");
  loadPlayers();
}

async function invite() {
  const res = await axios.post(`${API}/admin/invite`);
  inviteUrl.value = res.data.url;
  inviteId.value = res.data.playerId;
  loadPlayers();
}

function openLink(p) {

window.open(
`https://demo-game-2.onrender.com/?player=${p.playerId}`
)

}

async function openGame() {
  const res = await axios.post(`${API}/admin/open`, {
    result: openResult.value,
  });
  result.value = res.data.result;
  status.value = "开奖完成";
  loadRecords();
}

async function nextRound() {
  await axios.post(`${API}/admin/next`);
  status.value = "下注中";
  result.value = "等待开奖";
}

async function loadRecords() {
  const res = await axios.get(`${API}/admin/records`);
  records.value = res.data;
}

onMounted(() => {
  loadPlayers();
  loadRecords();
});
</script>

<style scoped>
.admin {
  padding: 20px;
  font-family: "Microsoft YaHei";
}

.game-box,
.invite {
  padding: 15px;
  background: #eee;
  margin-bottom: 20px;
}

button {
  margin: 5px;
  padding: 8px 15px;
  cursor: pointer;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 30px;
}

td,
th {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: center;
}

input {
  width: 120px;
}
</style>
