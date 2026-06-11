require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Player = require("./models/player");
const Bet = require("./models/Bet");


const app = express();


app.use(cors({
    origin:"*"
}));

app.use(express.json());



// ========================
// MongoDB
// ========================

mongoose.connect(process.env.MONGODB_URI)
.then(()=>{
    console.log("MongoDB Connected");
})
.catch(err=>{
    console.log(err);
});



// ========================
// 游戏状态中心
// ========================

let game = {

    status:"betting",

    result:"等待开奖",

    countdown:20

};



// 自动倒计时

setInterval(()=>{


    if(game.status==="betting"){

        if(game.countdown>0){

            game.countdown--;

        }


        if(game.countdown===0){

            game.status="locked";

        }

    }


},1000);



// ========================
// 获取游戏状态
// ========================

app.get("/api/game",(req,res)=>{


    res.json(game);


});



// ========================
// 玩家余额
// ========================


app.get("/api/score/:id",async(req,res)=>{


let player =
await Player.findOne({
playerId:req.params.id
});


if(!player){

player =
await Player.create({

playerId:req.params.id,

name:"玩家",

score:10000

});


}


res.json(player);


});




// ========================
// 玩家下注
// ========================


app.post("/api/bet",async(req,res)=>{


try{


const {
playerId,
area,
amount
}=req.body;



let player =
await Player.findOne({
playerId
});



if(!player)
return res.json({
success:false,
message:"玩家不存在"
});



if(player.score < amount)

return res.json({
success:false,
message:"余额不足"
});



// 扣余额

player.score -= Number(amount);

await player.save();




// 创建下注

let bet =
await Bet.create({

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

});


}


});






// ========================
// 获取投注记录
// ========================


app.get("/api/bets/:id",async(req,res)=>{


let list =
await Bet.find({

playerId:req.params.id

})
.sort({
createdAt:-1
});


res.json(list);


});







// ========================
// 后台开奖
// ========================


app.post("/admin/open",async(req,res)=>{


const {
result

}=req.body;



game.result=result;

game.status="open";





let bets =
await Bet.find({

settled:false

});




for(let bet of bets){



let win =
bet.area===result;



bet.result =
win?"win":"lose";


bet.settled=true;


await bet.save();



if(win){


let player =
await Player.findOne({

playerId:bet.playerId

});



let rate=1;


if(result==="和")

rate=8;


if(result==="庄")

rate=0.95;



player.score +=
Math.floor(
bet.amount * rate
);


await player.save();


}



}



res.json({

success:true,

game


});


});








// ========================
// 下一轮
// ========================


app.post("/admin/next",async(req,res)=>{


game={

status:"betting",

result:"等待开奖",

countdown:20

};



res.json({

success:true,

game

});


});







// ========================
// 修改积分
// ========================


app.post("/admin/player/update",async(req,res)=>{


const {

playerId,

score

}=req.body;



let player =
await Player.findOne({

playerId

});



if(!player){


player =
await Player.create({

playerId,

name:"玩家",

score

});


}else{


player.score=score;

await player.save();

}



res.json({

success:true,

player

});


});






// ========================
// 玩家列表
// ========================


app.get("/admin/players",async(req,res)=>{


let list =
await Player.find();


res.json(list);


});







const PORT =
process.env.PORT || 3000;


app.listen(PORT,()=>{

console.log(
"server running",
PORT
);


});
