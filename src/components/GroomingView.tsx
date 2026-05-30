import React, { useState, useRef, useEffect } from 'react';
import { DinoSprite } from './DinoSprite';
import { DinoState } from '../types';
import { SoundEffects } from '../utils/SoundEffects';

interface GroomingViewProps {
  dino: DinoState;
  onGroomed: (hygieneBoost: number, happinessBoost: number, coinsEarned: number) => void;
  onClearPoops: () => void;
  onClose: () => void;
}

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
}

interface DirtSpot {
  id: number;
  x: number; // percent
  y: number; // percent
  cleaned: boolean;
}

export const GroomingView: React.FC<GroomingViewProps> = ({ dino, onGroomed, onClearPoops, onClose }) => {
  const [tool, setTool] = useState<'soap' | 'brush'>('soap');
  const [dirtSpots, setDirtSpots] = useState<DirtSpot[]>([
    { id: 1, x: 28, y: 45, cleaned: false },
    { id: 2, x: 62, y: 35, cleaned: false },
    { id: 3, x: 45, y: 65, cleaned: false },
    { id: 4, x: 35, y: 80, cleaned: false },
    { id: 5, x: 70, y: 75, cleaned: false },
  ]);

  const [sparkles, setSparkles] = useState<number>(0);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const nextBubbleId = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isScrubbing = useRef<boolean>(false);

  // Trigger bubbles on drag
  const handlePointerDown = (e: React.PointerEvent) => {
    isScrubbing.current = true;
    checkCollision(e);
  };

  const handlePointerUp = () => {
    isScrubbing.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isScrubbing.current) return;
    checkCollision(e);
    
    // Spawn bubbles or sparkles depending on tool used
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      const xPercent = (clientX / rect.width) * 100;
      const yPercent = (clientY / rect.height) * 100;

      if (tool === 'soap' && Math.random() < 0.25) {
        SoundEffects.clean();
        setBubbles((b) => [
          ...b,
          {
            id: nextBubbleId.current++,
            x: xPercent,
            y: yPercent,
            size: 8 + Math.random() * 12,
            opacity: 0.8,
          },
        ]);
      } else if (tool === 'brush' && Math.random() < 0.15) {
        SoundEffects.click();
        setSparkles((s) => s + 1);
      }
    }
  };

  const checkCollision = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const xPercent = (clientX / rect.width) * 100;
    const yPercent = (clientY / rect.height) * 100;

    if (tool === 'soap') {
      // Clean Dirt spots
      setDirtSpots((spots) =>
        spots.map((spot) => {
          if (spot.cleaned) return spot;
          // check distance
          const distance = Math.hypot(spot.x - xPercent, spot.y - yPercent);
          if (distance < 14) {
            return { ...spot, cleaned: true };
          }
          return spot;
        })
      );
    }
  };

  // Move bubbles up
  useEffect(() => {
    const timer = setInterval(() => {
      setBubbles((prev) =>
        prev
          .map((b) => ({ ...b, y: b.y - 2, opacity: b.opacity - 0.05 }))
          .filter((b) => b.opacity > 0 && b.y > 0)
      );
    }, 45);
    return () => clearInterval(timer);
  }, []);

  // Completion check
  const allClean = dirtSpots.every((s) => s.cleaned);

  const handleFinishBath = () => {
    SoundEffects.success();
    // Complete grooming reward
    onGroomed(80, 20, 10);
  };

  const handleBrushingDone = () => {
    SoundEffects.success();
    onGroomed(20, 50, 5);
    setSparkles(0);
  };

  return (
    <div className="absolute inset-0 bg-blue-50 rounded-xl overflow-hidden shadow-inner flex flex-col items-center justify-between p-4 border border-blue-900 border-opacity-20 select-none">
      <div className="w-full flex justify-between items-center text-blue-950 font-mono text-xs z-10">
        <span className="font-bold flex items-center gap-1">🧼 Grooming Station</span>
        <button
          onClick={onClose}
          id="btn-close-groom"
          className="px-2 py-0.5 rounded border border-blue-950 bg-blue-100 hover:bg-blue-200 text-[10px] active:translate-y-0.5"
        >
          Back
        </button>
      </div>

      {/* Bathing Stage */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="flex-1 w-full bg-gradient-to-b from-cyan-50 to-blue-100 relative rounded-lg border-2 border-blue-800 border-opacity-20 flex items-center justify-center overflow-hidden my-3 cursor-crosshair touch-none"
      >
        {/* Bubbles particles canvas simulation */}
        {bubbles.map((b) => (
          <div
            key={b.id}
            className="absolute bg-white bg-opacity-70 border border-blue-200 rounded-full flex items-center justify-center text-[10px] select-none pointer-events-none"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: `${b.size}px`,
              height: `${b.size}px`,
              opacity: b.opacity,
            }}
          >
            🫧
          </div>
        ))}

        {/* Shiny Sparkle indicators for Brushing */}
        {sparkles > 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-yellow-400 font-bold select-none pointer-events-none text-xl animate-pulse">
            ✨
          </div>
        )}

        {/* Dinosaur sitting in a Tub */}
        <div className="relative w-44 h-44 flex items-center justify-center select-none pointer-events-none">
          <DinoSprite
            stage={dino.stage}
            species={dino.species}
            expression={tool === 'soap' ? 'happy' : 'eat'}
            color={dino.color}
            activeAccessory={null} // wash off accessory
            eggTaps={0}
          />

          {/* Render Dirt Spots */}
          {tool === 'soap' &&
            dirtSpots.map(
              (spot) =>
                !spot.cleaned && (
                  <div
                    key={spot.id}
                    className="absolute bg-stone-500 bg-opacity-70 rounded-full border border-stone-600 flex items-center justify-center animate-pulse pointer-events-none"
                    style={{
                      left: `${spot.x}%`,
                      top: `${spot.y}%`,
                      width: '18px',
                      height: '14px',
                    }}
                  >
                    💩
                  </div>
                )
            )}
        </div>

        {/* Bath Tub Foreground Mask */}
        <div className="absolute bottom-1 w-11/12 h-10 bg-sky-200 bg-opacity-80 rounded-b-xl border-t-4 border-2 border-sky-400 flex items-center justify-center font-mono text-[10px] text-blue-900 pointer-events-none">
          🛁 Bubbles & Suds Therapy
        </div>
      </div>

      {/* Control Tools panel */}
      <div className="w-full flex flex-col items-center gap-2">
        <div className="flex gap-2 w-full">
          <button
            onClick={() => {
              SoundEffects.click();
              setTool('soap');
            }}
            id="btn-tool-soap"
            className={`flex-1 py-2 rounded-lg border-2 font-bold font-sans text-xs flex items-center justify-center gap-1.5 shadow ${
              tool === 'soap'
                ? 'bg-blue-500 text-white border-blue-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span>🧽 Soap Sponge</span>
          </button>
          <button
            onClick={() => {
              SoundEffects.click();
              setTool('brush');
            }}
            id="btn-tool-brush"
            className={`flex-1 py-2 rounded-lg border-2 font-bold font-sans text-xs flex items-center justify-center gap-1.5 shadow ${
              tool === 'brush'
                ? 'bg-amber-400 text-slate-900 border-amber-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span>🖌️ Polish Brush</span>
          </button>
        </div>

        {/* Dynamic Help Text */}
        <div className="text-center text-blue-950 font-mono text-[10px] py-1">
          {tool === 'soap' ? (
            <span>
              {allClean ? '✨ Sparkly Clean! Claim your hygiene rewards!' : '👉 Touch & drag soap sponge over the dirt blobs to clean!'}
            </span>
          ) : (
            <span>
              {sparkles >= 8 ? '🥳 Fully polished! Warm heart!' : `👉 Swipe the brush over the Dino ${8 - sparkles} times to polish scales!`}
            </span>
          )}
        </div>

        {/* Claim Buttons */}
        {tool === 'soap' && allClean && (
          <button
            onClick={handleFinishBath}
            id="btn-groom-hygiene"
            className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 border-2 border-emerald-950 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-md active:translate-y-0.5 animate-bounce"
          >
            Claim Spotless Reward (+10 🪙)
          </button>
        )}

        {tool === 'brush' && sparkles >= 8 && (
          <button
            onClick={handleBrushingDone}
            id="btn-groom-happy"
            className="w-full py-2 bg-amber-500 hover:bg-amber-400 border-2 border-amber-950 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-md active:translate-y-0.5"
          >
            Claim Polishing Shine (+5 🪙)
          </button>
        )}

        {/* Wash Away Droppings option if poops exist */}
        {dino.poops.length > 0 && (
          <button
            onClick={() => {
              SoundEffects.success();
              onClearPoops();
            }}
            id="btn-clear-droppings"
            className="w-full py-2 bg-rose-500 hover:bg-rose-400 border-2 border-rose-950 text-white font-bold text-[11px] rounded-lg shadow-md active:translate-y-0.5"
          >
            💩 Scoop Environment Droppings ({dino.poops.length}) (+5 🪙)
          </button>
        )}
      </div>
    </div>
  );
};
