<template>

<div class="game-container">


<!-- 顶部余额和倒计时 -->

<div class="top-bar">

<span class="balance">
💰 当前余额：{{ player.balance }}
</span>


<span class="countdown">
{{ countdownText }}
</span>


</div>



<!-- 游戏结果 -->


<div class="result">

开奖结果：
<span class="waiting">
{{ game.result }}
</span>


</div>



<!--下注区域 -->


<div class="bet-board">


<div

v-for="item in options"

:key="item.name"

class="bet-area"

:style="{background:item.color}"

@click="choose(item.name)"

>


<div class="name">
{{item.name}}
</div>


<div class="odds">

赔率 {{item.odds}}

</div>


</div>


</div>



<!-- 筹码 -->


<div class="chips">


<button

v-for="chip in chips"

:key="chip"

:class="'chip chip'+chip"

@click="selectChip(chip)"

>

{{chip}}

</button>



<input

type="number"

v-model.number="customBet"

placeholder="自定义下注"

/>


</div>





<!--当前下注 -->


<div class="current">


当前筹码：

{{selectedChip || customBet}}


当前下注：

{{currentOption || '未选择'}}



<button

@click="placeBet"

:disabled="!canBet"

>


{{canBet?'确认下注':'停止下注'}}


</button>


</div>





<!--记录 -->


<div class="title">

投注记录

</div>



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


<tr

v-for="item in records"

:key="item._id"

>


<td>
{{item.playerId}}
</td>


<td>
{{item.option}}
</td>


<td>
{{item.amount}}
</td>


<td class="wait">

{{item.result}}

</td>


</tr>


</tbody>


</table>


</div>


</template>





<script setup>


import {

reactive,

ref,

onMounted

}

from "vue"



import axios from "axios"



import {useRoute} from "vue-router"



const apiBase =
"https://demo-game-3.onrender.com"



const route = useRoute()



// 当前玩家

const player = reactive({

id:"",

balance:0,

name:""

})





const game = reactive({

result:"等待开奖"

})





const countdown = ref(20)


const countdownText =
ref("下注倒计时 20 秒")



const canBet =
ref(true)





const options=[


{
name:"闲",
color:"#1748a5",
odds:1
},


{
name:"和",
color:"#14853c",
odds:8
},


{
name:"庄",
color:"#b31319",
odds:0.95
}



]





const chips=[10,50,100,500,1000]



const selectedChip=ref(0)


const customBet=ref(0)


const currentOption=ref("")



const records=ref([])





// 获取玩家


async function loadPlayer(){


const id=route.params.id



const res =
await axios.get(

`${apiBase}/api/player/${id}`

)



Object.assign(

player,

res.data

)



}





// 获取下注记录


async function loadRecords(){


const res =
await axios.get(

`${apiBase}/api/bets/${player.id}`

)



records.value=res.data


}





function selectChip(value){


if(!canBet.value)return


selectedChip.value=value

customBet.value=0


}





function choose(name){


if(!canBet.value)return


currentOption.value=name


}





//提交下注


async function placeBet(){



if(!currentOption.value){

alert("请选择下注区域")

return

}




let amount =
customBet.value || selectedChip.value





if(!amount){

alert("请选择筹码")

return

}




if(amount>player.balance){

alert("余额不足")

return

}




await axios.post(

`${apiBase}/api/bets`,

{


playerId:player.id,


option:currentOption.value,


amount:amount



}



)




selectedChip.value=0

customBet.value=0

currentOption.value=""



await loadPlayer()

await loadRecords()



}





function startCountdown(){



const timer=setInterval(()=>{


if(countdown.value>0){


countdown.value--


countdownText.value=
"下注倒计时 "+countdown.value+" 秒"



}else{


canBet.value=false


countdownText.value="停止下注"


clearInterval(timer)


}



},1000)


}







onMounted(async()=>{


await loadPlayer()


await loadRecords()


startCountdown()



})



</script>






<style scoped>


.game-container {


background:#0b301b;


color:white;


padding:20px;


min-height:100vh;


font-family:Arial;


}




.top-bar {


display:flex;


justify-content:space-between;


font-size:20px;


}



.balance{


color:#ffd700;


}


.countdown{


color:red;


}





.result{


text-align:center;


font-size:28px;


margin:25px 0;


}



.waiting{


color:#ffd700;


}





.bet-board{


display:flex;


border:4px solid #ffd700;


border-radius:15px;


padding:10px;


gap:10px;


}




.bet-area{


flex:1;


height:130px;


border-radius:8px;


display:flex;


flex-direction:column;


justify-content:center;


align-items:center;


cursor:pointer;


}



.name{


font-size:40px;


font-weight:bold;


}


.odds{


font-size:18px;


}





.chips{


display:flex;


justify-content:center;


align-items:center;


gap:14px;


margin-top:25px;


}




.chip{


width:62px;


height:62px;


border-radius:50%;


border:5px dashed white;


color:white;


font-size:16px;


font-weight:bold;


cursor:pointer;


}




.chip10{

background:red;

}


.chip50{

background:#004cff;

}


.chip100{

background:#009900;

}


.chip500{

background:purple;

}


.chip1000{

background:black;

}





.current{


text-align:center;


font-size:18px;


margin:20px 0;


}




.title{


margin-top:30px;


font-size:20px;


font-weight:bold;


}




table{


width:100%;


border-collapse:collapse;


margin-top:10px;


}




th,td{


border:1px solid white;


padding:10px;


text-align:center;


}



.wait{

color:#ffd700;

}



</style>
