const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const { v4: uuid } = require("uuid");

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
// Mongo
// =======================
const MONGO_URL =
    process.env.MONGO_URL ||
    process.env.MONGODB_URI;

mongoose.connect(MONGO_URL)
    .then(() => console.log("Mongo connected"))
    .catch(err => console.log(err.message));

// =======================
// 玩家（升级）
// =======================
const PlayerSchema = new mongoose.Schema({
    id: { type: String, default: uuid },
    name: String,
    balance: { type: Number, default: 0 },

    password: String,      // 4位房间密码
    remark: String,        // 后台备注
    roomId: String,        // 房间

    status: { type: String, default: "online" }
});

// =======================
// 下注（批次系统）
// =======================
const RecordSchema = new mongoose.Schema({
    playerId: String,
    playerName: String,
    option: String,
    amount: Number,

    round: Number,        // 当前轮次
    sessionId: String,    // 关键：一轮下注集合

    result: { type: String, default: "等待开奖" },
    balanceAfter: Number,

    time: { type: Date, default: Date.now }
});

// =======================
// 游戏
// =======================
const GameSchema = new mongoose.Schema({
    result: String,
    betting: Boolean,
    countdown: Number,
    round: Number,

    sessionId: String   // 🔥 当前轮ID
});

const Player = mongoose.model("Player", PlayerSchema);
const Record = mongoose.model("Record", RecordSchema);
const Game = mongoose.model("Game", GameSchema);

// =======================
let game;
let timer;

// =======================
// init
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
// 倒计时系统（稳定版）
// =======================
function startTimer() {
    if (timer) clearInterval(timer);

    timer = setInterval(async () => {
        if (!game) return;

        if (game.betting && game.countdown > 0) {
            game.countdown -= 1;
            await game.save();
            broadcast();
        }
    }, 1000);
}

// =======================
// 广播
// =======================
async function broadcast() {
    if (!game) return;

    const players = await Player.find();
    const records = await Record.find().sort({ time: -1 });

    io.emit("update", {
        players,
        records,
        game
    });
}

// =======================
// socket同步
// =======================
io.on("connection", socket => {
    broadcast();
});

// =======================
// API安全包装
// =======================
const safe = fn => async (req, res) => {
    try {
        await fn(req, res);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// =======================
// 玩家登录（新增：密码进入）
// =======================
app.post("/api/login", safe(async (req, res) => {
    const { password } = req.body;

    const player = await Player.findOne({ password });

    if (!player) {
        return res.json({ success: false });
    }

    res.json({ success: true, player });
}));

// =======================
// 创建/更新玩家（不改UI）
// =======================
app.post("/admin/update-player", safe(async (req, res) => {
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

    broadcast();
    res.json({ success: true, player });
}));

// =======================
// 下注（支持多笔 + session）
// =======================
app.post("/api/bets", safe(async (req, res) => {
    const { playerId, option, amount } = req.body;

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

    broadcast();
    res.json({ success: true });
}));

// =======================
// 开奖（统一）
// =======================
app.post("/admin/open", safe(async (req, res) => {
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

    broadcast();
    res.json({ success: true });
}));

// =======================
// 下一轮（关键升级）
// =======================
app.post("/admin/next", safe(async (req, res) => {

    game.round += 1;
    game.result = "等待开奖";
    game.betting = true;
    game.countdown = 20;
    game.sessionId = uuid(); // 🔥 新轮次

    await game.save();

    io.emit("game-next", game);

    broadcast();

    res.json({ success: true });
}));

// =======================
server.listen(process.env.PORT || 3000, async () => {
    await init();
    console.log("Server running");
});
