const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server,{
    cors:{
        origin:"*"
    }
});


// ======================
// 游戏数据
// ======================

let game={
    result:"等待开奖",
    time:20,
    status:"下注中"
};


let players=[
    {
        id:"player1",
        name:"player1",
        balance:10000
    }
];


let bets=[];

let records=[];


// ======================
// 玩家接口
// ======================


app.get("/api/player/:id",(req,res)=>{

    let p=players.find(
        x=>x.id===req.params.id
    );

    if(!p){
        return res.json({
            id:req.params.id,
            name:req.params.id,
            balance:10000
        })
    }


    res.json(p);

});





app.get("/api/players",(req,res)=>{

    res.json(players);

});





// 修改玩家

app.post("/admin/update-player",(req,res)=>{


    const {
        id,
        name,
        balance
    }=req.body;



    let p=players.find(
        x=>x.id===id
    );


    if(p){

        p.name=name;

        p.balance=Number(balance);

    }


    io.emit("update",{
        players
    });


    res.json({
        success:true
    })


});





// 添加玩家

app.post("/admin/add-player",(req,res)=>{


    players.push({

        id:"player"+Date.now(),

        name:req.body.name,

        balance:Number(req.body.balance)

    })


    res.json({
        success:true
    })


});




// ======================
// 游戏
// ======================


app.get("/api/game",(req,res)=>{

    res.json(game)

})





//下注

app.post("/api/bets",(req,res)=>{


    let {
        playerId,
        option,
        amount
    }=req.body;



    amount=Number(amount);



    let player=players.find(
        x=>x.id===playerId
    );


    if(!player){

        return res.json({
            success:false
        })

    }



    if(amount<=0){

        return res.json({
            success:false
        })

    }



    if(player.balance < amount){

        return res.json({
            success:false,
            msg:"余额不足"
        })

    }



    player.balance-=amount;



    let bet={

        id:Date.now(),

        playerId,

        option,

        amount,

        result:"等待开奖"

    };


    bets.push(bet);


    io.emit("update",{

        player,

        bets

    })


    res.json({

        success:true

    })


});





//下注记录

app.get("/api/records",(req,res)=>{

    res.json(records)

})




//开奖

app.post("/admin/open",(req,res)=>{


    let resultList=[
        "闲",
        "和",
        "庄"
    ];


    let result=
    resultList[
        Math.floor(
            Math.random()*3
        )
    ];



    game.result=result;

    game.status="开奖";


    bets.forEach(b=>{


        if(b.option===result){

            b.result="赢";


            let p=players.find(
                x=>x.id===b.playerId
            );


            let rate =
            result==="和"
            ?8
            :
            result==="庄"
            ?0.95
            :1;


            p.balance +=
            b.amount*rate;


        }else{

            b.result="输";

        }



        records.push(b);


    });



    io.emit("update",{

        game,

        players,

        bets

    });



    res.json({
        success:true,
        result
    })


});





//下一轮


app.post("/admin/next",(req,res)=>{


    bets=[];


    game={

        result:"等待开奖",

        time:20,

        status:"下注中"

    };



    io.emit("update",{

        game,

        bets

    })



    res.json({
        success:true
    })


});





// socket

io.on("connection",(socket)=>{


    socket.emit("update",{

        game,

        players,

        bets

    })


})






server.listen(
    process.env.PORT || 3000,
    ()=>{
        console.log("server running")
    }
)
