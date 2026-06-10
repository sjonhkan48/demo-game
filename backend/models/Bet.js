const mongoose = require("mongoose");

const betSchema = new mongoose.Schema({
  playerId: String,
  area: String,
  amount: Number,
  result: { type: String, default: "pending" },
  settled: { type: Boolean, default: false }, // 新增，标记是否结算
}, { timestamps: true });

module.exports = mongoose.model("Bet", betSchema);
