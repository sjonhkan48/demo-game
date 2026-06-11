<template>

<div>


<h1>后台管理系统</h1>


<div class="box">


<h2>游戏控制</h2>


<p>
当前状态：
{{game.status}}
</p>


<p>
开奖结果：
{{game.result}}
</p>


<select v-model="result">

<option>闲</option>

<option>和</option>

<option>庄</option>

</select>



<button @click="openGame">
立即开奖
</button>


<button @click="next">
下一轮
</button>



</div>





<div class="box">

<button @click="refresh">

刷新玩家

</button>


</div>





<h2>
玩家管理
</h2>



<table>


<tr>

<th>ID</th>

<th>名称</th>

<th>余额</th>

<th>操作</th>

</tr>



<tr
v-for="p in players"
:key="p.playerId"
>


<td>

{{p.playerId}}

</td>


<td>


<input
v-model="p.name"
/>


</td>



<td>


<input
type="number"
v-model.number="p.score"
/>


</td>



<td>


<button
@click="save(p)"
>

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



</div>


</template>





<script setup>


import {
ref,
onMounted
}
from "vue";



const API =
"https://demo-game-2.onrender.com";



const players =
ref([]);



const game =
ref({

status:"",

result:""

});



const result =
ref("庄");





async function refresh(){


let p =
await fetch(
API+"/admin/players"
);


players.value =
await p.json();




let g =
await fetch(
API+"/api/game"
);


game.value =
await g.json();



}






async function save(p){



await fetch(

API+"/admin/player/update",

{

method:"POST",

headers:{

"Content-Type":"application/json"

},


body:JSON.stringify({

playerId:p.playerId,

score:p.score

})


}



);


alert("保存成功");



}




async function openGame(){



await fetch(

API+"/admin/open",

{


method:"POST",

headers:{

"Content-Type":"application/json"

},


body:JSON.stringify({

result:result.value

})

}


);


refresh();


}







async function next(){



await fetch(

API+"/admin/next",

{

method:"POST"

}


);



refresh();


}







onMounted(()=>{


refresh();



setInterval(refresh,2000);



});



</script>





<style scoped>


.box{

background:#eee;

padding:30px;

margin-bottom:20px;


}


table{

width:100%;

border-collapse:collapse;


}



td,th{

border:1px solid #ccc;

padding:10px;

text-align:center;

}



button{

margin:5px;

padding:8px 15px;

}


</style>
