// For Initialzing the express server - Connecting to server.ts further for running HTTP!
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRouts.js")

const app = express();

app.use(cors({
  origin: 'https://hoperxpharma.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

app.use(express.json());

// Basic GET route
app.get('/', (req, res) => {
  res.json({ message: 'HopeRxPharma Backend API is running!', status: 'OK' });
});

app.use("/api/auth/", authRoutes)

module.exports = app;