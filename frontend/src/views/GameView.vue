<template>
  <div class="game-container">
    <div class="balance">
      <span>💰 当前余额: {{ player.balance }}</span>
      <span class="countdown">下注倒计时 {{ countdown }} 秒</span>
    </div>

    <div class="result">
      开奖结果：<span class="highlight">{{ gameResult.result }}</span>
    </div>

    <div class="bet-area">
      <div class="bet-option" v-for="option in options" :key="option.name" :style="{ backgroundColor: option.color }" @click="selectArea(option.name)">
        <span class="option-name">{{ option.name }}</span>
        <span class="option-rate">赔率 {{ option.rate }}</span>
      </div>
    </div>

    <div class="chips">
      <button v-for="chip in chips" :key="chip" @click="selectAmount(chip)">{{ chip }}</button>
      <input type="number" v-model.number="selectedAmount" placeholder="自定义金额" />
    </div>

    <div class="current-bet">
      当前筹码: {{ selectedAmount }} 当前下注: {{ selectedArea || '未选择' }}
      <button @click="placeBet" :disabled="!selectedAmount || !selectedArea">确认下注</button>
    </div>

    <table class="bet-record">
      <thead>
        <tr>
          <th>玩家ID</th>
          <th>区域</th>
          <th>金额</th>
          <th>结果</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="bet in bets" :key="bet._id">
          <td>{{ bet.playerId }}</td>
          <td>{{ bet.area }}</td>
          <td>{{ bet.amount }}</td>
          <td>{{ bet.result }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { io } from "socket.io-client";

const playerId = new URLSearchParams(window.location.search).get("player") || "player1";
const player = ref({ balance: 0 });
const gameResult = ref({ result: "等待开奖", time: 20 });
const countdown = ref(20);
const bets = ref([]);
const selectedArea = ref("");
const selectedAmount = ref(100);

const options = [
  { name: "闲", rate: 1, color: "#1D4E89" },
  { name: "和", rate: 8, color: "#2E7D32" },
  { name: "庄", rate: 0.95, color: "#B71C1C" }
];
const chips = [10, 50, 100, 500, 1000];

const socket = io(import.meta.env.VITE_BACKEND_URL || "https://demo-game-3.onrender.com");

const fetchPlayer = async () => {
  const res = await axios.get(`/api/player/${playerId}`);
  player.value = res.data;
};

const fetchGame = async () => {
  const res = await axios.get(`/api/game`);
  gameResult.value = res.data;
  countdown.value = res.data.time;
};

const fetchBets = async () => {
  const res = await axios.get(`/api/bets/${playerId}`);
  bets.value = res.data;
};

const selectArea = (area) => selectedArea.value = area;
const selectAmount = (amount) => selectedAmount.value = amount;

const placeBet = async () => {
  if (!selectedArea.value || !selectedAmount.value) return;
  const res = await axios.post("/api/bet", {
    playerId,
    area: selectedArea.value,
    amount: selectedAmount.value
  });
  if (res.data.success) {
    player.value.balance = res.data.balance;
    fetchBets();
  } else alert(res.data.message);
};

// --------------------
// Socket.io 实时更新
// --------------------
socket.on("updatePlayer", (p) => {
  if (p.playerId === playerId) player.value = p;
});
socket.on("newBet", (b) => bets.value.unshift(b));
socket.on("updateBets", (list) => bets.value = list);
socket.on("gameResult", (result) => {
  gameResult.value = result;
  countdown.value = result.time;
});

// --------------------
// 倒计时处理
// --------------------
onMounted(() => {
  fetchPlayer();
  fetchGame();
  fetchBets();

  setInterval(() => {
    if (countdown.value > 0) countdown.value -= 1;
  }, 1000);
});
</script>

<style scoped>
.game-container { max-width: 600px; margin: auto; color: #fff; background-color: #123; padding: 20px; border-radius: 10px; }
.balance { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 16px; }
.result { text-align: center; margin: 15px 0; font-size: 20px; }
.highlight { color: yellow; font-weight: bold; }
.bet-area { display: flex; justify-content: space-between; margin-bottom: 15px; border: 2px solid gold; border-radius: 10px; overflow: hidden; }
.bet-option { flex: 1; padding: 30px 0; cursor: pointer; text-align: center; }
.option-name { display: block; font-size: 24px; font-weight: bold; }
.option-rate { display: block; font-size: 14px; margin-top: 10px; }
.chips { margin-bottom: 15px; }
.chips button { margin-right: 5px; width: 50px; height: 50px; border-radius: 50%; border: none; cursor: pointer; }
.current-bet { margin-bottom: 15px; }
.bet-record { width: 100%; border-collapse: collapse; }
.bet-record th, .bet-record td { border: 1px solid #fff; padding: 5px; text-align: center; }
</style>
