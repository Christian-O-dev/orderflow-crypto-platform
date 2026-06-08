# Order Flow Crypto Platform

Plataforma web real-time de analisis de Order Flow cripto.

El MVP se construye de forma incremental: primero una base estable con frontend, backend y tipos compartidos; despues datos mock; y mas adelante Binance, Tape, DOM, CVD y alertas.

## Requisitos

- Node.js 20 o superior
- npm 10 o superior

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

## Health check

Con el backend arrancado:

```bash
curl http://localhost:4000/health
```

Respuesta esperada:

```json
{ "status": "ok" }
```

## Roadmap

El roadmap detallado esta en:

- `ROADMAP_ORDERFLOW_CRIPTO_MVP.md`
- `pasos.md`
