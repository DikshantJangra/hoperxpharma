// For Initialzing the express server - Connecting to server.ts further for running HTTP!
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRouts.js")

const app = express();
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "https://hoperxpharma.onrender.com", "https://hoperxpharma.vercel.app"],
  credentials: true
}));
app.use(express.json());

app.use("/api/auth/", authRoutes)

module.exports = app;