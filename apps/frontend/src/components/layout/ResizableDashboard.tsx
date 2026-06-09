import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

const STORAGE_KEY = "orderflow.dashboard.layout.v1";
const DEFAULT_COLUMNS = [22, 54, 24];
const DEFAULT_ROWS = [56, 27, 17];
const MIN_COLUMN_WIDTHS = [220, 420, 280];
const MIN_ROW_HEIGHTS = [220, 130, 100];
const CENTER_HANDLE_TOTAL = 16;
const HANDLE_STEP = 3;

type ResizableDashboardProps = {
  dom: ReactNode;
  price: ReactNode;
  cvd: ReactNode;
  alerts: ReactNode;
  tape: ReactNode;
};

type DragState =
  | {
      axis: "column";
      dividerIndex: 0 | 1;
      startPosition: number;
      size: number;
      values: number[];
    }
  | {
      axis: "row";
      dividerIndex: 0 | 1;
      startPosition: number;
      size: number;
      values: number[];
    };

type PersistedLayout = {
  columns?: number[];
  rows?: number[];
};

export function ResizableDashboard({
  dom,
  price,
  cvd,
  alerts,
  tape,
}: ResizableDashboardProps) {
  const dashboardRef = useRef<HTMLDivElement | null>(null);
  const centerRef = useRef<HTMLDivElement | null>(null);
  const [columns, setColumns] = useState(() => loadValues("columns", DEFAULT_COLUMNS));
  const [rows, setRows] = useState(() => loadValues("rows", DEFAULT_ROWS));
  const [drag, setDrag] = useState<DragState | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ columns, rows }));
  }, [columns, rows]);

  useEffect(() => {
    if (!drag) {
      return;
    }

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = drag.axis === "column" ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";

    const handlePointerMove = (event: globalThis.PointerEvent) => {
      const currentPosition = drag.axis === "column" ? event.clientX : event.clientY;
      const delta = ((currentPosition - drag.startPosition) / drag.size) * 100;

      if (drag.axis === "column") {
        setColumns(resizePair(drag.values, drag.dividerIndex, delta, MIN_COLUMN_WIDTHS, drag.size));
        return;
      }

      setRows(resizePair(drag.values, drag.dividerIndex, delta, MIN_ROW_HEIGHTS, drag.size));
    };

    const handlePointerUp = () => setDrag(null);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });

    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [drag]);

  function beginColumnResize(dividerIndex: 0 | 1, event: PointerEvent<HTMLDivElement>) {
    const bounds = dashboardRef.current?.getBoundingClientRect();

    if (!bounds) {
      return;
    }

    event.preventDefault();
    setDrag({
      axis: "column",
      dividerIndex,
      startPosition: event.clientX,
      size: bounds.width,
      values: columns,
    });
  }

  function beginRowResize(dividerIndex: 0 | 1, event: PointerEvent<HTMLDivElement>) {
    const bounds = centerRef.current?.getBoundingClientRect();

    if (!bounds) {
      return;
    }

    const contentHeight = Math.max(1, bounds.height - CENTER_HANDLE_TOTAL);

    event.preventDefault();
    setDrag({
      axis: "row",
      dividerIndex,
      startPosition: event.clientY,
      size: contentHeight,
      values: rows,
    });
  }

  function adjustColumns(dividerIndex: 0 | 1, direction: number) {
    const width = dashboardRef.current?.getBoundingClientRect().width ?? 1200;
    setColumns((current) =>
      resizePair(current, dividerIndex, direction * HANDLE_STEP, MIN_COLUMN_WIDTHS, width),
    );
  }

  function adjustRows(dividerIndex: 0 | 1, direction: number) {
    const height =
      Math.max(1, (centerRef.current?.getBoundingClientRect().height ?? 720) - CENTER_HANDLE_TOTAL);
    setRows((current) =>
      resizePair(current, dividerIndex, direction * HANDLE_STEP, MIN_ROW_HEIGHTS, height),
    );
  }

  return (
    <div
      ref={dashboardRef}
      className={`mt-1.5 flex flex-1 flex-col gap-1.5 lg:grid lg:min-h-0 lg:gap-0 ${
        drag ? "dashboard-resizing" : ""
      }`}
      style={{
        gridTemplateColumns: `minmax(${MIN_COLUMN_WIDTHS[0]}px, ${columns[0]}fr) 8px minmax(${MIN_COLUMN_WIDTHS[1]}px, ${columns[1]}fr) 8px minmax(${MIN_COLUMN_WIDTHS[2]}px, ${columns[2]}fr)`,
      }}
    >
      <div className="min-h-0 overflow-hidden">{dom}</div>

      <ResizeHandle
        label="Ajustar DOM y graficos"
        orientation="vertical"
        onKeyStep={(direction) => adjustColumns(0, direction)}
        onPointerDown={(event) => beginColumnResize(0, event)}
      />

      <div
        ref={centerRef}
        className="flex min-h-0 flex-col gap-1.5 lg:grid lg:gap-0"
        style={{
          gridTemplateRows: `${toGridTrack(rows[0])} 8px ${toGridTrack(
            rows[1],
          )} 8px ${toGridTrack(rows[2])}`,
        }}
      >
        <div className="min-h-0 overflow-hidden">{price}</div>
        <ResizeHandle
          label="Ajustar precio y CVD"
          orientation="horizontal"
          onKeyStep={(direction) => adjustRows(0, direction)}
          onPointerDown={(event) => beginRowResize(0, event)}
        />
        <div className="min-h-0 overflow-hidden">{cvd}</div>
        <ResizeHandle
          label="Ajustar CVD y alertas"
          orientation="horizontal"
          onKeyStep={(direction) => adjustRows(1, direction)}
          onPointerDown={(event) => beginRowResize(1, event)}
        />
        <div className="min-h-0 overflow-hidden">{alerts}</div>
      </div>

      <ResizeHandle
        label="Ajustar graficos y tape"
        orientation="vertical"
        onKeyStep={(direction) => adjustColumns(1, direction)}
        onPointerDown={(event) => beginColumnResize(1, event)}
      />

      <div className="min-h-0 overflow-hidden">{tape}</div>
    </div>
  );
}

type ResizeHandleProps = {
  label: string;
  orientation: "horizontal" | "vertical";
  onKeyStep: (direction: number) => void;
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
};

function ResizeHandle({
  label,
  orientation,
  onKeyStep,
  onPointerDown,
}: ResizeHandleProps) {
  const isVertical = orientation === "vertical";

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (isVertical && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      event.preventDefault();
      onKeyStep(event.key === "ArrowRight" ? 1 : -1);
    }

    if (!isVertical && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
      event.preventDefault();
      onKeyStep(event.key === "ArrowDown" ? 1 : -1);
    }
  }

  return (
    <div
      aria-label={label}
      aria-orientation={orientation}
      className={`group hidden touch-none outline-none lg:grid ${
        isVertical ? "cursor-col-resize px-[3px]" : "cursor-row-resize py-[5px]"
      }`}
      role="separator"
      tabIndex={0}
      title={label}
      onKeyDown={handleKeyDown}
      onPointerDown={onPointerDown}
    >
      <span
        className={`block rounded-full bg-white/10 transition group-hover:bg-cyan-300/55 group-focus-visible:bg-cyan-300/70 ${
          isVertical ? "h-full w-px" : "h-px w-full"
        }`}
      />
    </div>
  );
}

function resizePair(
  values: number[],
  dividerIndex: 0 | 1,
  delta: number,
  minimumSizes: number[],
  availableSize: number,
) {
  const next = [...values];
  const leftIndex = dividerIndex;
  const rightIndex = dividerIndex + 1;
  const total = values[leftIndex] + values[rightIndex];
  const available = Math.max(1, availableSize);
  const leftMin = (minimumSizes[leftIndex] / available) * 100;
  const rightMin = (minimumSizes[rightIndex] / available) * 100;
  const minimumTotal = leftMin + rightMin;

  if (minimumTotal >= total) {
    const leftRatio = leftMin / minimumTotal;
    next[leftIndex] = total * leftRatio;
    next[rightIndex] = total * (1 - leftRatio);

    return next;
  }

  const nextLeft = clamp(values[leftIndex] + delta, leftMin, total - rightMin);

  next[leftIndex] = nextLeft;
  next[rightIndex] = total - nextLeft;

  return next;
}

function loadValues(key: keyof PersistedLayout, fallback: number[]) {
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    const parsed = item ? (JSON.parse(item) as PersistedLayout) : null;
    const values = parsed?.[key];

    if (Array.isArray(values) && values.length === fallback.length) {
      return values;
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }

  return fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function toGridTrack(percent: number) {
  const handleShare = (CENTER_HANDLE_TOTAL * percent) / 100;

  return `minmax(0, calc(${percent}% - ${handleShare}px))`;
}
