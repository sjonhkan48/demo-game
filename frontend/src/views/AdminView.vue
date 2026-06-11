<template>

<div class="admin">

<h1>后台管理系统</h1>


<div class="panel">

<h2>游戏控制</h2>

<p>
当前状态：
{{ gameStatus }}
</p>


<p>
开奖结果：
<b>{{ result }}</b>
</p>


<select v-model="selectResult">

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



<div class="panel">

<button @click="createInvite">
生成玩家邀请链接
</button>


<p>
{{ invite }}
</p>


</div>



<h2>玩家管理</h2>


<table>

<tr>

<th>ID</th>
<th>名称</th>
<th>余额</th>
<th>操作</th>


</tr>


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
:href="'/?player='+p.playerId"
target="_blank"
>

玩家链接

</a>


</td>



</tr>


</table>





<h2>开奖记录</h2>


<table>

<tr>

<th>
玩家
</th>

<th>
下注
</th>

<th>
金额
</th>

<th>
结果
</th>


</tr>



<tr
v-for="b in records"
:key="b._id"
>


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

{{b.result}}

</td>


</tr>



</table>



</div>

</template>



<script setup>


import {ref,onMounted} from "vue";

import axios from "axios";


const API="你的后台地址";


const players=ref([]);


const records=ref([]);


const selectResult=ref("庄");


const result=ref("");

const gameStatus=ref("等待开奖");


const invite=ref("");



async function load(){


let p=await axios.get(
`${API}/admin/players`
);


players.value=p.data;



let r=await axios.get(
`${API}/admin/records`
);


records.value=r.data;



let g=await axios.get(
`${API}/api/result`
);


result.value=g.data.result;



}





async function savePlayer(p){


await axios.post(
`${API}/admin/player/update`,
{

playerId:p.playerId,

name:p.name,

score:p.score

}

);


alert("保存成功");


}




async function openGame(){



await axios.post(
`${API}/admin/open`,
{

result:selectResult.value

}

);


gameStatus.value="开奖完成";


load();


}





async function nextRound(){



await axios.post(
`${API}/admin/next`
);


gameStatus.value="下注中";


result.value="等待开奖";


load();



}





async function createInvite(){



let res=await axios.get(
`${API}/admin/invite`
);


invite.value=res.data.url;


}



onMounted(()=>{


load();


setInterval(load,3000);


})



</script>



<style scoped>


.admin{

padding:20px;

font-family:"Microsoft YaHei";

}



.panel{


background:#eee;

padding:20px;

margin-bottom:20px;


}


button{

margin:5px;

padding:8px 15px;

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



</style>
