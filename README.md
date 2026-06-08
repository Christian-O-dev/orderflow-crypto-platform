# Order Flow Crypto Platform

Plataforma web real-time de analisis de Order Flow cripto para `BTCUSDT`.

El MVP actual incluye backend Node.js + TypeScript, frontend React + TypeScript, Socket.io, trades reales de Binance, Tape, DOM basico, PriceChart, CVD Chart, alertas simples y persistencia opcional con PostgreSQL.

## Requisitos

- Node.js 20 o superior
- npm 10 o superior
- Docker Desktop opcional, solo si quieres usar PostgreSQL local con Docker

## Instalacion

```bash
npm install
```

## Desarrollo

Arrancar backend y frontend:

```bash
npm run dev
```

Arrancar solo backend:

```bash
npm run dev:backend
```

Arrancar solo frontend:

```bash
npm run dev:frontend
```

URLs por defecto:

```txt
Frontend: http://localhost:5173
Backend:  http://localhost:4000
```

## Health Check

Con el backend arrancado:

```bash
curl http://localhost:4000/health
```

Respuesta esperada:

```json
{ "status": "ok" }
```

## Datos De Mercado

Por defecto, el backend intenta conectar con Binance:

```txt
Trades: BTCUSDT trade stream
DOM:    BTCUSDT depth20 stream
```

Si Binance falla, el backend mantiene un fallback mock para que la UI no quede vacia.

Para forzar datos mock:

```bash
MARKET_DATA_MODE=mock npm run dev:backend
```

En PowerShell:

```powershell
$env:MARKET_DATA_MODE="mock"
npm run dev:backend
```

## PostgreSQL Opcional

La persistencia es opcional. Si `DATABASE_URL` no existe o PostgreSQL no esta disponible, el backend sigue funcionando y solo desactiva los guardados.

Variables de ejemplo:

```bash
cp .env.example .env
```

En PowerShell, si no tienes `cp`:

```powershell
Copy-Item .env.example .env
```

Con Docker Desktop instalado:

```bash
docker compose up -d
```

Tablas creadas:

```txt
market_ticks_1s
market_alerts
```

No se guardan ticks crudos. Solo se guardan snapshots agregados cada 1 segundo y alertas generadas.

Consultar datos:

```bash
docker exec -it orderflow-postgres psql -U orderflow -d orderflow
```

```sql
SELECT * FROM market_ticks_1s ORDER BY bucket_at DESC LIMIT 5;
SELECT * FROM market_alerts ORDER BY event_at DESC LIMIT 5;
```

## Scripts Utiles

```bash
npm run typecheck
npm run build
```

## Estructura

```txt
apps/frontend       React + TypeScript + Vite
apps/backend        Node.js + TypeScript + Express + Socket.io
packages/shared     Tipos y eventos compartidos
```

## Roadmap

La planificacion detallada esta en:

- `ROADMAP_ORDERFLOW_CRIPTO_MVP.md`
- `pasos.md`
