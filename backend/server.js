const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const { v4: uuid } = require("uuid");

const app = express();

// =======================
// CORS（稳定生产级）
// =======================
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

// =======================
// Socket.IO（稳定版）
// =======================
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// =======================
// MongoDB（稳定连接版）
// =======================
const MONGO_URL = process.env.MONGO_URL;

let mongoReady = false;

if (!MONGO_URL) {
    console.error("❌ MONGO_URL 未配置");
}

// 防止 Render 冷启动崩溃
async function connectMongo() {
    try {
        await mongoose.connect(MONGO_URL, {
            serverSelectionTimeoutMS: 5000
        });
        mongoReady = true;
        console.log("✅ MongoDB connected");
        await init();
    } catch (err) {
        console.error("❌ Mongo error:", err.message);
        setTimeout(connectMongo, 5000); // 自动重试
    }
}

connectMongo();

// =======================
// Schema
// =======================
const PlayerSchema = new mongoose.Schema({
    id: { type: String, default: uuid },
    name: String,
    balance: { type: Number, default: 0 }
});

const RecordSchema = new mongoose.Schema({
    playerId: String,
    playerName: String,
    option: String,
    amount: Number,
    result: { type: String, default: "等待开奖" },
    time: { type: Date, default: Date.now }
});

const GameSchema = new mongoose.Schema({
    result: { type: String, default: "等待开奖" },
    betting: { type: Boolean, default: true },
    countdown: { type: Number, default: 20 },
    round: { type: Number, default: 1 }
});

const Player = mongoose.model("Player", PlayerSchema);
const Record = mongoose.model("Record", RecordSchema);
const Game = mongoose.model("Game", GameSchema);

let game = null;

// =======================
// init（安全版）
// =======================
async function init() {
    if (!mongoReady) return;

    game = await Game.findOne();
    if (!game) game = await Game.create({});

    console.log("🎮 Game ready");
}

// =======================
// broadcast（防崩版）
// =======================
async function broadcast() {
    if (!mongoReady || !game) return;

    try {
        const players = await Player.find();
        const records = await Record.find().sort({ time: -1 });

        io.emit("update", {
            players,
            records,
            game
        });
    } catch (err) {
        console.error("broadcast error:", err.message);
    }
}

// =======================
// socket
// =======================
io.on("connection", () => {
    broadcast();
});

// =======================
// health check
// =======================
app.get("/", (req, res) => {
    res.send("GAME SERVER RUNNING");
});

// =======================
// safe wrapper（防 502）
// =======================
const safe = (fn) => async (req, res) => {
    try {
        if (!mongoReady) {
            return res.status(503).json({ error: "DB not ready" });
        }
        await fn(req, res);
    } catch (err) {
        console.error("API error:", err.message);
        res.status(500).json({ error: "server error" });
    }
};

// =======================
// API
// =======================
app.get("/api/players", safe(async (req, res) => {
    res.json(await Player.find());
}));

app.get("/api/player/:id", safe(async (req, res) => {
    const p = await Player.findOne({ id: req.params.id });
    res.json(p || { id: req.params.id, balance: 0 });
}));

app.get("/api/records", safe(async (req, res) => {
    res.json(await Record.find().sort({ time: -1 }));
}));

// =======================
// update player
// =======================
app.post("/admin/update-player", safe(async (req, res) => {
    const { id, name, balance } = req.body;

    let player = await Player.findOne({ id });

    if (!player) {
        player = await Player.create({
            id: id || uuid(),
            name,
            balance: Number(balance || 0)
        });
    } else {
        player.name = name;
        player.balance = Number(balance || 0);
        await player.save();
    }

    await broadcast();
    res.json({ success: true, player });
}));

// =======================
// bet
// =======================
app.post("/api/bets", safe(async (req, res) => {
    const { playerId, option, amount } = req.body;

    const player = await Player.findOne({ id: playerId });
    if (!player) return res.json({ success: false });

    if (player.balance < amount)
        return res.json({ success: false, msg: "余额不足" });

    player.balance -= Number(amount);
    await player.save();

    await Record.create({
        playerId,
        playerName: player.name,
        option,
        amount: Number(amount),
        result: "等待开奖"
    });

    await broadcast();
    res.json({ success: true });
}));

// =======================
// open
// =======================
app.post("/admin/open", safe(async (req, res) => {
    const { result } = req.body;

    game.result = result;
    game.betting = false;
    await game.save();

    const odds = { "闲": 1, "和": 8, "庄": 0.95 };

    const records = await Record.find({ result: "等待开奖" });

    for (let r of records) {
        const player = await Player.findOne({ id: r.playerId });

        if (r.option === result) {
            const win = Number(r.amount) + Number(r.amount) * Number(odds[result]);
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
}));

// =======================
// next round
// =======================
app.post("/admin/next", safe(async (req, res) => {
    game.result = "等待开奖";
    game.betting = true;
    game.countdown = 20;
    game.round += 1;

    await game.save();

    io.emit("game-next", game);
    await broadcast();

    res.json({ success: true });
}));

// =======================
// start server
// =======================
server.listen(process.env.PORT || 3000, () => {
    console.log("🚀 Server running");
});
