require("dotenv").config();


const express=require("express");

const mongoose=require("mongoose");

const cors=require("cors");


const Player=require("./models/player");

const Bet=require("./models/Bet");



const app=express();


app.use(cors());


app.use(express.json());





mongoose.connect(process.env.MONGODB_URI)

.then(()=>console.log("MongoDB OK"))

.catch(console.log);





let currentResult="";


let gameOpen=true;



// 获取余额

app.get("/api/score/:id",async(req,res)=>{


let p=await Player.findOne({
playerId:req.params.id
});


if(!p){


p=await Player.create({

playerId:req.params.id,

name:"玩家",

score:10000

});


}


res.json(p);


});





//下注

app.post("/api/bet",async(req,res)=>{


const {
playerId,
area,
amount
}=req.body;



let p=await Player.findOne({
playerId
});



if(p.score<amount)

return res.json({
success:false,
message:"余额不足"
});



p.score-=amount;


await p.save();




let bet=await Bet.create({

playerId,

area,

amount,

result:"pending",

settled:false

});



res.json({

success:true,

score:p.score,

bet

});



});






//投注记录


app.get("/api/bets/:id",async(req,res)=>{


let list=await Bet.find({

playerId:req.params.id

})
.sort({
createdAt:-1
});


res.json(list);



});





//游戏状态


app.get("/api/result",(req,res)=>{


res.json({

result:currentResult,

open:gameOpen

});


});






// =====================

// 后台

// =====================




// 玩家列表


app.get("/admin/players",async(req,res)=>{


res.json(
await Player.find()
);


});






//修改余额


app.post("/admin/player/update",
async(req,res)=>{


let p=await Player.findOne({

playerId:req.body.playerId

});



p.name=req.body.name;


p.score=req.body.score;


await p.save();


res.json({
success:true
});


});







//开奖


app.post("/admin/open",
async(req,res)=>{


currentResult=req.body.result;


gameOpen=false;



let bets=await Bet.find({

settled:false

});



for(let b of bets){



let win=b.area===currentResult;



b.result=win?"win":"lose";


b.settled=true;


await b.save();




if(win){


let p=await Player.findOne({

playerId:b.playerId

});



let rate=1;


if(b.area==="和")

rate=8;


if(b.area==="庄")

rate=0.95;



p.score+=Math.floor(
b.amount*rate
);



await p.save();



}



}



res.json({
success:true
});


});







// 下一轮


app.post("/admin/next",
async(req,res)=>{


currentResult="";

gameOpen=true;


res.json({
success:true
});


});






//后台记录


app.get("/admin/records",
async(req,res)=>{


res.json(
await Bet.find()
.sort({
createdAt:-1
})
);


});






//邀请


app.get("/admin/invite",(req,res)=>{


res.json({

url:
"https://demo-game-2.onrender.com/?player=player1"

});


});






app.listen(
process.env.PORT||3000,
()=>console.log("server running")
);
