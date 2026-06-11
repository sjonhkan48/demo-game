import axios from "axios"


const api = axios.create({

  baseURL:"https://demo-game-3.onrender.com"

})


// 获取积分
export function getScore(id){

 return api.get(`/api/score/${id}`)
 .then(res=>res.data)

}


// 获取投注记录
export function getBets(id){

 return api.get(`/api/bets/${id}`)
 .then(res=>res.data)

}


//下注
export function createBet(data){

 return api.post("/api/bet",data)
 .then(res=>res.data)

}


//游戏状态
export function getGame(){

 return api.get("/api/result")
 .then(res=>res.data)

}


//后台开奖
export function openGame(data){

 return api.post("/admin/open",data)
 .then(res=>res.data)

}


//下一轮
export function nextRound(){

 return api.post("/admin/next")
 .then(res=>res.data)

}


//玩家列表
export function getPlayers(){

 return api.get("/admin/players")
 .then(res=>res.data)

}


//修改玩家积分

export function updatePlayer(data){

 return api.post("/admin/player/update",data)
 .then(res=>res.data)

}
