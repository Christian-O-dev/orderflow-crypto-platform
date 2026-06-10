Roadmap incremental actualizado con Lightweight Charts

---

## Fase 0 — Preparación del proyecto

### Objetivo

Crear la base del repositorio sin lógica compleja.

### Tareas

- Crear repo en GitHub.
- Crear monorepo.
- Crear `apps/frontend`.
- Crear `apps/backend`.
- Crear `packages/shared`.
- Configurar TypeScript.
- Configurar `.gitignore`.
- Crear `README.md`.
- Crear `ROADMAP.md`.

### Criterio de terminado

```txt
npm install funciona
frontend arranca
backend arranca
GET /health responde
```

---

## Fase 1 — Backend mínimo real-time con datos mock

### Objetivo

Tener backend y frontend comunicándose antes de usar Binance.

### Tareas

- Crear servidor Express.
- Crear servidor Socket.io.
- Crear evento `market:snapshot`.
- Emitir datos falsos cada 500ms.
- Crear tipos compartidos.
- Crear estado de mercado simulado.

### Criterio de terminado

El frontend recibe:

```txt
precio simulado
CVD simulado
trades falsos
estado de conexión
```

---

## Fase 2 — Frontend base tipo terminal

### Objetivo

Crear la interfaz base sin gráficos todavía.

### Tareas

- Crear layout dark.
- Crear `MarketHeader`.
- Crear `TapeTable` simple.
- Crear `AlertsPanel` vacío.
- Crear Zustand store.
- Conectar Socket.io client.
- Mostrar datos mock.

### Criterio de terminado

La UI muestra los datos mock en tiempo real.

---

## Fase 3 — Primer gráfico con Lightweight Charts

### Objetivo

Agregar TradingView Lightweight Charts sin complicar el backend.

### Tareas

- Instalar `lightweight-charts`.
- Crear `PriceChart.tsx`.
- Leer `pricePoints` desde Zustand.
- Crear el chart solo una vez.
- Actualizar el último punto sin recrear el gráfico.
- Usar diseño dark.
- Limpiar el chart al desmontar.

### Criterio de terminado

Se ve un gráfico de precio con datos mock.

---

## Fase 4 — Conexión real a Binance Trades

### Objetivo

Reemplazar los trades mock por datos reales de Binance.

### Tareas

- Crear `BinanceTradeConnector`.
- Usar la librería `ws`.
- Conectarse a trades de `BTCUSDT`.
- Normalizar trades.
- Calcular:
  - último precio;
  - volumen comprador;
  - volumen vendedor;
  - CVD.
- Enviar paquetes al frontend cada 250ms.
- Mantener fallback mock si Binance falla.

### Criterio de terminado

El Tape y el gráfico muestran datos reales de Binance.

---

## Fase 5 — Tape profesional

### Objetivo

Convertir la cinta de trades en una herramienta visual útil.

### Tareas

- Crear `TapeTable`.
- Mostrar máximo 150 trades.
- Columnas:
  - hora;
  - precio;
  - cantidad;
  - lado;
  - exchange.
- Resaltar compras y ventas.
- Resaltar trades grandes.
- Usar `font-mono`.
- Evitar animaciones pesadas.

### Criterio de terminado

El Tape se actualiza fluido sin congelar el navegador.

---

## Fase 6 — CVD Chart con Lightweight Charts

### Objetivo

Mostrar el CVD acumulado en un gráfico separado.

### Tareas

- Crear `CvdChart.tsx`.
- El backend calcula el CVD.
- El frontend solo lo pinta.
- Mantener máximo 500 puntos.
- Actualizar sin recrear el chart.
- Usar diseño dark.
- Mostrar si domina presión compradora o vendedora.

### Criterio de terminado

El usuario puede ver la presión acumulada de compras/ventas.

---

## Fase 7 — DOM básico

### Objetivo

Mostrar profundidad de mercado básica.

### Tareas

- Crear conector de profundidad Binance.
- Construir order book local.
- Mantener bids y asks.
- Enviar al frontend 20 o 50 niveles.
- Crear `DomTable.tsx`.
- Mostrar:
  - precio;
  - tamaño;
  - acumulado.
- Separar bids y asks visualmente.

### Criterio de terminado

El DOM muestra niveles reales de liquidez.

---

## Fase 8 — Alertas simples

### Objetivo

Detectar señales básicas fáciles de entender.

### Alertas iniciales

```txt
large_trade
cvd_spike
liquidity_wall
liquidity_removed
```

### Tareas

- Crear `SignalEngine`.
- Emitir evento `market:alert`.
- Crear `AlertsPanel`.
- Guardar máximo 100 alertas en memoria.
- Usar mensajes prudentes.

### Criterio de terminado

El usuario recibe alertas visuales en tiempo real.

---

## Fase 9 — Persistencia mínima con PostgreSQL

### Objetivo

Guardar solo datos agregados útiles.

### Tareas

- Crear `docker-compose.yml` con PostgreSQL.
- Crear `.env.example`.
- Crear módulo `database`.
- Crear tablas:
  - `market_ticks_1s`;
  - `market_alerts`.
- Guardar datos agregados cada 1 segundo.
- Guardar alertas.

### Criterio de terminado

Los datos se guardan y pueden consultarse desde SQL.

---

## Fase 10 — Limpieza del MVP

### Objetivo

Dejar una versión presentable y estable.

### Tareas

- Revisar errores TypeScript.
- Limpiar código duplicado.
- Mejorar nombres de componentes.
- Actualizar README.
- Añadir instrucciones para ejecutar.
- Crear capturas de pantalla.
- Subir a GitHub.
- No añadir nuevas funcionalidades en esta fase.

### Criterio de terminado

El proyecto se puede ejecutar siguiendo el README.

---

# 15. Setup en VS Code

## 15.1 Crear proyecto

```bash
mkdir orderflow-crypto-platform
cd orderflow-crypto-platform
git init
npm init -y
mkdir apps packages docs
```

---

## 15.2 Crear frontend

```bash
npm create vite@latest apps/frontend -- --template react-ts
cd apps/frontend
npm install
npm install zustand socket.io-client lightweight-charts framer-motion clsx
npm install tailwindcss @tailwindcss/vite
cd ../..
```

---

## 15.3 Crear backend

```bash
mkdir -p apps/backend/src
cd apps/backend
npm init -y
npm install express socket.io ws cors dotenv zod
npm install -D typescript tsx @types/node @types/express @types/cors
npx tsc --init
cd ../..
```

---

## 15.4 Crear paquete shared

```bash
mkdir -p packages/shared/src
cd packages/shared
npm init -y
npm install -D typescript
npx tsc --init
cd ../..
```

---

## 15.5 Configurar package.json raíz

Editar el `package.json` raíz:

```json
{
  "name": "orderflow-crypto-platform",
  "version": "0.1.0",
  "private": true,
  "workspaces": [
    "apps/frontend",
    "apps/backend",
    "packages/shared"
  ],
  "scripts": {
    "dev:frontend": "npm run dev -w apps/frontend",
    "dev:backend": "npm run dev -w apps/backend",
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\""
  },
  "devDependencies": {
    "concurrently": "latest"
  }
}
```

Instalar:

```bash
npm install
npm install -D concurrently
```

---

# 16. Scripts recomendados

## Backend `apps/backend/package.json`

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

---

## Frontend `apps/frontend/package.json`

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  }
}
```

---

# 17. Prompts para Codex en VS Code

---

## Prompt 1 — Crear arquitectura base

```txt
Actúa como desarrollador senior full-stack. Revisa este repositorio y crea una estructura limpia para una plataforma real-time de Order Flow cripto.

Objetivo:
- Mantener monorepo con apps/frontend, apps/backend y packages/shared.
- No crear lógica avanzada todavía.
- Crear carpetas base en frontend y backend.
- Crear tipos compartidos básicos en packages/shared.
- No eliminar archivos existentes sin explicar por qué.
- Después de modificar, explícame qué archivos tocaste.

Criterios:
- El frontend debe seguir funcionando con Vite.
- El backend debe poder arrancar con npm run dev.
- Debe existir endpoint GET /health.
```

---

## Prompt 2 — Backend Socket.io con datos mock

```txt
Implementa un backend mínimo con Express + Socket.io + TypeScript.

Necesito:
- GET /health que devuelva { status: "ok" }.
- Servidor Socket.io con CORS para localhost.
- Evento "market:snapshot" emitido cada 500ms con datos falsos.
- Tipos claros para MarketSnapshot y NormalizedTrade.
- Código separado en carpetas:
  - src/realtime
  - src/market-engine
  - src/types
- No conectes todavía a Binance.
- No uses base de datos todavía.

Al final dime cómo probarlo desde VS Code.
```

---

## Prompt 3 — Frontend conectado al backend

```txt
Implementa en React + TypeScript una conexión a Socket.io.

Necesito:
- Crear socket client.
- Crear Zustand store para market snapshot.
- Mostrar estado de conexión.
- Mostrar último precio.
- Mostrar CVD.
- Mostrar lista simple de trades mock.
- Crear layout dark estilo terminal.
- Evitar renders innecesarios.
- Mantener el código modular.

No implementes gráficos todavía.
No conectes a Binance todavía.
```

---

## Prompt 4 — Instalar y crear PriceChart con Lightweight Charts

```txt
Implementa Lightweight Charts en el frontend React + TypeScript.

Objetivo:
- Instalar y usar lightweight-charts.
- Crear componente PriceChart.tsx en src/features/charts.
- El componente debe leer pricePoints desde el Zustand store.
- No debe recrear el chart en cada render.
- Debe actualizar el último punto en tiempo real.
- Diseño dark compatible con la UI del proyecto.
- Debe limpiar correctamente el chart al desmontar.
- No tocar backend.
- No implementar indicadores avanzados todavía.

Criterios:
- El gráfico debe mostrar el precio de BTCUSDT.
- Debe funcionar aunque todavía lleguen datos mock.
```

---

## Prompt 5 — Conectar Binance trades

```txt
Ahora conecta el backend a Binance WebSocket para recibir trades reales de BTCUSDT.

Necesito:
- Crear BinanceTradeConnector en src/exchanges/binance.
- Usar la librería ws.
- Reconectar si se cae la conexión.
- Normalizar cada trade al formato NormalizedTrade.
- Calcular:
  - lastPrice
  - buyVolume
  - sellVolume
  - cvd
- Emitir al frontend paquetes cada 250ms, no cada tick individual.
- Mantener el modo mock como fallback si falla Binance.
- No implementar DOM todavía.

Al final explícame cómo probar que llegan trades reales.
```

---

## Prompt 6 — Tape profesional

```txt
Mejora el frontend creando un Tape profesional.

Necesito:
- Componente TapeTable.
- Mostrar máximo 150 trades.
- Columnas:
  - hora
  - precio
  - cantidad
  - lado
  - exchange
- Colores:
  - verde para buy
  - rojo para sell
- Resaltar trades grandes.
- Usar fuente monoespaciada para números.
- Optimizar para que no se congele con datos rápidos.
- No añadir librerías pesadas.
```

---

## Prompt 7 — CVD Chart

```txt
Crea un componente CvdChart.tsx usando lightweight-charts.

Objetivo:
- Mostrar el CVD acumulado en una línea.
- Leer cvdPoints desde el Zustand store.
- Mantener máximo 500 puntos visibles.
- Actualizar sin recrear el gráfico.
- Usar diseño dark.
- No mezclar la lógica de cálculo del CVD en el frontend; el CVD debe venir calculado desde backend.
```

---

## Prompt 8 — DOM básico

```txt
Implementa DOM básico para BTCUSDT.

Necesito:
- Conector de profundidad de Binance.
- Construir un order book local de forma segura.
- Mantener bids y asks.
- Enviar al frontend solo los primeros 20 o 50 niveles.
- Crear componente DomTable.
- Mostrar:
  - precio
  - tamaño
  - acumulado
- Separar visualmente bids y asks.
- No hacer DOM multi-exchange todavía.
```

---

## Prompt 9 — Alertas simples

```txt
Implementa un sistema básico de alertas de mercado.

Alertas:
- large_trade: trade con cantidad superior a un umbral configurable.
- cvd_spike: cambio fuerte de CVD en pocos segundos.
- liquidity_wall: nivel grande en el DOM.
- liquidity_removed: desaparición rápida de un muro.

Requisitos:
- Crear signal-engine en backend.
- Emitir evento "market:alert".
- Mostrar panel de alertas en frontend.
- Guardar máximo 100 alertas en memoria.
- No afirmar manipulación, usar mensajes prudentes.
```

---

## Prompt 10 — PostgreSQL local

```txt
Agrega persistencia mínima con PostgreSQL usando Docker Compose.

Necesito:
- docker-compose.yml con postgres.
- Variables de entorno en .env.example.
- Crear módulo database.
- Crear script SQL inicial con tablas:
  - market_ticks_1s
  - market_alerts
- Guardar datos agregados cada 1 segundo.
- Guardar alertas generadas.
- No guardar todos los ticks crudos todavía.
```

---

## Prompt 11 — Limpieza final del MVP

```txt
Revisa todo el MVP y haz una limpieza técnica.

Objetivos:
- Eliminar código duplicado.
- Mejorar nombres de carpetas y funciones.
- Asegurar que npm run dev funciona.
- Asegurar que frontend y backend arrancan.
- Revisar errores TypeScript.
- Añadir comentarios solo donde aporten valor.
- Actualizar README.md con instrucciones reales para ejecutar el proyecto.
- No añadir nuevas funcionalidades.
```

---

# 18. Checklist diario de trabajo con Codex

Antes de pedir una tarea a Codex:

```txt
1. git status
2. Si la versión funciona, hacer commit.
3. Pedir a Codex solo una tarea pequeña.
4. Revisar archivos modificados.
5. Ejecutar backend.
6. Ejecutar frontend.
7. Probar manualmente.
8. Si funciona, commit.
9. Si falla, pedir a Codex que corrija solo el error.
```

---

# 19. Comandos Git útiles

## Ver estado

```bash
git status
```

## Guardar cambios

```bash
git add .
git commit -m "feat: setup base order flow platform"
```

## Crear rama

```bash
git switch -c feature/backend-market-data
```

## Cambiar de rama

```bash
git switch nombre-rama
```

## Subir rama

```bash
git push -u origin feature/backend-market-data
```

## Bajar cambios

```bash
git pull origin nombre-rama
```

---

# 20. Orden recomendado de commits

```txt
chore: initialize monorepo structure
feat: add backend health endpoint
feat: add socket realtime mock snapshots
feat: add frontend socket connection
feat: add market dashboard layout
feat: add lightweight price chart
feat: add binance trade connector
feat: add tape table
feat: add cvd calculation
feat: add cvd chart
feat: add basic order book connector
feat: add dom table
feat: add market alerts
feat: add postgres docker setup
docs: update setup instructions
```

---

# 21. Errores comunes que debes evitar

## Error 1: empezar por seis exchanges

Solución:

```txt
Primero Binance BTCUSDT.
```

---

## Error 2: usar TradingView widget para todo

Solución:

```txt
Usar Lightweight Charts para gráficos.
Crear DOM, Tape y alertas con componentes propios.
```

---

## Error 3: meter IA desde el inicio

Solución:

```txt
IA solo cuando el backend ya genere resúmenes útiles.
```

---

## Error 4: guardar cada tick

Solución:

```txt
Guardar datos agregados por segundo.
```

---

## Error 5: actualizar React por cada trade

Solución:

```txt
Agrupar en backend cada 250ms.
Actualizar store de forma controlada.
```

---

## Error 6: hacer todo en App.tsx

Solución:

```txt
Separar features:
charts
tape
dom
alerts
layout
sockets
stores
```

---

## Error 7: afirmar manipulación real

Solución:

```txt
Usar mensajes como:
- posible absorción
- liquidez retirada
- muro detectado
- desequilibrio probable
```

---

# 22. Definición final de MVP terminado

El MVP se considera terminado cuando:

```txt
Backend conecta con Binance
Frontend recibe datos reales
Tape muestra trades reales
PriceChart muestra precio en vivo
CvdChart muestra CVD
DOM muestra profundidad básica
AlertsPanel muestra alertas simples
UI dark parece terminal profesional
El proyecto corre con npm run dev
README explica instalación y ejecución
Código está separado en módulos
Proyecto está subido a GitHub
```

---

# 23. Funciones futuras después del MVP

## Versión 0.2

```txt
Segundo exchange
Selector de símbolo
CVD por exchange
Mejoras visuales
```

---

## Versión 0.3

```txt
Imbalance
Absorción probable
Liquidez retirada
Sistema de alertas configurable
```

---

## Versión 0.4

```txt
DOM agregado
Heatmap
Volume Profile
Footprint básico
```

---

## Versión 0.5

```txt
Diario de trading
Replay histórico
IA de resumen
Autenticación de usuarios
```

---

# 24. Consejo final

La prioridad no es tener muchas funciones. La prioridad es tener una primera pantalla que funcione muy bien.

Una demo con:

```txt
BTCUSDT en vivo
Tape real
DOM básico
PriceChart
CvdChart
Alertas de volumen
Diseño oscuro profesional
```

ya sería un proyecto fuerte.

Primero construye una terminal pequeña, estable y bonita. Después la conviertes en plataforma.

Hasta aqui todo hecho...

---


# Continuación del Roadmap — Funciones Premium de Order Flow

Esta continuación empieza después de tener terminado el MVP base:

```txt
BTCUSDT en vivo
Tape real
DOM básico
PriceChart
CvdChart
Alertas simples
UI dark profesional
```

El objetivo de esta nueva etapa es evolucionar el proyecto hacia una terminal más profesional, inspirada en herramientas premium de análisis de liquidez, pero usando datos públicos y lógica propia.

---

# Fase 11 — Large Trades Pro

## Objetivo

Mejorar el detector actual de trades grandes para convertirlo en un indicador profesional tipo `Large Trades`.

Este indicador no mira órdenes pendientes. Mira operaciones reales ya ejecutadas en el mercado.

```txt
Large Trade = compra o venta ejecutada con valor alto en USD
```

---

## Concepto técnico

Actualmente el sistema puede detectar trades grandes por cantidad en BTC. La mejora es calcular el valor real en dólares:

```txt
notionalUsd = price * quantity
```

Ejemplo:

```txt
BTCUSDT price = 80,000
quantity = 2 BTC

notionalUsd = 160,000 USDT
```

---

## Nuevos umbrales recomendados

```txt
Medium Large Trade: >= 100,000 USDT
High Large Trade:   >= 500,000 USDT
Whale Trade:        >= 1,000,000 USDT
```

Estos valores deben ser configurables con variables de entorno.

---

## Variables de entorno

```env
LARGE_TRADE_MEDIUM_USD=100000
LARGE_TRADE_HIGH_USD=500000
LARGE_TRADE_WHALE_USD=1000000
```

---

## Tipo compartido recomendado

Agregar en `packages/shared/src/index.ts`:

```ts
export type LargeTradeEvent = {
  id: string;
  exchange: Exchange;
  symbol: MarketSymbol;
  side: "buy" | "sell";
  price: number;
  quantity: number;
  notionalUsd: number;
  severity: "medium" | "high" | "whale";
  timestamp: number;
};
```

---

## Backend — Tareas

* Modificar `SignalEngine`.
* Calcular `notionalUsd = trade.price * trade.quantity`.
* Detectar large trades usando valor en USD, no solo cantidad en BTC.
* Crear evento Socket.io:

```txt
market:large_trade
```

* Emitir un `LargeTradeEvent` cuando se supere un umbral.
* Mantener también las alertas existentes.
* No tocar todavía el DOM.
* No cambiar todavía el conector de Binance.
* No añadir base de datos en esta fase.

---

## Frontend — Tareas

* Agregar `largeTrades` al Zustand store.
* Guardar máximo 100 large trades recientes.
* Crear componente:

```txt
LargeTradesPanel.tsx
```

* Mostrar columnas:

```txt
Hora
Lado
Precio
Cantidad BTC
Valor USD
Severidad
Exchange
```

* Colores recomendados:

```txt
Buy  -> verde
Sell -> rojo
Whale -> amarillo / naranja
```

---

## Criterios de aceptación

La fase se considera terminada cuando:

```txt
npm run typecheck pasa
npm run build pasa
El backend detecta trades por valor USD
El frontend muestra LargeTradesPanel
Las alertas actuales siguen funcionando
El Tape sigue funcionando
El DOM sigue funcionando
No se rompe PriceChart ni CvdChart
```

---

## Prompt para Codex

```txt
Quiero agregar un indicador Large Trades profesional sin romper el MVP actual.

Contexto:
- El proyecto ya tiene SignalEngine con large_trade.
- El backend recibe trades reales de Binance.
- El frontend tiene TapeTable, AlertsPanel, PriceChart, CvdChart y Zustand store.
- Actualmente los trades grandes se detectan por cantidad BTC.
- Quiero detectarlos por valor USD usando notionalUsd = price * quantity.

Objetivo:
1. Crear tipo LargeTradeEvent en packages/shared/src/index.ts.
2. Agregar evento socket "market:large_trade" en SOCKET_EVENTS.
3. Calcular notionalUsd en backend.
4. Agregar variables:
   - LARGE_TRADE_MEDIUM_USD=100000
   - LARGE_TRADE_HIGH_USD=500000
   - LARGE_TRADE_WHALE_USD=1000000
5. Emitir LargeTradeEvent desde SignalEngine.
6. Guardar últimos 100 large trades en Zustand store.
7. Crear componente LargeTradesPanel.
8. Mostrar hora, lado, precio, cantidad, valor USD, severidad y exchange.
9. No tocar DOM todavía.
10. No tocar base de datos todavía.
11. No modificar conectores Binance.
12. Mantener Tape, PriceChart y CvdChart funcionando.

Criterios:
- npm run typecheck pasa.
- npm run build pasa.
- El panel muestra large trades cuando superan el umbral.
- Las alertas existentes siguen funcionando.
```

---

# Fase 12 — Whale Orders Básico con DOM Actual

## Objetivo

Agregar un panel `Whale Orders` usando el DOM actual del MVP.

Esta primera versión será limitada porque el MVP usa profundidad reducida del libro de órdenes. Aun así, sirve para crear una demo visual y empezar a detectar grandes muros de liquidez.

---

## Concepto técnico

Un `Whale Order` en esta fase será un nivel grande de liquidez pendiente en el libro de órdenes.

```txt
Whale Order = nivel bid/ask con notionalUsd alto
```

Cálculo:

```txt
notionalUsd = price * size
```

Ejemplo:

```txt
price = 80,000
size = 25 BTC

notionalUsd = 2,000,000 USDT
```

---

## Importante

No afirmar que es una ballena real.

Usar nombres prudentes:

```txt
Whale Liquidity
Liquidity Wall
Large Limit Order
Muro de liquidez
```

Evitar:

```txt
Manipulación confirmada
Ballena confirmada
Entrada segura
```

---

## Umbral inicial recomendado

```env
WHALE_ORDER_THRESHOLD_USD=1000000
```

---

## Tipo compartido recomendado

Agregar en `packages/shared/src/index.ts`:

```ts
export type WhaleLiquidityLevel = {
  id: string;
  exchange: Exchange;
  symbol: MarketSymbol;
  side: "bid" | "ask";
  price: number;
  quantity: number;
  notionalUsd: number;
  firstSeen: number;
  lastSeen: number;
  durationMs: number;
  status: "active" | "cancelled" | "partially_removed";
};
```

---

## Backend — Tareas

* Crear un nuevo módulo:

```txt
apps/backend/src/whale-engine/WhaleOrderEngine.ts
```

* Recibir el `orderBook` actual.
* Revisar cada nivel bid/ask.
* Calcular `notionalUsd`.
* Detectar niveles mayores al umbral.
* Guardar en memoria:

  * precio;
  * lado;
  * cantidad;
  * valor USD;
  * primera vez visto;
  * última vez visto;
  * duración.
* Detectar si un muro desaparece.
* Marcarlo como `cancelled` o `partially_removed`.
* Emitir evento Socket.io:

```txt
market:whale_orders
```

---

## Frontend — Tareas

* Agregar `whaleOrders` al Zustand store.
* Crear componente:

```txt
WhaleOrdersPanel.tsx
```

* Crear toggle de vista:

```txt
[DOM] [Whale Orders]
```

* Mostrar columnas:

```txt
Side
Price
Quantity
Value USD
Duration
Status
```

* Mostrar aviso:

```txt
Versión limitada a Binance depth20.
```

---

## Criterios de aceptación

La fase se considera terminada cuando:

```txt
npm run typecheck pasa
npm run build pasa
El DOM clásico sigue funcionando
Existe vista Whale Orders
Se detectan muros grandes dentro del DOM actual
Se marca si un muro desaparece
No se cambia todavía a order book profundo
No se envían miles de niveles al frontend
```

---

## Prompt para Codex

```txt
Quiero agregar un panel Whale Orders básico usando el DOM actual depth20 del MVP.

Contexto:
- El backend ya recibe orderBook desde BinanceDepthConnector.
- El DOM actual solo tiene top 20 niveles.
- Quiero una primera versión limitada para detectar muros grandes dentro de esos 20 niveles.
- No quiero cambiar todavía a diff depth stream profundo.
- No quiero copiar Coinglass, quiero una implementación propia.

Objetivo:
1. Crear tipo WhaleLiquidityLevel en packages/shared/src/index.ts.
2. Agregar evento socket "market:whale_orders" en SOCKET_EVENTS.
3. Crear WhaleOrderEngine en backend.
4. Detectar niveles donde:
   notionalUsd = price * size >= WHALE_ORDER_THRESHOLD_USD.
5. Umbral inicial:
   WHALE_ORDER_THRESHOLD_USD=1000000.
6. Cada whale level debe tener:
   - id
   - exchange
   - symbol
   - side bid/ask
   - price
   - quantity
   - notionalUsd
   - firstSeen
   - lastSeen
   - durationMs
   - status active/cancelled/partially_removed
7. Emitir evento socket "market:whale_orders".
8. Guardar últimos whale orders en Zustand store.
9. Crear componente WhaleOrdersPanel.
10. Añadir toggle en UI:
   [DOM] [Whale Orders]
11. Mostrar aviso:
   "Versión limitada a Binance depth20".
12. No cambiar el conector de profundidad todavía.

Criterios:
- npm run typecheck pasa.
- npm run build pasa.
- DOM actual sigue funcionando.
- WhaleOrdersPanel muestra niveles grandes si aparecen.
```

---

# Fase 13 — Order Book Profundo para Whale Orders Real

## Objetivo

Evolucionar el sistema de `Whale Orders` para detectar liquidez más alejada del precio actual.

La versión anterior usa solo el DOM reducido. Esta fase construye un order book local profundo usando snapshot inicial y actualizaciones diferenciales.

---

## Problema que resuelve

El DOM básico solo muestra pocos niveles cercanos al precio.

Para detectar muros como:

```txt
Bid wall lejos del precio
Ask wall lejos del precio
Liquidez acumulada por zonas
Órdenes grandes que aparecen y desaparecen
```

se necesita un libro de órdenes más profundo.

---

## Nuevo enfoque

Crear un conector especializado:

```txt
BinanceDeepOrderBookConnector
```

Responsabilidades:

```txt
1. Obtener snapshot REST inicial.
2. Conectarse a diff depth stream.
3. Sincronizar snapshot + updates.
4. Mantener bids y asks en memoria.
5. Detectar pérdida de secuencia.
6. Resincronizar si hay error.
7. Enviar al frontend solo información útil.
```

---

## Arquitectura recomendada

```txt
BinanceDeepOrderBookConnector
        ↓
DeepOrderBookEngine
        ↓
WhaleOrderEngine
        ↓
Socket.io
        ↓
Frontend
```

---

## Regla importante de rendimiento

No enviar el order book completo al frontend.

Enviar solo:

```txt
Top 20 niveles -> DomTable
Whale levels -> WhaleOrdersPanel
Liquidity bands -> PriceChart overlay futuro
```

---

## Backend — Tareas

* Crear:

```txt
apps/backend/src/exchanges/binance/BinanceDeepOrderBookConnector.ts
```

* Crear:

```txt
apps/backend/src/market-engine/DeepOrderBookEngine.ts
```

* Mantener estructuras:

```ts
private bids = new Map<number, number>();
private asks = new Map<number, number>();
```

* Crear método para obtener top 20 niveles.
* Crear método para obtener niveles con notional alto.
* Reemplazar gradualmente el uso de `depth20` para Whale Orders.
* Mantener `depth20` como fallback si el order book profundo falla.

---

## Frontend — Tareas

* No cambiar mucho el frontend.
* `DomTable` debe seguir recibiendo top 20.
* `WhaleOrdersPanel` debe empezar a recibir niveles más profundos.
* Mostrar etiqueta:

```txt
Deep Order Book activo
```

o

```txt
Fallback depth20 activo
```

---

## Criterios de aceptación

La fase se considera terminada cuando:

```txt
npm run typecheck pasa
npm run build pasa
El backend mantiene order book profundo
El DOM sigue mostrando top 20
WhaleOrdersPanel detecta liquidez más alejada
No se satura Socket.io
No se envían miles de niveles al frontend
El sistema se resincroniza si pierde secuencia
Existe fallback si falla el deep order book
```

---

## Riesgos técnicos

```txt
Pérdida de secuencia en updates
Reconexiones frecuentes
Demasiados niveles en memoria
Enviar demasiados datos al frontend
Falsos positivos en muros de liquidez
```

---

## Prompt para Codex

```txt
Quiero evolucionar Whale Orders usando un order book profundo de Binance.

Contexto:
- Ya existe DOM básico con depth20.
- Ya existe o existirá WhaleOrderEngine.
- No quiero enviar miles de niveles al frontend.
- Quiero construir un order book local profundo correctamente.
- El DOM clásico debe seguir funcionando.

Objetivo:
1. Crear BinanceDeepOrderBookConnector.
2. Usar stream btcusdt@depth@100ms.
3. Obtener snapshot REST inicial de Binance para BTCUSDT.
4. Seguir el procedimiento correcto de snapshot + diff depth.
5. Mantener order book local con Map<number, number> para bids y asks.
6. Detectar pérdida de secuencia y resincronizar.
7. Emitir solo:
   - top 20 niveles para DomTable
   - whale levels detectados para WhaleOrdersPanel
8. No enviar los niveles completos al frontend.
9. Mantener fallback al depth20 si falla.
10. No modificar PriceChart todavía.

Criterios:
- npm run typecheck pasa.
- npm run build pasa.
- DOM sigue mostrando top 20.
- WhaleOrdersPanel puede detectar liquidez más alejada.
- Socket.io no se satura.
- El código queda separado y mantenible.
```

---

# Fase 14 — Overlay Visual de Whale Orders y Large Trades en el Gráfico

## Objetivo

Mostrar visualmente en el PriceChart las zonas de liquidez grande y los trades ejecutados importantes.

Esta fase convierte los datos premium-style en una experiencia visual parecida a una terminal profesional.

---

## Elementos visuales

### Whale Orders

Representar como bandas horizontales:

```txt
Ask wall -> banda roja arriba del precio
Bid wall -> banda verde debajo del precio
Cancelled wall -> banda atenuada o punteada
```

### Large Trades

Representar como marcadores:

```txt
Large buy -> marcador verde
Large sell -> marcador rojo
Whale trade -> marcador amarillo/naranja
```

---

## Importante

No intentar copiar exactamente la interfaz de Coinglass.

El objetivo es crear una visualización propia:

```txt
Order Flow Liquidity Overlay
```

---

## Tipo recomendado para overlay

Agregar en `packages/shared/src/index.ts`:

```ts
export type ChartLiquidityBand = {
  id: string;
  side: "bid" | "ask";
  price: number;
  notionalUsd: number;
  startTime: number;
  endTime?: number;
  status: "active" | "cancelled" | "partially_removed";
};

export type ChartTradeMarker = {
  id: string;
  side: "buy" | "sell";
  price: number;
  notionalUsd: number;
  timestamp: number;
  severity: "medium" | "high" | "whale";
};
```

---

## Frontend — Tareas

* Modificar `PriceChart`.
* Recibir `whaleOrders`.
* Recibir `largeTrades`.
* Dibujar bandas horizontales o líneas de precio para niveles grandes.
* Dibujar marcadores para large trades.
* Agregar toggles:

```txt
Show Whale Orders
Show Cancelled Orders
Show Large Trades
```

* Permitir activar/desactivar overlays sin afectar el gráfico base.
* Mantener rendimiento aceptable.

---

## Backend — Tareas

* Preparar datos limpios para el overlay.
* No enviar eventos duplicados innecesarios.
* No enviar order book completo.
* Enviar solo:

  * bandas activas;
  * bandas canceladas recientes;
  * large trades recientes.

---

## UI recomendada

```txt
┌──────────────────────────────────────────────────────────────┐
│ BTCUSDT | 30m | Whale Orders ON | Cancelled ON | Large ON    │
├───────────────┬───────────────────────────────┬──────────────┤
│ DOM / Whales  │ PriceChart + Liquidity Overlay│ Large Trades │
│               │                               │ Tape         │
└───────────────┴───────────────────────────────┴──────────────┘
```

---

## Criterios de aceptación

La fase se considera terminada cuando:

```txt
npm run typecheck pasa
npm run build pasa
PriceChart sigue funcionando aunque no haya overlays
Se pueden activar/desactivar Whale Orders
Se pueden activar/desactivar Cancelled Orders
Se pueden activar/desactivar Large Trades
Los large trades aparecen como marcadores
Los whale orders aparecen como zonas o líneas
El gráfico no se congela
El DOM y Tape siguen funcionando
```

---

## Riesgos técnicos

```txt
Demasiados overlays pueden congelar el gráfico
Lightweight Charts puede limitar ciertos dibujos avanzados
Puede ser necesario crear un Canvas overlay propio
Las bandas deben limpiarse cuando ya no son relevantes
```

---

## Decisión técnica recomendada

Primera versión:

```txt
Usar price lines o markers de Lightweight Charts
```

Versión avanzada:

```txt
Crear Canvas overlay encima del PriceChart
```

---

## Prompt para Codex

```txt
Quiero agregar overlays visuales de Whale Orders y Large Trades en PriceChart.

Contexto:
- El proyecto usa Lightweight Charts.
- Ya existe PriceChart.
- Ya existe o existirá LargeTradesPanel.
- Ya existe o existirá WhaleOrdersPanel.
- No quiero copiar Coinglass, quiero una visualización propia.
- El gráfico base debe seguir funcionando aunque no haya overlays.

Objetivo:
1. Crear tipos ChartLiquidityBand y ChartTradeMarker en packages/shared/src/index.ts.
2. Preparar datos de overlay desde largeTrades y whaleOrders.
3. Agregar toggles en UI:
   - Show Whale Orders
   - Show Cancelled Orders
   - Show Large Trades
4. Modificar PriceChart para mostrar:
   - líneas o bandas para whale orders
   - markers para large trades
5. No recrear el chart en cada render.
6. Limpiar overlays antiguos correctamente.
7. Mantener rendimiento aceptable.
8. No tocar conectores Binance en esta fase.
9. No cambiar base de datos.

Criterios:
- npm run typecheck pasa.
- npm run build pasa.
- PriceChart funciona con overlays activos y desactivados.
- DOM y Tape siguen funcionando.
- El usuario puede activar o desactivar cada overlay.
```

---

# Resumen de la continuación

```txt
Fase 11 -> Large Trades Pro
Fase 12 -> Whale Orders básico con DOM actual
Fase 13 -> Order Book profundo para Whale Orders real
Fase 14 -> Overlay visual en PriceChart
```

---

# Orden obligatorio de implementación

No saltarse fases.

```txt
1. Large Trades Pro
2. Whale Orders básico
3. Deep Order Book
4. Overlay visual
```

Motivo:

```txt
Large Trades usa datos que ya tienes.
Whale Orders básico usa el DOM actual.
Deep Order Book aumenta precisión.
Overlay visual solo tiene sentido cuando los datos ya son estables.
```

---

# Definición final de esta etapa terminada

Esta etapa se considera terminada cuando la plataforma tenga:

```txt
LargeTradesPanel funcionando
WhaleOrdersPanel funcionando
DOM clásico conservado
Deep Order Book activo o fallback estable
PriceChart con overlays activables
Alertas prudentes y no exageradas
Código modular
Build estable
README actualizado
```

---

# Reglas de producto

No prometer detección perfecta de manipulación.

Usar frases como:

```txt
Posible liquidez institucional
Muro de liquidez detectado
Liquidez retirada
Large trade ejecutado
Desequilibrio probable
```

Evitar frases como:

```txt
Manipulación confirmada
Ballena confirmada
Compra segura
Venta segura
Señal infalible
```

---

# Próximas funciones después de esta etapa

Cuando estas 4 fases estén completas, se puede avanzar a:

```txt
Heatmap histórico de liquidez
Footprint chart
Volume Profile
Replay de mercado
Diario de trading
IA de resumen de mercado
Multi-exchange
```
hasta aqui todo completado...


# Continuación Realineada — Order Flow con Historial del Exchange sin Base de Datos Propia

## Objetivo de esta continuación

Esta continuación corrige el rumbo del proyecto.

Por ahora no vamos a diseñar la plataforma como si tuviéramos una base de datos grande ni un servidor funcionando 24/7.

La nueva estrategia será:

```txt id="i0axxl"
Exchange-first
Stateless
Historial bajo demanda
Cálculo en memoria
DOM profundo live
Sin dependencia fuerte de base de datos
```

La app debe reflejar el máximo contexto real posible usando datos públicos del exchange.

---

# Idea principal del proyecto

La app sigue siendo:

```txt id="5gmnxo"
Herramienta de ayuda para traders de Order Flow.
```

No es:

```txt id="pwm0ce"
bot de trading
sistema de señales
IA predictiva
plataforma institucional con base de datos propia
```

La página debe ayudar a leer:

```txt id="c8s7lh"
precio real
historial de BTC
trades agresivos
CVD
Large Trades
DOM profundo
Whale Orders activas
liquidez alejada del precio
tiempo observado de la liquidez
Volume Profile
contexto de ventana
```

---

# Nueva regla técnica

Separar siempre estos conceptos:

```txt id="ddt9q8"
Timeframe = velas del gráfico.
Analysis Window = cálculos de Order Flow.
Depth Range = profundidad del DOM.
Observed Time = tiempo observado por nuestra app.
```

No mezclar DOM con temporalidades.

El DOM no tiene velas.

El DOM es liquidez actual.

Lo que sí podemos hacer es:

```txt id="y5q5mu"
ver DOM más profundo
medir cuánto tiempo una liquidez está visible desde que la app la observa
filtrar liquidez por distancia al precio
combinar DOM live con Order Flow histórico calculado desde trades
```

---

# Qué datos sí usaremos del exchange

```txt id="e5xwn4"
Klines de Binance:
- velas históricas
- volumen por vela
- estructura del precio

AggTrades / Trades de Binance:
- CVD histórico aproximado
- Large Trades históricos
- Delta por ventana
- Volume Profile
- Footprint básico futuro

Depth / Deep Order Book de Binance:
- DOM actual
- liquidez profunda actual
- Whale Orders activas ahora
- liquidez cancelada solo desde que la app está abierta
```

---

# Qué NO podemos prometer sin base de datos propia

Sin una base de datos funcionando 24/7, no podemos prometer:

```txt id="n46jcd"
historial completo de Whale Orders de horas anteriores
DOM histórico completo de ayer
heatmap real de liquidez de sesiones pasadas
replay completo del order book
edad real total de una orden antes de abrir la app
```

La app solo puede decir:

```txt id="75e0yl"
observado desde que esta sesión está activa
```

No debe decir:

```txt id="ujgmlf"
esta orden lleva abierta X horas en Binance
```

si la app no la observó durante todo ese tiempo.

---

# Fase 17 — Exchange-Sourced Price History

## Objetivo

Cambiar el gráfico principal para que cargue velas históricas reales de Binance.

El gráfico no debe depender solo de `pricePoints` generados desde que se abre la app.

---

## Problema actual

El PriceChart actual usa velas sintéticas generadas por el feed live.

Eso da poca información al trader porque, al abrir la página, no hay contexto suficiente.

El trader necesita ver:

```txt id="l0m5nt"
máximos recientes
mínimos recientes
zonas de rechazo
zonas de ruptura
volumen por vela
large trades sobre zonas reales
whale orders cerca de niveles importantes
```

---

## Decisión

Usar Binance Klines para el gráfico histórico.

Mantener separado:

```txt id="3r1j0x"
Klines -> gráfico de precio
Trades / aggTrades -> Order Flow
Depth -> DOM y liquidez
```

---

## Tipos compartidos recomendados

Agregar en `packages/shared/src/index.ts`:

```ts id="ntpa4f"
export type CandleInterval =
  | "1s"
  | "1m"
  | "3m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "2h"
  | "4h"
  | "1d";

export type MarketCandle = {
  symbol: MarketSymbol;
  exchange: Exchange;
  interval: CandleInterval;
  openTime: number;
  closeTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume: number;
  tradesCount: number;
  takerBuyVolume: number;
  takerBuyQuoteVolume: number;
  isClosed: boolean;
};
```

---

## Nota sobre timeframes

El proyecto ya tiene:

```txt id="pbk0go"
5s
15s
30s
1m
3m
5m
15m
1h
```

Pero Binance no da todos esos intervalos como klines oficiales en todos los casos.

Regla:

```txt id="f3fpzf"
1m, 3m, 5m, 15m, 1h -> usar klines oficiales.
5s, 15s, 30s -> construir desde trades en memoria o mantener como modo sintético.
```

No eliminar los timeframes cortos.

Solo diferenciar:

```txt id="1qgj9m"
official_candle
synthetic_candle
```

---

## Backend — Tareas

Crear:

```txt id="xjh0xt"
apps/backend/src/exchanges/binance/BinanceKlineHistoryService.ts
```

Responsabilidades:

```txt id="cm4336"
consultar klines de Binance
validar symbol
validar interval
validar limit
normalizar respuesta a MarketCandle[]
manejar errores sin tumbar el backend
```

Crear endpoint:

```txt id="byc2t7"
GET /api/market/candles?symbol=BTCUSDT&interval=1m&limit=500
```

Crear evento Socket.io futuro:

```txt id="o0npxi"
market:candle_update
```

Primera versión:

```txt id="huoq5e"
REST para historial
PriceChart sigue actualizando live con el feed actual
```

Segunda versión:

```txt id="1sdd3l"
WebSocket kline para actualizar la vela actual
```

---

## Frontend — Tareas

Modificar `PriceChart`:

```txt id="gy6o2k"
al montar:
- pedir historial al endpoint
- pintar velas con setData

al cambiar chartTimeframe:
- limpiar velas anteriores
- pedir nuevo historial si el timeframe es oficial
- usar modo sintético si el timeframe es 5s, 15s o 30s

mantener:
- overlays de Whale Orders
- markers de Large Trades
- línea de CVD
- botón reset chart
```

---

## Criterios de aceptación

```txt id="l9rekc"
npm run typecheck pasa
npm run build pasa
El gráfico muestra historial real de BTCUSDT
El gráfico ya no empieza vacío
Al cambiar timeframe oficial se recarga historial
Los overlays siguen funcionando
Large Trades siguen apareciendo
Whale Orders siguen apareciendo
Tape sigue funcionando
DOM sigue funcionando
CVD sigue funcionando
```

---

## Prompt para Codex

```txt id="ppxb5v"
Quiero implementar Exchange-Sourced Price History.

Contexto:
- El proyecto ya tiene PriceChart con overlays.
- Ya existe chartTimeframe en Zustand.
- El gráfico actual usa pricePoints sintéticos.
- Quiero cargar velas históricas reales de Binance sin romper Order Flow.

Objetivo:
1. Crear tipos CandleInterval y MarketCandle en packages/shared/src/index.ts.
2. Crear BinanceKlineHistoryService en apps/backend/src/exchanges/binance.
3. Crear endpoint:
   GET /api/market/candles?symbol=BTCUSDT&interval=1m&limit=500
4. Normalizar klines de Binance a MarketCandle.
5. Modificar PriceChart para cargar historial inicial.
6. Usar setData para pintar velas reales.
7. Al cambiar chartTimeframe:
   - usar klines oficiales para 1m, 3m, 5m, 15m, 1h
   - mantener modo sintético para 5s, 15s, 30s
8. Mantener overlays de Whale Orders.
9. Mantener markers de Large Trades.
10. No tocar base de datos.
11. No agregar IA.
12. Mantener npm run typecheck y npm run build funcionando.

Criterios:
- El gráfico muestra historial real.
- Los paneles actuales no se rompen.
```

---

# Fase 18 — Exchange-Sourced AggTrades History

## Objetivo

Usar trades históricos/agregados del exchange para calcular Order Flow por ventana sin base de datos propia.

---

## Qué vamos a calcular desde aggTrades

```txt id="ui7ivf"
CVD histórico aproximado
Large Trades históricos
Delta por ventana
Buy volume
Sell volume
Volume Profile básico
Footprint básico futuro
```

---

## Por qué es importante

Si el usuario selecciona:

```txt id="qaktvu"
Analysis Window: 15m
```

la app debe intentar cargar datos reales de los últimos 15 minutos desde el exchange.

Si selecciona:

```txt id="urmmsx"
Analysis Window: 1h
```

la app debe cargar y calcular contexto de la última hora.

No depender de que el backend haya estado abierto durante esa hora.

---

## Tipos compartidos recomendados

Agregar o reutilizar:

```ts id="jfa1z2"
export type HistoricalAggTrade = {
  exchange: Exchange;
  symbol: MarketSymbol;
  aggregateTradeId: string;
  price: number;
  quantity: number;
  firstTradeId: number;
  lastTradeId: number;
  timestamp: number;
  side: "buy" | "sell";
  notionalUsd: number;
};
```

---

## Backend — Tareas

Crear:

```txt id="jjz95q"
apps/backend/src/exchanges/binance/BinanceAggTradesHistoryService.ts
```

Crear endpoint:

```txt id="t07vzo"
GET /api/market/agg-trades?symbol=BTCUSDT&window=15m
```

También permitir:

```txt id="p5d219"
GET /api/market/agg-trades?symbol=BTCUSDT&startTime=&endTime=
```

Responsabilidades:

```txt id="7k0ff8"
consultar Binance aggTrades
normalizar precio y cantidad a number
calcular side aproximado
calcular notionalUsd
limitar resultados para no saturar frontend
```

---

## Frontend — Tareas

Crear hook:

```txt id="ehnuyv"
useHistoricalAggTrades
```

Debe:

```txt id="0vjkgx"
cargar aggTrades cuando cambia analysisWindow
guardar resultado en Zustand
evitar múltiples fetch repetidos
mostrar loading pequeño si está cargando
mostrar error si falla
```

---

## Criterios de aceptación

```txt id="nzjcl5"
npm run typecheck pasa
npm run build pasa
Al cambiar Analysis Window se cargan aggTrades históricos
La app puede calcular CVD de ventana
La app puede detectar Large Trades históricos
La app no depende de base de datos
No se rompe el Tape live
No se rompe DOM live
```

---

## Prompt para Codex

```txt id="xf1u1q"
Quiero implementar Exchange-Sourced AggTrades History para calcular Order Flow histórico sin base de datos propia.

Contexto:
- El proyecto usa AnalysisWindow.
- No tendremos base de datos 24/7.
- Queremos reconstruir contexto desde Binance cuando el usuario abre la app.
- Tape live y DOM live deben seguir funcionando.

Objetivo:
1. Crear tipo HistoricalAggTrade en packages/shared/src/index.ts.
2. Crear BinanceAggTradesHistoryService en backend.
3. Crear endpoint:
   GET /api/market/agg-trades?symbol=BTCUSDT&window=15m
4. Permitir también startTime y endTime.
5. Normalizar aggTrades a HistoricalAggTrade.
6. Calcular notionalUsd.
7. Crear hook frontend useHistoricalAggTrades.
8. Cargar datos al cambiar analysisWindow.
9. No guardar en base de datos.
10. No romper socket live.

Criterios:
- npm run typecheck pasa.
- npm run build pasa.
- Los datos históricos se cargan bajo demanda.
```

---

# Fase 19 — Historical CVD y Large Trades por Ventana

## Objetivo

Usar los aggTrades históricos para mostrar CVD y Large Trades de la ventana seleccionada.

---

## Qué debe pasar

Cuando el usuario cambie:

```txt id="aep6zj"
Window: 5m
Window: 15m
Window: 1h
Window: 4h
```

La app debe recalcular:

```txt id="s7i8p0"
CVD de esa ventana
delta de esa ventana
large trades de esa ventana
buy volume
sell volume
```

---

## Frontend — Tareas

Crear utilidades:

```txt id="otsq45"
calculateHistoricalCvd
calculateHistoricalDelta
detectHistoricalLargeTrades
```

Reglas:

```txt id="tzj8sl"
CVD = suma buy quantity - sell quantity
Delta = buyVolume - sellVolume
Large Trade = notionalUsd supera umbral configurado
```

Combinar:

```txt id="ywur79"
histórico cargado desde exchange
+
eventos live recibidos desde que la app está abierta
```

Evitar duplicados por ID.

---

## UI

Actualizar:

```txt id="g8q88f"
CVD Chart
LargeTradesPanel
MarketOverview
futuro OrderFlowSummary
```

Mostrar etiqueta:

```txt id="szikbx"
Window data: exchange history + live session
```

---

## Criterios de aceptación

```txt id="7oi8np"
npm run typecheck pasa
npm run build pasa
CVD cambia según Analysis Window
LargeTradesPanel puede mostrar históricos de ventana
Se diferencia live de histórico si hace falta
No se duplican trades
No se rompe socket live
```

---

## Prompt para Codex

```txt id="4wzyyo"
Quiero calcular CVD y Large Trades por ventana usando aggTrades históricos del exchange.

Contexto:
- Ya existirá useHistoricalAggTrades.
- Ya existen largeTrades live por Socket.io.
- Ya existe AnalysisWindow.
- No quiero base de datos.

Objetivo:
1. Crear utilidades:
   - calculateHistoricalCvd
   - calculateHistoricalDelta
   - detectHistoricalLargeTrades
2. Usar HistoricalAggTrade[].
3. Calcular:
   - buyVolume
   - sellVolume
   - delta
   - cvd
   - largeTrades
4. Combinar datos históricos con live session sin duplicados.
5. Actualizar CVD Chart y LargeTradesPanel si corresponde.
6. Mostrar etiqueta indicando que la ventana usa exchange history + live session.
7. Mantener npm run typecheck y npm run build funcionando.

Criterios:
- AnalysisWindow afecta los cálculos.
- La app refleja contexto real del exchange.
- No se rompe el flujo live.
```

---

# Fase 20 — Deep Liquidity Context

## Objetivo

Mostrar liquidez más alejada del precio usando el Deep Order Book real del exchange.

El trader debe poder ver no solo el DOM cercano, sino también zonas de liquidez más profundas.

---

## Nueva idea de producto

Agregar un tercer selector:

```txt id="gr84cx"
Depth Range
```

Este selector no es temporalidad.

Este selector define cuánto se aleja el DOM desde el precio actual.

---

## Opciones iniciales

```txt id="z9rw8k"
±0.25%
±0.5%
±1%
±2%
±5%
```

---

## Tipos compartidos recomendados

```ts id="zt3hzf"
export type LiquidityDepthRange =
  | "0.25%"
  | "0.5%"
  | "1%"
  | "2%"
  | "5%";

export type DeepLiquidityLevel = WhaleLiquidityLevel & {
  distanceFromPrice: number;
  distancePercent: number;
  ageSeconds: number;
  zone: "near" | "mid" | "far";
};
```

---

## Backend — Tareas

Actualizar `WhaleOrderEngine` o crear helper para calcular:

```txt id="yv31mk"
distanceFromPrice
distancePercent
ageSeconds
zone
```

Reglas de zona:

```txt id="y4qkx3"
near = dentro de ±0.5%
mid = entre ±0.5% y ±2%
far = más de ±2%
```

No enviar todos los niveles profundos al frontend.

Enviar solo:

```txt id="30vhct"
niveles relevantes
whale orders
niveles filtrados por threshold
niveles ordenados por notionalUsd o distancia
```

---

## Frontend — Tareas

Agregar al store:

```txt id="ft0nry"
depthRange
setDepthRange
```

Crear componente:

```txt id="s6vl1z"
DepthRangeSelector.tsx
```

Insertarlo en `MarketHeader` junto a:

```txt id="9u3t1j"
TimeframeSelector
AnalysisWindowSelector
```

Actualizar `WhaleOrdersPanel` para mostrar:

```txt id="1jddj3"
price
side
quantity
notionalUsd
distancePercent
ageSeconds
status
zone
```

Agregar filtros:

```txt id="ik7xzi"
near
mid
far
active
cancelled
```

---

## Etiquetas correctas

Usar:

```txt id="7kwkja"
Observed for
First seen
Last seen
Distance from price
```

No usar:

```txt id="o18yyv"
Real exchange age
Opened since
```

porque Binance no nos da la edad real total de la orden antes de observarla.

---

## Criterios de aceptación

```txt id="b8djno"
npm run typecheck pasa
npm run build pasa
Existe DepthRangeSelector
WhaleOrdersPanel muestra distancia al precio
WhaleOrdersPanel muestra tiempo observado
Se pueden ver niveles más alejados
No se envían miles de niveles al frontend
DOM cercano sigue funcionando
PriceChart overlays siguen funcionando
```

---

## Prompt para Codex

```txt id="tb8n0m"
Quiero implementar Deep Liquidity Context.

Contexto:
- Ya existe BinanceDeepOrderBookConnector.
- Ya existe WhaleOrderEngine.
- Ya existe WhaleOrdersPanel.
- Ya existen overlays de Whale Orders en PriceChart.
- Quiero ver liquidez más alejada del precio y tiempo observado.
- No quiero base de datos.

Objetivo:
1. Crear tipo LiquidityDepthRange en packages/shared/src/index.ts.
2. Crear tipo DeepLiquidityLevel extendiendo WhaleLiquidityLevel.
3. Agregar depthRange al Zustand store.
4. Crear DepthRangeSelector con:
   - 0.25%
   - 0.5%
   - 1%
   - 2%
   - 5%
5. Insertar DepthRangeSelector en MarketHeader.
6. Calcular distanceFromPrice, distancePercent, ageSeconds y zone.
7. Actualizar WhaleOrdersPanel para mostrar:
   - distancia al precio
   - tiempo observado
   - zona near/mid/far
8. Filtrar niveles por depthRange.
9. No afirmar edad real total de la orden.
10. No enviar miles de niveles al frontend.
11. Mantener npm run typecheck y npm run build funcionando.

Criterios:
- El usuario puede ampliar el rango de liquidez.
- Se ve liquidez más alejada del precio.
- Se ve cuánto tiempo lleva observada.
- No se rompe DOM ni PriceChart.
```

---

# Fase 21 — Order Flow Window Summary

## Objetivo

Crear un resumen de Order Flow por ventana usando:

```txt id="un08pc"
historial del exchange
+
datos live desde que se abrió la app
+
DOM profundo actual
```

---

## Qué debe responder

```txt id="bf8o1m"
¿Qué está dominando en la ventana?
¿Compras agresivas o ventas agresivas?
¿Hay large trades relevantes?
¿El CVD acompaña?
¿Dónde está la liquidez importante?
¿Está cerca o lejos del precio?
¿Hay riesgo por liquidez retirada observada?
```

---

## Tipo recomendado

```ts id="i7ab60"
export type MarketBias = "bullish" | "bearish" | "neutral" | "mixed";

export type OrderFlowWindowSummary = {
  symbol: MarketSymbol;
  exchange: Exchange;
  analysisWindow: AnalysisWindow;
  buyVolume: number;
  sellVolume: number;
  delta: number;
  cvd: number;
  largeTradesCount: number;
  largeTradesUsd: number;
  activeBidLiquidityUsd: number;
  activeAskLiquidityUsd: number;
  nearestBidWhalePrice?: number;
  nearestAskWhalePrice?: number;
  dominantSide: "buy" | "sell" | "neutral";
  marketBias: MarketBias;
  message: string;
  timestamp: number;
};
```

---

## Frontend — Tareas

Crear:

```txt id="z4uo72"
OrderFlowWindowSummaryPanel.tsx
```

Mostrar cards:

```txt id="td2m6a"
Window
Delta
CVD
Large Trades
Bid Liquidity
Ask Liquidity
Nearest Bid Wall
Nearest Ask Wall
Bias
```

Mostrar frase prudente:

```txt id="nx3nqb"
Presión compradora en la ventana, pero existe liquidez ask relevante por encima.
```

o:

```txt id="785pkp"
Contexto mixto: CVD positivo, pero large trades vendedores aparecen cerca del precio.
```

---

## Criterios de aceptación

```txt id="rpn1gi"
npm run typecheck pasa
npm run build pasa
El resumen cambia con AnalysisWindow
Usa aggTrades históricos
Usa live trades de la sesión
Usa Whale Orders actuales
No da señales de compra/venta
No usa IA
No usa base de datos
```

---

## Prompt para Codex

```txt id="covly0"
Quiero crear OrderFlowWindowSummaryPanel usando datos del exchange y datos live, sin base de datos.

Contexto:
- Ya existirá HistoricalAggTrade.
- Ya existe AnalysisWindow.
- Ya existen largeTrades live y whaleOrders live.
- Ya existirá Deep Liquidity Context.
- No quiero IA.
- No quiero señales de compra/venta.

Objetivo:
1. Crear tipos MarketBias y OrderFlowWindowSummary.
2. Crear OrderFlowWindowSummaryPanel.tsx.
3. Calcular:
   - buyVolume
   - sellVolume
   - delta
   - cvd
   - largeTradesCount
   - largeTradesUsd
   - activeBidLiquidityUsd
   - activeAskLiquidityUsd
   - nearestBidWhalePrice
   - nearestAskWhalePrice
   - dominantSide
   - marketBias
   - message
4. Usar AnalysisWindow.
5. Combinar histórico del exchange con datos live sin duplicados.
6. Usar Whale Orders actuales para liquidez.
7. No decir compra o vende.
8. Mantener npm run typecheck y npm run build funcionando.

Criterios:
- El panel resume el contexto de la ventana.
- El usuario entiende el mercado más rápido.
- No se rompe la UI actual.
```

---

# Fase 22 — Volume Profile desde Exchange History

## Objetivo

Crear Volume Profile usando trades/aggTrades históricos del exchange.

No depender de base de datos.

---

## Qué responde

```txt id="tjuejy"
¿Dónde se ejecutó más volumen en la ventana?
¿Dónde está el POC?
¿Dónde hubo más delta comprador?
¿Dónde hubo más delta vendedor?
```

---

## Tipo recomendado

```ts id="yxx55d"
export type VolumeProfileLevel = {
  price: number;
  buyVolume: number;
  sellVolume: number;
  totalVolume: number;
  delta: number;
  isPoc: boolean;
};
```

---

## Frontend — Tareas

Crear:

```txt id="salorv"
VolumeProfilePanel.tsx
```

Usar:

```txt id="w1fqs2"
HistoricalAggTrade[]
AnalysisWindow
tickSize
```

Tick sizes:

```txt id="jseph4"
10
25
50
100
```

Mostrar:

```txt id="f6pt4o"
price
total volume
buy volume
sell volume
delta
POC
```

---

## Criterios de aceptación

```txt id="zvgswi"
npm run typecheck pasa
npm run build pasa
Volume Profile usa datos del exchange
Se recalcula con AnalysisWindow
Se puede cambiar tickSize
Se marca POC
No se usa base de datos
```

---

## Prompt para Codex

```txt id="kqgkz6"
Quiero crear Volume Profile usando aggTrades históricos del exchange.

Contexto:
- Ya existirá HistoricalAggTrade.
- Ya existe AnalysisWindow.
- No quiero base de datos.
- No quiero hacer Footprint todavía.

Objetivo:
1. Crear tipo VolumeProfileLevel.
2. Crear VolumeProfilePanel.tsx.
3. Agrupar trades por price bucket.
4. Calcular:
   - buyVolume
   - sellVolume
   - totalVolume
   - delta
   - isPoc
5. Crear selector de tickSize:
   - 10
   - 25
   - 50
   - 100
6. Usar datos históricos del exchange y live session.
7. No romper PriceChart ni Tape.
8. Mantener npm run typecheck y npm run build funcionando.

Criterios:
- El Volume Profile se ve en la página.
- Cambia con la ventana.
- No depende de DB.
```

---

# Fase 23 — Session Memory Local

## Objetivo

Guardar información temporal en el navegador sin base de datos.

Esto permite que si el usuario recarga la página durante la misma sesión, no pierda todo.

---

## Tecnología recomendada

```txt id="smv97u"
IndexedDB
```

No usar localStorage para datos grandes.

---

## Qué guardar localmente

```txt id="azpgwm"
últimos summaries calculados
últimos large trades detectados
últimas whale orders observadas
preferencias de usuario
depthRange seleccionado
analysisWindow seleccionado
chartTimeframe seleccionado
```

---

## Qué NO guardar

```txt id="kgnbml"
todos los ticks crudos
todos los diff del order book
miles de niveles cada 100ms
datos sensibles
```

---

## Criterios de aceptación

```txt id="ytq15f"
npm run typecheck pasa
npm run build pasa
IndexedDB guarda preferencias simples
La app funciona aunque IndexedDB falle
No se guardan datos masivos
No se requiere login
No se requiere backend
```

---

## Prompt para Codex

```txt id="rvm110"
Quiero agregar Session Memory Local con IndexedDB.

Contexto:
- No queremos base de datos por ahora.
- Queremos guardar preferencias y datos ligeros de sesión.
- La app debe funcionar aunque IndexedDB falle.

Objetivo:
1. Crear helper apps/frontend/src/lib/sessionStorageDb.ts usando IndexedDB.
2. Guardar:
   - chartTimeframe
   - analysisWindow
   - depthRange
   - últimos summaries ligeros
3. No guardar ticks crudos.
4. No guardar todo el DOM.
5. Restaurar preferencias al abrir la app.
6. Mantener npm run typecheck y npm run build funcionando.

Criterios:
- Las preferencias se recuerdan.
- No se rompe la app si el navegador bloquea almacenamiento.
```

---

# Orden correcto de implementación

```txt id="ppclvt"
17. Exchange-Sourced Price History
18. Exchange-Sourced AggTrades History
19. Historical CVD y Large Trades por ventana
20. Deep Liquidity Context
21. Order Flow Window Summary
22. Volume Profile desde Exchange History
23. Session Memory Local
```

---

# Qué queda para cuando tengamos base de datos decente

Cuando haya una base de datos estable y/o servidor funcionando más tiempo, se podrá agregar:

```txt id="u3qr3y"
persistencia real de Whale Orders
historial propio de liquidez retirada
heatmap histórico real
replay de sesiones
diario de trading
backtesting
IA de resumen
multi-exchange
```

---

# Regla final de esta etapa

La app no debe intentar guardar todo.

Debe reconstruir el contexto desde el exchange.

Debe calcular lo necesario en memoria.

Debe mostrar al trader contexto suficiente para leer el mercado.

Orden mental:

```txt id="j6cjbp"
Exchange history
+
Live order flow
+
Deep liquidity context
+
Window summary
=
herramienta útil sin base de datos propia
```
