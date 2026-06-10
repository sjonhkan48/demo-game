const mongoose=require("mongoose")


const betSchema=new mongoose.Schema({


playerId:{
type:String,
required:true
},


area:{
type:String,
required:true
},


amount:{
type:Number,
required:true
},


// pending win lose

result:{
type:String,
default:"pending"
},


// 实际返还

reward:{
type:Number,
default:0
},


// 结算金额

settlement:{
type:Number,
default:0
},


createdAt:{
type:Date,
default:Date.now
}



})


module.exports =
mongoose.models.Bet ||
mongoose.model("Bet",betSchema)
