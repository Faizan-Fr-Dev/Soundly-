const express = require("express");
const authRoutes = require("./routes/auth.route");
const musicRoutes  = require("../src/routes/music.route")
const cookieparser = require("cookie-parser");
const path = require("path");
const app = express();
app.use(cookieparser());
app.use(express.urlencoded({ extended: true }));



app.use(express.json());
app.use(express.static(path.join(__dirname, "../client/dist"), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".html")) {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    } else {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    }
  }
}));



app.use("/api/auth", authRoutes);
app.use("/api/music", musicRoutes);
module.exports = app;
