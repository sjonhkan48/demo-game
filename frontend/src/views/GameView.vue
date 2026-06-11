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


import {
ref,
reactive,
computed,
onMounted
} from "vue"


import axios from "axios"



const player=reactive({

id:"player1",

balance:10000

})



const game=reactive({

result:"等待开奖"

})




const countdown=ref(20)


const canBet=ref(true)



const options=[


{
name:"闲",
odds:1,
color:"#2049a0"
},


{
name:"和",
odds:8,
color:"#178c43"
},


{
name:"庄",
odds:0.95,
color:"#b51616"
}



]



const chips=[10,50,100,500,1000]



const selected=ref(0)


const customBet=ref(null)


const currentArea=ref(null)



const records=ref([])



const amount=computed(()=>{


return customBet.value || selected.value


})





function selectChip(c){

selected.value=c

customBet.value=null

}



function selectArea(a){

currentArea.value=a

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


game.result=g.data.result


countdown.value=g.data.time



}




async function bet(){



if(!currentArea.value){

alert("请选择下注区域")

return

}



if(amount.value<=0){

return

}



if(amount.value>player.balance){

alert("余额不足")

return

}





let res =
await axios.post(
"/api/bets",
{


playerId:player.id,


option:currentArea.value,


amount:amount.value


}

)



if(res.data.success){


player.balance-=amount.value



records.value.push({

playerId:player.id,

option:currentArea.value,

amount:amount.value,

result:"等待开奖"

})


}



}




function timer(){


setInterval(()=>{


if(countdown.value>0)

countdown.value--


else

canBet.value=false



},1000)



}





onMounted(()=>{


load()

timer()


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
