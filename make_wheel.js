const fs = require('fs');
let text = fs.readFileSync('frontend/src/components/pages/PowerRoleta.tsx', 'utf-8');

// 1. Imports
if (!text.includes('react-custom-roulette')) {
    text = text.replace(/import \{ Gift \} from 'lucide-react';/, "import { Gift } from 'lucide-react';\nimport { Wheel } from 'react-custom-roulette';");
}

// 2. State
text = text.replace("const [slots, setSlots] = useState(['❓', '❓', '❓']);", "const [mustSpin, setMustSpin] = useState(false);\n  const [prizeNumber, setPrizeNumber] = useState(0);");

// 3. girar logic
const original_girar = `  const girar = useCallback(async () => {
    if (spinning || girosDisponiveis <= 0 || !profile?.userId) return;
    setSpinning(true);
    setResult(null);
    setSlots(['🎰', '🎰', '🎰']);

    // Weighted Random Selection
    const rand = Math.random() * 100;
    let accumulated = 0;
    let selected = config.prizes[0];
    
    for (const p of config.prizes) {
        accumulated += p.chance;
        if (rand <= accumulated) {
            selected = p;
            break;
        }
    }

    // Animation 3s
    const interval = setInterval(() => {
        setSlots([
            config.prizes[Math.floor(Math.random() * config.prizes.length)].icon,
            config.prizes[Math.floor(Math.random() * config.prizes.length)].icon,
            config.prizes[Math.floor(Math.random() * config.prizes.length)].icon
        ]);
    }, 100);

    await new Promise(r => setTimeout(r, 3000));
    clearInterval(interval);
    
    // Set final slots to winner icon
    setSlots([selected.icon, selected.icon, selected.icon]);

    // Save to Firestore
    try {
      await addDoc(collection(db, 'power_roletas'), {
        userId: profile.userId,
        premio: selected.name,
        data: Timestamp.now(),
        entregue: false,
      });

      // Se usou um giro extra (porque não tinha mais semanais ou não era qualificado), debitar
      const hasWeeklyAvailable = weeklyTotal > girosUsados;
      if (!hasWeeklyAvailable && extraSpins > 0) {
        await updateDoc(doc(db, 'usuarios', profile.userId), {
            extraSpins: increment(-1)
        });
      }

    } catch (err) {
      console.error('Erro ao salvar:', err);
    }
    
    setResult(selected);
    setGirosUsados(prev => prev + 1);
    await refreshProfile();
    setSpinning(false);
  }, [spinning, girosDisponiveis, profile, refreshProfile, config.prizes, girosUsados, extraSpins, weeklyTotal]);`;

const new_girar = `  const girar = useCallback(async () => {
    if (spinning || girosDisponiveis <= 0 || !profile?.userId) return;
    setSpinning(true);
    setResult(null);

    // Weighted Random Selection
    const rand = Math.random() * 100;
    let accumulated = 0;
    let selected = config.prizes[0];
    
    for (const p of config.prizes) {
        accumulated += p.chance;
        if (rand <= accumulated) {
            selected = p;
            break;
        }
    }

    const prizeIndex = config.prizes.findIndex(p => p.id === selected.id);
    setPrizeNumber(prizeIndex);
    setMustSpin(true);

  }, [spinning, girosDisponiveis, profile, config.prizes]);`;

text = text.replace(original_girar, new_girar);

// 4. JSX replace
const original_jsx = `            {/* Machine Display */}
            <div className="flex gap-2 sm:gap-6 p-6 sm:p-8 bg-black rounded-lg border-4 border-red-900/40 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative z-10 w-full max-w-2xl justify-center">
                {/* Decorative Lights */}
                <div className="absolute -top-3 left-10 w-3 h-3 rounded-full bg-red-600 shadow-[0_0_10px_red] animate-pulse"></div>
                <div className="absolute -top-3 right-10 w-3 h-3 rounded-full bg-red-600 shadow-[0_0_10px_red] animate-pulse delay-75"></div>

                {slots.map((s, i) => (
                    <div key={i} className="w-24 h-32 sm:w-32 sm:h-40 flex items-center justify-center bg-gradient-to-b from-stone-200 to-stone-400 rounded-sm border-4 border-stone-800 text-6xl shadow-inner overflow-hidden relative">
                         <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                        <span className={cn("transform transition-all drop-shadow-md", spinning && "animate-bounce blur-sm")}>{s}</span>
                    </div>
                ))}
            </div>`;

const new_jsx = `{/* Wheel Display */}
            <div className="flex flex-col items-center justify-center my-8 z-10 w-full overflow-hidden max-w-sm sm:max-w-md mx-auto pointer-events-none">
                <Wheel
                  mustStartSpinning={mustSpin}
                  prizeNumber={prizeNumber}
                  data={config.prizes.map((p, i) => ({ 
                      option: p.name.substring(0, 10),
                      style: { backgroundColor: i % 2 === 0 ? '#1f1c1c' : '#2a2626', textColor: p.color ? (p.color.includes('amber')?'#f59e0b':p.color.includes('emerald')?'#10b981':p.color.includes('blue')?'#3b82f6':p.color.includes('purple')?'#a855f7':p.color.includes('red')?'#ef4444':'#ffffff') : '#ffffff' }
                  }))}
                  backgroundColors={['#1f1c1c', '#2a2626']}
                  textColors={['#ffffff']}
                  outerBorderColor="#dc2626"
                  outerBorderWidth={6}
                  innerBorderColor="#1f2937"
                  innerBorderWidth={15}
                  innerRadius={10}
                  radiusLineColor="#3f3f46"
                  radiusLineWidth={2}
                  onStopSpinning={async () => {
                    setMustSpin(false);
                    const selected = config.prizes[prizeNumber];
                    
                    try {
                      await addDoc(collection(db, 'power_roletas'), {
                        userId: profile?.userId,
                        premio: selected.name,
                        data: Timestamp.now(),
                        entregue: false,
                      });

                      const hasWeeklyAvailable = weeklyTotal > girosUsados;
                      if (!hasWeeklyAvailable && extraSpins > 0) {
                        await updateDoc(doc(db, 'usuarios', profile?.userId), {
                            extraSpins: increment(-1)
                        });
                      }
                    } catch (err) {
                      console.error('Erro ao salvar:', err);
                    }
                    
                    setResult(selected);
                    setGirosUsados(prev => prev + 1);
                    await refreshProfile?.();
                    setSpinning(false);
                  }}
                />
            </div>`;

text = text.replace(original_jsx, new_jsx);

// 5. Titles
text = text.replace('<span className="text-red-600">Blood</span> Slots', '<span className="text-purple-600">Power</span> Roleta');
text = text.replace('className="p-3 bg-red-900/20 rounded-lg text-red-500 border border-red-900/30 shadow-[0_0_15px_rgba(220,38,38,0.2)]"', 'className="p-3 bg-purple-900/20 rounded-lg text-purple-500 border border-purple-900/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]"');

fs.writeFileSync('frontend/src/components/pages/PowerRoleta.tsx', text, 'utf-8');
console.log('REWRITE SUCCESS');