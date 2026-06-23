const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const { v4: uuid } = require("uuid");
const axios = require("axios");

const app = express();

app.use(cors({
    origin: [
        "https://demo-game-2.onrender.com",
        "https://demo-game-3.onrender.com"
    ],
    credentials: true
}));

app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

const MONGO_URL = process.env.MONGO_URL;

mongoose.connect(MONGO_URL)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log(err));

const UserSchema = new mongoose.Schema({
    systemId: { type: String, default: uuid },
    name: String,
    balance: { type: Number, default: 0 },
    password: String,
    remark: String,
    roomId: String,
    link: String
});

const RecordSchema = new mongoose.Schema({
    userId: String,
    option: String,
    amount: Number,
    result: String,
    balanceAfter: Number,
    time: { type: Date, default: Date.now }
});

const CollectorSchema = new mongoose.Schema({
    roomId: String,
    url: String,
    name: String,
    enabled: Boolean,
    lastData: Object
});

const User = mongoose.model("User", UserSchema);
const Record = mongoose.model("Record", RecordSchema);
const Collector = mongoose.model("Collector", CollectorSchema);

io.on("connection", (socket) => {
    socket.on("join-room", (roomId) => {
        socket.join(roomId);
    });
});

app.get("/", (req, res) => {
    res.send("SERVER RUNNING");
});

app.post("/admin/user/add", async (req, res) => {
    const user = await User.create(req.body);
    res.json({ success: true, user });
});

app.get("/admin/users", async (req, res) => {
    res.json(await User.find());
});

app.post("/admin/collector/add", async (req, res) => {
    const c = await Collector.create(req.body);
    res.json({ success: true, c });
});

app.get("/admin/collector/list", async (req, res) => {
    res.json(await Collector.find());
});

async function runCrawler() {
    const list = await Collector.find({ enabled: true });

    for (let c of list) {
        try {
            const res = await axios.get(c.url);

            const data = {
                time: Date.now(),
                result: "OK"
            };

            c.lastData = data;
            await c.save();

            io.to(c.roomId).emit("collector-update", data);

        } catch (e) {
            console.log(e.message);
        }
    }
}

setInterval(runCrawler, 5000);

server.listen(process.env.PORT || 3000, () => {
    console.log("RUNNING");
});
