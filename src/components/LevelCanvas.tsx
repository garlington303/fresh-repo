import {
  useRef,
  useEffect,
  useCallback,
  useState,
} from 'react';
import type { MouseEvent, WheelEvent } from 'react';
import type { Camera, Cell, GridMap, MapSettings, Tool } from '../types';

interface Props {
  grid: GridMap;
  settings: MapSettings;
  tool: Tool;
  onGridChange: (grid: GridMap) => void;
}

const CELL_COLORS: Record<string, string> = {
  wall: '#5c8ebd',
  floor: '#7aad6e',
  player_start: '#e8c55e',
};

const CELL_HOVER_COLORS: Record<string, string> = {
  wall: '#7ab0d8',
  floor: '#9bcf8e',
  player_start: '#f0d87c',
};

const TOOL_PREVIEW: Record<Tool, string | null> = {
  wall: '#5c8ebd',
  floor: '#7aad6e',
  player_start: '#e8c55e',
  eraser: null,
};

export default function LevelCanvas({ grid, settings, tool, onGridChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
  const isPainting = useRef(false);
  const isPanning = useRef(false);
  const lastPan = useRef({ x: 0, y: 0 });

  const { gridSize } = settings;

  const screenToGrid = useCallback(
    (sx: number, sy: number, cam: Camera): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const wx = (sx - rect.left - cam.x) / cam.zoom;
      const wy = (sy - rect.top - cam.y) / cam.zoom;
      return { x: Math.floor(wx / gridSize), y: Math.floor(wy / gridSize) };
    },
    [gridSize]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    // Determine visible grid range
    const rect = canvas.getBoundingClientRect();
    const startCol = Math.floor(-camera.x / camera.zoom / gridSize) - 1;
    const startRow = Math.floor(-camera.y / camera.zoom / gridSize) - 1;
    const endCol = Math.ceil((rect.width - camera.x) / camera.zoom / gridSize) + 1;
    const endRow = Math.ceil((rect.height - camera.y) / camera.zoom / gridSize) + 1;

    // Draw grid lines
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1 / camera.zoom;
    for (let col = startCol; col <= endCol; col++) {
      ctx.beginPath();
      ctx.moveTo(col * gridSize, startRow * gridSize);
      ctx.lineTo(col * gridSize, endRow * gridSize);
      ctx.stroke();
    }
    for (let row = startRow; row <= endRow; row++) {
      ctx.beginPath();
      ctx.moveTo(startCol * gridSize, row * gridSize);
      ctx.lineTo(endCol * gridSize, row * gridSize);
      ctx.stroke();
    }

    // Draw major grid lines every 8 cells
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1.5 / camera.zoom;
    for (let col = Math.floor(startCol / 8) * 8; col <= endCol; col += 8) {
      ctx.beginPath();
      ctx.moveTo(col * gridSize, startRow * gridSize);
      ctx.lineTo(col * gridSize, endRow * gridSize);
      ctx.stroke();
    }
    for (let row = Math.floor(startRow / 8) * 8; row <= endRow; row += 8) {
      ctx.beginPath();
      ctx.moveTo(startCol * gridSize, row * gridSize);
      ctx.lineTo(endCol * gridSize, row * gridSize);
      ctx.stroke();
    }

    // Draw origin axes
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 2 / camera.zoom;
    ctx.beginPath();
    ctx.moveTo(startCol * gridSize, 0);
    ctx.lineTo(endCol * gridSize, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, startRow * gridSize);
    ctx.lineTo(0, endRow * gridSize);
    ctx.stroke();

    // Draw cells
    grid.forEach((cell, key) => {
      const [cx, cy] = key.split(',').map(Number);
      const isHovered = hoveredCell?.x === cx && hoveredCell?.y === cy;
      const color = isHovered ? CELL_HOVER_COLORS[cell.type] : CELL_COLORS[cell.type];
      ctx.fillStyle = color;
      ctx.fillRect(cx * gridSize + 1, cy * gridSize + 1, gridSize - 2, gridSize - 2);

      // Draw player start icon
      if (cell.type === 'player_start') {
        ctx.fillStyle = '#1a1a1a';
        ctx.font = `${gridSize * 0.5}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('P', cx * gridSize + gridSize / 2, cy * gridSize + gridSize / 2);
      }
    });

    // Draw hover preview
    if (hoveredCell) {
      const previewColor = TOOL_PREVIEW[tool];
      if (previewColor && !grid.has(`${hoveredCell.x},${hoveredCell.y}`)) {
        ctx.fillStyle = previewColor + '55';
        ctx.fillRect(
          hoveredCell.x * gridSize + 1,
          hoveredCell.y * gridSize + 1,
          gridSize - 2,
          gridSize - 2
        );
      } else if (tool === 'eraser') {
        ctx.strokeStyle = '#ff5555';
        ctx.lineWidth = 2 / camera.zoom;
        ctx.strokeRect(
          hoveredCell.x * gridSize + 1,
          hoveredCell.y * gridSize + 1,
          gridSize - 2,
          gridSize - 2
        );
      }
    }

    ctx.restore();
  }, [camera, grid, hoveredCell, tool, gridSize]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ro = new ResizeObserver(() => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      draw();
    });
    ro.observe(container);
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    return () => ro.disconnect();
  }, [draw]);

  const paintCell = useCallback(
    (sx: number, sy: number) => {
      const { x, y } = screenToGrid(sx, sy, camera);
      const key = `${x},${y}`;
      const newGrid = new Map(grid);

      if (tool === 'eraser') {
        newGrid.delete(key);
      } else {
        const cellType = tool as Cell['type'];
        newGrid.set(key, { type: cellType });
      }
      onGridChange(newGrid);
    },
    [camera, grid, tool, screenToGrid, onGridChange]
  );

  const handleMouseDown = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      if (e.button === 1 || e.button === 2) {
        // Middle or right click = pan
        isPanning.current = true;
        lastPan.current = { x: e.clientX, y: e.clientY };
        return;
      }
      if (e.button === 0) {
        isPainting.current = true;
        paintCell(e.clientX, e.clientY);
      }
    },
    [paintCell]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      if (isPanning.current) {
        const dx = e.clientX - lastPan.current.x;
        const dy = e.clientY - lastPan.current.y;
        lastPan.current = { x: e.clientX, y: e.clientY };
        setCamera(c => ({ ...c, x: c.x + dx, y: c.y + dy }));
        return;
      }

      const cell = screenToGrid(e.clientX, e.clientY, camera);
      setHoveredCell(cell);

      if (isPainting.current) {
        paintCell(e.clientX, e.clientY);
      }
    },
    [camera, isPainting, paintCell, screenToGrid]
  );

  const handleMouseUp = useCallback(() => {
    isPainting.current = false;
    isPanning.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isPainting.current = false;
    isPanning.current = false;
    setHoveredCell(null);
  }, []);

  const handleWheel = useCallback((e: WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    setCamera(c => {
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.min(Math.max(c.zoom * factor, 0.1), 8);
      // Zoom toward mouse pointer
      const newX = mx - (mx - c.x) * (newZoom / c.zoom);
      const newY = my - (my - c.y) * (newZoom / c.zoom);
      return { x: newX, y: newY, zoom: newZoom };
    });
  }, []);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        style={{ display: 'block', cursor: tool === 'eraser' ? 'crosshair' : 'default' }}
      />
    </div>
  );
}
