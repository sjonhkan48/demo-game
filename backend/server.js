const express = require("express");
const http = require("http");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");


const app = express();

const server = http.createServer(app);


const io = new Server(server,{
    cors:{
        origin:"*"
    }
});


app.use(cors());
app.use(bodyParser.json());


// =======================
// 数据
// =======================


let players = {

    player1:{
        id:"player1",
        name:"player1",
        balance:10000
    }

};


let records=[];


let game={

    status:"下注中",

    result:"等待开奖",

    countdown:20

};



// =======================
// 玩家接口
// =======================



app.get("/api/player/:id",(req,res)=>{


    let player=players[req.params.id];


    if(!player){

        return res.status(404).json({
            error:"player not found"
        });

    }


    res.json(player);


});




app.get("/api/players",(req,res)=>{


    res.json(
        Object.values(players)
    );


});





// =======================
// 游戏状态
// =======================


app.get("/api/game",(req,res)=>{


    res.json({

        result:game.result,

        time:game.countdown,

        status:game.status

    });



});





// =======================
// 投注
// =======================


app.post("/api/bets",(req,res)=>{


    let {

        playerId,

        option,

        amount


    }=req.body;



    let player=players[playerId];



    if(!player){

        return res.status(404).json({
            error:"玩家不存在"
        });

    }



    amount=Number(amount);



    if(player.balance < amount){


        return res.status(400).json({

            error:"余额不足"

        });


    }



    player.balance-=amount;



    let record={


        id:uuidv4(),

        playerId,

        option,

        amount,

        result:"等待开奖"


    };


    records.push(record);



    io.emit("update",{

        players:Object.values(players),

        records,

        game

    });



    res.json({

        success:true,

        player

    });



});





// =======================
// 投注记录
// =======================


app.get("/api/records",(req,res)=>{


    res.json(records);


});




// =======================
// 后台 修改玩家
// =======================



app.post("/admin/update-player",(req,res)=>{


    let {

        id,

        name,

        balance


    }=req.body;



    if(!players[id]){


        players[id]={

            id,

            name,

            balance:Number(balance)

        };


    }else{


        players[id].name=name;

        players[id].balance=Number(balance);



    }



    io.emit("update",{

        players:Object.values(players),

        records,

        game


    });



    res.json({

        success:true

    });



});




// =======================
// 后台开奖
// =======================



app.post("/admin/open",(req,res)=>{


    let result=req.body.result;



    game.result=result;

    game.status="开奖完成";



    records.forEach(r=>{


        if(r.result==="等待开奖"){


            if(r.option===result){

                r.result="赢";

            }else{

                r.result="输";

            }


        }


    });



    io.emit("update",{

        players:Object.values(players),

        records,

        game


    });



    res.json({

        success:true

    });



});





// =======================
// 下一轮
// =======================


app.post("/admin/next",(req,res)=>{


    game.status="下注中";

    game.result="等待开奖";

    game.countdown=20;


    records=[];



    io.emit("update",{

        players:Object.values(players),

        records,

        game


    });



    res.json({

        success:true

    });



});





// =======================
// Socket
// =======================


io.on("connection",(socket)=>{


    console.log("socket连接:",socket.id);



    socket.emit("update",{

        players:Object.values(players),

        records,

        game


    });



});





// =======================
// Render启动
// =======================


const PORT=process.env.PORT || 3000;



server.listen(PORT,()=>{


    console.log(

        "server running "+PORT

    );


});
