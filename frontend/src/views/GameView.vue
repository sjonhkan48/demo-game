<template>

<div class="game-container">


<!-- 顶部 -->
<div class="top-bar">

<span class="balance">
💰 当前余额：{{ player.balance }}
</span>


<span class="countdown">
{{ countdownText }}
</span>


</div>



<!-- 开奖结果 -->

<div class="result">

开奖结果：

<span class="waiting">
{{ game.result }}
</span>


</div>



<!-- 下注区域 -->

<div class="bet-board">


<div
class="bet-area"
v-for="item in options"
:key="item.name"

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





<!-- 当前下注 -->

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





<!-- 投注记录 -->

<div class="title">

投注记录

</div>


<table>


<thead>

<tr>

<th>
玩家ID
</th>

<th>
区域
</th>

<th>
金额
</th>

<th>
结果
</th>


</tr>


</thead>


<tbody>


<tr

v-for="item in records"

:key="item.id"

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


import {ref,reactive,onMounted} from "vue"



const player = reactive({

id:"player1",

balance:1000


})



const game = reactive({

result:"等待开奖"

})





const countdown = ref(20)


const countdownText = ref("下注倒计时 20 秒")


const canBet = ref(true)





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



const selectedChip = ref(0)


const customBet = ref(0)


const currentOption = ref("")


const records = ref([])





//选择筹码

function selectChip(value){


if(!canBet.value)
return


selectedChip.value=value

customBet.value=0


}






//选择下注区域


function choose(name){


if(!canBet.value)
return


currentOption.value=name


}






//确认下注


function placeBet(){



if(!currentOption.value){

alert("请选择下注区域")

return

}



let amount = customBet.value || selectedChip.value



if(!amount){

alert("请选择筹码")

return

}




if(amount > player.balance){

alert("余额不足")

return

}





//扣余额

player.balance -= amount





//增加记录

records.value.push({

id:Date.now(),

playerId:player.id,

option:currentOption.value,

amount:amount,

result:"等待开奖"


})





//清空

selectedChip.value=0

customBet.value=0

currentOption.value=""



}







//倒计时


function startCountdown(){



let timer=setInterval(()=>{


if(countdown.value>0){


countdown.value--



countdownText.value=

"下注倒计时 "+countdown.value+" 秒"



}

else{


canBet.value=false


countdownText.value="停止下注"


clearInterval(timer)


}



},1000)



}






onMounted(()=>{


startCountdown()


})



</script>






<style scoped>


.game-container{


background:#0b301b;

color:white;

padding:20px;

min-height:100vh;


font-family:Arial;


}



/*顶部*/

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






/*结果*/


.result{


text-align:center;

font-size:28px;

margin:25px 0;


}


.waiting{

color:#ffd700;

}





/*区域*/


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






/*筹码*/


.chips{


display:flex;

justify-content:center;

align-items:center;

gap:12px;

margin:25px 0;


}



.chip{


width:60px;

height:60px;


border-radius:50%;


border:4px dashed white;


color:white;


font-weight:bold;


font-size:16px;


cursor:pointer;


}




.chip10{

background:red;

}



.chip50{

background:blue;

}



.chip100{

background:green;

}



.chip500{

background:purple;

}



.chip1000{

background:black;

}



input{


height:35px;

width:120px;


}






/*下注*/

.current{


text-align:center;

font-size:18px;


}



button{


margin-left:15px;


padding:8px 15px;


}





/*记录*/


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
