import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { upload as imagekitUpload } from "@imagekit/javascript";
import {
  Album,
  ChevronLeft,
  ChevronRight,
  Disc3,
  Home,
  Library,
  ListMusic,
  Loader2,
  LogOut,
  Menu,
  Moon,
  Music2,
  Palette,
  Play,
  Pause,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Stars,
  Sun,
  Sunset,
  Trash2,
  Upload,
  UserRound,
  Waves,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  X,
  Youtube,
} from "lucide-react";
import "./styles.css";

const initialAuth = JSON.parse(localStorage.getItem("soundly-user") || "null");

const IMAGEKIT_PUBLIC_KEY = "public_Sn0fjUUewu0K9mWGHmf7+B1v2p8=";

// ─── Theme definitions ─────────────────────────────────────────────────
const THEMES = [
  { id: "dark", label: "Dark", icon: Moon },
  { id: "midnight", label: "Midnight", icon: Stars },
  { id: "sunset", label: "Sunset", icon: Sunset },
  { id: "ocean", label: "Ocean", icon: Waves },
  { id: "light", label: "Light", icon: Sun },
];

// ─── Online status hook ────────────────────────────────────────────────
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 4000);
    }
    function handleOffline() {
      setIsOnline(false);
      setShowReconnected(false);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline, showReconnected };
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "include",
    headers: options.body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Something went wrong");
  }

  return payload;
}

function App() {
  const [activeView, setActiveView] = useState("home");
  const [authMode, setAuthMode] = useState("login");
  const [authOpen, setAuthOpen] = useState(!initialAuth);
  const [currentUser, setCurrentUser] = useState(initialAuth);
  const [tracks, setTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState({ tracks: false, albums: false, album: false, auth: false, upload: false });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [query, setQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [youtubeResults, setYoutubeResults] = useState([]);
  const audioRef = useRef(null);
  const tracksRef = useRef(null);
  const ytIframeRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(Number(localStorage.getItem("soundly-volume") || "80"));
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showTrackDetail, setShowTrackDetail] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);

  // ─── Playlist state ──────────────────────────────────────────────────
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [addToPlaylistTrack, setAddToPlaylistTrack] = useState(null);

  // ─── Settings state ──────────────────────────────────────────────────
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("soundly-theme") || "dark");

  // ─── Network status ──────────────────────────────────────────────────
  const { isOnline, showReconnected } = useOnlineStatus();

  const isListener = currentUser?.role === "user" || currentUser?.role === "artist";
  const isArtist = currentUser?.role === "artist";

  // Apply theme to document
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("soundly-theme", theme);

    // Update Favicon dynamically to match theme logo
    const colors = {
      dark: { accent: "#1ed760", eyebrow: "#6ee7a8" },
      midnight: { accent: "#7c5cfc", eyebrow: "#a78bfa" },
      sunset: { accent: "#f97316", eyebrow: "#fdba74" },
      ocean: { accent: "#06b6d4", eyebrow: "#67e8f9" },
      light: { accent: "#16a34a", eyebrow: "#16a34a" },
    };
    const activeColors = colors[theme] || colors.dark;
    
    const svgStr = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="${activeColors.accent}" />
    <stop offset="100%" stop-color="${activeColors.eyebrow}" />
  </linearGradient>
  <circle cx="50" cy="50" r="44" fill="#121318" stroke="url(#g)" stroke-width="6" />
  <circle cx="50" cy="50" r="36" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1.2" stroke-dasharray="8 4" />
  <circle cx="50" cy="50" r="30" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1.2" />
  <circle cx="50" cy="50" r="24" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1.2" stroke-dasharray="12 6" />
  <circle cx="50" cy="50" r="18" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1.2" />
  <path d="M 22 50 A 28 28 0 0 1 50 22" stroke="url(#g)" stroke-width="4" stroke-linecap="round" opacity="0.8" />
  <path d="M 78 50 A 28 28 0 0 1 50 78" stroke="url(#g)" stroke-width="4" stroke-linecap="round" opacity="0.8" />
  <circle cx="50" cy="50" r="12" fill="url(#g)" />
  <circle cx="50" cy="50" r="3.5" fill="#121318" />
</svg>
`.trim();

    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.getElementsByTagName("head")[0].appendChild(link);
    }
    link.type = "image/svg+xml";
    link.href = `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`;
  }, [theme]);

  const filteredTracks = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return tracks;
    return tracks.filter((track) => {
      const artistName = track.artist?.username || "";
      return `${track.title} ${artistName}`.toLowerCase().includes(search);
    });
  }, [query, tracks]);

  function showNotice(message) {
    setNotice(message);
    window.clearTimeout(showNotice.timer);
    showNotice.timer = window.setTimeout(() => setNotice(""), 4200);
  }

  async function loadTracks() {
    if (!currentUser) { setTracks([]); return; }
    setLoading((v) => ({ ...v, tracks: true }));
    try {
      const data = await api("/api/music");
      setTracks(data.musics || []);
    } catch (error) {
      showNotice(!navigator.onLine ? "You're offline — can't load tracks" : error.message);
    } finally {
      setLoading((v) => ({ ...v, tracks: false }));
    }
  }

  async function loadAlbums() {
    if (!currentUser) { setAlbums([]); return; }
    setLoading((v) => ({ ...v, albums: true }));
    try {
      const data = await api("/api/music/albums");
      setAlbums(data.albums || []);
      setSelectedAlbum(null);
    } catch (error) {
      showNotice(!navigator.onLine ? "You're offline — can't load albums" : error.message);
    } finally {
      setLoading((v) => ({ ...v, albums: false }));
    }
  }

  async function loadPlaylists() {
    if (!currentUser) { setPlaylists([]); return; }
    try {
      const data = await api("/api/music/playlists");
      setPlaylists(data.playlists || []);
    } catch (error) {
      if (navigator.onLine) showNotice(error.message);
    }
  }

  async function openPlaylist(playlist) {
    try {
      const data = await api(`/api/music/playlists/${playlist._id || playlist.id}`);
      setSelectedPlaylist(data.playlist);
    } catch (error) { showNotice(error.message); }
  }

  async function openAlbum(album) {
    try {
      const data = await api(`/api/music/albums/${album._id || album.id}`);
      setSelectedAlbum(data.album);
    } catch (error) { showNotice(error.message); }
  }

  async function handleCreatePlaylist(title) {
    try {
      await api("/api/music/playlists", { method: "POST", body: JSON.stringify({ title }) });
      showNotice("Playlist created!");
      loadPlaylists();
      setShowCreatePlaylist(false);
    } catch (error) { showNotice(error.message); }
  }

  async function handleAddToPlaylist(playlistId, musicId) {
    try {
      await api(`/api/music/playlists/${playlistId}/add`, { method: "PUT", body: JSON.stringify({ musicId }) });
      showNotice("Song added to playlist!");
      setAddToPlaylistTrack(null);
      if (selectedPlaylist && (selectedPlaylist._id === playlistId || selectedPlaylist.id === playlistId)) openPlaylist(selectedPlaylist);
    } catch (error) { showNotice(error.message); }
  }

  async function handleRemoveFromPlaylist(playlistId, musicId) {
    try {
      await api(`/api/music/playlists/${playlistId}/remove`, { method: "DELETE", body: JSON.stringify({ musicId }) });
      showNotice("Song removed from playlist!");
      if (selectedPlaylist) openPlaylist(selectedPlaylist);
    } catch (error) { showNotice(error.message); }
  }

  async function handleDeletePlaylist(playlistId) {
    if (!window.confirm("Are you sure you want to delete this playlist?")) return;
    try {
      await api(`/api/music/playlists/${playlistId}`, { method: "DELETE" });
      showNotice("Playlist deleted!");
      setSelectedPlaylist(null);
      loadPlaylists();
    } catch (error) { showNotice(error.message); }
  }

  useEffect(() => {
    loadTracks();
    loadAlbums();
    loadPlaylists();
  }, [currentUser?.id, currentUser?.role]);

  // Debounced server-side search
  const searchTimerRef = useRef(null);
  useEffect(() => {
    if (!currentUser) return;
    window.clearTimeout(searchTimerRef.current);
    const q = query.trim();
    if (!q) return;

    searchTimerRef.current = window.setTimeout(async () => {
      if (!navigator.onLine) { showNotice("You're offline — search unavailable"); return; }
      setLoading((v) => ({ ...v, tracks: true }));
      try {
        const [localData, ytData] = await Promise.all([
          api(`/api/music?q=${encodeURIComponent(q)}`),
          api(`/api/music/youtube-search?q=${encodeURIComponent(q)}`).catch(() => ({ results: [] })),
        ]);
        setSearchResults(localData.musics || []);
        setYoutubeResults(ytData.results || []);
        setSearchActive(true);
      } catch (error) { showNotice(error.message); }
      finally { setLoading((v) => ({ ...v, tracks: false })); }
    }, 300);

    return () => window.clearTimeout(searchTimerRef.current);
  }, [query, currentUser?.id, currentUser?.role]);

  async function handleAuth(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = { username: form.get("username"), password: form.get("password") };
    if (authMode === "register") {
      payload.email = form.get("email");
      payload.role = form.get("role");
    }
    setLoading((v) => ({ ...v, auth: true }));
    try {
      const data = await api(`/api/auth/${authMode === "login" ? "login" : "register"}`, { method: "POST", body: JSON.stringify(payload) });
      setCurrentUser(data.user);
      localStorage.setItem("soundly-user", JSON.stringify(data.user));
      setAuthOpen(false);
      showNotice(data.message);
    } catch (error) { showNotice(error.message); }
    finally { setLoading((v) => ({ ...v, auth: false })); }
  }

  async function handleLogout() {
    try { await api("/api/auth/logout", { method: "POST" }); } catch {}
    localStorage.removeItem("soundly-user");
    setCurrentUser(null);
    setTracks([]); setAlbums([]); setPlaylists([]);
    setSelectedAlbum(null); setSelectedPlaylist(null); setSelectedTrack(null);
    setIsPlaying(false); setAuthOpen(true);
  }

  async function handleUpdateProfilePicture(imageUrl) {
    try {
      const data = await api("/api/auth/profile-picture", { method: "PUT", body: JSON.stringify({ profileImage: imageUrl }) });
      setCurrentUser(data.user);
      localStorage.setItem("soundly-user", JSON.stringify(data.user));
      showNotice("Profile picture updated!");
    } catch (error) { showNotice(error.message); }
  }

  const volumeRef = useRef(volume);
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds === null) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  }

  function playTrack(track) {
    setCurrentTime(0);
    setDuration(0);

    if (track.isYouTube) {
      if (audioRef.current) audioRef.current.pause();
    } else {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === "function") {
        ytPlayerRef.current.pauseVideo();
      }
    }

    setSelectedTrack(track);
    setIsPlaying(true);

    if (!track.isYouTube) {
      window.setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.volume = volume / 100;
          audioRef.current.muted = isMuted;
          audioRef.current.play().catch(() => {});
        }
      }, 50);
    }
  }

  function togglePlayForTrack(track) {
    const isSame = selectedTrack && (selectedTrack._id || selectedTrack.id) === (track._id || track.id);
    if (!isSame) {
      playTrack(track);
      return;
    }
    togglePlay();
  }

  function togglePlay() {
    if (selectedTrack?.isYouTube) {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.getPlayerState === "function") {
        const state = ytPlayerRef.current.getPlayerState();
        if (state === 1) { // playing
          ytPlayerRef.current.pauseVideo();
        } else {
          ytPlayerRef.current.playVideo();
        }
      }
    } else {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          audioRef.current.play().catch(() => {});
        }
      }
    }
  }

  const handleSeekChange = (e) => {
    const newTime = Number(e.target.value);
    setCurrentTime(newTime);
    if (!isSeeking) {
      if (selectedTrack?.isYouTube) {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
          ytPlayerRef.current.seekTo(newTime, true);
        }
      } else {
        if (audioRef.current) {
          audioRef.current.currentTime = newTime;
        }
      }
    }
  };

  const handleSeekEnd = (e) => {
    const newTime = Number(e.target.value);
    if (selectedTrack?.isYouTube) {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
        ytPlayerRef.current.seekTo(newTime, true);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.currentTime = newTime;
      }
    }
    setIsSeeking(false);
  };

  const handleClosePlayer = () => {
    if (audioRef.current) audioRef.current.pause();
    if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === "function") {
      ytPlayerRef.current.pauseVideo();
    }
    setSelectedTrack(null);
    setIsPlaying(false);
  };

  function openTrackDetail(track) { setSelectedTrack(track); setShowTrackDetail(true); }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (!selectedTrack?.isYouTube) {
        setCurrentTime(audio.currentTime);
      }
    };
    const handleDurationChange = () => {
      if (!selectedTrack?.isYouTube) {
        setDuration(audio.duration || 0);
      }
    };
    const handlePlay = () => {
      if (!selectedTrack?.isYouTube) setIsPlaying(true);
    };
    const handlePause = () => {
      if (!selectedTrack?.isYouTube) setIsPlaying(false);
    };
    const handleEnded = () => {
      if (!selectedTrack?.isYouTube) setIsPlaying(false);
    };
    const handleVolumeChange = () => {
      if (!selectedTrack?.isYouTube) {
        setVolume(Math.round(audio.volume * 100));
        setIsMuted(audio.muted);
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("volumechange", handleVolumeChange);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("volumechange", handleVolumeChange);
    };
  }, [selectedTrack, audioRef.current]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && !selectedTrack?.isYouTube) {
      const targetVolume = volume / 100;
      if (Math.abs(audio.volume - targetVolume) > 0.01) {
        audio.volume = targetVolume;
      }
      if (audio.muted !== isMuted) {
        audio.muted = isMuted;
      }
    }
  }, [volume, isMuted, selectedTrack]);

  useEffect(() => {
    if (!selectedTrack?.isYouTube || !isPlaying || isSeeking) return;

    const interval = setInterval(() => {
      const player = ytPlayerRef.current;
      if (player && typeof player.getCurrentTime === "function" && typeof player.getDuration === "function") {
        setCurrentTime(player.getCurrentTime());
        setDuration(player.getDuration() || 0);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [selectedTrack, isPlaying, isSeeking]);

  useEffect(() => {
    if (selectedTrack?.isYouTube && ytPlayerRef.current) {
      const player = ytPlayerRef.current;
      if (typeof player.getVolume === "function" && typeof player.setVolume === "function") {
        if (player.getVolume() !== volume) {
          player.setVolume(volume);
        }
      }
      if (typeof player.isMuted === "function") {
        const currentlyMuted = player.isMuted();
        if (currentlyMuted !== isMuted) {
          if (isMuted) {
            if (typeof player.mute === "function") player.mute();
          } else {
            if (typeof player.unMute === "function") player.unMute();
          }
        }
      }
    }
    localStorage.setItem("soundly-volume", volume.toString());
  }, [volume, isMuted, selectedTrack]);

  const selectedTrackRef = useRef(selectedTrack);
  useEffect(() => {
    selectedTrackRef.current = selectedTrack;
  }, [selectedTrack]);

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    let player;
    const initPlayer = () => {
      const placeholder = document.getElementById("youtube-player-placeholder");
      if (!placeholder) return;

      player = new window.YT.Player("youtube-player-placeholder", {
        host: "https://www.youtube-nocookie.com",
        height: "200",
        width: "200",
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            ytPlayerRef.current = event.target;
            if (selectedTrackRef.current?.isYouTube) {
              const player = event.target;
              player.loadVideoById({
                videoId: selectedTrackRef.current.youtubeId,
                startSeconds: 0
              });
              if (typeof player.setVolume === "function") {
                player.setVolume(volumeRef.current);
              }
              if (isMutedRef.current) {
                if (typeof player.mute === "function") player.mute();
              } else {
                if (typeof player.unMute === "function") player.unMute();
              }
              player.playVideo();
              setIsPlaying(true);
            }
          },
          onStateChange: (event) => {
            if (event.data === 1) {
              setIsPlaying(true);
            } else if (event.data === 2) {
              setIsPlaying(false);
            } else if (event.data === 0) {
              setIsPlaying(false);
            }
          }
        }
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkInterval);
          initPlayer();
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }
  }, []);

  useEffect(() => {
    if (!selectedTrack?.isYouTube) return;

    if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === "function") {
      const player = ytPlayerRef.current;
      player.loadVideoById({
        videoId: selectedTrack.youtubeId,
        startSeconds: 0
      });
      if (typeof player.setVolume === "function") {
        player.setVolume(volumeRef.current);
      }
      if (isMutedRef.current) {
        if (typeof player.mute === "function") player.mute();
      } else {
        if (typeof player.unMute === "function") player.unMute();
      }
      player.playVideo();
      setIsPlaying(true);
    }
  }, [selectedTrack?.youtubeId]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === "Space" || event.key === " ") {
        const active = document.activeElement;
        if (
          active &&
          (active.tagName === "INPUT" ||
            active.tagName === "TEXTAREA" ||
            active.tagName === "SELECT" ||
            active.isContentEditable)
        ) {
          return;
        }
        event.preventDefault();
        if (selectedTrack) {
          togglePlay();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTrack, isPlaying]);

  async function handleUpload(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = formData.get("title");
    const musicFile = formData.get("music");
    const coverFile = formData.get("cover");
    if (!musicFile || !musicFile.size) { showNotice("Please select an audio file"); return; }
    setLoading((v) => ({ ...v, upload: true }));
    setUploadProgress(0);
    try {
      const authRes = await api("/api/music/imagekit-auth");
      const musicUpload = imagekitUpload({ file: musicFile, fileName: `music_${Date.now()}_${musicFile.name}`, publicKey: IMAGEKIT_PUBLIC_KEY, token: authRes.token, signature: authRes.signature, expire: authRes.expire, folder: "/music", onProgress: (evt) => { if (evt.lengthComputable) setUploadProgress(Math.round((evt.loaded / evt.total) * 100)); } });
      let coverUpload = Promise.resolve(null);
      if (coverFile && coverFile.size) {
        const coverAuth = await api("/api/music/imagekit-auth");
        coverUpload = imagekitUpload({ file: coverFile, fileName: `cover_${Date.now()}_${coverFile.name}`, publicKey: IMAGEKIT_PUBLIC_KEY, token: coverAuth.token, signature: coverAuth.signature, expire: coverAuth.expire, folder: "/music/covers" });
      }
      const [musicResult, coverResult] = await Promise.all([musicUpload, coverUpload]);
      const data = await api("/api/music/upload-direct", { method: "POST", body: JSON.stringify({ title, musicUrl: musicResult.url, coverUrl: coverResult?.url || undefined }) });
      showNotice(`"${data.music.title}" uploaded successfully!`);
      form.reset();
    } catch (error) { showNotice(error.message || "Upload failed"); }
    finally { setLoading((v) => ({ ...v, upload: false })); setUploadProgress(0); }
  }

  async function handleAlbum(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = new FormData(form);
    const songNames = String(body.get("musics") || "").split(",").map((i) => i.trim()).filter(Boolean);
    try {
      body.set("musics", songNames.join(","));
      const data = await api("/api/music/album", { method: "POST", body });
      showNotice(`${data.album.title} album created.`);
      form.reset();
    } catch (error) { showNotice(error.message); }
  }

  async function handleDeleteTrack(trackId) {
    if (!window.confirm("Are you sure you want to delete this track?")) return;
    try { await api(`/api/music/${trackId}`, { method: "DELETE" }); showNotice("Track deleted successfully"); loadTracks(); } catch (error) { showNotice(error.message); }
  }

  async function handleDeleteAlbum(albumId) {
    if (!window.confirm("Are you sure you want to delete this album?")) return;
    try { await api(`/api/music/albums/${albumId}`, { method: "DELETE" }); showNotice("Album deleted successfully"); loadAlbums(); } catch (error) { showNotice(error.message); }
  }

  // ─── Library sub-tab state ──────────────────────────────────────────
  const [libraryTab, setLibraryTab] = useState("tracks");

  const pageTitle = activeView === "artist" ? "Artist Studio" : activeView === "library" ? "Your Library" : activeView === "playlists" ? "Your Playlists" : activeView === "settings" ? "Settings" : "Welcome to Soundly!!!";

  return (
    <>
      {/* Feature 3: Network connectivity banner */}
      <NetworkBanner isOnline={isOnline} showReconnected={showReconnected} />

      <div className="app-shell">
        <Sidebar activeView={activeView} setActiveView={setActiveView} isArtist={isArtist} isSignedIn={!!currentUser} />

        <main className="main">
          <header className="topbar">
            <div>
              <h2 className="Greeting-text">{pageTitle}</h2>
            </div>
            <div className="account">
              <div className="search">
                <Search size={17} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={isOnline ? "Search tracks" : "Offline…"}
                  disabled={!isOnline}
                />
                {(searchActive || query.trim()) && (
                  <button className="search-clear-btn" onClick={() => { setSearchActive(false); setQuery(""); setSearchResults([]); setYoutubeResults([]); loadTracks(); }} type="button" title="Clear search">
                    <X size={16} />
                  </button>
                )}
              </div>
              {currentUser ? (
                <>
                  <ProfilePictureChip currentUser={currentUser} onUpdateProfilePicture={handleUpdateProfilePicture} showNotice={showNotice} />
                  <button className="ghost-button icon-label" onClick={handleLogout} type="button">
                    <LogOut size={17} /> Logout
                  </button>
                </>
              ) : (
                <button className="primary-button" onClick={() => setAuthOpen(true)} type="button">Sign in</button>
              )}
            </div>
          </header>

          {/* Feature 4: Hero Carousel (only when not searching and on home) */}
          {!query.trim() && activeView === "home" ? (
            <HeroCarousel
              onBrowse={() => { setActiveView("home"); setTimeout(() => tracksRef.current?.scrollIntoView({ behavior: "smooth" }), 100); }}
              onStudio={() => setActiveView("artist")}
            />
          ) : query.trim() ? (
            (() => {
              const localSearchTracks = searchActive ? searchResults : filteredTracks;
              const hasLocalTracks = localSearchTracks.length > 0;
              const hasYoutubeTracks = youtubeResults.length > 0;

              if (!hasLocalTracks && hasYoutubeTracks) {
                return (
                  <>
                    <div className="search-info-banner">
                      <p>
                        No uploaded tracks found matching "<strong>{query}</strong>". Showing YouTube results below:
                      </p>
                    </div>
                    <YouTubeResultsSection
                      results={youtubeResults}
                      onPlay={(yt) =>
                        togglePlayForTrack({
                          _id: `yt_${yt.youtubeId}`,
                          title: yt.title,
                          artist: { username: yt.channel },
                          coverImage: yt.thumbnail,
                          isYouTube: true,
                          youtubeId: yt.youtubeId,
                        })
                      }
                      selectedTrack={selectedTrack}
                      isPlaying={isPlaying}
                    />
                  </>
                );
              }

              return (
                <>
                  <MusicView
                    isListener={isListener}
                    loading={loading.tracks}
                    tracks={localSearchTracks}
                    onRefresh={loadTracks}
                    onTogglePlay={togglePlayForTrack}
                    selectedTrack={selectedTrack}
                    isPlaying={isPlaying}
                    onOpenDetail={openTrackDetail}
                    onOpenAuth={() => setAuthOpen(true)}
                    onAddToPlaylist={setAddToPlaylistTrack}
                    currentUser={currentUser}
                    isSearching={true}
                  />
                  {hasYoutubeTracks && (
                    <YouTubeResultsSection
                      results={youtubeResults}
                      onPlay={(yt) =>
                        togglePlayForTrack({
                          _id: `yt_${yt.youtubeId}`,
                          title: yt.title,
                          artist: { username: yt.channel },
                          coverImage: yt.thumbnail,
                          isYouTube: true,
                          youtubeId: yt.youtubeId,
                        })
                      }
                      selectedTrack={selectedTrack}
                      isPlaying={isPlaying}
                    />
                  )}
                </>
              );
            })()
          ) : null}

          {notice && <section className="notice">{notice}</section>}

          {activeView === "home" && !searchActive && (
            <>
              <div ref={tracksRef}>
                <MusicView isListener={isListener} loading={loading.tracks} tracks={filteredTracks} onRefresh={loadTracks} onTogglePlay={togglePlayForTrack} selectedTrack={selectedTrack} isPlaying={isPlaying} onOpenDetail={openTrackDetail} onOpenAuth={() => setAuthOpen(true)} currentUser={currentUser} onDelete={handleDeleteTrack} onAddToPlaylist={setAddToPlaylistTrack} isSearching={!!query.trim()} />
              </div>
              <HomeAlbumsSection isListener={isListener} loading={loading.albums} albums={albums} onSelectAlbum={(album) => { setActiveView("library"); openAlbum(album); }} onRefresh={loadAlbums} onOpenAuth={() => setAuthOpen(true)} currentUser={currentUser} onDelete={handleDeleteAlbum} />
            </>
          )}

          {activeView === "library" && (
            <LibraryView
              isListener={isListener}
              loading={loading}
              tracks={filteredTracks}
              albums={albums}
              selectedAlbum={selectedAlbum}
              onRefreshTracks={loadTracks}
              onRefreshAlbums={loadAlbums}
              onSelectAlbum={openAlbum}
              onBack={() => setSelectedAlbum(null)}
              onPlay={togglePlayForTrack}
              onOpenAuth={() => setAuthOpen(true)}
              currentUser={currentUser}
              onDeleteTrack={handleDeleteTrack}
              onDeleteAlbum={handleDeleteAlbum}
              selectedTrack={selectedTrack}
              isPlaying={isPlaying}
              onOpenDetail={openTrackDetail}
              onAddToPlaylist={setAddToPlaylistTrack}
              libraryTab={libraryTab}
              setLibraryTab={setLibraryTab}
              query={query}
            />
          )}

          {activeView === "playlists" && (
            <PlaylistView isListener={isListener} playlists={playlists} selectedPlaylist={selectedPlaylist} onRefresh={loadPlaylists} onSelectPlaylist={openPlaylist} onBack={() => setSelectedPlaylist(null)} onPlay={togglePlayForTrack} onOpenAuth={() => setAuthOpen(true)} onCreateNew={() => setShowCreatePlaylist(true)} onDelete={handleDeletePlaylist} onRemoveSong={handleRemoveFromPlaylist} selectedTrack={selectedTrack} isPlaying={isPlaying} />
          )}

          {activeView === "artist" && (
            <ArtistView isArtist={isArtist} loading={loading.upload} uploadProgress={uploadProgress} onUpload={handleUpload} onAlbum={handleAlbum} onOpenAuth={() => { setAuthMode("register"); setAuthOpen(true); }} />
          )}

          {activeView === "settings" && (
            <SettingsView
              theme={theme}
              setTheme={setTheme}
              currentUser={currentUser}
              onUpdateProfilePicture={handleUpdateProfilePicture}
              showNotice={showNotice}
            />
          )}
        </main>
      </div>

      <footer className="player" style={{ display: selectedTrack ? undefined : "none" }}>
        <div className="player-track">
          {selectedTrack?.isYouTube ? (
            <div className="yt-player-thumb">
              <img src={selectedTrack.coverImage} alt={selectedTrack.title} />
              <Youtube size={14} className="yt-badge-mini" />
            </div>
          ) : (
            <CoverArt className="tiny" imageUrl={selectedTrack?.coverImage} />
          )}
          <div className="player-track-info">
            <strong>{selectedTrack?.title || "Choose a track"}</strong>
            <span>{selectedTrack?.artist?.username || "Nothing playing yet"}</span>
          </div>
        </div>

        {selectedTrack?.isYouTube ? (
          <div className="yt-controls-container">
            <button className="yt-native-btn yt-play-btn" onClick={togglePlay} type="button" title={isPlaying ? "Pause" : "Play"}>
              {isPlaying ? <Pause size={18} fill="black" /> : <Play size={18} fill="black" />}
            </button>
            <span className="yt-native-time">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeekChange}
              onMouseDown={() => setIsSeeking(true)}
              onTouchStart={() => setIsSeeking(true)}
              onMouseUp={handleSeekEnd}
              onTouchEnd={handleSeekEnd}
              className="yt-native-scrubber"
            />
            <span className="yt-native-time">{formatTime(duration)}</span>
            <button className="yt-native-btn yt-mute-btn" onClick={() => setIsMuted(!isMuted)} type="button" title={isMuted ? "Unmute" : "Mute"}>
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} fill="black" />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(Number(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="yt-native-volume"
            />
          </div>
        ) : (
          <audio ref={audioRef} src={selectedTrack?.uri || null} controls />
        )}

        <button className="player-close-btn" onClick={handleClosePlayer} type="button" title="Close player">
          <X size={18} />
        </button>

        <div className="youtube-player-hidden">
          <div id="youtube-player-placeholder" />
        </div>
      </footer>

      <AuthModal open={authOpen} mode={authMode} loading={loading.auth} setMode={setAuthMode} onClose={() => setAuthOpen(false)} onSubmit={handleAuth} />

      {showTrackDetail && selectedTrack && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowTrackDetail(false)}>
          <section className="track-detail" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button className="icon-button modal-close" onClick={() => setShowTrackDetail(false)} aria-label="Close" type="button"><X size={18} /></button>
            <div className="track-detail-body">
              <CoverArt className="detail-art" imageUrl={selectedTrack.coverImage} />
              <div>
                <h3>{selectedTrack.title}</h3>
                <p>{selectedTrack.artist?.username}</p>
                <p>{selectedTrack.title}</p>
                <div className="detail-actions">
                  <button className="primary-button icon-label" onClick={() => togglePlayForTrack(selectedTrack)} type="button">
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    {isPlaying ? " Pause" : " Play"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {showCreatePlaylist && <CreatePlaylistModal onClose={() => setShowCreatePlaylist(false)} onCreate={handleCreatePlaylist} />}
      {addToPlaylistTrack && <AddToPlaylistModal track={addToPlaylistTrack} playlists={playlists} onClose={() => setAddToPlaylistTrack(null)} onAdd={handleAddToPlaylist} onCreateNew={() => { setAddToPlaylistTrack(null); setShowCreatePlaylist(true); }} />}
    </>
  );
}

// ─── Feature 3: Network Banner ─────────────────────────────────────────
function NetworkBanner({ isOnline, showReconnected }) {
  if (isOnline && !showReconnected) return null;
  return (
    <div className={`network-banner ${isOnline ? "online" : "offline"}`}>
      {isOnline ? (
        <><Wifi size={18} /> <span>You're back online!</span></>
      ) : (
        <><WifiOff size={18} /> <span>You are not connected to the internet</span></>
      )}
    </div>
  );
}

// ─── Feature 4: Hero Carousel ──────────────────────────────────────────
const HERO_SLIDES = [
  {
    eyebrow: null,
    title: "A clean, scalable music streaming platform designed for real-world use.",
    text: "Browse tracks and albums, play uploaded audio, and switch into a focused creator workspace when signed in as an artist.",
    gradient: "linear-gradient(135deg, rgba(37, 163, 94, 0.36), rgba(32, 48, 62, 0.58))",
  },
  {
   
    title: "Explore new artists and trending tracks from around the world.",
    text: "Find your next favorite song by browsing curated collections, searching by title or artist, and building personal playlists.",
    gradient: "linear-gradient(135deg, rgba(113, 71, 215, 0.36), rgba(32, 48, 62, 0.58))",
  },
  {
    
    title: "Upload, organize, and share your music with the world.",
    text: "Switch to Studio mode to publish tracks, attach cover art, and package songs into albums — all from a single dashboard.",
    gradient: "linear-gradient(135deg, rgba(243, 111, 86, 0.36), rgba(32, 48, 62, 0.58))",
  },
];

function HeroCarousel({ onBrowse, onStudio }) {
  const [active, setActive] = useState(0);
  const timerRef = useRef(null);

  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setActive((p) => (p + 1) % HERO_SLIDES.length), 6000);
  }, []);

  useEffect(() => {
    resetTimer();
    return () => clearInterval(timerRef.current);
  }, [resetTimer]);

  function goTo(idx) { setActive(idx); resetTimer(); }

  return (
    <div className="hero-carousel">
      {HERO_SLIDES.map((slide, i) => (
        <section
          key={i}
          className={`hero-band hero-slide ${i === active ? "active" : ""}`}
          style={{ background: `${slide.gradient}, url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='480' viewBox='0 0 900 480'%3E%3Cg fill='none' stroke='rgba(255,255,255,.13)' stroke-width='2'%3E%3Cpath d='M0 320c160-120 280 80 440-40s300-220 460-90'/%3E%3Cpath d='M0 380c180-95 310 55 460-38s266-190 440-72'/%3E%3Cpath d='M0 245c150-88 286 48 420-28s292-170 480-64'/%3E%3C/g%3E%3C/svg%3E")`, backgroundSize: "cover" }}
        >
          <div className="hero-copy">
            {slide.eyebrow && <span className="pill">{slide.eyebrow}</span>}
            <h2>{slide.title}</h2>
            <p>{slide.text}</p>
            <div className="hero-actions">
              <button className="primary-button icon-label" onClick={onBrowse} type="button"><Play size={17} /> Browse music</button>
              <button className="ghost-button icon-label" onClick={onStudio} type="button"><Upload size={17} /> Open studio</button>
            </div>
          </div>
          <div className="cover-stack" aria-hidden="true">
            <div className="cover-art large"></div>
            <div className="cover-art medium"></div>
            <div className="visualizer">
              <span></span><span></span><span></span><span></span><span></span><span></span>
            </div>
          </div>
        </section>
      ))}
      <div className="hero-dots">
        {HERO_SLIDES.map((_, i) => (
          <button key={i} className={`hero-dot ${i === active ? "active" : ""}`} onClick={() => goTo(i)} type="button" aria-label={`Go to slide ${i + 1}`} />
        ))}
      </div>
    </div>
  );
}

// ─── Feature 1: Sidebar with Mobile Hamburger ─────────────────────────
function Sidebar({ activeView, setActiveView, isArtist, isSignedIn }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = [
    { id: "home", label: "Home", icon: Home },
    { id: "library", label: "Library", icon: Library },
    { id: "playlists", label: "Playlists", icon: ListMusic },
    { id: "artist", label: "Studio", icon: Upload },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  function handleNav(id) {
    setActiveView(id);
    setMobileOpen(false);
  }

  return (
    <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="sidebar-top-row">
        <a className="brand" href="/">
          <SoundlyLogo className="brand-logo-svg" />
          <span className="nav-label">Soundly</span>
        </a>
        <button className="hamburger-btn" onClick={() => setMobileOpen((v) => !v)} type="button" aria-label="Toggle menu">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <nav className={`nav-list ${mobileOpen ? "nav-list-open" : ""}`}>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button className={`nav-item ${activeView === item.id ? "active" : ""}`} key={item.id} onClick={() => handleNav(item.id)} type="button">
              <Icon size={19} />
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {!isSignedIn && (
        <section className="mini-panel">
          <p className="eyebrow">{isArtist ? "Creator mode" : "Now queued"}</p>
          <h2>{isArtist ? "Upload and organize" : "Discover recent uploads"}</h2>
          <p>{isArtist ? "Publish tracks from Studio and package them into albums." : "Sign in as a listener to stream tracks and browse albums."}</p>
        </section>
      )}
    </aside>
  );
}

function MusicView({ isListener, loading, tracks, onRefresh, onTogglePlay, onOpenAuth, selectedTrack, isPlaying, onOpenDetail, currentUser, onDelete, onAddToPlaylist, isSearching }) {
  const isArtist = currentUser?.role === "artist";
  return (
    <section className="view">
      <div className="section-heading">
        <div><p className="eyebrow">{isSearching ? "Search" : "Recently added"}</p><h2>{isSearching ? "Search Results" : "Tracks"}</h2></div>
        {!isSearching && (
          <button className="icon-button" onClick={onRefresh} title="Refresh music" type="button">
            {loading ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
          </button>
        )}
      </div>
      {!isListener ? (
        <EmptyState icon={Music2} title="Listener access required" text="The backend protects streaming routes for users with the listener role." action="Sign in as listener" onAction={onOpenAuth} />
      ) : tracks.length ? (
        <div className="track-grid">
          {tracks.map((track, index) => (
            <TrackCard key={track._id || track.id} track={track} index={index} onTogglePlay={onTogglePlay} selectedTrack={selectedTrack} isPlaying={isPlaying} onOpenDetail={onOpenDetail} canDelete={isArtist && (track.artist?._id === currentUser?.id || track.artist === currentUser?.id)} onDelete={onDelete} onAddToPlaylist={onAddToPlaylist} showPlaylistBtn={!!currentUser} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Disc3}
          title={loading ? "Searching..." : isSearching ? "No matches found" : "No tracks yet"}
          text={loading ? "Fetching the latest uploads." : isSearching ? "We couldn't find any uploaded tracks matching your search." : "Upload music as an artist, then return as a listener to stream it."}
        />
      )}
    </section>
  );
}

function TrackCard({ track, index, onTogglePlay, selectedTrack, isPlaying, onOpenDetail, canDelete, onDelete, onAddToPlaylist, showPlaylistBtn }) {
  const isActive = selectedTrack && (selectedTrack._id || selectedTrack.id) === (track._id || track.id);
  return (
    <article className="track-card" onClick={() => onOpenDetail?.(track)}>
      <CoverArt index={index} imageUrl={track.coverImage} />
      <div className="track-meta"><h3>{track.title}</h3><p>{track.artist?.username || "Unknown artist"}</p></div>
      <div className="track-card-actions">
        {showPlaylistBtn && onAddToPlaylist && (
          <button className="playlist-add-btn" onClick={(e) => { e.stopPropagation(); onAddToPlaylist(track); }} title="Add to playlist" type="button"><Plus size={16} /></button>
        )}
        {canDelete && (
          <button className="delete-button" onClick={(e) => { e.stopPropagation(); onDelete(track._id || track.id); }} title={`Delete ${track.title}`} type="button"><Trash2 size={16} /></button>
        )}
        <button className="play-button" onClick={(e) => { e.stopPropagation(); onTogglePlay(track); }} title={isActive && isPlaying ? `Pause ${track.title}` : `Play ${track.title}`} type="button">
          {isActive && isPlaying ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
        </button>
      </div>
    </article>
  );
}

// ─── Library View with Tracks / Albums tabs ───────────────────────────
function LibraryView({ isListener, loading, tracks, albums, selectedAlbum, onRefreshTracks, onRefreshAlbums, onSelectAlbum, onBack, onPlay, onOpenAuth, currentUser, onDeleteTrack, onDeleteAlbum, selectedTrack, isPlaying, onOpenDetail, onAddToPlaylist, libraryTab, setLibraryTab, query = "" }) {
  const isArtist = currentUser?.role === "artist";
  const albumTracks = selectedAlbum?.musics || [];

  // If viewing a specific album, show album detail
  if (selectedAlbum) {
    return (
      <section className="view">
        <div className="section-heading">
          <div><p className="eyebrow">Collection</p><h2>{selectedAlbum.title}</h2></div>
          <button className="ghost-button icon-label" onClick={onBack} type="button"><ChevronLeft size={17} /> Back to library</button>
        </div>
        {loading.album ? (
          <EmptyState icon={Loader2} title="Opening album" text="Fetching the songs in this album." />
        ) : (
          <AlbumDetail album={selectedAlbum} tracks={albumTracks} onPlay={onPlay} selectedTrack={selectedTrack} isPlaying={isPlaying} />
        )}
      </section>
    );
  }

  return (
    <section className="view">
      <div className="section-heading">
        <div><p className="eyebrow">Your collection</p><h2>Library</h2></div>
      </div>

      {/* Tab switcher */}
      <div className="library-tabs">
        <button className={`library-tab ${libraryTab === "tracks" ? "active" : ""}`} onClick={() => setLibraryTab("tracks")} type="button">
          <Music2 size={16} /> Tracks
        </button>
        <button className={`library-tab ${libraryTab === "albums" ? "active" : ""}`} onClick={() => setLibraryTab("albums")} type="button">
          <Album size={16} /> Albums
        </button>
      </div>

      {!isListener ? (
        <EmptyState icon={Library} title="Library access required" text="Sign in with a listener account to browse your library." action="Sign in as listener" onAction={onOpenAuth} />
      ) : libraryTab === "tracks" ? (
        /* ── Tracks Tab ── */
        <>
          <div className="section-heading library-sub-heading">
            <div><h3>All Tracks</h3></div>
            <button className="icon-button" onClick={onRefreshTracks} title="Refresh tracks" type="button">{loading.tracks ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}</button>
          </div>
          {tracks.length ? (
            <div className="track-grid">
              {tracks.map((track, index) => (
                <TrackCard key={track._id || track.id} track={track} index={index} onTogglePlay={onPlay} selectedTrack={selectedTrack} isPlaying={isPlaying} onOpenDetail={onOpenDetail} canDelete={isArtist && (track.artist?._id === currentUser?.id || track.artist === currentUser?.id)} onDelete={onDeleteTrack} onAddToPlaylist={onAddToPlaylist} showPlaylistBtn={!!currentUser} />
              ))}
            </div>
          ) : (
            <EmptyState icon={Disc3} title={loading.tracks ? "Loading tracks" : query.trim() ? "No matches found" : "No tracks yet"} text={loading.tracks ? "Fetching the latest uploads." : query.trim() ? `We couldn't find any tracks in your library matching "${query}".` : "Upload music as an artist, then return as a listener to stream it."} />
          )}
        </>
      ) : (
        /* ── Albums Tab ── */
        <>
          <div className="section-heading library-sub-heading">
            <div><h3>All Albums</h3></div>
            <button className="icon-button" onClick={onRefreshAlbums} title="Refresh albums" type="button">{loading.albums ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}</button>
          </div>
          {albums.length ? (
            <div className="album-grid">
              {albums.map((album, index) => {
                const canDelete = isArtist && (album.artist?._id === currentUser?.id || album.artist === currentUser?.id);
                return (
                  <div className="album-card-wrapper" key={album._id || album.id}>
                    <button className="album-card album-button" onClick={() => onSelectAlbum(album)} type="button">
                      <CoverArt index={index + 1} imageUrl={album.coverImage} /><h3>{album.title}</h3><p>{album.artist?.username || "Unknown artist"}</p><span>{album.musics?.length || 0} songs</span>
                    </button>
                    {canDelete && (<button className="delete-button album-delete" onClick={() => onDeleteAlbum(album._id || album.id)} title={`Delete ${album.title}`} type="button"><Trash2 size={16} /></button>)}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={Album} title={loading.albums ? "Loading albums" : "No albums yet"} text={loading.albums ? "Fetching your collection." : "Albums created by artists will appear here."} />
          )}
        </>
      )}
    </section>
  );
}

function AlbumDetail({ album, tracks, onPlay, selectedTrack, isPlaying }) {
  return (
    <div className="album-detail">
      <div className="album-hero">
        <CoverArt index={2} imageUrl={album.coverImage} />
        <div><p className="eyebrow">Album</p><h3>{album.title}</h3><p>{album.artist?.username || "Unknown artist"} • {tracks.length} songs</p></div>
      </div>
      {tracks.length ? (
        <div className="song-list">
          {tracks.map((track, index) => {
            const isActive = selectedTrack && (selectedTrack._id || selectedTrack.id) === (track._id || track.id);
            return (
              <button className={`song-row ${isActive ? "active" : ""}`} key={track._id || track.id} onClick={() => onPlay(track)} type="button">
                <span className="song-index">{index + 1}</span>
                <span className="song-main"><strong>{track.title}</strong><small>{track.artist?.username || album.artist?.username || "Unknown artist"}</small></span>
                {isActive && isPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
              </button>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={Music2} title="No songs in this album" text="Add song names when creating an album and they will appear here." />
      )}
    </div>
  );
}

function CoverArt({ className = "", index = 0, imageUrl }) {
  return <div className={`cover-art cover-${index % 4} ${imageUrl ? "has-image" : ""} ${className}`} style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined} />;
}

function HomeAlbumsSection({ isListener, loading, albums, onSelectAlbum, onRefresh, onOpenAuth, currentUser, onDelete }) {
  const isArtist = currentUser?.role === "artist";
  return (
    <section className="view">
      <div className="section-heading"><div><p className="eyebrow">Collection</p><h2>Albums</h2></div><button className="icon-button" onClick={onRefresh} title="Refresh albums" type="button">{loading ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}</button></div>
      {!isListener ? (
        <EmptyState icon={Album} title="Library access required" text="Sign in to browse albums." action="Sign in" onAction={onOpenAuth} />
      ) : albums.length ? (
        <div className="album-grid">
          {albums.map((album, index) => {
            const canDelete = isArtist && (album.artist?._id === currentUser?.id || album.artist === currentUser?.id);
            return (
              <div className="album-card-wrapper" key={album._id || album.id}>
                <button className="album-card album-button" onClick={() => onSelectAlbum(album)} type="button"><CoverArt index={index + 1} imageUrl={album.coverImage} /><h3>{album.title}</h3><p>{album.artist?.username || "Unknown artist"}</p><span>{album.musics?.length || 0} songs</span></button>
                {canDelete && (<button className="delete-button album-delete" onClick={() => onDelete(album._id || album.id)} title={`Delete ${album.title}`} type="button"><Trash2 size={16} /></button>)}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={Album} title={loading ? "Loading albums" : "No albums yet"} text={loading ? "Fetching your collection." : "Albums created by artists will appear here."} />
      )}
    </section>
  );
}

// ─── YouTube Results Section ───────────────────────────────────────────
function YouTubeResultsSection({ results, onPlay, selectedTrack, isPlaying }) {
  return (
    <section className="view yt-results-section">
      <div className="section-heading">
        <div className="yt-heading">
          <Youtube size={22} className="yt-heading-icon" />
          <div><p className="eyebrow yt-eyebrow">From YouTube</p><h2>More Results</h2></div>
        </div>
      </div>
      <div className="track-grid">
        {results.map((yt) => {
          const isActive = selectedTrack && selectedTrack._id === `yt_${yt.youtubeId}`;
          return (
            <article className="track-card yt-track-card" key={yt.youtubeId} onClick={() => onPlay(yt)}>
              <div className="yt-thumbnail-wrap">
                <img className="yt-thumbnail" src={yt.thumbnail} alt={yt.title} />
                <span className="yt-badge"><Youtube size={14} /> YouTube</span>
              </div>
              <div className="track-meta">
                <h3>{yt.title}</h3>
                <p>{yt.channel}</p>
              </div>
              <div className="track-card-actions">
                <button className="play-button yt-play-button" onClick={(e) => { e.stopPropagation(); onPlay(yt); }} title={`Play ${yt.title}`} type="button">
                  {isActive && isPlaying ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

// ─── ProfilePictureChip (topbar – all users) ──────────────────────────
function ProfilePictureChip({ currentUser, onUpdateProfilePicture, showNotice }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const authRes = await api("/api/music/imagekit-auth");
      const result = await imagekitUpload({
        file,
        fileName: `pfp_${Date.now()}_${file.name}`,
        publicKey: IMAGEKIT_PUBLIC_KEY,
        token: authRes.token,
        signature: authRes.signature,
        expire: authRes.expire,
        folder: "/profile-pictures",
      });
      await onUpdateProfilePicture(result.url);
    } catch (error) {
      showNotice(error.message || "Failed to upload profile picture");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <span className="user-chip" role="button" tabIndex={0} onClick={() => fileRef.current?.click()} title="Click to change profile picture">
      {uploading ? (
        <Loader2 className="spin" size={16} />
      ) : currentUser.profileImage ? (
        <img className="user-avatar" src={currentUser.profileImage} alt={currentUser.username} />
      ) : (
        <UserRound size={16} />
      )}
      {currentUser.username}
      <small>{currentUser.role}</small>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
    </span>
  );
}

// ─── Feature 5: Image Preview Component ────────────────────────────────
function ImagePreview({ file, onRemove }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!file) { setUrl(null); return; }
    const objUrl = URL.createObjectURL(file);
    setUrl(objUrl);
    return () => URL.revokeObjectURL(objUrl);
  }, [file]);

  if (!url) return null;
  return (
    <div className="image-preview">
      <img src={url} alt="Preview" />
      <div className="image-preview-info">
        <span>{file.name}</span>
        <small>{(file.size / 1024).toFixed(0)} KB</small>
      </div>
      <button className="image-preview-remove" onClick={onRemove} type="button" title="Remove"><X size={14} /></button>
    </div>
  );
}

function ArtistView({ isArtist, loading, uploadProgress, onUpload, onAlbum, onOpenAuth }) {
  const [songCoverFile, setSongCoverFile] = useState(null);
  const [albumCoverFile, setAlbumCoverFile] = useState(null);
  const songCoverRef = useRef(null);
  const albumCoverRef = useRef(null);

  function handleSongSubmit(e) {
    onUpload(e);
    setSongCoverFile(null);
  }

  function handleAlbumSubmit(e) {
    onAlbum(e);
    setAlbumCoverFile(null);
  }

  return (
    <section className="view">
      <div className="section-heading"><div><p className="eyebrow">Artist studio</p><h2>Upload music</h2></div></div>
      {!isArtist ? (
        <EmptyState icon={Upload} title="Artist account required" text="Create or sign in with an artist role to upload tracks and create albums." action="Create artist account" onAction={onOpenAuth} />
      ) : (
        <div className="studio-layout">
          <form className="studio-panel" onSubmit={handleSongSubmit}>
            <label>Track title<input name="title" type="text" placeholder="Midnight Session" required /></label>
            <label>Audio file<input name="music" type="file" accept="audio/*" required /></label>
            <label>Song cover image
              <input ref={songCoverRef} name="cover" type="file" accept="image/*" onChange={(e) => setSongCoverFile(e.target.files[0] || null)} />
            </label>
            {songCoverFile && <ImagePreview file={songCoverFile} onRemove={() => { setSongCoverFile(null); if (songCoverRef.current) songCoverRef.current.value = ""; }} />}
            {loading && uploadProgress > 0 && (<div className="upload-progress"><div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }} /></div>)}
            <button className="primary-button icon-label" disabled={loading} type="submit">
              {loading ? <Loader2 className="spin" size={17} /> : <Upload size={17} />}
              {loading ? (uploadProgress > 0 ? `Uploading ${uploadProgress}%` : "Preparing...") : "Upload track"}
            </button>
          </form>

          <form className="studio-panel" onSubmit={handleAlbumSubmit}>
            <label>Album title<input name="title" type="text" placeholder="City Lights EP" required /></label>
            <label>Song names<textarea name="musics" rows="4" placeholder="Midnight Session, City Lights, Neon Drive" /></label>
            <label>Album cover image
              <input ref={albumCoverRef} name="cover" type="file" accept="image/*" onChange={(e) => setAlbumCoverFile(e.target.files[0] || null)} />
            </label>
            {albumCoverFile && <ImagePreview file={albumCoverFile} onRemove={() => { setAlbumCoverFile(null); if (albumCoverRef.current) albumCoverRef.current.value = ""; }} />}
            <button className="ghost-button icon-label" type="submit"><Album size={17} /> Create album</button>
          </form>
        </div>
      )}
    </section>
  );
}

// ─── Feature 2: Settings View ──────────────────────────────────────────
function SettingsView({ theme, setTheme, currentUser, onUpdateProfilePicture, showNotice }) {
  const [uploadingPfp, setUploadingPfp] = useState(false);
  const pfpInputRef = useRef(null);

  async function handleProfilePictureUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPfp(true);
    try {
      const authRes = await api("/api/music/imagekit-auth");
      const result = await imagekitUpload({
        file,
        fileName: `pfp_${Date.now()}_${file.name}`,
        publicKey: IMAGEKIT_PUBLIC_KEY,
        token: authRes.token,
        signature: authRes.signature,
        expire: authRes.expire,
        folder: "/profile-pictures",
      });
      await onUpdateProfilePicture(result.url);
    } catch (error) {
      showNotice(error.message || "Failed to upload profile picture");
    } finally {
      setUploadingPfp(false);
      if (pfpInputRef.current) pfpInputRef.current.value = "";
    }
  }

  return (
    <section className="view">
      <div className="section-heading"><div><p className="eyebrow">Preferences</p><h2>Settings</h2></div></div>

      <div className="settings-layout">
        {/* Profile Picture */}
        {currentUser && (
          <div className="settings-card">
            <h3><UserRound size={18} /> Profile Picture</h3>
            <div className="pfp-section">
              <div className="pfp-preview">
                {currentUser.profileImage ? (
                  <img src={currentUser.profileImage} alt={currentUser.username} />
                ) : (
                  <UserRound size={48} />
                )}
              </div>
              <div>
                <p>Upload a profile picture to personalize your account.</p>
                <input ref={pfpInputRef} type="file" accept="image/*" onChange={handleProfilePictureUpload} style={{ display: "none" }} />
                <button className="primary-button icon-label" onClick={() => pfpInputRef.current?.click()} disabled={uploadingPfp} type="button">
                  {uploadingPfp ? <Loader2 className="spin" size={17} /> : <Upload size={17} />}
                  {uploadingPfp ? "Uploading..." : "Upload picture"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Theme Switcher */}
        <div className="settings-card">
          <h3><Palette size={18} /> Theme</h3>
          <p>Choose a color scheme that suits your style.</p>
          <div className="theme-grid">
            {THEMES.map((t) => {
              const ThemeIcon = t.icon;
              return (
                <button
                  key={t.id}
                  className={`theme-option ${theme === t.id ? "active" : ""}`}
                  onClick={() => setTheme(t.id)}
                  type="button"
                  data-theme-preview={t.id}
                >
                  <span className="theme-icon-wrap"><ThemeIcon size={20} /></span>
                  <span className="theme-label">{t.label}</span>
                  {theme === t.id && <span className="theme-check">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Playlist Components ───────────────────────────────────────────────

function PlaylistView({ isListener, playlists, selectedPlaylist, onRefresh, onSelectPlaylist, onBack, onPlay, onOpenAuth, onCreateNew, onDelete, onRemoveSong, selectedTrack, isPlaying }) {
  return (
    <section className="view">
      <div className="section-heading">
        <div><p className="eyebrow">Your music</p><h2>{selectedPlaylist ? selectedPlaylist.title : "Playlists"}</h2></div>
        {selectedPlaylist ? (
          <div className="section-heading-actions">
            <button className="ghost-button icon-label" onClick={onBack} type="button"><ChevronLeft size={17} /> Back</button>
            <button className="delete-button visible" onClick={() => onDelete(selectedPlaylist._id || selectedPlaylist.id)} title="Delete playlist" type="button"><Trash2 size={16} /></button>
          </div>
        ) : (
          <div className="section-heading-actions">
            <button className="primary-button icon-label" onClick={onCreateNew} type="button"><Plus size={17} /> New playlist</button>
            <button className="icon-button" onClick={onRefresh} title="Refresh playlists" type="button"><RefreshCw size={18} /></button>
          </div>
        )}
      </div>
      {!isListener ? (
        <EmptyState icon={ListMusic} title="Sign in required" text="Log in to create and manage your playlists." action="Sign in" onAction={onOpenAuth} />
      ) : selectedPlaylist ? (
        <PlaylistDetail playlist={selectedPlaylist} onPlay={onPlay} onRemoveSong={onRemoveSong} selectedTrack={selectedTrack} isPlaying={isPlaying} />
      ) : playlists.length ? (
        <div className="album-grid">
          {playlists.map((pl) => (
            <div className="album-card-wrapper" key={pl._id || pl.id}>
              <button className="album-card album-button playlist-card" onClick={() => onSelectPlaylist(pl)} type="button">
                <div className="playlist-cover-art"><ListMusic size={40} /></div><h3>{pl.title}</h3><span>{pl.musics?.length || 0} songs</span>
              </button>
              <button className="delete-button album-delete" onClick={() => onDelete(pl._id || pl.id)} title={`Delete ${pl.title}`} type="button"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={ListMusic} title="No playlists yet" text="Create a playlist and add your favorite songs to it." action="Create playlist" onAction={onCreateNew} />
      )}
    </section>
  );
}

function PlaylistDetail({ playlist, onPlay, onRemoveSong, selectedTrack, isPlaying }) {
  const tracks = playlist.musics || [];
  return (
    <div className="album-detail">
      <div className="album-hero playlist-hero">
        <div className="playlist-cover-art large-icon"><ListMusic size={64} /></div>
        <div><p className="eyebrow">Playlist</p><h3>{playlist.title}</h3><p>{tracks.length} songs</p></div>
      </div>
      {tracks.length ? (
        <div className="song-list">
          {tracks.map((track, index) => {
            const isActive = selectedTrack && (selectedTrack._id || selectedTrack.id) === (track._id || track.id);
            return (
              <div className="song-row-wrapper" key={track._id || track.id}>
                <button className={`song-row ${isActive ? "active" : ""}`} onClick={() => onPlay(track)} type="button">
                  <span className="song-index">{index + 1}</span>
                  <span className="song-main"><strong>{track.title}</strong><small>{track.artist?.username || "Unknown artist"}</small></span>
                  {isActive && isPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
                </button>
                <button className="song-remove-btn" onClick={() => onRemoveSong(playlist._id || playlist.id, track._id || track.id)} title="Remove from playlist" type="button"><X size={16} /></button>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={Music2} title="Playlist is empty" text="Go to the Home page and click the + button on any track to add it here." />
      )}
    </div>
  );
}

function CreatePlaylistModal({ onClose, onCreate }) {
  const [title, setTitle] = useState("");
  function handleSubmit(e) { e.preventDefault(); if (title.trim()) onCreate(title.trim()); }
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="auth-modal create-playlist-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="icon-button modal-close" onClick={onClose} aria-label="Close" type="button"><X size={18} /></button>
        <div className="auth-header"><ListMusic size={32} style={{ color: "var(--accent)" }} /><div><p className="eyebrow">New playlist</p><h2>Create a playlist</h2></div></div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>Playlist name<input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My Awesome Playlist" autoFocus required /></label>
          <button className="primary-button icon-label" type="submit"><Plus size={17} /> Create</button>
        </form>
      </section>
    </div>
  );
}

function AddToPlaylistModal({ track, playlists, onClose, onAdd, onCreateNew }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="auth-modal add-to-playlist-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="icon-button modal-close" onClick={onClose} aria-label="Close" type="button"><X size={18} /></button>
        <div className="auth-header"><Plus size={32} style={{ color: "var(--accent)" }} /><div><p className="eyebrow">Add to playlist</p><h2>"{track.title}"</h2></div></div>
        <div className="playlist-pick-list">
          {playlists.length ? playlists.map((pl) => (
            <button className="playlist-pick-row" key={pl._id || pl.id} onClick={() => onAdd(pl._id || pl.id, track._id || track.id)} type="button"><ListMusic size={18} /><span>{pl.title}</span><small>{pl.musics?.length || 0} songs</small></button>
          )) : <p className="playlist-pick-empty">No playlists yet.</p>}
          <button className="ghost-button icon-label playlist-create-inline" onClick={onCreateNew} type="button"><Plus size={17} /> Create new playlist</button>
        </div>
      </section>
    </div>
  );
}

function EmptyState({ icon: Icon, title, text, action, onAction }) {
  return (
    <div className="empty-state"><Icon size={34} /><h3>{title}</h3><p>{text}</p>
      {action && <button className="primary-button" onClick={onAction} type="button">{action}</button>}
    </div>
  );
}

function AuthModal({ open, mode, loading, setMode, onClose, onSubmit }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="icon-button modal-close" onClick={onClose} aria-label="Close" type="button"><X size={18} /></button>
        <div className="auth-header"><SoundlyLogo className="brand-logo-svg" /><div><p className="eyebrow">Welcome back</p><h2 id="auth-title">{mode === "login" ? "Sign in to Soundly" : "Create your account"}</h2></div></div>
        <div className="segmented" role="tablist" aria-label="Authentication mode">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")} type="button">Login</button>
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")} type="button">Register</button>
        </div>
        <form className="auth-form" onSubmit={onSubmit}>
          <label>Username<input name="username" type="text" autoComplete="username" required /></label>
          {mode === "register" && <label>Email<input name="email" type="email" autoComplete="email" required /></label>}
          <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
          {mode === "register" && <label>Role<select name="role"><option value="user">Listener</option><option value="artist">Artist</option></select></label>}
          <button className="primary-button icon-label" disabled={loading} type="submit">{loading && <Loader2 className="spin" size={17} />}{mode === "login" ? "Login" : "Register"}</button>
        </form>
      </section>
    </div>
  );
}

function SoundlyLogo({ className = "brand-logo-svg" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        transition: "transform 1.2s cubic-bezier(0.25, 1, 0.5, 1)",
      }}
    >
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--eyebrow)" />
        </linearGradient>
      </defs>
      {/* Vinyl Outer Edge */}
      <circle
        cx="50"
        cy="50"
        r="44"
        fill="#121318"
        stroke="url(#logo-grad)"
        strokeWidth="3.5"
      />
      {/* Vinyl Grooves */}
      <circle cx="50" cy="50" r="36" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="0.8" strokeDasharray="8 4" />
      <circle cx="50" cy="50" r="30" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="0.8" />
      <circle cx="50" cy="50" r="24" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="0.8" strokeDasharray="12 6" />
      <circle cx="50" cy="50" r="18" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.8" />
      {/* Light Reflection Rays / Arcs */}
      <path
        d="M 22 50 A 28 28 0 0 1 50 22"
        stroke="url(#logo-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M 78 50 A 28 28 0 0 1 50 78"
        stroke="url(#logo-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.8"
      />
      {/* Center Label (Sticker) */}
      <circle cx="50" cy="50" r="12" fill="url(#logo-grad)" />
      {/* Spindle Hole */}
      <circle cx="50" cy="50" r="3.5" fill="var(--bg-body, #0b0d10)" />
    </svg>
  );
}

createRoot(document.getElementById("root")).render(<App />);
