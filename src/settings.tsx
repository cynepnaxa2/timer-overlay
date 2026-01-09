import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);
  const [modes, setModes] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      if (window.settingsApi) {
        const s = await window.settingsApi.getSettings();
        const m = await window.settingsApi.getModes();
        setSettings(s);
        setModes(m);
      }
    };
    init();
  }, []);

  if (!settings) return null;

  const updateSetting = async (patch: any) => {
    const newSettings = { ...settings, ...patch };
    setSettings(newSettings);
    await window.settingsApi.updateSettings(patch);
  };

  return (
    <div className="max-w-[500px] mx-auto p-5 bg-white rounded-lg shadow-lg">
      <h1 className="text-lg font-bold mb-5 flex items-center gap-2">⚙️ Настройки It's time!</h1>
      
      <div className="bg-[#f9f9f9] border-l-4 border-[#0078d4] p-3 mb-6 rounded text-sm leading-relaxed text-[#333]">
        <strong>It's time</strong> — новый подход к продуктивности. Напоминание о том, что каждая минута имеет значение.
      </div>

      <div className="space-y-6">
        <section className="pb-5 border-b border-[#e0e0e0]">
          <h2 className="text-[13px] font-bold text-[#666] mb-3 uppercase tracking-wider">Система</h2>
          <label className="flex items-center gap-2 text-sm cursor-pointer py-1">
            <input 
              type="checkbox" 
              checked={settings.autostart} 
              onChange={e => updateSetting({ autostart: e.target.checked })}
            />
            Запускать вместе с Windows
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer py-1">
            <input 
              type="checkbox" 
              checked={settings.showTray !== false} 
              onChange={e => updateSetting({ showTray: e.target.checked })}
            />
            Показывать иконку в системном трее
          </label>
        </section>

        <section className="pb-5 border-b border-[#e0e0e0]">
          <h2 className="text-[13px] font-bold text-[#666] mb-3 uppercase tracking-wider">Уровень отображения</h2>
          <div className="flex flex-col gap-3 mt-2">
            {[
              { id: 1, title: '1. Базовый', desc: 'Круг. Рекомендуется всем.' },
              { id: 2, title: '2. Продвинутый', desc: 'Счетчик. Может демотивировать.' },
              { id: 3, title: '3. Эксперт', desc: 'Счетчик и мотивация.' }
            ].map(lvl => (
              <label key={lvl.id} className={`flex gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                settings.level === lvl.id ? 'border-[#0078d4] bg-[#e6f3ff]' : 'border-[#ddd] hover:border-[#0078d4] hover:bg-[#f0f8ff]'
              }`}>
                <input 
                  type="radio" 
                  name="level" 
                  checked={settings.level === lvl.id} 
                  onChange={() => updateSetting({ level: lvl.id })}
                />
                <div>
                  <div className={`font-bold text-sm ${settings.level === lvl.id ? 'text-[#0078d4]' : ''}`}>{lvl.title}</div>
                  <div className="text-[12px] text-[#666] leading-tight mt-1">{lvl.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </section>

        <section className="pb-5 border-b border-[#e0e0e0]">
          <h2 className="text-[13px] font-bold text-[#666] mb-3 uppercase tracking-wider">Внешний вид</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Размер</label>
              <div className="flex items-center gap-3">
                <input 
                  type="range" min="10" max="200" 
                  value={settings.diameterPx || 60} 
                  onChange={e => updateSetting({ diameterPx: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <input 
                  type="number" 
                  value={settings.diameterPx || 60} 
                  onChange={e => updateSetting({ diameterPx: parseInt(e.target.value) })}
                  className="w-20 p-1 border rounded text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Прозрачность</label>
              <div className="flex items-center gap-3">
                <input 
                  type="range" min="0.1" max="1" step="0.01"
                  value={settings.opacity || 0.55} 
                  onChange={e => updateSetting({ opacity: parseFloat(e.target.value) })}
                  className="flex-1"
                />
                <input 
                  type="number" step="0.01"
                  value={settings.opacity || 0.55} 
                  onChange={e => updateSetting({ opacity: parseFloat(e.target.value) })}
                  className="w-20 p-1 border rounded text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Цвет</label>
              <input 
                type="color" 
                value={settings.colorHex || '#ff0000'} 
                onChange={e => updateSetting({ colorHex: e.target.value })}
                className="w-16 h-9 cursor-pointer border rounded"
              />
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 flex justify-end">
        <button 
          onClick={() => window.close()}
          className="px-5 py-2 bg-[#e0e0e0] hover:bg-[#d0d0d0] text-sm font-medium rounded transition-colors"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
};

declare global {
  interface Window {
    settingsApi: any;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Settings />
  </React.StrictMode>
);
