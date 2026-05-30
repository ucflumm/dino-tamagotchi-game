import React, { useState, useEffect, useRef } from 'react';
import { DinoSprite } from './DinoSprite';
import { DinoState } from '../types';
import { SoundEffects } from '../utils/SoundEffects';

interface FruitCatcherGameProps {
  dino: DinoState;
  onFinishGame: (coinsEarned: number, happinessEarned: number) => void;
  onClose: () => void;
}

interface FallingItem {
  id: number;
  x: number; // percentage width (10% to 90%)
  y: number; // percentage height from top (0% to 100%)
  type: 'fruit1' | 'fruit2' | 'fruit3' | 'stone' | 'star';
  speed: number;
}

export const FruitCatcherGame: React.FC<FruitCatcherGameProps> = ({ dino, onFinishGame, onClose }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [coinsCollected, setCoinsCollected] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);

  // Grid lanes or dynamic X positioning (percentages)
  const [dinoX, setDinoX] = useState<number>(50); // Centered (10 to 90)

  // Game looping elements
  const requestRef = useRef<number | null>(null);
  const prevTimeRef = useRef<number | null>(null);

  // Floating active items
  const [items, setItems] = useState<FallingItem[]>([]);
  const nextItemId = useRef<number>(0);
  const spawnTimer = useRef<number>(0);

  // Key tracking
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        e.preventDefault();
        keysPressed.current[e.code] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        keysPressed.current[e.code] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const startGame = () => {
    SoundEffects.click();
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    setCoinsCollected(0);
    setLives(3);
    setDinoX(50);
    setItems([]);
    spawnTimer.current = 600;
    prevTimeRef.current = performance.now();
  };

  const updateGame = (time: number) => {
    if (!prevTimeRef.current) {
      prevTimeRef.current = time;
      requestRef.current = requestAnimationFrame(updateGame);
      return;
    }

    const deltaTime = time - prevTimeRef.current;
    prevTimeRef.current = time;

    if (isGameOver || !isPlaying) return;

    // 1. Process Dino Left/Right keypad movement
    setDinoX((prevX) => {
      let speedFactor = 0.6 * deltaTime;
      let nextX = prevX;
      if (keysPressed.current['ArrowLeft']) {
        nextX = Math.max(12, prevX - speedFactor);
      }
      if (keysPressed.current['ArrowRight']) {
        nextX = Math.min(88, prevX + speedFactor);
      }
      return nextX;
    });

    // 2. Obstacles/Fruit Spawning
    spawnTimer.current -= deltaTime;
    if (spawnTimer.current <= 0) {
      const types: ('fruit1' | 'fruit2' | 'fruit3' | 'stone' | 'star')[] = [
        'fruit1', 'fruit2', 'fruit3', 'stone', 'star',
      ];
      // Weighted index: more fruits/stars than stones
      const weight = [0, 0, 1, 1, 2, 2, 3, 4]; // 3 translates to stone, 4 to star
      const selIdx = weight[Math.floor(Math.random() * weight.length)];
      const randomType = types[selIdx];

      setItems((prev) => [
        ...prev,
        {
          id: nextItemId.current++,
          x: 10 + Math.random() * 80,
          y: -10, // top border
          type: randomType,
          speed: 0.18 + Math.random() * 0.18,
        },
      ]);
      spawnTimer.current = 500 + Math.random() * 800;
    }

    // Move falling items
    setItems((prev) => {
      return prev
        .map((item) => ({ ...item, y: item.y + item.speed * deltaTime }))
        .filter((item) => item.y < 110);
    });

    requestRef.current = requestAnimationFrame(updateGame);
  };

  useEffect(() => {
    if (isPlaying && !isGameOver) {
      requestRef.current = requestAnimationFrame(updateGame);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, isGameOver]);

  // Collisions detection
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const dinoBoxLeft = dinoX - 10;
    const dinoBoxRight = dinoX + 10;
    const bucketYMin = 85; // Close to bottom
    const bucketYMax = 95;

    setItems((prev) =>
      prev.filter((item) => {
        // Check overlap at the bottom line
        const collidesY = item.y >= bucketYMin && item.y <= bucketYMax;
        const collidesX = item.x >= dinoBoxLeft && item.x <= dinoBoxRight;

        if (collidesX && collidesY) {
          // Collected!
          if (item.type === 'stone') {
            SoundEffects.hurt();
            setLives((l) => {
              const nextL = l - 1;
              if (nextL <= 0) {
                setIsGameOver(true);
                setIsPlaying(false);
              }
              return nextL;
            });
          } else if (item.type === 'star') {
            SoundEffects.clean();
            setCoinsCollected((c) => c + 3);
            setScore((s) => s + 50);
          } else {
            // fruits
            SoundEffects.eat();
            setScore((s) => s + 20);
            if (Math.random() > 0.6) {
              setCoinsCollected((c) => c + 1);
            }
          }
          return false; // remove item
        }
        return true;
      })
    );
  }, [dinoX, items, isPlaying, isGameOver]);

  const handleFinish = () => {
    SoundEffects.click();
    const happinessGained = Math.min(35, 10 + Math.floor(score / 50));
    onFinishGame(coinsCollected, happinessGained);
  };

  const currentItemEmoji = (type: string) => {
    switch (type) {
      case 'fruit1': return '🍎';
      case 'fruit2': return '🍌';
      case 'fruit3': return '🍒';
      case 'star': return '⭐';
      case 'stone': return '🪨';
      default: return '🍎';
    }
  };

  return (
    <div className="absolute inset-0 bg-amber-50 rounded-xl overflow-hidden shadow-inner flex flex-col items-center justify-between p-4 border border-emerald-800 border-opacity-20 select-none">
      <div className="relative z-10 w-full flex justify-between items-center text-emerald-950 font-mono text-xs">
        <span className="font-bold flex items-center gap-1">🍎 Fruit Catcher</span>
        <button
          onClick={onClose}
          id="btn-close-catcher"
          className="px-2 py-0.5 rounded border border-emerald-950 bg-emerald-100 hover:bg-emerald-200 text-[10px] active:translate-y-0.5"
        >
          Quit
        </button>
      </div>

      {!isPlaying && !isGameOver ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-2 mt-2">
          <div className="w-20 h-20 animate-bounce">
            <DinoSprite
              stage={dino.stage}
              species={dino.species}
              expression="eat"
              color={dino.color}
              activeAccessory={dino.activeAccessory}
              eggTaps={0}
            />
          </div>
          <h3 className="font-sans font-bold text-lg text-emerald-900 mt-2">Fruit Basket</h3>
          <p className="font-mono text-[10px] text-emerald-800 leading-relaxed max-w-xs mt-1">
            Slide Left or Right to catch delicious apples, bananas, and stars. Avoid heavy falling rocks!
          </p>
          <button
            onClick={startGame}
            id="btn-start-catcher"
            className="mt-4 px-6 py-2 rounded-full border-2 border-emerald-900 bg-amber-500 hover:bg-amber-400 font-bold text-stone-900 text-sm shadow active:translate-y-0.5"
          >
            Start Game
          </button>
        </div>
      ) : isGameOver ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-2 max-w-sm">
          <div className="text-3xl mb-1">🤕🍓💥</div>
          <h2 className="font-sans font-bold text-red-600 text-xl tracking-tight">Game Over</h2>
          <div className="bg-amber-100 px-3 py-1.5 rounded-lg border border-yellow-800 border-opacity-20 my-3 font-mono text-xs text-emerald-950 text-left space-y-1">
            <p>Score: <span className="font-bold font-sans text-sm text-amber-700">{score}</span> points</p>
            <p>Coins Collected: <span className="font-bold">✨ {coinsCollected}</span></p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={startGame}
              id="btn-retry-catcher"
              className="px-4 py-2 rounded-md border-2 border-emerald-900 bg-amber-400 hover:bg-amber-300 font-bold text-stone-900 text-xs shadow active:translate-y-0.5"
            >
              Play Again
            </button>
            <button
              onClick={handleFinish}
              id="btn-claim-catcher"
              className="px-4 py-2 rounded-md border-2 border-emerald-900 bg-emerald-500 hover:bg-emerald-400 font-bold text-white text-xs shadow active:translate-y-0.5"
            >
              Claim Rewards
            </button>
          </div>
        </div>
      ) : (
        /* Active Game Area */
        <div className="flex-1 w-full bg-gradient-to-b from-emerald-100 to-amber-55 border-y-2 border-emerald-900 border-opacity-30 relative overflow-hidden my-2 cursor-pointer">
          {/* Header Indicators */}
          <div className="absolute top-2 left-2 right-2 flex justify-between font-mono text-[10px] text-emerald-950 font-bold bg-white bg-opacity-70 px-2 py-0.5 rounded shadow-sm z-10 pointer-events-none">
            <span>SCORE: {score}</span>
            <span className="text-rose-600">❤️❤️❤️ lives: {lives}</span>
            <span className="text-amber-600">✨ COINS: {coinsCollected}</span>
          </div>

          {/* Falling Items */}
          {items.map((item) => (
            <div
              key={item.id}
              className="absolute text-2xl transition-all duration-75 select-none text-center transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
              }}
            >
              {currentItemEmoji(item.type)}
            </div>
          ))}

          {/* Dino basket/head at Bottom */}
          <div
            className="absolute transition-all duration-75 select-none"
            style={{
              left: `${dinoX}%`,
              bottom: '1px',
              width: '60px',
              height: '60px',
              transform: 'translateX(-50%)',
            }}
          >
            <DinoSprite
              stage={dino.stage}
              species={dino.species}
              expression="idle"
              color={dino.color}
              activeAccessory={dino.activeAccessory}
              eggTaps={0}
            />
          </div>
        </div>
      )}

      {/* Touch slider control buttons */}
      {isPlaying && (
        <div className="w-full flex gap-4 mt-1">
          <button
            onMouseDown={() => { keysPressed.current['ArrowLeft'] = true; }}
            onMouseUp={() => { keysPressed.current['ArrowLeft'] = false; }}
            onMouseLeave={() => { keysPressed.current['ArrowLeft'] = false; }}
            onTouchStart={() => { keysPressed.current['ArrowLeft'] = true; }}
            onTouchEnd={() => { keysPressed.current['ArrowLeft'] = false; }}
            className="flex-1 py-3 text-center border-2 border-emerald-900 bg-amber-200 active:bg-amber-300 rounded-lg text-emerald-950 font-bold text-xs select-none shadow"
          >
            ◀ Move Left
          </button>
          <button
            onMouseDown={() => { keysPressed.current['ArrowRight'] = true; }}
            onMouseUp={() => { keysPressed.current['ArrowRight'] = false; }}
            onMouseLeave={() => { keysPressed.current['ArrowRight'] = false; }}
            onTouchStart={() => { keysPressed.current['ArrowRight'] = true; }}
            onTouchEnd={() => { keysPressed.current['ArrowRight'] = false; }}
            className="flex-1 py-3 text-center border-2 border-emerald-900 bg-amber-200 active:bg-amber-300 rounded-lg text-emerald-950 font-bold text-xs select-none shadow"
          >
            Move Right ▶
          </button>
        </div>
      )}
    </div>
  );
};
