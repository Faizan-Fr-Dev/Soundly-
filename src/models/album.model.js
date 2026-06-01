const mongoose = require('mongoose');

const albumSchema =  new mongoose.Schema({
title:{
type:String,
    required:true
},
musics:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"musics",
}],

artist:{
type:mongoose.Schema.Types.ObjectId,
ref:"user",
required:true
}




})

const albumModel = mongoose.model("albums",albumSchema)

module.exports= albumModel
