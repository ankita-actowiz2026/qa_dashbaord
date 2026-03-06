import express from "express";
import dotenv from "dotenv";
dotenv.config();
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import { Request, Response, NextFunction } from 'express'
import path from "path"
import http from "http";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.config";


import adminAuthRouter from "./routes/admin.auth.route";
import adminUserRouter from "./routes/admin.user.route";

import importedFileRouter from "./routes/user.importedFile.route";
import authRouter from "./routes/user.auth.route";
import reportRouter from "./routes/user.report.route";
import errorHandler from "./middleware/error.handler";
import  ApiError  from "./utils/api.error";

const app = express();

// middlewares
app.use(cookieParser());   

app.use(cors({origin: process.env.FRONTEND_URL,credentials: true,})); //Allows browser to send secure credentials with request
//credentials: true => if you are passing cookie from frontend
app.use(helmet({crossOriginResourcePolicy: false,}));
app.use(rateLimit({windowMs: 15 * 60 * 1000,max: 100,}));//One IP can only make 100 requests every 15 minutes.
app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ limit: "200mb", extended: true }));

app.use("/admin/auth", adminAuthRouter);
app.use("/admin/user", adminUserRouter);

 app.use("/api/qa_file", importedFileRouter);
 app.use("/api/auth", authRouter);
 app.use("/api/report", reportRouter);

app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '..', 'uploads')));

//page not found
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new ApiError("Page not found", 404));
});


app.use(errorHandler);

let server: http.Server | undefined;
const PORT = process.env.PORT || 3000;
connectDB()
  .then(() => {
    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Set socket timeout for large file uploads
    server.timeout = 20 * 60 * 1000; // 20 minutes
    server.keepAliveTimeout = 25 * 60 * 1000; // 25 minutes
  })
  .catch((err) => {
    console.error("DB connection failed:", err);
    process.exit(1);
  });

// process handlers
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  if (server) {
    server.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
});