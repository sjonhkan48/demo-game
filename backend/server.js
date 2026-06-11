const express = require("express")
const cors = require("cors")
const http = require("http")
const {Server}=require("socket.io")

const app = express()

const server=http.createServer(app)


const io=new Server(server,{

cors:{
origin:"*"
}

})


app.use(cors())

app.use(express.json())



// =================
// 内存数据
// =================


let players=[

{
playerId:"player1",
name:"player1",
balance:10000
}

]


let records=[]



let game={

result:"等待开奖",

time:20

}




// =================
// 玩家接口
// =================



app.get("/api/player/:id",(req,res)=>{


let p=
players.find(
x=>x.playerId===req.params.id
)


if(!p){

return res.json({

playerId:req.params.id,
balance:10000

})

}


res.json(p)


})





app.get("/api/players",(req,res)=>{


res.json(players)


})





// =================
// 下注记录
// =================


app.get("/api/records",(req,res)=>{


res.json(records)


})




// =================
// 游戏状态
// =================


app.get("/api/game",(req,res)=>{


res.json(game)


})






// =================
// 后台修改玩家
// =================


app.post(
"/admin/update-player",

(req,res)=>{


let p=
players.find(
x=>x.playerId===req.body.playerId
)



if(p){

p.balance=req.body.balance

p.name=req.body.name


}



io.emit(
"updatePlayer",
p
)



res.json({

success:true

})


}

)




// =================
// 添加玩家
// =================


app.post(
"/admin/player",

(req,res)=>{


players.push({

playerId:req.body.playerId,

name:req.body.name,

balance:req.body.balance

})


io.emit(
"updatePlayer"
)


res.json({

success:true

})


}

)




// =================
// 开奖
// =================



app.post(
"/admin/open",

(req,res)=>{


game.result=req.body.result


io.emit(
"gameResult",
game
)



res.json(game)


}

)






// =================
// 下一轮
// =================


app.post(
"/admin/next",

(req,res)=>{


game={

result:"等待开奖",

time:20

}



io.emit(
"gameResult",
game
)



res.json(game)


}

)






// =================
// socket
// =================


io.on(
"connection",

socket=>{


console.log(
"socket connected"
)



socket.emit(
"gameResult",
game
)



})






const PORT =
process.env.PORT || 3000


server.listen(
PORT,

()=>{

console.log(
"server running",
PORT
)

}

)
