<template>
  <div class="admin">
    <h1>后台管理系统</h1>

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

    <div class="invite">
      <button @click="invite">生成玩家邀请链接</button>
      <div v-if="inviteUrl">
        <p>玩家ID: {{ inviteId }}</p>
        <input :value="inviteUrl" readonly />
      </div>
    </div>

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
          <td>{{ r.result==='win'?'赢':'输' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { getPlayers, updatePlayer, getRecords, adminOpen, adminNext, createInvite } from "../services/api";

const players = ref([]);
const records = ref([]);
const openResult = ref("庄");
const result = ref("等待开奖");
const status = ref("下注中");
const inviteUrl = ref("");
const inviteId = ref("");

async function loadPlayers() {
  players.value = await getPlayers();
}
async function loadRecords() {
  records.value = await getRecords();
}
async function savePlayer(p) {
  await updatePlayer(p.playerId, { name: p.name, score: p.score });
  loadPlayers();
}
async function openGame() {
  const res = await adminOpen(openResult.value);
  result.value = res.result;
  status.value = "开奖完成";
  loadRecords();
}
async function nextRound() {
  await adminNext();
  status.value = "下注中";
  result.value = "等待开奖";
  loadRecords();
  loadPlayers();
}
async function invite() {
  const res = await createInvite();
  inviteId.value = res.playerId;
  inviteUrl.value = res.url;
  loadPlayers();
}

function openLink(p) {
  window.open(`/?player=${p.playerId}`);
}

onMounted(() => {
  loadPlayers();
  loadRecords();
});
