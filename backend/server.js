const express = require("express");
const cors = require("cors");
const http = require("http");
const {Server}=require("socket.io");
const mongoose=require("mongoose");
const {v4:uuid}=require("uuid");


const app=express();



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




// =======================
// MongoDB
// =======================


mongoose.connect(
process.env.MONGO_URI
)
.then(()=>{

console.log("MongoDB connected");

})
.catch(err=>{

console.log("MongoDB error:",err);

});




// =======================
// 数据模型
// =======================


const PlayerSchema=new mongoose.Schema({

id:{
type:String,
default:()=>uuid()
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


playerName:String,


option:String,


amount:Number,



result:{
type:String,
default:"等待开奖"
},


time:{
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
},



round:{
type:Number,
default:1
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






let game;





async function init(){


try{


game=await Game.findOne();


if(!game){


game=await Game.create({});


}


console.log("Game initialized");



}catch(err){


console.log(
"Game init error:",
err
);


}


}


mongoose.connection.once(
"open",
()=>{

init();

}
);









// =======================
// 广播
// =======================



async function broadcast(){


const players=

await Player.find();



const records=

await Record.find()

.sort({

time:-1

});





io.emit(

"update",

{


players,


records,


game


}

);


}








io.on(

"connection",

socket=>{


broadcast();



});









// =======================
// 首页
// =======================


app.get("/",(req,res)=>{


res.send(

"GAME SERVER RUNNING"

);


});









// =======================
// 玩家列表
// =======================


app.get(

"/api/players",

async(req,res)=>{


const data=

await Player.find();



res.json(data);



});









// =======================
// 单玩家
// =======================


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



});









// =======================
// 玩家记录
// =======================


app.get(

"/api/records/:playerId",

async(req,res)=>{


const data=

await Record.find({

playerId:req.params.playerId

})

.sort({

time:-1

});



res.json(data);



});









// =======================
// Admin 新增/修改玩家
// =======================


app.post(

"/admin/update-player",

async(req,res)=>{


const {

id,

name,

balance

}=req.body;





let player=

await Player.findOne({

id

});






if(!player){



player=

await Player.create({

id,

name,

balance:Number(balance)


});




}else{


player.name=name;


player.balance=

Number(balance);



await player.save();



}






await broadcast();





res.json({

success:true,

player


});



});









// =======================
// 玩家下注
// =======================



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






await Record.create({


playerId,


playerName:player.name,


option,


amount:Number(amount),



result:"等待开奖"


});






await broadcast();






res.json({

success:true,

balance:player.balance


});




});









// =======================
// 开奖
// =======================


app.post(

"/admin/open",

async(req,res)=>{


const {

result

}=req.body;





game.result=result;


game.betting=false;



await game.save();







const odds={


"闲":1,


"和":8,


"庄":0.95



};







const records=

await Record.find({

result:"等待开奖"

});








for(let r of records){





const player=

await Player.findOne({

id:r.playerId

});






if(r.option===result){





const win =


Number(r.amount)

+

(

Number(r.amount)

*

Number(odds[result])

);






r.result=

"中奖 +" + win;







if(player){


player.balance += win;


await player.save();


}






}else{



r.result="未中奖";



}





await r.save();




}






await broadcast();






res.json({

success:true

});



});









// =======================
// 下一轮
// =======================


app.post(

"/admin/next",

async(req,res)=>{


const {

playerId

}=req.body;






game.result="等待开奖";


game.betting=true;


game.countdown=20;


game.round +=1;




await game.save();








io.emit(

"player-next",

{


playerId,


game


}

);






await broadcast();







res.json({

success:true

});




});









// =======================
// 所有记录
// =======================



app.get(

"/api/records",

async(req,res)=>{


const data=

await Record.find()

.sort({

time:-1

});



res.json(data);



});









server.listen(

3000,

()=>{


console.log(

"Server running on port 3000"

);


});
