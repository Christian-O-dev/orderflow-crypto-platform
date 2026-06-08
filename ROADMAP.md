# ROADMAP.md

Este archivo resume la direccion del MVP. La planificacion detallada vive en:

- `ROADMAP_ORDERFLOW_CRIPTO_MVP.md`
- `pasos.md`

## MVP 0.1

Objetivo: construir una terminal visual profesional para analizar Order Flow cripto en tiempo real.

Primera demo estable:

- BTCUSDT en vivo
- Backend Node.js + TypeScript
- Frontend React + TypeScript
- Socket.io
- Binance WebSocket
- Tape real
- DOM basico
- CVD basico
- Graficos con TradingView Lightweight Charts
- Alertas simples
- UI oscura estilo terminal profesional

## Orden de construccion

1. Preparacion del monorepo.
2. Backend realtime con datos mock.
3. Frontend conectado al backend.
4. PriceChart con Lightweight Charts.
5. Trades reales de Binance.
6. Tape profesional.
7. CVD Chart.
8. DOM basico.
9. Alertas simples.
10. Persistencia minima con PostgreSQL.
11. Limpieza final del MVP.

## Reglas

- Empezar solo con Binance BTCUSDT.
- No enviar cada tick directamente al frontend.
- No calcular mercado pesado dentro de React.
- No usar TradingView widget para Tape, DOM o alertas.
- No guardar ticks crudos al inicio.
- No afirmar manipulacion real en alertas.
