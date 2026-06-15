const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const { v4: uuid } = require("uuid");
const crypto = require("crypto");

const app = express();

app.use(cors({
    origin: [
        "https://demo-game-2.onrender.com",
        "https://demo-game-3.onrender.com"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
}));

app.options("*", cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*" }
});

// =======================
// ENV（修复 GitHub secret warning关键点）
// =======================
const MONGO_URL = process.env.MONGO_URL;

// ❗ 不再写死任何密码
if (!MONGO_URL) {
    console.error("MONGO_URL not set");
}

// =======================
// Mongo
// =======================
mongoose.connect(MONGO_URL)
    .then(() => console.log("Mongo connected"))
    .catch(err => console.log(err.message));

// =======================
// TOKEN STORE（轻量登录系统）
// =======================
const tokenMap = new Map();

function createToken(playerId) {
    const token = crypto.randomBytes(16).toString("hex");
    tokenMap.set(token, playerId);
    return token;
}

function auth(req) {
    const token = req.headers.authorization?.replace("Bearer ", "");
    return tokenMap.get(token);
}

// =======================
// Schema（增强版）
// =======================
const PlayerSchema = new mongoose.Schema({
    id: { type: String, default: uuid },
    name: String,
    balance: { type: Number, default: 0 },

    password: String,
    remark: String,
    roomId: String,

    status: { type: String, default: "online" }
});

const RecordSchema = new mongoose.Schema({
    playerId: String,
    playerName: String,
    option: String,
    amount: Number,
    round: Number,
    sessionId: String,
    result: { type: String, default: "等待开奖" },
    balanceAfter: Number,
    time: { type: Date, default: Date.now }
});

const GameSchema = new mongoose.Schema({
    result: String,
    betting: Boolean,
    countdown: Number,
    round: Number,
    sessionId: String
});

const Player = mongoose.model("Player", PlayerSchema);
const Record = mongoose.model("Record", RecordSchema);
const Game = mongoose.model("Game", GameSchema);

let game;
let timer;

// =======================
// INIT
// =======================
async function init() {
    game = await Game.findOne();
    if (!game) {
        game = await Game.create({
            result: "等待开奖",
            betting: true,
            countdown: 20,
            round: 1,
            sessionId: uuid()
        });
    }

    startTimer();
}

// =======================
// 倒计时
// =======================
function startTimer() {
    if (timer) clearInterval(timer);

    timer = setInterval(async () => {
        if (!game) return;

        if (game.betting && game.countdown > 0) {
            game.countdown--;
            await game.save();
            broadcast();
        }
    }, 1000);
}

// =======================
// broadcast
// =======================
async function broadcast() {
    const players = await Player.find();
    const records = await Record.find().sort({ time: -1 });

    io.emit("update", { players, records, game });
}

// =======================
// SOCKET
// =======================
io.on("connection", () => broadcast());

// =======================
// 🔐 登录接口（核心新增）
// =======================
app.post("/api/login", async (req, res) => {
    const { password } = req.body;

    const player = await Player.findOne({ password });

    if (!player) {
        return res.json({ success: false, msg: "密码错误" });
    }

    const token = createToken(player.id);

    res.json({
        success: true,
        token,
        player
    });
});

// =======================
// 玩家接口（兼容旧UI）
// =======================
app.get("/api/player/:id", async (req, res) => {
    const p = await Player.findOne({ id: req.params.id });
    res.json(p || { id: req.params.id, balance: 0 });
});

// =======================
// update player（后台）
// =======================
app.post("/admin/update-player", async (req, res) => {
    const { id, name, balance, remark } = req.body;

    let player = await Player.findOne({ id });

    if (!player) {
        player = await Player.create({
            id: id || uuid(),
            name,
            balance: Number(balance || 0),
            remark,
            password: String(Math.floor(1000 + Math.random() * 9000)),
            roomId: uuid()
        });
    } else {
        player.name = name;
        player.balance = Number(balance || 0);
        player.remark = remark;
        await player.save();
    }

    await broadcast();
    res.json({ success: true, player });
});

// =======================
// bet（增强安全）
// =======================
app.post("/api/bets", async (req, res) => {

    const playerId = auth(req) || req.body.playerId;

    const { option, amount } = req.body;

    const player = await Player.findOne({ id: playerId });
    if (!player) return res.json({ success: false });

    if (player.balance < amount)
        return res.json({ success: false });

    player.balance -= Number(amount);
    await player.save();

    await Record.create({
        playerId,
        playerName: player.name,
        option,
        amount: Number(amount),
        round: game.round,
        sessionId: game.sessionId,
        balanceAfter: player.balance
    });

    await broadcast();

    res.json({ success: true, balance: player.balance });
});

// =======================
// open（统一开奖）
// =======================
app.post("/admin/open", async (req, res) => {

    const { result } = req.body;

    game.result = result;
    game.betting = false;
    await game.save();

    const odds = { "闲": 1, "和": 8, "庄": 0.95 };

    const records = await Record.find({
        sessionId: game.sessionId,
        result: "等待开奖"
    });

    for (let r of records) {
        const player = await Player.findOne({ id: r.playerId });

        if (r.option === result) {
            const win = r.amount + r.amount * odds[result];
            r.result = "中奖 +" + win;

            if (player) {
                player.balance += win;
                await player.save();
            }
        } else {
            r.result = "未中奖";
        }

        await r.save();
    }

    await broadcast();
    res.json({ success: true });
});

// =======================
// next round
// =======================
app.post("/admin/next", async (req, res) => {

    game.round++;
    game.result = "等待开奖";
    game.betting = true;
    game.countdown = 20;
    game.sessionId = uuid();

    await game.save();

    io.emit("game-next", game);

    await broadcast();

    res.json({ success: true });
});

// =======================
server.listen(process.env.PORT || 3000, async () => {
    await init();
    console.log("Server running");
});
