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
placeholder="初始余额"
/>



<button @click="createPlayer">

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
@click="savePlayer(p)"
>

保存

</button>


</td>




<td>


<a

:href="playerUrl(p.id)"

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
@click="open(p,'闲')"
>

闲

</button>


<button
@click="open(p,'和')"
>

和

</button>


<button
@click="open(p,'庄')"
>

庄

</button>


</td>




<td>


<button

@click="nextRound"

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
v-for="r in records"
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

{{new Date(r.time).toLocaleString()}}

</td>



</tr>


</tbody>


</table>



</div>


</template>






<script>


import axios from "axios";


export default{


name:"AdminView",


data(){


return{


apiBase:

"https://demo-game-3.onrender.com",



players:[],


records:[],



newName:"",


newBalance:1000



}

},




methods:{





async fetchPlayers(){


let res=

await axios.get(

this.apiBase+"/api/players"

);


this.players=res.data;


},





async fetchRecords(){


let res=

await axios.get(

this.apiBase+"/api/records"

);



this.records=res.data;


},





playerUrl(id){


return "/player/"+id;


},





async createPlayer(){



await axios.post(

this.apiBase+"/admin/update-player",

{


name:this.newName,


balance:this.newBalance



}


);



this.newName="";


this.newBalance=1000;


this.fetchPlayers();


},






async savePlayer(p){



await axios.post(

this.apiBase+"/admin/update-player",

p


);


this.fetchPlayers();


},







async open(p,result){



await axios.post(

this.apiBase+"/admin/open",

{


result

}


);



this.fetchPlayers();

this.fetchRecords();



},





async nextRound(){



await axios.post(

this.apiBase+"/admin/next"


);



this.fetchPlayers();


this.fetchRecords();



}




},





mounted(){


this.fetchPlayers();


this.fetchRecords();



}


}


</script>






<style>


.admin-container{

padding:20px;

}



table{

width:100%;

border-collapse:collapse;

margin-bottom:30px;


}



th,td{


border:1px solid #ccc;


padding:8px;


text-align:center;


}


button{

padding:5px 10px;

margin:2px;

}



</style>
