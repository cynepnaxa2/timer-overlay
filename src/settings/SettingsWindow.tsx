import React from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { normalizeHotkey } from '../utils/hotkeys';
import { 
  Monitor, 
  Palette, 
  Keyboard, 
  RefreshCw, 
  FolderSync, 
  PlayCircle,
  Eye,
  Settings as SettingsIcon,
  Trash2
} from 'lucide-react';

const SECTION_STYLE = "space-y-6 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-xl mb-8";
const LABEL_STYLE = "text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-2";
const INPUT_STYLE = "bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white w-full";
const SELECT_STYLE = "bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white w-full cursor-pointer";
const TOGGLE_STYLE = "relative inline-flex items-center cursor-pointer";

const HOTKEY_LABELS: Record<string, string> = {
  addSubtask: 'Создать подзадачу (для выбранной)',
  addRootTask: 'Создать основную задачу (в конце списка)',
  addSiblingTask: 'Создать задачу того же уровня',
  execute: 'Запустить таймер для задачи',
  complete: 'Отметить как выполненную',
  deleteTask: 'Удалить задачу (двойное нажатие)',
  navNext: 'Перейти к следующей задаче',
  navPrev: 'Перейти к предыдущей задаче',
  navChild: 'Войти в подзадачи',
  navParent: 'Вернуться к родителю'
};

export const SettingsWindow = () => {
  const { settings, updateSettings, setSettings } = useSettingsStore();
  const [recordingKey, setRecordingKey] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (window.settingsApi) {
      window.settingsApi.onSettingsUpdated((newSettings: any) => {
        setSettings(newSettings);
      });
    }
  }, [setSettings]);

  const handleKeyDown = (e: React.KeyboardEvent, target: string, isTodoHotkey: boolean) => {
    if (recordingKey !== target) return;
    
    e.preventDefault();
    e.stopPropagation();

    // Skip if only modifiers are pressed
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

    const hotkey = normalizeHotkey(e);

    if (isTodoHotkey) {
      // 1. Check for duplicates and clear them
      const newHotkeys = { ...settings.todoHotkeys };
      Object.keys(newHotkeys).forEach(k => {
        if (newHotkeys[k] === hotkey) {
          newHotkeys[k] = ''; // Clear duplicate
        }
      });
      // Also check resetHotkey
      let resetHotkey = settings.resetHotkey;
      if (resetHotkey === hotkey) resetHotkey = '';

      newHotkeys[target] = hotkey;
      updateSettings({ 
        todoHotkeys: newHotkeys,
        resetHotkey
      });
    } else {
      // Clear duplicates in todoHotkeys
      const newHotkeys = { ...settings.todoHotkeys };
      Object.keys(newHotkeys).forEach(k => {
        if (newHotkeys[k] === hotkey) {
          newHotkeys[k] = '';
        }
      });
      updateSettings({ 
        resetHotkey: hotkey,
        todoHotkeys: newHotkeys
      });
    }
    setRecordingKey(null);
  };

  const handleResetStats = async () => {
    if (window.confirm('Вы уверены, что хотите сбросить всю статистику?')) {
      // Logic for resetting statistics via IPC
      if (window.settingsApi) {
        await (window.settingsApi as any).resetStatistics();
      }
    }
  };

  const handleSelectSyncFolder = async () => {
    if (window.settingsApi) {
      const path = await (window.settingsApi as any).selectSyncFolder();
      if (path) {
        updateSettings({ syncFolderPath: path });
      }
    }
  };

  return (
    <div className="p-8 bg-slate-900 text-white min-h-screen font-sans pb-20 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold text-blue-400">Settings</h1>
        </div>
        
        {/* Appearance Section */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-400" /> Внешний вид
          </h2>
          <div className={SECTION_STYLE}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label className={LABEL_STYLE}>Размер (px)</label>
                <input 
                  type="number"
                  value={settings.diameterPx}
                  onChange={(e) => updateSettings({ diameterPx: parseInt(e.target.value) || 0 })}
                  className={INPUT_STYLE}
                  aria-label="Diameter"
                />
              </div>

              <div className="flex flex-col">
                <label className={LABEL_STYLE}>Цвет объекта</label>
                <div className="flex gap-4 items-center">
                  <input 
                    type="color"
                    value={settings.colorHex}
                    onChange={(e) => updateSettings({ colorHex: e.target.value })}
                    className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer overflow-hidden p-0"
                    aria-label="Color"
                  />
                  <span className="font-mono text-slate-300 uppercase">{settings.colorHex}</span>
                </div>
              </div>

              <div className="flex flex-col col-span-2">
                <label className={LABEL_STYLE}>Прозрачность ({Math.round(settings.opacity * 100)}%)</label>
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

              <div className="flex flex-col">
                <label className={LABEL_STYLE}>Уровень детализации</label>
                <select 
                  value={settings.level}
                  onChange={(e) => updateSettings({ level: parseInt(e.target.value) as 1|2|3 })}
                  className={SELECT_STYLE}
                >
                  <option value={1}>1 - Базовый (только круг)</option>
                  <option value={2}>2 - Продвинутый (счетчик)</option>
                  <option value={3}>3 - Эксперт (символ + счетчик)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input 
                  type="checkbox" 
                  id="stepped"
                  checked={settings.stepped}
                  onChange={(e) => updateSettings({ stepped: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-blue-500"
                />
                <label htmlFor="stepped" className="text-slate-300 cursor-pointer select-none">
                  Пошаговая анимация (секундная)
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Behavior Section */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-green-400" /> Поведение и Таймер
          </h2>
          <div className={SECTION_STYLE}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label className={LABEL_STYLE}>Длительность цикла (сек)</label>
                <input 
                  type="number"
                  value={settings.durationSeconds}
                  onChange={(e) => updateSettings({ durationSeconds: parseInt(e.target.value) || 0 })}
                  className={INPUT_STYLE}
                />
              </div>

              <div className="flex flex-col">
                <label className={LABEL_STYLE}>Режим мотивации</label>
                <select 
                  value={settings.mode}
                  onChange={(e) => updateSettings({ mode: e.target.value })}
                  className={SELECT_STYLE}
                >
                  <option value="money">💵 Деньги ($)</option>
                  <option value="popularity">👍 Популярность</option>
                  <option value="selfDevelopment">⬆️ Саморазвитие (XP)</option>
                  <option value="success">🚀 Успех (клиенты)</option>
                  <option value="health">❤️ Здоровье (омоложение)</option>
                  <option value="sport">💪 Спорт (сила)</option>
                  <option value="creativity">🎨 Творчество (идеи)</option>
                  <option value="learning">📚 Обучение (факты)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox" 
                  id="autostart"
                  checked={settings.autostart}
                  onChange={(e) => updateSettings({ autostart: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-blue-500"
                />
                <label htmlFor="autostart" className="text-slate-300 cursor-pointer select-none">
                  Запускать при старте системы
                </label>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox" 
                  id="showTray"
                  checked={settings.showTray}
                  onChange={(e) => updateSettings({ showTray: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-blue-500"
                />
                <label htmlFor="showTray" className="text-slate-300 cursor-pointer select-none">
                  Показывать иконку в трее
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Hotkeys Section */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-yellow-400" /> Горячие клавиши
          </h2>
          <div className={SECTION_STYLE}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label className={LABEL_STYLE}>Сброс таймера (Глобальный)</label>
                <div className="relative">
                  <input 
                    type="text"
                    readOnly
                    value={recordingKey === 'resetHotkey' ? 'Нажмите клавиши...' : settings.resetHotkey}
                    onFocus={() => setRecordingKey('resetHotkey')}
                    onBlur={() => setRecordingKey(null)}
                    onKeyDown={(e) => handleKeyDown(e, 'resetHotkey', false)}
                    className={`w-full bg-slate-800 border ${recordingKey === 'resetHotkey' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-700'} rounded px-4 py-2 text-slate-200 cursor-pointer focus:outline-none transition-all`}
                    placeholder="Нажмите для записи..."
                  />
                  {recordingKey === 'resetHotkey' && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                  * Работает даже если приложение свернуто
                </p>
              </div>
              <div className="col-span-2">
                <label className={LABEL_STYLE}>Задачи (Todo)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/50 p-4 rounded-xl">
                  {Object.keys(HOTKEY_LABELS).map((key) => {
                    const value = settings.todoHotkeys[key] || '';
                    return (
                      <div key={key} className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500">{HOTKEY_LABELS[key]}</span>
                        <div className="relative">
                          <input 
                            type="text"
                            readOnly
                            value={recordingKey === key ? 'Нажмите клавиши...' : value}
                            onFocus={() => setRecordingKey(key)}
                            onBlur={() => setRecordingKey(null)}
                            onKeyDown={(e) => handleKeyDown(e, key, true)}
                            className={`w-full bg-slate-800 border ${recordingKey === key ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-700'} rounded px-3 py-2 text-sm text-slate-200 cursor-pointer focus:outline-none transition-all`}
                            placeholder="Нажмите для записи..."
                          />
                          {recordingKey === key && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              <span className="flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sync & Maintenance Section */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-400" /> Синхронизация и Сброс
          </h2>
          <div className={SECTION_STYLE}>
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className={LABEL_STYLE}>
                  <FolderSync className="w-4 h-4" /> Папка синхронизации (todos.json)
                </label>
                <div className="flex gap-2">
                  <div className="flex-grow bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-400 text-sm truncate">
                    {settings.syncFolderPath || 'Используется стандартный путь'}
                  </div>
                  <button 
                    onClick={handleSelectSyncFolder}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors text-sm whitespace-nowrap"
                  >
                    Выбрать папку
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700 flex justify-between items-center">
                <div className="text-sm text-slate-400 max-w-md">
                  Сброс статистики обнулит все накопленные минуты и значения во всех режимах мотивации.
                </div>
                <button 
                  onClick={handleResetStats}
                  className="flex items-center gap-2 px-4 py-2 bg-red-900/30 hover:bg-red-800/50 text-red-400 border border-red-900/50 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" /> Сбросить всё
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
