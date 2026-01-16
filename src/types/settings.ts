export interface LevelSetting {
  showCircle: boolean;
  showSymbol: boolean;
  showCounter: boolean;
  showUnit: boolean;
}

export interface CounterData {
  value: number;
  totalMinutes: number;
}

export interface Settings {
  diameterPx: number;
  opacity: number;
  colorHex: string;
  durationSeconds: number;
  stepped: boolean;
  autostart: boolean;
  showTray: boolean;
  mode: string;
  counters: Record<string, CounterData>;
  displayCounters: Record<string, CounterData>;
  level: 1 | 2 | 3;
  levelSettings: Record<number, LevelSetting>;
  resetHotkey: string;
  todoHotkeys: Record<string, string>;
  syncFolderPath: string | null;
}
