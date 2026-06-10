<script setup>


import {
ref,
onMounted,
onUnmounted
}
from "vue"


import {
getScore,
getBets,
createBet,
getGame
}
from "../services/api"



const params =
new URLSearchParams(
window.location.search
)


const playerId =
params.get("player")
||
"player1"



const balance=ref(0)


const countdown=ref(20)


const locked=ref(false)


const result=ref("等待开奖")



const bets=ref([])



const selectedArea=ref(null)


const selectedChip=ref(100)



const areas=[

{
label:"闲",
color:"blue",
odds:1
},

{
label:"和",
color:"green",
odds:8
},

{
label:"庄",
color:"red",
odds:0.95
}


]



const chips=[
10,
50,
100,
500,
1000
]




async function load(){


let p =
await getScore(playerId)


balance.value=p.score



let b =
await getBets(playerId)


bets.value=b



let g =
await getGame()


result.value=g.result


countdown.value=g.time


locked.value=
!g.bettingOpen



}





function selectArea(a){


if(!locked.value)

selectedArea.value=a



}





async function placeBet(){


if(!selectedArea.value)

return alert("请选择区域")



let res =
await createBet({

playerId,

area:selectedArea.value.label,

amount:selectedChip.value


})



if(res.success){


balance.value=res.score


bets.value=
await getBets(playerId)



alert("下注成功")


}else{


alert(res.message)


}


}





let timer



onMounted(()=>{


load()



timer=setInterval(load,1000)


})




onUnmounted(()=>{


clearInterval(timer)


})



</script>
