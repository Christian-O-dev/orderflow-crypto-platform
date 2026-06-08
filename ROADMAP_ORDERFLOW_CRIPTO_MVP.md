# ROADMAP.md — Plataforma de Order Flow Cripto

**Proyecto:** Plataforma Web Real-Time de Order Flow Cripto  
**Desarrollador:** Christian-O-dev  
**Versión del documento:** MVP factible con gráficos TradingView Lightweight Charts  
**Objetivo:** construir una terminal visual profesional para analizar liquidez, Tape, DOM, CVD y señales básicas de Order Flow en criptomonedas.

---

# 1. Enfoque corregido del proyecto

La idea original es muy buena, pero demasiado grande para empezar. Para que el desarrollo sea factible, el proyecto debe construirse como una terminal real-time pequeña, estable y visualmente profesional.

No conviene empezar intentando crear desde el día uno una plataforma institucional con multi-exchange, IA, replay, spoofing avanzado, heatmap, footprint y diario de trading.

Primero se debe construir una demo sólida:

```txt
BTCUSDT en vivo
Tape real
DOM básico
CVD básico
Gráfico de precio
Alertas simples
UI dark profesional
```

---

# 2. Nombre técnico recomendado

Evitar usar:

```txt
Aplicación Web Full-Stack de Alta Frecuencia
```

Usar mejor:

```txt
Plataforma Web Real-Time de Análisis de Order Flow Cripto
```

Motivo:

"Alta frecuencia" implica ejecución de órdenes, infraestructura de ultra baja latencia, colocación cerca de exchanges y competencia en microsegundos.

Este proyecto será una plataforma de análisis visual en tiempo real, no un bot HFT.

---

# 3. Decisión importante sobre TradingView

## 3.1 Sí usar TradingView, pero de forma correcta

Para facilitar el desarrollo visual, se recomienda usar:

```txt
Lightweight Charts de TradingView
```

No se recomienda depender del widget completo de TradingView para el núcleo del proyecto.

---

## 3.2 Qué debe hacer Lightweight Charts

Usarlo para:

```txt
Gráfico de precio
Velas básicas
CVD
Volumen
Líneas de referencia
Marcadores de alertas
Zonas visuales simples
```

---

## 3.3 Qué NO debe hacer TradingView en este MVP

No usar TradingView para:

```txt
DOM vertical
Tape / Time & Sales
Footprint avanzado
Heatmap de liquidez
Detector de spoofing
Detector de absorción
Replay del libro de órdenes
```

Estas partes son el valor diferencial del proyecto y conviene hacerlas con componentes propios.

---

## 3.4 Decisión final para el MVP

La arquitectura visual recomendada es:

```txt
Lightweight Charts -> gráficos clásicos
Componentes propios -> Order Flow real
```

Ejemplo:

```txt
Lightweight Charts:
- PriceChart
- CvdChart
- VolumeChart más adelante

Componentes propios:
- TapeTable
- DomTable
- AlertsPanel
- MarketHeader
```

---

# 4. Objetivo realista del MVP

## MVP recomendado — Versión 0.1

La primera versión debe demostrar que el sistema puede:

1. conectarse a Binance;
2. recibir datos reales de BTCUSDT;
3. procesar trades en backend;
4. calcular último precio, volumen y CVD;
5. enviar datos al frontend con Socket.io;
6. visualizar Tape;
7. visualizar gráfico de precio con Lightweight Charts;
8. visualizar CVD básico con Lightweight Charts;
9. mostrar DOM básico;
10. mostrar alertas simples;
11. mantener una UI oscura estilo terminal profesional.

---

# 5. Qué entra y qué no entra en el MVP

## 5.1 Sí entra en el MVP

```txt
Backend Node.js + TypeScript
Frontend React + TypeScript
Socket.io
Conexión WebSocket a Binance
BTCUSDT como primer símbolo
Tape en tiempo real
Último precio
CVD básico
Gráfico de precio con Lightweight Charts
Gráfico CVD con Lightweight Charts
DOM básico
Alertas simples
UI dark profesional
PostgreSQL opcional al final del MVP
```

---

## 5.2 No entra todavía

```txt
Multi-exchange
DOM agregado global
Spoofing avanzado
Iceberg detector
IA de mercado
Replay histórico
Diario de trading
Liquidaciones
Footprint completo
Heatmap avanzado
Sistema premium
Autenticación de usuarios
Pagos
```

---

# 6. Principios para no romper el proyecto

## 6.1 Construir por capas

No empezar por la interfaz final. Primero debe funcionar el flujo de datos:

```txt
Binance -> Backend -> Normalizador -> Socket.io -> Frontend -> UI
```

---

## 6.2 Empezar solo con Binance

No empezar con seis exchanges. Primero hacer funcionar bien uno:

```txt
Binance BTCUSDT
```

Después, cuando el MVP sea estable, agregar Coinbase o Bybit.

---

## 6.3 No enviar cada tick directamente al frontend

El backend debe agrupar datos por intervalos cortos:

```txt
Recibir muchos eventos por segundo
Agrupar cada 250ms
Enviar paquete compacto al frontend
Actualizar UI sin saturar React
```

---

## 6.4 No meter cálculos pesados dentro de React

React debe pintar la UI, no calcular todo el mercado.

El backend debe calcular:

```txt
lastPrice
buyVolume
sellVolume
cvd
large trades
alertas básicas
```

El frontend debe recibir datos ya preparados.

---

## 6.5 No usar animaciones pesadas

Framer Motion puede usarse para detalles pequeños, pero no para animar cada fila del Tape o del DOM.

En datos rápidos, demasiadas animaciones rompen el rendimiento.

---

## 6.6 No guardar todo desde el principio

Para el MVP, no guardar todos los ticks crudos.

Guardar solo cuando el sistema ya funcione:

```txt
market_ticks_1s
market_alerts
```

---

# 7. Stack recomendado definitivo

## Frontend

```txt
React
TypeScript
Vite
Zustand
Tailwind CSS
Socket.io Client
Lightweight Charts
Framer Motion solo para microinteracciones
```

---

## Backend

```txt
Node.js
TypeScript
Express o Fastify
ws
socket.io
zod
dotenv
tsx
```

---

## Base de datos

Para empezar:

```txt
Sin base de datos
```

Después:

```txt
PostgreSQL con Docker
```

Más adelante:

```txt
TimescaleDB o ClickHouse
```

---

# 8. Arquitectura recomendada

```txt
orderflow-crypto-platform/
│
├── apps/
│   ├── frontend/
│   │   └── React + TypeScript + Zustand + Tailwind + Lightweight Charts
│   │
│   └── backend/
│       └── Node.js + TypeScript + ws + socket.io
│
├── packages/
│   └── shared/
│       └── tipos y contratos compartidos
│
├── docs/
│   └── documentación técnica
│
├── docker-compose.yml
├── package.json
└── README.md
```

---

# 9. Flujo interno del backend

```txt
Binance Connector
    ↓
Normalizer
    ↓
Market Data Engine
    ↓
Signal Engine
    ↓
Realtime Gateway
    ↓
Frontend
```

---

# 10. Responsabilidad de cada módulo

| Módulo | Responsabilidad |
|---|---|
| `exchanges/binance/` | Conectarse al WebSocket de Binance |
| `normalizers/` | Convertir mensajes de Binance a formato propio |
| `market-engine/` | Calcular precio, volumen, CVD y estado del mercado |
| `signal-engine/` | Detectar trades grandes, spikes y muros simples |
| `realtime/` | Emitir datos al frontend con Socket.io |
| `database/` | Guardar datos agregados cuando toque |
| `shared/` | Compartir tipos TypeScript entre frontend y backend |
| `features/charts/` | Gráficos con Lightweight Charts |
| `features/tape/` | Cinta de operaciones ejecutadas |
| `features/dom/` | Tabla DOM propia |
| `features/alerts/` | Panel de alertas |

---

# 11. Estructura de carpetas recomendada

```txt
orderflow-crypto-platform/
│
├── apps/
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── layout/
│   │   │   │   ├── market/
│   │   │   │   └── ui/
│   │   │   │
│   │   │   ├── features/
│   │   │   │   ├── charts/
│   │   │   │   │   ├── PriceChart.tsx
│   │   │   │   │   ├── CvdChart.tsx
│   │   │   │   │   └── VolumeChart.tsx
│   │   │   │   │
│   │   │   │   ├── tape/
│   │   │   │   │   └── TapeTable.tsx
│   │   │   │   │
│   │   │   │   ├── dom/
│   │   │   │   │   └── DomTable.tsx
│   │   │   │   │
│   │   │   │   └── alerts/
│   │   │   │       └── AlertsPanel.tsx
│   │   │   │
│   │   │   ├── stores/
│   │   │   │   └── marketStore.ts
│   │   │   │
│   │   │   ├── sockets/
│   │   │   │   └── marketSocket.ts
│   │   │   │
│   │   │   ├── types/
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   │
│   │   └── package.json
│   │
│   └── backend/
│       ├── src/
│       │   ├── config/
│       │   ├── exchanges/
│       │   │   └── binance/
│       │   │       ├── BinanceTradeConnector.ts
│       │   │       └── BinanceDepthConnector.ts
│       │   │
│       │   ├── normalizers/
│       │   │   └── binanceNormalizer.ts
│       │   │
│       │   ├── market-engine/
│       │   │   └── MarketEngine.ts
│       │   │
│       │   ├── signal-engine/
│       │   │   └── SignalEngine.ts
│       │   │
│       │   ├── realtime/
│       │   │   └── socketServer.ts
│       │   │
│       │   ├── database/
│       │   ├── types/
│       │   └── index.ts
│       │
│       └── package.json
│
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── market.types.ts
│       │   └── socket-events.ts
│       └── package.json
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   └── EXCHANGE_INTEGRATION.md
│
├── docker-compose.yml
├── package.json
├── .gitignore
└── README.md
```

---

# 12. Modelo de datos inicial

## 12.1 Trade normalizado

```ts
export type NormalizedTrade = {
  exchange: "binance";
  symbol: "BTCUSDT";
  tradeId: string;
  price: number;
  quantity: number;
  side: "buy" | "sell";
  timestamp: number;
};
```

---

## 12.2 Nivel de DOM

```ts
export type OrderBookLevel = {
  price: number;
  bidSize: number;
  askSize: number;
  bidTotal?: number;
  askTotal?: number;
};
```

---

## 12.3 Punto para gráfico de precio

```ts
export type PricePoint = {
  time: number;
  value: number;
};
```

---

## 12.4 Punto para gráfico CVD

```ts
export type CvdPoint = {
  time: number;
  value: number;
};
```

---

## 12.5 Estado de mercado

```ts
export type MarketSnapshot = {
  symbol: string;
  exchange: "binance";
  lastPrice: number;
  cvd: number;
  buyVolume: number;
  sellVolume: number;
  trades: NormalizedTrade[];
  orderBook: OrderBookLevel[];
  pricePoints: PricePoint[];
  cvdPoints: CvdPoint[];
  timestamp: number;
};
```

---

## 12.6 Alerta de mercado

```ts
export type MarketAlert = {
  id: string;
  type: "large_trade" | "cvd_spike" | "liquidity_wall" | "liquidity_removed";
  symbol: string;
  message: string;
  severity: "low" | "medium" | "high";
  timestamp: number;
};
```

---

# 13. Diseño visual recomendado del MVP

La primera pantalla debe parecer una terminal de trading profesional.

```txt
┌──────────────────────────────────────────────────────────────┐
│ BTCUSDT | Last Price | CVD | Buy Vol | Sell Vol | WS Status  │
├─────────────────┬───────────────────────────┬────────────────┤
│ DOM propio      │ PriceChart                 │ Tape propio    │
│                 │ CvdChart                   │                │
│                 │ Lightweight Charts         │                │
├─────────────────┴───────────────────────────┴────────────────┤
│ AlertsPanel                                                   │
└──────────────────────────────────────────────────────────────┘
```

---

## 13.1 Colores recomendados

```txt
Fondo principal: #0B0E14
Paneles: #111827
Bordes: rgba(255, 255, 255, 0.08)
Texto principal: #E5E7EB
Texto secundario: #9CA3AF
Compras: verde
Ventas: rojo
Alertas: amarillo/naranja
Acento: púrpura o cian
```

---

## 13.2 Fuentes

Usar fuente monoespaciada para datos numéricos:

```txt
precio
cantidad
volumen
CVD
DOM
Tape
```

Ejemplos:

```txt
font-mono
tabular-nums
```

---

