const mongoose = require("mongoose");
const mongodb_url = "mongodb+srv://vedroh123:vedroh123@cluster1.omdsyen.mongodb.net/Comp_Dept";


mongoose.set('strictQuery',false);

const dbconnection = mongoose.connect(mongodb_url,(err)=>{
    if(err) console.log(`unable to connect to server : ${err}`)
    else
    console.log("Connected Successfully to Database");
})

module.exports=dbconnection;