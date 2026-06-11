<template>
<div class="admin">
  <h2>玩家管理</h2>
  <table>
    <tr>
      <th>ID</th>
      <th>名称</th>
      <th>余额</th>
      <th>保存</th>
      <th>玩家链接</th>
      <th>状态</th>
      <th>开奖设置</th>
      <th>下一轮</th>
    </tr>
    <tr v-for="p in players" :key="p.id">
      <td>{{p.id}}</td>
      <td><input v-model="p.name"/></td>
      <td><input type="number" v-model.number="p.balance"/></td>
      <td><button @click="save(p)">保存</button></td>
      <td><a :href="getUrl(p.id)" target="_blank">进入</a></td>
      <td>{{p.status}}</td>
      <td>
        <button @click="open('闲')">闲</button>
        <button @click="open('和')">和</button>
        <button @click="open('庄')">庄</button>
      </td>
      <td><button @click="next()">开始下一轮</button></td>
    </tr>
  </table>

  <h2>开奖记录</h2>
  <input placeholder="筛选玩家ID" v-model="filter"/>
  <table>
    <tr>
      <th>ID</th>
      <th>玩家</th>
      <th>区域</th>
      <th>金额</th>
      <th>结果</th>
    </tr>
    <tr v-for="r in filterRecords" :key="r.id">
      <td>{{r.id}}</td>
      <td>{{r.playerId}}</td>
      <td>{{r.option}}</td>
      <td>{{r.amount}}</td>
      <td>{{r.result}}</td>
    </tr>
  </table>
</div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { io } from "socket.io-client";

const players = ref([]);
const records = ref([]);
const filter = ref("");
let socket;

async function load() {
  players.value = (await axios.get("http://localhost:3000/api/players")).data;
  records.value = (await axios.get("http://localhost:3000/api/records")).data;
}

async function save(p){
  await axios.post("http://localhost:3000/admin/update-player", {
    id: p.id,
    name: p.name,
    balance: p.balance
  });
  alert("保存成功");
}

async function open(option){
  await axios.post("http://localhost:3000/admin/open", { result: option });
}

async function next(){
  await axios.post("http://localhost:3000/admin/next");
}

function getUrl(id){
  return "/room/"+id;
}

const filterRecords = computed(() => {
  return records.value.filter(r => r.playerId.includes(filter.value));
});

onMounted(() => {
  load();
  socket = io("http://localhost:3000");
  socket.on("update", (data) => {
    players.value = data.players;
    records.value = data.records;
  });
});
</script>

<style scoped>
.admin{padding:30px;}
table{width:100%;border-collapse:collapse;margin-bottom:30px;}
td,th{border:1px solid #ccc;padding:10px;text-align:center;}
button{padding:6px 12px;margin:2px;}
input{width:80px;}
</style>
