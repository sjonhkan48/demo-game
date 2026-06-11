const express = require("express")
const cors = require("cors")
const path = require("path")


const app = express()


app.use(cors())

app.use(express.json())



// =================
// 数据
// =================


let players = [

{
id:"player1",
name:"player1",
balance:10000
}


]



let bets=[]



let game={

result:"等待开奖",

time:20

}







// =================
// 玩家
// =================


app.get(
"/api/player/:id",
(req,res)=>{


let p =
players.find(
x=>x.id===req.params.id
)



if(!p){

return res.json({

balance:0

})

}


res.json(p)



})






// 修改余额


app.post(
"/api/player/update",
(req,res)=>{


let {

id,

balance

}=req.body



let p =
players.find(
x=>x.id===id
)



if(p){

p.balance =
Number(balance)

}



res.json({

success:true

})


})







// =================
// 投注记录
// =================



app.get(
"/api/bets/:id",
(req,res)=>{


res.json(

bets.filter(
b=>b.player===req.params.id
)

)


})







//下注


app.post(
"/api/bet",
(req,res)=>{


let {

player,

type,

amount


}=req.body



let p =
players.find(
x=>x.id===player
)



if(!p){

return res.json({

error:"玩家不存在"

})

}





p.balance -= amount




bets.push({

id:Date.now(),

player,

type,

amount,

result:"等待开奖"


})



res.json({

success:true

})



})









// =================
// 游戏状态
// =================


app.get(
"/api/game",
(req,res)=>{


res.json(game)


})






// 开奖


app.post(
"/api/open",
(req,res)=>{


let result =
req.body.result



game.result=result

game.time=0




bets.forEach(b=>{


if(b.type===result){


b.result="赢"


let p =
players.find(
x=>x.id===b.player
)



let rate={

"闲":1,

"和":8,

"庄":0.95

}



p.balance +=

b.amount *
rate[result]


}


else{


b.result="输"


}



})




res.json({

success:true


})



})









// 下一轮


app.post(
"/api/next",
(req,res)=>{


game.result="等待开奖"

game.time=20


bets=[]


res.json({

success:true

})



})







// =================
// 静态文件
// =================


app.use(
express.static(
path.join(
__dirname,
"frontend/dist"
)

)
)





app.get(
"*",
(req,res)=>{


res.sendFile(

path.join(

__dirname,

"frontend/dist/index.html"

)


)


})






const PORT =
process.env.PORT || 3000



app.listen(
PORT,
()=>{

console.log(
"server running",
PORT
)

}

)
