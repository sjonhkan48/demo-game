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



mongoose.connect(process.env.MONGODB_URI)
.then(()=>console.log("mongo ok"))
.catch(console.log);




// =====================
// 游戏状态
// =====================


let game = {

status:"betting",

result:"",

countdown:20

};





// 首页

app.get("/",(req,res)=>{

res.json({
ok:true
});

});






// =====================
// 前端获取全部状态
// =====================


app.get("/api/game",async(req,res)=>{


res.json(game);



});








// =====================
// 玩家余额
// =====================


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








// =====================
// 玩家下注
// =====================



app.post("/api/bet",async(req,res)=>{


const {
playerId,
area,
amount
}=req.body;



if(game.status!=="betting"){


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



});









// =====================
// 用户投注记录
// =====================


app.get("/api/bets/:id",async(req,res)=>{


let data =
await Bet.find({

playerId:req.params.id

})
.sort({
createdAt:-1
});



res.json(data);



});









// =====================
// 后台 玩家列表
// =====================


app.get("/admin/players",async(req,res)=>{


let data =
await Player.find();



res.json(data);


});










// =====================
// 后台修改积分
// =====================


app.post("/admin/player/update",
async(req,res)=>{


let p =
await Player.findOne({

playerId:req.body.playerId

});



if(!p){

return res.json({

success:false

});

}



p.name=req.body.name;

p.score=Number(req.body.score);



await p.save();



res.json({

success:true

});



});









// =====================
// 后台开奖
// =====================


app.post("/admin/open",
async(req,res)=>{


let result=req.body.result;



game.status="open";

game.result=result;



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



if(result==="和"){

rate=8;

}


if(result==="庄"){

rate=0.95;

}





player.score +=
Math.floor(
bet.amount * rate
);



await player.save();



}





}





res.json({

success:true

});



});









// =====================
// 下一轮
// =====================


app.post("/admin/next",
async(req,res)=>{


game={

status:"betting",

result:"",

countdown:20

};



res.json({

success:true

});


});








// =====================


app.get("/admin/records",
async(req,res)=>{


let data =
await Bet.find()
.sort({
createdAt:-1
});


res.json(data);


});








const PORT =
process.env.PORT || 3000;


app.listen(PORT,()=>{


console.log(
"server running"
);


});
