
const game = {


result:"等待开奖",


bettingOpen:true,


time:20



}





// 每秒运行

setInterval(()=>{


if(game.bettingOpen){


game.time--



if(game.time<=0){


game.bettingOpen=false


game.time=0


game.result="等待开奖"



}



}



},1000)





// 后台开奖

function openResult(value){


game.result=value


game.bettingOpen=false


game.time=0


}





// 下一轮

function nextRound(){


game.result="等待开奖"


game.bettingOpen=true


game.time=20


}





module.exports={


game,


openResult,


nextRound


}
