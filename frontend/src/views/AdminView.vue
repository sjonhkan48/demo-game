<template>


<div class="admin-container">


<h2>
玩家管理
</h2>



<div class="create">


<input
v-model="newName"
placeholder="玩家名称"
/>


<input
type="number"
v-model.number="newBalance"
/>


<button
@click="createPlayer"
>

新增玩家

</button>


</div>





<table>


<thead>

<tr>

<th>ID</th>

<th>名称</th>

<th>余额</th>

<th>保存</th>

<th>玩家链接</th>

<th>状态</th>

<th>开奖设置</th>

<th>下一轮</th>


</tr>


</thead>




<tbody>


<tr
v-for="p in players"
:key="p.id"
>


<td>

{{p.id}}

</td>



<td>

<input
v-model="p.name"
/>

</td>



<td>


<input
type="number"
v-model.number="p.balance"
/>


</td>




<td>

<button
@click="save(p)"
>

保存

</button>

</td>




<td>


<a
:href="link(p)"
target="_blank"
>

玩家入口

</a>


</td>




<td>

{{p.status}}

</td>




<td>


<button
@click="open('闲')"
>
闲
</button>


<button
@click="open('和')"
>
和
</button>


<button
@click="open('庄')"
>
庄
</button>


</td>




<td>


<button
@click="next"
>

开始下一轮

</button>


</td>



</tr>


</tbody>


</table>





<h2>
开奖记录
</h2>




<input
v-model="search"
placeholder="玩家ID筛选"
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



const api=
"https://demo-game-3.onrender.com"



const front=
"https://demo-game-2.onrender.com"



const players=ref([])


const records=ref([])



const newName=ref("")


const newBalance=ref(1000)



const search=ref("")






async function load(){


players.value=
(
await axios.get(
api+"/api/players"
)
).data



records.value=
(
await axios.get(
api+"/api/records"
)
).data



}






async function createPlayer(){



await axios.post(

api+"/admin/create-player",

{


name:newName.value,


balance:newBalance.value


}


);



newName.value="";


newBalance.value=1000;



load();


}






async function save(p){



await axios.post(

api+"/admin/update-player",

p

);



load();


}






async function open(result){


await axios.post(

api+"/admin/open",

{
result
}

);



load();


}






async function next(){


await axios.post(

api+"/admin/next"

);


load();


}





function link(p){


return front+
"/player/"
+
p.id;


}






const filterRecords=
computed(()=>{


if(!search.value)

return records.value;



return records.value.filter(

x=>
x.playerId.includes(search.value)

);


});





onMounted(load)



</script>





<style scoped>


.admin-container{

padding:20px;

}



table{

width:100%;

border-collapse:collapse;

margin-top:20px;

}


td,th{

border:1px solid #ccc;

padding:10px;

text-align:center;

}



button{

padding:6px 12px;

}



.create{

margin-bottom:20px;

}


</style>
