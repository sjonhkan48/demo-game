<template>

<div class="game-container">


<div class="top-bar">

<span class="balance">
💰 当前余额：{{player.balance}}
</span>


<span class="countdown">
{{countdownText}}
</span>


</div>




<div class="result">

开奖结果：

<span class="waiting">

{{game.result}}

</span>

</div>





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


<td>{{item.playerId}}</td>


<td>{{item.option}}</td>


<td>{{item.amount}}</td>


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



import {useRoute}

from "vue-router"





const route=useRoute()



const apiBase="https://demo-game-3.onrender.com"



const playerId=route.params.id





const player=reactive({

id:playerId,

balance:0

})





const game=reactive({

result:"等待开奖"

})






const countdown=ref(20)



const countdownText=ref(

"下注倒计时 20 秒"

)



const canBet=ref(true)







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










// 获取玩家余额


async function getPlayer(){


const res=

await axios.get(

`${apiBase}/api/player/${playerId}`

)



player.balance=res.data.balance


}









// 获取自己的投注记录


async function getRecords(){


const res=

await axios.get(

`${apiBase}/api/records/${playerId}`

)



records.value=res.data


}









// 选择筹码


function selectChip(chip){


if(!canBet.value)return


selectedChip.value=chip


customBet.value=0


}









function choose(name){


if(!canBet.value)return


currentOption.value=name


}











//下注


async function placeBet(){



if(!currentOption.value){


alert("请选择下注区域")

return


}





let amount=

customBet.value || selectedChip.value







if(!amount){


alert("请选择筹码")

return


}





if(amount>player.balance){


alert("余额不足")

return


}





try{


const res=

await axios.post(

`${apiBase}/api/bets`,


{


playerId,


option:currentOption.value,


amount


}



)






if(res.data.success){



// 后端返回最新余额

player.balance=

res.data.balance





// 立即显示记录


records.value.unshift(

res.data.record

)






selectedChip.value=0

customBet.value=0

currentOption.value=""



}



}catch(e){

console.log(e)

}



}









// 倒计时


function startCountdown(){



countdown.value=20


canBet.value=true



const timer=setInterval(()=>{



if(countdown.value>0){


countdown.value--


countdownText.value=

"下注倒计时 "

+countdown.value

+" 秒"



}else{


canBet.value=false


countdownText.value="停止下注"



clearInterval(timer)


}



},1000)



}











//监听后台状态


function syncGame(){



setInterval(async()=>{


await getPlayer()


await getRecords()



},2000)



}











//监听下一轮


function checkRound(){



setInterval(async()=>{



const res=

await axios.get(

`${apiBase}/api/game/status`

)






if(res.data.newRound){



game.result="等待开奖"



startCountdown()



selectedChip.value=0


customBet.value=0


currentOption.value=""



}



if(res.data.result){


game.result=res.data.result


}





},2000)



}








onMounted(()=>{


getPlayer()


getRecords()


startCountdown()



syncGame()


checkRound()



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


.top-bar{

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



.current button{

margin-left:15px;

padding:8px 15px;

}





.title{

margin-top:30px;

font-size:20px;

font-weight:bold;

}



table{

width:100%;

border-collapse:collapse;

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
