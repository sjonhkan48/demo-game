<template>
  <div class="game-view">
    <div class="header">
      <div class="balance">💰 当前余额：{{ balance }}</div>
      <div class="countdown" :class="{ stop: locked }">
        {{ locked ? "停止下注" : "下注倒计时 " + countdown + " 秒" }}
      </div>
    </div>

    <div class="result-box">开奖结果：<span>{{ result }}</span></div>

    <div class="board">
      <div v-for="area in areas" :key="area.name" class="area" :class="area.color" @click="selectArea(area)">
        <div class="name">{{ area.label }}</div>
        <div class="odds">赔率 {{ area.odds }}</div>
      </div>
    </div>

    <div class="chips">
      <div v-for="chip in chips" :key="chip.value" class="chip" :class="chip.color" @click="selectedChip = chip.value">{{ chip.value }}</div>
      <input type="number" min="1" v-model.number="selectedChip" placeholder="自定义下注金额" />
    </div>

    <div class="selected">
      当前筹码：{{ selectedChip }}<br />
      当前下注：{{ selectedArea ? selectedArea.label : "未选择" }}<br />
      <button @click="placeBet" :disabled="locked || !selectedArea">确认下注</button>
    </div>

    <div class="records">
      <h3>投注记录</h3>
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
          <tr v-for="b in bets" :key="b._id">
            <td>{{ b.playerId }}</td>
            <td>{{ b.area }}</td>
            <td>{{ b.amount }}</td>
            <td>
              <span v-if="b.result==='pending'">等待开奖</span>
              <span v-if="b.result==='win'" class="win">赢</span>
              <span v-if="b.result==='lose'" class="lose">输</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import axios from "axios";

const API_URL = "https://demo-game-3.onrender.com";
const params = new URLSearchParams(window.location.search);
const playerId = params.get("player") || "player1";

const balance = ref(0);
const countdown = ref(20);
const locked = ref(false);
const result = ref("等待开奖");
const bets = ref([]);
const selectedArea = ref(null);
const selectedChip = ref(100);

const areas = [
  { name: "xian", label: "闲", color: "blue", odds: 1 },
  { name: "he", label: "和", color: "green", odds: 8 },
  { name: "zhuang", label: "庄", color: "red", odds: 0.95 },
];

const chips = [
  { value: 10, color: "red" },
  { value: 50, color: "blue" },
  { value: 100, color: "green" },
  { value: 500, color: "purple" },
  { value: 1000, color: "black" },
];

async function loadBalance() {
  const res = await axios.get(`${API_URL}/api/score/${playerId}`);
  balance.value = res.data.score;
}

async function loadBets() {
  const res = await axios.get(`${API_URL}/api/bets/${playerId}`);
  bets.value = res.data;
}

async function checkResult() {
  const res = await axios.get(`${API_URL}/api/result`);
  result.value = res.data.result;
  if (res.data.bettingOpen) {
    if (locked.value) countdown.value = 20;
    locked.value = false;
  } else locked.value = true;

  if (res.data.result !== "等待开奖") {
    await loadBalance();
    await loadBets();
  }
}

function selectArea(area) {
  if (!locked.value) selectedArea.value = area;
}

async function placeBet() {
  if (!selectedArea.value || !selectedChip.value || selectedChip.value <= 0) {
    alert("请选择下注区域或输入有效金额");
    return;
  }

  const res = await axios.post(`${API_URL}/api/bet`, {
    playerId,
    area: selectedArea.value.label,
    amount: Number(selectedChip.value),
  });

  if (res.data.success) {
    balance.value = res.data.score;
    await loadBets();
    selectedArea.value = null;
    alert("下注成功");
  } else {
    alert(res.data.message);
  }
}

let timer;
function startTimer() {
  countdown.value = 20;
  locked.value = false;
  timer = setInterval(() => {
    if (!locked.value) {
      countdown.value--;
      if (countdown.value <= 0) locked.value = true;
    }
  }, 1000);
}

let resultTimer;
onMounted(async () => {
  await loadBalance();
  await loadBets();
  await checkResult();
  startTimer();
  resultTimer = setInterval(checkResult, 3000);
});

onUnmounted(() => {
  clearInterval(timer);
  clearInterval(resultTimer);
});
</script>

<style scoped>
/* 原绿色赌场 UI 风格保持不变 */
.game-view {
  padding: 15px;
  font-family: "Microsoft YaHei";
  min-height: 100vh;
  background: linear-gradient(#07351f, #02160d);
  color: #fff;
}

.header {
  display: flex;
  justify-content: space-between;
  font-size: 22px;
  margin-bottom: 20px;
}

.balance {
  color: #ffd700;
}

.countdown.stop {
  color: red;
}

.result-box {
  text-align: center;
  font-size: 26px;
  margin-bottom: 20px;
}

.result-box span {
  color: #ffd700;
  font-size: 35px;
}

.board {
  display: flex;
  height: 230px;
  border: 5px solid #c99b27;
  border-radius: 25px;
  overflow: hidden;
  margin-bottom: 20px;
}

.area {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.area.blue { background: #063b8f; }
.area.green { background: #16834b; }
.area.red { background: #9b1212; }

.name { font-size: 55px; font-weight: bold; }
.odds { font-size: 18px; }

.chips {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.chip {
  width: 65px;
  height: 65px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 5px dashed white;
  font-weight: bold;
  cursor: pointer;
}

.chip.red { background: #d11; }
.chip.blue { background: #1769aa; }
.chip.green { background: #1b8d35; }
.chip.purple { background: #7020a0; }
.chip.black { background: #111; }

input[type="number"] {
  width: 80px;
  margin-left: 10px;
  padding: 5px;
  border-radius: 5px;
  border: 1px solid #ccc;
}

.selected { text-align: center; font-size: 20px; margin-bottom: 20px; }

.records table { width: 100%; border-collapse: collapse; }
.records td, .records th { border: 1px solid #777; padding: 8px; text-align: center; }
.win { color: #00ff88; }
.lose { color: red; }

@media (max-width: 600px) {
  .name { font-size: 40px; }
  .board { height: 180px; }
  .header { font-size: 16px; }
  .chip { width: 55px; height: 55px; }
  input[type="number"] { width: 60px; }
}
</style>
