const express = require('express');
const musicController = require("../controllers/music.controller")
const authMiddleware = require("../middlewares/auth.middleware")

const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage()
})

const router = express.Router();

// ─── Client-side direct upload routes ──────────────────────────────────
// 1. Browser calls this to get { token, expire, signature }
router.get("/imagekit-auth", authMiddleware.authUser, musicController.getImageKitAuth);

// 2. After uploading to ImageKit, browser sends the URLs here to save
router.post("/upload-direct", authMiddleware.authArtist, musicController.createMusicDirect);

// ─── Legacy server-side upload (kept as fallback) ──────────────────────
router.post(
    "/upload",
    authMiddleware.authArtist,
    upload.fields([
        { name: "music", maxCount: 1 },
        { name: "cover", maxCount: 1 },
    ]),
    musicController.createMusic
)
router.post(
    "/album",
    authMiddleware.authArtist,
    upload.fields([{ name: "cover", maxCount: 1 }]),
    musicController.createAlbum
)

router.get("/", musicController.getAllMusics )
router.get("/albums", musicController.getAlbums )
router.get("/albums/:albumId", musicController.getAlbumById )

// ─── Delete routes (artist-only) ───────────────────────────────────────
router.delete("/:trackId", authMiddleware.authArtist, musicController.deleteMusic)
router.delete("/albums/:albumId", authMiddleware.authArtist, musicController.deleteAlbum)

// ─── Playlist routes (any logged-in user) ──────────────────────────────
router.post("/playlists", authMiddleware.authUser, musicController.createPlaylist)
router.get("/playlists", authMiddleware.authUser, musicController.getPlaylists)
router.get("/playlists/:id", authMiddleware.authUser, musicController.getPlaylistById)
router.put("/playlists/:id/add", authMiddleware.authUser, musicController.addToPlaylist)
router.delete("/playlists/:id/remove", authMiddleware.authUser, musicController.removeFromPlaylist)
router.delete("/playlists/:id", authMiddleware.authUser, musicController.deletePlaylist)



// ─── YouTube search (proxy) ────────────────────────────────────────────
router.get("/youtube-search", authMiddleware.authUser, musicController.searchYouTube);

module.exports = router;
