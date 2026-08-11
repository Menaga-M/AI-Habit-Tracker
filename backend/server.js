import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
// import userRoutes from "./routes/userRoutes.js";
// import postRoutes from "./routes/postRoutes.js";
// import commentRoutes from "./routes/commentRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const corsOptions = {
    origin(origin, callback) {
        if(!origin) return callback(null, true);

        if(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {   
            return callback(null, true);
        }

        if(allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials : true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*Any", cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req,res) => {
    res.json({status:"ok", time: new Date().toISOString()});
});

app.use("/api/auth", authRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 8000;

connectDB().then(() => {
    app.listen(PORT, () => 
        console.log(`Server running on http://localhost:${PORT}`)
    );
});
