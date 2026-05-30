import React from 'react';
import { EvolutionStage, DinoSpecies } from '../types';

interface DinoSpriteProps {
  stage: EvolutionStage;
  species: DinoSpecies | null;
  expression: 'idle' | 'happy' | 'blink' | 'eat' | 'sad' | 'sick' | 'sleep';
  color: string; // Tailwind color name like 'emerald', 'cyan', 'rose', 'orange'
  activeAccessory: string | null;
  eggTaps: number;
  className?: string;
}

export const DinoSprite: React.FC<DinoSpriteProps> = ({
  stage,
  species,
  expression,
  color,
  activeAccessory,
  eggTaps,
  className = '',
}) => {
  // Resolve base hex codes for colors
  const getColorHex = (c: string, shade = 'main'): string => {
    const palette: Record<string, { main: string; dark: string; light: string }> = {
      emerald: { main: '#10b981', dark: '#047857', light: '#a7f3d0' },
      cyan: { main: '#06b6d4', dark: '#0e7490', light: '#cffafe' },
      rose: { main: '#f43f5e', dark: '#be123c', light: '#fecdd3' },
      orange: { main: '#f97316', dark: '#c2410c', light: '#ffedd5' },
    };
    const sel = palette[c] || palette.emerald;
    return shade === 'dark' ? sel.dark : shade === 'light' ? sel.light : sel.main;
  };

  const primaryColor = getColorHex(color, 'main');
  const darkColor = getColorHex(color, 'dark');
  const lightColor = getColorHex(color, 'light');

  // SVG dimensions: 200 x 200
  return (
    <div className={`relative flex items-center justify-center w-full h-full max-w-[200px] max-h-[200px] select-none ${className}`}>
      {/* Soundwave/Sleep indicators or sparkles */}
      {expression === 'sleep' && (
        <div className="absolute top-2 right-4 text-sky-500 font-bold text-xs animate-pulse select-none" style={{ animationDuration: '2s' }}>
          <span className="block text-sm animate-bounce" style={{ animationDelay: '0s' }}>Z</span>
          <span className="block text-xs animate-bounce" style={{ animationDelay: '0.4s' }}>z</span>
          <span className="block text-[10px] animate-bounce" style={{ animationDelay: '0.8s' }}>z</span>
        </div>
      )}

      {expression === 'sick' && (
        <div className="absolute top-2 left-6 text-purple-400 text-xs animate-pulse font-mono flex gap-1">
          <span>🤢</span>
          <span className="animate-ping">✨</span>
        </div>
      )}

      {expression === 'happy' && (
        <div className="absolute -top-1 right-2 text-rose-500 text-sm animate-ping">
          ❤️
        </div>
      )}

      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <style>
          {`
            @keyframes idle-breathe {
              0%, 100% { transform: translateY(0px) scaleY(1); }
              50% { transform: translateY(2px) scaleY(0.97); }
            }
            @keyframes head-bob {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(1.5px); }
            }
            @keyframes wing-flap {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(-10deg); }
            }
            @keyframes tail-wag {
              0%, 100% { transform: rotate(-3deg); }
              50% { transform: rotate(5deg); }
            }
            @keyframes egg-shake {
              0%, 100% { transform: rotate(0deg); }
              20% { transform: rotate(-3deg); }
              40% { transform: rotate(4deg); }
              60% { transform: rotate(-4deg); }
              80% { transform: rotate(3deg); }
            }
            .egg-group {
              transform-origin: 100px 140px;
              animation: egg-shake 2.5s infinite ease-in-out;
            }
            .dino-group {
              transform-origin: 100px 150px;
              animation: idle-breathe 2s infinite ease-in-out;
            }
            .dino-head {
              transform-origin: 100px 90px;
              animation: head-bob 2s infinite ease-in-out;
            }
            .dino-wing-left {
              transform-origin: 75px 115px;
              animation: wing-flap 0.8s infinite ease-in-out;
            }
            .dino-wing-right {
              transform-origin: 125px 115px;
              animation: wing-flap 0.8s infinite ease-in-out;
            }
            .dino-tail {
              transform-origin: 65px 130px;
              animation: tail-wag 1.5s infinite ease-in-out;
            }
          `}
        </style>

        {/* -------------------- EGG STAGE -------------------- */}
        {stage === 'Egg' && (
          <g className="egg-group" id="egg">
            {/* Egg Shadow */}
            <ellipse cx="100" cy="155" rx="35" ry="8" fill="#000" fillOpacity="0.12" />
            
            {/* Main Egg */}
            <path
              d="M100 50 C65 50 60 135 60 150 C60 158 78 158 100 158 C122 158 140 158 140 150 C140 135 135 50 100 50 Z"
              fill="#fef08a" // Yellow pastel egg background
              stroke="#ca8a04"
              strokeWidth="4"
            />

            {/* Egg Spots */}
            <circle cx="85" cy="90" r="8" fill="#ca8a04" fillOpacity="0.15" />
            <circle cx="115" cy="115" r="10" fill="#ca8a04" fillOpacity="0.15" />
            <circle cx="82" cy="130" r="5" fill="#ca8a04" fillOpacity="0.15" />

            {/* Cracks matching the progress */}
            {eggTaps > 1 && (
              <path
                d="M100 50 L102 70 L95 85 L105 100"
                stroke="#854d0e"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {eggTaps > 4 && (
              <path
                d="M100 150 L92 130 L110 115 L102 96"
                stroke="#854d0e"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {eggTaps > 7 && (
              <path
                d="M65 110 L85 112 L75 125"
                stroke="#854d0e"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Sparkles during tapping */}
            {eggTaps > 0 && eggTaps < 10 && (
              <g className="animate-ping" style={{ transformOrigin: '100px 100px', animationDuration: '1.5s' }}>
                <path d="M100 30 L100 35 M64 64 L68 68 M136 64 L132 68" stroke="#ca8a04" strokeWidth="3" strokeLinecap="round" />
              </g>
            )}
          </g>
        )}

        {/* -------------------- BABY STAGE -------------------- */}
        {stage === 'Baby' && (
          <g className="dino-group" id="baby">
            {/* Shadow */}
            <ellipse cx="100" cy="165" rx="36" ry="7" fill="#000" fillOpacity="0.12" />

            {/* Baby Body */}
            <circle cx="100" cy="125" r="32" fill={primaryColor} stroke={darkColor} strokeWidth="4" />
            <ellipse cx="100" cy="128" rx="20" ry="16" fill={lightColor} fillOpacity="0.8" />

            {/* Cheeks */}
            <ellipse cx="80" cy="125" rx="6" ry="4" fill="#fda4af" />
            <ellipse cx="120" cy="125" rx="6" ry="4" fill="#fda4af" />

            {/* Tiny dinosaur feet */}
            <circle cx="82" cy="156" r="7" fill={darkColor} />
            <circle cx="118" cy="156" r="7" fill={darkColor} />

            {/* Tiny nubs of horns */}
            <path d="M88 95 L92 88 L98 94 Z" fill="#ffffff" stroke={darkColor} strokeWidth="2.5" />
            <path d="M112 95 L108 88 L102 94 Z" fill="#ffffff" stroke={darkColor} strokeWidth="2.5" />

            {/* Face Expressions */}
            {expression === 'sleep' && (
              <g>
                <path d="M82 120 Q88 126 94 120" stroke={darkColor} strokeWidth="3.5" strokeLinecap="round" fill="none" />
                <path d="M106 120 Q112 126 118 120" stroke={darkColor} strokeWidth="3.5" strokeLinecap="round" fill="none" />
                <ellipse cx="100" cy="132" rx="4" ry="2" fill="#be123c" fillOpacity="0.6" />
              </g>
            )}

            {expression === 'blink' && (
              <g>
                <line x1="80" y1="120" x2="94" y2="120" stroke={darkColor} strokeWidth="3.5" strokeLinecap="round" />
                <line x1="106" y1="120" x2="120" y2="120" stroke={darkColor} strokeWidth="3.5" strokeLinecap="round" />
              </g>
            )}

            {expression === 'sad' && (
              <g>
                <path d="M82 124 Q88 116 94 124" stroke={darkColor} strokeWidth="3.5" strokeLinecap="round" fill="none" />
                <path d="M106 124 Q112 116 118 124" stroke={darkColor} strokeWidth="3.5" strokeLinecap="round" fill="none" />
                <path d="M95 136 Q100 130 105 136" stroke={darkColor} strokeWidth="3" strokeLinecap="round" fill="none" />
                {/* Sad Tear */}
                <circle cx="76" cy="134" r="3" fill="#38bdf8" />
              </g>
            )}

            {expression === 'sick' && (
              <g>
                {/* Spiral eyes */}
                <path d="M80 118 A5 5 0 1 1 90 122" stroke="#84cc16" strokeWidth="3.5" fill="none" />
                <path d="M110 118 A5 5 0 1 1 120 122" stroke="#84cc16" strokeWidth="3.5" fill="none" />
                <path d="M94 135 H106" stroke={darkColor} strokeWidth="3.5" strokeLinecap="round" />
              </g>
            )}

            {expression === 'eat' && (
              <g>
                {/* Happy closed eyes */}
                <path d="M80 122 Q87 114 94 122" stroke={darkColor} strokeWidth="3.5" strokeLinecap="round" fill="none" />
                <path d="M106 122 Q113 114 120 122" stroke={darkColor} strokeWidth="3.5" strokeLinecap="round" fill="none" />
                {/* Big chewing circle mouth */}
                <circle cx="100" cy="135" r="6" fill="#be123c" />
              </g>
            )}

            {(expression === 'idle' || expression === 'happy') && (
              <g>
                {/* Big cute open anime eyes */}
                <circle cx="87" cy="118" r="6" fill="#1e293b" />
                <circle cx="113" cy="118" r="6" fill="#1e293b" />
                <circle cx="85" cy="116" r="2.5" fill="#ffffff" />
                <circle cx="111" cy="116" r="2.5" fill="#ffffff" />
                {/* Cute smile */}
                <path d="M96 130 Q100 135 104 130" stroke={darkColor} strokeWidth="3.5" strokeLinecap="round" fill="none" />
              </g>
            )}

            {/* Accessory position indicators for Baby head (Hat index: cx=100, cy=94, Glasses: cx=100, cy=118) */}
            {renderAccessory(activeAccessory, 100, 93, 100, 118, 0.7)}
          </g>
        )}

        {/* -------------------- TEEN STAGE -------------------- */}
        {stage === 'Teen' && (
          <g className="dino-group" id="teen">
            {/* Shadow */}
            <ellipse cx="100" cy="165" rx="45" ry="8" fill="#000" fillOpacity="0.12" />

            {/* Tail */}
            <path className="dino-tail" d="M65 130 C30 140 25 110 20 125 C15 140 40 156 65 142 Z" fill={primaryColor} stroke={darkColor} strokeWidth="4" />
            
            {/* Spikes on Tail */}
            <path d="M22 122 L17 114 L28 121 Z" fill="#eab308" stroke={darkColor} strokeWidth="2" />
            <path d="M35 128 L30 119 L40 127 Z" fill="#eab308" stroke={darkColor} strokeWidth="2" />

            {/* Body */}
            <path
              d="M60 145 C60 110 80 100 100 100 C120 100 140 110 140 145 C140 160 120 160 100 160 C80 160 60 160 60 145 Z"
              fill={primaryColor}
              stroke={darkColor}
              strokeWidth="4"
            />
            
            {/* Belly patch */}
            <path
              d="M75 145 C75 125 85 115 100 115 C115 115 125 125 125 145 C125 155 115 156 100 156 C85 156 75 155 75 145 Z"
              fill={lightColor}
            />

            {/* Head group with bobbable scale */}
            <g className="dino-head">
              {/* Rounded Head */}
              <circle cx="100" cy="80" r="28" fill={primaryColor} stroke={darkColor} strokeWidth="4" />
              
              {/* Spine Spikes */}
              <path d="M100 52 L100 44 L107 51 Z" fill="#eab308" stroke={darkColor} strokeWidth="2.5" />
              <path d="M118 60 L124 53 L122 62 Z" fill="#eab308" stroke={darkColor} strokeWidth="2.5" />
              
              {/* Cheeks */}
              <ellipse cx="82" cy="85" rx="5" ry="3" fill="#fda4af" />
              <ellipse cx="118" cy="85" rx="5" ry="3" fill="#fda4af" />

              {/* Eyes and mouth expressions for Teen */}
              {expression === 'sleep' && (
                <g>
                  <path d="M82 80 M84 76 Q90 82 96 76" stroke={darkColor} strokeWidth="3.5" strokeLinecap="round" fill="none" />
                  <path d="M104 76 Q110 82 116 76" stroke={darkColor} strokeWidth="3.5" strokeLinecap="round" fill="none" />
                  <path d="M96 90 Q100 86 104 90" stroke={darkColor} strokeWidth="3" strokeLinecap="round" fill="none" />
                </g>
              )}

              {expression === 'blink' && (
                <g>
                  <line x1="84" y1="78" x2="96" y2="78" stroke={darkColor} strokeWidth="3.5" strokeLinecap="round" />
                  <line x1="104" y1="78" x2="116" y2="78" stroke={darkColor} strokeWidth="3.5" strokeLinecap="round" />
                </g>
              )}

              {expression === 'sad' && (
                <g>
                  <path d="M84 82 Q90 74 96 82" stroke={darkColor} strokeWidth="3.5" strokeLinecap="round" fill="none" />
                  <path d="M104 82 Q110 74 116 82" stroke={darkColor} strokeWidth="3.5" strokeLinecap="round" fill="none" />
                  <path d="M94 92 Q100 86 106 92" stroke={darkColor} strokeWidth="3.5" strokeLinecap="round" fill="none" />
                  <circle cx="78" cy="88" r="3.5" fill="#38bdf8" />
                </g>
              )}

              {expression === 'sick' && (
                <g>
                  <path d="M84 78 A4 4 0 1 1 94 82" stroke="#84cc16" strokeWidth="3" fill="none" />
                  <path d="M106 78 A4 4 0 1 1 116 82" stroke="#84cc16" strokeWidth="3" fill="none" />
                  <line x1="92" y1="91" x2="108" y2="91" stroke={darkColor} strokeWidth="3" strokeLinecap="round" />
                </g>
              )}

              {expression === 'eat' && (
                <g>
                  <path d="M84 80 Q90 73 96 80" stroke={darkColor} strokeWidth="3.5" strokeLinecap="round" fill="none" />
                  <path d="M104 80 Q110 73 116 80" stroke={darkColor} strokeWidth="3.5" strokeLinecap="round" fill="none" />
                  <ellipse cx="100" cy="91" rx="6" ry="5" fill="#be123c" />
                </g>
              )}

              {(expression === 'idle' || expression === 'happy') && (
                <g>
                  <circle cx="90" cy="77" r="5" fill="#1e293b" />
                  <circle cx="110" cy="77" r="5" fill="#1e293b" />
                  <circle cx="88" cy="75" r="2" fill="#ffffff" />
                  <circle cx="108" cy="75" r="2" fill="#ffffff" />
                  <path d="M94 88 Q100 94 106 88" stroke={darkColor} strokeWidth="3.5" strokeLinecap="round" fill="none" />
                </g>
              )}

              {/* Accessories relative to Teen head inside dino-head group. Hat @ cx=100 cy=54, Glasses @ cx=100 cy=80 */}
              {renderAccessory(activeAccessory, 100, 52, 100, 77, 0.85)}
            </g>

            {/* Teen Stubby Arms */}
            <path d="M72 120 Q62 125 70 135" stroke={darkColor} strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M128 120 Q138 125 130 135" stroke={darkColor} strokeWidth="4.5" strokeLinecap="round" fill="none" />

            {/* Teen Feet */}
            <rect x="76" y="156" width="12" height="10" rx="4" fill={darkColor} />
            <rect x="112" y="156" width="12" height="10" rx="4" fill={darkColor} />
          </g>
        )}

        {/* -------------------- ADULT STAGE -------------------- */}
        {stage === 'Adult' && (
          <g className="dino-group" id="adult">
            {/* Adult Shadow */}
            <ellipse cx="100" cy="170" rx="55" ry="9" fill="#000" fillOpacity="0.12" />

            {/* Adult Sub-Species Specific Graphics */}
            {species === 'Pterodactyl' && (
              <g id="pterodactyl-wings">
                {/* Large Wing flap animation */}
                <path className="dino-wing-left" d="M60 110 C20 90 10 130 45 140 Z" fill={darkColor} stroke={darkColor} strokeWidth="2.5" />
                <path className="dino-wing-right" d="M140 110 C180 90 190 130 155 140 Z" fill={darkColor} stroke={darkColor} strokeWidth="2.5" />
              </g>
            )}

            {species === 'Secret Dragon' && (
              <g id="dragon-wings-and-tail">
                {/* Back Wings */}
                <path className="dino-wing-left" d="M60 105 C35 75 30 110 50 120 Z" fill="#475569" stroke="#1e293b" strokeWidth="2.5" />
                <path className="dino-wing-right" d="M140 105 C165 75 170 110 150 120 Z" fill="#475569" stroke="#1e293b" strokeWidth="2.5" />
                
                {/* Long Dragon Tail */}
                <path className="dino-tail" d="M60 140 C20 180 15 120 10 150 C5 170 30 178 60 152 Z" fill={primaryColor} stroke={darkColor} strokeWidth="4" />
                {/* Spiky Dragon Tail End */}
                <path d="M12 143 L4 135 L6 151 Z" fill="#ef4444" stroke={darkColor} strokeWidth="2" />
              </g>
            )}

            {species === 'T-Rex' && (
              <g id="trex-tail">
                {/* Massive Thick Tail */}
                <path className="dino-tail" d="M60 135 C20 125 15 150 18 160 C30 167 55 155 60 148 Z" fill={primaryColor} stroke={darkColor} strokeWidth="4" />
                <path d="M22 135 L12 130 L20 142 Z" fill="#eab308" />
                <path d="M35 142 L26 137 L30 148 Z" fill="#eab308" />
              </g>
            )}

            {species === 'Triceratops' && (
              <g id="triceratops-tail">
                {/* Stubby Heavy Tail */}
                <path className="dino-tail" d="M65 142 C35 150 25 135 20 145 C22 155 45 160 65 151 Z" fill={primaryColor} stroke={darkColor} strokeWidth="4.5" />
              </g>
            )}

            {/* Central Heavy Body */}
            <path
              d="M55 145 C55 105 75 95 100 95 C125 95 145 105 145 145 C145 165 125 165 100 165 C75 165 55 165 55 145 Z"
              fill={primaryColor}
              stroke={darkColor}
              strokeWidth="4"
            />
            {/* Belly patch */}
            <path
              d="M72 145 C72 122 82 110 100 110 C118 110 128 122 128 145 C128 160 118 161 100 161 C82 161 72 160 72 145 Z"
              fill={lightColor}
            />

            {/* Species-Specific Adult Face shield/details BEFORE Head overlay */}
            {species === 'Triceratops' && (
              <g id="triceratops-shield">
                {/* Frill rim back of head */}
                <path d="M54 75 Q100 30 146 75 Z" fill={darkColor} stroke={darkColor} strokeWidth="3" />
                <circle cx="68" cy="52" r="5" fill="#facc15" stroke={darkColor} strokeWidth="2" />
                <circle cx="100" cy="38" r="5" fill="#facc15" stroke={darkColor} strokeWidth="2" />
                <circle cx="132" cy="52" r="5" fill="#facc15" stroke={darkColor} strokeWidth="2" />
              </g>
            )}

            {/* ADULT HEAD */}
            <g className="dino-head">
              <circle cx="100" cy="74" r="32" fill={primaryColor} stroke={darkColor} strokeWidth="4" />

              {/* Sub-Species Specific Head Accents (Horns / Beaks / Spikes) */}
              {species === 'T-Rex' && (
                <g id="trex-teeth-spikes">
                  {/* Spikes on head top */}
                  <path d="M100 42 L100 32 L108 42 Z" fill="#eab308" stroke={darkColor} strokeWidth="2.5" />
                  <path d="M116 50 L123 41 L121 51 Z" fill="#eab308" stroke={darkColor} strokeWidth="2.5" />
                  {/* Sharp teeth overlay if eating */}
                  {expression === 'eat' && (
                    <g fill="#ffffff">
                      <path d="M85 91 L88 96 L91 91 Z" />
                      <path d="M109 91 L112 96 L115 91 Z" />
                    </g>
                  )}
                </g>
              )}

              {species === 'Triceratops' && (
                <g id="triceratops-horns">
                  {/* Three white horns: 2 brow horns, 1 nose horn */}
                  <path d="M80 64 L60 52 L76 68 Z" fill="#ffffff" stroke={darkColor} strokeWidth="2.5" />
                  <path d="M120 64 L140 52 L124 68 Z" fill="#ffffff" stroke={darkColor} strokeWidth="2.5" />
                  <path d="M100 84 L100 94 L104 88 Z" fill="#ffffff" stroke={darkColor} strokeWidth="2.5" />
                </g>
              )}

              {species === 'Pterodactyl' && (
                <g id="pterodactyl-crest">
                  {/* Back head crest pointy */}
                  <path d="M80 50 L56 36 L72 60 Z" fill={primaryColor} stroke={darkColor} strokeWidth="3" />
                  {/* Long orange beak */}
                  <path d="M100 80 Q100 102 108 104 Q92 102 100 80" fill="#f97316" stroke={darkColor} strokeWidth="2.5" />
                </g>
              )}

              {species === 'Secret Dragon' && (
                <g id="dragon-horns-sparks">
                  {/* Dark demon curved horns */}
                  <path d="M82 50 C68 28 65 38 52 46 C60 48 76 52 76 52 Z" fill="#1e293b" stroke={darkColor} strokeWidth="2.5" />
                  <path d="M118 50 C132 28 135 38 148 46 C140 48 124 52 124 52 Z" fill="#1e293b" stroke={darkColor} strokeWidth="2.5" />
                </g>
              )}

              {/* Eyes and mouth expressions for Adults */}
              {expression === 'sleep' && (
                <g>
                  <path d="M80 72 Q88 78 96 72" stroke={darkColor} strokeWidth="4" strokeLinecap="round" fill="none" />
                  <path d="M104 72 Q112 78 120 72" stroke={darkColor} strokeWidth="4" strokeLinecap="round" fill="none" />
                  <path d="M94 88 Q100 84 106 88" stroke={darkColor} strokeWidth="3" strokeLinecap="round" fill="none" />
                </g>
              )}

              {expression === 'blink' && (
                <g>
                  <line x1="80" y1="74" x2="96" y2="74" stroke={darkColor} strokeWidth="4" strokeLinecap="round" />
                  <line x1="104" y1="74" x2="120" y2="74" stroke={darkColor} strokeWidth="4" strokeLinecap="round" />
                </g>
              )}

              {expression === 'sad' && (
                <g>
                  <path d="M80 78 Q88 68 96 78" stroke={darkColor} strokeWidth="4" strokeLinecap="round" fill="none" />
                  <path d="M104 78 Q112 68 120 78" stroke={darkColor} strokeWidth="4" strokeLinecap="round" fill="none" />
                  <path d="M92 90 Q100 84 108 90" stroke={darkColor} strokeWidth="4" strokeLinecap="round" fill="none" />
                  <circle cx="74" cy="84" r="4" fill="#0ea5e9" />
                </g>
              )}

              {expression === 'sick' && (
                <g>
                  <path d="M82 72 A4.5 4.5 0 1 1 92 76" stroke="#84cc16" strokeWidth="3.5" fill="none" />
                  <path d="M108 72 A4.5 4.5 0 1 1 118 76" stroke="#84cc16" strokeWidth="3.5" fill="none" />
                  <line x1="90" y1="88" x2="110" y2="88" stroke={darkColor} strokeWidth="4" strokeLinecap="round" />
                </g>
              )}

              {expression === 'eat' && (
                <g>
                  <path d="M80 74 Q88 66 96 74" stroke={darkColor} strokeWidth="4" strokeLinecap="round" fill="none" />
                  <path d="M104 74 Q112 66 120 74" stroke={darkColor} strokeWidth="4" strokeLinecap="round" fill="none" />
                  <ellipse cx="100" cy="88" rx="8" ry="7" fill="#be123c" />
                </g>
              )}

              {(expression === 'idle' || expression === 'happy') && (
                <g>
                  {/* Real adult eyes focus */}
                  <circle cx="88" cy="73" r="6.5" fill="#1e293b" />
                  <circle cx="112" cy="73" r="6.5" fill="#1e293b" />
                  <circle cx="86" cy="70" r="2.5" fill="#ffffff" />
                  <circle cx="110" cy="70" r="2.5" fill="#ffffff" />
                  <path d="M92 86 Q100 93 108 86" stroke={darkColor} strokeWidth="4" strokeLinecap="round" fill="none" />
                </g>
              )}

              {/* Accessories on Adult Head. Hat @ cx=100 cy=44, Glasses @ cx=100 cy=74 */}
              {renderAccessory(activeAccessory, 100, 42, 100, 73, 1.0)}
            </g>

            {/* ADULT ARMS */}
            {species === 'T-Rex' && (
              <g id="trex-tiny-arms">
                {/* Super short funny arms */}
                <path d="M74 122 H64" stroke={darkColor} strokeWidth="5" strokeLinecap="round" />
                <path d="M126 122 H136" stroke={darkColor} strokeWidth="5" strokeLinecap="round" />
              </g>
            )}

            {species !== 'T-Rex' && (
              <g id="normal-adult-arms">
                <path d="M68 128 Q56 132 64 148" stroke={darkColor} strokeWidth="5.5" strokeLinecap="round" fill="none" />
                <path d="M132 128 Q144 132 136 148" stroke={darkColor} strokeWidth="5.5" strokeLinecap="round" fill="none" />
              </g>
            )}

            {/* ADULT FEET */}
            <rect x="70" y="161" width="16" height="12" rx="4" fill={darkColor} />
            <rect x="114" y="161" width="16" height="12" rx="4" fill={darkColor} />
          </g>
        )}
      </svg>
    </div>
  );
};

// Sub-renderer for hats / glasses accessories using direct SVG vectors
const renderAccessory = (
  id: string | null,
  hatX: number,
  hatY: number,
  glassX: number,
  glassY: number,
  scale: number
) => {
  if (!id) return null;

  return (
    <g style={{ transform: `scale(${scale})`, transformOrigin: `${id.includes('glasses') || id === 'sunglasses' ? `${glassX}px ${glassY}px` : `${hatX}px ${hatY}px`}` }}>
      {/* 🏴‍☠️ Pirate Hat */}
      {id === 'pirate_hat' && (
        <g transform={`translate(${hatX - 35}, ${hatY - 22})`}>
          {/* Base shape */}
          <path d="M5 20 Q35 0 65 20 C50 16 20 16 5 20 Z" fill="#1e293b" stroke="#000" strokeWidth="2" />
          <path d="M20 16 C30 -4 40 -4 50 16 Z" fill="#1e293b" stroke="#000" strokeWidth="2" />
          {/* Gold trim */}
          <path d="M5 20 Q35 0 65 20" stroke="#facc15" strokeWidth="1.5" fill="none" />
          {/* White skull */}
          <circle cx="35" cy="11" r="3.5" fill="#ffffff" />
          <path d="M33 13 L37 13 L35 15 Z" fill="#ffffff" />
          <line x1="31" y1="9" x2="39" y2="15" stroke="#ffffff" strokeWidth="1" />
          <line x1="39" y1="9" x2="31" y2="15" stroke="#ffffff" strokeWidth="1" />
        </g>
      )}

      {/* 👑 Royal Crown */}
      {id === 'crown' && (
        <g transform={`translate(${hatX - 25}, ${hatY - 24})`}>
          {/* Golden peaks */}
          <path d="M3 20 L8 5 L20 12 L25 3 L30 12 L42 5 L47 20 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
          {/* Ruby jewels */}
          <circle cx="8" cy="5" r="2" fill="#ef4444" />
          <circle cx="25" cy="3" r="2.5" fill="#3b82f6" />
          <circle cx="42" cy="5" r="2" fill="#ef4444" />
          {/* Crown band */}
          <rect x="3" y="18" width="44" height="4" fill="#d97706" />
          <circle cx="15" cy="20" r="1.5" fill="#10b981" />
          <circle cx="25" cy="20" r="1.5" fill="#ef4444" />
          <circle cx="35" cy="20" r="1.5" fill="#3b82f6" />
        </g>
      )}

      {/* 👨‍🍳 Chef Hat */}
      {id === 'chef_hat' && (
        <g transform={`translate(${hatX - 20}, ${hatY - 28})`}>
          <path d="M5 25 Q0 12 10 10 Q20 2 30 10 Q40 12 35 25 Z" fill="#ffffff" stroke="#475569" strokeWidth="2" />
          <rect x="8" y="20" width="24" height="6" fill="#f1f5f9" stroke="#475569" strokeWidth="2" />
        </g>
      )}

      {/* 🎀 Red Ribbon Hair Bow */}
      {id === 'cute_bow' && (
        <g transform={`translate(${hatX - 18}, ${hatY - 14})`}>
          {/* Two loop wings */}
          <path d="M2 12 C-2 3 8 0 14 10 Z" fill="#ef4444" stroke="#991b1b" strokeWidth="2" />
          <path d="M34 12 C38 3 28 0 22 10 Z" fill="#ef4444" stroke="#991b1b" strokeWidth="2" />
          {/* Center Knot */}
          <circle cx="18" cy="11" r="4.5" fill="#b91c1c" stroke="#991b1b" strokeWidth="2" />
          {/* Ribbon tails */}
          <path d="M12 12 L4 22 L14 18 Z" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
          <path d="M24 12 L32 22 L22 18 Z" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
        </g>
      )}

      {/* 😎 Cool Sunglasses */}
      {id === 'sunglasses' && (
        <g transform={`translate(${glassX - 35}, ${glassY - 8})`}>
          {/* Left lens */}
          <path d="M5 5 H28 L24 15 H9 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
          {/* Right lens */}
          <path d="M36 5 H59 L55 15 H40 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
          {/* Reflections */}
          <line x1="8" y1="7" x2="18" y2="7" stroke="#ffffff" strokeValue="1.5" opacity="0.6" strokeLinecap="round" />
          <line x1="39" y1="7" x2="49" y2="7" stroke="#ffffff" strokeValue="1.5" opacity="0.6" strokeLinecap="round" />
          {/* Bridge */}
          <line x1="28" y1="7" x2="36" y2="7" stroke="#0f172a" strokeWidth="3" />
        </g>
      )}

      {/* 🕶️ Pixel Glasses */}
      {id === 'pixel_glasses' && (
        <g transform={`translate(${glassX - 35}, ${glassY - 8})`}>
          {/* Left Block lens */}
          <rect x="4" y="5" width="22" height="10" fill="#000" />
          <rect x="2" y="3" width="26" height="2" fill="#000" />
          {/* Right Block lens */}
          <rect x="34" y="5" width="22" height="10" fill="#000" />
          <rect x="32" y="3" width="26" height="2" fill="#000" />
          {/* Pixel Reflections */}
          <rect x="6" y="7" width="4" height="4" fill="#ffffff" />
          <rect x="36" y="7" width="4" height="4" fill="#ffffff" />
          {/* Bridge block */}
          <rect x="24" y="7" width="12" height="3" fill="#000" />
        </g>
      )}
    </g>
  );
};
