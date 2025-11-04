// For Initialzing the express server - Connecting to server.ts further for running HTTP!
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth/", authRoutes);
export default app;
//# sourceMappingURL=app.js.map