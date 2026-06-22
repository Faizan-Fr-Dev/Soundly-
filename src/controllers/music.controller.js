const musicModel = require("../models/music.model");
const userModel = require("../models/user.model");
const albumModel = require("../models/album.model");
const playlistModel = require("../models/playlist.model");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { uploadFile } = require("../services/storage.service");
const crypto = require("crypto");

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── Client-side direct upload: auth endpoint ──────────────────────────
// Returns { token, expire, signature } so the browser can upload straight
// to ImageKit without routing files through this server.
function getImageKitAuth(req, res) {
  try {
    const privateKey = process.env.IMAGE_KIT_KEY;
    const token = crypto.randomUUID();
    const expire = Math.floor(Date.now() / 1000) + 2400; // 40 min window
    const signature = crypto
      .createHmac("sha1", privateKey)
      .update(token + expire)
      .digest("hex");

    return res.json({ token, expire, signature });
  } catch (error) {
    console.error("ImageKit auth error:", error);
    return res.status(500).json({ message: "Failed to generate auth params" });
  }
}

// ─── Client-side direct upload: save track metadata ────────────────────
// The browser already uploaded the file to ImageKit. This endpoint just
// saves the resulting URL + title + artist to MongoDB. No file data passes
// through the server → zero upload time on the server side.
async function createMusicDirect(req, res) {
  try {
    const { title, musicUrl, coverUrl } = req.body;

    if (!title || !musicUrl) {
      return res.status(400).json({ message: "title and musicUrl are required" });
    }

    const music = await musicModel.create({
      uri: musicUrl,
      coverImage: coverUrl || undefined,
      title,
      artist: req.user.id,
    });

    return res.status(200).json({
      message: "Music created successfully!",
      music: {
        id: music._id,
        uri: music.uri,
        coverImage: music.coverImage,
        title: music.title,
        artist: music.artist,
      },
    });
  } catch (error) {
    console.error("Direct save error:", error);
    return res.status(500).json({ message: error.message || "Save failed" });
  }
}

// ─── Legacy server-side upload (kept as fallback) ──────────────────────
async function createMusic(req, res) {
  try {
    const startTime = Date.now();
    const { title } = req.body;
    const file = req.files?.music?.[0];
    const cover = req.files?.cover?.[0];

    if (!file) {
      return res.status(400).json({ message: "Music file is required" });
    }

    console.log(`[Upload] Starting upload for "${title}" — music: ${(file.buffer.length / 1024 / 1024).toFixed(1)}MB${cover ? `, cover: ${(cover.buffer.length / 1024).toFixed(0)}KB` : ""}`);

    // Upload music and cover in PARALLEL (not sequentially).
    // Pass raw buffers — storage service converts them via SDK's toFile().
    const [result, coverResult] = await Promise.all([
      uploadFile(file.buffer, {
        prefix: "music",
        folder: "/music",
      }),
      cover
        ? uploadFile(cover.buffer, {
            prefix: "song_cover",
            folder: "/music/covers",
          })
        : Promise.resolve(null),
    ]);

    const music = await musicModel.create({
      uri: result.url,
      coverImage: coverResult?.url,
      title,
      artist: req.user.id,
    });

    console.log(`[Upload] Completed "${title}" in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

    return res.status(200).json({
      message: "Music created successfully!",
      music: {
        id: music._id,
        uri: music.uri,
        coverImage: music.coverImage,
        title: music.title,
        artist: music.artist,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ message: error.message || "Upload failed" });
  }
}


async function createAlbum(req, res) {
  try {
    const { title, musics } = req.body;
    const cover = req.files?.cover?.[0];
    const requestedSongs = Array.isArray(musics)
      ? musics
      : String(musics || "")
          .split(",");

    const songInputs = requestedSongs
      .map((song) => String(song).trim())
      .filter(Boolean);

    if (!songInputs.length) {
      return res.status(400).json({
        message: "Please provide at least one song name for this album",
      });
    }

    const songIds = songInputs.filter((song) => mongoose.Types.ObjectId.isValid(song));
    const songNames = songInputs.filter((song) => !mongoose.Types.ObjectId.isValid(song));

    const songFilters = [];

    if (songIds.length) {
      songFilters.push({ _id: { $in: songIds } });
    }

    if (songNames.length) {
      songFilters.push({
        title: {
          $in: songNames.map((songName) => new RegExp(`^${escapeRegExp(songName)}$`, "i")),
        },
      });
    }

    const matchedSongs = await musicModel
      .find({
        artist: req.user.id,
        $or: songFilters,
      })
      .select("_id title");

    const matchedTitles = matchedSongs.map((song) => song.title.toLowerCase());
    const missingSongs = songNames.filter((songName) => !matchedTitles.includes(songName.toLowerCase()));

    if (missingSongs.length) {
      return res.status(404).json({
        message: `Song not found for this artist: ${missingSongs.join(", ")}`,
      });
    }

    const coverResult = cover
      ? await uploadFile(cover.buffer, {
          prefix: "album_cover",
          folder: "/music/album-covers",
        })
      : null;

    const album = await albumModel.create({
      title,
      coverImage: coverResult?.url,
      artist: req.user.id,
      musics: matchedSongs.map((song) => song._id)
    });

    return res.status(200).json({
      message: "Album created successfully!",
      album: {
        id: album._id,
        title: album.title,
        coverImage: album.coverImage,
        artist: album.artist,
        musics: album.musics
      },
    });
  } catch (error) {
    console.error("Album creation error:", error);
    return res.status(500).json({ message: error.message || "Album creation failed" });
  }
}


async function getAllMusics(req,res){
  const q = String(req.query.q || "").trim();
  const filter = {};

  if (q) {
    const regex = new RegExp(escapeRegExp(q), "i");

    // Try to match by artist username as well as title
    const matchedUsers = await userModel.find({ username: regex }).select("_id");
    const userIds = matchedUsers.map((u) => u._id);

    filter.$or = [{ title: regex }];
    if (userIds.length) {
      filter.$or.push({ artist: { $in: userIds } });
    }
  }

  const musics = await musicModel.find(filter).populate("artist","username email");

  res.status(200).json({ message: "Musics Fetched Successfully!!", musics: musics });
}  

async function getAlbums(req,res){
 const albums = await albumModel.find().select("title coverImage artist musics").populate("artist","username email")


  res.status(200).json({message:"Albums Fetched Successfully!!", 
    albums:albums})
}  

async function getAlbumById(req,res){
const albumId = req.params.albumId
const album = await albumModel
  .findById(albumId)
  .select("title coverImage artist musics")
  .populate("artist","username email")
  .populate({
    path: "musics",
    select: "title uri coverImage artist",
    populate: {
      path: "artist",
      select: "username email",
    },
  })

  if (!album) {
    return res.status(404).json({ message: "Album not found" })
  }


  res.status(200).json({message:"Album Fetched Successfully!!", 
    album:album})
}

// ─── Delete a track (artist-only, must own the track) ──────────────────
async function deleteMusic(req, res) {
  try {
    const trackId = req.params.trackId;
    const track = await musicModel.findById(trackId);

    if (!track) {
      return res.status(404).json({ message: "Track not found" });
    }

    // Ensure the artist owns this track
    if (track.artist.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own tracks" });
    }

    // Remove the track from any albums that reference it
    await albumModel.updateMany(
      { musics: trackId },
      { $pull: { musics: trackId } }
    );

    await musicModel.findByIdAndDelete(trackId);

    return res.status(200).json({ message: "Track deleted successfully" });
  } catch (error) {
    console.error("Delete track error:", error);
    return res.status(500).json({ message: error.message || "Failed to delete track" });
  }
}

// ─── Delete an album (artist-only, must own the album) ─────────────────
async function deleteAlbum(req, res) {
  try {
    const albumId = req.params.albumId;
    const album = await albumModel.findById(albumId);

    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }

    // Ensure the artist owns this album
    if (album.artist.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own albums" });
    }

    await albumModel.findByIdAndDelete(albumId);

    return res.status(200).json({ message: "Album deleted successfully" });
  } catch (error) {
    console.error("Delete album error:", error);
    return res.status(500).json({ message: error.message || "Failed to delete album" });
  }
}

// ─── Playlist CRUD (any logged-in user) ────────────────────────────────
async function createPlaylist(req, res) {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Playlist title is required" });
    }

    const playlist = await playlistModel.create({
      title: title.trim(),
      user: req.user.id,
      musics: [],
    });

    return res.status(200).json({
      message: "Playlist created successfully!",
      playlist,
    });
  } catch (error) {
    console.error("Create playlist error:", error);
    return res.status(500).json({ message: error.message || "Failed to create playlist" });
  }
}

async function getPlaylists(req, res) {
  try {
    const playlists = await playlistModel
      .find({ user: req.user.id })
      .select("title musics createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({ message: "Playlists fetched!", playlists });
  } catch (error) {
    console.error("Get playlists error:", error);
    return res.status(500).json({ message: error.message || "Failed to fetch playlists" });
  }
}

async function getPlaylistById(req, res) {
  try {
    const playlist = await playlistModel
      .findOne({ _id: req.params.id, user: req.user.id })
      .populate({
        path: "musics",
        select: "title uri coverImage artist",
        populate: { path: "artist", select: "username email" },
      });

    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    return res.status(200).json({ message: "Playlist fetched!", playlist });
  } catch (error) {
    console.error("Get playlist error:", error);
    return res.status(500).json({ message: error.message || "Failed to fetch playlist" });
  }
}

async function addToPlaylist(req, res) {
  try {
    const { musicId } = req.body;
    if (!musicId) {
      return res.status(400).json({ message: "musicId is required" });
    }

    const playlist = await playlistModel.findOne({ _id: req.params.id, user: req.user.id });
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    // Avoid duplicates
    if (playlist.musics.some((id) => id.toString() === musicId)) {
      return res.status(400).json({ message: "Song already in playlist" });
    }

    playlist.musics.push(musicId);
    await playlist.save();

    return res.status(200).json({ message: "Song added to playlist!", playlist });
  } catch (error) {
    console.error("Add to playlist error:", error);
    return res.status(500).json({ message: error.message || "Failed to add song" });
  }
}

async function removeFromPlaylist(req, res) {
  try {
    const { musicId } = req.body;
    if (!musicId) {
      return res.status(400).json({ message: "musicId is required" });
    }

    const playlist = await playlistModel.findOne({ _id: req.params.id, user: req.user.id });
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    playlist.musics = playlist.musics.filter((id) => id.toString() !== musicId);
    await playlist.save();

    return res.status(200).json({ message: "Song removed from playlist!", playlist });
  } catch (error) {
    console.error("Remove from playlist error:", error);
    return res.status(500).json({ message: error.message || "Failed to remove song" });
  }
}

async function deletePlaylist(req, res) {
  try {
    const playlist = await playlistModel.findOne({ _id: req.params.id, user: req.user.id });
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    await playlistModel.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Playlist deleted successfully" });
  } catch (error) {
    console.error("Delete playlist error:", error);
    return res.status(500).json({ message: error.message || "Failed to delete playlist" });
  }
}

// ─── YouTube search (proxy to YouTube Data API v3) ─────────────────────
async function searchYouTube(req, res) {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) {
      return res.status(200).json({ results: [] });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ results: [], note: "YouTube API key not configured" });
    }

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=8&q=${encodeURIComponent(q + " music")}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error("YouTube API error:", data.error?.message || data);
      return res.status(200).json({ results: [] });
    }

    const results = (data.items || []).map((item) => ({
      youtubeId: item.id.videoId,
      title: item.snippet.title
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'"),
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      publishedAt: item.snippet.publishedAt,
    }));

    return res.status(200).json({ results });
  } catch (error) {
    console.error("YouTube search error:", error);
    return res.status(200).json({ results: [] });
  }
}

module.exports = { createMusic, createMusicDirect, createAlbum, getAllMusics, getAlbums, getAlbumById, getImageKitAuth, deleteMusic, deleteAlbum, createPlaylist, getPlaylists, getPlaylistById, addToPlaylist, removeFromPlaylist, deletePlaylist, searchYouTube };
