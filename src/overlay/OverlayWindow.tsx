import React, { useMemo } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { formatCounterValue } from '../utils/timer';

export const OverlayWindow: React.FC = () => {
  const { settings } = useSettingsStore();

  const { diameter, opacity, color, duration, timing, level, counterValue } = useMemo(() => {
    const d = settings.diameterPx || 60;
    const modeId = settings.mode || 'money';
    const currentCounter = settings.displayCounters[modeId] || { value: 0, totalMinutes: 0 };
    
    return {
      diameter: d,
      opacity: settings.opacity || 0.55,
      color: settings.colorHex || '#ff0000',
      duration: settings.durationSeconds || 60,
      timing: settings.stepped ? 'steps(60, end)' : 'linear',
      level: settings.level || 1,
      counterValue: formatCounterValue(modeId, currentCounter.value)
    };
  }, [settings]);

  // Use memoized styles to prevent style recalculation on every minor change
  const keyframes = useMemo(() => `
    @keyframes rise {
      from { top: calc(100% - ${diameter}px); }
      to   { top: calc(0px - ${diameter}px); }
    }
  `, [diameter]);

  return (
    <div className="relative w-full h-screen overflow-hidden pointer-events-none select-none">
      <style>{keyframes}</style>
      
      <div 
        className="crawling-timer absolute right-[10px] flex items-center justify-center pointer-events-none"
        style={{
          width: `${diameter}px`,
          height: `${diameter}px`,
          animation: `rise ${duration}s ${timing} infinite`
        }}
      >
        {/* Level 1: Circle */}
        {level === 1 && (
          <div 
            className="w-full h-full rounded-full shadow-lg transition-colors border border-white/5"
            style={{ 
              backgroundColor: color,
              opacity: opacity,
              boxShadow: `0 0 15px ${color}80`
            }}
          />
        )}

        {/* Level 2: Counter Only */}
        {level === 2 && (
          <div 
            className="text-center font-black transition-colors"
            style={{ 
              color: color,
              fontSize: `${diameter * 1.1}px`,
              textShadow: '0 0 10px rgba(0,0,0,0.9), 0 0 5px rgba(255,255,255,0.3)',
              opacity: 0.95
            }}
          >
            {counterValue}
          </div>
        )}

        {/* Level 3: Expert */}
        {level === 3 && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/20 backdrop-blur-sm border border-white/5">
             <div style={{ fontSize: `${diameter * 0.55}px` }}>💰</div>
             <div 
              className="font-black"
              style={{ 
                color: color,
                fontSize: `${diameter * 0.65}px`,
                textShadow: '0 0 8px rgba(0,0,0,0.8)'
              }}
            >
              {counterValue}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
