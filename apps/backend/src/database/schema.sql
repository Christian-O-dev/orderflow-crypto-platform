CREATE TABLE IF NOT EXISTS market_ticks_1s (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  exchange TEXT NOT NULL,
  last_price NUMERIC(20, 8) NOT NULL,
  cvd NUMERIC(20, 8) NOT NULL,
  buy_volume NUMERIC(20, 8) NOT NULL,
  sell_volume NUMERIC(20, 8) NOT NULL,
  trades_count INTEGER NOT NULL,
  order_book_levels INTEGER NOT NULL,
  bucket_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS market_ticks_1s_symbol_bucket_idx
  ON market_ticks_1s (symbol, bucket_at DESC);

CREATE TABLE IF NOT EXISTS market_alerts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  symbol TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL,
  event_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS market_alerts_symbol_event_idx
  ON market_alerts (symbol, event_at DESC);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'User',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
