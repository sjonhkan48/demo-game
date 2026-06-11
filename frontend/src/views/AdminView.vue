<template>
  <div class="admin">

    <h1>后台管理系统</h1>


    <div class="panel">

      <h2>游戏控制</h2>

      <p>
        当前状态：
        <span>
          {{ status }}
        </span>
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



    <div class="panel">

      <button @click="createInvite">
        生成玩家邀请链接
      </button>


      <p v-if="invite">
        {{ invite }}
      </p>

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
            >

          </td>



          <td>

            <input
              type="number"
              v-model.number="p.score"
            >

          </td>



          <td>

            <button
              @click="savePlayer(p)"
            >
              保存
            </button>


            <button
              @click="copyLink(p.playerId)"
            >
              玩家链接
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

      </thead>



      <tbody>


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


      </tbody>


    </table>


  </div>
</template>




<script setup>

import {
  ref,
  onMounted
} from "vue";


import axios from "axios";


const api =
"https://demo-game-2.onrender.com";



const players = ref([]);

const records = ref([]);

const result = ref("");

const status = ref("等待开奖");

const openResult = ref("庄");

const invite = ref("");




async function load(){


  const p =
  await axios.get(
    api+"/admin/players"
  );


  players.value =
  p.data;



  const r =
  await axios.get(
    api+"/admin/records"
  );


  records.value =
  r.data;


}




async function openGame(){


  await axios.post(
    api+"/admin/open",
    {
      result:
      openResult.value
    }
  );


  result.value =
  openResult.value;


  status.value =
  "开奖完成";


  load();


}




async function nextRound(){


  await axios.post(
    api+"/admin/next"
  );


  status.value =
  "开始下一轮";


  result.value =
  "";


}





async function savePlayer(p){


 await axios.post(
   api+"/admin/player/update",
   p
 );


 alert("保存成功");


}




async function createInvite(){


 const r =
 await axios.get(
   api+"/admin/invite"
 );


 invite.value =
 r.data.url;


}





function copyLink(id){


 navigator.clipboard.writeText(
   api+"/?player="+id
 );


 alert("复制成功");


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

padding:8px 15px;

margin:5px;

}



</style>
