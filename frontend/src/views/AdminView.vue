<template>


<div class="admin">


<h1>
玩家管理后台
</h1>



<div
class="player"
v-for="p in players"
:key="p.id"
>



<h3>
玩家
</h3>


<p>
ID:
{{p.id}}
</p>



<input
v-model="p.name"
placeholder="玩家名称"
/>



<input
v-model="p.balance"
type="number"
/>



<button
@click="save(p)"
>
保存
</button>



<p>

玩家链接:

<br>

{{baseUrl}}/room/{{p.id}}

</p>



<p>

当前状态:

{{p.status}}

</p>



<hr>



<h4>
开奖设置
</h4>


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



<button
@click="next"
>
开始下一轮
</button>



</div>





<hr>




<h2>
开奖记录
</h2>



<select
v-model="filter"
>

<option value="">
全部玩家
</option>


<option
v-for="p in players"
:value="p.id"
>

{{p.name}}

</option>


</select>




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
v-for="r in records"
:key="r._id"
>


<td>
{{r.playerName}}
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



</tr>


</table>



</div>


</template>





<script setup>


import {
ref,
computed,
onMounted
}
from "vue";


import axios from "axios";



const API=
"https://demo-game-3.onrender.com";



const baseUrl=
"https://你的前端地址";




const players=
ref([]);



const records=
ref([]);



const filter=
ref("");




async function load(){


players.value=
await axios.get(
API+"/api/players"
)
.then(r=>r.data);



records.value=
await axios.get(
API+"/api/records"
)
.then(r=>r.data);


}





function save(p){


axios.post(
API+"/admin/update-player",
{


id:p.id,

name:p.name,

balance:p.balance


}

)
.then(()=>{

alert("保存成功")

})


}






function open(result){


axios.post(
API+"/admin/open",
{

result

}

)


}




function next(){


axios.post(
API+"/admin/next"
)

}




onMounted(()=>{


load();


});


</script>





<style scoped>


.admin{

padding:30px;

}



.player{

border:1px solid #ddd;

padding:20px;

margin-bottom:20px;

}


input{

margin:5px;

padding:8px;

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

border:1px solid #ccc;

padding:10px;

}



</style>
