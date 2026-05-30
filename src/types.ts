export type DinoSpecies = 'T-Rex' | 'Triceratops' | 'Pterodactyl' | 'Secret Dragon';

export type EvolutionStage = 'Egg' | 'Baby' | 'Teen' | 'Adult';

export interface DinoState {
  name: string;
  color: string; // hex code or tailwind color class name
  stage: EvolutionStage;
  species: DinoSpecies | null;
  age: number; // in 'Dino Days'
  health: number; // 0-100
  hunger: number; // 0-100 (100 = full, 0 = starving)
  happiness: number; // 0-100 (100 = ecstatic, 0 = depressed)
  hygiene: number; // 0-100 (100 = spotless, 0 = filthy)
  energy: number; // 0-100 (100 = awake/energized, 0 = exhausting/tired)
  isSleeping: boolean;
  isSick: boolean;
  bornAt: number; // timestamp
  lastTickAt: number; // timestamp
  eggTaps: number; // number of taps to hatch
  poops: PoopInstance[];
  coins: number;
  accessories: string[]; // unlocked accessory IDs
  activeAccessory: string | null; // currently worn hat/glasses
  careXP?: number; // 0 - 100 evolution growth progress
  steakCount?: number; // track meat diet
  vegCount?: number; // track green diet
}

export interface PoopInstance {
  id: string;
  x: number; // percentage width of scene (10-90)
  y: number; // percentage height of scene (65-80)
}

export interface FoodItem {
  id: string;
  name: string;
  emoji: string;
  hungerBoost: number;
  happinessBoost: number;
  hygieneImpact: number;
  energyImpact: number;
  cost: number;
}

export interface AccessoryItem {
  id: string;
  name: string;
  category: 'hat' | 'glasses';
  cost: number;
  emoji: string;
}

export const FOOD_ITEMS: FoodItem[] = [
  { id: 'steak', name: 'Juicy Steak', emoji: '🥩', hungerBoost: 30, happinessBoost: 5, hygieneImpact: -15, energyImpact: 10, cost: 0 },
  { id: 'broccoli', name: 'Fresh Broccoli', emoji: '🥦', hungerBoost: 15, happinessBoost: -5, hygieneImpact: 10, energyImpact: 5, cost: 0 },
  { id: 'cupcake', name: 'Sweet Cupcake', emoji: '🧁', hungerBoost: 20, happinessBoost: 25, hygieneImpact: -10, energyImpact: -5, cost: 8 },
  { id: 'potion', name: 'Super Vitamin', emoji: '🧪', hungerBoost: 10, happinessBoost: 10, hygieneImpact: 5, energyImpact: 20, cost: 15 },
  { id: 'golden_meat', name: 'Golden Cutlet', emoji: '🍖', hungerBoost: 50, happinessBoost: 35, hygieneImpact: 25, energyImpact: 30, cost: 30 },
];

export const SHOP_ACCESSORIES: AccessoryItem[] = [
  { id: 'pirate_hat', name: 'Pirate Hat', category: 'hat', cost: 40, emoji: '🏴‍☠️' },
  { id: 'crown', name: 'Royal Crown', category: 'hat', cost: 100, emoji: '👑' },
  { id: 'chef_hat', name: 'Chef Hat', category: 'hat', cost: 25, emoji: '👨‍🍳' },
  { id: 'sunglasses', name: 'Cool Sunglasses', category: 'glasses', cost: 35, emoji: '😎' },
  { id: 'pixel_glasses', name: 'Deal With Glasses', category: 'glasses', cost: 60, emoji: '🕶️' },
  { id: 'cute_bow', name: 'Red Hair Bow', category: 'hat', cost: 20, emoji: '🎀' },
];
