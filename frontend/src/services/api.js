import axios from "axios";


const API="https://你的后端Render地址";


export function getScore(id){

return axios.get(
`${API}/api/score/${id}`
)
.then(r=>r.data);

}



export function getBets(id){

return axios.get(
`${API}/api/bets/${id}`
)
.then(r=>r.data);

}




export function createBet(data){

return axios.post(
`${API}/api/bet`,
data
)
.then(r=>r.data);

}





export function getGame(){

return axios.get(
`${API}/api/game`
)
.then(r=>r.data);

}
