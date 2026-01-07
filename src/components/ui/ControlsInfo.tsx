import React, { useState } from 'react';

const MouseIcon = ({ button, action }: { button: 'left' | 'right', action?: 'drag' | 'click' }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white shrink-0">
    {/* Mouse Body */}
    <rect x="7" y="5" width="10" height="14" rx="5" stroke="currentColor" strokeWidth="1.5" />
    <line x1="12" y1="5" x2="12" y2="11" stroke="currentColor" strokeWidth="1.5" />
    
    {/* Active Button Highlight */}
    {button === 'left' && (
      <path d="M7.5 10V9C7.5 6.5 9.5 5.5 12 5.5V10.5H7.5Z" fill="currentColor" fillOpacity="0.6" />
    )}
    {button === 'right' && (
       <path d="M12 5.5C14.5 5.5 16.5 6.5 16.5 9V10.5H12V5.5Z" fill="currentColor" fillOpacity="0.6" />
    )}
    
    {/* Action Indicator (optional arrows for drag) */}
    {action === 'drag' && (
      <path d="M18 16l2-2m0 0l-2-2m2 2H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse" />
    )}
  </svg>
);

const KeyboardKey = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'highlight' }) => (
  <div className={`w-6 h-6 rounded border flex items-center justify-center text-[10px] font-bold shrink-0 ${
    variant === 'highlight' 
      ? 'bg-white/20 border-white/30 text-white' 
      : 'bg-white/10 border-white/20 text-white/70'
  }`}>
    {children}
  </div>
);

const KeyWithArrow = ({ keyLabel, direction }: { keyLabel: string, direction: 'up' | 'down' }) => (
  <div className="flex flex-col items-center gap-0.5">
    <span className="text-[8px] text-white/50">
      {direction === 'up' ? '▲' : '▼'}
    </span>
    <KeyboardKey>{keyLabel}</KeyboardKey>
  </div>
);

export const ControlsInfo: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="hidden lg:flex fixed bottom-16 left-4 z-50 size-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-black/60 transition-all pointer-events-auto"
        title="Kontrolleri Göster"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="hidden lg:block absolute bottom-6 left-20 z-50 animate-fade-in-up pointer-events-auto">
      <div className="bg-[#111618]/90 backdrop-blur-xl rounded-2xl border border-white/10 p-5 space-y-4 shadow-2xl w-72 relative group">
        
        {/* Close Button */}
        <button 
          onClick={() => setIsCollapsed(true)}
          className="absolute top-2 right-2 p-1 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          title="Gizle"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Fly Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <MouseIcon button="left" />
            <span className="text-white/50 text-xs">+</span>
            <div className="flex flex-col items-center gap-1">
              <div className="flex gap-1 items-end">
                <KeyWithArrow keyLabel="Q" direction="down" />
                <KeyboardKey variant="highlight">W</KeyboardKey>
                <KeyWithArrow keyLabel="E" direction="up" />
              </div>
              <div className="flex gap-1">
                <KeyboardKey variant="highlight">A</KeyboardKey>
                <KeyboardKey variant="highlight">S</KeyboardKey>
                <KeyboardKey variant="highlight">D</KeyboardKey>
              </div>
            </div>
          </div>
          <span className="text-sm text-gray-300 leading-tight">
            <strong className="text-white block mb-0.5">Uçuş Modu</strong>
            Model üzerinde gezinin
          </span>
        </div>

        <div className="h-px bg-white/10 w-full" />

        {/* Rotate Controls */}
        <div className="flex items-center gap-4">
          <MouseIcon button="right" />
          <span className="text-sm text-gray-300 leading-tight">
            <strong className="text-white block mb-0.5">Döndür</strong>
            Basılı tutup çevirin
          </span>
        </div>

        <div className="h-px bg-white/10 w-full" />

        {/* Teleport Controls */}
        <div className="flex items-center gap-4">
          <MouseIcon button="left" />
          <span className="text-sm text-gray-300 leading-tight">
            <strong className="text-white block mb-0.5">Işınlan</strong>
            Tıklayarak içine girin
          </span>
        </div>

      </div>
    </div>
  );
};
