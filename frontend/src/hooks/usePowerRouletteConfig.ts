import { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface PowerRoulettePrize {
  id: number;
  name: string;
  chance: number;
  value: string;
  color: string;
  icon: string;
}

export interface PowerRouletteLootRule {
  amount: number;
  spins: number;
}

export interface PowerRouletteConfig {
  prizes: PowerRoulettePrize[];
  lootRules: PowerRouletteLootRule[];
  donationRule: {
    amount: number;
    spins: number;
    enabled?: boolean;
  };
}

export const defaultPowerRouletteConfig: PowerRouletteConfig = {
  prizes: [
    { id: 1, name: 'Normal (100k)', chance: 49, value: '100k', color: 'text-amber-500', icon: '💰' },
    { id: 2, name: 'Rara (250k)', chance: 25, value: '250k', color: 'text-emerald-500', icon: '💵' },
    { id: 3, name: 'Épica (500k)', chance: 15, value: '500k', color: 'text-blue-500', icon: '💎' },
    { id: 4, name: 'Lendária (1M)', chance: 10, value: '1M', color: 'text-purple-500', icon: '👑' },
    { id: 5, name: 'Mítica (2.5M)', chance: 1, value: '2.5M', color: 'text-red-500', icon: '🔥' },
  ],
  lootRules: [
    { amount: 1000, spins: 1 },
    { amount: 5000, spins: 5 },
    { amount: 10000, spins: 15 },
  ],
  donationRule: {
    amount: 1, // $1
    spins: 2,
    enabled: true,
  },
};

export function usePowerRouletteConfig() {
  const [config, setConfig] = useState<PowerRouletteConfig>(defaultPowerRouletteConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'power_casino'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as PowerRouletteConfig;

        let loadedPrizes = data.prizes || defaultPowerRouletteConfig.prizes;
        if (loadedPrizes.length > 0 && loadedPrizes[0].chance === 50 && loadedPrizes[0].name.includes('100k')) {
            loadedPrizes = defaultPowerRouletteConfig.prizes; // Auto-update to new 49% default
            setDoc(doc(db, 'config', 'power_casino'), { ...data, prizes: loadedPrizes }, { merge: true });
        }

        setConfig({
          prizes: loadedPrizes,
          lootRules: data.lootRules || defaultPowerRouletteConfig.lootRules,
          donationRule: data.donationRule || defaultPowerRouletteConfig.donationRule,
        });
      }
      setLoading(false);
    }, (err) => {
      console.error("Failed to load power_casino config", err);
      // fallback to default
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const updateConfig = async (newConfig: PowerRouletteConfig) => {
    try {
      await setDoc(doc(db, 'config', 'power_casino'), newConfig);
    } catch (e) {
      console.error("Failed to save power_casino config", e);
      throw e;
    }
  };

  return { config, updateConfig, loading };
}
