import axios from "axios";

export const API_URL = "https://demo-game-2.onrender.com";

// 获取玩家余额
export async function getScore(playerId) {
  const res = await axios.get(`${API_URL}/api/score/${playerId}`);
  return res.data;
}

// 投注
export async function createBet(data) {
  const res = await axios.post(`${API_URL}/api/bet`, data);
  return res.data;
}

// 获取玩家投注记录
export async function getBets(playerId) {
  const res = await axios.get(`${API_URL}/api/bets/${playerId}`);
  return res.data;
}

// 获取游戏结果
export async function getGame() {
  const res = await axios.get(`${API_URL}/api/result`);
  return res.data;
}

// ----------------------
// 后台接口
export async function getPlayers() {
  const res = await axios.get(`${API_URL}/admin/players`);
  return res.data;
}

export async function updatePlayer(id, data) {
  const res = await axios.post(`${API_URL}/admin/player/${id}`, data);
  return res.data;
}

export async function getRecords() {
  const res = await axios.get(`${API_URL}/admin/records`);
  return res.data;
}

export async function adminOpen(result) {
  const res = await axios.post(`${API_URL}/admin/open`, { result });
  return res.data;
}

export async function adminNext() {
  const res = await axios.post(`${API_URL}/admin/next`);
  return res.data;
}

export async function createInvite() {
  const res = await axios.post(`${API_URL}/admin/invite`);
  return res.data;
}
