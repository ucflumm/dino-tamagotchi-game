import React, { useState, useEffect, useRef } from 'react';
import {
  DinoState,
  DinoSpecies,
  EvolutionStage,
  PoopInstance,
  FOOD_ITEMS,
  SHOP_ACCESSORIES,
  FoodItem,
} from './types';
import { DinoSprite } from './components/DinoSprite';
import { DinoRunnerGame } from './components/DinoRunnerGame';
import { FruitCatcherGame } from './components/FruitCatcherGame';
import { GroomingView } from './components/GroomingView';
import { SoundEffects, setMuted } from './utils/SoundEffects';

// Lucide Icons
import {
  Wifi,
  Volume2,
  VolumeX,
  Battery,
  BatteryCharging,
  Clock,
  ChevronLeft,
  Settings,
  BookOpen,
  ShoppingBag,
  RotateCcw,
  Sparkles,
  Gamepad2,
  Trash2,
  Moon,
  Sun,
  ShieldAlert,
  Heart,
  Droplets,
  Utensils,
  Dna,
  Coins,
  ChevronDown,
  Info,
  Play,
  RotateCw,
  Home,
  Check,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';

const STORAGE_KEY = 'dino_virtual_pet_save';

const DEFAULT_STATE: DinoState = {
  name: '',
  color: 'emerald',
  stage: 'Egg',
  species: null,
  age: 0,
  health: 100,
  hunger: 50,
  happiness: 50,
  hygiene: 80,
  energy: 60,
  isSleeping: false,
  isSick: false,
  bornAt: Date.now(),
  lastTickAt: Date.now(),
  eggTaps: 0,
  poops: [],
  coins: 50, // Start with cozy set of coins
  accessories: [],
  activeAccessory: null,
  careXP: 0,
  steakCount: 0,
  vegCount: 0,
};

export default function App() {
  // Dino State
  const [dino, setDino] = useState<DinoState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            return {
              ...DEFAULT_STATE,
              ...parsed,
              bornAt: parsed.bornAt || Date.now(),
              lastTickAt: parsed.lastTickAt || Date.now(),
              careXP: parsed.careXP !== undefined ? parsed.careXP : 0,
              steakCount: parsed.steakCount !== undefined ? parsed.steakCount : 0,
              vegCount: parsed.vegCount !== undefined ? parsed.vegCount : 0,
            };
          }
        } catch (e) {
          console.error('Failed to parse saved dino state', e);
        }
      }
    }
    return DEFAULT_STATE;
  });

  // Simulated Tablet & OS settings
  const [activeApp, setActiveApp] = useState<'launcher' | 'pet' | 'arcade' | 'codex' | 'boutique' | 'settings'>('launcher');
  const [activeTab, setActiveTab] = useState<'status' | 'feed' | 'groom'>('status');
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [gameSpeed, setGameSpeed] = useState<'Normal' | 'Fast' | 'Sonic'>('Normal');
  const [scenery, setScenery] = useState<'sunny' | 'volcano' | 'ice' | 'midnight'>('sunny');
  const [isLandscape, setIsLandscape] = useState<boolean>(true); // Rotate tablet framework
  const [screenBrightness, setScreenBrightness] = useState<number>(100);
  const [wifiOn, setWifiOn] = useState<boolean>(true);
  const [notificationShadeOpen, setNotificationShadeOpen] = useState<boolean>(false);
  const [recentAppsOverlay, setRecentAppsOverlay] = useState<boolean>(false);

  // Tablet system local time
  const [systemTime, setSystemTime] = useState<string>('08:00 AM');

  // Mini-game overlay state inside arcade
  const [activeGame, setActiveGame] = useState<'none' | 'runner' | 'catcher'>('none');

  // Evolution & Hatching states
  const [namingPhase, setNamingPhase] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newColor, setNewColor] = useState<string>('emerald');

  // Evolution Celebration overlay trigger
  const [evolutionModal, setEvolutionModal] = useState<boolean>(false);
  const [evolutionForm, setEvolutionForm] = useState<{ from: EvolutionStage; to: EvolutionStage; species: DinoSpecies | null }>({ from: 'Egg', to: 'Egg', species: null });
  const prevStageRef = useRef<EvolutionStage>(dino.stage);

  // System alert messages (notifications)
  const [notifications, setNotifications] = useState<string[]>([]);

  // Sound sync
  useEffect(() => {
    setMuted(soundMuted);
  }, [soundMuted]);

  // Persist State
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dino));
  }, [dino]);

  // Real-time system clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setSystemTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      );
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 30000);
    return () => clearInterval(clockInterval);
  }, []);

  // System wide alert notification engine
  useEffect(() => {
    if (dino.stage === 'Egg') return;
    const systemNotifications: string[] = [];

    if (dino.health < 30) {
      systemNotifications.push('⚠️ System: Critically low companion health detected!');
    }
    if (dino.hunger < 25) {
      systemNotifications.push('🍽️ DinoCare: Roary is starving! Feed immediately.');
    }
    if (dino.hygiene < 20) {
      systemNotifications.push('🧼 Sanitizer: Hygiene critical. Dirt and poops pileup!');
    }
    if (dino.isSick) {
      systemNotifications.push('🤒 Clinic Alert: Companion has contracted prehistoric illness.');
    }
    if (dino.energy < 20 && !dino.isSleeping) {
      systemNotifications.push('💤 Power Save: Exhausted energy levels. Nap lights recommended!');
    }

    setNotifications(systemNotifications);
  }, [dino.health, dino.hunger, dino.hygiene, dino.isSick, dino.energy, dino.stage]);

  // Evolution Celebration Trigger
  useEffect(() => {
    if (prevStageRef.current !== dino.stage) {
      if (prevStageRef.current !== 'Egg') {
        SoundEffects.levelUp();
        setEvolutionForm({
          from: prevStageRef.current,
          to: dino.stage,
          species: dino.species,
        });
        setEvolutionModal(true);
        // Auto launch Pet app so they see the evolved form
        setActiveApp('pet');
      }
      prevStageRef.current = dino.stage;
    }
  }, [dino.stage, dino.species]);

  // Tick Rates for background simulation
  const getTickRate = () => {
    switch (gameSpeed) {
      case 'Fast':
        return 1200;
      case 'Sonic':
        return 400;
      default:
        return 3500;
    }
  };

  // Main Simulation Loop
  useEffect(() => {
    const handleTick = () => {
      if (dino.stage === 'Egg' || dino.health <= 0) return;

      setDino((prev) => {
        // Depletions
        let deltaHunger = prev.isSleeping ? -0.3 : -1.4;
        let deltaHappiness = prev.isSleeping ? -0.2 : -1.2;
        let deltaHygiene = prev.isSleeping ? -0.15 : -1.0;
        let deltaEnergy = prev.isSleeping ? 4.5 : -1.2;

        const poopCount = prev.poops.length;
        if (poopCount > 0) {
          deltaHappiness -= poopCount * 0.7;
          deltaHygiene -= poopCount * 1.3;
        }

        const accessoryBonus = prev.activeAccessory ? 0.3 : 0;

        let nextHunger = Math.max(0, Math.min(100, prev.hunger + deltaHunger));
        let nextHappiness = Math.max(0, Math.min(100, prev.happiness + deltaHappiness + accessoryBonus));
        let nextHygiene = Math.max(0, Math.min(100, prev.hygiene + deltaHygiene));
        let nextEnergy = Math.max(0, Math.min(100, prev.energy + deltaEnergy));

        // Illness probability when condition decays
        let nextSick = prev.isSick;
        if (!nextSick && prev.stage !== 'Egg') {
          const sickRisk = (100 - nextHunger) * 0.04 + (100 - nextHygiene) * 0.07;
          if (Math.random() * 100 < sickRisk && Math.random() > 0.96) {
            nextSick = true;
            SoundEffects.hurt();
          }
        }

        // Health Updates
        let nextHealth = prev.health;
        if (nextHunger <= 0 || nextHygiene <= 10 || nextEnergy <= 5 || nextSick) {
          let penalty = 0;
          if (nextHunger <= 0) penalty += 4;
          if (nextHygiene <= 10) penalty += 2;
          if (nextEnergy <= 5) penalty += 1;
          if (nextSick) penalty += 3;
          nextHealth = Math.max(0, prev.health - penalty);
        } else {
          if (nextHunger > 50 && nextHygiene > 50 && nextEnergy > 30 && !nextSick) {
            nextHealth = Math.min(100, prev.health + 3);
          }
        }

        // Care Quality & XP Evolution Growth System
        const isWelldone = nextHunger >= 50 && nextHappiness >= 50 && nextHygiene >= 50;
        let nextCareXP = prev.careXP !== undefined ? prev.careXP : 0;
        let nextStage = prev.stage;
        let nextSpecies = prev.species;
        let nextAge = prev.age;

        if (prev.stage !== 'Egg' && prev.health > 0) {
          if (isWelldone) {
            const gain = gameSpeed === 'Sonic' ? 10 : gameSpeed === 'Fast' ? 5 : 2;
            nextCareXP = Math.min(100, nextCareXP + gain);
          } else if (nextHunger < 20 || nextHappiness < 20 || nextHygiene < 20) {
            const decay = gameSpeed === 'Sonic' ? 2 : 1;
            nextCareXP = Math.max(0, nextCareXP - decay);
          }
        }

        // Handle auto milestones
        if (nextCareXP >= 100) {
          if (prev.stage === 'Baby') {
            nextStage = 'Teen';
            nextCareXP = 0;
            nextAge += 1;
          } else if (prev.stage === 'Teen') {
            nextStage = 'Adult';
            nextCareXP = 100; // Complete
            nextAge += 2;

            // Adult sub-species logic based on food choices and customization items unlocked
            const finalSteaks = prev.steakCount || 0;
            const finalVegs = prev.vegCount || 0;
            if (prev.accessories && prev.accessories.length >= 3) {
              nextSpecies = 'Secret Dragon';
            } else if (finalSteaks > finalVegs) {
              nextSpecies = 'T-Rex';
            } else if (finalVegs > finalSteaks) {
              nextSpecies = 'Triceratops';
            } else {
              nextSpecies = 'Pterodactyl';
            }
          }
        }

        // Slowly progress Dino days age
        const ticksThreshold = gameSpeed === 'Sonic' ? 25 : gameSpeed === 'Fast' ? 60 : 120;
        const tickKey = '__ticks_pass';
        const currentTicks = ((prev as any)[tickKey] || 0) + 1;
        if (currentTicks >= ticksThreshold) {
          nextAge += 1;
        }

        // Spawn poops based on low hygiene
        let nextPoops = [...prev.poops];
        if (nextHygiene < 40 && nextPoops.length < 5 && Math.random() > 0.94 && !prev.isSleeping) {
          nextPoops.push({
            id: `poop_${Date.now()}`,
            x: 12 + Math.random() * 76,
            y: 70 + Math.random() * 12,
          });
        }

        // Daily allowance coin reward based on keeping health intact
        let extraCoins = 0;
        if (currentTicks >= ticksThreshold && nextHealth > 0) {
          extraCoins = 15 + (nextHappiness > 75 ? 10 : 0);
        }

        return {
          ...prev,
          hunger: nextHunger,
          happiness: nextHappiness,
          hygiene: nextHygiene,
          energy: nextEnergy,
          health: nextHealth,
          isSick: nextSick,
          poops: nextPoops,
          age: nextAge,
          stage: nextStage,
          species: nextSpecies,
          careXP: nextCareXP,
          coins: prev.coins + extraCoins + (currentTicks >= ticksThreshold ? 5 : 0),
          [tickKey]: currentTicks >= ticksThreshold ? 0 : currentTicks,
        } as DinoState;
      });
    };

    const intervalId = setInterval(handleTick, getTickRate());
    return () => clearInterval(intervalId);
  }, [dino.stage, dino.health, dino.isSleeping, gameSpeed]);

  // Tap Egg Interaction
  const handleEggTap = () => {
    if (dino.stage !== 'Egg') return;
    SoundEffects.click();

    setDino((prev) => {
      const nextTaps = prev.eggTaps + 1;
      if (nextTaps >= 10) {
        SoundEffects.hatch();
        setNamingPhase(true);
        return {
          ...prev,
          eggTaps: 10,
        };
      }
      return {
        ...prev,
        eggTaps: nextTaps,
      };
    });
  };

  // Hatch Egg Complete (Form submit)
  const handleHatchConfirm = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newName.trim()) return;

    SoundEffects.success();
    setNamingPhase(false);

    setDino((prev) => ({
      ...prev,
      name: newName.trim(),
      color: newColor,
      stage: 'Baby',
      hunger: 70,
      happiness: 70,
      hygiene: 90,
      energy: 80,
      careXP: 0,
      steakCount: 0,
      vegCount: 0,
      bornAt: Date.now(),
    }));
    setActiveApp('pet');
    setActiveTab('status');
  };

  // Action: Feeding
  const handleFeed = (food: FoodItem) => {
    if (dino.isSleeping) return;
    if (dino.coins < food.cost) {
      SoundEffects.hurt();
      return;
    }

    SoundEffects.eat();

    setDino((prev) => {
      const finalHunger = Math.min(100, prev.hunger + food.hungerBoost);
      const finalHappiness = Math.min(100, prev.happiness + food.happinessBoost);
      const finalHygiene = Math.min(100, Math.max(0, prev.hygiene + food.hygieneImpact));
      const finalEnergy = Math.min(100, Math.max(0, prev.energy + food.energyImpact));

      let prevSteaks = prev.steakCount || 0;
      let prevVegs = prev.vegCount || 0;
      if (food.id === 'steak' || food.id === 'golden_meat') prevSteaks += 1;
      if (food.id === 'broccoli') prevVegs += 1;

      let finalHealth = prev.health;
      if (food.id === 'cupcake') {
        finalHealth = Math.max(5, prev.health - 2);
      }

      const nextXP = Math.min(100, (prev.careXP !== undefined ? prev.careXP : 0) + 3);

      return {
        ...prev,
        hunger: finalHunger,
        happiness: finalHappiness,
        hygiene: finalHygiene,
        energy: finalEnergy,
        health: finalHealth,
        steakCount: prevSteaks,
        vegCount: prevVegs,
        careXP: nextXP,
        coins: prev.coins - food.cost,
      };
    });
  };

  // Action: Groom finished inside bubble station
  const handleGroomFinish = (hygieneBoost: number, happinessBoost: number, coinsEarned: number) => {
    setDino((prev) => {
      const nextXP = Math.min(100, (prev.careXP !== undefined ? prev.careXP : 0) + 4);
      return {
        ...prev,
        hygiene: Math.min(100, prev.hygiene + hygieneBoost),
        happiness: Math.min(100, prev.happiness + happinessBoost),
        careXP: nextXP,
        coins: prev.coins + coinsEarned,
      };
    });
    // Go to status tab inside petapp
    setActiveTab('status');
  };

  // Clean individual poop on viewport click
  const handleClearPoopInstance = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    SoundEffects.success();
    setDino((prev) => ({
      ...prev,
      poops: prev.poops.filter((p) => p.id !== id),
      hygiene: Math.min(100, prev.hygiene + 12),
      coins: prev.coins + 6,
    }));
  };

  // Mass Poop broom sweep
  const handleClearPoops = () => {
    if (dino.poops.length === 0) return;
    setDino((prev) => ({
      ...prev,
      poops: [],
      hygiene: Math.min(100, prev.hygiene + 25),
      coins: prev.coins + prev.poops.length * 5,
    }));
  };

  // Sleep State Trigger
  const toggleLightSleep = () => {
    SoundEffects.click();
    setDino((prev) => ({
      ...prev,
      isSleeping: !prev.isSleeping,
    }));
  };

  // Administer Sickness Medicine (10 coins)
  const administerMedicine = () => {
    if (dino.coins < 10) {
      SoundEffects.hurt();
      return;
    }

    SoundEffects.success();
    setDino((prev) => ({
      ...prev,
      isSick: false,
      health: Math.min(100, prev.health + 30),
      coins: prev.coins - 10,
    }));
  };

  // Reset nursery to a new egg
  const handleResurrect = () => {
    SoundEffects.hatch();
    setDino(DEFAULT_STATE);
    setNewName('');
    setNewColor('emerald');
    setActiveApp('launcher');
    setActiveTab('status');
    setActiveGame('none');
  };

  // Play Mini-Games payout
  const handleEarnGameRewards = (coinsEarned: number, happinessEarned: number) => {
    setActiveGame('none');
    setDino((prev) => {
      const nextXP = Math.min(100, (prev.careXP !== undefined ? prev.careXP : 0) + 8);
      return {
        ...prev,
        coins: prev.coins + coinsEarned,
        happiness: Math.min(100, prev.happiness + happinessEarned),
        energy: Math.max(5, prev.energy - 10),
        careXP: nextXP,
      };
    });
  };

  // Accessories Purchase system
  const handleBuyAccessory = (item: typeof SHOP_ACCESSORIES[0]) => {
    const isUnlocked = dino.accessories.includes(item.id);

    if (isUnlocked) {
      SoundEffects.click();
      setDino((prev) => ({
        ...prev,
        activeAccessory: prev.activeAccessory === item.id ? null : item.id,
      }));
    } else {
      if (dino.coins < item.cost) {
        SoundEffects.hurt();
        return;
      }

      SoundEffects.success();
      setDino((prev) => ({
        ...prev,
        coins: prev.coins - item.cost,
        accessories: [...prev.accessories, item.id],
        activeAccessory: item.id,
      }));
    }
  };

  // System Sound Level mute toggle
  const toggleSystemMute = () => {
    SoundEffects.click();
    setSoundMuted((prev) => !prev);
  };

  // Tick update rate speeds selector
  const cycleGameSpeed = () => {
    SoundEffects.click();
    setGameSpeed((prev) => {
      if (prev === 'Normal') return 'Fast';
      if (prev === 'Fast') return 'Sonic';
      return 'Normal';
    });
  };

  // Expression Helper
  const currentExpression = (): 'idle' | 'happy' | 'blink' | 'eat' | 'sad' | 'sick' | 'sleep' => {
    if (dino.health <= 0) return 'sad';
    if (dino.isSleeping) return 'sleep';
    if (dino.isSick) return 'sick';
    if (dino.hunger < 25 || dino.hygiene < 30) return 'sad';
    if (dino.happiness > 75) return 'happy';
    return 'idle';
  };

  // Active Scenery scenery color palette
  const getSceneryClass = () => {
    switch (scenery) {
      case 'volcano':
        return {
          bg: 'from-orange-500 via-rose-600 to-amber-700',
          terrain: 'border-amber-950 bg-amber-900',
          sun: 'bg-red-400 shadow-[0_0_20px_rgba(244,63,94,0.6)]',
          cloud: 'bg-stone-800/30',
          emoji: '🌋',
          text: 'text-amber-100',
          name: 'Volcano Caldera',
        };
      case 'ice':
        return {
          bg: 'from-sky-300 via-blue-400 to-indigo-600',
          terrain: 'border-blue-200 bg-blue-100',
          sun: 'bg-cyan-50 shadow-[0_0_20px_rgba(207,250,254,0.5)]',
          cloud: 'bg-white/80',
          emoji: '❄️',
          text: 'text-cyan-900',
          name: 'Frozen Glacier',
        };
      case 'midnight':
        return {
          bg: 'from-violet-950 via-indigo-950 to-slate-950',
          terrain: 'border-slate-800 bg-slate-900',
          sun: 'bg-amber-100 shadow-[0_0_20px_rgba(254,243,199,0.7)]',
          cloud: 'bg-indigo-900/40',
          emoji: '🌌',
          text: 'text-indigo-200',
          name: 'Celestial Night',
        };
      default: // sunny valley
        return {
          bg: 'from-sky-400 via-emerald-300 to-emerald-400',
          terrain: 'border-emerald-800 bg-emerald-700',
          sun: 'bg-yellow-300 shadow-[0_0_25px_rgba(253,224,71,0.6)]',
          cloud: 'bg-white/85',
          emoji: '🌿',
          text: 'text-emerald-950',
          name: 'Sunny Valley',
        };
    }
  };

  const activeScenery = getSceneryClass();

  // Forecast helper for evolution
  const getEvolutionForecast = (): string => {
    if (dino.stage === 'Egg') return 'Egg Shape (Keep tapping!)';
    if (dino.stage === 'Adult') return `Adult Species: ${dino.species}`;

    if (dino.accessories && dino.accessories.length >= 3) return 'Secret Dragon 🐉 (3+ accessories equipped)';
    const steaks = dino.steakCount || 0;
    const vegs = dino.vegCount || 0;
    if (steaks > vegs) return 'T-Rex 🦖 (Carnivore Diet)';
    if (vegs > steaks) return 'Triceratops 🦕 (Herbivore Diet)';
    return 'Pterodactyl 🦅 (Balanced Diet)';
  };

  // Exit App back to Main Launcher home screen
  const exitToLauncher = () => {
    SoundEffects.click();
    setActiveApp('launcher');
    // turn off game if running
    setActiveGame('none');
    setRecentAppsOverlay(false);
  };

  // Android system navigation back action
  const handleNavBack = () => {
    SoundEffects.click();
    if (activeGame !== 'none') {
      setActiveGame('none');
    } else if (activeApp !== 'launcher') {
      setActiveApp('launcher');
    }
    setRecentAppsOverlay(false);
  };

  return (
    <main className="min-h-screen bg-[#111827] text-slate-100 font-sans flex flex-col justify-center items-center p-3 sm:p-6 overflow-hidden select-none select-none relative">
      
      {/* Decorative ambient neon background circles */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Desk surface controller toolbar */}
      <div className="w-full max-w-[1010px] mb-3 flex flex-wrap items-center justify-between gap-3 px-2 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500 text-slate-950 p-1.5 rounded-xl font-black text-xs animate-bounce">
            🦖 TABLET SIMULATOR
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-400">
            DinoOS v3.4 • Vibrant Edition
          </span>
        </div>

        {/* Rotate tablet button */}
        <button
          onClick={() => {
            SoundEffects.click();
            setIsLandscape((prev) => !prev);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold cursor-pointer active:scale-95 transition"
        >
          <RotateCw size={12} className="text-emerald-400" />
          <span>Rotate Screen</span>
          <span className="text-[10px] bg-slate-900 text-slate-300 px-1 py-0.2 rounded">
            {isLandscape ? 'Landscape' : 'Portrait'}
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 📱 HARNESS COMPONENT: SIMULATED ANDROID TABLET FRAME */}
      {/* ========================================================= */}
      <div
        className={`w-full max-w-[1010px] border-[14px] border-slate-900 bg-slate-950 rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] relative overflow-hidden transition-all duration-500 ease-in-out ${
          isLandscape ? 'aspect-[16/10.5]' : 'aspect-[10/14.5]'
        }`}
        style={{
          boxShadow: '0 0 0 2px rgba(255,255,255,0.05), shadow-2xl',
        }}
      >
        {/* Physical camera lens punch hole on the bezel (top bezel or side bezel based on perspective) */}
        <div
          className={`absolute rounded-full bg-[#111] border border-slate-800 z-50 transition-all duration-500 ${
            isLandscape
              ? 'top-[4px] left-1/2 -translate-x-1/2 w-3.5 h-3.5 flex items-center justify-center'
              : 'top-1/2 left-[4px] -translate-y-1/2 w-3.5 h-3.5 flex items-center justify-center'
          }`}
        >
          <div className="w-1.5 h-1.5 bg-blue-900/80 rounded-full" /> {/* Camera lens reflection */}
        </div>

        {/* Outer Volume/Power switches mock buttons on bezel corner edges */}
        <div className="absolute top-[80px] -right-[15px] w-[3px] h-[40px] bg-slate-800 rounded-l" />
        <div className="absolute top-[130px] -right-[15px] w-[3px] h-[30px] bg-slate-800 rounded-l" />

        {/* SCREEN CANVAS AREA */}
        <div
          className="absolute inset-0 bg-slate-900 flex flex-col justify-between overflow-hidden relative"
          style={{
            filter: `brightness(${screenBrightness}%)`,
          }}
        >
          
          {/* ========================================================= */}
          {/* 📶 ANDROID SYSTEM STATUS BAR */}
          {/* ========================================================= */}
          <div
            onClick={() => setNotificationShadeOpen((prev) => !prev)}
            className="bg-black/60 hover:bg-black/85 text-slate-100 h-8 px-4 flex items-center justify-between text-xs font-sans select-none border-b border-white/5 cursor-pointer z-50 absolute inset-x-0 top-0 transition"
          >
            {/* Status Left: System Clock & Active notifications indicators */}
            <div className="flex items-center gap-2">
              <span className="font-bold font-sans tracking-wide text-white">{systemTime}</span>
              <div className="h-3.5 w-px bg-white/20 mx-1" />
              {/* App status badge */}
              <div className="flex gap-1.5 text-[10px]">
                {dino.stage !== 'Egg' && dino.hunger < 30 && <span className="animate-pulse">🥩</span>}
                {dino.stage !== 'Egg' && dino.hygiene < 25 && <span className="animate-pulse">🧼</span>}
                {dino.isSick && <span className="animate-bounce">🤒</span>}
                {dino.coins > 200 && <span>👑</span>}
                {notifications.length > 0 && (
                  <span className="bg-red-500 text-[8px] text-white px-1 leading-normal rounded-full font-bold">
                    {notifications.length}
                  </span>
                )}
              </div>
            </div>

            {/* Status Right: Connection, Audio State, Battery linked to Dino's Energy */}
            <div className="flex items-center gap-2.5 text-slate-300 text-[11px]">
              {wifiOn ? <Wifi size={12} className="text-emerald-400" /> : <Wifi size={12} className="opacity-40 text-rose-500" />}
              {soundMuted ? <VolumeX size={12} className="text-rose-400" /> : <Volume2 size={12} className="text-emerald-400" />}

              {/* Connected battery linked to Dino's energy */}
              <div className="flex items-center gap-1">
                {dino.isSleeping ? (
                  <span className="flex items-center gap-0.5 text-emerald-400 font-bold text-[10px]">
                    <BatteryCharging size={13} className="text-emerald-400 anim-pulse" />
                    <span>{dino.energy}%</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5">
                    <Battery size={13} className={dino.energy < 20 ? 'text-red-400 animate-pulse' : 'text-slate-300'} />
                    <span>{dino.energy}%</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 🪟 SYSTEM LAYER: PULL DOWN ANDROID QUICK SETTINGS SHADE */}
          {/* ========================================================= */}
          {notificationShadeOpen && (
            <div
              className="absolute inset-x-0 top-8 bg-slate-950/95 border-b-2 border-emerald-500/40 z-50 p-4 shadow-2xl animate-fade-in flex flex-col gap-3 font-sans"
              onClick={() => setNotificationShadeOpen(false)}
            >
              <div className="flex justify-between items-center text-xs text-slate-400 pb-1 border-b border-slate-900" onClick={(e) => e.stopPropagation()}>
                <span className="font-black text-emerald-400 tracking-wider font-mono">DINO OS QUICK PANEL</span>
                <button
                  onClick={() => setNotificationShadeOpen(false)}
                  className="text-slate-500 hover:text-white"
                >
                  Close [✕]
                </button>
              </div>

              {/* Sliders grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3" onClick={(e) => e.stopPropagation()}>
                {/* Brightness control widget */}
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="flex items-center gap-1 text-slate-300"><Sun size={11} /> Screen Brightness</span>
                    <span className="font-mono text-emerald-400">{screenBrightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={screenBrightness}
                    onChange={(e) => setScreenBrightness(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                </div>

                {/* Sounds & Speeds controller */}
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex justify-between gap-1.5">
                  <button
                    onClick={toggleSystemMute}
                    className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition ${
                      soundMuted ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/10 border border-emerald-500/35 text-emerald-400'
                    }`}
                  >
                    {soundMuted ? <VolumeX size={11} /> : <Volume2 size={11} />}
                    <span>{soundMuted ? 'Muted' : 'Sound On'}</span>
                  </button>
                  <button
                    onClick={cycleGameSpeed}
                    className="flex-1 py-1 px-2 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-505/30 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Settings size={11} />
                    <span>Speed: {gameSpeed}</span>
                  </button>
                </div>
              </div>

              {/* Toggle controls row */}
              <div className="flex flex-wrap gap-2 pt-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setWifiOn((prev) => !prev)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                    wifiOn ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  <Wifi size={10} />
                  <span>Wi-Fi: {wifiOn ? 'Active' : 'Offline'}</span>
                </button>

                <button
                  onClick={() => setDino((prev) => ({ ...prev, coins: prev.coins + 20 }))}
                  className="px-3 py-1 rounded-full bg-yellow-400 hover:bg-yellow-300 text-slate-950 text-[10px] font-extrabold flex items-center gap-1"
                >
                  <Coins size={10} />
                  <span>+20 Gold Allowance 🪙</span>
                </button>
              </div>

              {/* Notification Center */}
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-850 text-[10.5px] space-y-1" onClick={(e) => e.stopPropagation()}>
                <p className="font-bold text-slate-300 uppercase text-[9px] tracking-wider">Companion Status Alerts:</p>
                {notifications.length === 0 ? (
                  <p className="text-slate-500 font-mono text-center py-1">🌿 DinoOS Kernel: All system parameters normal. Perfect care condition.</p>
                ) : (
                  <div className="max-h-[60px] overflow-y-auto space-y-1">
                    {notifications.map((note, index) => (
                      <div key={index} className="text-rose-300 bg-red-950/25 p-1 rounded font-mono">
                        {note}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 📲 RECENT PROCESSES OVERLAY SYSTEM */}
          {/* ========================================================= */}
          {recentAppsOverlay && (
            <div className="absolute inset-0 bg-slate-950/90 z-50 flex flex-col justify-center items-center p-6 animate-fade-in">
              <div className="w-full max-w-md bg-slate-900 border-2 border-slate-800 p-6 rounded-[2rem] space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest font-mono">Multitasking Switcher</h3>
                  <button onClick={() => setRecentAppsOverlay(false)} className="text-slate-500 hover:text-white font-bold font-mono text-xs">✕ Clos</button>
                </div>

                <div className="space-y-2.5">
                  <p className="text-xs text-slate-400 font-mono">Choose an active process running in background RAM:</p>
                  
                  {/* Process 1 */}
                  <div
                    onClick={() => { SoundEffects.click(); setActiveApp('pet'); setRecentAppsOverlay(false); }}
                    className="p-3 rounded-xl bg-slate-950 hover:bg-slate-850 cursor-pointer flex items-center justify-between border border-slate-850 hover:border-indigo-500"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🦖</span>
                      <div>
                        <p className="font-bold text-xs text-indigo-300">DinoCare Simulator</p>
                        <p className="text-[9px] text-slate-500">Working • Health {dino.health}%</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">[PID 4452]</span>
                  </div>

                  {/* Process 2 */}
                  <div
                    onClick={() => { SoundEffects.click(); setActiveApp('arcade'); setRecentAppsOverlay(false); }}
                    className="p-3 rounded-xl bg-slate-950 hover:bg-slate-850 cursor-pointer flex items-center justify-between border border-slate-850 hover:border-yellow-500"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🎮</span>
                      <div>
                        <p className="font-bold text-xs text-yellow-300">Retro Play Arcade</p>
                        <p className="text-[9px] text-slate-500">Sleeping • Fast Execution</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">[PID 8956]</span>
                  </div>

                  {/* Process 3 */}
                  <div
                    onClick={() => { SoundEffects.click(); setActiveApp('codex'); setRecentAppsOverlay(false); }}
                    className="p-3 rounded-xl bg-slate-950 hover:bg-slate-850 cursor-pointer flex items-center justify-between border border-slate-850 hover:border-emerald-500"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">📖</span>
                      <div>
                        <p className="font-bold text-xs text-emerald-300">Prehistoric Library</p>
                        <p className="text-[9px] text-slate-500">Static • Read Cache</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">[PID 1205]</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl text-[10px] font-mono text-slate-500">
                  <p className="text-slate-400 font-bold uppercase">Device Kernel Info:</p>
                  <p>• Model: Virtual Android D0-17 Tablet</p>
                  <p>• Dynamic Heap RAM: Allocated 8GB / Free 4.2GB</p>
                  <p>• Graphics Layer: WebGL 2D Render Engine</p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 🖥️ MAIN APPLICATION LAYER CONTENT FRAME (PAD PT+PB FOR STATUSB/NAVBAR) */}
          {/* ========================================================= */}
          <div className="flex-1 pt-8 pb-10 overflow-y-auto overflow-x-hidden relative flex flex-col justify-between">
            
            {/* ========================================================= */}
            {/* SCREEN APP 1: HOME LAUNCHER DESKTOP */}
            {/* ========================================================= */}
            {activeApp === 'launcher' && (
              <div
                className="flex-1 flex flex-col justify-around px-4 sm:px-10 py-4 text-center select-none relative"
                style={{
                  background:
                    scenery === 'sunny'
                      ? 'linear-gradient(to bottom, #dbeafe, #10b981)'
                      : scenery === 'volcano'
                      ? 'linear-gradient(to bottom, #fca5a5, #7c2d12)'
                      : scenery === 'ice'
                      ? 'linear-gradient(to bottom, #e0f2fe, #3b82f6)'
                      : 'linear-gradient(to bottom, #1e1b4b, #030712)',
                }}
              >
                {/* Floating clouds or particles overlays */}
                <div className="absolute top-10 left-10 text-4xl opacity-15 animate-pulse">☁️</div>
                <div className="absolute top-20 right-14 text-4xl opacity-15 animate-pulse" style={{ animationDelay: '1.2s' }}>☁️</div>

                {/* Home launcher clock widget */}
                <div className="space-y-1.5 z-10">
                  <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight font-sans drop-shadow-sm select-none">
                    {systemTime.split(' ')[0]}
                  </h1>
                  <p className="text-xs sm:text-sm font-black tracking-widest text-slate-800 uppercase font-mono">
                    🌿 Day {dino.stage === 'Egg' ? '0' : dino.age} of companion companion
                  </p>
                  {/* Status pills strip */}
                  <div className="flex justify-center gap-1.5 pt-1 flex-wrap">
                    <span className="text-[9.5px] px-2.5 py-0.5 rounded-full bg-white/70 border border-slate-700/15 font-black text-slate-900 uppercase">
                      Coins: {dino.coins}🪙
                    </span>
                    <span className="text-[9.5px] px-2.5 py-0.5 rounded-full bg-white/70 border border-slate-700/15 font-black text-slate-900 uppercase">
                      Companion Name: {dino.stage === 'Egg' ? 'Mystery Egg' : dino.name}
                    </span>
                    <span className="text-[9.5px] px-2.5 py-0.5 rounded-full bg-white/70 border border-slate-700/15 font-black text-slate-900 uppercase">
                      Scenery: {activeScenery.emoji} {activeScenery.name}
                    </span>
                  </div>
                </div>

                {/* Launcher App Shortcuts grid */}
                <div className="grid grid-cols-3 gap-6 max-w-sm sm:max-w-md mx-auto z-10 px-2 my-2 select-none">
                  
                  {/* Shortcut 1: Virtual Pet care */}
                  <div
                    onClick={() => { SoundEffects.click(); setActiveApp('pet'); }}
                    className="flex flex-col items-center group cursor-pointer"
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-3xl group-hover:scale-108 transition active:scale-95">
                      🦖
                    </div>
                    <span className="mt-1.5 text-[11px] font-black tracking-wide text-slate-900 truncate max-w-full drop-shadow">
                      DinoCare
                    </span>
                  </div>

                  {/* Shortcut 2: Arcade game launcher */}
                  <div
                    onClick={() => { SoundEffects.click(); setActiveApp('arcade'); }}
                    className="flex flex-col items-center group cursor-pointer"
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-tr from-yellow-400 to-amber-500 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-2xl group-hover:scale-108 transition active:scale-95">
                      🎮
                    </div>
                    <span className="mt-1.5 text-[11px] font-black tracking-wide text-slate-900 truncate max-w-full drop-shadow">
                      Arcade Play
                    </span>
                  </div>

                  {/* Shortcut 3: Codex encyclopedic */}
                  <div
                    onClick={() => { SoundEffects.click(); setActiveApp('codex'); }}
                    className="flex flex-col items-center group cursor-pointer"
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-tr from-cyan-500 to-blue-500 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-2xl group-hover:scale-108 transition active:scale-95">
                      📖
                    </div>
                    <span className="mt-1.5 text-[11px] font-black tracking-wide text-slate-900 truncate max-w-full drop-shadow">
                      DinoCodex
                    </span>
                  </div>

                  {/* Shortcut 4: Shopping accessories boutique */}
                  <div
                    onClick={() => { SoundEffects.click(); setActiveApp('boutique'); }}
                    className="flex flex-col items-center group cursor-pointer"
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-tr from-pink-500 to-purple-500 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-2xl group-hover:scale-108 transition active:scale-95">
                      🛍️
                    </div>
                    <span className="mt-1.5 text-[11px] font-black tracking-wide text-slate-900 truncate max-w-full drop-shadow">
                      Style Shop
                    </span>
                  </div>

                  {/* Shortcut 5: Device settings application */}
                  <div
                    onClick={() => { SoundEffects.click(); setActiveApp('settings'); }}
                    className="flex flex-col items-center group cursor-pointer"
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-tr from-slate-600 to-slate-800 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-2xl group-hover:scale-108 transition active:scale-95">
                      ⚙️
                    </div>
                    <span className="mt-1.5 text-[11px] font-black tracking-wide text-slate-900 truncate max-w-full drop-shadow">
                      Settings
                    </span>
                  </div>

                  {/* Shortcut 6: Reset / Hatch Nursery */}
                  <div
                    onClick={() => {
                      if (confirm('Are you sure you want to hatch a brand new dinosaur egg? All current growth progress will be reset!')) {
                        handleResurrect();
                      }
                    }}
                    className="flex flex-col items-center group cursor-pointer"
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-tr from-red-500 to-orange-500 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-2xl group-hover:scale-108 transition active:scale-95">
                      🐣
                    </div>
                    <span className="mt-1.5 text-[11px] font-black tracking-wide text-slate-900 truncate max-w-full drop-shadow">
                      Re-Hatch
                    </span>
                  </div>

                </div>

                {/* Beautiful helper bubble banner */}
                <div className="z-10 bg-slate-950/70 border border-white/10 p-2.5 rounded-2xl max-w-md mx-auto text-[11px] leading-relaxed text-slate-200 backdrop-blur-md">
                  💡 **Android Touch Instruction**: Tap the **DinoCare app icon** above to enter Roary`s play habitat, feed food, scoop poops, or apply accessories boutique items!
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* SCREEN APP 2: CORES DINOCARE SIMULATOR APP */}
            {/* ========================================================= */}
            {activeApp === 'pet' && (
              <div className="flex-1 flex flex-col justify-between bg-slate-905 overflow-x-hidden font-sans select-none relative animate-fade-in">
                
                {/* 1. APP TOP NAVIGATION HEADER */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 pt-1.5 px-4 bg-slate-900/60 backdrop-blur select-none">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={exitToLauncher}
                      className="p-1 px-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-300 flex items-center gap-0.5 cursor-pointer"
                    >
                      <ChevronLeft size={13} />
                      <span>Home</span>
                    </button>
                    <div>
                      <h2 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-1">
                        <span>{dino.stage === 'Egg' ? 'Prehistoric Nursery' : dino.name}</span>
                        {dino.species && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-black uppercase tracking-wider font-mono">
                            {dino.species}
                          </span>
                        )}
                      </h2>
                    </div>
                  </div>

                  {/* Coins Counter Badge */}
                  <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-550/25 px-2.5 py-1 rounded-xl text-yellow-400 font-extrabold text-[11.5px] font-mono">
                    <span>🪙</span>
                    <span>{dino.coins} GOLD</span>
                  </div>
                </div>

                {/* 2. MAIN SPLIT SCREEN: VIEWPORT + BOTTOM ACTION SHEETS Drawer */}
                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                  
                  {/* Top half: Interactive Playground Habitat viewport */}
                  <div
                    onClick={() => {
                      if (dino.stage === 'Egg') {
                        handleEggTap();
                      }
                    }}
                    className={`relative flex-1 min-h-[175px] max-h-[280px] bg-gradient-to-b ${activeScenery.bg} border-b-8 border-slate-950 overflow-hidden flex flex-col justify-between p-3 select-none ${
                      dino.stage === 'Egg' ? 'cursor-pointer' : ''
                    }`}
                  >
                    {/* Environmental Elements */}
                    <div className="absolute top-4 left-6 text-3xl animate-pulse">☁️</div>
                    <div className="absolute top-10 right-10 text-3xl opacity-60 animate-bounce" style={{ animationDuration: '6s' }}>☁️</div>
                    <div className={`absolute top-2 right-1/2 translate-x-1/2 w-10 h-10 rounded-full ${activeScenery.sun}`} />

                    {/* Sickness Medicines pill popup prompt */}
                    {dino.stage !== 'Egg' && dino.isSick && (
                      <div className="absolute top-2 left-2 z-10 max-w-[130px] p-2 bg-rose-950 border border-rose-600 rounded-xl space-y-1 shadow-md text-left">
                        <p className="text-[9px] text-rose-300 font-bold uppercase tracking-wider font-mono flex items-center gap-0.5 animate-pulse">
                          <ShieldAlert size={9} /> SICK COMPANION
                        </p>
                        <p className="text-[8px] text-slate-300 font-mono">Medicine treats sickness for 10 coins.</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); administerMedicine(); }}
                          className="w-full py-0.8 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[8.5px] rounded border border-rose-400 flex items-center justify-center gap-0.5 cursor-pointer shadow active:translate-y-0.2"
                        >
                          🧪 Cure Sickness
                        </button>
                      </div>
                    )}

                    {/* Evolution progress indicator badge */}
                    {dino.stage !== 'Egg' && (
                      <div className="absolute top-2 right-2 z-10 p-1.5 px-2 bg-slate-950/70 border border-white/5 rounded-xl text-left space-y-0.5 font-mono select-none pointer-events-none">
                        <div className="flex justify-between items-center text-[8.5px] font-bold text-indigo-400 uppercase tracking-widest leading-none gap-2">
                          <span>Evolution XP</span>
                          <span>{dino.careXP || 0}/100</span>
                        </div>
                        <div className="w-[100px] h-1.5 bg-slate-900 rounded-full overflow-hidden p-0.2 border border-white/5">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-pink-500"
                            style={{ width: `${dino.careXP || 0}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Centered Dinosaur Stage representation */}
                    <div className="flex-1 flex flex-col justify-center items-center relative z-10 pt-2 select-none pointer-events-none">
                      <DinoSprite
                        stage={dino.stage}
                        species={dino.species}
                        expression={currentExpression()}
                        color={dino.color}
                        activeAccessory={dino.activeAccessory}
                        eggTaps={dino.eggTaps}
                        className="animate-breathe drop-shadow-xl"
                      />

                      {/* Egg Instructions */}
                      {dino.stage === 'Egg' && (
                        <div className="bg-slate-950/80 p-1.5 rounded-xl border border-white/5 text-center mt-1 animate-pulse max-w-[170px] select-none pointer-events-none">
                          <p className="text-[10px] text-yellow-400 font-black font-mono">🥚 ANCIENT MYSTERY EGG</p>
                          <p className="text-[8.5px] text-slate-300 font-mono mt-0.5">
                            Tap egg {10 - dino.eggTaps} more times to build hatch warmth!
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Playground poops (Direct scoop overlay click) */}
                    {dino.stage !== 'Egg' &&
                      dino.poops.map((poop) => (
                        <button
                          key={poop.id}
                          onClick={(e) => handleClearPoopInstance(poop.id, e)}
                          className="absolute text-xl hover:scale-135 transition focus:outline-none select-none z-20 cursor-pointer text-center"
                          style={{ left: `${poop.x}%`, top: `${poop.y}%` }}
                          title="Click to Scoop!"
                        >
                          <div className="relative group">
                            <span>💩</span>
                            <span className="hidden group-hover:block absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] bg-slate-950 text-white px-1 py-0.2 rounded font-mono font-black border border-white/10">
                              SCOOP!
                            </span>
                          </div>
                        </button>
                      ))}

                    {/* Landscape Ground Floor terrain */}
                    <div className={`absolute bottom-0 inset-x-0 h-14 border-t-4 z-0 ${activeScenery.terrain}`}>
                      {/* Interactive click tips */}
                      <p className="absolute bottom-1 right-2 text-[8.5px] font-mono text-white/50 lowercase leading-none select-none pointer-events-none">
                        🌿 {activeScenery.name} playground
                      </p>
                    </div>
                  </div>

                  {/* Naming Phase Form Overlay */}
                  {namingPhase && (
                    <div className="absolute inset-0 bg-slate-950/95 z-40 flex items-center justify-center p-4">
                      <form
                        onSubmit={handleHatchConfirm}
                        className="w-full max-w-xs bg-slate-900 border-4 border-emerald-500 rounded-3xl p-5 text-center space-y-4 shadow-2xl"
                      >
                        <span className="text-5xl block animate-bounce">⚡🐣</span>
                        <div className="space-y-1">
                          <h3 className="text-sm font-black text-white uppercase tracking-wider font-sans">
                            A Hatchling is Born!
                          </h3>
                          <p className="text-[9.5px] text-slate-400 font-mono">
                            Give your unique reptile companion a custom name and select visual skin trait pigmentation!
                          </p>
                        </div>

                        {/* Name input */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-emerald-400 font-mono uppercase block text-left">
                            Companion Name:
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. RoaryRex"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            maxLength={14}
                            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs font-bold text-white focus:outline-none"
                            required
                          />
                        </div>

                        {/* Color Pigmentation chooser */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-emerald-400 font-mono uppercase block text-left">
                            Skin Pigmentation:
                          </label>
                          <div className="flex justify-between gap-1.5 select-none">
                            {(['emerald', 'cyan', 'rose', 'orange'] as const).map((col) => (
                              <button
                                key={col}
                                type="button"
                                onClick={() => setNewColor(col)}
                                className={`flex-1 py-1 px-1 rounded-xl text-[9px] font-black capitalize border-2 transition ${
                                  newColor === col
                                    ? 'bg-emerald-500 text-slate-950 border-white'
                                    : 'bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-850'
                                }`}
                              >
                                {col === 'emerald' ? '🟩 emr' : col === 'cyan' ? '🟦 cya' : col === 'rose' ? '🟥 ros' : '🟧 ora'}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:opacity-95 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-md"
                        >
                          🚀 Hatch Baby Raptor!
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Bottom half: Sub-app care interface */}
                  <div className="bg-slate-900 flex-1 flex flex-col justify-between overflow-hidden">
                    
                    {/* 3 Status summary meters strip */}
                    <div className="grid grid-cols-3 gap-1 bg-slate-950 p-2 border-b border-slate-800 select-none">
                      {/* Hunger meter */}
                      <div className="bg-slate-900 border border-slate-850 p-1.5 rounded-xl px-2">
                        <div className="flex justify-between items-center text-[10px] font-mono font-bold leading-none mb-1">
                          <span className="flex items-center gap-0.5 text-orange-400"><Utensils size={10} /> Hunger</span>
                          <span className="text-[9px] text-slate-400">{dino.hunger}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.2">
                          <div
                            className="h-full rounded-full bg-orange-400 transition-all duration-500"
                            style={{ width: `${dino.hunger}%` }}
                          />
                        </div>
                        <span className="block mt-0.5 text-[8.5px] font-black text-slate-500 text-left font-mono leading-none">
                          {dino.hunger < 25 ? 'Starving! 🥩' : dino.hunger > 75 ? 'Full 🍗' : 'Peckish 🍖'}
                        </span>
                      </div>

                      {/* Happiness meter */}
                      <div className="bg-slate-900 border border-slate-850 p-1.5 rounded-xl px-2">
                        <div className="flex justify-between items-center text-[10px] font-mono font-bold leading-none mb-1">
                          <span className="flex items-center gap-0.5 text-yellow-400"><Heart size={10} /> Happy</span>
                          <span className="text-[9px] text-slate-400">{dino.happiness}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.2">
                          <div
                            className="h-full rounded-full bg-yellow-400 transition-all duration-500"
                            style={{ width: `${dino.happiness}%` }}
                          />
                        </div>
                        <span className="block mt-0.5 text-[8.5px] font-black text-slate-500 text-left font-mono leading-none">
                          {dino.happiness < 25 ? 'Bored 🤖' : dino.happiness > 75 ? 'Ecstatic ❤️' : 'Cozy 🙂'}
                        </span>
                      </div>

                      {/* Hygiene meter */}
                      <div className="bg-slate-900 border border-slate-850 p-1.5 rounded-xl px-2">
                        <div className="flex justify-between items-center text-[10px] font-mono font-bold leading-none mb-1">
                          <span className="flex items-center gap-0.5 text-blue-400"><Droplets size={10} /> Hygiene</span>
                          <span className="text-[9px] text-slate-400">{dino.hygiene}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.2">
                          <div
                            className="h-full rounded-full bg-blue-400 transition-all duration-500"
                            style={{ width: `${dino.hygiene}%` }}
                          />
                        </div>
                        <span className="block mt-0.5 text-[8.5px] font-black text-slate-500 text-left font-mono leading-none">
                          {dino.hygiene < 30 ? 'Filthy! 😷' : dino.hygiene > 75 ? 'Spotless 🧼' : 'Fair 🚿'}
                        </span>
                      </div>
                    </div>

                    {/* Active Tab Subdrawer View */}
                    <div className="flex-1 overflow-y-auto px-4 py-2 text-left select-none relative min-h-[0] max-h-[160px]">
                      
                      {/* Tab 1: Feed kitchen bistro list */}
                      {activeTab === 'feed' && (
                        <div className="space-y-1.5 animate-fade-in pb-1.5">
                          <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                            <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest font-mono">Bistro Kitchen Selection</span>
                            <span className="text-[9.5px] text-slate-400 leading-none">Click raw dish to feed dino:</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {FOOD_ITEMS.map((food) => (
                              <button
                                key={food.id}
                                disabled={dino.coins < food.cost || dino.isSleeping || dino.health <= 0}
                                onClick={() => handleFeed(food)}
                                className={`p-1.5 rounded-xl border border-slate-800/80 bg-slate-950/80 hover:bg-slate-900 text-left flex justify-between items-center cursor-pointer transition select-none ${
                                  dino.coins < food.cost ? 'opacity-40 pointer-events-none' : ''
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">{food.emoji}</span>
                                  <div className="leading-tight">
                                    <p className="font-bold text-xs text-white">{food.name}</p>
                                    <p className="text-[9px] text-slate-400 font-mono">
                                      {food.hungerBoost > 0 ? `+${food.hungerBoost}🥩 ` : ''}
                                      {food.happinessBoost > 0 ? `+${food.happinessBoost}❤️ ` : ''}
                                      {food.hygieneImpact !== 0 ? `${food.hygieneImpact > 0 ? '+' : ''}${food.hygieneImpact}🧼 ` : ''}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-[10px] font-mono font-black text-amber-400">
                                  {food.cost === 0 ? 'FREE' : `${food.cost}🪙`}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tab 2: Groom spa screen triggers */}
                      {activeTab === 'groom' && (
                        <div className="absolute inset-0 bg-slate-950 z-20 overflow-hidden animate-fade-in h-full">
                          <GroomingView
                            dino={dino}
                            onGroomed={handleGroomFinish}
                            onClearPoops={handleClearPoops}
                            onClose={() => { SoundEffects.click(); setActiveTab('status'); }}
                          />
                        </div>
                      )}

                      {/* Tab 3: Detailed status recap diagnostic stats */}
                      {activeTab === 'status' && (
                        <div className="animate-fade-in space-y-2 pb-1.5 select-none">
                          <div className="border-b border-slate-800 pb-1.5 flex justify-between items-center">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest font-mono">DinoCare Health Registry</span>
                            <span className="text-[9px] text-slate-400 leading-none">Diagnostic medical records:</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-950 p-2 rounded-xl border border-slate-850">
                              <p className="text-[9px] font-black text-indigo-400 uppercase font-mono">Development Profile</p>
                              <p className="text-white text-xs font-bold font-mono mt-0.5">Stage: {dino.stage}</p>
                              <p className="text-slate-400 text-[8.5px] mt-0.5">Day Age: {dino.age} dino cycles</p>
                            </div>

                            <div className="bg-slate-950 p-2 rounded-xl border border-slate-850">
                              <p className="text-[9px] font-black text-emerald-400 uppercase font-mono">Nutrition Balance</p>
                              <p className="text-white text-[10.5px] font-bold font-mono mt-0.5">
                                Preference:{' '}
                                {dino.steakCount && dino.vegCount && dino.steakCount > dino.vegCount
                                  ? '🥩 Carnivorous'
                                  : dino.steakCount && dino.vegCount && dino.vegCount > dino.steakCount
                                  ? '🥦 Herbivorous'
                                  : '🍗 Omnivore'}
                              </p>
                              <p className="text-slate-400 text-[8.5px] mt-0.5">
                                Unlocked Items: {dino.accessories ? dino.accessories.length : 0} items
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Care control bottom interactive launch panel */}
                    <div className="bg-slate-950/90 border-t border-slate-800 p-2.5 flex justify-around items-center select-none gap-2">
                      {/* Button: Status */}
                      <button
                        onClick={() => { SoundEffects.click(); setActiveTab('status'); }}
                        className={`flex-1 py-1.5 px-1 rounded-xl text-[10px] font-black font-sans uppercase tracking-wider transition ${
                          activeTab === 'status' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        📊 Metrics
                      </button>

                      {/* Button: Feed */}
                      <button
                        disabled={dino.stage === 'Egg' || dino.health <= 0}
                        onClick={() => { SoundEffects.click(); setActiveTab('feed'); }}
                        className={`flex-1 py-1.5 px-1 rounded-xl text-[10px] font-black font-sans uppercase tracking-wider transition ${
                          activeTab === 'feed' ? 'bg-orange-500 text-slate-950 font-bold animate-pulse' : 'bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        🥩 Kitchen
                      </button>

                      {/* Button: Bath */}
                      <button
                        disabled={dino.stage === 'Egg' || dino.health <= 0}
                        onClick={() => { SoundEffects.click(); setActiveTab('groom'); }}
                        className={`flex-1 py-1.5 px-1 rounded-xl text-[10px] font-black font-sans uppercase tracking-wider transition ${
                          activeTab === 'groom' ? 'bg-blue-500 text-slate-950 font-bold' : 'bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        🧼 Groom
                      </button>

                      {/* Button: Nap */}
                      <button
                        disabled={dino.stage === 'Egg' || dino.health <= 0}
                        onClick={toggleLightSleep}
                        className={`flex-1 py-1.5 px-1 rounded-xl text-[10px] font-black font-sans uppercase tracking-wider transition ${
                          dino.isSleeping ? 'bg-indigo-500 text-white font-bold' : 'bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        {dino.isSleeping ? '☀️ Wake Up' : '🌙 Rest Lights'}
                      </button>
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* ========================================================= */}
            {/* SCREEN APP 3: PREHISTORIC ARCADE PLAY MENU PANEL */}
            {/* ========================================================= */}
            {activeApp === 'arcade' && (
              <div className="flex-1 flex flex-col justify-between bg-slate-950 overflow-hidden text-left animate-fade-in relative">
                
                {/* Embedded Game viewport iframe simulation */}
                {activeGame !== 'none' ? (
                  <div className="absolute inset-0 bg-slate-905 z-30 flex flex-col justify-between border-t border-slate-800 h-full">
                    {/* Game header wrapper bar */}
                    <div className="bg-slate-950 px-4 py-2 border-b border-slate-850 flex justify-between items-center">
                      <span className="text-[10px] text-yellow-400 font-black tracking-widest uppercase font-mono">
                        🕹️ Play Arcade Hub Active Session: {activeGame}
                      </span>
                      <button
                        onClick={() => { SoundEffects.click(); setActiveGame('none'); }}
                        className="bg-red-500/10 border border-red-550/20 text-red-400 hover:bg-red-500 hover:text-white px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer"
                      >
                        Quit Game
                      </button>
                    </div>

                    {/* Sub-Games loaders */}
                    <div className="flex-1 bg-black relative">
                      {activeGame === 'runner' ? (
                        <DinoRunnerGame
                          dino={dino}
                          onGameOver={handleEarnGameRewards}
                          onClose={() => { SoundEffects.click(); setActiveGame('none'); }}
                        />
                      ) : (
                        <FruitCatcherGame
                          dino={dino}
                          onGameOver={handleEarnGameRewards}
                          onClose={() => { SoundEffects.click(); setActiveGame('none'); }}
                        />
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Main App Page View */}
                <div className="p-4 sm:p-6 space-y-4 flex-1">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2 flex-wrap justify-between">
                    <div className="flex items-center gap-1.5">
                      <button onClick={exitToLauncher} className="p-1 px-1.5 bg-slate-800 rounded text-xs select-none font-bold text-slate-300">
                        ❮ Home
                      </button>
                      <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono">Prehistoric Arcade Center</h2>
                    </div>
                    <span className="text-[10px] font-mono bg-yellow-400/20 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded">
                      Play games to earn GOLD and make Roary Happy!
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 select-none pt-2">
                    {/* Game 1 card */}
                    <div
                      onClick={() => { SoundEffects.click(); setActiveGame('runner'); }}
                      className="p-4 bg-gradient-to-r from-amber-600/10 to-transparent border border-amber-500/30 hover:border-amber-400 hover:scale-[1.01] rounded-2xl flex flex-col justify-between items-start cursor-pointer transition h-32 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-3xl">🌵</span>
                        <div>
                          <p className="font-bold text-sm text-amber-300">Cactus Jumper</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                            Command companion to jump over prickly cacti hurdles with responsive timing controls!
                          </p>
                        </div>
                      </div>
                      <span className="text-[10.5px] font-black text-amber-400 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-lg align-bottom mt-2">
                        ▶ LAUNCH CACTUS RUNNER
                      </span>
                    </div>

                    {/* Game 2 card */}
                    <div
                      onClick={() => { SoundEffects.click(); setActiveGame('catcher'); }}
                      className="p-4 bg-gradient-to-r from-emerald-600/10 to-transparent border border-emerald-500/30 hover:border-emerald-400 hover:scale-[1.01] rounded-2xl flex flex-col justify-between items-start cursor-pointer transition h-32 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-3xl">🍎</span>
                        <div>
                          <p className="font-bold text-sm text-emerald-300">Fruit Catcher</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                            Tilt basket to catch falling apples and prehistoric steaks. Avoid falling gravel and bombs!
                          </p>
                        </div>
                      </div>
                      <span className="text-[10.5px] font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-lg align-bottom mt-2">
                        ▶ LAUNCH FRUIT CATCHER
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-850 p-3.5 rounded-2xl text-[11px] text-slate-400 font-mono space-y-1 mt-4">
                    <p className="font-bold text-slate-300 uppercase">🎮 ARCADE CABINET SERVICE STATISTICS:</p>
                    <p>• Gaming expends 10 energy points but compensates 8 care growth XP milestone units.</p>
                    <p>• Scoring targets directly pay bonus gold coin nuggets to help buy shop outfits.</p>
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================= */}
            {/* SCREEN APP 4: CODES COMPANION GUIDE BOOK */}
            {/* ========================================================= */}
            {activeApp === 'codex' && (
              <div className="flex-1 flex flex-col justify-between bg-slate-950 p-4 sm:p-5 overflow-y-auto text-left select-none animate-fade-in">
                
                {/* Header info */}
                <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2.5 flex-wrap justify-between">
                  <div className="flex items-center gap-1.5">
                    <button onClick={exitToLauncher} className="p-1 px-1.5 bg-slate-800 rounded text-xs select-none font-bold text-slate-300 cursor-pointer">
                      ❮ Home
                    </button>
                    <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono">DinoOS Prehistoric Codex</h2>
                  </div>
                  <span className="text-[9.5px] font-mono text-indigo-400 uppercase">Official Companion Encyclopedia</span>
                </div>

                {/* Guide stages contents */}
                <div className="space-y-3.5 select-none font-mono text-[11px] pt-3 flex-1 overflow-y-auto scrollbar-thin">
                  
                  {/* Current Dino status recap */}
                  <div className="bg-indigo-950/20 border-2 border-indigo-500/30 p-3.5 rounded-2xl space-y-1.5">
                    <p className="text-[10.5px] font-extrabold text-indigo-300 uppercase">🔮 Current Evolutionary Forecast:</p>
                    <p className="text-white text-xs font-black lowercase leading-normal">
                      🌿 Forecast: {getEvolutionForecast()}
                    </p>
                    <p className="text-[9.5px] text-slate-400 leading-normal">
                      Care XP accrues consistently when vital conditions (Hunger, Happy, Hygiene) stay above 50%. Below 20%, care XP decays. Keep them immaculate!
                    </p>
                  </div>

                  {/* Codex dictionary nodes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 border-l-4 border-yellow-500 flex flex-col space-y-0.5">
                      <span className="font-extrabold text-white text-xs">🥚 Stage 1: Ancient Mystery Egg</span>
                      <span className="text-slate-400 text-[10px]">Patience needed! Tapping hatches container into primary configurable skin colors.</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 border-l-4 border-cyan-500 flex flex-col space-y-0.5">
                      <span className="font-extrabold text-white text-xs">🍼 Stage 2: Hatchling Infant (Baby)</span>
                      <span className="text-slate-400 text-[10px]">Needs regular feeding spoon nutrition and dirt scrubbing bath therapy. Earns first skills.</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 border-l-4 border-emerald-500 flex flex-col space-y-0.5">
                      <span className="font-extrabold text-white text-xs">🦖 Stage 3: Juvenile Raptor (Teen)</span>
                      <span className="text-slate-400 text-[10px]">Tail expands with sharp yellow spines and head bobs actively. Food diet selects adult species branch.</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 border-l-4 border-indigo-500 flex flex-col space-y-0.5">
                      <span className="font-extrabold text-white text-xs">🐉 Stage 4: Ultimate Adult Form</span>
                      <span className="text-slate-400 text-[10px]">Branches: T-Rex (Steaks), Triceratops (Broccoli), Pterodactyl (Balanced), or Secret Dragon (3+ Wear Accessories purchased).</span>
                    </div>
                  </div>

                </div>

                <div className="text-[9.5px] font-mono text-slate-500 mt-2 text-center">
                  💡 Hint: Feed Roary steaks for T-Rex, fresh broccoli for Triceratops, or unlock 3+ boutique items for Secret Dragon species!
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* SCREEN APP 5: BAZAAR WEAR BOUTIQUE COMPONENT */}
            {/* ========================================================= */}
            {activeApp === 'boutique' && (
              <div className="flex-1 flex flex-col justify-between bg-slate-950 p-4 sm:p-5 overflow-hidden text-left select-none animate-fade-in relative">
                
                {/* Upper header */}
                <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 flex-wrap justify-between">
                  <div className="flex items-center gap-1.5">
                    <button onClick={exitToLauncher} className="p-1 px-1.5 bg-slate-800 rounded text-xs select-none font-bold text-slate-300">
                      ❮ Home
                    </button>
                    <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono">Bazaar Accessory Shop</h2>
                  </div>
                  <div className="flex items-center gap-1 font-black bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[11.5px] font-mono rounded text-yellow-400">
                    <span>🪙 {dino.coins} GOLD</span>
                  </div>
                </div>

                {/* Boutique Grid layout */}
                <div className="flex-1 overflow-y-auto pt-3.5 max-h-[220px] scrollbar-thin">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                    {SHOP_ACCESSORIES.map((item) => {
                      const isUnlocked = dino.accessories.includes(item.id);
                      const isWorn = dino.activeAccessory === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleBuyAccessory(item)}
                          className={`p-2 rounded-xl border bg-slate-900 border-slate-800 hover:border-slate-650 transition cursor-pointer flex flex-col justify-between items-center text-center relative ${
                            !isUnlocked && dino.coins < item.cost ? 'opacity-50' : ''
                          }`}
                        >
                          <span className="text-3xl my-1.5">{item.emoji}</span>
                          <div className="text-center leading-normal mb-1.5">
                            <p className="font-extrabold text-[11px] text-white line-clamp-1">{item.name}</p>
                            <p className="text-[9px] font-mono text-slate-400 capitalize">{item.category}</p>
                          </div>

                          {isUnlocked ? (
                            <span
                              className={`text-[9px] font-black w-full py-0.6 rounded-lg text-center tracking-wide font-mono ${
                                isWorn ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-850 text-slate-300'
                              }`}
                            >
                              {isWorn ? '✓ ACTIVE' : 'WEAR'}
                            </span>
                          ) : (
                            <span className="text-[9.5px] font-black w-full py-0.6 rounded-lg text-center tracking-wide font-mono bg-yellow-400/15 border border-yellow-500/30 text-yellow-400">
                              🪙 {item.cost}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-slate-900 text-slate-400 p-2.5 rounded-xl border border-slate-850 text-[10px] font-mono text-center mt-2.5">
                  🛡️ Stylist Guarantee: Accessories persist across subsequent reincarnation hatchings once unlocked! Equip them to change Roary`s visual look.
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* SCREEN APP 6: DIAGNOSTIC SYSTEM SETTINGS */}
            {/* ========================================================= */}
            {activeApp === 'settings' && (
              <div className="flex-1 flex flex-col justify-between bg-slate-950 p-4 sm:p-5 overflow-y-auto text-left select-none animate-fade-in">
                
                {/* Header title */}
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <button onClick={exitToLauncher} className="p-1 px-1.5 bg-slate-800 rounded text-xs select-none font-bold text-slate-300">
                      ❮ Home
                    </button>
                    <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono">DinoOS Custom Settings</h2>
                  </div>
                  <span className="text-[9px] bg-slate-800 px-2 rounded text-slate-400 font-mono">Kernel 5.4</span>
                </div>

                {/* Settings list scroll list */}
                <div className="space-y-3.5 pt-3 select-none font-mono text-[11px] flex-1">
                  
                  {/* Option 1: Scenery theme chooser */}
                  <div className="bg-slate-900 p-3 rounded-2xl border border-slate-850 space-y-2">
                    <p className="font-bold text-slate-300 uppercase text-[9.5px] flex items-center gap-1">
                      <span>🏞️</span> Wallpaper Scenery Habitat Profile:
                    </p>
                    <div className="flex flex-wrap gap-1.5 select-none">
                      {(['sunny', 'volcano', 'ice', 'midnight'] as const).map((sc) => (
                        <button
                          key={sc}
                          onClick={() => { SoundEffects.click(); setScenery(sc); }}
                          className={`px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold capitalize transition flex items-center gap-1 cursor-pointer ${
                            scenery === sc
                              ? 'bg-emerald-500 text-slate-950 font-black font-sans'
                              : 'bg-slate-950 text-slate-400 border border-slate-850 hover:text-white'
                          }`}
                        >
                          <span>{sc === 'sunny' ? '🌿' : sc === 'volcano' ? '🌋' : sc === 'ice' ? '❄️' : '🌌'}</span>
                          <span>{sc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Option 2: Simulation tick speed multipliers */}
                  <div className="bg-slate-900 p-3 rounded-2xl border border-slate-850 flex justify-between items-center gap-4">
                    <div>
                      <p className="font-bold text-slate-300 uppercase text-[9.5px]">📈 Companion Time Scale Multiplier:</p>
                      <p className="text-[9.5px] text-slate-500 mt-0.5">Accelerate game clock ticks to speed up depletion and evolution cycle metrics!</p>
                    </div>
                    <button
                      onClick={cycleGameSpeed}
                      className="px-3 py-2 bg-indigo-550 border border-indigo-400 hover:opacity-90 rounded-xl text-white font-extrabold text-xs cursor-pointer whitespace-nowrap active:translate-y-0.2"
                    >
                      {gameSpeed} Speed
                    </button>
                  </div>

                  {/* Settings quick notes diagnostic cards */}
                  <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-2xl text-[10.5px] text-rose-300 flex justify-between items-center gap-4">
                    <div>
                      <p className="font-extrabold uppercase">⚠️ Nursery Deep Wipe Reset:</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">Wipe device memory files and hatch a fresh new prehistoric mystery egg.</p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Irreversible Action: Wipe all saved local storage files and reset companion?')) {
                          handleResurrect();
                        }
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] rounded-xl border border-red-400"
                    >
                      Factory Reset
                    </button>
                  </div>

                </div>

              </div>
            )}

          </div>

          {/* ========================================================= */}
          {/* 🔘 ANDROID SCREEN BOTTOM NAVIGATION SYSTEM PILL BAR */}
          {/* ========================================================= */}
          <div className="bg-black/85 text-white h-10 px-8 flex items-center justify-between z-40 border-t border-white/5 absolute inset-x-0 bottom-0 select-none">
            {/* System Nav 1: Back Triangular Button */}
            <button
              onClick={handleNavBack}
              className="p-1 px-3 hover:bg-white/10 rounded-xl cursor-pointer text-slate-350 transition active:scale-90"
              title="Back"
            >
              <div className="w-0 h-0 border-t-6 border-t-transparent border-r-10 border-r-slate-300 border-b-6 border-b-transparent transform translate-x-[-2px]" />
            </button>

            {/* System Nav 2: Home Circular Pill Button */}
            <button
              onClick={exitToLauncher}
              className="p-1.5 px-4 bg-white/20 hover:bg-white/35 rounded-full border border-white/30 cursor-pointer text-white transition active:scale-90"
              title="Home Launcher"
            >
              <div className="w-3 h-3 bg-white rounded-full mx-auto" />
            </button>

            {/* System Nav 3: Recents Square Pill Button */}
            <button
              onClick={() => { SoundEffects.click(); setRecentAppsOverlay((prev) => !prev); }}
              className="p-1 px-3 hover:bg-white/10 rounded-xl cursor-pointer text-slate-350 transition active:scale-95"
              title="Recent Processes"
            >
              <div className="w-3.5 h-3.5 border-2 border-slate-300 rounded" />
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================= */}
      {/* 🔮 CELESTIAL EVOLUTION MILESTONE DIALOG POPUP */}
      {/* ========================================================= */}
      {evolutionModal && (
        <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="w-full max-w-sm bg-slate-900 border-4 border-yellow-400 p-5 md:p-6 rounded-[2.5rem] text-center space-y-4 shadow-2xl relative select-none">
            
            {/* Star symbols */}
            <div className="absolute inset-x-0 top-4 text-yellow-400 text-2xl font-bold flex justify-center gap-1.5 animate-pulse select-none">
              <span>★</span><span>★</span><span>★</span>
            </div>

            <span className="text-5xl block pt-2 animate-bounce">🧬 Evolution Alert!</span>

            <div className="space-y-1.5">
              <h2 className="text-lg font-black text-white uppercase tracking-tight">
                Your Dinosaur Evolved!
              </h2>
              <p className="text-slate-300 font-mono text-[11px] leading-relaxed">
                Roary has evolved from a small <span className="text-yellow-400 font-bold uppercase">{evolutionForm.from}</span> into a magníficas <span className="text-indigo-400 font-bold uppercase">{evolutionForm.to}</span> form!
              </p>
              {evolutionForm.species && (
                <div className="bg-gradient-to-r from-indigo-500 to-pink-500 text-white rounded-lg py-1 px-3 shadow font-black text-xs uppercase tracking-wider font-mono mt-2 animate-pulse inline-block">
                  🦕 UNLOCKED SPECIES: {evolutionForm.species}
                </div>
              )}
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left text-[10px] font-mono text-slate-400 space-y-1 leading-relaxed">
              <p className="font-bold text-slate-300 uppercase">📝 Companion Registry Update:</p>
              <p>• Max state indicators fortified. Accessory dress item boutiques initialized perfectly.</p>
              <p>• Feed carnivorous steaks or vegetables (broccoli) to shift offspring species branches!</p>
            </div>

            <button
              onClick={() => {
                SoundEffects.success();
                setEvolutionModal(false);
              }}
              className="w-full py-2.5 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 hover:opacity-95 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl cursor-pointer shadow-lg active:translate-y-0.5"
            >
              ⭐ Embrace Grown Species Form
            </button>
          </div>
        </div>
      )}

    </main>
  );
}
