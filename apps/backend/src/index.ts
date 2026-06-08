import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "node:http";

dotenv.config();

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

server.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
