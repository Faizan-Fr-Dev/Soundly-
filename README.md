# Soundly — Premium Music Streaming & Creator Platform

A modern, full-stack web application for a music streaming platform and creator workspace. The application features a dynamic tracks catalog, customized playlists, a dynamic theme engine with matching favicons, public guest browsing guards, and a dedicated artist studio dashboard.

---

## 🚀 Live Demo & Deployments
* **Web App (Frontend & Backend)**: Deployed on Railway at **[Soundly Web App](https://soundly-production-7322.up.railway.app/)**

---

## ✨ Features

### 🎧 Music Streaming
* **Tracks Catalog**: Browse uploaded tracks and albums with custom cover art and descriptions.
* **YouTube Search & Stream**: Integrated YouTube IFrame API to search and stream tracks in audio-only mode with native-like UI controls (timeline scrubber, volume, and mute).
* **Dynamic Playlists**: Create, rename, delete, and add/remove songs to custom Playlists.

### 🎨 Dynamic Customization
* **Real-time Themes**: Switch between Dark (Emerald), Midnight (Purple), Sunset (Orange), Ocean (Cyan), and Light themes instantly.
* **Favicon Synchronization**: Changing themes dynamically updates the browser tab's favicon using SVG data URIs, matching the retro vinyl logo colors.
* **Text Truncation & Tooltips**: Truncates usernames, track titles, and artist tags with hover tooltips for long names to maintain visual clean layouts.
* **Active Highlighting**: Currently playing tracks are highlighted with matching border colors and background glows inside all album and playlist views.

### 👥 Guest Access & Modals
* **Public Browse Access**: Unprotected library browsing allows guest users to check albums and songs without logging in.
* **Custom Playback Guard**: Intercepts guest play triggers, shows a custom warning modal advising login, and completely bypasses standard browser alerts and bottom toast notices.
* **Custom Confirmations**: Replaced native browser confirmation alerts with custom themed modals for logout, deleting albums, and playlist removals.

### 🛡️ Artist Studio Dashboard
* **Direct CDN Uploads**: Upload tracks and cover art directly to ImageKit CDN using backend transient JWT signatures, saving server bandwidth.
* **Image Previews**: Local image loading previews for album cover art files before uploading.
* **CRUD Operations**: Artists can fully upload tracks, delete uploads, create albums, or remove album lists.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| --- | --- | --- |
| **Frontend** | React (v19) | Modern component-based User Interface |
| | Vite (v6) | Ultra-fast next-generation frontend developer build environment |
| | Lucide React | Clean, scalable vector icons |
| | CSS Custom Properties | Custom styled theme variables for real-time CSS swapping |
| | ImageKit JavaScript SDK | Direct client-side media uploads |
| | YouTube IFrame Player API | Native-like YouTube video audio-only streaming control |
| **Backend** | Node.js & Express | Lightweight RESTful API server |
| | Cookie-Parser & JWT | Secure token-based session auth and protected routes |
| **Database** | MongoDB & Mongoose | Object modeling and database storage |

---

## 📂 Project Structure

```
Soundly-/
├── client/
│   ├── dist/             # Compiled production bundle assets (HTML, CSS, JS)
│   ├── public/           # Static public resources
│   ├── src/
│   │   ├── main.jsx      # Client logic, React components, state, views, and entry
│   │   └── styles.css    # Premium CSS classes, custom themes, and media queries
│   ├── package.json      # Client dependencies and dev scripts
│   └── vite.config.js    # Vite configuration
├── src/
│   ├── controllers/      # Backend controller handlers (music, auth)
│   ├── db/               # MongoDB connection handler
│   ├── middlewares/      # Express JWT auth middlewares
│   ├── models/           # Mongoose schemas (User, Music, Album, Playlist)
│   ├── routes/           # Express router endpoints (music, auth)
│   └── app.js            # Express application middleware configuration
├── server.js             # Entry server file running the app on a dynamic port
└── package.json          # Root-level build scripts and server orchestrator
```

---

## 💻 Local Setup

Run the application locally on your machine:

### 1. Prerequisites
* Node.js installed (v18 or higher recommended).
* MongoDB database (Atlas or local instance).
* Git installed.

### 2. Clone the Repository
```bash
git clone https://github.com/Faizan-Fr-Dev/Soundly-.git
cd Soundly-
```

### 3. Set Up Environment Variables
Create a `.env` file in the root directory:
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

### 4. Install Dependencies
Install server-side dependencies and client-side dependencies:
```bash
# Install Server Dependencies
npm install

# Install Client Dependencies
cd client
npm install
cd ..
```

### 5. Run Both Servers Concurrently
Start the Node server (port 3000) and the Vite development server (port 5173):
```bash
# Run backend server:
npm run dev

# Run frontend client (in a separate terminal or concurrent launcher):
npm run client
```
Open [http://localhost:5173](http://localhost:5173) in your browser to view the application.

---

## ☁️ Deployment

### Backend & Frontend (Railway)
1. Link your GitHub repository to Railway.
2. Configure your environment variables in the Railway dashboard (`MONGO_URI`, `JWT_SECRET`, `YOUTUBE_API_KEY`, etc.).
3. Railway reads the root `package.json`, automatically runs `"build": "npm run client:build"` to compile frontend assets, and starts the server utilizing `npm start`.

---

## 👤 Author
Designed and engineered with 💻 by Faizan-Fr-Dev
