<template>

<div class="game">


<!-- 余额 -->
<div class="balance">
💰 当前余额：{{ score }}
</div>


<!-- 开奖结果 -->
<h1>
开奖结果：
<span>
{{ result }}
</span>
</h1>


<!-- 区域 -->

<div class="areas">


<div 
class="area xian"
@click="selectArea('闲')">

<h2>闲</h2>
<p>赔率 1</p>

</div>


<div 
class="area he"
@click="selectArea('和')">

<h2>和</h2>
<p>赔率 8</p>

</div>


<div 
class="area zhuang"
@click="selectArea('庄')">

<h2>庄</h2>
<p>赔率 0.95</p>

</div>


</div>



<!-- 筹码 -->

<div class="chips">

<button
v-for="c in chips"
:key="c"
@click="selectChip(c)"
>

{{c}}

</button>


</div>


<div>

当前筹码：
{{ betAmount }}

</div>


<div>

当前下注：
{{ area || '未选择'}}

</div>



<button
:disabled="!area"
@click="bet"
>

确认下注

</button>



<h2>
投注记录
</h2>


<table>


<tr>

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



<tr
v-for="b in bets"
:key="b._id"
>

<td>
{{b.area}}
</td>

<td>
{{b.amount}}
</td>

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
onMounted
} from "vue"


import {

getScore,

createBet,

getBets,

getGame

} from "../services/api"



const playerId =
new URLSearchParams(location.search).get("player")
||
"player1"



const score=ref(0)


const result=ref("等待开奖")


const area=ref("")


const betAmount=ref(100)


const bets=ref([])



const chips=[
10,
50,
100,
500,
1000
]




function selectChip(v){

betAmount.value=v

}




function selectArea(v){

area.value=v

}





async function load(){


const s =
await getScore(playerId)

score.value=s.score



const b =
await getBets(playerId)


bets.value=b



const g =
await getGame()


if(g.result){

result.value=g.result

}



}




async function bet(){


await createBet({

playerId,

area:area.value,

amount:betAmount.value


})


await load()


area.value=""


}





onMounted(()=>{


load()


// 每3秒刷新开奖状态

setInterval(()=>{

load()

},3000)



})



</script>





<style scoped>


.game{

padding:30px;

font-family:
Microsoft YaHei;

}



.balance{

font-size:26px;

color:#d99b00;

}




h1{

text-align:center;

}




.areas{

display:flex;

height:230px;

}



.area{

flex:1;

display:flex;

flex-direction:column;

justify-content:center;

align-items:center;

color:white;

font-size:35px;

cursor:pointer;

}



.area p{

font-size:20px;

}



.xian{

background:#15459b;

}


.he{

background:#13853c;

}


.zhuang{

background:#a00000;

}




.chips button{

margin:15px;

width:70px;

height:45px;

}



table{

width:100%;

margin-top:20px;

border-collapse:collapse;

}



td,th{

border:1px solid #aaa;

padding:10px;

text-align:center;

}


</style>
