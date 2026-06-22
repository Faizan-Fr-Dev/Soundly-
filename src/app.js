const express = require("express");
const authRoutes = require("./routes/auth.route");
const musicRoutes  = require("../src/routes/music.route")
const cookieparser = require("cookie-parser");
const path = require("path");
const app = express();
app.use(cookieparser());
app.use(express.urlencoded({ extended: true }));



app.use(express.json());
app.use(express.static(path.join(__dirname, "../client/dist")));


app.use("/api/auth", authRoutes);
app.use("/api/music", musicRoutes);
module.exports = app;
