import React from 'react';
import { useSettingsStore } from '../store/settingsStore';

export const SettingsWindow = () => {
  const { settings, updateSettings } = useSettingsStore();

  return (
    <div className="p-8 bg-slate-900 text-white min-h-screen font-sans">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-blue-400">Settings</h1>
        
        <div className="space-y-6 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Diameter (px)
            </label>
            <input 
              type="number"
              value={settings.diameterPx}
              onChange={(e) => updateSettings({ diameterPx: parseInt(e.target.value) || 0 })}
              className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              aria-label="Diameter"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Opacity ({Math.round(settings.opacity * 100)}%)
            </label>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.opacity}
              onChange={(e) => updateSettings({ opacity: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              aria-label="Opacity"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Color
            </label>
            <div className="flex gap-4 items-center">
              <input 
                type="color"
                value={settings.colorHex}
                onChange={(e) => updateSettings({ colorHex: e.target.value })}
                className="w-12 h-12 rounded-lg bg-transparent border-none cursor-pointer overflow-hidden"
                aria-label="Color"
              />
              <span className="font-mono text-slate-300 uppercase">{settings.colorHex}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
