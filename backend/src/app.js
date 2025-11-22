// For Initialzing the express server - Connecting to server.ts further for running HTTP!
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes.js")

const app = express();

const allowedOrigins = ['https://hoperxpharma.vercel.app'];
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:3001');
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

app.use(express.json());
app.use(cookieParser());

// Basic GET route
app.get('/', (req, res) => {
  res.json({ message: 'HopeRxPharma Backend API is running!', status: 'OK' });
});

app.use("/api/auth/", authRoutes)

module.exports = app;