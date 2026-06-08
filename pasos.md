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
