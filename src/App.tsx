import { useCallback, useEffect, useState } from 'react';
import LevelCanvas from './components/LevelCanvas';
import Sidebar from './components/Sidebar';
import type { GridMap, MapSettings, Tool } from './types';
import { downloadMap, exportMap, loadFromLocalStorage, saveToLocalStorage } from './utils/exporter';

const DEFAULT_SETTINGS: MapSettings = {
  wallHeight: 128,
  floorThickness: 16,
  gridSize: 32,
};

function App() {
  const [grid, setGrid] = useState<GridMap>(new Map());
  const [tool, setTool] = useState<Tool>('wall');
  const [settings, setSettings] = useState<MapSettings>(DEFAULT_SETTINGS);
  const [toast, setToast] = useState<string | null>(null);

  // Load saved state on mount
  useEffect(() => {
    const saved = loadFromLocalStorage();
    if (saved) {
      setGrid(saved.grid);
      setSettings(saved.settings);
    }
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handleClear = useCallback(() => {
    if (grid.size > 0 && !window.confirm('Clear the entire board?')) return;
    setGrid(new Map());
  }, [grid]);

  const handleSave = useCallback(() => {
    saveToLocalStorage(grid, settings);
    showToast('Saved to local storage');
  }, [grid, settings, showToast]);

  const handleExport = useCallback(() => {
    const content = exportMap(grid, settings);
    downloadMap(content, 'level.map');
    showToast('Exported level.map');
  }, [grid, settings, showToast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      switch (e.key.toLowerCase()) {
        case 'w': setTool('wall'); break;
        case 'f': setTool('floor'); break;
        case 'p': setTool('player_start'); break;
        case 'e': setTool('eraser'); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: '#222',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        color: '#ccc',
      }}
    >
      <Sidebar
        tool={tool}
        settings={settings}
        cellCount={grid.size}
        onToolChange={setTool}
        onSettingsChange={setSettings}
        onClear={handleClear}
        onSave={handleSave}
        onExport={handleExport}
      />

      {/* Canvas area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <div
          style={{
            height: 38,
            background: '#1a1a1a',
            borderBottom: '1px solid #333',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: 16,
            flexShrink: 0,
          }}
        >
          <TopbarHint label="Scroll" description="Zoom" />
          <TopbarHint label="Right/Middle-click drag" description="Pan" />
          <TopbarHint label="Shift+drag" description="Box fill" />
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 11, color: '#444' }}>
            {grid.size} cell{grid.size !== 1 ? 's' : ''} painted
          </div>
          <button
            onClick={handleExport}
            style={{
              padding: '5px 14px',
              background: '#1e3a1e',
              border: '1px solid #4a8a4a',
              borderRadius: 4,
              color: '#7dca7d',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: 0.5,
            }}
          >
            Export .MAP
          </button>
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <LevelCanvas
            grid={grid}
            settings={settings}
            tool={tool}
            onGridChange={setGrid}
          />
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: '#2a3a2a',
            border: '1px solid #4a8a4a',
            borderRadius: 6,
            padding: '10px 16px',
            color: '#9edf9e',
            fontSize: 13,
            zIndex: 9999,
            boxShadow: '0 4px 16px #0008',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function TopbarHint({ label, description }: { label: string; description: string }) {
  return (
    <div style={{ fontSize: 11, color: '#555', display: 'flex', gap: 5 }}>
      <span style={{ color: '#444', fontWeight: 600 }}>{label}</span>
      <span>=</span>
      <span>{description}</span>
    </div>
  );
}

export default App;
