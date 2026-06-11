<template>
<div class="admin">

<h1>后台管理系统</h1>


<div class="box">

<h2>游戏控制</h2>

<p>
当前状态：
{{ gameStatus }}
</p>


<p>
开奖结果：
{{ result }}
</p>


<select v-model="openResult">

<option value="闲">闲</option>
<option value="和">和</option>
<option value="庄">庄</option>

</select>


<button @click="openGame">
立即开奖
</button>


<button @click="nextRound">
下一轮
</button>


</div>



<div class="box">

<button @click="loadPlayers">
刷新玩家
</button>


</div>



<h2>玩家管理</h2>


<table>

<thead>

<tr>

<th>ID</th>
<th>名称</th>
<th>余额</th>
<th>操作</th>


</tr>


</thead>


<tbody>


<tr v-for="p in players" :key="p.playerId">


<td>
{{p.playerId}}
</td>


<td>

<input v-model="p.name">

</td>


<td>

<input 
type="number"
v-model.number="p.score"
>

</td>


<td>

<button @click="savePlayer(p)">
保存
</button>


<a 
:href="playerLink(p.playerId)"
target="_blank"
>
玩家链接
</a>


</td>


</tr>


</tbody>

</table>





<h2>开奖记录</h2>


<table>


<thead>

<tr>

<th>玩家</th>
<th>下注</th>
<th>金额</th>
<th>结果</th>


</tr>

</thead>


<tbody>


<tr v-for="b in records" :key="b._id">


<td>
{{b.playerId}}
</td>


<td>
{{b.area}}
</td>


<td>
{{b.amount}}
</td>


<td>

{{showResult(b.result)}}

</td>


</tr>



</tbody>



</table>



</div>


</template>



<script setup>


import {ref,onMounted} from "vue"



const API =
"https://demo-game-3.onrender.com"



const players=ref([])

const records=ref([])


const result=ref("")

const gameStatus=ref("等待开奖")


const openResult=ref("庄")





async function request(url,options={}){


const res =
await fetch(API+url,{

headers:{
"Content-Type":"application/json"
},

...options

})


return await res.json()


}






async function loadPlayers(){


players.value =
await request("/api/players")


}






async function loadRecords(){


records.value =
await request("/api/records")


}






async function openGame(){



const data =
await request(
"/admin/open",
{

method:"POST",

body:JSON.stringify({

result:openResult.value

})


})



if(data.success){

result.value=data.result

gameStatus.value="开奖完成"

}



}






async function nextRound(){



const data =
await request(
"/admin/next",
{

method:"POST"

}

)



if(data.success){

gameStatus.value="等待开奖"

result.value="等待开奖"

}


}






async function savePlayer(p){


await request(
"/admin/player/update",
{

method:"POST",

body:JSON.stringify({

playerId:p.playerId,

name:p.name,

score:p.score


})

}

)



alert("保存成功")


}







function playerLink(id){


return window.location.origin+
"/?player="+id


}




function showResult(r){


if(r==="win") return "赢"

if(r==="lose") return "输"


return "等待开奖"


}





onMounted(()=>{


loadPlayers()

loadRecords()


setInterval(()=>{


loadPlayers()

loadRecords()


},3000)



})



</script>



<style scoped>


.admin{

padding:20px;

font-family:"Microsoft YaHei";

}


.box{

background:#eee;

padding:25px;

margin-bottom:20px;

}


table{

width:100%;

border-collapse:collapse;

}


td,th{

border:1px solid #aaa;

padding:10px;

text-align:center;

}


button{

padding:8px 15px;

margin:5px;

}


input{

width:160px;

}


</style>
