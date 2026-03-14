import React from 'react';
import type { MapSettings, Tool } from '../types';

interface Props {
  tool: Tool;
  settings: MapSettings;
  cellCount: number;
  onToolChange: (t: Tool) => void;
  onSettingsChange: (s: MapSettings) => void;
  onClear: () => void;
  onSave: () => void;
  onExport: () => void;
}

const TOOLS: { id: Tool; label: string; description: string; color: string }[] = [
  { id: 'wall', label: 'Wall', description: 'Solid 3D brush', color: '#5c8ebd' },
  { id: 'floor', label: 'Floor', description: 'Thin base plate', color: '#7aad6e' },
  { id: 'player_start', label: 'Player Start', description: 'info_player_start entity', color: '#e8c55e' },
  { id: 'eraser', label: 'Eraser', description: 'Remove cells', color: '#e05555' },
];

export default function Sidebar({
  tool,
  settings,
  cellCount,
  onToolChange,
  onSettingsChange,
  onClear,
  onSave,
  onExport,
}: Props) {
  const updateSetting = <K extends keyof MapSettings>(key: K, value: number) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <aside
      style={{
        width: 220,
        minWidth: 220,
        background: '#1a1a1a',
        borderRight: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        padding: '12px 0',
        gap: 0,
        overflow: 'auto',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '0 16px 12px',
          borderBottom: '1px solid #333',
          marginBottom: 8,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: '#aaa', letterSpacing: 2, textTransform: 'uppercase' }}>
          Level Sketcher
        </div>
        <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
          → TrenchBroom .map
        </div>
      </div>

      {/* Tools */}
      <Section title="Tools">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {TOOLS.map(t => (
            <button
              key={t.id}
              onClick={() => onToolChange(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 10px',
                background: tool === t.id ? '#2a2a2a' : 'transparent',
                border: `1px solid ${tool === t.id ? t.color + '88' : 'transparent'}`,
                borderRadius: 4,
                cursor: 'pointer',
                color: tool === t.id ? '#eee' : '#888',
                fontSize: 13,
                textAlign: 'left',
                transition: 'all 0.1s',
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  background: t.color,
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontWeight: tool === t.id ? 600 : 400 }}>{t.label}</div>
                <div style={{ fontSize: 10, color: '#555', marginTop: 1 }}>{t.description}</div>
              </div>
            </button>
          ))}
        </div>
      </Section>

      {/* Keyboard shortcuts hint */}
      <Section title="Shortcuts">
        <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr', gap: '3px 8px', fontSize: 11, color: '#555' }}>
          <kbd style={kbdStyle}>W</kbd><span>Wall</span>
          <kbd style={kbdStyle}>F</kbd><span>Floor</span>
          <kbd style={kbdStyle}>P</kbd><span>Player Start</span>
          <kbd style={kbdStyle}>E</kbd><span>Eraser</span>
          <kbd style={kbdStyle}>⌥</kbd><span>Pan (hold)</span>
          <kbd style={kbdStyle}>⊕</kbd><span>Scroll = Zoom</span>
          <kbd style={kbdStyle}>⇧</kbd><span>Box fill drag</span>
        </div>
      </Section>

      {/* Settings */}
      <Section title="Settings">
        <NumberInput
          label="Wall Height"
          value={settings.wallHeight}
          unit="units"
          min={16}
          max={2048}
          step={8}
          onChange={v => updateSetting('wallHeight', v)}
        />
        <NumberInput
          label="Floor Thickness"
          value={settings.floorThickness}
          unit="units"
          min={1}
          max={128}
          step={1}
          onChange={v => updateSetting('floorThickness', v)}
        />
        <NumberInput
          label="Grid Cell Size"
          value={settings.gridSize}
          unit="units"
          min={8}
          max={256}
          step={8}
          onChange={v => updateSetting('gridSize', v)}
        />
      </Section>

      {/* Stats */}
      <Section title="Stats">
        <div style={{ fontSize: 11, color: '#666', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div>
            <span style={{ color: '#444' }}>Cells painted: </span>
            <span style={{ color: '#aaa' }}>{cellCount}</span>
          </div>
        </div>
      </Section>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Actions */}
      <Section title="Actions">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <ActionButton label="Save JSON" onClick={onSave} color="#4a4a5a" />
          <ActionButton label="Clear Board" onClick={onClear} color="#5a3a3a" />
          <ActionButton
            label="Export .MAP"
            onClick={onExport}
            color="#2a4a2a"
            highlight
          />
        </div>
      </Section>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '8px 16px 12px', borderBottom: '1px solid #2a2a2a' }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: '#555',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function NumberInput({
  label,
  value,
  unit,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={e => {
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v) && v >= min && v <= max) onChange(v);
          }}
          style={{
            flex: 1,
            background: '#2a2a2a',
            border: '1px solid #444',
            borderRadius: 4,
            color: '#ccc',
            padding: '4px 8px',
            fontSize: 12,
            fontFamily: 'monospace',
          }}
        />
        <span style={{ fontSize: 10, color: '#444', whiteSpace: 'nowrap' }}>{unit}</span>
      </div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  color,
  highlight,
}: {
  label: string;
  onClick: () => void;
  color: string;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 12px',
        background: color,
        border: `1px solid ${highlight ? '#5a9a5a' : '#444'}`,
        borderRadius: 4,
        color: highlight ? '#9edf9e' : '#ccc',
        fontSize: 12,
        fontWeight: highlight ? 700 : 400,
        cursor: 'pointer',
        textAlign: 'left',
        letterSpacing: highlight ? 0.5 : 0,
      }}
    >
      {label}
    </button>
  );
}

const kbdStyle: React.CSSProperties = {
  background: '#2a2a2a',
  border: '1px solid #444',
  borderRadius: 3,
  fontSize: 10,
  color: '#777',
  textAlign: 'center',
  padding: '0 2px',
  fontFamily: 'monospace',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
