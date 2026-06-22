const mongoose = require("mongoose");

const playlistSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  musics: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "music",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const playlistModel = mongoose.model("playlist", playlistSchema);

module.exports = playlistModel;
