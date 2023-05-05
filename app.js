import { AppBoot } from "./app.boot.js";
import dotenv from "dotenv";
dotenv.config();

const app = new AppBoot(process.env.SERVER_PORT);

app.boot();
