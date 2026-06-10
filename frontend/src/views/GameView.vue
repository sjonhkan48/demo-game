<template>

<div class="game">


<h2>
💰 当前余额：
{{ balance }}
</h2>


<h1>
开奖结果：
<span>
{{ result }}
</span>
</h1>



<div class="areas">

<div
v-for="a in areas"
:key="a.label"
class="area"
:class="a.color"
@click="selectArea(a)"
>

<h1>{{a.label}}</h1>

<p>
赔率 {{a.odds}}
</p>


</div>


</div>



<div class="chips">


<button
v-for="c in chips"
:key="c"
@click="selectedChip=c"
>

{{c}}

</button>


</div>



<h3>
当前筹码：
{{selectedChip}}
</h3>



<h3>
当前下注：
{{selectedArea?.label || '未选择'}}
</h3>



<button
@click="placeBet"
:disabled="locked"
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
onMounted,
onUnmounted
}
from "vue"



import {
getScore,
getBets,
createBet,
getGame

}
from "../services/api"



const params =
new URLSearchParams(
window.location.search
)


const playerId =
params.get("player")
||
"player1"



const balance =
ref(0)



const result =
ref("等待开奖")



const bets =
ref([])



const locked =
ref(false)



const selectedArea =
ref(null)



const selectedChip =
ref(100)



const areas=[

{
label:"闲",
color:"blue",
odds:1
},

{
label:"和",
color:"green",
odds:8
},

{
label:"庄",
color:"red",
odds:0.95
}

]



const chips=[
10,
50,
100,
500,
1000
]





async function load(){


const p =
await getScore(playerId)


balance.value =
p.score



bets.value =
await getBets(playerId)



const g =
await getGame()


result.value =
g.result


locked.value =
!g.bettingOpen


}






function selectArea(a){


if(!locked.value)

selectedArea.value=a


}






async function placeBet(){


if(!selectedArea.value){

alert("请选择区域")

return

}



const res =
await createBet({

playerId,

area:selectedArea.value.label,

amount:selectedChip.value

})



if(res.success){


balance.value=res.score


bets.value=
await getBets(playerId)


}


else{


alert(res.message)


}


}





let timer



onMounted(()=>{


load()


timer=setInterval(
load,
1000
)


})



onUnmounted(()=>{


clearInterval(timer)


})


</script>



<style scoped>


.game{

padding:30px;

font-family:"Microsoft YaHei";

}



.areas{

display:flex;

height:220px;

}



.area{

flex:1;

display:flex;

flex-direction:column;

align-items:center;

justify-content:center;

color:white;

font-size:30px;

cursor:pointer;

}



.blue{

background:#12459b;

}



.green{

background:green;

}



.red{

background:#a80000;

}




.chips button{

margin:10px;

padding:10px 20px;

}


table{

width:100%;

border-collapse:collapse;

}


td,th{

border:1px solid #ccc;

padding:10px;

}



</style>
