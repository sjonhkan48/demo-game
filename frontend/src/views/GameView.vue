<template>

<div class="game-container">


<div class="top">

<div>
💰 当前余额：{{player.balance}}
</div>


<div class="timer">
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
v-for="item in options"
:key="item.name"
class="area"
@click="selectArea(item.name)"
:style="{background:item.color}"
>


<h1>
{{item.name}}
</h1>

赔率 {{item.odds}}

</div>


</div>






<div class="chips">


<button
v-for="c in chips"
:key="c"
:class="'chip c'+c"
@click="selectChip(c)"
>

{{c}}

</button>


<input
v-model.number="customBet"
placeholder="自定义下注"
/>


</div>





<div class="info">


当前筹码：
{{amount}}


<br>


当前下注：
{{currentArea || '未选择'}}



<button
@click="bet"
:disabled="!canBet"
>

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
v-for="b in records"
:key="b.id"
>


<td>{{b.playerId}}</td>

<td>{{b.option}}</td>

<td>{{b.amount}}</td>

<td>
{{b.result}}
</td>


</tr>



</table>



</div>


</template>





<script setup>

import{
ref,
reactive,
onMounted
}from "vue"

import axios from "axios"

import {
io
}from "socket.io-client"



const player=reactive({

id:"player1",

balance:10000

})



const game=reactive({

result:"等待开奖"

})



const countdown=ref(20)



const options=[

{
name:"闲",
color:"#1745a0",
odds:1
},

{
name:"和",
color:"#14853d",
odds:8
},

{
name:"庄",
color:"#b31319",
odds:.95
}

]



const chips=[10,50,100,500,1000]



const selectedChip=ref(0)

const customBet=ref(0)


const currentOption=ref("")



const records=ref([])





function selectChip(c){

selectedChip.value=c

customBet.value=0

}



function choose(o){

currentOption.value=o

}




async function load(){


let p=
await axios.get(
"/api/player/player1"
)


Object.assign(
player,
p.data
)



let g=
await axios.get(
"/api/game"
)


countdown.value=g.data.time

game.result=g.data.result



}







async function placeBet(){


let amount=
customBet.value ||
selectedChip.value



if(
!currentOption.value
){

alert("请选择区域")

return

}



if(
amount>player.balance
){

alert("余额不足")

return

}



let r=
await axios.post(
"/api/bets",
{

playerId:player.id,

option:currentOption.value,

amount

}
)


if(r.data.success){


player.balance-=amount


records.value.push({

playerId:"player1",

option:currentOption.value,

amount,

result:"等待开奖"

})


}


}





function timer(){

setInterval(()=>{


if(countdown.value>0){

countdown.value--

}else{


}


},1000)

}





onMounted(()=>{


load();

timer();



let socket=
io();


socket.on(
"update",
data=>{


if(data.player){

Object.assign(
player,
data.player
)

}


if(data.game){

Object.assign(
game,
data.game
)

countdown.value=
data.game.time

}



if(data.bets){

records.value=
data.bets

}


})


})


</script>




<style scoped>


.game-container{

background:#06351d;

color:white;

padding:20px;

}



.top{

display:flex;

justify-content:space-between;

font-size:20px;

}



.result{

text-align:center;

font-size:24px;

margin:20px;

}



.board{

display:flex;

border:4px solid gold;

border-radius:15px;

overflow:hidden;

}



.area{

flex:1;

height:150px;

display:flex;

justify-content:center;

align-items:center;

flex-direction:column;

cursor:pointer;

}



.chips button{

width:55px;

height:55px;

border-radius:50%;

margin:10px;

}



.c10{

background:red;

}


.c50{

background:blue;

}


.c100{

background:green;

}


.c500{

background:purple;

}


.c1000{

background:black;

color:white;

}



table{

width:100%;

border-collapse:collapse;

margin-top:20px;

}



td,th{

border:1px solid white;

padding:10px;

text-align:center;

}


</style>
