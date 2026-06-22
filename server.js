require('dotenv').config();
const app = require("./src/app")
const connectDB = require("./src/db/db")
const dns = require("dns");



// Change DNS
// dns.setServers(["1.1.1.1", "8.8.8.8"]);

connectDB();



const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});