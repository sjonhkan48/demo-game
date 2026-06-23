const express = require("express");
const cors = require("cors");
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const { v4: uuid } = require("uuid");

const app = express();
app.use(express.json());

// ✅ CORS（修复你现在跨域报错）
app.use(cors({
    origin: [
        "https://demo-game-2.onrender.com",
        "https://demo-game-3.onrender.com"
    ],
    credentials: true
}));

const server = http.createServer(app);

// ================= Socket =================
const io = new Server(server, {
    cors: { origin: "*" }
});

// ================= Mongo =================
const MONGO_URL = process.env.MONGO_URL;

mongoose.connect(MONGO_URL)
    .then(() => console.log("Mongo connected"))
    .catch(err => console.log(err));

// ================= Schema =================
const Player = mongoose.model("Player", new mongoose.Schema({
    id: String,
    name: String,
    balance: { type: Number, default: 0 },
    note: String,
    password: String
}));

const Record = mongoose.model("Record", new mongoose.Schema({
    playerId: String,
    option: String,
    amount: Number,
    result: String,
    time: { type: Date, default: Date.now }
}));

// ================= 基础API =================

// 玩家列表
app.get("/api/players", async (req, res) => {
    res.json(await Player.find());
});

// 单玩家
app.get("/api/player/:id", async (req, res) => {
    const p = await Player.findOne({ id: req.params.id });
    res.json(p);
});

// 记录
app.get("/api/records", async (req, res) => {
    res.json(await Record.find().sort({ time: -1 }));
});

// ================= 管理员 =================

// 创建/更新玩家
app.post("/admin/update-player", async (req, res) => {
    const { id, name, balance, note, password } = req.body;

    let p = await Player.findOne({ id });

    if (!p) {
        p = await Player.create({
            id: id || uuid(),
            name,
            balance,
            note,
            password
        });
    } else {
        p.name = name;
        p.balance = balance;
        p.note = note;
        p.password = password;
        await p.save();
    }

    io.emit("update");
    res.json({ ok: true });
});

// 下一轮（保留接口，不删UI）
app.post("/admin/next", (req, res) => {
    io.emit("next");
    res.json({ ok: true });
});

// 开奖（占位稳定）
app.post("/admin/open", (req, res) => {
    io.emit("open");
    res.json({ ok: true });
});

// ================= health =================
app.get("/", (req, res) => {
    res.send("GAME SERVER RUNNING");
});

// ================= start =================
server.listen(process.env.PORT || 3000, () => {
    console.log("Server running");
});
