<template>

<div class="admin-container">

<h1>玩家管理</h1>


<!-- 新增玩家 -->

<div class="add-box">

<input 
v-model="newName"
placeholder="玩家名称"
/>

<input
type="number"
v-model.number="newBalance"
placeholder="初始余额"
/>


<button @click="addPlayer">
新增玩家
</button>


</div>



<table>

<thead>

<tr>

<th>ID</th>

<th>名称</th>

<th>余额</th>

<th>玩家链接</th>

<th>操作</th>

<th>状态</th>

<th>开奖设置</th>

<th>下一轮</th>

</tr>

</thead>


<tbody>


<tr v-for="p in players" :key="p.id">


<td>
{{p.id}}
</td>


<td>

<input v-model="p.name"/>

</td>



<td>

<input
type="number"
v-model.number="p.balance"
/>

</td>



<td>

<a
:href="frontUrl+'/player/'+p.id"
target="_blank"
>

打开玩家

</a>


</td>



<td>

<button @click="savePlayer(p)">
保存
</button>


</td>



<td>

{{p.status}}

</td>



<td>


<button @click="openResult('闲')">
闲
</button>


<button @click="openResult('和')">
和
</button>


<button @click="openResult('庄')">
庄
</button>



</td>



<td>


<button @click="nextRound">

开始下一轮

</button>



</td>


</tr>


</tbody>


</table>




<h1>

开奖记录

</h1>



<input
v-model="filterId"
placeholder="筛选玩家ID"
/>



<table>


<thead>

<tr>

<th>
玩家ID
</th>


<th>
选项
</th>


<th>
金额
</th>


<th>
结果
</th>


<th>
时间
</th>


</tr>

</thead>



<tbody>


<tr
v-for="r in filterRecords"
:key="r._id"
>


<td>
{{r.playerId}}
</td>


<td>
{{r.option}}
</td>


<td>
{{r.amount}}
</td>


<td>
{{r.result}}
</td>


<td>

{{new Date(r.createdAt).toLocaleString()}}

</td>


</tr>


</tbody>


</table>



</div>


</template>



<script setup>


import {
ref,
computed,
onMounted
}
from "vue"


import axios from "axios"



const api="https://demo-game-3.onrender.com"



const frontUrl=
"https://demo-game-2.onrender.com"



const players=ref([])

const records=ref([])



const newName=ref("")

const newBalance=ref(1000)


const filterId=ref("")





async function load(){


let p=
await axios.get(
api+"/api/players"
)


players.value=p.data



let r=
await axios.get(
api+"/api/records"
)


records.value=r.data


}




async function addPlayer(){


await axios.post(
api+"/admin/create-player",
{


name:newName.value,

balance:newBalance.value


})


newName.value=""


newBalance.value=1000


load()



}





async function savePlayer(player){


await axios.post(

api+"/admin/update-player",

player

)


load()


}





async function openResult(result){


await axios.post(

api+"/admin/open",

{
result
}

)


load()


}





async function nextRound(){


await axios.post(

api+"/admin/next"

)


load()


}






const filterRecords=
computed(()=>{


if(!filterId.value)

return records.value



return records.value.filter(

r=>
r.playerId.includes(filterId.value)

)


})




onMounted(load)



</script>



<style scoped>


.admin-container{

padding:30px;

}



table{

width:100%;

border-collapse:collapse;

margin-bottom:40px;

}



th,td{

border:1px solid #ccc;

padding:10px;

text-align:center;

}



button{

padding:6px 12px;

margin:3px;

}



.add-box{

margin-bottom:20px;

}


</style>
