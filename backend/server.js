require("dotenv").config()

const express=require("express")
const mongoose=require("mongoose")
const cors=require("cors")


const Player=require("./models/player")
const Bet=require("./models/Bet")


const app=express()


app.use(cors())

app.use(express.json())



mongoose.connect(process.env.MONGODB_URI)

.then(()=>console.log("MongoDB ok"))

.catch(e=>console.log(e))





// 首页

app.get("/",(req,res)=>{

res.json({

status:"running"

})


})




// 玩家余额

app.get("/api/score/:id",async(req,res)=>{


let p =
await Player.findOne({

playerId:req.params.id

})


if(!p){

p=
await Player.create({

playerId:req.params.id,

name:"玩家",

score:10000

})

}



res.json(p)



})





// 玩家列表

app.get("/api/players",async(req,res)=>{


const list =
await Player.find()


res.json(list)


})






// 玩家修改

app.post(
"/admin/player/update",

async(req,res)=>{


const {

playerId,

name,

score


}=req.body



await Player.updateOne(

{playerId},

{

name,

score

}


)



res.json({

success:true

})



})






//下注


app.post("/api/bet",

async(req,res)=>{


const {

playerId,

area,

amount


}=req.body



const p =
await Player.findOne({

playerId

})



if(p.score < amount)

return res.json({

success:false,

message:"余额不足"

})




p.score-=amount


await p.save()



const bet =
await Bet.create({

playerId,

area,

amount,

result:"pending",

settled:false


})



res.json({

success:true,

score:p.score,

bet


})



})







//投注记录

app.get(
"/api/records",

async(req,res)=>{


const b =
await Bet.find()
.sort({

createdAt:-1

})


res.json(b)


})








//开奖


let current="等待开奖"





app.post("/admin/open",

async(req,res)=>{


const result=req.body.result



current=result




const bets =
await Bet.find({

settled:false

})



for(let b of bets){



let win =
b.area===result



b.result =
win?"win":"lose"


b.settled=true



await b.save()



if(win){


let p =
await Player.findOne({

playerId:b.playerId

})



let rate=1



if(result==="和")

rate=8


if(result==="庄")

rate=0.95




p.score +=
Math.floor(
b.amount*rate
)



await p.save()


}




}



res.json({

success:true,

result


})



})








// 下一轮


app.post("/admin/next",

(req,res)=>{


current="等待开奖"


res.json({

success:true

})


})






app.get("/api/result",

(req,res)=>{


res.json({

result:current

})


})








const PORT =
process.env.PORT||3000



app.listen(PORT,()=>{


console.log(
"server running",
PORT
)

})
