const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const { v4: uuid } = require("uuid");

const app = express();
app.use(express.json());

// ======================
// CORS（保留你的前端域名）
// ======================
app.use(cors({
    origin: [
        "https://demo-game-2.onrender.com",
        "https://demo-game-3.onrender.com"
    ],
    credentials: true
}));

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*" }
});

// ======================
// DB
// ======================
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("Mongo connected"))
    .catch(err => console.log(err));

// ======================
// USER MODEL（重构核心）
// ======================
const UserSchema = new mongoose.Schema({
    systemId: { type: String, default: uuid },
    name: String,
    balance: { type: Number, default: 0 },

    // 🔥 新增：房间系统
    roomId: { type: String, unique: true },
    password: { type: String, default: () => String(Math.floor(1000 + Math.random() * 9000)) },

    remark: String,
    chipLink: String
});

// ======================
// BET RECORD
// ======================
const BetSchema = new mongoose.Schema({
    userId: String,
    option: String,
    amount: Number,
    result: String,
    time: { type: Date, default: Date.now },
    balanceAfter: Number
});

// ======================
// GAME STATE
// ======================
const GameSchema = new mongoose.Schema({
    round: { type: Number, default: 1 },
    result: { type: String, default: "等待开奖" }
});

const User = mongoose.model("User", UserSchema);
const Bet = mongoose.model("Bet", BetSchema);
const Game = mongoose.model("Game", GameSchema);

let gameState = null;

// ======================
// INIT
// ======================
async function init() {
    gameState = await Game.findOne();
    if (!gameState) gameState = await Game.create({});
}

init();

// ======================
// BROADCAST
// ======================
async function broadcast() {
    const users = await User.find();
    const bets = await Bet.find().sort({ time: -1 });
    io.emit("sync", { users, bets, gameState });
}

// ======================
// HEALTH
// ======================
app.get("/", (req, res) => {
    res.send("GAME SERVER RUNNING");
});

// ======================
// USER API（后台核心）
// ======================

// 创建用户
app.post("/admin/user/create", async (req, res) => {
    const user = await User.create({
        name: req.body.name,
        balance: req.body.balance || 0,
        roomId: uuid(),
        remark: req.body.remark || ""
    });

    await broadcast();
    res.json(user);
});

// 更新用户
app.post("/admin/user/update", async (req, res) => {
    const user = await User.findOne({ systemId: req.body.systemId });
    if (!user) return res.json({ error: "not found" });

    user.name = req.body.name;
    user.balance = req.body.balance;
    user.remark = req.body.remark;
    user.chipLink = req.body.chipLink;

    await user.save();
    await broadcast();

    res.json(user);
});

// 删除用户
app.post("/admin/user/delete", async (req, res) => {
    await User.deleteOne({ systemId: req.body.systemId });
    await broadcast();
    res.json({ success: true });
});

// ======================
// 房间登录（4位密码）
// ======================
app.post("/login", async (req, res) => {
    const user = await User.findOne({ password: req.body.password });

    if (!user) return res.json({ success: false });

    res.json({
        success: true,
        user
    });
});

// ======================
// 下注（保持UI兼容）
// ======================
app.post("/api/bet", async (req, res) => {
    const user = await User.findOne({ systemId: req.body.userId });
    if (!user) return res.json({ success: false });

    if (user.balance < req.body.amount)
        return res.json({ success: false });

    user.balance -= req.body.amount;
    await user.save();

    await Bet.create({
        userId: user.systemId,
        option: req.body.option,
        amount: req.body.amount,
        result: "pending",
        balanceAfter: user.balance
    });

    await broadcast();
    res.json({ success: true });
});

// ======================
// 开奖（后台统一）
// ======================
app.post("/admin/open", async (req, res) => {
    const result = req.body.result;

    const bets = await Bet.find({ result: "pending" });

    for (let b of bets) {
        const user = await User.findOne({ systemId: b.userId });

        if (b.option === result) {
            const win = b.amount * 2;
            user.balance += win;

            b.result = "win";
            b.balanceAfter = user.balance;

            await user.save();
        } else {
            b.result = "lose";
        }

        await b.save();
    }

    await broadcast();
    res.json({ success: true });
});

// ======================
server.listen(process.env.PORT || 3000, () => {
    console.log("SERVER READY");
});
