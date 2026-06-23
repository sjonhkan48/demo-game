const express = require("express");
const cors = require("cors");
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

// ===== Mongo =====
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("Mongo Connected"))
  .catch(err => console.log(err));

// ===== Routes =====
app.use("/api/users", require("./routes/users"));
app.use("/api/rooms", require("./routes/rooms"));
app.use("/api/records", require("./routes/records"));

// ===== Health =====
app.get("/", (req, res) => {
  res.send("SYSTEM RUNNING");
});

// ===== Socket =====
io.on("connection", (socket) => {
  console.log("client connected");
});

global.io = io;

// ===== Start =====
server.listen(process.env.PORT || 3000, () => {
  console.log("server running");
});
