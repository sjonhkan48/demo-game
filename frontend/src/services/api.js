import axios from "axios";
import { io } from "socket.io-client";

export const API_URL = "https://demo-game-3.onrender.com";

// WebSocket 实时同步
export const socket = io(API_URL);

// ----------------------
// 获取玩家余额
export async function getScore(playerId) {
  const res = await axios.get(`${API_URL}/api/score/${playerId}`);
  return res.data;
}

// ----------------------
// 创建下注
export async function createBet(data) {
  const res = await axios.post(`${API_URL}/api/bet`, data);
  return res.data;
}

// ----------------------
// 获取玩家投注记录
export async function getBets(playerId) {
  const res = await axios.get(`${API_URL}/api/bets/${playerId}`);
  return res.data;
}

// ----------------------
// 获取游戏状态
export async function getGame() {
  const res = await axios.get(`${API_URL}/api/result`);
  return res.data;
}

// ----------------------
// 后台管理接口

// 获取所有玩家
export async function getPlayers() {
  const res = await axios.get(`${API_URL}/admin/players`);
  return res.data;
}

// 修改玩家积分或名称
export async function updatePlayer(playerId, data) {
  const res = await axios.post(`${API_URL}/admin/player/${playerId}`, data);
  return res.data;
}

// 生成邀请链接
export async function createInvite() {
  const res = await axios.post(`${API_URL}/admin/invite`);
  return res.data;
}

// 后台手动开奖
export async function openGame(result) {
  const res = await axios.post(`${API_URL}/admin/open`, { result });
  return res.data;
}

// 开始下一轮
export async function nextRound() {
  const res = await axios.post(`${API_URL}/admin/next`);
  return res.data;
}

// 获取开奖记录
export async function getRecords() {
  const res = await axios.get(`${API_URL}/admin/records`);
  return res.data;
}

// ----------------------
// WebSocket 事件说明
/*
  socket.on("gameUpdate", () => {
    // 当后台发生任何操作（修改玩家积分、开奖、下一轮）
    // 所有前端客户端都会收到该事件
    // 客户端可以在回调中重新调用 getScore / getBets / getGame
  });
*/
