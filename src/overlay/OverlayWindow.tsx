import React, { useEffect } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { formatCounterValue } from '../utils/timer';

export const OverlayWindow = () => {
  const { settings } = useSettingsStore();

  const diameter = settings.diameterPx || 60;
  const opacity = settings.opacity || 0.55;
  const color = settings.colorHex || '#ff0000';
  const duration = settings.durationSeconds || 60;
  const timing = settings.stepped ? 'steps(60, end)' : 'linear';
  const level = settings.level || 1;

  const modeId = settings.mode || 'money';
  const currentCounter = settings.displayCounters[modeId] || { value: 0, totalMinutes: 0 };
  const counterValue = formatCounterValue(modeId, currentCounter.value);

  // Note: The animation is handled by pure CSS for performance and smooth crawling
  return (
    <div className="relative w-full h-screen overflow-hidden pointer-events-none">
      <style>
        {`
          @keyframes rise {
            from { top: calc(100% - ${diameter}px); }
            to   { top: calc(0px - ${diameter}px); }
          }
          .crawling-timer {
            position: absolute;
            right: 10px;
            width: ${diameter}px;
            height: ${diameter}px;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: rise ${duration}s ${timing} infinite;
            pointer-events: none;
          }
        `}
      </style>
      
      <div className="crawling-timer">
        {/* Level 1: Circle */}
        {level === 1 && (
          <div 
            className="w-full h-full rounded-full shadow-lg transition-colors"
            style={{ 
              backgroundColor: color,
              opacity: opacity,
              boxShadow: `0 0 10px ${color}b3`
            }}
          />
        )}

        {/* Level 2: Counter Only */}
        {level === 2 && (
          <div 
            className="text-center font-black transition-colors"
            style={{ 
              color: color,
              fontSize: `${diameter * 1.2}px`,
              textShadow: '0 0 8px rgba(0,0,0,0.9), 0 0 4px rgba(255,255,255,0.5)',
              opacity: 0.9
            }}
          >
            {counterValue}
          </div>
        )}

        {/* Level 3: Expert (Placeholder for symbol + counter) */}
        {level === 3 && (
          <div className="flex items-center gap-1">
             <div style={{ fontSize: `${diameter * 0.6}px` }}>
               {/* Mode icon/emoji should be here */}
               💰
             </div>
             <div 
              className="font-black"
              style={{ 
                color: color,
                fontSize: `${diameter * 0.7}px`,
                textShadow: '0 0 8px rgba(0,0,0,0.9), 0 0 4px rgba(255,255,255,0.5)'
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
