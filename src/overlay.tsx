import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// #region agent log
const log = (msg: string, data = {}) => {
  fetch('http://127.0.0.1:7245/ingest/f23b35c1-164f-4809-ab92-7ad83d07b816', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'src/overlay.tsx',
      message: msg,
      data,
      timestamp: Date.now(),
      sessionId: 'debug-session',
      hypothesisId: 'H_OVERLAY_INIT'
    })
  }).catch(() => {});
};
log('Overlay script starting');
// #endregion

const Overlay: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);
  const [mode, setMode] = useState<any>(null);
  const [counter, setCounter] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    log('Overlay useEffect init');
    const init = async () => {
      if (window.overlayApi) {
        try {
          log('Fetching overlay settings');
          const s = await window.overlayApi.getSettings();
          const m = await window.overlayApi.getMode();
          const c = await window.overlayApi.getCurrentCounter();
          log('Overlay settings fetched', { s, m, c });
          setSettings(s);
          setMode(m);
          setCounter(c);
        } catch (err) {
          log('Overlay fetch failed', { error: String(err) });
        }
      } else {
        log('overlayApi not found');
      }
    };
    init();

    const unbindCounter = window.overlayApi?.onCounterUpdated((data: any) => {
      if (data) setCounter(data);
    });
    const unbindMode = window.overlayApi?.onModeUpdated((m: any) => {
      setMode(m);
    });
    const unbindLevel = window.overlayApi?.onLevelUpdated((l: any) => {
      setSettings((prev: any) => ({ ...prev, level: l }));
    });
    const unbindRestart = window.overlayApi?.onRestartCycle(() => {
      if (containerRef.current) {
        containerRef.current.style.animation = 'none';
        containerRef.current.offsetHeight; // trigger reflow
        containerRef.current.style.animation = '';
      }
    });

    return () => {
      // Cleanup
    };
  }, []);

  if (!settings) return null;

  const level = settings.level || 1;
  const dotSize = settings.diameterPx || 60;
  const dotColor = settings.colorHex || 'rgba(255, 0, 0, 0.55)';
  const duration = settings.durationSeconds || 60;
  const timing = settings.stepped ? 'steps(60, end)' : 'linear';

  return (
    <div className="relative w-full h-screen overflow-hidden pointer-events-none">
      <div 
        ref={containerRef}
        className={`absolute right-[10px] flex items-center justify-center animate-rise ${
          level === 3 ? 'flex-row gap-1 w-auto min-w-0 max-w-full' : 'flex-col w-[var(--dot-size)] h-[var(--dot-size)] min-w-[var(--dot-size)]'
        }`}
        style={{ 
          '--dot-size': `${dotSize}px`,
          '--duration': `${duration}s`,
          '--timing': timing,
          animationDuration: `${duration}s`,
          animationTimingFunction: timing,
          animationName: 'rise',
          animationIterationCount: 'infinite',
          opacity: settings.opacity || 1
        } as any}
      >
        {level === 1 && (
          <div 
            className="w-full h-full rounded-full" 
            style={{ backgroundColor: dotColor, boxShadow: `0 0 10px ${dotColor}` }}
          />
        )}
        
        {level === 2 && (
          <div 
            className="absolute inset-0 flex items-center justify-center font-black text-center leading-none"
            style={{ 
              fontSize: `${dotSize * 1.2}px`, 
              color: dotColor,
              textShadow: '0 0 8px rgba(0,0,0,0.9), 0 0 4px rgba(255,255,255,0.5)' 
            }}
          >
            {counter?.value || '0'}
          </div>
        )}

        {level === 3 && (
          <>
            <div className="flex items-center justify-center leading-none" style={{ fontSize: `${dotSize * 0.6}px` }}>
              {mode?.emoji || mode?.symbol || '💵'}
            </div>
            <div 
              className="flex items-center justify-center font-black whitespace-nowrap leading-none"
              style={{ 
                fontSize: `${dotSize * 0.7}px`, 
                color: dotColor,
                textShadow: '0 0 8px rgba(0,0,0,0.9), 0 0 4px rgba(255,255,255,0.5)' 
              }}
            >
              {counter?.value || '0'}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes rise {
          from { top: calc(100% - var(--dot-size)); }
          to   { top: calc(0px - var(--dot-size)); }
        }
      `}</style>
    </div>
  );
};

declare global {
  interface Window {
    overlayApi: any;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Overlay />
);
