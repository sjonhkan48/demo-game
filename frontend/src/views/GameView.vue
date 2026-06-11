<template>

<div class="game">


<div class="top">

<div class="money">
💰 当前余额: {{ balance }}
</div>


<div class="timer">
下注倒计时 {{ time }} 秒
</div>

</div>



<div class="result">

开奖结果:
<span>
{{ result }}
</span>

</div>



<div class="areas">


<div 
class="area idle"
@click="choose('闲')">

<div>
闲
</div>

赔率 1

</div>



<div 
class="area draw"
@click="choose('和')">

<div>
和
</div>

赔率 8

</div>



<div 
class="area banker"
@click="choose('庄')">

<div>
庄
</div>

赔率 0.95

</div>


</div>





<div class="chips">


<button
v-for="c in chips"
:key="c"
@click="amount=c">

{{c}}

</button>


<input v-model.number="amount">


</div>





<div class="info">


当前筹码:
{{amount}}


<br>


当前下注:
{{betType || '未选择'}}



<br>


<button 
@click="bet"
:disabled="!betType">

确认下注

</button>


</div>






<h3>
投注记录
</h3>



<table>


<tr>

<th>玩家ID</th>

<th>区域</th>

<th>金额</th>

<th>结果</th>


</tr>



<tr
v-for="b in bets"
:key="b.id">


<td>{{b.player}}</td>

<td>{{b.type}}</td>

<td>{{b.amount}}</td>

<td>{{b.result}}</td>


</tr>



</table>



</div>

</template>





<script setup>


import {
ref,
onMounted,
onUnmounted

} from "vue"



import axios from "axios"




// 后端地址

const API =
"https://demo-game-3.onrender.com"





// 玩家ID修复

let player =
new URLSearchParams(
window.location.search
)
.get("player")



if(
!player ||
player==="undefined"

){

player="player1"

}





const balance=ref(0)



const bets=ref([])



const result=ref("等待开奖")



const time=ref(20)



const betType=ref("")



const amount=ref(100)




const chips=[10,50,100,500,1000]






function choose(v){

betType.value=v

}






// 获取玩家信息

async function load(){


try{


let r=
await axios.get(
`${API}/api/player/${player}`
)


balance.value =
r.data.balance





let b =
await axios.get(
`${API}/api/bets/${player}`
)


bets.value =
b.data





let game =
await axios.get(
`${API}/api/game`
)



result.value =
game.data.result


time.value =
game.data.time



}catch(e){


console.log(e)


}



}





//下注


async function bet(){


await axios.post(
`${API}/api/bet`,
{

player,

type:betType.value,

amount:amount.value


}

)


await load()


}







let timer




onMounted(()=>{


load()


timer=setInterval(()=>{


load()


},1000)



})



onUnmounted(()=>{


clearInterval(timer)


})



</script>





<style scoped>


.game{

background:#003b25;

min-height:100vh;

color:white;

padding:15px;

font-size:20px;


}




.top{

display:flex;

justify-content:space-between;


}


.money{

color:#ffd700;


}




.result{

text-align:center;

font-size:30px;

margin:30px;


}


.result span{

color:#ffd700;


}





.areas{

display:flex;

border:5px solid #d8a600;

border-radius:25px;

overflow:hidden;


}



.area{


width:33%;

height:230px;

display:flex;

flex-direction:column;

align-items:center;

justify-content:center;


font-size:20px;


}


.area div{

font-size:55px;

font-weight:bold;


}



.idle{

background:#10459b;

}


.draw{

background:#16834c;

}


.banker{

background:#a90f13;


}



.chips{

text-align:center;

margin:30px;


}


.chips button{

width:75px;

height:75px;

border-radius:50%;

margin:10px;

}




input{

width:90px;

height:50px;

}


.info{

text-align:center;


}


table{

width:100%;

border-collapse:collapse;


}


td,th{

border:1px solid white;

padding:8px;

}



</style>
