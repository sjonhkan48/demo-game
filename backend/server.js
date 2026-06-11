const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");


const app = express();

app.use(cors({
    origin:"*"
}));

app.use(express.json());


const server = http.createServer(app);


const io = new Server(server,{
    cors:{
        origin:"*"
    }
});


// =====================
// 数据
// =====================

let players=[
    {
        id:"player1",
        name:"player1",
        balance:10000
    }
];


let game={

    result:"等待开奖",

    countdown:20,

    betting:true

};


let records=[];


// =====================
// 同步广播
// =====================

function broadcast(){

    io.emit("update",{

        players,

        game,

        records

    });

}


// =====================
// 玩家接口
// =====================


app.get("/api/players",(req,res)=>{

    res.json(players);

});



app.get("/api/player/:id",(req,res)=>{


    let p=players.find(
        x=>x.id===req.params.id
    );


    if(!p)
    {

        return res.json({
            id:req.params.id,
            name:req.params.id,
            balance:0
        })

    }


    res.json(p);


});




// =====================
// 投注
// =====================


app.post("/api/bets",(req,res)=>{


    let {
        playerId,
        option,
        amount

    }=req.body;



    let player =
    players.find(
        x=>x.id===playerId
    );



    if(!player)
    {

        return res.json({
            success:false,
            msg:"玩家不存在"
        })

    }



    if(player.balance < amount)
    {

        return res.json({

            success:false,

            msg:"余额不足"

        })

    }



    player.balance -= amount;



    let record={

        id:Date.now(),

        playerId,

        option,

        amount,

        result:"等待开奖"

    };


    records.push(record);


    broadcast();


    res.json({

        success:true,

        record

    })


});



// =====================
// 获取下注记录
// =====================


app.get("/api/records",(req,res)=>{


    res.json(records);


});




// =====================
// 后台修改积分
// =====================


app.post("/admin/update-player",(req,res)=>{


    let {

        id,

        name,

        balance


    }=req.body;



    let player =
    players.find(
        x=>x.id===id
    );


    if(!player)
    {

        player={

            id,

            name,

            balance

        };


        players.push(player);


    }
    else{


        player.name=name;

        player.balance=Number(balance);


    }



    broadcast();



    res.json({

        success:true,

        player

    })


});




// =====================
// 后台开奖
// =====================


app.post("/admin/open",(req,res)=>{


    let {

        result

    }=req.body;



    game.result=result;


    records.forEach(r=>{


        if(r.option===result)
        {

            r.result="中奖";


            let p=
            players.find(
                x=>x.id===r.playerId
            );


           
