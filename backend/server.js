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
.then(()=>console.log("mongo ok"))
.catch(e=>console.log(e));



let game={

 result:"等待开奖",

 status:"betting",

 countdown:30

};



setInterval(()=>{


 if(game.status==="betting"){

    game.countdown--;


    if(game.countdown<=0){

      game.status="stop";

    }

 }


},1000);





// 游戏状态

app.get("/api/game",(req,res)=>{

res.json(game);

});




// 玩家余额

app.get("/api/score/:id",async(req,res)=>{


let player=await Player.findOne({
playerId:req.params.id
});


if(!player){

player=await Player.create({

playerId:req.params.id,

name:"玩家",

score:10000

});


}


res.json(player);


});





//下注


app.post("/api/bet",async(req,res)=>{


const {

playerId,

area,

amount

}=req.body;



if(game.status!=="betting"){

return res.json({

success:false,

message:"已停止下注"

});

}



let player=await Player.findOne({

playerId

});



if(player.score < amount){

return res.json({

success:false,

message:"余额不足"

});

}




player.score-=Number(amount);


await player.save();



let bet=await Bet.create({

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







//投注记录

app.get("/api/bets/:id",async(req,res)=>{


const list=await Bet.find({

playerId:req.params.id

})
.sort({
createdAt:-1
});


res.json(list);


});






//后台开奖


app.post("/admin/open",async(req,res)=>{


const {result}=req.body;


game.result=result;

game.status="open";





const bets=await Bet.find({

settled:false

});




for(let bet of bets){



let win=bet.area===result;



bet.result=win?"win":"lose";

bet.settled=true;


await bet.save();





if(win){



let player=await Player.findOne({

playerId:bet.playerId

});




let odds=1;


if(result==="和") odds=8;

if(result==="庄") odds=0.95;



player.score += Math.floor(

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


game={

result:"等待开奖",

status:"betting",

countdown:30


};


res.json(game);


});






app.listen(

process.env.PORT||3000,

()=>console.log("server running")

);
