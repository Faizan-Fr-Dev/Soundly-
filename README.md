# Soundly — Premium Music Streaming Web Application

Soundly is a modern, responsive, and feature-rich full-stack music streaming application. Styled with a premium glassmorphic dark-mode aesthetic inspired by Spotify, Soundly supports dynamic themes, dynamic tab favicon updates, role-based workspaces, secure direct media uploads, custom playback controls for both local and YouTube tracks, and public guest browsing.

---

## 🚀 Live Demo
Experience the production release of the application here:
👉 **[Soundly Web App](https://soundly-production-7322.up.railway.app/)**

---

## ✨ Features

### 1. 🎨 Dynamic Theme Engine & Favicons
* **Theme Presets**: Switch instantly between multiple color schemes in Settings: **Dark** (Emerald), **Midnight** (Purple/Indigo), **Sunset** (Orange/Red), **Ocean** (Cyan/Teal), and **Light** (Clean/Modern).
* **Syncing Logo Favicons**: Changing themes dynamically updates the browser tab's favicon using SVG data URIs, keeping the vinyl disc brand color synchronized with your selected theme.
* **Spin Animation**: The retro vinyl disc logo spins smoothly upon hover.

### 2. 👥 Guest Browsing & Playback Guards
* **Public Library Access**: Non-logged-in guest users can fully browse tracks, list albums, query search results, and inspect album details.
* **Themed Playback Guards**: Clicking "Play" on a track card, album row, or within the detail views as a guest blocks playback and triggers a custom-styled *"Sign in to listen"* modal (complete with Cancel / Sign In buttons), bypassing the native browser popups and bottom alert notices.

### 3. 🎵 Hybrid Audio Playback System
* **Uploaded Files**: Plays high-quality audio files directly from ImageKit CDN using standard HTML5 `<audio>` streams.
* **YouTube Playback Integration**: Integrates the official Google YouTube IFrame API to stream video tracks in an audio-only mode.
* **Native Control UI**: Offers custom playback sliders, current time trackers, seek scrubbers, durations, mute toggles, and volume control inputs, styled to match native browser players.
* **Spacebar Hotkey**: Tap the Spacebar key anywhere on the app to play/pause the active track (with input checks to prevent hotkey triggers while typing in search bars or authentication fields).

### 4. 🗂️ Role-Based Workspaces & Libraries
* **Artist Studio Mode**: Sign up as an Artist to access the publishing dashboard. Upload audio, attach custom cover art, preview images locally before uploading, and package collections of songs into full Albums.
* **Listener Space**: Create, rename, delete, and add/remove songs to custom Playlists.
* **Ellipsis Text Truncation**: Truncates long track names, artist names, and topbar usernames (max 14 characters) with custom browser hover tooltips showing full untruncated values.
* **Active Highlights**: Currently playing tracks are highlighted with green borders, background glows, and color indicators in all album and playlist views.

### 5. 🔒 Security & Server Optimizations
* **Secure Direct CDN Uploads**: Backend issues transient signatures/tokens for the ImageKit API. Frontend uploads files directly to the ImageKit CDN, saving server bandwidth.
* **Cookie-Based Sessions**: Secure cookie-parser JWT storage protects private listener and artist API endpoints.
* **Caching Control (MIME fix)**: Configured Express static asset handlers to set `Cache-Control: no-store` on HTML files, preventing browser caching of outdated `index.html` referencing deleted hashes, while maximizing caching for built JS/CSS.
* **Custom Confirmations**: Replaced native browser confirm popups with responsive, custom-styled confirmation modals (e.g., logging out, deleting tracks, playlist removals).

---

## 🛠️ Tech Stack

### Frontend Client
* **Framework**: React.js (Vite)
* **Icons**: Lucide React
* **Styling**: Vanilla CSS Custom Properties (Variables)
* **SDKs**: ImageKit JavaScript SDK, YouTube IFrame Player API

### Backend Server
* **Environment**: Node.js, Express
* **Database**: MongoDB (Mongoose Object Modeling)
* **Authentication**: JSON Web Token (JWT), bcryptjs
* **Middleware**: Cookie-Parser, Multer, Dotenv

---

## 📦 Database Schema Design

Soundly models resources using Mongoose schemas:

### 1. User Schema (`src/models/user.model.js`)
* `username`: String (Unique, Required)
* `email`: String (Unique, Required)
* `password`: String (Hashed, Required)
* `role`: String (Enum: `['user', 'artist']`, Default: `'user'`)
* `profileImage`: String (ImageURL)

### 2. Music Schema (`src/models/music.model.js`)
* `title`: String (Required)
* `uri`: String (Audio CDN URL)
* `coverImage`: String (Cover Art URL)
* `artist`: ObjectID (Ref: `User`)
* `isYouTube`: Boolean (Default: `false`)
* `youtubeId`: String (Optional)

### 3. Album Schema (`src/models/album.model.js`)
* `title`: String (Required)
* `coverImage`: String (Cover Art URL)
* `artist`: ObjectID (Ref: `User`)
* `musics`: Array of ObjectIDs (Ref: `Music`)

### 4. Playlist Schema (`src/models/playlist.model.js`)
* `title`: String (Required)
* `user`: ObjectID (Ref: `User`)
* `musics`: Array of ObjectIDs (Ref: `Music`)

---

## 🔧 Installation & Setup

Follow these steps to run Soundly locally:

### 1. Clone the Repository
```bash
git clone https://github.com/Faizan-Fr-Dev/Soundly-.git
cd Soundly-
```

### 2. Set Up Environment Variables
Create a `.env` file in the root directory and add the following keys:
```env
PORT = 3000
MONGO_URI = your_mongodb_connection_string
JWT_SECRET = your_jwt_token_secret

# ImageKit Configuration (Node SDK fallbacks)
IMAGE_KIT_PUBLIC_KEY = public_Sn0fjUUewu0K9mWGHmf7+B1v2p8=
IMAGE_KIT_PRIVATE_KEY = your_private_key
IMAGE_KIT_URL_ENDPOINT = https://ik.imagekit.io/xlkeq9uf7

# YouTube Search Proxy Configuration
YOUTUBE_API_KEY = your_youtube_data_api_v3_key
```

### 3. Install Dependencies
Install server-side dependencies in the root, and client-side dependencies in the `client/` folder:
```bash
# Install Server Dependencies
npm install

# Install Client Dependencies
cd client
npm install
cd ..
```

### 4. Run the Development Servers
Start both servers concurrently:
```bash
# In the root folder:
# Start Backend Server (runs on Port 3000)
npm run dev

# Start Frontend Client (runs on Port 5173)
npm run client
```

### 5. Build for Production
```bash
# Compiles React code into optimized build assets under client/dist
npm run build
```

---

## 📈 Deployment (Railway)
This project is configured for deployment on platforms like Railway or Heroku:
1. Dynamic port assignment: `const PORT = process.env.PORT || 3000;`.
2. Global Node `crypto` polyfill injection inside `server.js` to ensure compatibility with Node v18+ environments.
3. Automatically triggers client-side compiling via a root build command: `"build": "npm run client:build"`.
