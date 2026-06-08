<template>
  <div class="page">

    <!-- 顶部栏 -->
    <div class="top-bar">
      <div class="balance-box">
        <span class="icon">💰</span>
        当前余额：{{ balance.toLocaleString() }}
      </div>
      <div class="timer-box" :class="{ danger: countdown <= 5 }">
        <span class="icon">⏱</span>
        下注倒计时 {{ countdown }} 秒
      </div>
    </div>

    <!-- 下注区域 -->
    <div class="bet-board">

      <div class="bet-area player" @click="placeBet('player')">
        <div class="title">闲</div>
        <div class="rate">1:1</div>
        <div class="drop-zone">
          <div class="zone-text">下注区</div>
          <div class="money">{{ bets.player }}</div>
        </div>
      </div>

      <div class="bet-area tie" @click="placeBet('tie')">
        <div class="title">和</div>
        <div class="rate">1:8</div>
        <div class="drop-zone">
          <div class="zone-text">下注区</div>
          <div class="money">{{ bets.tie }}</div>
        </div>
      </div>

      <div class="bet-area banker" @click="placeBet('banker')">
        <div class="title">庄</div>
        <div class="rate">1:0.95</div>
        <div class="drop-zone">
          <div class="zone-text">下注区</div>
          <div class="money">{{ bets.banker }}</div>
        </div>
      </div>

    </div>

    <!-- 当前下注 -->
    <div class="current-bet">
      当前下注：闲 {{ bets.player }} | 和 {{ bets.tie }} | 庄 {{ bets.banker }}
    </div>

    <!-- 筹码选择 -->
    <div class="chip-panel">
      <button
        v-for="chip in chips"
        :key="chip"
        @click="selectChip(chip)"
        :class="'chip-' + chip"
      >
        <span>{{ chip }}</span>
      </button>

      <input
        type="number"
        v-model.number="customChip"
        class="chip-input"
        placeholder="自定义筹码"
      />

      <button class="chip-add" @click="addCustomChip">添加</button>
    </div>

    <!-- 当前筹码 -->
    <div class="selected-chip">
      当前筹码：{{ selectedChip }}
    </div>

    <!-- 本局结果 -->
    <div v-if="result" class="result-box">
      🎉 本局结果：{{ resultText }}
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

// 玩家与接口地址
const PLAYER_ID = 'player1'
const API_URL = "https://demo-game-3.onrender.com"

// 游戏状态
const balance = ref(0)
const countdown = ref(24)
const locked = ref(false)
const selectedChip = ref(10)
const customChip = ref(0)
const chips = [10,100,500,1000,5000,10000,50000]
const bets = ref({ player:0, tie:0, banker:0 })
const result = ref('')

// 显示结果文字
const resultText = computed(() => {
  if(result.value==='player') return '闲赢'
  if(result.value==='tie') return '和赢'
  if(result.value==='banker') return '庄赢'
  return ''
})

// ---- 后台接口 ----
async function fetchScore() {
  try {
    const res = await axios.get(`${API_URL}/api/score/${PLAYER_ID}`)
    balance.value = res.data.score
  } catch(err) { console.error(err) }
}

async function updateScore(delta) {
  try {
    await axios.post(`${API_URL}/api/score/${PLAYER_ID}`, { delta })
  } catch(err) { console.error(err) }
}

// ---- 筹码选择 ----
function selectChip(chip){ selectedChip.value = chip }
function addCustomChip(){ if(customChip.value>0) selectedChip.value = customChip.value }

// ---- 投注 ----
async function placeBet(type){
  if(locked.value) return
  if(balance.value < selectedChip.value) return

  bets.value[type] += selectedChip.value
  balance.value -= selectedChip.value

  await updateScore(-selectedChip.value)
}

// ---- 倒计时 ----
function startCountdown(){
  countdown.value = 24
  locked.value = false

  const timer = setInterval(()=>{
    countdown.value--
    if(countdown.value <= 0){
      clearInterval(timer)
      locked.value = true
      settleRound()
    }
  },1000)
}

// ---- 模拟开奖 ----
async function settleRound(){
  const outcomes = ['player','tie','banker']
  const winner = outcomes[Math.floor(Math.random()*3)]
  result.value = winner

  let reward = 0
  if(winner==='player') reward = bets.value.player*2
  if(winner==='tie') reward = bets.value.tie*9
  if(winner==='banker') reward = bets.value.banker*1.95

  balance.value += reward
  await updateScore(reward)

  setTimeout(()=>{
    bets.value = { player:0, tie:0, banker:0 }
    result.value = ''
    startCountdown()
  },5000)
}

// ---- 初始化 ----
onMounted(async ()=>{
  await fetchScore()
  startCountdown()
})
</script>

<style scoped>
body{ margin:0;}
.page{
  min-height:100vh;
  background:#021d17;
  color:white;
  padding:20px;
  font-family:"Microsoft YaHei", sans-serif;
}

/* 顶部栏 */
.top-bar{
  display:flex;
  justify-content:space-between;
  margin-bottom:20px;
}
.balance-box, .timer-box{
  font-size:28px;
  color:#ffcc00;
  padding:12px 20px;
  border:2px solid #ffcc00;
  border-radius:12px;
  box-shadow:0 0 15px rgba(255,204,0,.6);
}
.timer-box.danger{
  color:#ff3333;
  animation: flash .6s infinite;
}

/* 下注区 */
.bet-board{
  display:flex;
  border:8px solid #d4a017;
  border-radius:35px;
  overflow:hidden;
  height:500px;
  box-shadow:0 0 20px rgba(255,215,0,.4), inset 0 0 20px rgba(255,215,0,.2);
}
.bet-area{
  flex:1;
  text-align:center;
  cursor:pointer;
  padding-top:40px;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:flex-start;
  transition:.2s;
}
.bet-area:hover{ filter:brightness(1.15); }
.player{ background:#003a7a; }
.tie{ background:#014f1b; }
.banker{ background:#8b0000; }
.title{
  font-size:120px;
  font-weight:bold;
  line-height:1;
  text-shadow:0 0 20px #fff,0 0 40px rgba(255,255,255,.2);
  margin-bottom:10px;
}
.rate{
  font-size:32px;
  padding:6px 12px;
  border-radius:12px;
  border:2px solid rgba(255,255,255,.3);
  margin-bottom:15px;
}
.drop-zone{
  width:80%;
  height:220px;
  border:3px dashed rgba(255,255,255,.35);
  border-radius:25px;
  display:flex;
  flex-direction:column;
  justify-content:center;
  align-items:center;
}
.zone-text{
  font-size:52px;
  font-weight:700;
  color:white;
}
.money{
  margin-top:30px;
  font-size:72px;
  font-weight:900;
  color:#ffe36b;
  line-height:1;
}

/* 当前下注 */
.current-bet{ text-align:center; margin-top:20px; font-size:26px; }

/* 筹码选择 */
.chip-panel{
  display:flex;
  justify-content:center;
  gap:12px;
  align-items:center;
  flex-wrap:wrap;
  margin-top:25px;
}
.chip-panel button{
  width:90px;
  height:90px;
  border-radius:50%;
  font-size:24px;
  font-weight:bold;
  border:none;
  cursor:pointer;
  box-shadow:0 0 12px rgba(0,0,0,.6);
  position:relative;
  display:flex;
  align-items:center;
  justify-content:center;
}
.chip-panel button span{
  position:relative;
  z-index:1;
}

/* 筹码颜色 */
.chip-10{ background:#d32f2f; color:#fff; }
.chip-100{ background:#388e3c; color:#fff; }
.chip-500{ background:#1976d2; color:#fff; }
.chip-1000{ background:#0d47a1; color:#fff; }
.chip-5000{ background:#000; color:#fff; }
.chip-10000{ background:#7b1fa2; color:#fff; }
.chip-50000{ background:#fbc02d; color:#000; }

/* 添加按钮 */
.chip-add{
  width:100px;
  height:100px;
  border-radius:50%;
  background:radial-gradient(circle at 30% 30%, #fff7a0,#ffd700 35%,#d6a500 75%,#8f6a00);
  color:#000;
  font-size:28px;
  font-weight:900;
  box-shadow:0 0 15px rgba(255,215,0,.8), inset 0 2px 10px rgba(255,255,255,.5);
}

/* 输入框样式 */
.chip-input{
  width:120px;
  height:60px;
  font-size:22px;
  border-radius:10px;
  text-align:center;
  border:2px solid #ffcc00;
  margin:0 10px;
}

/* 当前筹码显示 */
.selected-chip{ text-align:center; margin-top:20px; font-size:24px; }

/* 结果显示 */
.result-box{ text-align:center; margin-top:30px; font-size:40px; color:#ffcc00; }

/* 闪烁动画 */
@keyframes flash{0%{opacity:1;}50%{opacity:.4;}100%{opacity:1;}}
  /* 手机适配 */
@media (max-width: 768px){

  .page{
    padding:10px;
  }

  .top-bar{
    flex-direction:column;
    gap:10px;
  }

  .balance-box,
  .timer-box{
    font-size:18px;
    text-align:center;
  }

  .bet-board{
    height:280px;
  }

  .title{
    font-size:60px;
  }

  .rate{
    font-size:18px;
  }

  .drop-zone{
    height:120px;
  }

  .zone-text{
    font-size:24px;
  }

  .money{
    font-size:34px;
    margin-top:10px;
  }

  .chip-panel{
    gap:8px;
  }

  .chip-panel button{
    width:60px;
    height:60px;
    font-size:14px;
  }

  .chip-add{
    width:70px !important;
    height:70px !important;
    font-size:18px !important;
  }

  .chip-input{
    width:90px;
    height:40px;
    font-size:16px;
  }

  .current-bet{
    font-size:16px;
  }

  .selected-chip{
    font-size:18px;
  }

  .result-box{
    font-size:24px;
  }

}
</style>
