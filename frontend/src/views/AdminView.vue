<template>
  <div class="admin-container">
    <h2>玩家管理</h2>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>名称</th>
          <th>余额</th>
          <th>操作</th>
          <th>当前状态</th>
          <th>开奖设置</th>
          <th>下一轮</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="player in players" :key="player.id">
          <td>{{ player.id }}</td>
          <td><input v-model="player.name" /></td>
          <td><input type="number" v-model.number="player.balance" /></td>
          <td><button @click="savePlayer(player)">保存</button></td>
          <td>{{ player.status }}</td>
          <td>
            <button @click="openResult(player, '闲')">闲</button>
            <button @click="openResult(player, '和')">和</button>
            <button @click="openResult(player, '庄')">庄</button>
          </td>
          <td><button @click="nextRound(player)">开始下一轮</button></td>
        </tr>
      </tbody>
    </table>

    <h2>开奖记录</h2>
    <table>
      <thead>
        <tr>
          <th>玩家ID</th>
          <th>选项</th>
          <th>金额</th>
          <th>结果</th>
          <th>时间</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="record in records" :key="record._id">
          <td>{{ record.playerId }}</td>
          <td>{{ record.option }}</td>
          <td>{{ record.amount }}</td>
          <td>{{ record.result }}</td>
          <td>{{ new Date(record.createdAt).toLocaleString() }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "AdminView",
  data() {
    return {
      players: [],
      records: [],
      apiBase: "https://demo-game-3.onrender.com", // 修改为你后端地址
    };
  },
  methods: {
    async fetchPlayers() {
      const res = await axios.get(`${this.apiBase}/api/players`);
      this.players = res.data;
    },
    async fetchRecords() {
      const res = await axios.get(`${this.apiBase}/api/records`);
      this.records = res.data;
    },
    async savePlayer(player) {
      await axios.post(`${this.apiBase}/admin/update-player`, player);
      this.fetchPlayers();
    },
    async openResult(player, result) {
      await axios.post(`${this.apiBase}/admin/open`, { result });
      this.fetchPlayers();
      this.fetchRecords();
    },
    async nextRound(player) {
      await axios.post(`${this.apiBase}/admin/next`);
      this.fetchPlayers();
      this.fetchRecords();
    },
  },
  mounted() {
    this.fetchPlayers();
    this.fetchRecords();
  },
};
</script>

<style>
.admin-container {
  padding: 20px;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 30px;
}
th, td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: center;
}
button {
  margin: 2px;
  padding: 4px 8px;
}
</style>
