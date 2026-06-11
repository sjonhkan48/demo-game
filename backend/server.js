app.get("/api/records",(req,res)=>{

res.json(records)

})





app.get("/api/players",(req,res)=>{


res.json(players)


})





app.post("/api/player",(req,res)=>{


let p={


id:
"player"+Date.now(),


name:req.body.name,


balance:req.body.balance || 10000


}



players.push(p)


res.json(p)


})




app.get("/api/bets/:id",(req,res)=>{


res.json(

records.filter(
x=>x.playerId==req.params.id
)

)


})
