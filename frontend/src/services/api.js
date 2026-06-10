const API = "";

export async function getScore(id){
  const res = await fetch(`${API}/api/score/${id}`);
  return await res.json();
}


export async function getBets(id){
  const res = await fetch(`${API}/api/bets/${id}`);
  return await res.json();
}


export async function createBet(data){
  const res = await fetch(`${API}/api/bet`,{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    body:JSON.stringify(data)
  });

  return await res.json();
}


export async function getGame(){
  const res = await fetch(`${API}/api/game`);
  return await res.json();
}
