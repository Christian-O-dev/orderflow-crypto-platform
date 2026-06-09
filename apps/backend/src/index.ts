import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { existsSync } from "node:fs";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { Database } from "./database/index.js";
import { createRealtimeServer } from "./realtime/socketServer.js";

const envPath = [
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../../.env"),
].find((candidate) => existsSync(candidate));

dotenv.config(envPath ? { path: envPath } : undefined);

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const server = createServer(app);
const database = new Database();
await database.connect();
createRealtimeServer(server, { database });

server.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
