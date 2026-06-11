import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import type { MarketAlert, MarketSnapshot } from "../types/market.js";

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: Date;
}

const __dirname = dirname(fileURLToPath(import.meta.url));

export class Database {
  private pool: Pool | null = null;
  private enabled = Boolean(process.env.DATABASE_URL);
  private warnedUnavailable = false;

  async connect() {
    if (!this.enabled || !process.env.DATABASE_URL) {
      console.warn("Database disabled: DATABASE_URL is not configured");
      return;
    }

    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    try {
      await this.pool.query("SELECT 1");
      await this.runMigrations();
      console.log("Database connected");
    } catch (error) {
      this.enabled = false;
      await this.close();
      console.error(
        `Database unavailable, persistence disabled: ${getErrorMessage(error)}`,
      );
    }
  }

  async close() {
    await this.pool?.end();
    this.pool = null;
  }

  async saveMarketTick(snapshot: MarketSnapshot) {
    if (!this.pool || !this.enabled) {
      this.warnOnce();
      return;
    }

    await this.safeQuery(
      `
        INSERT INTO market_ticks_1s (
          symbol,
          exchange,
          last_price,
          cvd,
          buy_volume,
          sell_volume,
          trades_count,
          order_book_levels,
          bucket_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, to_timestamp($9 / 1000.0))
      `,
      [
        snapshot.symbol,
        snapshot.exchange,
        snapshot.lastPrice,
        snapshot.cvd,
        snapshot.buyVolume,
        snapshot.sellVolume,
        snapshot.trades.length,
        snapshot.orderBook.length,
        snapshot.timestamp,
      ],
    );
  }

  async saveMarketAlert(alert: MarketAlert) {
    if (!this.pool || !this.enabled) {
      this.warnOnce();
      return;
    }

    await this.safeQuery(
      `
        INSERT INTO market_alerts (
          id,
          type,
          symbol,
          message,
          severity,
          event_at
        )
        VALUES ($1, $2, $3, $4, $5, to_timestamp($6 / 1000.0))
        ON CONFLICT (id) DO NOTHING
      `,
      [
        alert.id,
        alert.type,
        alert.symbol,
        alert.message,
        alert.severity,
        alert.timestamp,
      ],
    );
  }

  async getUserByEmail(email: string): Promise<UserRecord | null> {
    if (!this.pool || !this.enabled) return null;
    try {
      const result = await this.pool.query<UserRecord>("SELECT * FROM users WHERE email = $1", [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Database read failed: ${getErrorMessage(error)}`);
      return null;
    }
  }

  async getUserById(id: string): Promise<UserRecord | null> {
    if (!this.pool || !this.enabled) return null;
    try {
      const result = await this.pool.query<UserRecord>("SELECT * FROM users WHERE id = $1", [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Database read failed: ${getErrorMessage(error)}`);
      return null;
    }
  }

  async createUser(email: string, passwordHash: string): Promise<UserRecord | null> {
    if (!this.pool || !this.enabled) return null;
    try {
      const result = await this.pool.query<UserRecord>(
        "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *",
        [email, passwordHash]
      );
      return result.rows[0];
    } catch (error) {
      console.error(`Database write failed: ${getErrorMessage(error)}`);
      return null;
    }
  }

  private async runMigrations() {
    const schemaPath = findSchemaPath();
    const schema = readFileSync(schemaPath, "utf8");

    await this.pool?.query(schema);
  }

  private async safeQuery(query: string, values: unknown[]) {
    try {
      await this.pool?.query(query, values);
    } catch (error) {
      console.error(`Database write failed: ${getErrorMessage(error)}`);
    }
  }

  private warnOnce() {
    if (this.warnedUnavailable) {
      return;
    }

    this.warnedUnavailable = true;
    console.warn("Persistence skipped: database is not available");
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function findSchemaPath() {
  const candidates = [
    resolve(__dirname, "schema.sql"),
    resolve(process.cwd(), "apps/backend/src/database/schema.sql"),
    resolve(process.cwd(), "src/database/schema.sql"),
  ];

  const schemaPath = candidates.find((candidate) => existsSync(candidate));

  if (!schemaPath) {
    throw new Error("Database schema.sql not found");
  }

  return schemaPath;
}
