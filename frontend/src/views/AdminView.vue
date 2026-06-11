<template>

<div class="admin">


<h1>
后台管理系统
</h1>



<div class="box">


<h2>
游戏控制
</h2>


<p>
当前状态：
{{game.status}}
</p>


<p>
开奖结果：
{{game.result}}
</p>



<button @click="openGame">
立即开奖
</button>


<button @click="nextGame">
下一轮
</button>



</div>






<div class="box">


<h2>
玩家管理
</h2>


<input v-model="newName"
placeholder="玩家名称">


<input v-model.number="newBalance"
placeholder="余额">


<button
@click="addPlayer"
>
添加玩家
</button>



</div>






<h2>
玩家列表
</h2>


<table>


<tr>

<th>ID</th>
<th>名称</th>
<th>余额</th>
<th>操作</th>

</tr>



<tr v-for="p in players">


<td>{{p.id}}</td>


<td>

<input v-model="p.name">

</td>


<td>

<input v-model.number="p.balance">

</td>


<td>


<button
@click="update(p)"
>
保存
</button>


</td>



</tr>


</table>




</div>


</template>




<script setup>

import{
ref,
onMounted
}from "vue"

import axios from "axios"


const players=ref([])

const game=ref({})


const newName=ref("")

const newBalance=ref(10000)




async function load(){

players.value=
(await axios.get("/api/players")).data


game.value=
(await axios.get("/api/game")).data

}




async function openGame(){

await axios.post("/admin/open")

load()

}




async function nextGame(){

await axios.post("/admin/next")

load()

}




async function addPlayer(){


await axios.post(
"/admin/add-player",
{

name:newName.value,

balance:newBalance.value

})


load()


}




async function update(p){


await axios.post(
"/admin/update-player",
p
)


load()


}



onMounted(load)



</script>




<style scoped>


.admin{

padding:30px;

}



.box{

background:#eee;

padding:20px;

margin-bottom:20px;

}



button{

margin:10px;

padding:8px 20px;

}



table{

width:100%;

border-collapse:collapse;

}


td,th{

border:1px solid #999;

padding:10px;

text-align:center;

}


</style>
