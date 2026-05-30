import React, { useState } from 'react';
import { DinoState } from '../types';
import { SoundEffects } from '../utils/SoundEffects';

interface TamagotchiShellProps {
  dino: DinoState;
  children: React.ReactNode;
  onSpeedToggle: () => void;
  gameSpeed: 'Normal' | 'Fast' | 'Sonic';
  activeAppTab: string;
  setAppTab: (tab: any) => void;
  soundMuted: boolean;
  setSoundMuted: (muted: boolean) => void;
}

export const TamagotchiShell: React.FC<TamagotchiShellProps> = ({
  dino,
  children,
  onSpeedToggle,
  gameSpeed,
  activeAppTab,
  setAppTab,
  soundMuted,
  setSoundMuted,
}) => {
  // Pastel color themes for the physical handheld casing
  const shellColors = [
    { id: 'mint', name: 'Dino Mint', bgClass: 'from-emerald-300 via-teal-400 to-emerald-500', buttonColor: 'bg-yellow-400 border-yellow-600 active:bg-yellow-500' },
    { id: 'pink', name: 'Sakura Ribbon', bgClass: 'from-pink-300 via-rose-400 to-pink-500', buttonColor: 'bg-emerald-400 border-emerald-600 active:bg-emerald-500' },
    { id: 'lavender', name: 'Lavender Dusk', bgClass: 'from-indigo-300 via-purple-400 to-indigo-500', buttonColor: 'bg-rose-400 border-rose-600 active:bg-rose-500' },
    { id: 'slate', name: 'Original 1996', bgClass: 'from-stone-300 via-slate-400 to-stone-500', buttonColor: 'bg-indigo-400 border-indigo-600 active:bg-indigo-500' },
  ];

  const [activeShellIdx, setActiveShellIdx] = useState<number>(0);
  const shell = shellColors[activeShellIdx];

  const handleShellChange = () => {
    SoundEffects.click();
    setActiveShellIdx((prev) => (prev + 1) % shellColors.length);
  };

  const toggleSound = () => {
    const nextMuted = !soundMuted;
    setSoundMuted(nextMuted);
    // Beep with temporary local unmuting if un-muting
    if (!nextMuted) {
      setTimeout(() => {
        SoundEffects.success();
      }, 50);
    }
  };

  // Check alerts to blink icons
  const showHungerAlert = dino.stage !== 'Egg' && dino.hunger < 30;
  const showSickAlert = dino.isSick;
  const showSleepAlert = dino.isSleeping;
  const showHygieneAlert = dino.stage !== 'Egg' && (dino.hygiene < 30 || dino.poops.length > 0);

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center p-2 select-none">
      
      {/* Handheld Device Header Toggles */}
      <div className="w-full max-w-sm flex justify-between items-center px-4 py-2 font-mono text-[10px] text-gray-500">
        <button
          onClick={handleShellChange}
          id="btn-change-shell"
          className="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-100 text-gray-600 transition active:scale-95 cursor-pointer"
        >
          🎨 Shell: <span className="font-bold text-gray-800">{shell.name}</span>
        </button>

        <div className="flex gap-2">
          {/* Game Speed Controller */}
          <button
            onClick={() => {
              SoundEffects.click();
              onSpeedToggle();
            }}
            id="btn-speed-toggle"
            className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-100 text-gray-600 transition active:scale-95 cursor-pointer"
          >
            ⏱️ Speed: <span className="font-bold text-emerald-600">{gameSpeed}</span>
          </button>

          {/* Mute Controller */}
          <button
            onClick={toggleSound}
            id="btn-mute-toggle"
            className="px-2.5 py-1 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-100 text-gray-600 transition active:scale-95 font-bold cursor-pointer"
          >
            {soundMuted ? '🔇 Muted' : '🔊 Sound'}
          </button>
        </div>
      </div>

      {/* Main Hardware Chassis Shape */}
      <div className={`relative w-full max-w-[395px] aspect-[4/5] bg-gradient-to-br ${shell.bgClass} rounded-[54px] p-6 shadow-[0_24px_50px_rgba(0,0,0,0.3),inset_0_-8px_16px_rgba(0,0,0,0.25),inset_0_8px_16px_rgba(255,255,255,0.4)] border-[6px] border-white flex flex-col items-center justify-between`}>
        
        {/* Retro Device Brand Logo Header */}
        <div className="mt-1 flex flex-col items-center text-center">
          <h1 className="font-sans font-extrabold text-white text-base tracking-widest drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.25)]">
            DINO VIRTUAL PET
          </h1>
          {/* Beaded Keychain Clip */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border-[5px] border-gray-300 shadow-inner bg-transparent flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-400 animate-pulse" />
          </div>
        </div>

        {/* LCD Screen Border Bezel Panel */}
        <div className="w-full bg-stone-900 rounded-[30px] p-4 pt-3 pb-3 border-[6px] border-stone-800 shadow-[2px_4px_16px_rgba(0,0,0,0.8),inset_0_4px_8px_rgba(0,0,0,0.6)] flex flex-col justify-between aspect-[1.12]">
          
          {/* Screen Top Status Bars (pizza slice, bath bubbles, games, scale parameters) */}
          <div className="flex justify-between items-center border-b border-stone-800 border-opacity-40 pb-1 px-1 text-[11px]">
            <span
              onClick={() => { SoundEffects.click(); setAppTab('status'); }}
              className={`cursor-pointer transition duration-150 ${activeAppTab === 'status' ? 'opacity-100 scale-110 font-bold text-yellow-400' : 'opacity-40 hover:opacity-75 text-stone-300'}`}
              title="Stats"
            >
              📊
            </span>
            <span
              onClick={() => { SoundEffects.click(); setAppTab('feed'); }}
              className={`cursor-pointer transition duration-150 ${showHungerAlert ? 'animate-bounce opacity-100 text-red-400' : ''} ${activeAppTab === 'feed' ? 'opacity-100 scale-110 font-bold text-orange-400' : 'opacity-40 hover:opacity-75 text-stone-300'}`}
              title="Feed Info"
            >
              🍗
            </span>
            <span
              onClick={() => { SoundEffects.click(); setAppTab('groom'); }}
              className={`cursor-pointer transition duration-150 ${showHygieneAlert ? 'animate-pulse opacity-100 font-bold text-purple-400' : ''} ${activeAppTab === 'groom' ? 'opacity-100 scale-110 font-bold text-sky-400' : 'opacity-40 hover:opacity-75 text-stone-300'}`}
              title="Groom bath"
            >
              🧼
            </span>
            <span
              onClick={() => { SoundEffects.click(); setAppTab('play'); }}
              className={`cursor-pointer transition duration-150 ${activeAppTab === 'play' ? 'opacity-100 scale-110 font-bold text-emerald-400' : 'opacity-40 hover:opacity-75 text-stone-300'}`}
              title="Play games"
            >
              🎮
            </span>
            <span
              onClick={() => { SoundEffects.click(); setAppTab('shop'); }}
              className={`cursor-pointer transition duration-150 ${activeAppTab === 'shop' ? 'opacity-100 scale-110 font-bold text-amber-400' : 'opacity-40 hover:opacity-75 text-stone-300'}`}
              title="Shop Accessories"
            >
              👑
            </span>
          </div>

          {/* Inside Display Frame */}
          <div className="flex-1 w-full bg-[#9fbf9f] rounded-lg border-2 border-stone-950 p-2 text-stone-900 relative flex flex-col justify-between overflow-hidden shadow-inner font-mono">
            {/* Screen static/digital LCD texture Overlay */}
            <div className="absolute inset-0 bg-repeat bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px)] z-20 pointer-events-none" style={{ backgroundSize: '100% 3px' }} />
            
            {/* Active app viewport children components */}
            <div className="relative z-10 w-full h-full">
              {children}
            </div>
          </div>

          {/* Under Screen Alert Indicators */}
          <div className="flex justify-between items-center border-t border-stone-800 border-opacity-40 pt-1 px-2 text-[10px] text-stone-400 select-none">
            <span className={`${showHungerAlert ? 'text-rose-500 font-bold animate-pulse' : 'opacity-30'}`}>⚠️ HUNGRY</span>
            <span className={`${showSickAlert ? 'text-yellow-500 font-bold animate-flash' : 'opacity-30'}`}>🤒 SICK</span>
            <span className={`${showSleepAlert ? 'text-sky-500 font-bold' : 'opacity-30'}`}>💤 SLEEP</span>
            <span className={`${showHygieneAlert ? 'text-amber-500 font-bold animate-pulse' : 'opacity-30'}`}>💩 FILTHY</span>
          </div>

        </div>

        {/* Physical tactile button selection at bottom (Buttons A, B, C) */}
        <div className="w-full flex justify-around mt-1 px-4 select-none relative">
          
          {/* Button A: Status View */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={() => {
                SoundEffects.click();
                setAppTab('status');
              }}
              id="btn-phys-a"
              className={`w-11 h-11 rounded-full border-b-4 border-r-2 ${shell.buttonColor} shadow-md transform active:translate-y-0.5 active:shadow-inner cursor-pointer flex items-center justify-center font-bold text-xs`}
            >
              A
            </button>
            <span className="text-[10px] text-white font-bold tracking-wider uppercase drop-shadow">STATS</span>
          </div>

          {/* Button B: Cycle Action selection */}
          <div className="flex flex-col items-center gap-1.5 mt-2">
            <button
              onClick={() => {
                SoundEffects.click();
                // Cycle tabs: status -> feed -> groom -> play -> shop -> status
                const tabs = ['status', 'feed', 'groom', 'play', 'shop'];
                const nextIdx = (tabs.indexOf(activeAppTab) + 1) % tabs.length;
                setAppTab(tabs[nextIdx]);
              }}
              id="btn-phys-b"
              className={`w-12 h-12 rounded-full border-b-4 border-r-2 ${shell.buttonColor} shadow-lg transform active:translate-y-0.5 active:shadow-inner cursor-pointer flex items-center justify-center font-bold text-sm`}
            >
              B
            </button>
            <span className="text-[10px] text-white font-bold tracking-wider uppercase drop-shadow">SELECT</span>
          </div>

          {/* Button C: Interact / Help info */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={() => {
                SoundEffects.click();
                setAppTab('status'); // acts as Reset/Cancel
              }}
              id="btn-phys-c"
              className={`w-11 h-11 rounded-full border-b-4 border-r-2 ${shell.buttonColor} shadow-md transform active:translate-y-0.5 active:shadow-inner cursor-pointer flex items-center justify-center font-bold text-xs`}
            >
              C
            </button>
            <span className="text-[10px] text-white font-bold tracking-wider uppercase drop-shadow">RESET</span>
          </div>
        </div>

        {/* Nostalgic printed details */}
        <div className="mt-2 w-full flex justify-between px-6 text-[8px] text-white text-opacity-50 font-mono tracking-widest uppercase">
          <span>Est. 1996</span>
          <div className="flex items-center gap-0.5">
            <span className="block w-1.5 h-1.5 rounded-full bg-slate-300 bg-opacity-40" />
            <span className="block w-4 h-1 rounded-sm bg-slate-400 bg-opacity-40" />
          </div>
          <span>DeepMind Toy</span>
        </div>

      </div>
    </div>
  );
};
