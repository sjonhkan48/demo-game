const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const { v4: uuid } = require("uuid");

const app = express();

// =======================
// CORS（稳定版）
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

const io = new Server(server, {
    cors: { origin: "*" }
});

// =======================
// Mongo（修复双变量）
// =======================
const MONGO_URL =
    process.env.MONGO_URL ||
    process.env.MONGODB_URI;

if (!MONGO_URL) {
    console.error("❌ MongoDB URL 未配置");
}

// =======================
// Mongo连接
// =======================
let mongoReady = false;

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
        setTimeout(connectMongo, 5000);
    }
}

connectMongo();

// =======================
// Schema（升级版）
// =======================

// 玩家（新增：密码 + 备注 + 房间）
const PlayerSchema = new mongoose.Schema({
    id: { type: String, default: uuid },
    name: String,
    balance: { type: Number, default: 0 },

    // 🔥 新增
    password: { type: String },     // 4位数字
    remark: { type: String },       // 后台备注
    roomId: { type: String }        // 房间隔离
});

// 记录（新增余额快照）
const RecordSchema = new mongoose.Schema({
    playerId: String,
    playerName: String,
    option: String,
    amount: Number,
    result: { type: String, default: "等待开奖" },

    // 🔥 新增
    balanceAfter: Number,

    time: { type: Date, default: Date.now }
});

// 游戏
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
// 状态
// =======================
let game = null;
let countdownTimer = null;

// =======================
// 初始化
// =======================
async function init() {
    if (!mongoReady) return;

    game = await Game.findOne();
    if (!game) game = await Game.create({});

    console.log("🎮 Game ready");

    startCountdown();
}

// =======================
// 倒计时引擎（关键新增）
// =======================
function startCountdown() {
    if (countdownTimer) clearInterval(countdownTimer);

    countdownTimer = setInterval(async () => {
        if (!game) return;

        if (game.countdown > 0 && game.betting) {
            game.countdown -= 1;
            await game.save();
            await broadcast();
        }
    }, 1000);
}

// =======================
// broadcast（稳定版）
// =======================
async function broadcast() {
    if (!mongoReady || !game) return;

    const players = await Player.find();
    const records = await Record.find().sort({ time: -1 });

    io.emit("update", {
        players,
        records,
        game
    });
}

// =======================
// socket
// =======================
io.on("connection", (socket) => {
    broadcast();

    // admin多人同步
    socket.on("admin-sync", async () => {
        broadcast();
    });
});

// =======================
// health
// =======================
app.get("/", (req, res) => {
    res.send("GAME SERVER RUNNING");
});

// =======================
// safe wrapper
// =======================
const safe = (fn) => async (req, res) => {
    try {
        if (!mongoReady) {
            return res.status(503).json({ error: "DB not ready" });
        }
        await fn(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "server error" });
    }
};

// =======================
// API（不改UI兼容）
// =======================

// 玩家列表
app.get("/api/players", safe(async (req, res) => {
    res.json(await Player.find());
}));

// 单玩家
app.get("/api/player/:id", safe(async (req, res) => {
    const p = await Player.findOne({ id: req.params.id });
    res.json(p || { id: req.params.id, balance: 0 });
}));

// 记录
app.get("/api/records", safe(async (req, res) => {
    res.json(await Record.find().sort({ time: -1 }));
}));

// =======================
// 玩家创建/更新（带备注+密码）
// =======================
app.post("/admin/update-player", safe(async (req, res) => {
    const { id, name, balance, remark, password } = req.body;

    let player = await Player.findOne({ id });

    if (!player) {
        player = await Player.create({
            id: id || uuid(),
            name,
            balance: Number(balance || 0),
            remark,
            password: password || String(Math.floor(1000 + Math.random() * 9000)),
            roomId: id || uuid()
        });
    } else {
        player.name = name;
        player.balance = Number(balance || 0);
        if (remark !== undefined) player.remark = remark;
        await player.save();
    }

    await broadcast();
    res.json({ success: true, player });
}));

// =======================
// 下注（支持多笔）
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
        balanceAfter: player.balance
    });

    await broadcast();
    res.json({ success: true });
}));

// =======================
// 开奖
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
}));

// =======================
// 下一轮（关键修复）
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
// 启动
// =======================
server.listen(process.env.PORT || 3000, () => {
    console.log("🚀 Server running");
});
