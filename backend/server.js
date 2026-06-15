const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const { v4: uuid } = require("uuid");

const app = express();
const server = http.createServer(app);

// =======================
// CORS（生产稳定版）
// =======================
const allowOrigins = [
    "https://demo-game-2.onrender.com",
    "https://demo-game-3.onrender.com"
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(null, true); // 避免 Render + mobile 出问题
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

app.options("*", cors());
app.use(express.json());

// =======================
// Socket
// =======================
const io = new Server(server, {
    cors: { origin: "*" }
});

// =======================
// Mongo
// =======================
const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
    console.error("❌ MONGO_URL missing");
}

mongoose.set("strictQuery", true);

async function connectDB() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("✅ MongoDB connected");
    } catch (err) {
        console.log("❌ Mongo error:", err.message);
        setTimeout(connectDB, 5000);
    }
}
connectDB();

// =======================
// Schema
// =======================
const PlayerSchema = new mongoose.Schema({
    id: { type: String, default: uuid },
    name: String,
    balance: { type: Number, default: 0 },
    password: String,     // ⭐ 新增
    remark: String        // ⭐ 新增
});

const RecordSchema = new mongoose.Schema({
    playerId: String,
    playerName: String,
    option: String,
    amount: Number,
    result: { type: String, default: "等待开奖" },
    time: { type: Date, default: Date.now },
    round: Number
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

// =======================
// game state
// =======================
let game = null;

// =======================
// init
// =======================
async function init() {
    game = await Game.findOne();
    if (!game) game = await Game.create({});
    console.log("Game ready");
}

// =======================
// broadcast
// =======================
async function broadcast() {
    if (!game) return;

    const players = await Player.find();
    const records = await Record.find().sort({ time: -1 });

    io.emit("update", { players, records, game });
}

// =======================
// countdown engine（关键新增）
// =======================
setInterval(async () => {
    if (!game) return;
    if (!game.betting) return;

    game.countdown -= 1;

    if (game.countdown <= 0) {
        game.countdown = 20;
        game.round += 1;
    }

    await game.save();
    io.emit("update", { game });
}, 1000);

// =======================
// socket
// =======================
io.on("connection", (socket) => {
    broadcast();
});

// =======================
// routes
// =======================
app.get("/", (req, res) => {
    res.send("GAME SERVER RUNNING");
});

// =======================
// players
// =======================
app.get("/api/players", async (req, res) => {
    res.json(await Player.find());
});

app.get("/api/player/:id", async (req, res) => {
    const p = await Player.findOne({ id: req.params.id });
    res.json(p || { id: req.params.id, balance: 0 });
});

// =======================
// create/update player（含密码）
// =======================
app.post("/admin/update-player", async (req, res) => {
    const { id, name, balance, password, remark } = req.body;

    let player = await Player.findOne({ id });

    if (!player) {
        player = await Player.create({
            id: id || uuid(),
            name,
            balance: Number(balance || 0),
            password: password || String(Math.floor(1000 + Math.random() * 9000)),
            remark: remark || ""
        });
    } else {
        player.name = name;
        player.balance = Number(balance || 0);
        player.password = password || player.password;
        player.remark = remark || player.remark;
        await player.save();
    }

    await broadcast();
    res.json({ success: true, player });
});

// =======================
// bet
// =======================
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
        amount: Number(amount),
        round: game?.round || 1
    });

    await broadcast();
    res.json({ success: true, balance: player.balance });
});

// =======================
// open
// =======================
app.post("/admin/open", async (req, res) => {
    const { result } = req.body;

    game.result = result;
    game.betting = false;
    await game.save();

    const odds = { "闲": 1, "和": 8, "庄": 0.95 };

    const records = await Record.find({ result: "等待开奖" });

    for (let r of records) {
        const player = await Player.findOne({ id: r.playerId });

        if (r.option === result) {
            const win = Number(r.amount) + Number(r.amount) * odds[result];
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
// next round（修复404关键）
// =======================
app.post("/admin/next", async (req, res) => {
    game.result = "等待开奖";
    game.betting = true;
    game.countdown = 20;
    game.round += 1;

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
