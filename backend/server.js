require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Player = require("./models/player");
const Bet = require("./models/Bet");

const app = express();

app.use(cors());
app.use(express.json());


mongoose.connect(process.env.MONGODB_URI)
.then(()=>console.log("MongoDB OK"))
.catch(err=>console.log(err));


// 游戏状态

let currentResult = "等待开奖";

let gameOpen = true;

let round = 1;



// 首页

app.get("/",(req,res)=>{
res.json({
status:"running"
});
});



// 玩家余额

app.get("/api/score/:id",async(req,res)=>{

let player = await Player.findOne({
playerId:req.params.id
});


if(!player){

player = await Player.create({

playerId:req.params.id,

name:"玩家",

score:10000

});

}


res.json(player);

});




//下注


app.post("/api/bet",async(req,res)=>{


try{


const {
playerId,
area,
amount

}=req.body;



if(!gameOpen){

return res.json({
success:false,
message:"停止下注"
});

}



let player =
await Player.findOne({
playerId
});


if(player.score < amount){

return res.json({
success:false,
message:"余额不足"
});

}



player.score -= Number(amount);

await player.save();



const bet = await Bet.create({

playerId,

area,

amount:Number(amount),

result:"pending",

settled:false

});



res.json({

success:true,

score:player.score,

bet

});



}catch(e){

res.status(500).json({
message:e.message
})

}


});






// 获取下注记录


app.get("/api/bets/:id",async(req,res)=>{


const list =
await Bet.find({
playerId:req.params.id

})
.sort({
createdAt:-1
});


res.json(list);


});







// 当前游戏状态


app.get("/api/game",(req,res)=>{


res.json({

result:currentResult,

open:gameOpen,

round

});


});






// 后台开奖


app.post("/admin/open",async(req,res)=>{


const {
result

}=req.body;



gameOpen=false;

currentResult=result;



const bets =
await Bet.find({
settled:false
});



for(let bet of bets){



let win =
bet.area === result;



bet.result =
win?"win":"lose";


bet.settled=true;


await bet.save();




if(win){


let player =
await Player.findOne({
playerId:bet.playerId
});



let odds=1;


if(result==="和")
odds=8;


if(result==="庄")
odds=0.95;



player.score +=
Math.floor(
bet.amount +
bet.amount*odds
);



await player.save();


}


}



res.json({

success:true

});


});







// 下一轮


app.post("/admin/next",(req,res)=>{


currentResult="等待开奖";

gameOpen=true;

round++;


res.json({

success:true,

round

});


});






const PORT =
process.env.PORT || 3000;


app.listen(PORT,()=>{

console.log(
"server running "+PORT
)

});
