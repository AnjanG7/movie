import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/errormiddleware.js";
import dotenv from "dotenv"
dotenv.config({ path: "./.env" });

const app = express();
app.use(express.json({limit:"1mb"}));

app.use(
  cors({
    origin: (_,cb)=>{cb(null,true)},
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser());


import authRouter from "./routes/auth.routes.js"

app.use("/api/auth",authRouter)

app.use(errorHandler);
export default app;