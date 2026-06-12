const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");


const app = express();


app.use(cors({
    origin:"*"
}));

app.use(express.json());


const server=http.createServer(app);



const io=new Server(server,{
    cors:{
        origin:"*"
    }
});



// ======================
// MongoDB
// ======================


mongoose.connect(
"mongodb+srv://admin:admin3467@cluster0.sg5qkck.mongodb.net/demo-game"
)
.then(()=>{
console.log("MongoDB connected")
})
.catch(err=>{
console.log(err)
});




// ======================
// 数据模型
// ======================


const PlayerSchema=new mongoose.Schema({

id:{
type:String,
default:uuidv4,
unique:true
},

name:String,

balance:{
type:Number,
default:0
},

status:{
type:String,
default:"在线"
}


});



const RecordSchema=new mongoose.Schema({


playerId:String,

option:String,

amount:Number,

result:{
type:String,
default:"等待开奖"
},


createdAt:{
type:Date,
default:Date.now
}



});



const GameSchema=new mongoose.Schema({

result:{
type:String,
default:"等待开奖"
},

betting:{
type:Boolean,
default:true
},

countdown:{
type:Number,
default:20
}



});




const Player=mongoose.model(
"Player",
PlayerSchema
);


const Record=mongoose.model(
"Record",
RecordSchema
);



const Game=mongoose.model(
"Game",
GameSchema
);




// ======================
// 游戏状态
// ======================


let gameState;



(async()=>{

gameState=await Game.findOne();


if(!gameState){

gameState=await Game.create({});

}


})();





// ======================
// 同步
// ======================


async function broadcast(){


const players=
await Player.find();


const records=
await Record.find()
.sort({
createdAt:-1
});


io.emit(
"update",
{
players,
records,
game:gameState
}
);


}






io.on(
"connection",
socket=>{


broadcast();


}

);






// ======================
// 玩家接口
// ======================



// 获取全部玩家

app.get(
"/api/players",
async(req,res)=>{


const players=
await Player.find();


res.json(players);


}

);




// 获取单个玩家

app.get(
"/api/player/:id",
async(req,res)=>{


const player=
await Player.findOne({

id:req.params.id

});


if(!player){

return res.json({

id:req.params.id,

balance:0

});


}


res.json(player);



}

);





// ======================
// 新增玩家
// ======================



app.post(
"/admin/create-player",
async(req,res)=>{


try{


const player=
await Player.create({

id:uuidv4(),

name:req.body.name,

balance:Number(req.body.balance),

status:"在线"

});



await broadcast();



res.json({

success:true,

player

});



}catch(e){


console.log(e);


res.status(500).json({

success:false

});


}


}

);







// ======================
// 修改玩家
// ======================



app.post(
"/admin/update-player",
async(req,res)=>{


const {

id,

name,

balance


}=req.body;



const player=
await Player.findOne({
id
});



if(player){


player.name=name;


player.balance=
Number(balance);


await player.save();


}



await broadcast();


res.json({

success:true

});



}

);






// ======================
// 投注
// ======================



app.post(
"/api/bets",
async(req,res)=>{


const {

playerId,

option,

amount

}=req.body;



const player=
await Player.findOne({
id:playerId
});



if(!player){

return res.json({

success:false,

msg:"玩家不存在"

});


}



if(player.balance < amount){


return res.json({

success:false,

msg:"余额不足"

});


}




player.balance -= Number(amount);


await player.save();



const record=
await Record.create({

playerId,

option,

amount


});



await broadcast();



res.json({

success:true,

record

});



}

);








// ======================
// 记录
// ======================


app.get(
"/api/records",
async(req,res)=>{


const records=
await Record.find()
.sort({
createdAt:-1
});


res.json(records);



}

);







// ======================
// 开奖
// ======================



app.post(
"/admin/open",
async(req,res)=>{


const result=req.body.result;



gameState.result=result;


gameState.betting=false;


await gameState.save();



const records=
await Record.find({

result:"等待开奖"

});




for(let r of records){



const player=
await Player.findOne({

id:r.playerId

});



if(!player)
continue;




if(r.option===result){


r.result="中奖";

player.balance +=
Number(r.amount)*2;



}else{


r.result="未中奖";


}



await player.save();


await r.save();



}



await broadcast();



res.json({

success:true

});


}

);






// ======================
// 下一轮
// ======================



app.post(
"/admin/next",
async(req,res)=>{


gameState.result="等待开奖";

gameState.betting=true;

gameState.countdown=20;



await gameState.save();



await broadcast();



res.json({

success:true

});



}

);






// 首页检测

app.get(
"/",
(req,res)=>{


res.send(
"GAME SERVER RUNNING"
);


}

);






server.listen(
process.env.PORT || 3000,
()=>{

console.log(
"Server running"
);

}

);
