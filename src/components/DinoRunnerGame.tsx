import React, { useState, useEffect, useRef } from 'react';
import { DinoSprite } from './DinoSprite';
import { DinoState } from '../types';
import { SoundEffects } from '../utils/SoundEffects';

interface DinoRunnerGameProps {
  dino: DinoState;
  onFinishGame: (coinsEarned: number, happinessEarned: number) => void;
  onClose: () => void;
}

interface Obstacle {
  id: number;
  x: number; // percentage from left (0 - 100)
  width: number;
  height: number;
  type: 'cactus' | 'cactus-double' | 'stone';
}

interface CoinItem {
  id: number;
  x: number;
  y: number; // height from bottom
  collected: boolean;
}

export const DinoRunnerGame: React.FC<DinoRunnerGameProps> = ({ dino, onFinishGame, onClose }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [coinsCollected, setCoinsCollected] = useState<number>(0);
  
  // Game loops
  const requestRef = useRef<number | null>(null);
  const prevTimeRef = useRef<number | null>(null);

  // Dino Physics
  const [dinoY, setDinoY] = useState<number>(0); // height from ground (0 - 100 max)
  const dinoVelocity = useRef<number>(0);
  const isJumping = useRef<boolean>(false);
  
  // Entities
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [coins, setCoins] = useState<CoinItem[]>([]);
  const nextObstacleId = useRef<number>(0);
  const nextCoinId = useRef<number>(0);

  // Speed multiplier
  const speed = useRef<number>(0.35); // width percent per millisecond * scale

  // Timers to spawn things
  const spawnTimer = useRef<number>(0);
  const coinSpawnTimer = useRef<number>(0);

  // Handler for jumping
  const triggerJump = () => {
    if (!isJumping.current && !isGameOver && isPlaying) {
      SoundEffects.jump();
      dinoVelocity.current = 1.3; // Starting upwards impulse
      isJumping.current = true;
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!isPlaying && !isGameOver) {
          startGame();
        } else if (isGameOver) {
          startGame();
        } else {
          triggerJump();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isGameOver]);

  const startGame = () => {
    SoundEffects.click();
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    setCoinsCollected(0);
    setDinoY(0);
    dinoVelocity.current = 0;
    isJumping.current = false;
    setObstacles([]);
    setCoins([]);
    speed.current = 0.35;
    spawnTimer.current = 1500; // spawn first obstacle in 1.5s
    coinSpawnTimer.current = 800;
    prevTimeRef.current = performance.now();
  };

  // Game Loop
  const updateGame = (time: number) => {
    if (!prevTimeRef.current) {
      prevTimeRef.current = time;
      requestRef.current = requestAnimationFrame(updateGame);
      return;
    }

    const deltaTime = time - prevTimeRef.current;
    prevTimeRef.current = time;

    if (isGameOver || !isPlaying) return;

    // 1. Update Dino height & gravity physics
    setDinoY((prevY) => {
      // Gravity acceleration reduction
      const gravity = 0.06;
      let nextVel = dinoVelocity.current - gravity * (deltaTime / 16.66);
      dinoVelocity.current = nextVel;
      let nextY = prevY + nextVel * (deltaTime / 16.66) * 5;

      if (nextY <= 0) {
        nextY = 0;
        dinoVelocity.current = 0;
        isJumping.current = false;
      }
      return nextY;
    });

    // Speed up slowly
    speed.current += 0.00002 * deltaTime;

    // 2. Spawn and update Obstacles
    spawnTimer.current -= deltaTime;
    if (spawnTimer.current <= 0) {
      const types: ('cactus' | 'cactus-double' | 'stone')[] = ['cactus', 'cactus-double', 'stone'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      setObstacles((prev) => [
        ...prev,
        {
          id: nextObstacleId.current++,
          x: 100, // Starts at outer edge
          width: randomType === 'cactus-double' ? 9 :randomType === 'cactus' ? 6 : 5,
          height: randomType === 'stone' ? 8 : randomType === 'cactus-double' ? 14 : 12,
          type: randomType,
        },
      ]);
      // Random gap between spawns (at least 1.2s to 3s)
      spawnTimer.current = 1100 + Math.random() * 1800;
    }

    // Move Obstacles
    setObstacles((prev) => {
      const step = speed.current * (deltaTime / 16.66);
      return prev
        .map((obs) => ({ ...obs, x: obs.x - step }))
        .filter((obs) => obs.x > -15); // keep slightly off screen
    });

    // 3. Spawn and update Coins
    coinSpawnTimer.current -= deltaTime;
    if (coinSpawnTimer.current <= 0) {
      setCoins((prev) => [
        ...prev,
        {
          id: nextCoinId.current++,
          x: 100,
          y: 20 + Math.random() * 45, // Floating coins
          collected: false,
        },
      ]);
      coinSpawnTimer.current = 800 + Math.random() * 1200;
    }

    // Move Coins
    setCoins((prev) => {
      const step = speed.current * (deltaTime / 16.66);
      return prev
        .map((coin) => ({ ...coin, x: coin.x - step }))
        .filter((coin) => coin.x > -15 && !coin.collected);
    });

    // Increase score based on time
    setScore((prev) => prev + Math.floor(deltaTime * 0.02));

    requestRef.current = requestAnimationFrame(updateGame);
  };

  // Start animation frame loop
  useEffect(() => {
    if (isPlaying && !isGameOver) {
      requestRef.current = requestAnimationFrame(updateGame);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, isGameOver]);

  // Collision detection
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    // Dino Bounding Box:
    // Dino sits at horizontal position X: 12% to 26% of screen width.
    // Dino bottom is dinoY, health height is approx 24%
    const dinoLeft = 12;
    const dinoRight = 24;
    const dinoBottom = dinoY;
    const dinoTop = dinoY + 24;

    // Check obstacle collisions
    obstacles.forEach((obs) => {
      const obsLeft = obs.x;
      const obsRight = obs.x + obs.width;
      const obsTop = obs.height; // obst sits on ground, so top height is obs.height
      const obsBottom = 0;

      // Check overlap
      const horizontalOverlap = obsLeft < dinoRight && obsRight > dinoLeft;
      const verticalOverlap = dinoBottom < obsTop && dinoTop > obsBottom;

      if (horizontalOverlap && verticalOverlap) {
        // COLLISION! GAME OVER
        SoundEffects.hurt();
        setIsGameOver(true);
        setIsPlaying(false);
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
      }
    });

    // Check Coin collections
    setCoins((prev) =>
      prev.map((coin) => {
        if (coin.collected) return coin;
        
        const coinLeft = coin.x;
        const coinRight = coin.x + 4;
        const coinBottom = coin.y;
        const coinTop = coin.y + 6;

        const horizontalOverlap = coinLeft < dinoRight && coinRight > dinoLeft;
        const verticalOverlap = dinoBottom < coinTop && dinoTop > coinBottom;

        if (horizontalOverlap && verticalOverlap) {
          SoundEffects.clean(); // cute coin sound
          setCoinsCollected((c) => c + 1);
          return { ...coin, collected: true };
        }
        return coin;
      })
    );
  }, [dinoY, obstacles, coins, isPlaying, isGameOver]);

  // Finish active game helper
  const handleExitGame = () => {
    SoundEffects.click();
    const finalCoins = coinsCollected + Math.floor(score / 150);
    const happinessEarned = Math.min(40, 10 + Math.floor(score / 200));
    onFinishGame(finalCoins, happinessEarned);
  };

  return (
    <div className="absolute inset-0 bg-amber-50 rounded-xl overflow-hidden shadow-inner flex flex-col items-center justify-between p-4 border border-emerald-800 border-opacity-20 select-none">
      {/* Title Header */}
      <div className="relative z-10 w-full flex justify-between items-center text-emerald-950 font-mono text-xs">
        <span className="font-bold flex items-center gap-1">🌵 Dino Runner</span>
        <button
          onClick={onClose}
          id="btn-close-runner"
          className="px-2 py-0.5 rounded border border-emerald-950 bg-emerald-100 hover:bg-emerald-200 text-[10px] active:translate-y-0.5"
        >
          Quit
        </button>
      </div>

      {!isPlaying && !isGameOver ? (
        /* Welcome/Start Screen */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-2 max-w-sm mt-2">
          <div className="w-20 h-20 animate-bounce" style={{ animationDuration: '2.5s' }}>
            <DinoSprite
              stage={dino.stage}
              species={dino.species}
              expression="idle"
              color={dino.color}
              activeAccessory={dino.activeAccessory}
              eggTaps={0}
            />
          </div>
          <h3 className="font-sans font-bold text-lg text-emerald-900 mt-2">Cactus Jumper</h3>
          <p className="font-mono text-[10px] text-emerald-800 leading-relaxed max-w-xs mt-1">
            Tap the <span className="font-bold">SPACEBAR</span>, click the screen, or tap <span className="font-bold bg-amber-200 px-1 py-0.5 rounded">JUMP</span> to dodge cacti and capture floaty stars. Keep your Dino happy!
          </p>
          <button
            onClick={startGame}
            id="btn-start-runner"
            className="mt-4 px-6 py-2 rounded-full border-2 border-emerald-900 bg-emerald-500 hover:bg-emerald-400 font-bold text-white text-sm shadow active:translate-y-0.5"
          >
            Start Game
          </button>
        </div>
      ) : isGameOver ? (
        /* Game Over Screen */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-2 max-w-sm">
          <div className="text-3xl mb-1">🦖💨🔥</div>
          <h2 className="font-sans font-bold text-red-600 text-xl tracking-tight">Ouch! Crashed!</h2>
          <div className="bg-amber-100 px-3 py-1.5 rounded-lg border border-yellow-800 border-opacity-20 my-3 font-mono text-xs text-emerald-950 text-left space-y-1">
            <p>Score: <span className="font-bold font-sans text-sm text-amber-700">{score}</span> points</p>
            <p>Coins Collected: <span className="font-bold">✨ {coinsCollected}</span></p>
            <p className="border-t border-yellow-800 border-opacity-10 pt-1 text-[11px] text-emerald-800 font-sans">
              Bonus: <span className="font-bold">+{Math.floor(score / 150)}</span> coins for high score!
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={startGame}
              id="btn-retry-runner"
              className="px-4 py-2 rounded-md border-2 border-emerald-900 bg-amber-400 hover:bg-amber-300 font-bold text-stone-900 text-xs shadow active:translate-y-0.5"
            >
              Play Again
            </button>
            <button
              onClick={handleExitGame}
              id="btn-claim-runner"
              className="px-4 py-2 rounded-md border-2 border-emerald-900 bg-emerald-500 hover:bg-emerald-400 font-bold text-white text-xs shadow active:translate-y-0.5"
            >
              Claim Rewards
            </button>
          </div>
        </div>
      ) : (
        /* Active Game Canvas Area */
        <div
          onClick={triggerJump}
          className="flex-1 w-full bg-gradient-to-b from-sky-100 to-amber-50 border-y-2 border-emerald-900 border-opacity-30 relative overflow-hidden my-2 cursor-pointer touch-none"
        >
          {/* Top Indicators */}
          <div className="absolute top-2 left-2 right-2 flex justify-between font-mono text-[10px] text-emerald-950 font-bold bg-white bg-opacity-60 px-2 py-0.5 rounded shadow-sm z-10 pointer-events-none">
            <span>SCORE: {score}</span>
            <span className="text-amber-600">✨ COINS: {coinsCollected}</span>
          </div>

          {/* Scrolling Sky Background Details */}
          <div className="absolute top-8 right-12 text-sm text-sky-400 opacity-60 animate-pulse">☁️</div>
          <div className="absolute top-16 left-16 text-xs text-sky-400 opacity-40 animate-pulse" style={{ animationDuration: '4s' }}>☁️</div>

          {/* Volcanic Backside decorations (retro lines) */}
          <div className="absolute bottom-6 right-[40%] text-2xl opacity-25">🌋</div>

          {/* DINO SPRITE WRAPPER */}
          <div
            className="absolute"
            style={{
              left: '12%',
              bottom: `${dinoY + 6}px`, // custom positioning
              width: '60px',
              height: '60px',
              transition: 'none', // absolute instant positioning
            }}
          >
            <DinoSprite
              stage={dino.stage}
              species={dino.species}
              expression={dinoY > 2 ? 'happy' : 'idle'}
              color={dino.color}
              activeAccessory={dino.activeAccessory}
              eggTaps={0}
            />
          </div>

          {/* OBSTACLES */}
          {obstacles.map((obs) => (
            <div
              key={obs.id}
              className="absolute flex items-end justify-center select-none"
              style={{
                left: `${obs.x}%`,
                bottom: '6px',
                width: `${obs.width}%`,
                height: `${obs.height * 2.8}px`, // scaled height
              }}
            >
              {obs.type === 'cactus' && (
                <div className="text-xl leading-none">🌵</div>
              )}
              {obs.type === 'cactus-double' && (
                <div className="text-xl leading-none tracking-tight">🌵🌵</div>
              )}
              {obs.type === 'stone' && (
                <div className="text-base leading-none">🪨</div>
              )}
            </div>
          ))}

          {/* WATER FLOAT / COINS */}
          {coins.map((coin) => (
            <div
              key={coin.id}
              className="absolute w-4 h-4 rounded-full bg-amber-400 border border-yellow-600 text-[10px] flex items-center justify-center text-stone-900 font-bold shadow-sm select-none"
              style={{
                left: `${coin.x}%`,
                bottom: `${coin.y}px`,
                display: coin.collected ? 'none' : 'flex',
                animation: 'pulse 1s infinite',
              }}
            >
              ★
            </div>
          ))}

          {/* Ground Dust lines */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-amber-200 border-t-2 border-emerald-950 pointer-events-none" />
          <div className="absolute bottom-1.5 left-0 right-0 h-1 bg-yellow-100 border-b border-yellow-300 pointer-events-none" />
        </div>
      )}

      {isPlaying && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            triggerJump();
          }}
          className="w-full py-4 text-center border-2 border-emerald-900 bg-emerald-500 active:bg-emerald-600 active:translate-y-0.5 rounded-lg text-white font-bold text-xs tracking-wider uppercase font-mono shadow"
        >
          🦖 Tab to JUMP 🦖
        </button>
      )}
    </div>
  );
};
