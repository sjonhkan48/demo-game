const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const { v4: uuid } = require("uuid");

const app = express();

// =====================
// CORS（生产稳定版）
// =====================
const allowedOrigins = [
    "https://demo-game-2.onrender.com",
    "https://demo-game-3.onrender.com"
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, true); // 临时放开（避免CORS炸服）
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
}));

app.options("*", cors());
app.use(express.json());

// =====================
// Server + Socket
// =====================
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

// =====================
// MongoDB（关键稳定版）
// =====================
const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
    console.error("❌ MONGO_URL 未配置");
}

mongoose.connect(MONGO_URL)
    .then(() => {
        console.log("✅ MongoDB connected");
        init();
    })
    .catch(err => {
        console.error("❌ Mongo error:", err.message);
    });

// =====================
// Schema
// =====================
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

// =====================
let game = null;

async function init() {
    game = await Game.findOne();
    if (!game) game = await Game.create({});
    console.log("🎮 Game ready");
}

// =====================
async function broadcast() {
    try {
        const players = await Player.find();
        const records = await Record.find().sort({ time: -1 });

        io.emit("update", {
            players,
            records,
            game
        });
    } catch (err) {
        console.log("broadcast error:", err.message);
    }
}

// =====================
// routes
// =====================
app.get("/", (req, res) => {
    res.send("GAME SERVER RUNNING");
});

app.get("/api/players", async (req, res) => {
    res.json(await Player.find());
});

app.get("/api/player/:id", async (req, res) => {
    const p = await Player.findOne({ id: req.params.id });
    res.json(p || { id: req.params.id, balance: 0 });
});

app.get("/api/records", async (req, res) => {
    res.json(await Record.find().sort({ time: -1 }));
});

// =====================
// update player
// =====================
app.post("/admin/update-player", async (req, res) => {
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
});

// =====================
app.post("/api/bets", async (req, res) => {
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
        amount,
        result: "等待开奖"
    });

    await broadcast();
    res.json({ success: true });
});

// =====================
server.listen(process.env.PORT || 3000, async () => {
    console.log("🚀 Server running");
});
