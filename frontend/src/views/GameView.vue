<template>

<div class="game-container">


<div class="top-bar">

<div class="balance">
💰 当前余额：{{player.balance}}
</div>


<div>
下注倒计时 {{countdown}} 秒
</div>


</div>



<div class="result">

开奖结果：
<span>
{{game.result}}
</span>


</div>



<div class="board">


<div
class="area idle"
@click="choose('闲')"
>

<div>
闲
</div>

<p>
赔率 1
</p>

</div>



<div
class="area tie"
@click="choose('和')"
>

<div>
和
</div>

<p>
赔率 8
</p>

</div>



<div
class="area banker"
@click="choose('庄')"
>

<div>
庄
</div>

<p>
赔率 0.95
</p>


</div>


</div>




<div class="chips">


<button
v-for="c in chips"
:key="c"
@click="selectChip(c)"
:class="{active:selectedChip===c}"
>

{{c}}

</button>


<input
v-model.number="customBet"
type="number"
/>


</div>



<div class="info">


当前筹码：
{{selectedChip || customBet || 0}}


<br>


当前下注：
{{currentOption || '未选择'}}



<br>


<button
@click="placeBet"
:disabled="!currentOption"
>

确认下注

</button>


</div>





<h3>
投注记录
</h3>



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
:key="item.id"
>


<td>{{item.playerId}}</td>

<td>{{item.option}}</td>

<td>{{item.amount}}</td>

<td>{{item.result}}</td>



</tr>


</tbody>


</table>




</div>


</template>




<script setup>


import {
ref,
reactive,
onMounted
}
from "vue"


import axios from "axios"



const player=reactive({

id:"player1",

balance:0

})



const game=reactive({

result:"等待开奖"

})



const countdown=ref(20)



const chips=[10,50,100,500,1000]


const selectedChip=ref(null)

const customBet=ref(100)


const currentOption=ref(null)


const records=ref([])



function selectChip(c){

selectedChip.value=c

customBet.value=null

}



function choose(v){

currentOption.value=v

}




async function load(){


try{


let p =
await axios.get(
"/api/player/player1"
)


Object.assign(
player,
p.data
)




let g =
await axios.get(
"/api/game"
)



game.result=g.data.result


countdown.value=g.data.time



let r =
await axios.get(
"/api/records"
)



records.value=r.data



}catch(e){

console.log(e)

}


}





async function placeBet(){


let amount=
customBet.value || selectedChip.value



await axios.post(
"/api/bets",
{


playerId:player.id,


option:currentOption.value,


amount


}

)



player.balance-=amount



load()



}





onMounted(()=>{


load()



setInterval(()=>{


if(countdown.value>0)

countdown.value--


},1000)



})




</script>





<style scoped>


.game-container{


background:#00351f;

color:white;

padding:20px;

min-height:100vh;


}



.top-bar{


display:flex;

justify-content:space-between;

font-size:22px;


}



.balance{

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





.board{


display:flex;


border:5px solid #d5a900;

border-radius:20px;

overflow:hidden;


}





.area{


flex:1;

height:230px;

display:flex;

flex-direction:column;

align-items:center;

justify-content:center;

font-size:55px;

font-weight:bold;


}



.area p{

font-size:18px;


}



.idle{

background:#17459b;


}



.tie{

background:#19833d;


}


.banker{

background:#aa1015;


}




.chips{

margin-top:20px;

text-align:center;


}



.chips button{


width:70px;

height:70px;

border-radius:50%;


margin:8px;


font-size:18px;


}



.active{

border:5px solid gold;


}



input{

height:50px;

width:100px;

font-size:20px;


}




.info{

text-align:center;

font-size:22px;

margin:20px;


}



table{


width:100%;

border-collapse:collapse;


}



td,th{


border:1px solid white;

padding:8px;

text-align:center;


}


</style>
