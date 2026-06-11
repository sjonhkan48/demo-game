<template>
  <div class="admin">

    <h1>后台管理系统</h1>


    <!-- 游戏控制 -->
    <div class="box">

      <h2>游戏控制</h2>

      <p>
        当前状态：
        {{ game.result }}
      </p>


      <p>
        开奖结果：
        {{ game.result }}
      </p>


      <select v-model="result">

        <option value="闲">
          闲
        </option>

        <option value="和">
          和
        </option>

        <option value="庄">
          庄
        </option>

      </select>


      <button @click="openGame">
        立即开奖
      </button>


      <button @click="nextRound">
        下一轮
      </button>


    </div>



    <!-- 创建玩家 -->
    <div class="box">

      <button @click="createPlayer">
        添加玩家
      </button>


    </div>




    <!-- 玩家管理 -->

    <h2>
      玩家管理
    </h2>


    <table>


      <thead>

      <tr>

        <th>
          ID
        </th>

        <th>
          名称
        </th>

        <th>
          余额
        </th>

        <th>
          操作
        </th>


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
          v-model.number="p.balance"
          >


        </td>



        <td>


          <button
          @click="updatePlayer(p)"
          >

          保存

          </button>



          <button
          @click="copyLink(p)"
          >

          玩家链接

          </button>



        </td>



      </tr>



      </tbody>


    </table>




    <!-- 投注记录 -->


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
          区域
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
}
from "vue"



import axios from "axios"



import {
io
}
from "socket.io-client"





const API =
import.meta.env.VITE_BACKEND_URL
||
"https://demo-game-3.onrender.com"




const socket =
io(API)





const players =
ref([])




const records =
ref([])




const game =
ref({

result:"等待开奖"

})



const result =
ref("庄")






// 获取玩家

async function loadPlayers(){


const res =
await axios.get(
API+"/api/players"
)


players.value =
res.data



}





// 获取记录


async function loadRecords(){


const res =
await axios.get(
API+"/api/records"
)


records.value =
res.data



}





// 获取游戏


async function loadGame(){


const res =
await axios.get(
API+"/api/game"
)


game.value =
res.data



}








// 添加玩家


async function createPlayer(){


const id =
"player"+Date.now()



await axios.post(

API+"/admin/player",

{

playerId:id,

name:"新玩家",

balance:10000

}


)



loadPlayers()



}







// 修改玩家余额


async function updatePlayer(p){


await axios.post(

API+"/admin/update-player",

{


playerId:p.playerId,


balance:p.balance,


name:p.name


}


)



alert("保存成功")



}







// 开奖


async function openGame(){



await axios.post(

API+"/admin/open",

{


result:result.value


}

)



loadGame()



}







// 下一轮


async function nextRound(){



await axios.post(

API+"/admin/next"

)



loadGame()



}







// 玩家链接


function copyLink(p){



const url =

window.location.origin
+
"/?player="
+
p.playerId



navigator.clipboard.writeText(url)



alert(
"玩家链接复制成功"
)



}







// socket 实时同步


socket.on(
"updatePlayer",

()=>{


loadPlayers()


}
)





socket.on(

"newBet",

()=>{


loadRecords()


}

)





socket.on(

"gameResult",

()=>{


loadGame()


}

)








onMounted(()=>{


loadPlayers()


loadRecords()


loadGame()



})





</script>





<style scoped>


.admin{


padding:20px;

font-family:Arial;

}



.box{


background:#eee;

padding:20px;

margin-bottom:20px;


}



button{


padding:8px 15px;

margin:5px;


}



table{


width:100%;

border-collapse:collapse;


}



th,td{


border:1px solid #ccc;

padding:10px;

text-align:center;


}



input{


width:160px;

height:25px;


}



</style>
