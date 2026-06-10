import axios from "axios"


export const API_URL =
"https://demo-game-3.onrender.com"



export async function getScore(playerId){


const res =
await axios.get(
`${API_URL}/api/score/${playerId}`
)


return res.data

}





export async function createBet(data){


const res =
await axios.post(
`${API_URL}/api/bet`,
data
)


return res.data


}





export async function getBets(playerId){


const res =
await axios.get(
`${API_URL}/api/bets/${playerId}`
)


return res.data


}




export async function getGame(){


const res =
await axios.get(
`${API_URL}/api/result`
)


return res.data


}
